import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InsightPanel from './InsightPanel';
import VoiceUI from './VoiceUI';
import HistorySidebar from './HistorySidebar';
import UserProfileModal from './UserProfileModal';
import SacredCosmos from './SacredCosmos';
import PersonaArtBackdrop from './PersonaArtBackdrop';
import { useChatHistory } from '../hooks/useChatHistory';
import { playSingingBowl, playSageChime, playSendRipple, toggleMute, isMuted } from '../lib/sacredAudio';
import { Menu, Sparkles, Server, User, ArrowLeft, Volume2, VolumeX, MessageSquare, Flame, Square } from 'lucide-react';
import { playSageVoice, stopSageVoice, isSageVoicePlaying } from '../lib/sageVoiceService';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://dharma-gpt-e.onrender.com' : 'http://localhost:8000');

const PERSONA_CONFIGS = {
  krishna: {
    id: 'krishna',
    label: 'Lord Krishna',
    icon: '🪷',
    subtitle: 'The Yogeshvara & Master Strategist',
    color: '#60a5fa',
    gold: '#f59e0b',
    quote: 'Karmanye vadhikaraste ma phaleshu kadachana — Focus on duty, release the fruit.',
    thinking: 'Lord Krishna is contemplating the cosmic threads of your Karma...'
  },
  chanakya: {
    id: 'chanakya',
    label: 'Acharya Chanakya',
    icon: '📜',
    subtitle: 'The Kingmaker & Master Tactician',
    color: '#f87171',
    gold: '#f97316',
    quote: 'Knowledge is supreme power; act with calculated strategy and unfaltering discipline.',
    thinking: 'Acharya Chanakya is calculating strategic outcomes & Neeti...'
  },
  laxmibai: {
    id: 'laxmibai',
    label: 'Rani Laxmibai',
    icon: '⚔️',
    subtitle: 'The Fearless Warrior Queen of Jhansi',
    color: '#fbbf24',
    gold: '#ef4444',
    quote: 'Stand firm in the face of injustice. Righteous defiance breaks all chains.',
    thinking: 'Rani Laxmibai is rallying the spirit of courage & valiant action...'
  }
};

const SUGGESTED_DILEMMAS = {
  krishna: [
    'How do I overcome grief and attachment to the past?',
    'Should I leave my safe job to follow my true calling?',
    'How can I act without being paralyzed by fear of failure?'
  ],
  chanakya: [
    'How do I handle deceit and politics in my workplace?',
    'How should I rebuild when all resources and trust seem lost?',
    'When should one negotiate, and when should one fight back?'
  ],
  laxmibai: [
    'How do I find the courage to stand alone against the crowd?',
    'How to turn overwhelming defeat into fierce resilience?',
    'Dealing with self-doubt when everyone expects me to lead.'
  ]
};

