import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PhoneOff, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles, 
  MessageSquare, 
  Radio, 
  ChevronRight,
  ShieldAlert,
  Activity
} from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import SacredCosmos from './SacredCosmos';
import PersonaArtBackdrop from './PersonaArtBackdrop';
import { useDharmaAudio } from '../lib/useDharmaAudio';
import { playSingingBowl, playSageChime, toggleMute as toggleGlobalMute, isMuted as isGlobalMuted } from '../lib/sacredAudio';

const PERSONAS = {
  krishna: {
    id: 'krishna',
    name: 'Lord Krishna',
    title: 'The Yogeshvara & Master Strategist',
    tradition: 'Bhagavad Gita',
    color: '#60a5fa',
    gold: '#f59e0b',
    icon: '🪷',
    tagline: 'Focus on duty, release attachment to the fruits.',
    statusPrefix: 'Lord Krishna is'
  },
  chanakya: {
    id: 'chanakya',
    name: 'Acharya Chanakya',
    title: 'The Kingmaker & Master Tactician',
    tradition: 'Arthashastra & Neeti',
    color: '#f87171',
    gold: '#f97316',
    icon: '📜',
    tagline: 'Master power, strategy, and self-discipline.',
    statusPrefix: 'Acharya is'
  },
  laxmibai: {
    id: 'laxmibai',
    name: 'Rani Laxmibai',
    title: 'The Fearless Warrior Queen of Jhansi',
    tradition: 'Valor & Righteous Defiance',
    color: '#fbbf24',
    gold: '#ef4444',
    icon: '⚔️',
    tagline: 'Main apni Jhansi nahi doongi — Stand unshakable.',
    statusPrefix: 'Rani Laxmibai is'
  }
};

