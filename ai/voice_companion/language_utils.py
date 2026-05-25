"""Shared preferred-language normalization for voice companion."""


def normalize_preferred_setting(value: str) -> str:
    """Return 'english' or 'egyptian_arabic'."""
    v = (value or "").strip().lower().replace(" ", "_")
    if v in ("english", "en", "us_english", "us-english"):
        return "english"
    if v in ("egyptian_arabic", "arabic", "egyptian", "ar", "egyptian_ar"):
        return "egyptian_arabic"
    return "egyptian_arabic"


def preferred_to_response_language(preferred_language: str) -> str:
    return "english" if normalize_preferred_setting(preferred_language) == "english" else "arabic"


def preferred_to_whisper_language(preferred_language: str) -> str:
    return "en" if preferred_to_response_language(preferred_language) == "english" else "ar"
