// Voice input/output service using Web Speech API

class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSupported = this.checkSupport();
    this.voices = [];
    this.selectedVoice = null;
    
    if (this.isSupported) {
      this.initializeRecognition();
      this.loadVoices();
    }
  }

  /**
   * Check if Web Speech API is supported
   * @returns {boolean} Support status
   */
  checkSupport() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !!window.speechSynthesis;
  }

  /**
   * Initialize speech recognition
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  /**
   * Load available voices
   */
  loadVoices() {
    const loadVoicesHandler = () => {
      this.voices = this.synthesis.getVoices();
      
      // Select a default voice (prefer English voices)
      this.selectedVoice = this.voices.find(voice => 
        voice.lang.startsWith('en') && voice.default
      ) || this.voices.find(voice => 
        voice.lang.startsWith('en')
      ) || this.voices[0];
    };

    // Load voices immediately if available
    loadVoicesHandler();
    
    // Also listen for the voiceschanged event (some browsers load voices asynchronously)
    this.synthesis.addEventListener('voiceschanged', loadVoicesHandler);
  }

  /**


   * Start voice recognition
   * @param {Function} onResult - Callback for recognition results
   * @param {Function} onError - Callback for errors
   * @returns {Promise<void>}
   */
  async startListening(onResult, onError) {
    if (!this.isSupported || !this.recognition) {
      onError(new Error('Speech recognition not supported'));
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.isListening = true;
      
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult({
          final: finalTranscript,
          interim: interimTranscript,
          isFinal: finalTranscript.length > 0
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        onError(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError(error);
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Speak text using text-to-speech
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      utterance.voice = options.voice || this.selectedVoice;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  /**
   * Get available voices
   * @returns {Array} Array of available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Set the voice to use for speech synthesis
   * @param {SpeechSynthesisVoice} voice - Voice to use
   */
  setVoice(voice) {
    this.selectedVoice = voice;
  }

  /**
   * Get current listening status
   * @returns {boolean} Whether currently listening
   */
  getListeningStatus() {
    return this.isListening;
  }

  /**
   * Get support status
   * @returns {boolean} Whether Web Speech API is supported
   */
  getSupportStatus() {
    return this.isSupported;
  }

  /**
   * Check if currently speaking
   * @returns {boolean} Whether currently speaking
   */
  isSpeaking() {
    return this.synthesis.speaking;
  }

  /**
   * Get voice by name or language
   * @param {string} nameOrLang - Voice name or language code
   * @returns {SpeechSynthesisVoice|null} Found voice or null
   */
  getVoiceByNameOrLang(nameOrLang) {
    return this.voices.find(voice => 
      voice.name.toLowerCase().includes(nameOrLang.toLowerCase()) ||
      voice.lang.toLowerCase().includes(nameOrLang.toLowerCase())
    ) || null;
  }

  /**
   * Set recognition language
   * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
   */
  setRecognitionLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Get supported languages for recognition
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    // Common supported languages
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
      'zh-TW', 'ar-SA', 'hi-IN', 'th-TH', 'vi-VN'
    ];
  }
}

// Create and export a singleton instance
const voiceService = new VoiceService();

export default voiceService;

/**
 * Utility functions for voice features
 */

/**
 * Convert text to speech with smart chunking for long texts
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise<void>}
 */
export const speakLongText = async (text, options = {}) => {
  const maxLength = 200; // Maximum characters per chunk
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
      await voiceService.speak(currentChunk.trim(), options);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    await voiceService.speak(currentChunk.trim(), options);
  }
};

/**
 * Voice command recognition with predefined commands
 * @param {Function} onCommand - Callback for recognized commands
 * @param {Function} onError - Callback for errors
 * @returns {Promise<void>}
 */
export const startVoiceCommands = async (onCommand, onError) => {
  const commands = {
    'new chat': 'NEW_CHAT',
    'delete chat': 'DELETE_CHAT',
    'search': 'SEARCH',
    'settings': 'SETTINGS',
    'help': 'HELP',
    'stop listening': 'STOP_LISTENING',
    'clear': 'CLEAR',
    'export': 'EXPORT',
    'import': 'IMPORT'
  };

  await voiceService.startListening(
    (result) => {
      if (result.isFinal) {
        const text = result.final.toLowerCase().trim();
        
        for (const [command, action] of Object.entries(commands)) {
          if (text.includes(command)) {
            onCommand(action, text);
            return;
          }
        }
        
        // If no command matched, treat as regular input
        onCommand('INPUT', result.final);
      }
    },
    onError
  );
};

/**
 * Auto-detect language from text
 * @param {string} text - Text to analyze
 * @returns {string} Detected language code
 */
export const detectLanguage = (text) => {
  // Simple language detection based on character patterns
  const patterns = {
    'zh-CN': /[\u4e00-\u9fff]/,
    'ja-JP': /[\u3040-\u309f\u30a0-\u30ff]/,
    'ko-KR': /[\uac00-\ud7af]/,
    'ar-SA': /[\u0600-\u06ff]/,
    'ru-RU': /[\u0400-\u04ff]/,
    'hi-IN': /[\u0900-\u097f]/,
    'th-TH': /[\u0e00-\u0e7f]/
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Default to English
  return 'en-US';
};

