import json
import os
from dataclasses import dataclass

from groq import Groq

from .language_utils import (
    normalize_preferred_setting,
    preferred_to_response_language,
    preferred_to_whisper_language,
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CONFIDENCE_THRESHOLD = 0.85

CLARIFICATION_PROMPT_AR = "نكمل بالمصري ولا الإنجليزي؟"
CLARIFICATION_PROMPT_EN = "Should we continue in Egyptian Arabic or English?"


@dataclass
class LanguageDetectionResult:
    raw_text: str
    normalized_text: str
    language: str  # egyptian | msa | english | mixed | unknown
    confidence: float
    needs_clarification: bool

    def to_dict(self) -> dict:
        return {
            "raw_text": self.raw_text,
            "normalized_text": self.normalized_text,
            "language": self.language,
            "confidence": self.confidence,
            "needs_clarification": self.needs_clarification,
        }


def _empty_result(raw_text: str = "") -> LanguageDetectionResult:
    return LanguageDetectionResult(
        raw_text=raw_text,
        normalized_text=raw_text,
        language="unknown",
        confidence=0.0,
        needs_clarification=False,
    )


def _normalize_egyptian_text(raw: str) -> str:
    """Light spelling normalization for Arabic transcripts only."""
    text = (raw or "").strip()
    if not text:
        return text

    prompt = f"""Normalize Egyptian Arabic spelling in this transcript. Keep meaning identical.
Use natural Egyptian dialect spelling (e.g. عامل ايه -> عامل إيه). Do not translate to English.

Transcript:
\"\"\"{text}\"\"\"

Return JSON only: {{ "normalized_text": "..." }}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=300,
        )
        data = json.loads(completion.choices[0].message.content)
        return str(data.get("normalized_text", text)).strip() or text
    except Exception as e:
        print(f"Normalization error: {e}")
        return text


def detect_language(raw_transcript: str) -> LanguageDetectionResult:
    """Full detect + normalize (used when auto_detect is enabled)."""
    text = (raw_transcript or "").strip()
    if not text:
        return _empty_result()

    prompt = f"""Analyze this voice transcript from a mental-health companion app.

Transcript:
\"\"\"{text}\"\"\"

Tasks:
1. Normalize Egyptian Arabic spelling (e.g. عامل ايه -> عامل إيه). Keep English as-is.
2. Classify language as exactly one of: egyptian, msa, english, mixed
3. Provide confidence 0.0-1.0 for the classification.

Return JSON only:
{{
  "normalized_text": "...",
  "language": "egyptian|msa|english|mixed",
  "confidence": 0.95
}}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=300,
        )
        data = json.loads(completion.choices[0].message.content)
        language = str(data.get("language", "unknown")).lower()
        confidence = float(data.get("confidence", 0.0))
        normalized = str(data.get("normalized_text", text)).strip() or text

        if language not in ("egyptian", "msa", "english", "mixed"):
            language = "unknown"

        needs_clarification = confidence < CONFIDENCE_THRESHOLD and bool(normalized)

        return LanguageDetectionResult(
            raw_text=text,
            normalized_text=normalized,
            language=language,
            confidence=confidence,
            needs_clarification=needs_clarification,
        )
    except Exception as e:
        print(f"Language detection error: {e}")
        return LanguageDetectionResult(
            raw_text=text,
            normalized_text=text,
            language="unknown",
            confidence=0.5,
            needs_clarification=False,
        )


def process_transcript(
    raw_transcript: str,
    preferred_language: str,
    auto_detect: bool,
) -> LanguageDetectionResult:
    """
    When auto_detect is False, lock to preferred language (no mirroring, no clarification).
    When auto_detect is True, detect and optionally ask for clarification.
    """
    text = (raw_transcript or "").strip()
    if not text:
        return _empty_result()

    preferred_language = normalize_preferred_setting(preferred_language)

    if not auto_detect:
        locked = preferred_to_response_language(preferred_language)
        detected = "english" if locked == "english" else "egyptian"
        normalized = text if locked == "english" else _normalize_egyptian_text(text)
        return LanguageDetectionResult(
            raw_text=text,
            normalized_text=normalized,
            language=detected,
            confidence=1.0,
            needs_clarification=False,
        )

    return detect_language(text)


def resolve_response_language(
    detection: LanguageDetectionResult,
    preferred_language: str,
    auto_detect: bool,
) -> str:
    """
    Resolve effective TTS/LLM language: 'arabic' | 'english' | 'mixed'.
    When auto_detect is off, always use the user's chosen language.
    """
    base = preferred_to_response_language(normalize_preferred_setting(preferred_language))

    if not auto_detect:
        return base

    if not detection.normalized_text:
        return base

    detected = detection.language
    if detected == "english":
        return "english"
    if detected == "mixed":
        return "mixed"
    if detected in ("egyptian", "msa"):
        return "arabic"
    return base


def get_clarification_response(preferred_language: str) -> str:
    if preferred_to_response_language(preferred_language) == "english":
        return CLARIFICATION_PROMPT_EN
    return CLARIFICATION_PROMPT_AR
