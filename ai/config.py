import os
import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class AppConfig:
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"

class FaceConfig:
    MODEL_NAME = "dima806/facial_emotions_image_detection"
    
    MTCNN_MIN_FACE_SIZE = 20
    MTCNN_THRESHOLDS = [0.6, 0.7, 0.7]
    FACE_PADDING_RATIO = 0.15
    
    CLAHE_CLIP_LIMIT = 2.0
    CLAHE_TILE_GRID = (8, 8)
    
    SMILE_THRESH = 0.008
    FROWN_THRESH = -0.003
    BROW_LOWERING_THRESH = 0.008
    GEOMETRY_ALPHA = 0.45
    
    EMOTION_MAP = {
        "angry":   ("Angry",   1.0),
        "disgust": ("Angry",   0.8),
        "fear":    ("Sad",     1.3),
        "happy":   ("Happy",   1.0),
        "neutral": ("Neutral", 0.6),
        "sad":     ("Sad",     1.0),
        "surprise":("Happy",   0.6),
    }

class VoiceConfig:
    MODEL_PATH = BASE_DIR / "Models" / "ser_output" / "final_model"
    
    SAMPLE_RATE = 16000
    MAX_DURATION = 6.0
    SILENCE_THRESHOLD = 0.001

    VOICE_WEIGHTS = {
        "Angry": 0.60,  
        "Happy": 1.40,
        "Sad": 0.80,
        "Neutral": 0.60
    }