const ChatInterface = ({ onStartVoice, activeMode: propMode, onModeChange, initialQuery, onBackHome }) => {
  const [messages, setMessages] = useState([]);
  const [activeMode, setActiveMode] = useState(propMode || 'krishna');
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latestInsight, setLatestInsight] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [isStreaming, setIsStreaming] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const [autoVoice, setAutoVoice] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const initialHandledRef = useRef(false);
  const { sessions, saveSession } = useChatHistory();
  const [sessionId, setSessionId] = useState(() => "sess-" + Math.random().toString(36).substring(2, 9));
  const scrollRef = useRef(null);

  const currentPersona = PERSONA_CONFIGS[activeMode] || PERSONA_CONFIGS.krishna;

  // Server health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        setServerStatus(res.ok ? 'online' : 'offline');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save session when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(sessionId, messages, activeMode);
    }
  }, [messages, sessionId, activeMode]);

  // Smooth auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isSpeaking, isStreaming]);

  // Handle initialQuery passed from Home
  useEffect(() => {
    if (initialQuery && !initialHandledRef.current) {
      initialHandledRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleSelectHistory = (historyItem) => {
    setMessages(historyItem.messages || []);
    setSessionId(historyItem.id);
    setLatestInsight(null);
    setIsHistoryOpen(false);
  };

  const handleNewChat = () => {
    setSessionId("sess-" + Math.random().toString(36).substring(2, 9));
    setMessages([]);
    setLatestInsight(null);
    setIsHistoryOpen(false);
  };

  const handleSoundToggle = () => {
    const next = toggleMute();
    setMuted(next);
    if (!next) playSingingBowl(528);
  };

  // Stop voice on unmount
  useEffect(() => {
    return () => {
      stopSageVoice();
    };
  }, []);

  const handleStopVoice = () => {
    stopSageVoice();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  const handlePlaySpecificMessage = (text, persona, msgId) => {
    if (speakingMsgId === msgId && isSpeaking) {
      handleStopVoice();
      return;
    }
    handleStopVoice();
    setSpeakingMsgId(msgId);
    setIsSpeaking(true);
    playSageVoice(
      text,
      persona || activeMode,
      () => {
        setIsSpeaking(true);
        setSpeakingMsgId(msgId);
      },
      () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      }
    );
  };

  const handleSwitchPersona = (id) => {
    handleStopVoice();
    if (activeMode !== id) {
      setActiveMode(id);
      if (onModeChange) onModeChange(id);
      playSageChime(id);
      handleNewChat();
    }
  };

  // ─── Streaming Chat Handler ─────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    playSendRipple();

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setIsSpeaking(false);

    const aiMsgId = Date.now() + 1;
    const aiMsg = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      character: currentPersona.label,
      isStreaming: true,
    };

    try {
      const streamUrl = `${API_BASE}/chat/stream?query=${encodeURIComponent(text)}&session_id=${encodeURIComponent(sessionId)}&persona=${activeMode}`;
      const response = await fetch(streamUrl);

      if (!response.ok) {
        throw new Error(`Failed to connect to ${currentPersona.label}.`);
      }

      setIsThinking(false);
      setIsStreaming(true);
      setMessages(prev => [...prev, aiMsg]);
      playSingingBowl(activeMode === 'krishna' ? 528 : activeMode === 'chanakya' ? 396 : 639);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) throw new Error(data.error);
              if (data.text) {
                fullText += data.text;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === aiMsgId ? { ...m, text: fullText } : m
                  )
                );
              }
            } catch (e) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);

      // Auto-speak sage counsel once complete generation of text finishes
      if (autoVoice && fullText.trim()) {
        setIsSpeaking(true);
        setSpeakingMsgId(aiMsgId);
        playSageVoice(
          fullText,
          activeMode,
          () => {
            setIsSpeaking(true);
            setSpeakingMsgId(aiMsgId);
          },
          () => {
            setIsSpeaking(false);
            setSpeakingMsgId(null);
          }
        );
      } else {
        setIsSpeaking(false);
      }

    } catch (err) {
      console.warn('Streaming failed:', err);
      setIsThinking(false);
      setIsStreaming(false);
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.id === aiMsgId && !m.text));
        return [...filtered, {
          id: Date.now() + 2,
          sender: 'system',
          text: `⚠️ Wisdom Retrieval Notice: ${err.message}`
        }];
      });
    }
  };

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* Living Cosmic Canvas with Sacred Embers & Sacred Geometry */}
      <SacredCosmos activeMode={activeMode} intensity="normal" />

      {/* Living Persona Silhouette Artwork Backdrop */}
      <PersonaArtBackdrop
        persona={activeMode}
        variant="chat"
        isSpeaking={isSpeaking}
      />

      {/* Left Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        sessions={sessions}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
        onNewChat={handleNewChat}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Floating Top Sanctuary Bar */}
        <header style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          background: 'rgba(10, 15, 29, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          zIndex: 20
        }}>
          {/* Left Actions: Return Home & Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackHome && (
              <button
                onClick={onBackHome}
                title="Return to Council Home"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              >
                <ArrowLeft size={16} />
                <span className="hidden-mobile">Council</span>
              </button>
            )}

            {!isHistoryOpen && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                title="Past Inquiries"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              >
                <Menu size={18} />
              </button>
            )}
          </div>

          {/* Center: The Sages Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: '35px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            {Object.values(PERSONA_CONFIGS).map(persona => {
              const isSelected = activeMode === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => handleSwitchPersona(persona.id)}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, ${persona.color}25 0%, ${persona.gold}35 100%)`
                      : 'transparent',
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    border: isSelected ? `1px solid ${persona.color}60` : '1px solid transparent',
                    padding: '8px 18px',
                    borderRadius: '25px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? `0 0 20px ${persona.color}40` : 'none'
                  }}
                >
                  <span>{persona.icon}</span>
                  <span className="hidden-mobile">{persona.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Voice Toggle, Sound, Server Status, Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Active Speaking Stop Button */}
            {isSpeaking && (
              <button
                onClick={handleStopVoice}
                title="Stop spoken counsel"
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                  animation: 'pulseGlow 2s infinite'
                }}
              >
                <Square size={12} fill="#fca5a5" />
                <span>Stop Voice</span>
              </button>
            )}

            {/* Auto-Voice Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) handleStopVoice();
                setAutoVoice(prev => !prev);
              }}
              title={autoVoice ? "Auto-Voice is active (Speaks after generation)" : "Auto-Voice is muted"}
              style={{
                background: autoVoice ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                border: autoVoice ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: autoVoice ? '#93c5fd' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Volume2 size={13} style={{ color: autoVoice ? '#60a5fa' : 'inherit' }} />
              <span className="hidden-mobile">Auto-Voice: {autoVoice ? 'ON' : 'OFF'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              title={muted ? 'Unmute sacred resonance' : 'Mute sacred resonance'}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: muted ? 'rgba(255,255,255,0.4)' : '#fbbf24',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Server Status Indicator */}
            <div
              title={`Cloud Backend: ${serverStatus}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${serverStatus === 'online' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: serverStatus === 'online' ? '#4ade80' : '#f87171',
                fontSize: '0.75rem',
                fontWeight: '600',
                letterSpacing: '1px'
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: serverStatus === 'online' ? '#4ade80' : '#f87171',
                boxShadow: serverStatus === 'online' ? '0 0 8px #4ade80' : '0 0 8px #f87171'
              }} />
              <span className="hidden-mobile">{serverStatus}</span>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              title="Seeker Profile"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <User size={15} style={{ color: currentPersona.color }} />
            </button>
          </div>
        </header>

        {/* Message Feed / Sacred Dialogue Scroll */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            maxWidth: '940px',
            width: '100%',
            margin: '0 auto',
            paddingBottom: '220px',
            scrollBehavior: 'smooth'
          }}
        >
          {messages.length === 0 ? (
            /* Empty State: Sacred Invocation Shrine */
            <div className="animate-fade-in" style={{
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '680px',
              padding: '2rem 1rem'
            }}>
              {/* Luminous Pulsing Sacred Seal */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${currentPersona.color}35 0%, rgba(0,0,0,0.4) 80%)`,
                border: `2px solid ${currentPersona.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                marginBottom: '1.5rem',
                boxShadow: `0 0 40px ${currentPersona.color}50`
              }}>
                {currentPersona.icon}
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '800',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                marginBottom: '0.5rem',
                color: '#ffffff'
              }}>
                Seek Counsel from {currentPersona.label}
              </h2>

              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-serif)',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                "{currentPersona.quote}"
              </p>

              {/* Suggested Dilemmas */}
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: '700',
                  marginBottom: '4px'
                }}>
                  Common Paths of Inquiry
                </div>
                {(SUGGESTED_DILEMMAS[activeMode] || []).map((dilemma, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(dilemma)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '12px 18px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = currentPersona.color;
                      e.currentTarget.style.background = `rgba(15, 23, 42, 0.9)`;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>{dilemma}</span>
                    <span style={{ color: currentPersona.gold, fontSize: '1rem' }}>✦</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSpeakingThis={speakingMsgId === msg.id && isSpeaking}
                onPlayVoice={(text, persona, id) => handlePlaySpecificMessage(text, persona, id)}
                onStopVoice={handleStopVoice}
              />
            ))
          )}

          {/* Mesmerizing Sacred Yantra Contemplation Orb */}
          {isThinking && (
            <div className="animate-fade-in-left" style={{ margin: '1rem 0' }}>
              <div style={{
                padding: '1.25rem 1.75rem',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${currentPersona.color}50`,
                backdropFilter: 'blur(30px)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                maxWidth: '85%',
                boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 25px ${currentPersona.color}30`
              }}>
                {/* Spinning Concentric Sacred Lotus/Yantra */}
                <div style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `2px dashed ${currentPersona.color}`,
                    animation: 'cosmicRotate 4s linear infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '6px',
                    borderRadius: '50%',
                    border: `2px solid ${currentPersona.gold}`,
                    animation: 'cosmicRotate 2s linear infinite reverse'
                  }} />
                  <span style={{ fontSize: '0.85rem' }}>{currentPersona.icon}</span>
                </div>

                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: currentPersona.color,
                    fontWeight: '700',
                    letterSpacing: '0.3px'
                  }}>
                    {currentPersona.thinking}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                    Searching scripture archives for parallel dilemmas...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Input Sanctuary (VoiceUI) */}
        <VoiceUI
          onSend={handleSendMessage}
          isSageThinking={isThinking}
          isSageSpeaking={isSpeaking}
          onStopVoice={handleStopVoice}
          onLiveTalk={() => onStartVoice(activeMode)}
          isLiveMode={false}
          placeholder={`Inquire of ${currentPersona.label}...`}
        />
      </div>

      {/* Side Insight Panel */}
      <InsightPanel isOpen={isInsightOpen} insight={latestInsight} />

      {/* User Context Profile Modal */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default ChatInterface;
