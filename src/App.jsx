import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Settings, BarChart3, Search, Palette, Mic } from 'lucide-react';
import './App.css';

// Import services
import { initDB, getChatSessions, saveChatSession, deleteChatSession, getQuickPrompts, saveQuickPrompt, deleteQuickPrompt } from './services/indexedDBService.js';
import { getApiKeyError, isGeminiAvailable } from './services/geminiService.js';
import { createNewChatSession, calculateNextStateAfterDeletion } from './services/chatLogicService.js';
import { initializeUserStats, updateUserStats, incrementStat, checkAchievements, updateStreakDays, getUsageInsights } from './services/statsService.js';
import { getCurrentTheme, applyTheme } from './services/themeService.js';

// Import components
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import ThemeSelector from './components/ThemeSelector.jsx';
import AdvancedSearch from './components/AdvancedSearch.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import VoiceControls from './components/VoiceControls.jsx';
import AchievementNotification, { AchievementToast } from './components/AchievementNotification.jsx';

function App() {
  // Core state
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState(null);
  const [quickPrompts, setQuickPrompts] = useState([]);
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // App state
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  
  // Achievement state
  const [achievementNotification, setAchievementNotification] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Check API key
      const keyError = getApiKeyError();
      if (keyError) {
        setApiKeyMissing(true);
        setGlobalError(keyError);
      }

      // Initialize IndexedDB
      await initDB();
      
      // Load data
      const [sessions, prompts] = await Promise.all([
        getChatSessions(),
        getQuickPrompts()
      ]);
      
      setChatSessions(sessions);
      setQuickPrompts(prompts);
      
      // Set active session
      if (sessions.length > 0) {
        setActiveChatSessionId(sessions[0].id);
      } else if (!keyError) {
        // Create initial session
        const newSession = createNewChatSession();
        await saveChatSession(newSession);
        setChatSessions([newSession]);
        setActiveChatSessionId(newSession.id);
      }

      // Initialize user stats and check achievements
      await initializeUserStats();
      await updateStreakDays();
      
      // Apply current theme
      const currentTheme = await getCurrentTheme();
      applyTheme(currentTheme);
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      setGlobalError('Failed to initialize application');
    } finally {
      setIsLoading(false);
    }
  };

  // Chat session management
  const handleCreateNewChat = async () => {
    if (apiKeyMissing) return;
    
    try {
      const newSession = createNewChatSession();
      await saveChatSession(newSession);
      setChatSessions(prev => [newSession, ...prev]);
      setActiveChatSessionId(newSession.id);
      
      // Update stats
      await incrementStat('totalChats');
      const stats = await getUsageInsights();
      const newAchievements = await checkAchievements(stats);
      if (newAchievements.length > 0) {
        showAchievement(newAchievements[0]);
      }
      
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSelectChat = (sessionId) => {
    setActiveChatSessionId(sessionId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (sessionIdToDelete) => {
    try {
      const { updatedSessions, newActiveSessionId } = calculateNextStateAfterDeletion(
        chatSessions,
        sessionIdToDelete,
        activeChatSessionId
      );
      
      await deleteChatSession(sessionIdToDelete);
      setChatSessions(updatedSessions);
      setActiveChatSessionId(newActiveSessionId);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleUpdateChatSession = useCallback(async (updatedSession) => {
    try {
      await saveChatSession(updatedSession);
      setChatSessions(prevSessions =>
        prevSessions.map(s => s.id === updatedSession.id ? updatedSession : s)
      );
      
      // Update stats for new messages
      const userMessages = updatedSession.messages.filter(m => m.sender === 'user');
      if (userMessages.length > 0) {
        await incrementStat('totalMessages');
        const stats = await getUsageInsights();
        const newAchievements = await checkAchievements(stats);
        if (newAchievements.length > 0) {
          showAchievementToast(newAchievements[0]);
        }
      }
    } catch (error) {
      console.error('Error updating chat session:', error);
    }
  }, []);

  // Quick prompts management
  const handleSaveQuickPrompt = async (prompt) => {
    try {
      await saveQuickPrompt(prompt);
      setQuickPrompts(prev => [prompt, ...prev.filter(p => p.id !== prompt.id)]);
      
      await incrementStat('totalQuickPrompts');
      const stats = await getUsageInsights();
      const newAchievements = await checkAchievements(stats);
      if (newAchievements.length > 0) {
        showAchievementToast(newAchievements[0]);
      }
    } catch (error) {
      console.error('Error saving quick prompt:', error);
    }
  };

  const handleDeleteQuickPrompt = async (promptId) => {
    try {
      await deleteQuickPrompt(promptId);
      setQuickPrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (error) {
      console.error('Error deleting quick prompt:', error);
    }
  };

  // Achievement system
  const showAchievement = (achievement) => {
    setAchievementNotification(achievement);
  };

  const showAchievementToast = (achievement) => {
    setAchievementToast(achievement);
  };

  // Voice controls
  const handleVoiceInput = (text) => {
    // This would be handled by the ChatArea component
    console.log('Voice input:', text);
  };

  const handleVoiceCommand = (command, text) => {
    switch (command) {
      case 'NEW_CHAT':
        handleCreateNewChat();
        break;
      case 'DELETE_CHAT':
        if (activeChatSessionId) {
          handleDeleteChat(activeChatSessionId);
        }
        break;
      case 'SEARCH':
        setShowAdvancedSearch(true);
        break;
      case 'SETTINGS':
        setShowThemeSelector(true);
        break;
      case 'INPUT':
        handleVoiceInput(text);
        break;
      default:
        console.log('Unknown voice command:', command);
    }
  };

  // Get active chat
  const activeChat = chatSessions.find(s => s.id === activeChatSessionId) || null;

  // Loading screen
  if (isLoading) {
    return (
      <div className="gradient-background flex items-center justify-center min-h-screen">
        <div className="glass-panel p-8 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Patel Chat</h2>
          <p className="text-white/70">Initializing your AI assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-background min-h-screen">
      <div className="flex h-screen w-screen antialiased text-white p-2 sm:p-4 gap-2 sm:gap-4 relative">
        
        {/* Mobile menu button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-3 left-3 z-40 glass-button p-2 rounded-md"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>

        {/* Top bar with controls */}
        <div className="fixed top-3 right-3 z-40 flex items-center space-x-2">
          <VoiceControls 
            onVoiceInput={handleVoiceInput}
            onVoiceCommand={handleVoiceCommand}
            isVisible={!apiKeyMissing}
          />
          
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
            title="Advanced Search"
          >
            <Search className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowStatsPanel(true)}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
            title="Statistics"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowThemeSelector(true)}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
            title="Themes"
          >
            <Palette className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          chatSessions={searchResults.length > 0 ? searchResults : chatSessions}
          activeChatSessionId={activeChatSessionId}
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleCreateNewChat}
          onDeleteChat={handleDeleteChat}
          isApiKeyMissing={apiKeyMissing}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          quickPrompts={quickPrompts}
          onSaveQuickPrompt={handleSaveQuickPrompt}
          onDeleteQuickPrompt={handleDeleteQuickPrompt}
        />
        
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && window.innerWidth < 768 && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-20"
            aria-hidden="true"
          />
        )}

        {/* Main chat area */}
        <ChatArea
          key={activeChatSessionId} 
          activeChatSession={activeChat}
          onUpdateChatSession={handleUpdateChatSession}
          isApiKeyMissing={apiKeyMissing}
          quickPrompts={quickPrompts}
          onDeleteCurrentChat={() => activeChatSessionId && handleDeleteChat(activeChatSessionId)}
        />

        {/* Modals and overlays */}
        <ThemeSelector 
          isOpen={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
        />
        
        <AdvancedSearch
          chatSessions={chatSessions}
          onResults={setSearchResults}
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
        />
        
        <StatsPanel
          isOpen={showStatsPanel}
          onClose={() => setShowStatsPanel(false)}
          chatSessions={chatSessions}
        />

        {/* Achievement notifications */}
        <AchievementNotification
          achievement={achievementNotification}
          isVisible={!!achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
        
        <AchievementToast
          achievement={achievementToast}
          isVisible={!!achievementToast}
          onClose={() => setAchievementToast(null)}
          position="top-right"
        />

        {/* API Key Missing Error */}
        {apiKeyMissing && !activeChat && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Settings className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Configuration Required</h2>
              <p className="text-white/80 mb-2 text-sm sm:text-base">{globalError || getApiKeyError()}</p>
              <p className="text-xs sm:text-sm text-white/60">
                Please set the <code className="bg-white/10 px-1 rounded">VITE_API_KEY</code> environment variable with your Google AI API key.
              </p>
            </div>
          </div>
        )}

        {/* Global error display */}
        {globalError && !apiKeyMissing && (
          <div className="fixed bottom-5 right-5 glass-panel p-3 text-sm text-white rounded-md shadow-lg z-50 max-w-sm">
            {globalError}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

