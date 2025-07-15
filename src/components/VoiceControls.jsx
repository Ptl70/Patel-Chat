import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Pause } from 'lucide-react';
import voiceService, { speakLongText, startVoiceCommands } from '../services/voiceService.js';

/**
 * Voice controls component for speech input/output
 */
const VoiceControls = ({ 
  onVoiceInput, 
  onVoiceCommand,
  isVisible = true 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [settings, setSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
    language: 'en-US',
    autoSpeak: false,
    commandMode: false
  });

  useEffect(() => {
    // Check support and initialize
    setIsSupported(voiceService.getSupportStatus());
    
    if (voiceService.getSupportStatus()) {
      loadVoices();
    }

    // Check speaking status periodically
    const speakingInterval = setInterval(() => {
      setIsSpeaking(voiceService.isSpeaking());
    }, 500);

    return () => {
      clearInterval(speakingInterval);
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  const loadVoices = () => {
    const availableVoices = voiceService.getVoices();
    setVoices(availableVoices);
    
    if (availableVoices.length > 0 && !selectedVoice) {
      const defaultVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.default
      ) || availableVoices[0];
      setSelectedVoice(defaultVoice);
      voiceService.setVoice(defaultVoice);
    }
  };

  const startListening = async () => {
    if (!isSupported || isListening) return;

    try {
      setCurrentTranscript('');
      
      if (settings.commandMode) {
        await startVoiceCommands(
          (command, text) => {
            if (onVoiceCommand) {
              onVoiceCommand(command, text);
            }
            setIsListening(false);
          },
          (error) => {
            console.error('Voice command error:', error);
            setIsListening(false);
          }
        );
      } else {
        await voiceService.startListening(
          (result) => {
            setCurrentTranscript(result.interim || result.final);
            
            if (result.isFinal && result.final.trim()) {
              if (onVoiceInput) {
                onVoiceInput(result.final);
              }
              setCurrentTranscript('');
              setIsListening(false);
            }
          },
          (error) => {
            console.error('Voice recognition error:', error);
            setIsListening(false);
          }
        );
      }
      
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    setCurrentTranscript('');
  };

  const speakText = async (text) => {
    if (!isSupported || !text.trim()) return;

    try {
      const speechOptions = {
        voice: selectedVoice,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume
      };

      if (text.length > 200) {
        await speakLongText(text, speechOptions);
      } else {
        await voiceService.speak(text, speechOptions);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const stopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleVoiceChange = (voiceIndex) => {
    const voice = voices[voiceIndex];
    setSelectedVoice(voice);
    voiceService.setVoice(voice);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'language') {
      voiceService.setRecognitionLanguage(value);
    }
  };

  if (!isVisible || !isSupported) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Voice Input Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`glass-button p-2 rounded-lg transition-all ${
          isListening 
            ? 'bg-red-500/30 text-red-300 pulse-glow' 
            : 'text-white hover:bg-white/20'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {/* Voice Output Button */}
      <button
        onClick={isSpeaking ? stopSpeaking : () => {}}
        className={`glass-button p-2 rounded-lg transition-all ${
          isSpeaking 
            ? 'bg-blue-500/30 text-blue-300' 
            : 'text-white hover:bg-white/20'
        }`}
        title={isSpeaking ? 'Stop speaking' : 'Text-to-speech'}
      >
        {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
        title="Voice settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Current Transcript Display */}
      {currentTranscript && (
        <div className="glass-panel px-3 py-1 rounded-lg max-w-xs">
          <p className="text-white text-sm truncate" title={currentTranscript}>
            {currentTranscript}
          </p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 glass-panel p-4 rounded-lg shadow-xl w-80 z-50">
          <h3 className="text-white font-medium mb-3">Voice Settings</h3>
          
          <div className="space-y-3">
            {/* Voice Selection */}
            <div>
              <label className="block text-sm text-white/80 mb-1">Voice</label>
              <select
                value={voices.findIndex(v => v === selectedVoice)}
                onChange={(e) => handleVoiceChange(parseInt(e.target.value))}
                className="glass-input w-full p-2 rounded text-white text-sm"
              >
                {voices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate */}
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Speech Rate ({settings.rate}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.rate}
                onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Speech Pitch */}
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Speech Pitch ({settings.pitch})
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Volume ({Math.round(settings.volume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Recognition Language */}
            <div>
              <label className="block text-sm text-white/80 mb-1">Recognition Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="glass-input w-full p-2 rounded text-white text-sm"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="it-IT">Italian</option>
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="ru-RU">Russian</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) => handleSettingChange('autoSpeak', e.target.checked)}
                  className="mr-2"
                />
                Auto-speak AI responses
              </label>
              
              <label className="flex items-center text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={settings.commandMode}
                  onChange={(e) => handleSettingChange('commandMode', e.target.checked)}
                  className="mr-2"
                />
                Voice command mode
              </label>
            </div>

            {/* Test Voice */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => speakText('Hello! This is a test of the text-to-speech functionality.')}
                className="glass-button w-full p-2 rounded text-white text-sm flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Voice
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="absolute top-2 right-2 glass-button p-1 rounded text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Voice command help component
 */
export const VoiceCommandHelp = ({ isOpen, onClose }) => {
  const commands = [
    { command: 'new chat', description: 'Create a new chat session' },
    { command: 'delete chat', description: 'Delete the current chat' },
    { command: 'search', description: 'Open search functionality' },
    { command: 'settings', description: 'Open settings panel' },
    { command: 'help', description: 'Show help information' },
    { command: 'clear', description: 'Clear the current input' },
    { command: 'export', description: 'Export chat data' },
    { command: 'import', description: 'Import chat data' },
    { command: 'stop listening', description: 'Stop voice recognition' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Voice Commands</h3>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {commands.map((cmd, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
              <span className="text-blue-300 font-mono text-sm">"{cmd.command}"</span>
              <span className="text-white/70 text-sm">{cmd.description}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>Tip:</strong> Enable "Voice command mode" in settings to use these commands, 
            or speak naturally for regular input.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;

