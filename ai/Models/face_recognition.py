import torch
import io
import logging
import numpy as np
import cv2
from PIL import Image
from transformers import pipeline
from pydantic import BaseModel

try:
    from facenet_pytorch import MTCNN
    MTCNN_AVAILABLE = True
except ImportError:
    MTCNN_AVAILABLE = False
    logging.warning("⚠️ facenet-pytorch not installed. Face alignment disabled. Run: pip install facenet-pytorch")

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
    _mp_face_mesh = mp.solutions.face_mesh
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logging.warning("⚠️ mediapipe not installed. Geometric correction disabled. Run: pip install mediapipe")

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
    face_detected: bool = True

class FaceEmotionAnalyzer:    # New model — trained on AffectNet + FER2013 combined, ~91% accuracy
    DEFAULT_MODEL = "dima806/facial_emotions_image_detection"

    EMOTION_MAP = {
        "angry":   ("Angry",   1.0),
        "disgust": ("Angry",   0.8),   # disgust ≈ anger
        "fear":    ("Sad",     1.3),   # fear is closer to sadness
        "happy":   ("Happy",   1.0),
        "neutral": ("Neutral", 0.6),
        "sad":     ("Sad",     1.0),
        "surprise":("Happy",   0.6),   # surprise leans happy (positive valence)
    }

    def __init__(self, model_name: str = DEFAULT_MODEL, use_tta: bool = True):
        self.device = 0 if torch.cuda.is_available() else -1
        self.use_tta = use_tta

        logger.info(f"🔄 Loading Face Model on {'GPU' if self.device == 0 else 'CPU'}...")
        try:
            self.emotion_classifier = pipeline(
                task="image-classification",
                model=model_name,
                device=self.device,
                use_fast=True,
            )
            logger.info(f"✅ Face Model Loaded: {model_name}")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise

        if MTCNN_AVAILABLE:
            mtcnn_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.mtcnn = MTCNN(
                keep_all=False,
                device=mtcnn_device,
                min_face_size=20,
                thresholds=[0.6, 0.7, 0.7],
                post_process=False,
            )
            logger.info("✅ MTCNN Face Detector Ready!")
        else:
            self.mtcnn = None

    def _load_image(self, image_input) -> Image.Image:
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

    def _detect_and_crop_face(self, image: Image.Image) -> tuple[Image.Image, bool]:
        if self.mtcnn is None:
            return image, True
        try:
            boxes, _ = self.mtcnn.detect(image)
            if boxes is not None and len(boxes) > 0:
                # Use the first (most prominent) face
                x1, y1, x2, y2 = [int(v) for v in boxes[0]]
                
                # Add 15% padding around the face
                w, h = x2 - x1, y2 - y1
                pad_x = int(w * 0.15)
                pad_y = int(h * 0.15)
                
                img_w, img_h = image.size
                x1 = max(0, x1 - pad_x)
                y1 = max(0, y1 - pad_y)
                x2 = min(img_w, x2 + pad_x)
                y2 = min(img_h, y2 + pad_y)
                
                cropped = image.crop((x1, y1, x2, y2))
                logger.info(f"✅ Face detected and cropped: ({x1},{y1})-({x2},{y2})")
                return cropped, True
            else:
                logger.warning("⚠️ No face detected by MTCNN — using full image")
                return image, False
        except Exception as e:
            logger.warning(f"⚠️ MTCNN failed: {e} — using full image")
            return image, False

    def _apply_clahe(self, image: Image.Image) -> Image.Image:
        try:
            img_array = np.array(image, dtype=np.uint8)
            # Convert RGB → LAB and apply CLAHE only on L (luminance) channel
            lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            return Image.fromarray(enhanced)
        except Exception as e:
            logger.warning(f"⚠️ CLAHE failed: {e} — using original image")
            return image

    def _validate_image(self, image: Image.Image) -> bool:
        w, h = image.size
        if w < 32 or h < 32:
            raise ValueError(f"Image too small ({w}×{h}). Minimum size is 32×32 pixels.")
        return True

    def _run_classifier(self, image: Image.Image) -> dict:
        results = self.emotion_classifier(image, top_k=10)
        return {item["label"].lower(): item["score"] for item in results}

    def _map_emotions(self, raw_scores: dict) -> dict:
        final_scores = {"Angry": 0.0, "Sad": 0.0, "Happy": 0.0, "Neutral": 0.0}
        
        for raw_label, raw_score in raw_scores.items():
            mapping = self.EMOTION_MAP.get(raw_label)
            if mapping:
                target_emotion, weight = mapping
                final_scores[target_emotion] += raw_score * weight

        total = sum(final_scores.values()) + 1e-9
        final_scores = {k: round(v / total, 4) for k, v in final_scores.items()}
        dominant_state = max(final_scores, key=final_scores.get)
        
        return {"dominant_state": dominant_state, "scores": final_scores}

    def _tta_analyze(self, image: Image.Image) -> dict:
        scores_original = self._run_classifier(image)
        
        flipped = image.transpose(Image.FLIP_LEFT_RIGHT)
        scores_flipped = self._run_classifier(flipped)
        
        # Average raw scores before mapping
        all_labels = set(scores_original) | set(scores_flipped)
        averaged = {
            label: (scores_original.get(label, 0) + scores_flipped.get(label, 0)) / 2
            for label in all_labels
        }
        return averaged

    def _geometric_correction(self, image: Image.Image, scores: dict) -> dict:
        if not MEDIAPIPE_AVAILABLE:
            return scores

        try:
            img_array = np.array(image, dtype=np.uint8)
            h, w = img_array.shape[:2]

            with _mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=False,
                min_detection_confidence=0.5,
            ) as face_mesh:
                results = face_mesh.process(img_array)

            if not results.multi_face_landmarks:
                logger.warning("⚠️ No MediaPipe landmarks — skipping geometric correction")
                return scores

            lm = results.multi_face_landmarks[0].landmark

            def pt(idx: int) -> np.ndarray:
                """Return (x, y) pixel coords for landmark index."""
                return np.array([lm[idx].x * w, lm[idx].y * h])

            # ── Reference: face height ───────────────────────────
            forehead = pt(10)   # forehead center
            chin     = pt(152)  # chin tip
            face_h   = max(abs(chin[1] - forehead[1]), 1.0)

            # ── 1. Lip Corner Smile Index ────────────────────────
            left_corner  = pt(61)
            right_corner = pt(291)
            upper_lip    = pt(13)
            lower_lip    = pt(14)

            corners_y   = (left_corner[1] + right_corner[1]) / 2
            lip_center_y = (upper_lip[1] + lower_lip[1]) / 2

            # Positive  → corners ABOVE center → SMILE
            # Negative  → corners BELOW center → FROWN
            smile_index = (lip_center_y - corners_y) / face_h

            # ── 2. Brow Lowering Index ───────────────────────────
            left_brow    = pt(105)   # left eyebrow center
            right_brow   = pt(334)   # right eyebrow center
            left_eye_top = pt(159)   # left eye upper-lid
            right_eye_top = pt(386)  # right eye upper-lid

            left_gap  = (left_eye_top[1]  - left_brow[1])  / face_h
            right_gap = (right_eye_top[1] - right_brow[1]) / face_h
            brow_gap  = (left_gap + right_gap) / 2

            # ~0.06-0.10 = relaxed/neutral, <0.04 = lowered brows (anger)
            brow_lowering = max(0.0, 0.07 - brow_gap)   # 0 = normal, >0 = lowered

            logger.info(
                f"📐 Geometry → smile_index={smile_index:.4f}, "
                f"brow_lowering={brow_lowering:.4f}"
            )

            # ── Build geometric score distribution ───────────────
            SMILE_THRESH = 0.008    
            FROWN_THRESH = -0.003   # 🔹 رفعنا الحساسية عشان يلقط الحزن الخفيف

            if smile_index > SMILE_THRESH:
                # ✅ Smile detected
                strength = min(smile_index / 0.05, 1.0)
                geo = {
                    "Happy":   0.60 + 0.20 * strength,
                    "Neutral": 0.20 - 0.05 * strength,
                    "Sad":     0.10 - 0.05 * strength,
                    "Angry":   0.10 - 0.05 * strength,
                }
            elif smile_index < FROWN_THRESH and brow_lowering > 0.008:
                # ✅ Frown + lowered brows → Angry
                frown_s = min(abs(smile_index) / 0.05, 1.0)
                brow_s  = min(brow_lowering / 0.03, 1.0)
                geo = {
                    "Angry":   0.55 + 0.20 * max(frown_s, brow_s),
                    "Sad":     0.30,
                    "Neutral": 0.10 - 0.05 * frown_s,
                    "Happy":   0.05 - 0.05 * frown_s,
                }
            elif smile_index < FROWN_THRESH:
                # ✅ Frown without lowered brows → Sad
                frown_s = min(abs(smile_index) / 0.04, 1.0)
                geo = {
                    "Sad":     0.85 + 0.35 * frown_s,  # وزن ضخم للحزن
                    "Neutral": 0.05 - 0.10 * frown_s,
                    "Angry":   0.10,
                    "Happy":   0.0,
                }
            else:
                # Near-neutral — geometric signal too weak, skip correction
                return scores

            # Normalize geo distribution
            geo_total = sum(geo.values()) + 1e-9
            geo = {k: v / geo_total for k, v in geo.items()}

            # ── Blend: 55% deep-learning model + 45% geometry ────
            ALPHA = 0.45  # 🔹 زيادة قوة التعديل الهندسي
            blended = {
                e: round((1 - ALPHA) * scores.get(e, 0.0) + ALPHA * geo.get(e, 0.0), 4)
                for e in ("Happy", "Sad", "Angry", "Neutral")
            }

            # Re-normalize
            b_total = sum(blended.values()) + 1e-9
            blended = {k: round(v / b_total, 4) for k, v in blended.items()}

            logger.info(f"📐 After geometric correction: {blended}")
            return blended

        except Exception as e:
            logger.warning(f"⚠️ Geometric correction failed: {e} — using raw scores")
            return scores

    def analyze(self, image_input) -> FaceAnalysisResult:
        try:
            logger.info("🔹 Starting face analysis...")
            image = self._load_image(image_input)
            self._validate_image(image)

            # Step 1: Detect & crop face
            image, face_detected = self._detect_and_crop_face(image)
            
            # Step 2: Save PRE-CLAHE image for landmark geometry
            # MediaPipe needs natural pixel values — CLAHE distorts them
            image_for_landmarks = image.copy()

            # Step 3: CLAHE contrast enhancement (for the ML classifier only)
            image_clahe = self._apply_clahe(image)

            # Step 4: Inference on CLAHE-enhanced image (with optional TTA)
            if self.use_tta:
                raw_scores = self._tta_analyze(image_clahe)
            else:
                raw_scores = self._run_classifier(image_clahe)

            # Step 5: Map to 4 target emotions
            mapped = self._map_emotions(raw_scores)
            logger.info(f"🧠 Model scores: {mapped['scores']}")

            # Step 6: Geometric landmark correction on the PRE-CLAHE image
            corrected_scores = self._geometric_correction(image_for_landmarks, mapped["scores"])
            
            final_state = max(corrected_scores, key=corrected_scores.get)
            logger.info(f"✅ Final result: {final_state} | scores: {corrected_scores}")

            return FaceAnalysisResult(
                status="success",
                mental_state=final_state,
                emotion_breakdown=EmotionScores(**corrected_scores),
                face_detected=face_detected,
            )

        except Exception as e:
            logger.error(f"❌ Analysis failed: {str(e)}")
            return FaceAnalysisResult(status="error", message=str(e))

# ==============================================================
# Module-level singleton (lazy initialization)
# ==============================================================
_face_analyzer: FaceEmotionAnalyzer | None = None

def _get_analyzer() -> FaceEmotionAnalyzer:
    global _face_analyzer
    if _face_analyzer is None:
        _face_analyzer = FaceEmotionAnalyzer()
    return _face_analyzer

def analyze_face_stream(image_input) -> dict:
    result = _get_analyzer().analyze(image_input).model_dump(exclude_none=True)
    
    if result.get("status") == "error":
        return {"status": "error", "message": result.get("message")}
        
    return {
        "status": "success",
        "state": result["mental_state"],
        "scores": result["emotion_breakdown"],
        "face_detected": result.get("face_detected", True),
    }