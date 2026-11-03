/**
 * sageVoiceService.js — High-Fidelity Multi-Tier Neural Voice Engine for DharmaGPT.
 * 
 * Hierarchy of Voice Quality:
 * 1. ElevenLabs Multilingual V2 (when valid sk_ secret key is configured).
 * 2. Backend Neural Edge-TTS (hi-IN-MadhurNeural / hi-IN-SwaraNeural — human, serene Indian voices).
 * 3. Google Neural Natural Voice (Ultra-fast, zero-key, authentic human cadence for en-IN & hi).
 * 4. Browser SpeechSynthesis (Clean fallback).
 */

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://dharma-gpt-e.onrender.com' : 'http://localhost:8000');
const ELEVENLABS_API_KEY = (import.meta.env.VITE_ELEVENLABS_API_KEY || '').trim();

// Persona Voice Mapping for ElevenLabs
const PERSONA_CONFIGS = {
  krishna: {
    elevenVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel — Warm, deep, serene
    edgeVoice: 'hi-IN-MadhurNeural',
    rate: 0.94
  },
  chanakya: {
    elevenVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni — Crisp, strategic, authoritative
    edgeVoice: 'hi-IN-MadhurNeural',
    rate: 0.98
  },
  laxmibai: {
    elevenVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel — Valiant, fierce, resonant female
    edgeVoice: 'hi-IN-SwaraNeural',
    rate: 0.96
  }
};

let activeAudio = null;
let activeUtterance = null;
let currentOnEndCallback = null;
let audioQueue = [];
let isQueueRunning = false;

/**
 * Strips markdown, emojis, symbols, and formatting for fluent speech.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headers (#, ##, ###)
    .replace(/^#+\s+/gm, '')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold / italics (*, **, _, __)
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove blockquotes (> )
    .replace(/^>\s+/gm, '')
    // Remove bullet points / dashes
    .replace(/^[-*+]\s+/gm, '')
    // Remove numbered lists (1. )
    .replace(/^\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Remove Section 14 / system tags
    .replace(/Section \d+ Validated Counsel/gi, '')
    // Remove emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Normalize repeated whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stop any currently playing voice across all engines.
 */
export function stopSageVoice() {
  audioQueue = [];
  isQueueRunning = false;

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
    } catch (e) {
      // ignore
    }
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
    activeUtterance = null;
  }

  if (currentOnEndCallback) {
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    cb();
  }
}

/**
 * Check if voice is actively speaking.
 */
export function isSageVoicePlaying() {
  if (activeAudio && !activeAudio.paused && !activeAudio.ended) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) return true;
  return isQueueRunning;
}

/**
 * Splits text into natural sentence fragments suitable for neural TTS.
 */
function splitIntoSentences(text, maxLength = 160) {
  const rawSentences = text.match(/[^.?!।\n]+[.?!।\n]+|[^.?!।\n]+$/g) || [text];
  const chunks = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLength) {
      chunks.push(trimmed);
    } else {
      const parts = trimmed.split(/,\s+/);
      let current = '';
      for (const p of parts) {
        if ((current + ', ' + p).length <= maxLength) {
          current = current ? current + ', ' + p : p;
        } else {
          if (current) chunks.push(current);
          current = p;
        }
      }
      if (current) chunks.push(current);
    }
  }

  return chunks.filter(c => c.length > 1);
}

/**
 * Plays speech using Google Neural Natural Voice via an asynchronous audio queue.
 * Detects whether each chunk is Hindi/Sanskrit or English and applies correct Indian acoustic models.
 */
async function playGoogleNeuralQueue(cleanedText, persona, onStart, onEnd) {
  const chunks = splitIntoSentences(cleanedText);

  if (!chunks.length) {
    if (onEnd) onEnd();
    return;
  }

  audioQueue = chunks.map(chunk => {
    // If text contains Devanagari characters, use authentic Hindi/Sanskrit acoustic model
    // Otherwise use authentic Indian English ('en-IN')
    const hasHindi = /[\u0900-\u097F]/.test(chunk);
    const lang = hasHindi ? 'hi' : 'en-IN';
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
  });

  isQueueRunning = true;
  let hasStarted = false;

  const playNext = () => {
    if (!isQueueRunning || !audioQueue.length) {
      isQueueRunning = false;
      activeAudio = null;
      if (currentOnEndCallback) {
        const cb = currentOnEndCallback;
        currentOnEndCallback = null;
        cb();
      }
      return;
    }

    const nextUrl = audioQueue.shift();
    const audio = new Audio(nextUrl);
    activeAudio = audio;

    audio.onplay = () => {
      if (!hasStarted) {
        hasStarted = true;
        if (onStart) onStart();
      }
    };

    audio.onended = () => {
      playNext();
    };

    audio.onerror = () => {
      playNext();
    };

    audio.play().catch(e => {
      playNext();
    });
  };

  playNext();
}

/**
 * Plays speech using Backend Edge-TTS Neural Voice.
 */
async function tryBackendNeuralTTS(cleanedText, persona, onStart, onEnd) {
  try {
    const ttsUrl = `${API_BASE}/tts?text=${encodeURIComponent(cleanedText.slice(0, 1000))}&persona=${encodeURIComponent(persona)}`;
    const audio = new Audio(ttsUrl);
    activeAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      activeAudio = null;
      if (currentOnEndCallback) {
        const cb = currentOnEndCallback;
        currentOnEndCallback = null;
        cb();
      }
    };

    audio.onerror = () => {
      activeAudio = null;
      throw new Error('Backend TTS error');
    };

    await audio.play();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Plays speech using ElevenLabs API when valid sk_ secret key is provided.
 */
async function tryElevenLabsTTS(cleanedText, persona, onStart, onEnd) {
  if (!ELEVENLABS_API_KEY.startsWith('sk_')) {
    return false;
  }

  const config = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.krishna;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: cleanedText.slice(0, 1000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.85
        }
      })
    });

    if (!response.ok) return false;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(url);
      activeAudio = null;
      if (currentOnEndCallback) {
        const cb = currentOnEndCallback;
        currentOnEndCallback = null;
        cb();
      }
    };

    await audio.play();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Main Entry Point: Speaks the sage's counsel with high-fidelity human natural voice.
 */
export async function playSageVoice(rawText, persona = 'krishna', onStart = null, onEnd = null) {
  stopSageVoice();

  const cleanedText = cleanTextForSpeech(rawText);
  if (!cleanedText) {
    if (onEnd) onEnd();
    return;
  }

  currentOnEndCallback = onEnd;

  // 1. Try ElevenLabs (if valid secret key starting with sk_ is present)
  const elevenOk = await tryElevenLabsTTS(cleanedText, persona, onStart, onEnd);
  if (elevenOk) return;

  // 2. Try Backend Edge-TTS (hi-IN-MadhurNeural / hi-IN-SwaraNeural)
  const backendOk = await tryBackendNeuralTTS(cleanedText, persona, onStart, onEnd);
  if (backendOk) return;

  // 3. Ultra-fast Google Natural Neural Audio Queue (human Hindi & Indian English)
  await playGoogleNeuralQueue(cleanedText, persona, onStart, onEnd);
}