const VoicePage = ({ activeMode = 'krishna', onBack }) => {
  const [currentPersonaKey, setCurrentPersonaKey] = useState(activeMode || 'krishna');
  const persona = PERSONAS[currentPersonaKey] || PERSONAS.krishna;

  const [transcript, setTranscript] = useState([
    { 
      role: 'ai', 
      text: "Mere priya dost... main yahan hoon. Btaiye, aaj kya chal raha hai aapke mann mein?" 
    }
  ]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [soundMuted, setSoundMuted] = useState(isGlobalMuted());
  const transcriptScrollRef = useRef(null);

  const audio = useDharmaAudio({
    persona: currentPersonaKey,
    onTranscriptionReceived: (text, role) => {
      setTranscript(prev => {
        if (prev.length === 0) return [{ role, text }];
        const last = prev[prev.length - 1];

        if (last.role === role) {
          if (role === 'user') {
            if (text.length < last.text.length * 0.5 && text.length > 0) {
              return [...prev, { role, text }];
            }
            const updated = { ...last, text };
            return [...prev.slice(0, -1), updated];
          } else {
            if (last.text.endsWith(text)) return prev;
            const updated = { ...last, text: last.text + " " + text };
            return [...prev.slice(0, -1), updated];
          }
        }
        return [...prev, { role, text }];
      });
    },
    onVerseReceived: (ref, verse) => {
      setTranscript(prev => [...prev, { role: 'ai', text: `[${ref}] ${verse}` }]);
    }
  });

  // Auto-connect on mount, cleanup on unmount
  useEffect(() => {
    audio.start();
    return () => {
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleSwitchPersona = (key) => {
    if (key !== currentPersonaKey) {
      setCurrentPersonaKey(key);
      playSageChime(key);
      if (audio.state !== 'idle') {
        audio.stop();
      }
    }
  };

  const handleToggleSound = () => {
    const next = toggleGlobalMute();
    setSoundMuted(next);
    if (!next) playSingingBowl(528);
  };

  const statusDisplay = useMemo(() => {
    switch (audio.state) {
      case 'connecting':
        return {
          title: 'CONNECTING SANCTUARY',
          subtitle: 'Aligning with the ancient scripture stream...',
          badge: 'Connecting',
          badgeColor: '#f59e0b'
        };
      case 'listening':
        return {
          title: `${persona.name.toUpperCase()} IS LISTENING`,
          subtitle: 'Speak your burden openly. VAD detects your voice naturally.',
          badge: 'Listening',
          badgeColor: '#38bdf8'
        };
      case 'recording':
        return {
          title: 'HEARING YOUR DILEMMA',
          subtitle: 'Transcribing your words into the stream of counsel...',
          badge: 'Transcribing',
          badgeColor: '#4ade80'
        };
      case 'processing':
      case 'thinking':
        return {
          title: 'CONTEMPLATING THE SCRIPTURES',
          subtitle: 'Consulting the Gita, Mahabharata & Arthashastra...',
          badge: 'Contemplating',
          badgeColor: '#f59e0b'
        };
      case 'speaking':
        return {
          title: `${persona.name.toUpperCase()} IS SPEAKING`,
          subtitle: 'Heed the timeless words of righteousness...',
          badge: 'Speaking',
          badgeColor: persona.color
        };
      case 'error':
        return {
          title: 'COMMUNICATION NOTICE',
          subtitle: audio.error || 'Connection interrupted. Tap retry to reconnect.',
          badge: 'Offline',
          badgeColor: '#f87171'
        };
      default:
        return {
          title: 'SANCTUARY READY',
          subtitle: `Inquire of ${persona.name} via real-time speech`,
          badge: 'Online',
          badgeColor: '#4ade80'
        };
    }
  }, [audio.state, audio.error, persona]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
      color: '#fff',
      padding: '1.5rem 2rem'
    }}>
      {/* Living Cosmic Canvas with Sacred Embers & Sacred Geometry */}
      <SacredCosmos activeMode={currentPersonaKey} intensity="high" />

      {/* Living Persona Silhouette Artwork Backdrop */}
      <PersonaArtBackdrop
        persona={currentPersonaKey}
        variant="voice"
        isSpeaking={audio.state === 'speaking' || audio.state === 'recording'}
      />

      {/* ─── Top Header & Controls ────────────────────────────────────────── */}
      <header style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20
      }}>
        {/* Back to Text Sanctuary */}
        <button
          onClick={() => {
            audio.stop();
            onBack();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '10px 18px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeft size={18} />
          <span>Text Sanctuary</span>
        </button>

        {/* Mid-Session Sage Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 10px',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          {Object.values(PERSONAS).map(p => {
            const isSelected = p.id === currentPersonaKey;
            return (
              <button
                key={p.id}
                onClick={() => handleSwitchPersona(p.id)}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${p.color}30 0%, ${p.gold}40 100%)`
                    : 'transparent',
                  border: isSelected ? `1px solid ${p.color}80` : '1px solid transparent',
                  borderRadius: '25px',
                  padding: '7px 16px',
                  color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease',
                  boxShadow: isSelected ? `0 0 20px ${p.color}40` : 'none'
                }}
              >
                <span>{p.icon}</span>
                <span className="hidden-mobile">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowTranscript(prev => !prev)}
            title="Toggle Live Transcript Scroll"
            style={{
              background: showTranscript ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${showTranscript ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '12px',
              padding: '10px',
              color: showTranscript ? '#fbbf24' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(20px)'
            }}
          >
            <Activity size={18} />
          </button>

          <button
            onClick={handleToggleSound}
            title={soundMuted ? 'Unmute' : 'Mute'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '10px',
              color: soundMuted ? 'rgba(255,255,255,0.4)' : '#fbbf24',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(20px)'
            }}
          >
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {/* ─── Center Sanctuary: The Living Orb & Presence ─────────────────── */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        margin: 'auto 0'
      }}>
        {/* The 3D Living Sacred Orb */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <VoiceOrb
            state={audio.state}
            freqData={audio.freqData}
            persona={currentPersonaKey}
            size={360}
            onClick={audio.state === 'speaking' ? audio.interrupt : undefined}
          />
        </div>

        {/* Presence Status Narrative */}
        <div style={{ textAlign: 'center', maxWidth: '650px', padding: '0 1rem' }}>
          {/* Persona Seal Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '30px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${persona.color}60`,
            marginBottom: '1rem',
            boxShadow: `0 0 20px ${persona.color}30`
          }}>
            <span style={{ fontSize: '1rem' }}>{persona.icon}</span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: persona.color
            }}>
              {persona.name} • {statusDisplay.badge}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
            marginBottom: '0.6rem',
            color: '#ffffff'
          }}>
            {statusDisplay.title}
          </h1>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.6',
            marginBottom: '1.75rem'
          }}>
            {statusDisplay.subtitle}
          </p>

          {/* Primary Action Button (When Idle, Error or Connecting) */}
          {(audio.state === 'idle' || audio.state === 'error' || audio.state === 'connecting') && (
            <button
              onClick={() => {
                if (audio.state === 'connecting') {
                  audio.stop();
                } else {
                  playSingingBowl(528);
                  audio.start();
                }
              }}
              style={{
                background: audio.state === 'connecting'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : `linear-gradient(135deg, ${persona.gold} 0%, #d97706 100%)`,
                color: audio.state === 'connecting' ? '#fff' : '#000',
                padding: '1.1rem 2.8rem',
                borderRadius: '40px',
                fontSize: '1.05rem',
                fontWeight: '800',
                letterSpacing: '1px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: `0 10px 40px ${persona.color}40`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 15px 50px ${persona.color}60`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 10px 40px ${persona.color}40`;
              }}
            >
              <Mic size={20} />
              <span>
                {audio.state === 'error'
                  ? 'RETRY VOICE CONNECTION'
                  : audio.state === 'connecting'
                  ? 'CANCELING...'
                  : 'BEGIN VOICE COUNSEL'}
              </span>
            </button>
          )}

          {/* When Sage is speaking, offer instant interruption */}
          {audio.state === 'speaking' && (
            <button
              onClick={audio.interrupt}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <span>Tap to Interrupt & Speak</span>
            </button>
          )}
        </div>
      </main>

      {/* ─── Floating Live Transcript Scroll (Always Accessible) ───────────── */}
      {showTranscript && (
        <div style={{
          position: 'fixed',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '340px',
          maxHeight: '45vh',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '1.25rem',
          backdropFilter: 'blur(35px)',
          WebkitBackdropFilter: 'blur(35px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 30
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: persona.color
            }}>
              <Activity size={14} />
              <span>Live Dialogue</span>
            </div>
            <button
              onClick={() => setShowTranscript(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              ✕
            </button>
          </div>

          <div
            ref={transcriptScrollRef}
            style={{
              overflowY: 'auto',
              maxHeight: '32vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingRight: '6px'
            }}
            className="custom-scrollbar"
          >
            {transcript.map((item, idx) => {
              const isAi = item.role === 'ai';
              return (
                <div
                  key={idx}
                  style={{
                    background: isAi ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    borderLeft: isAi ? `3px solid ${persona.color}` : '3px solid rgba(255,255,255,0.3)',
                    borderRadius: '0 12px 12px 0',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    lineHeight: '1.5'
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: isAi ? persona.gold : 'rgba(255,255,255,0.5)',
                    marginBottom: '4px'
                  }}>
                    {isAi ? persona.name : 'You'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Bottom Sanctuary Navigation Console ───────────────────────────── */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '12px 32px',
        borderRadius: '50px',
        backdropFilter: 'blur(35px)',
        WebkitBackdropFilter: 'blur(35px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        zIndex: 25,
        marginBottom: '1rem'
      }}>
        {/* Mic Toggle */}
        <button
          onClick={() => {
            const next = !isMicMuted;
            setIsMicMuted(next);
            if (audio.setMuted) audio.setMuted(next);
          }}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            background: isMicMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${isMicMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isMicMuted ? '#f87171' : '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Call / Return to Chat */}
        <button
          onClick={() => {
            audio.stop();
            setTimeout(onBack, 150);
          }}
          title="End Voice Sanctuary"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(6deg)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(239, 68, 68, 0.7)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.5)';
          }}
        >
          <PhoneOff size={28} />
        </button>
      </footer>
    </div>
  );
};

export default VoicePage;
