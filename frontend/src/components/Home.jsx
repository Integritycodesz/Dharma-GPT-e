import { useState, useEffect } from 'react';
import { Mic, Sparkles, Brain, Shield, Compass, ChevronRight, Volume2, VolumeX, Flame, ScrollText, MessageSquareQuote } from 'lucide-react';
import SacredCosmos from './SacredCosmos';
import HomeCosmicBackdrop from './HomeCosmicBackdrop';
import { playSingingBowl, playSageChime, toggleMute, isMuted } from '../lib/sacredAudio';

const SAGES = [
  {
    id: 'krishna',
    name: 'Lord Krishna',
    title: 'The Yogeshvara & Master Strategist',
    tradition: 'Bhagavad Gita',
    themeColor: '#3b82f6',
    accentColor: '#f59e0b',
    auraRgba: 'rgba(59, 130, 246, 0.25)',
    greeting: 'Whenever Dharma declines, I manifest to restore cosmic order.',
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    domain: 'Duty, Karma, Inner Peace & Detachment',
    icon: '🪷',
    tag: 'Karma Yoga'
  },
  {
    id: 'chanakya',
    name: 'Acharya Chanakya',
    title: 'The Kingmaker & Master Tactician',
    tradition: 'Arthashastra & Neeti',
    themeColor: '#ef4444',
    accentColor: '#f97316',
    auraRgba: 'rgba(239, 68, 68, 0.25)',
    greeting: 'A man is great by deeds, not by birth. Master power with wisdom.',
    sanskrit: 'सुखस्य मूलं धर्मः धर्मस्य मूलं अर्थः',
    domain: 'Realpolitik, Wealth, Strategy & Discipline',
    icon: '📜',
    tag: 'Raja Neeti'
  },
  {
    id: 'laxmibai',
    name: 'Rani Laxmi Bai',
    title: 'The Fearless Warrior Queen of Jhansi',
    tradition: 'Valiant History & Justice',
    themeColor: '#f59e0b',
    accentColor: '#dc2626',
    auraRgba: 'rgba(245, 158, 11, 0.25)',
    greeting: 'Main apni Jhansi nahi doongi — Stand unshakable in adversity.',
    sanskrit: 'सिंहासन हिल उठे राजवंशों ने भृकुटी तानी थी',
    domain: 'Courage, Resilience, Defiance & Right Action',
    icon: '⚔️',
    tag: 'Veer Dharma'
  }
];

const DILEMMAS = [
  { text: 'Should I prioritize my duty over personal happiness?', sage: 'krishna' },
  { text: 'How do I handle betrayal from someone I trusted?', sage: 'chanakya' },
  { text: 'How do I conquer crippling fear before a major challenge?', sage: 'laxmibai' },
  { text: 'How to quiet an anxious, overthinking mind when stakes are high?', sage: 'krishna' },
  { text: 'Is it ethical to use cunning against an unjust opponent?', sage: 'chanakya' }
];

