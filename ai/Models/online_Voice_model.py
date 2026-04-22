import torch
import torchaudio
import torch.nn.functional as F
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
import io
import numpy as np

# ==========================================================
# 1. إعدادات الموديل والجهاز (Configuration)
# ==========================================================

# تحديد الجهاز (GPU لو متاح، غير كده CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# اسم الموديل اللي بنستخدمه
MODEL_NAME = "superb/wav2vec2-base-superb-er"

print(f"🔄 Initializing Voice AI Engine on: {device}...")

# ==========================================================
# 2. تحميل الموديل مرة واحدة (Model Loading)
# ==========================================================
try:

    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(MODEL_NAME)
    model = Wav2Vec2ForSequenceClassification.from_pretrained(
        MODEL_NAME, use_safetensors=True
    )
    model.to(device)
    print("✅ Voice Model Loaded Successfully & Ready!")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Failed to load model. Details: {e}")

# ==========================================================
EMOTION_MAP = {"hap": "Happy", "sad": "Sad", "ang": "Angry", "neu": "Neutral"}


# ==========================================================
# 4. (The Core Function)
# ==========================================================
def analyze_voice_stream(audio_input):
    """
    Input:  مسار ملف (str) أو بيانات صوتية (bytes) جاية من الـ API.
    Output: قاموس (Dictionary) فيه النتيجة النهائية والنسب المئوية لكل شعور.
    """
    try:
        waveform = None
        sample_rate = None

        if isinstance(audio_input, bytes):
            # لو جاي من الـ API (Bytes)
            waveform, sample_rate = torchaudio.load(io.BytesIO(audio_input))
        elif isinstance(audio_input, str):
            # لو ملف محفوظ ع الجهاز
            waveform, sample_rate = torchaudio.load(audio_input)
        else:
            return {"error": "Invalid input format. Must be file path or bytes."}

        # ---(Preprocessing) ---

        # 1. توحيد التردد لـ 16000 هرتز
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(
                orig_freq=sample_rate, new_freq=16000
            )
            waveform = resampler(waveform)

        # 2. (Stereo to Mono) لو الصوت قناتين
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        # 3. تجهيز البيانات للموديل
        inputs = feature_extractor(
            waveform.squeeze().numpy(),
            sampling_rate=16000,
            return_tensors="pt",
            padding=True,
        )
        inputs = inputs.to(device)

        # --- (Inference) ---
        with torch.no_grad():
            logits = model(**inputs).logits

        # --- [د] حساب النسب المئوية (Probabilities) ---
        # بنستخدم Softmax عشان نحول الأرقام لنسب مجموعها 100%
        probs = F.softmax(logits, dim=-1)[0]

        # تجميع السكورات في قاموس نضيف
        scores_dict = {}
        for i, score in enumerate(probs):
            raw_label = model.config.id2label[i]  # الاسم الأصلي (hap)
            clean_label = EMOTION_MAP.get(raw_label, raw_label)  # الاسم النضيف (Happy)
            scores_dict[clean_label] = float(
                f"{score.item():.4f}"
            )  # تقريب لـ 4 أرقام عشرية

        # --- [هـ] تحديد النتيجة النهائية (Final Decision) ---
        # بنختار أعلى سكور
        final_raw_label = model.config.id2label[torch.argmax(logits, dim=-1).item()]
        final_result = EMOTION_MAP.get(final_raw_label, "Neutral")

        # استخراج نسبة الثقة في القرار ده
        confidence = scores_dict.get(final_result, 0.0)

        # --- [و] تجهيز الرد النهائي ---
        return {
            "status": "success",
            "final_emotion": final_result,  # النتيجة (مثلاً Happy)
            "confidence": confidence,  # نسبة الثقة (مثلاً 0.85)
            "details": scores_dict,  # كل النسب عشان لو حبيتوا تدمجوها مع الصور
        }

    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return {"status": "error", "message": str(e), "final_emotion": "Neutral"}


# ==========================================================
# 5. اختبار سريع للكود (Testing)
# ==========================================================
if __name__ == "__main__":
    import os
    import json

    # 1. حط مسار أو اسم ملف الصوت اللي عايز تجربه هنا
    test_audio_file = "test_audio.wav"

    print(f"\n🧪 Testing model with file: {test_audio_file} ...")

    # 2. نتأكد إن الملف موجود أصلاً عشان الكود ميضربش
    if os.path.exists(test_audio_file):

        # 3. نبعت الملف للدالة
        result = analyze_voice_stream(test_audio_file)

        # 4. نطبع النتيجة

        print("\n" + "=" * 50)
        print("🎉 THE AI DECISION:")
        print("=" * 50)
        # بنستخدم json.dumps عشان يطبع القاموس (Dictionary) بشكل مقروء
        print(json.dumps(result, indent=4, ensure_ascii=False))
        print("=" * 50 + "\n")

    else:
        print(f"⚠️ Error: File '{test_audio_file}' not found!")
        print("تأكد إنك حاطط الملف جنب الكود بنفس الاسم، أو اكتب المسار بتاعه كامل.")
