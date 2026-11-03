import React, { useState } from 'react';
import { Send, Mic, Sparkles, Square } from 'lucide-react';

const VoiceUI = ({ onSend, isSageThinking, isSageSpeaking, onStopVoice, onLiveTalk, isLiveMode, placeholder }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && !isSageThinking && !isSageSpeaking) {
      onSend(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = Boolean(inputText.trim());

  return (
    <div style={{
      position: 'absolute',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2.5rem)',
      maxWidth: '880px',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      {/* Speaking / Thinking Floating Pill */}
      {(isSageThinking || isSageSpeaking) && (
        <div className="animate-fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 22px',
          background: 'rgba(10, 15, 29, 0.9)',
          backdropFilter: 'blur(25px)',
          borderRadius: '50px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.2)'
        }}>
          {isSageSpeaking ? (
            <>
              <div className="speaking-waveform">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="speaking-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.85rem' }}>
                Sage is speaking...
              </span>
              {onStopVoice && (
                <button
                  onClick={onStopVoice}
                  style={{
                    marginLeft: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                  }}
                  title="Stop voice playback"
                >
                  <Square size={10} fill="#fff" />
                  <span>Stop Voice</span>
                </button>
              )}
            </>
          ) : (
            <>
              <Sparkles size={14} className="pulse-glow" style={{ color: '#60a5fa' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>
                Consulting scriptures and karma...
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Glass Floating Input Bar */}
      <div style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '35px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(35px)',
        WebkitBackdropFilter: 'blur(35px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        {/* Live Voice Sanctuary Button */}
        <button
          onClick={onLiveTalk}
          disabled={isSageThinking}
          title="Enter Real-time Voice Sanctuary"
          style={{
            background: isLiveMode 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'rgba(255, 255, 255, 0.06)',
            border: isLiveMode ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '25px',
            padding: '10px 18px',
            color: isLiveMode ? '#fff' : 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: '700',
            fontSize: '0.85rem',
            boxShadow: isLiveMode ? '0 0 25px rgba(239, 68, 68, 0.5)' : 'none',
            flexShrink: 0
          }}
          onMouseOver={(e) => {
            if (!isLiveMode) {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (!isLiveMode) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }
          }}
        >
          <Mic size={17} style={{ color: isLiveMode ? '#fff' : '#60a5fa' }} />
          <span className="hidden-mobile">Voice Sanctuary</span>
        </button>

        {/* Text Input */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSageThinking}
            placeholder={placeholder || "Share your burden, O Seeker..."}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '13px 22px',
              color: '#fff',
              fontSize: '0.98rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#f59e0b';
              e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.2), inset 0 2px 6px rgba(0, 0, 0, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.target.style.boxShadow = 'inset 0 2px 6px rgba(0, 0, 0, 0.3)';
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!hasText || isSageThinking}
          title="Send dilemma"
          style={{
            background: hasText && !isSageThinking 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              : 'rgba(255, 255, 255, 0.05)',
            color: hasText && !isSageThinking ? '#000' : 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasText && !isSageThinking ? 'pointer' : 'default',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: hasText && !isSageThinking ? '0 0 25px rgba(245, 158, 11, 0.5)' : 'none',
            flexShrink: 0
          }}
          onMouseOver={(e) => {
            if (hasText && !isSageThinking) {
              e.currentTarget.style.transform = 'scale(1.08)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Send size={19} />
        </button>
      </div>
    </div>
  );
};

export default VoiceUI;
