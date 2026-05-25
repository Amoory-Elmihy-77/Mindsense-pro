from dataclasses import dataclass


@dataclass
class VoiceProfile:
    voice: str
    rate: str


VOICE_MAP = {
    ("arabic", "warm"): "ar-EG-SalmaNeural",
    ("arabic", "calm"): "ar-EG-ShakirNeural",
    ("english", "warm"): "en-US-JennyNeural",
    ("english", "calm"): "en-US-GuyNeural",
    ("mixed", "warm"): "ar-EG-SalmaNeural",
    ("mixed", "calm"): "ar-EG-ShakirNeural",
}

SAMPLE_TEXT = {
    "egyptian_arabic": "أهلًا، أنا هنا عشان أسمعك. تحب نحكي شوية؟",
    "english": "Hi, I'm here to listen. Want to chat for a bit?",
    "arabic": "أهلًا، أنا هنا عشان أسمعك. تحب نحكي شوية؟",
}


def speed_to_rate(speed: int) -> str:
    """Convert speed percentage (80-120) to edge-tts rate string."""
    speed = max(80, min(120, int(speed or 100)))
    delta = speed - 100
    if delta == 0:
        return "+0%"
    sign = "+" if delta > 0 else ""
    return f"{sign}{delta}%"


def language_key(effective_language: str, preferred_language: str) -> str:
    if effective_language == "mixed":
        return "mixed"
    if effective_language == "english":
        return "english"
    return "arabic"


def select_voice(
    effective_language: str,
    voice_style: str = "warm",
    preferred_language: str = "egyptian_arabic",
) -> VoiceProfile:
    style = (voice_style or "warm").lower()
    if style not in ("warm", "calm"):
        style = "warm"

    lang_key = language_key(effective_language, preferred_language)
    voice = VOICE_MAP.get((lang_key, style), VOICE_MAP[("arabic", "warm")])
    return VoiceProfile(voice=voice, rate="+0%")


def get_preview_sample_text(preferred_language: str) -> str:
    key = preferred_language if preferred_language in SAMPLE_TEXT else "arabic"
    if key == "egyptian_arabic":
        key = "arabic"
    return SAMPLE_TEXT.get(key, SAMPLE_TEXT["arabic"])
