import os
from dataclasses import dataclass
import tempfile

from groq import Groq

from .language_detector import (
    LanguageDetectionResult,
    process_transcript,
    preferred_to_whisper_language,
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@dataclass
class TranscriptionResult:
    raw_text: str
    detection: LanguageDetectionResult

    @property
    def text(self) -> str:
        return self.detection.normalized_text or self.raw_text


def transcribe_audio_raw(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    preferred_language: str = "egyptian_arabic",
    auto_detect: bool = False,
) -> str:
    """Transcribe audio using Groq Whisper. Uses language hint when auto_detect is off."""
    if not audio_bytes:
        return ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        temp_file_path = temp_file.name

    try:
        create_kwargs = {
            "file": None,
            "model": "whisper-large-v3-turbo",
            "response_format": "json",
        }
        with open(temp_file_path, "rb") as file:
            create_kwargs["file"] = (filename, file.read())

        if not auto_detect:
            create_kwargs["language"] = preferred_to_whisper_language(preferred_language)

        transcription = client.audio.transcriptions.create(**create_kwargs)
        return transcription.text.strip()
    except Exception as e:
        print(f"STT Error: {e}")
        return ""
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def transcribe_audio(
    audio_bytes: bytes,
    preferred_language: str = "egyptian_arabic",
    auto_detect: bool = False,
    filename: str = "audio.wav",
) -> TranscriptionResult:
    """Transcribe audio and apply language processing based on user settings."""
    raw = transcribe_audio_raw(audio_bytes, filename, preferred_language, auto_detect)
    detection = process_transcript(raw, preferred_language, auto_detect)
    return TranscriptionResult(raw_text=raw, detection=detection)
