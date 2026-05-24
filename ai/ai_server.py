import numpy as np
import collections
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from Models import analyze_face_stream, analyze_voice_stream
from Rag.knowledge_base import get_intervention
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
app = FastAPI(
    title="Emotion Analysis API",
    description="Multimodal emotion recognition using face + voice fusion",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
EMOTIONS = ["Happy", "Sad", "Angry", "Neutral"]
# ==============================================================
# 🔥 Improved Fusion Engine — Entropy-Based Dynamic Weights
# ==============================================================
def _calc_entropy(scores_dict: dict) -> float:
    """
    Shannon entropy of an emotion score distribution.
    - Low entropy  → model is very confident (one emotion dominates)
    - High entropy → model is uncertain (scores spread across emotions)
    """
    scores = np.array([scores_dict.get(e, 0.0) for e in EMOTIONS], dtype=np.float64)
    scores = scores / (scores.sum() + 1e-9)
    return float(-np.sum(scores * np.log(scores + 1e-9)))
def _softmax_normalize(scores_dict: dict) -> dict:
    """Ensure scores are non-negative and sum to exactly 1.0."""
    values = np.array([scores_dict.get(e, 0.0) for e in EMOTIONS], dtype=np.float64)
    values = np.clip(values, 0, None)
    total = values.sum() + 1e-9
    normalized = values / total
    return {e: round(float(normalized[i]), 4) for i, e in enumerate(EMOTIONS)}
def fuse_emotions(
    face_scores: dict,
    voice_scores: dict,
    voice_conf: float,
) -> tuple[str, dict, dict]:
    """
    Entropy-Based Dynamic Fusion:
      1. Compute Shannon entropy for face and voice score distributions.
         Lower entropy → model is more confident → deserves higher weight.
      2. Convert entropy to a weight using:
             weight = (max_entropy - entropy) / max_entropy
         Then normalize both weights to sum to 1.
      3. Apply a confidence floor: if voice_conf < 0.4 the voice model
         is unreliable, so we cap its weight at 0.35.
      4. After weighted sum, re-normalize fused scores to sum to 1.0.
    """
    max_entropy = float(np.log(len(EMOTIONS)))  # ln(4) ≈ 1.386
    face_entropy  = _calc_entropy(face_scores)
    voice_entropy = _calc_entropy(voice_scores)
    # Confidence from entropy (0 = random, 1 = certain)
    face_conf_from_entropy  = (max_entropy - face_entropy)  / max_entropy
    voice_conf_from_entropy = (max_entropy - voice_entropy) / max_entropy
    # Blend entropy-based confidence with raw voice confidence
    # (raw confidence is a useful extra signal when available)
    voice_effective_conf = 0.7 * voice_conf_from_entropy + 0.3 * voice_conf
    total_conf = face_conf_from_entropy + voice_effective_conf + 1e-9
    face_weight  = face_conf_from_entropy / total_conf
    voice_weight = voice_effective_conf   / total_conf
    # Confidence floor: don't trust voice if it's below threshold
    if voice_conf < 0.4:
        face_weight  = max(face_weight,  0.65)
        voice_weight = 1.0 - face_weight
    # Weighted fusion
    fused_raw = {}
    for emotion in EMOTIONS:
        f = face_scores.get(emotion, 0.0)
        v = voice_scores.get(emotion, 0.0)
        fused_raw[emotion] = f * face_weight + v * voice_weight
    # Re-normalize fused scores
    fused_scores = _softmax_normalize(fused_raw)
    final_state  = max(fused_scores, key=fused_scores.get)
    weights = {
        "face":  round(face_weight, 3),
        "voice": round(voice_weight, 3),
    }
    logger.info(
        f"🔀 Fusion → {final_state} | "
        f"weights: face={weights['face']}, voice={weights['voice']} | "
        f"entropy: face={face_entropy:.3f}, voice={voice_entropy:.3f}"
    )
    return final_state, fused_scores, weights
# ==============================================================
# 1. Face Endpoint
# ==============================================================
@app.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            return {"status": "error", "message": "Empty file uploaded"}
        result = analyze_face_stream(image_bytes)
        return {"status": "success", "emotion": result}
    except Exception as e:
        logger.error(f"❌ /analyze-face error: {e}")
        return {"status": "error", "message": str(e)}
# ==============================================================
# 2. Voice Endpoint
# ==============================================================
@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            return {"status": "error", "message": "Empty file uploaded"}
        result = analyze_voice_stream(audio_bytes)
        return result
    except Exception as e:
        logger.error(f"❌ /analyze-voice error: {e}")
        return {"status": "error", "message": str(e)}
# ==============================================================
# 3. Advice Endpoint
# ==============================================================
@app.post("/get-advice")
async def get_advice(data: dict):
    try:
        mental_state = data.get("state", "Neutral").capitalize()
        advice = get_intervention(mental_state)
        return {"status": "success", "advice": advice}
    except Exception as e:
        logger.error(f"❌ /get-advice error: {e}")
        return {"status": "error", "message": str(e)}
# ==============================================================
# 4. 🔥 Analyze All — Fusion + AI Advice
# ==============================================================
@app.post("/analyze-all")
async def analyze_all(face: UploadFile = File(...), voice: UploadFile = File(...)):
    try:
        face_bytes  = await face.read()
        voice_bytes = await voice.read()
        if not face_bytes or not voice_bytes:
            return {"status": "error", "message": "One or both uploaded files are empty"}
        # Run both analyses
        face_response  = analyze_face_stream(face_bytes)
        voice_result   = analyze_voice_stream(voice_bytes)
        # Extract scores
        face_scores  = face_response.get("scores", {})
        voice_scores = voice_result.get("details", {})
        voice_conf   = voice_result.get("confidence", 0.0)
        # Validate we have usable scores
        if not face_scores:
            logger.warning("⚠️ No face scores — defaulting to even distribution")
            face_scores = {e: 0.25 for e in EMOTIONS}
        if not voice_scores:
            logger.warning("⚠️ No voice scores — defaulting to even distribution")
            voice_scores = {e: 0.25 for e in EMOTIONS}
        # 🔥 Entropy-based fusion
        final_state, fused_scores, weights = fuse_emotions(face_scores, voice_scores, voice_conf)
        # Dominant emotions for each modality
        face_top  = max(face_scores,  key=face_scores.get)  if face_scores  else "Neutral"
        voice_top = voice_result.get("final_emotion", "Neutral")
        conflict  = face_top != voice_top
        # 💡 AI advice
        advice = get_intervention(final_state)
        return {
            "status": "success",
            "face": {
                "scores":        face_scores,
                "dominant":      face_top,
                "face_detected": face_response.get("face_detected", True),
            },
            "voice": {
                "scores":        voice_scores,
                "final_emotion": voice_top,
                "confidence":    voice_conf,
            },
            "fusion": {
                "final_state": final_state,
                "scores":      fused_scores,
                "weights":     weights,
                "conflict":    conflict,
            },
            "advice": advice,
        }
    except Exception as e:
        logger.error(f"❌ /analyze-all error: {e}")
        return {"status": "error", "message": str(e)}
# ==============================================================
# 5. Behavioral Analytics Endpoint
# ==============================================================
class EmotionData(BaseModel):
    date: str
    emotion: str
    confidence: Optional[float] = 0.0
class TrendRequest(BaseModel):
    user_emotions: List[EmotionData]
    time_range: str = "week"
# Maps each emotion to a "positivity" score for trend analysis
EMOTION_VALENCE = {
    "Happy":   1.0,
    "Neutral": 0.0,
    "Calm":    0.2,
    "Sad":    -1.0,
    "Anxious":-0.8,
    "Angry":  -1.0,
}
@app.post("/analyze-trends")
async def analyze_trends(data: TrendRequest):
    try:
        emotions_data = data.user_emotions
        if not emotions_data:
            return {
                "dominant_emotion": "Neutral",
                "trend": "stable",
                "critical_days": [],
                "insights": ["Not enough data yet. Keep tracking your emotions!"],
                "prediction": "Neutral",
                "rolling_average": [],
            }
        # Count occurrences
        counts = collections.Counter([e.emotion.capitalize() for e in emotions_data])
        dominant_emotion = counts.most_common(1)[0][0]
        # Sort chronologically
        sorted_emotions = sorted(emotions_data, key=lambda x: x.date)
        # Valence scores for each entry
        scores = [EMOTION_VALENCE.get(e.emotion.capitalize(), 0) for e in sorted_emotions]
        # ── Rolling average (window=3) ─────────────────────────
        rolling_avg = []
        window = 3
        for i in range(len(scores)):
            start = max(0, i - window + 1)
            rolling_avg.append({
                "date": sorted_emotions[i].date,
                "avg_valence": round(sum(scores[start:i+1]) / (i - start + 1), 3),
            })
        # ── Trend detection ────────────────────────────────────
        if len(scores) >= 3:
            recent_avg = sum(scores[-3:]) / 3
            past_avg   = sum(scores[:-3]) / len(scores[:-3]) if len(scores) > 3 else 0
            delta = recent_avg - past_avg
            if delta < -0.2:
                trend = "declining"
            elif delta > 0.2:
                trend = "improving"
            else:
                trend = "stable"
        else:
            trend = "stable"
        # ── Critical days — sharp negative mood shifts ─────────
        critical_days = []
        for i in range(1, len(sorted_emotions)):
            prev_val = EMOTION_VALENCE.get(sorted_emotions[i - 1].emotion.capitalize(), 0)
            curr_val = EMOTION_VALENCE.get(sorted_emotions[i].emotion.capitalize(), 0)
            if prev_val > 0 and curr_val < 0:
                critical_days.append({
                    "date":  sorted_emotions[i].date,
                    "shift": f"From {sorted_emotions[i-1].emotion} to {sorted_emotions[i].emotion}",
                })
        # ── Insights ───────────────────────────────────────────
        insights = []
        if trend == "declining":
            insights.append(
                "Your mood has been trending downward recently. Consider taking a break or trying a breathing exercise."
            )
        elif trend == "improving":
            insights.append("Great job! Your mood is trending upward. Keep up whatever you are doing.")
        else:
            insights.append("Your mood has been relatively stable. Consistency is key for mental well-being.")
        if dominant_emotion in ["Sad", "Angry", "Anxious"]:
            insights.append(
                f"Your most common emotion is {dominant_emotion}. It might be helpful to explore the root cause."
            )
        else:
            insights.append(
                f"You've been feeling mostly {dominant_emotion}. Maintaining a balanced routine helps sustain this."
            )
        # Confidence note
        avg_conf = sum(e.confidence or 0 for e in emotions_data) / len(emotions_data)
        if avg_conf < 0.5:
            insights.append(
                "Some readings had low confidence. Try recording in a well-lit environment with clear audio for better accuracy."
            )
        # ── Prediction ─────────────────────────────────────────
        prediction_map = {
            "declining": "Slightly low — prioritize self-care tomorrow.",
            "improving": "Positive — ride the momentum!",
            "stable":    "Stable — a typical day ahead.",
        }
        prediction = prediction_map.get(trend, "Stable.")
        return {
            "dominant_emotion": dominant_emotion,
            "trend":            trend,
            "critical_days":    critical_days,
            "insights":         insights,
            "prediction":       prediction,
            "rolling_average":  rolling_avg,
        }
    except Exception as e:
        logger.error(f"❌ /analyze-trends error: {e}")
        return {"status": "error", "message": str(e)}
