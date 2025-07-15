import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Copy, Download, Trash2, Zap, Code, BarChart3, Share } from 'lucide-react';
import { sendMessage } from '../services/geminiService.js';
import ChartRenderer, { parseChartFromText } from './ChartRenderer.jsx';
import CodeEditor, { extractCodeBlocks, InlineCodeEditor } from './CodeEditor.jsx';
import DiagramRenderer, { extractDiagrams } from './DiagramRenderer.jsx';

const ChatArea = ({
  activeChatSession,
  onUpdateChatSession,
  isApiKeyMissing,
  quickPrompts,
  onDeleteCurrentChat
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [activeChatSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText = inputText) => {
    if (!messageText.trim() || isLoading || isApiKeyMissing || !activeChatSession) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      text: messageText.trim(),
      sender: 'user',
      timestamp: Date.now()
    };

    const updatedSession = {
      ...activeChatSession,
      messages: [...activeChatSession.messages, userMessage],
      lastUpdatedAt: Date.now()
    };

    onUpdateChatSession(updatedSession);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessage(messageText.trim(), activeChatSession.messages);
      
      const aiMessage = {
        id: `msg-${Date.now()}-ai`,
        text: response,
        sender: 'ai',
        timestamp: Date.now()
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastUpdatedAt: Date.now()
      };

      // Update title if this is the first exchange
      if (activeChatSession.messages.length === 0) {
        finalSession.title = messageText.trim().slice(0, 50) + (messageText.trim().length > 50 ? '...' : '');
      }

      onUpdateChatSession(finalSession);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        text: `Sorry, I encountered an error: ${error.message}`,
        sender: 'ai',
        timestamp: Date.now(),
        isError: true
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        lastUpdatedAt: Date.now()
      };

      onUpdateChatSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPromptSelect = (prompt) => {
    setInputText(prompt.text);
    setShowQuickPrompts(false);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const exportChat = () => {
    if (!activeChatSession) return;
    
    const chatData = {
      title: activeChatSession.title,
      messages: activeChatSession.messages,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChatSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMessageContent = (message) => {
    const content = message.text;
    
    // Check for charts
    const chartConfig = parseChartFromText(content);
    if (chartConfig) {
      return (
        <div>
          <div className="mb-4">{content}</div>
          <ChartRenderer {...chartConfig} />
        </div>
      );
    }

    // Check for code blocks
    const codeBlocks = extractCodeBlocks(content);
    if (codeBlocks.length > 0) {
      let remainingContent = content;
      const elements = [];
      
      codeBlocks.forEach((block, index) => {
        const parts = remainingContent.split(block.fullMatch);
        if (parts[0]) {
          elements.push(
            <div key={`text-${index}`} className="mb-4 whitespace-pre-wrap">
              {parts[0]}
            </div>
          );
        }
        
        elements.push(
          <CodeEditor
            key={`code-${index}`}
            initialCode={block.code}
            language={block.language}
            readOnly={true}
            title={`${block.language} Code`}
          />
        );
        
        remainingContent = parts.slice(1).join(block.fullMatch);
      });
      
      if (remainingContent) {
        elements.push(
          <div key="remaining" className="mt-4 whitespace-pre-wrap">
            {remainingContent}
          </div>
        );
      }
      
      return <div>{elements}</div>;
    }

    // Check for diagrams
    const diagrams = extractDiagrams(content);
    if (diagrams.length > 0) {
      let remainingContent = content;
      const elements = [];
      
      diagrams.forEach((diagram, index) => {
        const parts = remainingContent.split(diagram.fullMatch);
        if (parts[0]) {
          elements.push(
            <div key={`text-${index}`} className="mb-4 whitespace-pre-wrap">
              {parts[0]}
            </div>
          );
        }
        
        elements.push(
          <DiagramRenderer
            key={`diagram-${index}`}
            diagramText={diagram.content}
            title={`Diagram ${index + 1}`}
          />
        );
        
        remainingContent = parts.slice(1).join(diagram.fullMatch);
      });
      
      if (remainingContent) {
        elements.push(
          <div key="remaining" className="mt-4 whitespace-pre-wrap">
            {remainingContent}
          </div>
        );
      }
      
      return <div>{elements}</div>;
    }

    // Regular text content
    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  if (isApiKeyMissing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/70">
          <h2 className="text-xl font-semibold mb-2">API Key Required</h2>
          <p>Please configure your Google AI API key to start chatting.</p>
        </div>
      </div>
    );
  }

  if (!activeChatSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/70">
          <h2 className="text-xl font-semibold mb-2">No Chat Selected</h2>
          <p>Select a chat from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col glass-panel rounded-lg ml-0 md:ml-4">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">
            {activeChatSession.title}
          </h2>
          <p className="text-sm text-white/60">
            {activeChatSession.messages.length} message{activeChatSession.messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportChat}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
            title="Export chat"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={onDeleteCurrentChat}
            className="glass-button p-2 rounded-lg text-red-400 hover:bg-red-500/20"
            title="Delete chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {activeChatSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Send className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm">Ask me anything or use a quick prompt below!</p>
            </div>
          </div>
        ) : (
          activeChatSession.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] p-4 rounded-lg relative group
                  ${message.sender === 'user'
                    ? 'bg-blue-500/20 text-white border border-blue-500/30'
                    : message.isError
                    ? 'glass-panel text-red-300 border border-red-500/30'
                    : 'glass-panel text-white'
                  }
                `}
              >
                {renderMessageContent(message)}
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-white/50">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  
                  <button
                    onClick={() => copyToClipboard(message.text)}
                    className="opacity-0 group-hover:opacity-100 glass-button p-1 rounded text-white/70 hover:text-white"
                    title="Copy message"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-panel p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {showQuickPrompts && quickPrompts.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">Quick Prompts</span>
            <button
              onClick={() => setShowQuickPrompts(false)}
              className="text-white/50 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
            {quickPrompts.slice(0, 6).map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleQuickPromptSelect(prompt)}
                className="glass-button p-2 rounded text-left text-sm text-white hover:bg-white/20 truncate"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-2">
          {quickPrompts.length > 0 && (
            <button
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className={`glass-button p-2 rounded-lg transition-colors ${
                showQuickPrompts ? 'bg-blue-500/30 text-blue-300' : 'text-white hover:bg-white/20'
              }`}
              title="Quick prompts"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="glass-input w-full p-3 pr-12 rounded-lg text-white resize-none"
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 bottom-2 glass-button p-2 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;

