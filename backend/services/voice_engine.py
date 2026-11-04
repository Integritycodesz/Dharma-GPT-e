import os
import logging
import asyncio
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import edge_tts

log = logging.getLogger(__name__)

# Voice mapping for the local fallback.
VOICE_MAP = {
    "krishna": "hi-IN-MadhurNeural",
    "chanakya": "hi-IN-MadhurNeural",
    "laxmibai": "hi-IN-SwaraNeural",
    "default": "en-US-AndrewMultilingualNeural"
}

VOICE_PROFILES = {
    "krishna": {"gender": "male", "traits": ("warm", "calm", "gentle", "hindi", "indian")},
    "chanakya": {"gender": "male", "traits": ("mature", "authoritative", "deep", "hindi", "indian")},
    "laxmibai": {"gender": "female", "traits": ("confident", "strong", "warm", "hindi", "indian")},
}

_voice_cache: list[dict] = []
_voice_cache_expires_at = 0.0
_voice_cache_lock = asyncio.Lock()


def _request_elevenlabs_voices(api_key: str) -> list[dict]:
    request = urllib.request.Request(
        "https://api.elevenlabs.io/v1/voices",
        headers={"xi-api-key": api_key, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            voices = json.loads(response.read().decode("utf-8")).get("voices", [])
    except urllib.error.HTTPError as error:
        log.error("ElevenLabs voice discovery failed with HTTP %s", error.code)
        raise RuntimeError("ElevenLabs voice discovery failed") from None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        log.error("ElevenLabs voice discovery failed: %s", error)
        raise RuntimeError("ElevenLabs voice discovery failed") from None

    return [voice for voice in voices if voice.get("voice_id")]


async def _get_elevenlabs_voices(api_key: str) -> list[dict]:
    global _voice_cache, _voice_cache_expires_at
    async with _voice_cache_lock:
        if _voice_cache and time.monotonic() < _voice_cache_expires_at:
            return _voice_cache

        voices = await asyncio.to_thread(_request_elevenlabs_voices, api_key)
        if not voices:
            raise RuntimeError("No ElevenLabs voices are available for this account")
        _voice_cache = voices
        _voice_cache_expires_at = time.monotonic() + 300
        return voices


def _choose_elevenlabs_voice(voices: list[dict], persona: str) -> str:
    profile = VOICE_PROFILES.get(persona, VOICE_PROFILES["krishna"])
    preferred_gender = profile["gender"]
    opposite_gender = "female" if preferred_gender == "male" else "male"

    def score(voice: dict) -> tuple[int, str]:
        labels = voice.get("labels") or {}
        metadata = " ".join(
            [str(voice.get("name", "")), str(voice.get("description", ""))]
            + [str(value) for value in labels.values()]
        ).lower()
        gender = str(labels.get("gender", "")).lower()
        points = 8 if preferred_gender in gender else -8 if opposite_gender in gender else 0
        for trait in profile["traits"]:
            if trait in metadata:
                points += 3
        return points, str(voice.get("name", ""))

    return max(voices, key=score)["voice_id"]


def _configured_voice_id(persona: str) -> str | None:
    persona_key = f"ELEVENLABS_VOICE_ID_{persona.upper()}"
    return os.getenv(persona_key) or os.getenv("ELEVENLABS_VOICE_ID")


def _request_elevenlabs_speech(api_key: str, voice_id: str, text: str) -> bytes:
    query = urllib.parse.urlencode({"output_format": "mp3_44100_128"})
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{urllib.parse.quote(voice_id, safe='')}?{query}",
        data=json.dumps({
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.55, "similarity_boost": 0.75},
        }).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        log.error("ElevenLabs speech generation failed with HTTP %s", error.code)
        raise RuntimeError("ElevenLabs speech generation failed") from None
    except (urllib.error.URLError, TimeoutError) as error:
        log.error("ElevenLabs speech generation failed: %s", error)
        raise RuntimeError("ElevenLabs speech generation failed") from None


async def generate_speech_bytes(text: str, persona: str) -> bytes:
    """Generate speech with ElevenLabs when configured, otherwise fallback to Edge-TTS."""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if api_key:
        try:
            voice_id = _configured_voice_id(persona)
            if not voice_id:
                voices = await _get_elevenlabs_voices(api_key)
                voice_id = _choose_elevenlabs_voice(voices, persona)
                log.info("Selected ElevenLabs voice %s for persona %s", voice_id, persona)
            audio = await asyncio.to_thread(_request_elevenlabs_speech, api_key, voice_id, text)
            if audio:
                return audio
        except Exception as e:
            log.warning("ElevenLabs generation notice: %s. Falling back to Edge-TTS...", e)

    voice = VOICE_MAP.get(persona, VOICE_MAP["default"])
    communicate = edge_tts.Communicate(text, voice, rate="-6%", pitch="-3Hz")

    audio_data = bytearray()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])

    return bytes(audio_data)
