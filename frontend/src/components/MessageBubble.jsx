import { Sparkles, Copy, Check, Volume2, ShieldCheck, Bookmark, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import React, { useState } from 'react';

const SAGE_CONFIGS = {
  krishna: {
    color: '#60a5fa',
    gold: '#f59e0b',
    border: 'rgba(59, 130, 246, 0.4)',
    bgGlow: 'rgba(59, 130, 246, 0.12)',
    title: 'Lord Krishna speaks',
    icon: '🪷',
    tradition: 'Bhagavad Gita'
  },
  chanakya: {
    color: '#f87171',
    gold: '#f97316',
    border: 'rgba(239, 68, 68, 0.4)',
    bgGlow: 'rgba(239, 68, 68, 0.12)',
    title: 'Acharya Chanakya decrees',
    icon: '📜',
    tradition: 'Arthashastra & Neeti'
  },
  laxmibai: {
    color: '#fbbf24',
    gold: '#ef4444',
    border: 'rgba(245, 158, 11, 0.4)',
    bgGlow: 'rgba(245, 158, 11, 0.12)',
    title: 'Rani Laxmibai proclaims',
    icon: '⚔️',
    tradition: 'Valor of Jhansi'
  }
};

const MessageBubble = ({ message, isSpeakingThis = false, onPlayVoice, onStopVoice }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';
  const charLower = message.character?.toLowerCase() || '';
  const sageKey = charLower.includes('chanakya') 
    ? 'chanakya' 
    : (charLower.includes('laxmi') ? 'laxmibai' : 'krishna');
  
  const sage = SAGE_CONFIGS[sageKey] || SAGE_CONFIGS.krishna;

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── User Message ───────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="animate-fade-in-right" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderRadius: '26px 26px 4px 26px',
          maxWidth: '82%',
          fontSize: '1.05rem',
          lineHeight: '1.65',
          fontWeight: '500',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
          position: 'relative'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
            Seeker's Inquiry
          </div>
          {message.text}
        </div>
      </div>
    );
  }

  // ─── System / Error Message ─────────────────────────────────────────────
  if (message.sender === 'system') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <div style={{
          background: 'rgba(220, 38, 38, 0.15)',
          color: '#fca5a5',
          padding: '0.85rem 1.6rem',
          borderRadius: '16px',
          maxWidth: '85%',
          fontSize: '0.95rem',
          fontWeight: '500',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)',
          backdropFilter: 'blur(20px)'
        }}>
          {message.text}
        </div>
      </div>
    );
  }

  // ─── AI (Sage) Message — Living Sacred Parchment ────────────────────────
  return (
    <div className="animate-fade-in-left msg-bubble-ai" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.75rem' }}>
      <div style={{
        padding: '1.85rem',
        borderRadius: '24px 24px 24px 4px',
        maxWidth: '92%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        border: `1px solid ${sage.border}`,
        borderLeft: `5px solid ${sage.color}`,
        position: 'relative',
        overflow: 'visible',
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px ${sage.bgGlow}`,
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(35px)',
        WebkitBackdropFilter: 'blur(35px)'
      }}>
        {/* Subtle Background Glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: `radial-gradient(circle at 10% 20%, ${sage.bgGlow} 0%, transparent 60%)`,
          pointerEvents: 'none', borderRadius: 'inherit'
        }} />

        {/* Sage Header & Identity */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: sage.bgGlow,
              border: `1px solid ${sage.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: `0 0 15px ${sage.color}40`
            }}>
              {sage.icon}
            </div>
            <div>
              <div style={{
                fontSize: '0.85rem',
                color: sage.color,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {sage.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                Tradition: {sage.tradition}
              </div>
            </div>
          </div>

          {/* Actions: Speak / Stop Voice & Copy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                if (isSpeakingThis) {
                  onStopVoice && onStopVoice();
                } else {
                  onPlayVoice && onPlayVoice(message.text, sageKey, message.id);
                }
              }}
              title={isSpeakingThis ? "Stop spoken counsel" : "Listen to spoken counsel"}
              style={{
                background: isSpeakingThis ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)',
                border: isSpeakingThis ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: isSpeakingThis ? '#fca5a5' : sage.color,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: isSpeakingThis ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              {isSpeakingThis ? (
                <>
                  <Square size={12} fill="#fca5a5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} />
                  <span>Listen</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              title="Copy sacred counsel"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = copied ? '#4ade80' : 'rgba(255,255,255,0.5)'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Message Body with Custom Sacred Markdown Styling */}
        <div className="markdown-body font-serif" style={{
          fontSize: '1.08rem',
          color: 'rgba(255,255,255,0.95)',
          lineHeight: '1.85',
          letterSpacing: '0.2px',
        }}>
          <ReactMarkdown
            components={{
              blockquote: ({node, ...props}) => (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
                  borderLeft: `4px solid ${sage.gold}`,
                  padding: '1.25rem 1.6rem',
                  borderRadius: '0 16px 16px 0',
                  margin: '1.4rem 0',
                  fontStyle: 'italic',
                  color: '#fef3c7',
                  boxShadow: 'inset 0 0 25px rgba(245, 158, 11, 0.05)',
                  borderTop: '1px solid rgba(245, 158, 11, 0.1)',
                  borderRight: '1px solid rgba(245, 158, 11, 0.1)',
                  borderBottom: '1px solid rgba(245, 158, 11, 0.1)'
                }} {...props} />
              ),
              hr: ({node, ...props}) => (
                <hr style={{
                  border: 'none',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${sage.color}80, transparent)`,
                  margin: '1.8rem 0',
                }} {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong style={{
                  color: sage.color,
                  fontWeight: '700',
                  textShadow: `0 0 15px ${sage.color}40`,
                  letterSpacing: '0.4px'
                }} {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul style={{ 
                  listStyleType: 'disc', 
                  paddingLeft: '1.6rem', 
                  margin: '1rem 0',
                  color: 'rgba(255,255,255,0.92)'
                }} {...props} />
              ),
              li: ({node, ...props}) => (
                <li style={{ 
                  marginBottom: '0.65rem',
                  paddingLeft: '0.4rem',
                  lineHeight: '1.75'
                }} {...props} />
              ),
              p: ({node, ...props}) => (
                <p style={{ marginBottom: '1.15rem' }} {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 style={{
                  color: sage.gold,
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  margin: '1.5rem 0 0.75rem',
                  letterSpacing: '0.5px'
                }} {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 style={{
                  color: sage.color,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '1.25rem 0 0.5rem'
                }} {...props} />
              )
            }}
          >
            {message.text || ""}
          </ReactMarkdown>

          {/* Streaming cursor with sacred golden glow */}
          {message.isStreaming && (
            <span className="streaming-cursor" style={{
              display: 'inline-block',
              width: '3px',
              height: '1.3em',
              background: sage.gold,
              boxShadow: `0 0 10px ${sage.gold}`,
              marginLeft: '4px',
              verticalAlign: 'text-bottom',
              animation: 'blink 0.9s step-end infinite',
            }} />
          )}
        </div>

        {/* Footer Seal of Counsel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '1px'
        }}>
          <Sparkles size={12} style={{ color: sage.gold }} />
          <span>Section 14 Validated Counsel • Grounded in Cosmic Dharma</span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
