import io
import torch
import logging
import numpy as np
import librosa
from pathlib import Path
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
from pydantic import BaseModel
from config import VoiceConfig, AppConfig

# ==============================================================
# Logging Setup
# ==============================================================
logging.basicConfig(level=AppConfig.LOG_LEVEL, format=AppConfig.LOG_FORMAT)
logger = logging.getLogger(__name__)

# ==============================================================
# Pydantic Data Models
# ==============================================================
class EmotionScores(BaseModel):
    Angry: float
    Sad: float
    Happy: float
    Neutral: float

class VoiceAnalysisResult(BaseModel):
    status: str
    mental_state: str = "Neutral"
    emotion_breakdown: EmotionScores = None
    message: str = None
    voice_detected: bool = True

# ==============================================================
# Main Analyzer Class
# ==============================================================
class VoiceEmotionAnalyzer:
    DEFAULT_MODEL_PATH = VoiceConfig.MODEL_PATH

    def __init__(self, model_path: Path = DEFAULT_MODEL_PATH):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = VoiceConfig.SAMPLE_RATE
        self.max_duration = VoiceConfig.MAX_DURATION
        self.max_length = int(self.sample_rate * self.max_duration)

        model_path_str = str(model_path)
        logger.info(f"🔄 Loading Local Voice Model on {self.device}...")

        if not Path(model_path_str).exists():
            raise FileNotFoundError(
                f"Model folder not found at: {model_path_str}\n"
                f"Make sure the path is correct and all model files are present."
            )

        try:
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_path_str)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_path_str).to(self.device)
            self.model.eval()
            logger.info(f"✅ Voice Model Loaded Successfully from: {model_path_str}")
        except Exception as e:
            logger.error(f"❌ Failed to load voice model: {e}")
            raise

    def _load_audio(self, audio_input) -> np.ndarray:
        try:
            if isinstance(audio_input, bytes):
                data, sr = librosa.load(io.BytesIO(audio_input), sr=self.sample_rate, mono=True)
            elif isinstance(audio_input, (str, Path)):
                data, sr = librosa.load(str(audio_input), sr=self.sample_rate, mono=True)
            elif isinstance(audio_input, np.ndarray):
                data = audio_input
            else:
                raise ValueError("Unsupported audio format. Use bytes, file path, or numpy array.")
            
            # قص الصمت من البداية والنهاية
            audio_trimmed, _ = librosa.effects.trim(data, top_db=30)
            
            # استخدام الصوت المقصوص إذا كانت مدته أكبر من نصف ثانية
            if len(audio_trimmed) > int(self.sample_rate * 0.5):
                data = audio_trimmed

            return data
        except Exception as e:
            raise ValueError(f"Error loading audio: {e}")

    def _preprocess_audio(self, audio: np.ndarray) -> np.ndarray:
        # 1. Normalization لمنع مشاكل الـ Clipping
        audio = audio / (np.max(np.abs(audio)) + 1e-8)

        # 2. قص الصوت لو تخطى الـ 6 ثواني (بدون إضافة Padding للصوت القصير)
        if len(audio) > self.max_length:
            audio = audio[:self.max_length]
            
        return audio.astype(np.float32)

    def analyze(self, audio_input) -> VoiceAnalysisResult:
        try:
            logger.info("🔹 Starting voice analysis...")
            raw_audio = self._load_audio(audio_input)

            # التحقق من وجود صمت تام
            if np.max(np.abs(raw_audio)) < VoiceConfig.SILENCE_THRESHOLD:
                logger.warning("⚠️ Silence detected — skipping analysis")
                return VoiceAnalysisResult(status="success", voice_detected=False)

            processed_audio = self._preprocess_audio(raw_audio)

            inputs = self.feature_extractor(
                processed_audio,
                sampling_rate=self.sample_rate,
                return_tensors="pt",
                padding=False,
            )
            input_values = inputs.input_values.to(self.device)

            with torch.no_grad():
                outputs = self.model(input_values)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()

            # تطبيق أوزان الثقة (Confidence Multipliers) من الكونفيج
            scores_dict = {}
            for i, prob in enumerate(probs):
                label = self.model.config.id2label[i].capitalize()
                adjusted_prob = float(prob) * VoiceConfig.VOICE_WEIGHTS.get(label, 1.0)
                scores_dict[label] = adjusted_prob

            # إعادة الحساب (Normalization) بعد التعديل
            total = sum(scores_dict.values()) + 1e-9
            scores_dict = {k: round(v / total, 4) for k, v in scores_dict.items()}

            final_state = max(scores_dict, key=scores_dict.get)

            logger.info(f"🧠 Voice Model scores: {scores_dict}")
            logger.info(f"✅ Final Voice result: {final_state}")

            return VoiceAnalysisResult(
                status="success",
                mental_state=final_state,
                emotion_breakdown=EmotionScores(**scores_dict),
                voice_detected=True,
            )

        except Exception as e:
            logger.error(f"❌ Voice Analysis failed: {str(e)}")
            return VoiceAnalysisResult(status="error", message=str(e))

# ==============================================================
# Module-level singleton (lazy initialization)
# ==============================================================
_voice_analyzer: VoiceEmotionAnalyzer | None = None

def _get_voice_analyzer() -> VoiceEmotionAnalyzer:
    global _voice_analyzer
    if _voice_analyzer is None:
        _voice_analyzer = VoiceEmotionAnalyzer()
    return _voice_analyzer

def analyze_voice_stream(audio_input) -> dict:
    """
    الدالة العامة التي يتم استدعاؤها من السيرفر.
    """
    result = _get_voice_analyzer().analyze(audio_input).model_dump(exclude_none=True)

    if result.get("status") == "error":
        return {"status": "error", "message": result.get("message")}

    return {
        "status": "success",
        "state": result["mental_state"],
        "scores": result.get("emotion_breakdown"),
        "voice_detected": result.get("voice_detected", True),
    }