def build_context(
    current_emotion: str,
    language: str = "arabic",
    voice_settings: dict = None,
    detected_language: str = None,
    language_locked: bool = False,
    recent_emotions: list = None,
    last_sessions: list = None,
    completed_games: list = None,
) -> dict:
    """
    Build structured context for the conversation engine.
    """
    recent_emotions = recent_emotions or []
    last_sessions = last_sessions or []
    completed_games = completed_games or []
    voice_settings = voice_settings or {}

    energy_score = 50
    if recent_emotions:
        positives = sum(1 for e in recent_emotions if e in ["Happy", "Calm", "Neutral"])
        energy_score = int((positives / len(recent_emotions)) * 100)

    context = {
        "user_context": {
            "energy_score": energy_score,
            "engagement_score": min(100, len(last_sessions) * 10 + len(completed_games) * 5),
        },
        "language": language,
        "detected_language": detected_language,
        "language_locked": language_locked,
        "voice_settings": {
            "preferred_language": voice_settings.get("preferred_language", "egyptian_arabic"),
            "auto_detect": bool(voice_settings.get("auto_detect", False)),
            "voice_style": voice_settings.get("voice_style", "warm"),
            "speed": voice_settings.get("speed", 100),
        },
        "emotion_context": {
            "current": current_emotion,
            "recent_trend": recent_emotions[-3:] if len(recent_emotions) >= 3 else recent_emotions,
        },
        "session_context": {
            "last_sessions_count": len(last_sessions),
            "completed_games": [g.get("name") for g in completed_games[-3:]] if completed_games else [],
        },
        "conversation_context": {},
    }

    return context
