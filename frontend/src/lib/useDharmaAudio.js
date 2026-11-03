import { useCallback, useEffect, useRef, useState } from 'react';

const FFT_SIZE = 256;
const SILENCE_DURATION_MS = 850; // Snappy turn-taking

export function useDharmaAudio({
  persona = 'krishna',
  onPersonaChange,
  onVerseReceived,
  onTranscriptionReceived,
  onStateChange,
  onError,
}) {
  // states: idle -> connecting -> listening -> recording -> processing -> speaking
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [freqData, setFreqData] = useState(null);

  const stateRef = useRef('idle');
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const analyserDataRef = useRef(null);
  const micStreamRef = useRef(null);


  // Web Speech API
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const ambientNoiseRef = useRef(20);
  const rafRef = useRef(null);
  const currentAudioRef = useRef(null);
  const stoppedManuallyRef = useRef(false);
  const isAgentGeneratingRef = useRef(false);
  const hasSentTurnTextRef = useRef(false);

  // Audio Recorder Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Audio Playback Queue
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const setStateSynced = useCallback((s) => {
    stateRef.current = s;
    setState(s);
    onStateChange?.(s);
  }, [onStateChange]);

  // ─── Continuous Audio Playback Queue ───────────────────────────────────────

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      if (currentAudioRef.current) {
        currentAudioRef.current = null;
      }
      // If agent is done streaming, return to listening; else remain in processing
      if (!isAgentGeneratingRef.current && !stoppedManuallyRef.current) {
        setStateSynced('listening');
      } else if (!stoppedManuallyRef.current && stateRef.current !== 'recording') {
        setStateSynced('processing');
      }
      return;
    }

    isPlayingRef.current = true;
    setStateSynced('speaking');

    const blob = audioQueueRef.current.shift();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;

    const onFinish = () => {
      URL.revokeObjectURL(url);
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null;
      }
      playNextAudio();
    };

    audio.onended = onFinish;
    audio.onerror = (e) => {
      console.error('[DharmaAudio] Playback error:', e);
      onFinish();
    };

    audio.play().catch((e) => {
      console.warn('[DharmaAudio] Autoplay notice:', e);
      onFinish();
    });
  }, [setStateSynced]);

  // ─── Visualizer & VAD Loop ──────────────────────────────────────────────────

  const startVisualizerLoop = useCallback(() => {
    const tick = () => {
      if (analyserRef.current && analyserDataRef.current && stateRef.current !== 'idle') {
        analyserRef.current.getByteFrequencyData(analyserDataRef.current);
        const data = new Uint8Array(analyserDataRef.current);
        setFreqData(data);

          // VAD: only process mic input if we aren't currently playing AI output
          // (to prevent loudspeaker echo feedback into the mic)
          if (
            (stateRef.current === 'listening' || stateRef.current === 'recording') &&
            !isPlayingRef.current
          ) {
            const sum = data.reduce((a, b) => a + b, 0);
            const avg = sum / data.length;

            if (!isSpeakingRef.current) {
              ambientNoiseRef.current = ambientNoiseRef.current * 0.95 + avg * 0.05;
            }

            const dynamicThreshold = Math.max(14, ambientNoiseRef.current + 10);

            if (avg > dynamicThreshold) {
              if (!isSpeakingRef.current) {
                isSpeakingRef.current = true;
                hasSentTurnTextRef.current = false;
                if (stateRef.current !== 'recording') {
                  setStateSynced('recording');
                }

                // Start audio recorder for fallback
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
                  audioChunksRef.current = [];
                  try {
                    mediaRecorderRef.current.start();
                  } catch (e) {
                    console.warn('[DharmaAudio] MediaRecorder start err:', e);
                  }
                }
              }

                    // Reset silence timeout
                    clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = setTimeout(() => {
                      if (isSpeakingRef.current) {
                        isSpeakingRef.current = false;

                  // 1. If text was already dispatched via WebSpeechAPI, we are done
                  if (hasSentTurnTextRef.current) {
                    hasSentTurnTextRef.current = false;
                    return;
                  }

                  // 2. If SpeechRecognition produced text that wasn't finalized yet, dispatch it now
                  if (latestTranscriptRef.current && latestTranscriptRef.current.trim()) {
                    const text = latestTranscriptRef.current.trim();
                    latestTranscriptRef.current = '';
                    hasSentTurnTextRef.current = true;
                    isAgentGeneratingRef.current = true;
                    setStateSynced('processing');
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'user_text', text }));
                    }
                    return;
                  }

                  // 3. Fallback: stop MediaRecorder to send audio binary over WebSocket
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    try {
                      mediaRecorderRef.current.stop();
                    } catch (e) { }
                  }

                  if (
                    stateRef.current !== 'listening' &&
                    stateRef.current !== 'processing' &&
                    stateRef.current !== 'speaking'
                  ) {
                    setStateSynced('processing');
                  }
                  silenceTimeoutRef.current = null;
                }
            }, SILENCE_DURATION_MS);
}
        }
      }
