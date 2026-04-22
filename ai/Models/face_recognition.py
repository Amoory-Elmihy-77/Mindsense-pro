import torch
import io
import logging
from PIL import Image
from transformers import pipeline
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class EmotionScores(BaseModel):
    Angry: float
    Sad: float
    Happy: float
    Neutral: float

class FaceAnalysisResult(BaseModel):
    status: str
    mental_state: str = "Neutral"
    emotion_breakdown: EmotionScores = None
    message: str = None

class FaceEmotionAnalyzer:
    def __init__(self, model_name: str = "trpakov/vit-face-expression"):
        self.device = 0 if torch.cuda.is_available() else -1
        logger.info(f"🔄 Loading Face Model on {'GPU' if self.device == 0 else 'CPU'}...")

        try:
            self.emotion_classifier = pipeline(
                task="image-classification",
                model=model_name,
                device=self.device,
                use_fast=True
            )
            logger.info("✅ Face Model Loaded Successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise e

    def _map_emotions(self, results: list) -> dict:
        scores = {item["label"].lower(): item["score"] for item in results}

        if not scores:
            raise ValueError("No emotions detected from model output")

        anger_score = scores.get("angry", 0) + scores.get("fear", 0)
        sadness_score = scores.get("sad", 0) + scores.get("disgust", 0)
        happy_score = scores.get("happy", 0) + scores.get("surprise", 0)
        neutral_score = scores.get("neutral", 0)

        final_scores = {
            "Angry": anger_score,
            "Sad": sadness_score,
            "Happy": happy_score,
            "Neutral": neutral_score,
        }

        total = sum(final_scores.values()) + 1e-6
        final_scores = {k: round(v / total, 3) for k, v in final_scores.items()}

        dominant_state = max(final_scores, key=final_scores.get)

        return {
            "dominant_state": dominant_state,
            "scores": final_scores,
        }

    def _load_image(self, image_input):
        if isinstance(image_input, bytes):
            image = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            image = image_input
        elif isinstance(image_input, str):
            image = Image.open(image_input)
        else:
            raise ValueError("Unsupported image format.")

        if image.mode != "RGB":
            image = image.convert("RGB")

        return image

    def analyze(self, image_input) -> FaceAnalysisResult:
        try:
            logger.info("🔹 Starting face analysis...")
            image = self._load_image(image_input)
            results = self.emotion_classifier(image, top_k=5)
            mapped = self._map_emotions(results)

            return FaceAnalysisResult(
                status="success",
                mental_state=mapped["dominant_state"],
                emotion_breakdown=EmotionScores(**mapped["scores"]),
            )

        except Exception as e:
            logger.error(f"❌ Analysis failed: {str(e)}")
            return FaceAnalysisResult(
                status="error",
                message=str(e)
            )

face_analyzer = FaceEmotionAnalyzer()

def analyze_face_stream(image_input):
    result = face_analyzer.analyze(image_input).model_dump(exclude_none=True)

    if result.get("status") == "error":
        return {
            "status": "error",
            "message": result.get("message")
        }

    return {
        "status": "success",
        "state": result["mental_state"],
        "scores": result["emotion_breakdown"]
    }
