import edge_tts
import tempfile
import os

from .voice_selector import VoiceProfile, select_voice, speed_to_rate


async def generate_speech(
    text: str,
    effective_language: str = "arabic",
    voice_style: str = "warm",
    preferred_language: str = "egyptian_arabic",
    speed: int = 100,
) -> bytes:
    """
    Generate speech audio bytes from text using edge-tts.
    """
    if not text:
        return b""

    profile: VoiceProfile = select_voice(effective_language, voice_style, preferred_language)
    rate = speed_to_rate(speed)
    communicate = edge_tts.Communicate(text, profile.voice, rate=rate)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_file_path = temp_file.name

    try:
        await communicate.save(temp_file_path)
        with open(temp_file_path, "rb") as file:
            return file.read()
    except Exception as e:
        print(f"TTS Error: {e}")
        return b""
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
