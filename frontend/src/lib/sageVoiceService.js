/**
 * sageVoiceService.js — Ultra-Reliable, Natural Voice Engine for DharmaGPT.
 * 
 * Features:
 * 1. ElevenLabs Multilingual V2 (Activated when user provides a valid secret key starting with 'sk_').
 * 2. High-Fidelity Browser Speech Engine with:
 *    - Smart voice discovery (detects natural Indian/Hindi/English neural voices).
 *    - Sentence-by-sentence audio queue (completely avoids Chromium's 3-second buffer cut-off bug).
 *    - 60ms async cancellation guard so speech starts reliably on first click.
 *    - Background keep-alive to prevent browser suspension.
 *    - Full instant stop and cleanup.
 */

const ELEVENLABS_API_KEY = (import.meta.env.VITE_ELEVENLABS_API_KEY || '').trim();

// Persona voice preferences
const PERSONA_CONFIGS = {
  krishna: {
    elevenVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel — Warm, serene, compassionate
    rate: 0.94,
    pitch: 1.0,
    gender: 'male'
  },
  chanakya: {
    elevenVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni — Crisp, strategic, authoritative
    rate: 0.96,
    pitch: 0.92,
    gender: 'male'
  },
  laxmibai: {
    elevenVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel — Resilient, fierce, heroic female
    rate: 0.96,
    pitch: 1.05,
    gender: 'female'
  }
};

let activeAudio = null;
let currentOnEndCallback = null;
let sentenceQueue = [];
let isSpeakingActive = false;
let keepAliveTimer = null;

// Voice Cache
let cachedVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

// Pre-warm voices on load
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

/**
 * Cleans text of markdown and non-verbal artifacts.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/Section \d+ Validated Counsel/gi, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into individual clean sentences (15-25 words)
 * so Chromium NEVER hits its internal buffer/silence timeout.
 */
function splitIntoCleanSentences(text) {
  if (!text) return [];

  // Match sentence endings (. ? ! । \n)
  const matches = text.match(/[^.?!।\n]+[.?!।\n]+|[^.?!।\n]+$/g);
  if (!matches) return [text];

  const sentences = [];
  for (const m of matches) {
    const s = m.trim();
    if (s.length > 1) {
      // If a sentence is very long (> 180 chars), split by comma for smoother breathing
      if (s.length > 180 && s.includes(',')) {
        const subParts = s.split(/,\s+/);
        let curr = '';
        for (const p of subParts) {
          if ((curr + ', ' + p).length <= 160) {
            curr = curr ? curr + ', ' + p : p;
          } else {
            if (curr) sentences.push(curr);
            curr = p;
          }
        }
        if (curr) sentences.push(curr);
      } else {
        sentences.push(s);
      }
    }
  }

  return sentences;
}

/**
 * Selects the highest fidelity available voice for the persona and language.
 */
function selectBestVoice(persona, sampleText) {
  const voices = loadVoices();
  if (!voices || !voices.length) return null;

  const config = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.krishna;
  const isFemale = config.gender === 'female';
  const hasHindi = /[\u0900-\u097F]/.test(sampleText);

  // 1. Natural Hindi voices (if text has Devanagari)
  if (hasHindi) {
    const hiVoices = voices.filter(v => v.lang.startsWith('hi') || v.lang.includes('Hindi'));
    if (hiVoices.length > 0) {
      if (isFemale) {
        const f = hiVoices.find(v => v.name.includes('Swara') || v.name.includes('Kalpana') || v.name.includes('Female'));
        if (f) return f;
      } else {
        const m = hiVoices.find(v => v.name.includes('Madhur') || v.name.includes('Hemant') || v.name.includes('Male'));
        if (m) return m;
      }
      return hiVoices[0];
    }
  }

  // 2. Natural Indian English voices (en-IN)
  const inVoices = voices.filter(v => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Hindi'));
  if (inVoices.length > 0) {
    if (isFemale) {
      const f = inVoices.find(v => v.name.includes('Neerja') || v.name.includes('Heera') || v.name.includes('Female') || v.name.includes('Zira'));
      if (f) return f;
    } else {
      const m = inVoices.find(v => v.name.includes('Prabhat') || v.name.includes('Ravi') || v.name.includes('Male'));
      if (m) return m;
    }
    return inVoices[0];
  }

  // 3. Online Natural voices in Edge / Chrome (e.g. Natural, Google, Guy, Jenny)
  const naturalVoices = voices.filter(v => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'));
  if (naturalVoices.length > 0) {
    if (isFemale) {
      const f = naturalVoices.find(v => v.name.includes('Female') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Samantha'));
      if (f) return f;
    } else {
      const m = naturalVoices.find(v => v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('Christopher') || v.name.includes('George'));
      if (m) return m;
    }
    return naturalVoices[0];
  }

  // 4. General fallback matching gender
  if (isFemale) {
    const f = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
    if (f) return f;
  } else {
    const m = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
    if (m) return m;
  }

  return voices[0];
}

/**
 * Chromium keep-alive ticker: prevents speech engine from pausing mid-stream.
 */
function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        stopKeepAlive();
      }
    }
  }, 8000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