rafRef.current = requestAnimationFrame(tick);
    };
rafRef.current = requestAnimationFrame(tick);
  }, [setStateSynced]);

const stopVisualizerLoop = useCallback(() => {
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
  clearTimeout(silenceTimeoutRef.current);
  silenceTimeoutRef.current = null;
}, []);

// ─── Setup Mic & Speech Engine ──────────────────────────────────────────────

const setupMic = useCallback(async () => {
  if (micStreamRef.current) {
    micStreamRef.current.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }

  if (audioCtxRef.current) {
    audioCtxRef.current.close().catch(() => { });
    audioCtxRef.current = null;
  }

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    micStreamRef.current = stream;

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtxClass();
    audioCtxRef.current = ctx;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const srcNode = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    srcNode.connect(analyser);

    // Determine best audio mime type supported by this browser
    let supportedMime = '';
    if (typeof MediaRecorder !== 'undefined') {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      supportedMime = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const mediaRecorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const mime = mediaRecorder.mimeType || supportedMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        audioChunksRef.current = [];

        // Only send raw audio if text wasn't already sent by WebSpeechAPI
        if (!hasSentTurnTextRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log(`[DharmaAudio] Sending ${audioBlob.size} bytes audio (${mime}) to WebSocket...`);
          isAgentGeneratingRef.current = true;
          setStateSynced('processing');
          wsRef.current.send(audioBlob);
        }
        hasSentTurnTextRef.current = false;
      };

      mediaRecorderRef.current = mediaRecorder;
    }

        // Native Real-time Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Optimized for English, Hindi & Hinglish

              recognition.onresult = (event) => {
                let interim = '';
                let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }

          // User Barge-in / Interruption: if AI is speaking and user speaks, stop AI instantly
          if (stateRef.current === 'speaking' || stateRef.current === 'processing') {
            const activeWords = (final + interim).trim();
            if (activeWords.length > 1) {
              console.log('[DharmaAudio] User interrupted AI with:', activeWords);
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              isAgentGeneratingRef.current = false;
              if (currentAudioRef.current) {
                try {
                  currentAudioRef.current.pause();
                  currentAudioRef.current.currentTime = 0;
                } catch (e) { }
                currentAudioRef.current = null;
              }
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
              }
              setStateSynced('recording');
              isSpeakingRef.current = true;
            }
          }

          if (final.trim()) {
            const finalText = final.trim();
            console.log('[DharmaAudio] Final spoken sentence:', finalText);
            onTranscriptionReceived?.(finalText, 'user');
            hasSentTurnTextRef.current = true;
            isSpeakingRef.current = false;
            isAgentGeneratingRef.current = true;
            latestTranscriptRef.current = '';
            setStateSynced('processing');
            clearTimeout(silenceTimeoutRef.current);

// Cancel any pending mediaRecorder
if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
  try {
    mediaRecorderRef.current.stop();
  } catch (e) { }
}

  // Send text directly to WebSocket
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: 'user_text', text: finalText }));
  }
} else if (interim.trim()) {
  latestTranscriptRef.current = interim.trim();
  onTranscriptionReceived?.(interim.trim(), 'user');
  if (stateRef.current !== 'recording') {
    setStateSynced('recording');
  }
}
        };

recognition.onerror = (e) => {
  if (e.error === 'no-speech') return;
  console.warn('[DharmaAudio] SpeechRecognition notice:', e.error);
  if (e.error === 'not-allowed') {
    onError?.(new Error('Microphone permission denied by browser.'));
  }
};

recognition.onend = () => {
  if (stateRef.current !== 'idle' && !stoppedManuallyRef.current) {
    try {
      recognition.start();
    } catch (e) { }
  }
};

recognitionRef.current = recognition;
      }
    } catch (err) {
  console.error('[DharmaAudio] getUserMedia error:', err);
  throw err;
}
  }, [onTranscriptionReceived, onError, setStateSynced]);

// ─── WebSocket Connection ──────────────────────────────────────────────────