const Home = ({ onStart, onStartVoice }) => {
  const [selectedSage, setSelectedSage] = useState('krishna');
  const [muted, setMuted] = useState(isMuted());
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    // Soft introductory bell on mount
    const timer = setTimeout(() => {
      playSingingBowl(528);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSoundToggle = () => {
    const next = toggleMute();
    setMuted(next);
    if (!next) {
      playSingingBowl(528);
    }
  };

  const handleSelectSage = (id) => {
    setSelectedSage(id);
    playSageChime(id);
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#fff',
      padding: '2rem 1.5rem 5rem'
    }}>
      {/* Universal Golden Cosmic Mandala Backdrop for the Council Portal */}
      <HomeCosmicBackdrop />

      {/* Living Cosmic Canvas with Sacred Embers & Sacred Geometry */}
      <SacredCosmos activeMode={selectedSage} intensity="high" />

      {/* Top Floating Navigation Bar */}
      <nav style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f59e0b 0%, #d97706 70%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.5)'
          }}>
            🕉️
          </div>
          <div>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: '800',
              letterSpacing: '1px',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 50%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Dharma<span style={{ color: '#f59e0b', WebkitTextFillColor: '#f59e0b' }}>GPT</span>
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '-2px'
            }}>
              Council of Sages
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSoundToggle}
            title={muted ? 'Unmute sacred resonance' : 'Mute sacred resonance'}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: muted ? 'rgba(255,255,255,0.4)' : '#f59e0b',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: muted ? 'none' : '0 0 15px rgba(245, 158, 11, 0.3)'
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={() => onStartVoice(selectedSage)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '8px 16px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Mic size={15} />
            <span>Voice Sanctuary</span>
          </button>
        </div>
      </nav>

      {/* Hero Section — Magnificent Sudarshana Chakra with Action Buttons Below */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '2rem 0 3.5rem',
        zIndex: 10
      }}>
        {/* The Grand Rotating Sudarshana Chakra */}
        <div style={{
          position: 'relative',
          width: 'min(460px, 76vw)',
          height: 'min(460px, 76vw)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Subtle Outer Concentric Sacred Geometry Ring */}
          <div style={{
            position: 'absolute',
            inset: '-18px',
            borderRadius: '50%',
            border: '1px dashed rgba(245, 158, 11, 0.28)',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.1)',
            animation: 'spinChakraReverse 80s linear infinite',
            pointerEvents: 'none'
          }} />

          {/* Ultra-High Definition Rotating Chakra Disc */}
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/chakra-hd.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'contrast(1.15) brightness(1.05) drop-shadow(0 0 22px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 50px rgba(234, 88, 12, 0.25))',
            animation: 'spinChakra 30s linear infinite'
          }} />

          {/* Central Luminous Jewel Hub Glow */}
          <div style={{
            position: 'absolute',
            width: 'min(70px, 12vw)',
            height: 'min(70px, 12vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 245, 0.95) 0%, rgba(245, 158, 11, 0.45) 45%, transparent 75%)',
            filter: 'blur(6px)',
            animation: 'chakraAuraPulse 3s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Primary CTA Buttons — Guaranteed Zero Overlap Directly Below Chakra */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.25rem',
          marginTop: '2.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => onStart(selectedSage)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000',
              padding: '1.1rem 2.5rem',
              borderRadius: '35px',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              boxShadow: '0 10px 40px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(245, 158, 11, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(245, 158, 11, 0.4)';
            }}
          >
            <span>CONSULT THE COUNCIL</span>
            <ChevronRight size={22} />
          </button>

          <button
            onClick={() => onStartVoice(selectedSage)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              padding: '1.1rem 2rem',
              borderRadius: '35px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = '#60a5fa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }}
          >
            <Mic size={18} style={{ color: '#60a5fa' }} />
            <span>Voice Sanctuary</span>
          </button>
        </div>
      </div>

      {/* Council of Sages Living Cards */}
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '2rem 0',
        zIndex: 10
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <span style={{
            fontSize: '0.8rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: '700'
          }}>
            Choose Your Guide
          </span>
          <h2 style={{
            fontSize: '1.75rem',
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            marginTop: '0.25rem'
          }}>
            The Three Sages of Insight
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1.5rem',
          width: '100%'
        }}>
          {SAGES.map((sage) => {
            const isSelected = selectedSage === sage.id;
            const isHovered = hoveredCard === sage.id;

            return (
              <div
                key={sage.id}
                onClick={() => handleSelectSage(sage.id)}
                onMouseEnter={() => setHoveredCard(sage.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isSelected 
                    ? `linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)`
                    : 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(30px)',
                  borderRadius: '24px',
                  padding: '1.75rem',
                  border: isSelected 
                    ? `2px solid ${sage.themeColor}`
                    : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected || isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: isSelected
                    ? `0 20px 50px ${sage.auraRgba}, inset 0 0 30px ${sage.auraRgba}`
                    : '0 10px 30px rgba(0,0,0,0.4)'
                }}
              >
                {/* Sage Aura Ambient Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-40%',
                  right: '-40%',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: sage.themeColor,
                  filter: 'blur(80px)',
                  opacity: isSelected ? 0.35 : 0.1,
                  pointerEvents: 'none',
                  transition: 'opacity 0.4s ease'
                }} />

                {/* Top Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: `rgba(${sage.id === 'krishna' ? '59, 130, 246' : sage.id === 'chanakya' ? '239, 68, 68' : '245, 158, 11'}, 0.15)`,
                    border: `1px solid ${sage.themeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    boxShadow: `0 0 20px ${sage.auraRgba}`
                  }}>
                    {sage.icon}
                  </div>

                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: isSelected ? sage.themeColor : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#000' : 'rgba(255,255,255,0.6)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {sage.tag}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '1.45rem',
                  fontWeight: '700',
                  marginBottom: '0.25rem',
                  color: isSelected ? sage.accentColor : '#fff'
                }}>
                  {sage.name}
                </h3>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '1rem',
                  fontWeight: '500'
                }}>
                  {sage.title}
                </p>

                {/* Sanskrit Verse Fragment */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  borderLeft: `3px solid ${sage.themeColor}`,
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  marginBottom: '1.25rem'
                }}>
                  "{sage.sanskrit}"
                </div>

                {/* Domain Focus */}
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: '1.5',
                  marginBottom: '1.5rem'
                }}>
                  <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Domain: </strong>
                  {sage.domain}
                </div>

                {/* Select / Seek Counsel Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(sage.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: '14px',
                    background: isSelected ? sage.themeColor : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#000' : '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>Seek Counsel</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sparks of Inquiry — Quick Dilemmas */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '2rem 0',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.85rem',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: '700'
        }}>
          <MessageSquareQuote size={16} style={{ color: '#f59e0b' }} />
          <span>Sparks of Inquiry (Click to Seek Counsel)</span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {DILEMMAS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onStart(item.sage, item.text)}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '10px 18px',
                borderRadius: '25px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(20px)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{item.text}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.5, color: '#f59e0b' }}>
                → {item.sage === 'krishna' ? 'Krishna' : item.sage === 'chanakya' ? 'Chanakya' : 'Laxmibai'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sacred Pillars Overview Footer */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        marginTop: '3rem',
        padding: '2rem',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
            <Brain size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Cognitive RAG Retrieval</h4>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
              Pulls exact ancient parallels from ChromaDB vector archives of the Gita and Arthashastra.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#fbbf24' }}>
            <Shield size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Dharma Metric Alignment</h4>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
              Evaluates ethical alignment on a sacred 2–9 scale to guide decisions toward cosmic righteousness.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#f87171' }}>
            <Mic size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Live Vocal Presence</h4>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
              Organic living voice orb powered by real-time voice streaming with sub-second feedback.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '3rem',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        zIndex: 10
      }}>
        DharmaGPT • The Digital Sage Architecture • 2026
      </div>
    </div>
  );
};

export default Home;