/**
 * Stop any ongoing speech immediately.
 */
export function stopSageVoice() {
  isSpeakingActive = false;
  sentenceQueue = [];
  stopKeepAlive();

  // 1. Stop ElevenLabs audio if playing
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

  // 2. Stop browser speech synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }

  // 3. Fire callback
  if (currentOnEndCallback) {
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    cb();
  }
}

/**
 * Checks if voice is actively speaking.
 */
export function isSageVoicePlaying() {
  if (activeAudio && !activeAudio.paused && !activeAudio.ended) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) return true;
  return isSpeakingActive;
}

/**
 * Plays speech queue sentence-by-sentence via SpeechSynthesis.
 * Each sentence takes 2-4 seconds, completely immune to Chromium timeout bugs!
 */
function playNextSentenceInQueue(persona, onStart, onEnd) {
  if (!isSpeakingActive || !sentenceQueue.length) {
    isSpeakingActive = false;
    stopKeepAlive();
    if (currentOnEndCallback) {
      const cb = currentOnEndCallback;
      currentOnEndCallback = null;
      cb();
    }
    return;
  }

  const sentence = sentenceQueue.shift();
  const config = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.krishna;
  const utterance = new SpeechSynthesisUtterance(sentence);

  const voice = selectBestVoice(persona, sentence);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.rate = config.rate;
  utterance.pitch = config.pitch;

  let hasStarted = false;
  utterance.onstart = () => {
    hasStarted = true;
    startKeepAlive();
    if (onStart) onStart();
  };

  utterance.onend = () => {
    // Proceed to next sentence in queue!
    playNextSentenceInQueue(persona, null, onEnd);
  };

  utterance.onerror = (e) => {
    console.warn('Utterance notice:', e?.error);
    // Continue smoothly to next sentence instead of stopping!
    playNextSentenceInQueue(persona, null, onEnd);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speak call error:', err);
    playNextSentenceInQueue(persona, null, onEnd);
  }
}

/**
 * Try playing with ElevenLabs if a valid secret key ('sk_...') is provided.
 */
async function tryElevenLabs(cleanedText, persona, onStart, onEnd) {
  if (!ELEVENLABS_API_KEY.startsWith('sk_')) {
    return false;
  }

  const config = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.krishna;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenVoiceId}`, {
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

    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;

    audio.onplay = () => {
      isSpeakingActive = true;
      if (onStart) onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(url);
      activeAudio = null;
      isSpeakingActive = false;
      if (currentOnEndCallback) {
        const cb = currentOnEndCallback;
        currentOnEndCallback = null;
        cb();
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      activeAudio = null;
      isSpeakingActive = false;
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
 * Main Entry Point: Speaks the sage's counsel reliably and fluently.
 * 
 * @param {string} rawText The text to speak.
 * @param {string} persona 'krishna' | 'chanakya' | 'laxmibai'
 * @param {function} onStart Callback when voice begins.
 * @param {function} onEnd Callback when voice ends or is stopped.
 */
export async function playSageVoice(rawText, persona = 'krishna', onStart = null, onEnd = null) {
  // Always halt any prior playback
  stopSageVoice();

  const cleanedText = cleanTextForSpeech(rawText);
  if (!cleanedText) {
    if (onEnd) onEnd();
    return;
  }

  currentOnEndCallback = onEnd;

  // 1. If valid ElevenLabs key starting with 'sk_' is present, use ElevenLabs
  const elevenOk = await tryElevenLabs(cleanedText, persona, onStart, onEnd);
  if (elevenOk) return;

  // 2. High-reliability, sentence-by-sentence browser engine
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  const sentences = splitIntoCleanSentences(cleanedText);
  if (!sentences.length) {
    if (onEnd) onEnd();
    return;
  }

  sentenceQueue = sentences;
  isSpeakingActive = true;

  // Chromium fix: wait 60ms after cancel() before calling speak()
  setTimeout(() => {
    playNextSentenceInQueue(persona, onStart, onEnd);
  }, 60);
}