const connectWebSocket = useCallback(() => {
  return new Promise((resolve, reject) => {
    const httpBase =
      import.meta.env.VITE_API_BASE ||
      (import.meta.env.PROD ? 'https://dharma-gpt-e.onrender.com' : 'http://localhost:8000');
    const wsBase = httpBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/voice/${persona}`;

    console.log('[DharmaAudio] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('[DharmaAudio] WebSocket connection timed out after 10s');
        ws.close();
        reject(new Error(`Connection timed out. Could not connect to backend at ${wsUrl}`));
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      setStateSynced('listening');
      resolve();
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
            try {
              const signal = JSON.parse(event.data);
              if (signal.type === 'agent_thinking') {
                isAgentGeneratingRef.current = true;
                setStateSynced('processing');
                if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
                processingTimeoutRef.current = setTimeout(() => {
                  if (stateRef.current === 'processing' && !isPlayingRef.current) {
                    console.warn('[DharmaAudio] Safety timeout — resetting from stuck processing state');
                    isAgentGeneratingRef.current = false;
                    setStateSynced('listening');
                  }
                  processingTimeoutRef.current = null;
                }, 25000);
}
    if (signal.type === 'user_transcription') {
      isSpeakingRef.current = false;
      onTranscriptionReceived?.(signal.text, 'user');
    }
      if (signal.type === 'verse_retrieved') {
        onVerseReceived?.(signal.ref, signal.verse);
      }
      if (signal.type === 'agent_speaking') {
        isAgentGeneratingRef.current = true;
        setStateSynced('speaking');
        onTranscriptionReceived?.(signal.text, 'ai');
      }
      if (signal.type === 'session_error') {
        console.warn('[DharmaAudio] Server message:', signal.message);
        onError?.(new Error(signal.message));
        isAgentGeneratingRef.current = false;
        if (!isPlayingRef.current) {
          setStateSynced('listening');
        }
      }
      if (signal.type === 'agent_done') {
        isAgentGeneratingRef.current = false;
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
        // Only go to listening if all queued audio has finished playing
        if (!isPlayingRef.current && audioQueueRef.current.length === 0 && !stoppedManuallyRef.current) {
          setStateSynced('listening');
        }
      }
    } catch (e) {
      console.error('[DharmaAudio] Signal parse error:', e);
    }
  } else if (event.data instanceof Blob) {
    if (stateRef.current === 'idle') return;

    // Never drop audio while active session
    audioQueueRef.current.push(event.data);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  }
};

ws.onclose = () => {
  setIsConnected(false);
  setStateSynced('idle');
};

ws.onerror = (err) => {
  console.error('[DharmaAudio] WebSocket error:', err);
  onError?.(new Error('WebSocket connection error'));
  setStateSynced('idle');
  reject(err);
};
    });
  }, [persona, setStateSynced, onTranscriptionReceived, onVerseReceived, onError, playNextAudio]);

// ─── Public API ────────────────────────────────────────────────────────────

const start = useCallback(async () => {
  stoppedManuallyRef.current = false;
  isAgentGeneratingRef.current = false;
  setError(null);

  if (stateRef.current !== 'idle' && stateRef.current !== 'error') {
    console.log('[DharmaAudio] Skipping start — already in state:', stateRef.current);
    return;
  }


  try {
    console.log('[DharmaAudio] Starting session for:', persona);
    setStateSynced('connecting');


    await setupMic();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) { }
    }


    await connectWebSocket();
    startVisualizerLoop();
  } catch (err) {
    console.error('[DharmaAudio] Start error:', err);
    setError(err.message || String(err));
    onError?.(err);
    setStateSynced('error');
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }
  }, [persona, setupMic, connectWebSocket, startVisualizerLoop, onError, setStateSynced]);

const stop = useCallback(() => {
  stoppedManuallyRef.current = true;
  isAgentGeneratingRef.current = false;
  stopVisualizerLoop();
  clearTimeout(silenceTimeoutRef.current);
  clearTimeout(processingTimeoutRef.current);
  processingTimeoutRef.current = null;

  audioQueueRef.current = [];
  isPlayingRef.current = false;
  if (currentAudioRef.current) {
    try {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    } catch (e) { }
    currentAudioRef.current = null;
  }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
      } catch (e) { }
    }


    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) { }
      mediaRecorderRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) { }
      audioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setStateSynced('idle');
    setFreqData(null);
  }, [stopVisualizerLoop, setStateSynced]);

const interrupt = useCallback(() => {
  audioQueueRef.current = [];
  isPlayingRef.current = false;

  isAgentGeneratingRef.current = false;

  if (currentAudioRef.current) {
    try {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    } catch (e) { }
    currentAudioRef.current = null;
  }

  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
  }

  setStateSynced('listening');
}, [setStateSynced]);

const setMuted = useCallback((isMuted) => {
  if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, []);

useEffect(() => {
  return () => stop();
}, [stop]);

return {
  state,
  error,
  freqData,
  start,
  stop,
  interrupt,
  isConnected,
  setMuted,
  stoppedManually: stoppedManuallyRef,
};
}
