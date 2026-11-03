// Sacred Audio Synthesizer — Pure Web Audio API (Zero external assets needed)
// Synthesizes singing bowls, temple gongs, and celestial harmonics in real-time.

let audioCtx = null;
let isAudioMuted = localStorage.getItem('dharma_audio_muted') === 'true';
let ambientGain = null;
let ambientOscillators = [];

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const isMuted = () => isAudioMuted;

export const toggleMute = () => {
  isAudioMuted = !isAudioMuted;
  localStorage.setItem('dharma_audio_muted', isAudioMuted ? 'true' : 'false');
  if (isAudioMuted && ambientGain) {
    ambientGain.gain.setTargetAtTime(0, audioCtx?.currentTime || 0, 0.2);
  }
  return isAudioMuted;
};

/**
 * Plays a resonant Tibetan Singing Bowl / Temple Bell chime
 * @param {number} baseFreq Base frequency (default 432Hz or 528Hz)
 */
export const playSingingBowl = (baseFreq = 432) => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    masterGain.connect(ctx.destination);

    // Overtones corresponding to acoustic singing bowls
    const partials = [
      { ratio: 1.0, gain: 0.6 },
      { ratio: 2.76, gain: 0.25 },
      { ratio: 5.4, gain: 0.12 },
      { ratio: 8.9, gain: 0.05 }
    ];

    partials.forEach(({ ratio, gain }) => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      
      // Slight pitch drift for acoustic organic warmth
      osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 0.998, now + 2.5);

      pGain.gain.setValueAtTime(gain, now);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(pGain);
      pGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 3.0);
    });
  } catch (err) {
    // Graceful silence if audio is blocked
  }
};

/**
 * Resonant celestial chime when selecting a sage
 */
export const playSageChime = (persona = 'krishna') => {
  if (isAudioMuted) return;
  const freqMap = {
    krishna: 528,   // Transformation / Solfeggio Love frequency
    chanakya: 396,  // Grounding / Liberation from fear
    laxmibai: 639,  // Courage & Connection
  };
  playSingingBowl(freqMap[persona] || 432);
};

/**
 * Subtle click / waterdrop when sending a message
 */
export const playSendRipple = () => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
};

