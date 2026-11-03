"""
DharmaGPT — FastAPI Backend
Uses Google Gemini for text generation with RAG from ChromaDB.
Optimized for low-latency voice streaming, async I/O, background pre-warming, and Render cloud deployment.
"""
import os
import re
import json
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from rag.chroma_client import get_persona_collection
from gemini_client import (
    generate_persona_response_async,
    stream_persona_response,
    transcribe_audio_async,
    warmup_gemini,
)
from services.redis_cache import get_cached_response, set_cached_response
from services.voice_engine import generate_speech_bytes
from system_prompt import get_system_prompt

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Lifespan & Background Pre-Warming ──────────────────────────────────────

async def _warmup_services():
    """
    Runs in the background immediately after boot.
    Pre-warms ChromaDB, System Prompts, and Gemini TLS connection
    so the very first user query experiences ZERO cold-start lag.
    """
    logger.info("🕉️ Initiating sacred service pre-warming...")

    # 1. Warm in-memory prompt cache
    try:
        for p in ("krishna", "chanakya", "laxmibai"):
            get_system_prompt(p)
        logger.info("✓ System prompts cached.")
    except Exception as e:
        logger.debug(f"Prompt warmup notice: {e}")

    # 2. Warm ChromaDB collections in worker thread
    try:
        def _warm_chroma():
            for p in ("krishna", "chanakya", "laxmibai"):
                get_persona_collection(p)
        await asyncio.to_thread(_warm_chroma)
        logger.info("✓ ChromaDB collections ready.")
    except Exception as e:
        logger.debug(f"ChromaDB warmup notice: {e}")

    # 3. Warm Gemini TLS Handshake & Client
    try:
        await warmup_gemini()
    except Exception as e:
        logger.debug(f"Gemini warmup notice: {e}")

    logger.info("🕉️ All sacred services are warmed and primed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Non-blocking background warmup task: server begins accepting HTTP traffic instantly (<100ms)
    warmup_task = asyncio.create_task(_warmup_services())
    yield
    if not warmup_task.done():
        warmup_task.cancel()


app = FastAPI(title="DharmaGPT Backend", lifespan=lifespan)

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False if allowed_origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response Models ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    query: str
    persona: str = "krishna"
    history: list[dict] = []

class ChatResponse(BaseModel):
    response: str
    retrieved_chunks: int

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str
    persona: str = "krishna"

# ─── Health ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "sacred parameters online", "environment": os.getenv("RENDER_SERVICE_ID", "local")}

# ─── Helpers ────────────────────────────────────────────────────────────────

async def _retrieve_context_async(query: str, persona: str = "krishna") -> list[str]:
    """Retrieve relevant verses from ChromaDB asynchronously without blocking the event loop."""
    def _search():
        try:
            collection = get_persona_collection(persona)
            results = collection.query(query_texts=[query], n_results=3)
            if results.get("documents") and results["documents"][0]:
                return results["documents"][0]
        except Exception as e:
            logger.warning(f"ChromaDB retrieval failed: {e}")
        return []

    return await asyncio.to_thread(_search)

# ─── Voice Session (Local Stack) ───────────────────────────────────────────

@app.websocket("/ws/voice/{persona}")
async def voice_session(websocket: WebSocket, persona: str):
    await websocket.accept()
    logger.info(f"Voice session started for persona: {persona}")
    sentence_end = re.compile(r'[.?!]\s|[.?!]$|\n')
    md_chars = re.compile(r'[*_#`\[\]]')

    try:
        while True:
            data = await websocket.receive()
            user_text = ""

            # Check binary audio or text fallback
            audio_bytes = data.get("bytes")
            text_data = data.get("text")

            if audio_bytes is not None:
                logger.info(f"[{persona}] Received {len(audio_bytes)} bytes audio. Transcribing...")
                await websocket.send_json({"type": "agent_thinking"})
                try:
                    user_text = await transcribe_audio_async(audio_bytes)
                    logger.info(f"[{persona}] Transcribed: {user_text}")
                    await websocket.send_json({"type": "user_transcription", "text": user_text})
                except Exception as e:
                    logger.error(f"Transcription error: {e}")
                    await websocket.send_json({"type": "session_error", "message": "Transcription failed."})
                    await websocket.send_json({"type": "agent_done"})
                    continue

            elif text_data is not None:
                try:
                    payload = json.loads(text_data)
                    msg_type = payload.get("type", "")
                    if msg_type == "interrupt":
                        logger.info(f"[{persona}] Interrupted by user.")
                        continue
                    if msg_type == "user_text":
                        user_text = payload.get("text", "")
                        logger.info(f"[{persona}] Text fallback: {user_text}")
                        await websocket.send_json({"type": "agent_thinking"})
                except Exception:
                    continue
            else:
                continue

            if not user_text or not user_text.strip():
                logger.info(f"[{persona}] Empty input ignored.")
                continue

            # In voice mode, keep context fast to minimize initial audio delay
            context = []
            buffer = ""

            # TTS Pipeline: Producer (LLM stream) -> Queue -> Consumer (TTS generator)
            tts_queue: asyncio.Queue[str | None] = asyncio.Queue()

            async def tts_worker():
                """Processes TTS audio concurrently while LLM continues streaming."""
                while True:
                    sentence = await tts_queue.get()
                    if sentence is None:
                        tts_queue.task_done()
                        break
                    try:
                        audio = await asyncio.wait_for(
                            generate_speech_bytes(sentence, persona),
                            timeout=5.0
                        )
                        if audio:
                            await websocket.send_bytes(audio)
                    except asyncio.TimeoutError:
                        logger.warning(f"TTS timed out for: {sentence[:35]}...")
                    except Exception as err:
                        logger.error(f"TTS generation error: {err}")
                    finally:
                        tts_queue.task_done()

            tts_task = asyncio.create_task(tts_worker())

            async def queue_sentence(text: str):
                cleaned = md_chars.sub('', text).strip()
                if cleaned:
                    # 1. Immediately notify client text for live transcript display
                    await websocket.send_json({"type": "agent_speaking", "text": cleaned + " "})
                    # 2. Queue for background TTS generation
                    await tts_queue.put(cleaned)

            try:
                async for chunk in stream_persona_response(user_text, context, [], persona, is_voice_mode=True):
                    buffer += chunk

                    # Match sentence boundaries
                    match = sentence_end.search(buffer)
                    while match:
                        split_idx = match.end()
                        sentence = buffer[:split_idx].strip()
                        buffer = buffer[split_idx:]
                        if sentence:
                            await queue_sentence(sentence)
                        match = sentence_end.search(buffer)

                    # Early clause splitting for faster initial speech
                    if len(buffer) > 55 and ', ' in buffer:
                        last_comma = buffer.rfind(', ')
                        clause = buffer[:last_comma + 1].strip()
                        buffer = buffer[last_comma + 2:]
                        if clause:
                            await queue_sentence(clause)

                if buffer.strip():
                    await queue_sentence(buffer.strip())

            finally:
                # Stop TTS consumer and await completion
                await tts_queue.put(None)
                await tts_task

            await websocket.send_json({"type": "agent_done"})

    except WebSocketDisconnect:
        logger.info(f"Voice session disconnected: {persona}")
    except Exception as e:
        logger.error(f"Voice session error: {e}")
        try:
            await websocket.send_json({"type": "session_error", "message": str(e)})
        except Exception:
            pass

# ─── Chat Endpoint (Non-streaming) ─────────────────────────────────────────

@app.post("/ask", response_model=ChatResponse)
async def ask_persona(request: ChatRequest):
    logger.info(f"[ask] persona={request.persona} session={request.session_id} query={request.query[:50]}...")

    # Check cache
    cached = get_cached_response(request.session_id, request.query, request.persona)
    if cached:
        logger.info("Cache hit!")
        return ChatResponse(**cached)

    # Non-blocking RAG retrieval
    context = await _retrieve_context_async(request.query, request.persona)

    # Generate via Gemini native async
    try:
        response_text = await generate_persona_response_async(
            request.query,
            context,
            request.history,
            request.persona,
        )
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    response_data = {
        "response": response_text,
        "retrieved_chunks": len(context),
    }

    # Cache and return
    set_cached_response(request.session_id, request.query, request.persona, response_data)
    return ChatResponse(**response_data)

# ─── Chat Endpoint (Streaming via SSE) ─────────────────────────────────────

@app.get("/chat/stream")
async def stream_chat(
    query: str = Query(..., description="User's question"),
    session_id: str = Query("default", description="Session ID"),
    persona: str = Query("krishna", description="The selected persona (e.g., krishna, chanakya)"),
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Frontend connects with EventSource or fetch().
    """
    logger.info(f"[stream] persona={persona} session={session_id} query={query[:50]}...")

    # Non-blocking RAG retrieval
    context = await _retrieve_context_async(query, persona)

    async def event_generator():
        try:
            async for chunk in stream_persona_response(query, context, None, persona):
                if chunk:
                    yield f"data: {json.dumps({'text': chunk})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
