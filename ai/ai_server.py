from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from Models.face_recognition import analyze_face_stream
from Models.online_Voice_model import analyze_voice_stream
from Rag.knowledge_base import get_intervention

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# 🔥 Fusion Engine (المخ بتاع السيستم)
# ==========================================================
def fuse_emotions(face_scores, voice_scores, voice_conf):
    # Dynamic weights حسب الثقة
    if voice_conf > 0.8:
        weights = {"face": 0.3, "voice": 0.7}
    elif voice_conf > 0.5:
        weights = {"face": 0.4, "voice": 0.6}
    else:
        weights = {"face": 0.6, "voice": 0.4}

    emotions = ["Happy", "Sad", "Angry", "Neutral"]
    final_scores = {}

    for emotion in emotions:
        f_score = face_scores.get(emotion, 0)
        v_score = voice_scores.get(emotion, 0)

        final_scores[emotion] = f_score * weights["face"] + v_score * weights["voice"]

    final_state = max(final_scores, key=final_scores.get)

    return final_state, final_scores, weights


# ==========================================================
# 1. Face Endpoint
# ==========================================================
@app.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = analyze_face_stream(image_bytes)

        return {"status": "success", "emotion": result}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================================
# 2. Voice Endpoint
# ==========================================================
@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        result = analyze_voice_stream(audio_bytes)

        return result

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================================
# 3. Advice Endpoint
# ==========================================================
@app.post("/get-advice")
async def get_advice(data: dict):
    try:
        mental_state = data.get("state", "Neutral").capitalize()

        advice = get_intervention(mental_state)

        return {"status": "success", "advice": advice}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================================
# 4. 🔥 Analyze All (Fusion + AI)
# ==========================================================
@app.post("/analyze-all")
async def analyze_all(face: UploadFile = File(...), voice: UploadFile = File(...)):
    try:
        # قراءة الملفات
        face_bytes = await face.read()
        voice_bytes = await voice.read()

        # تحليل
        face_response = analyze_face_stream(face_bytes)
        voice_result = analyze_voice_stream(voice_bytes)

        # استخراج السكورات
        face_scores = face_response.get("scores", {})
        voice_scores = voice_result.get("details", {})
        voice_conf = voice_result.get("confidence", 0)

        # 🔥 Fusion
        final_state, fused_scores, weights = fuse_emotions(
            face_scores, voice_scores, voice_conf
        )

        # 🧠 Conflict Detection (اختياري بس جامد)
        face_top = max(face_scores, key=face_scores.get) if face_scores else "Neutral"
        voice_top = voice_result.get("final_emotion", "Neutral")

        conflict = face_top != voice_top

        # 💡 النصيحة
        advice = get_intervention(final_state)

        return {
            "status": "success",
            "face": {"scores": face_scores, "dominant": face_top},
            "voice": {
                "scores": voice_scores,
                "final_emotion": voice_top,
                "confidence": voice_conf,
            },
            "fusion": {
                "final_state": final_state,
                "scores": fused_scores,
                "weights": weights,
                "conflict": conflict,
            },
            "advice": advice,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
