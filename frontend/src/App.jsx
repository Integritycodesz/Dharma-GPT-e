import { useState } from 'react';
import Home from './components/Home';
import ChatInterface from './components/ChatInterface';
import VoicePage from './components/VoicePage';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeMode, setActiveMode] = useState('krishna');
  const [initialQuery, setInitialQuery] = useState('');

  const startChat = (mode, query = '') => {
    if (mode) {
      setActiveMode(mode);
    }
    setInitialQuery(query || '');
    setCurrentScreen('chat');
  };

  const startVoice = (mode) => {
    setActiveMode(mode || activeMode);
    setCurrentScreen('voice');
  };

  const backToChat = () => {
    setCurrentScreen('chat');
  };

  const backToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="app-container">
      {currentScreen === 'home' && (
        <Home 
          onStart={startChat} 
          onStartVoice={startVoice}
        />
      )}
      {currentScreen === 'chat' && (
        <ChatInterface 
          onStartVoice={startVoice} 
          activeMode={activeMode}
          onModeChange={setActiveMode}
          initialQuery={initialQuery}
          onBackHome={backToHome}
        />
      )}
      {currentScreen === 'voice' && (
        <VoicePage 
          onBack={backToChat} 
          activeMode={activeMode} 
        />
      )}
    </div>
  );
}

export default App;
