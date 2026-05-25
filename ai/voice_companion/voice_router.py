from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json
import base64

from .session_manager import session_manager, SessionState
from .context_builder import build_context
from .response_generator import response_generator
from .memory_engine import memory_engine
from .tts import generate_speech
from .voice_selector import get_preview_sample_text
from .language_utils import normalize_preferred_setting, preferred_to_response_language

router = APIRouter()


def parse_voice_settings(voice_settings_json: str = None) -> dict:
    if not voice_settings_json:
        return {
            "preferred_language": "egyptian_arabic",
            "auto_detect": False,
            "voice_style": "warm",
            "speed": 100,
        }
    try:
        data = json.loads(voice_settings_json)
        raw_pref = data.get("preferred_language") or data.get("preferredLanguage")
        return {
            "preferred_language": normalize_preferred_setting(raw_pref),
            "auto_detect": bool(data.get("auto_detect", data.get("autoDetect", False))),
            "voice_style": data.get("voice_style", data.get("voiceStyle", "warm")),
            "speed": int(data.get("speed", 100)),
        }
    except json.JSONDecodeError:
        return parse_voice_settings(None)


def initial_language(voice_settings: dict) -> str:
    return preferred_to_response_language(voice_settings.get("preferred_language", "egyptian_arabic"))


@router.post("/session/start")
async def start_session(
    user_id: str = Form(...),
    emotion: str = Form("Neutral"),
    voice_settings: str = Form(None),
):
    import uuid

    settings = parse_voice_settings(voice_settings)
    session_id = str(uuid.uuid4())
    session_manager.create_session(session_id, user_id)

    lang = initial_language(settings)
    locked = not settings.get("auto_detect", False)
    context = build_context(
        current_emotion=emotion,
        language=lang,
        voice_settings=settings,
        language_locked=locked,
    )
    result = await response_generator.generate_turn(session_id, None, context)

    return {
        "status": "success",
        "session_id": session_id,
        "transcript": result["transcript"],
        "response_text": result["response_text"],
        "audio_base64": base64.b64encode(result["audio_bytes"]).decode("utf-8")
        if result["audio_bytes"]
        else None,
    }


@router.post("/session/message")
async def process_message(
    session_id: str = Form(...),
    user_id: str = Form(...),
    emotion: str = Form("Neutral"),
    voice_settings: str = Form(None),
    audio: UploadFile = File(...),
):
    session = session_manager.get_session(session_id)
    if not session or session.state not in [SessionState.ACTIVE, SessionState.STARTING]:
        raise HTTPException(status_code=400, detail="Invalid or expired session")

    session_manager.update_activity(session_id)

    settings = parse_voice_settings(voice_settings)
    lang = initial_language(settings)
    locked = not settings.get("auto_detect", False)
    context = build_context(
        current_emotion=emotion,
        language=lang,
        voice_settings=settings,
        language_locked=locked,
    )

    audio_bytes = await audio.read()
    result = await response_generator.generate_turn(session_id, audio_bytes, context)

    return {
        "status": "success",
        "transcript": result["transcript"],
        "response_text": result["response_text"],
        "audio_base64": base64.b64encode(result["audio_bytes"]).decode("utf-8")
        if result["audio_bytes"]
        else None,
        "language_info": result.get("language_info"),
    }


@router.post("/session/end")
async def end_session(session_id: str = Form(...)):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session_manager.complete_session(session_id)
    history = memory_engine.get_session_history(session_id)
    summary = response_generator.generate_summary(history)

    return {
        "status": "success",
        "summary": summary,
    }


@router.post("/tts/preview")
async def preview_tts(voice_settings: str = Form(...)):
    settings = parse_voice_settings(voice_settings)
    preferred = settings.get("preferred_language", "egyptian_arabic")
    sample_text = get_preview_sample_text(preferred)
    lang = initial_language(settings)
    audio_bytes = await generate_speech(
        sample_text,
        lang,
        settings.get("voice_style", "warm"),
        preferred,
        settings.get("speed", 100),
    )
    return {
        "status": "success",
        "sample_text": sample_text,
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else None,
    }
