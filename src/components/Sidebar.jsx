import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Search, Zap, Edit3, X } from 'lucide-react';

const Sidebar = ({
  chatSessions,
  activeChatSessionId,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  isApiKeyMissing,
  isOpen,
  onClose,
  quickPrompts,
  onSaveQuickPrompt,
  onDeleteQuickPrompt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.messages.some(msg => 
      msg.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSavePrompt = () => {
    if (!newPromptText.trim()) return;
    
    const prompt = {
      id: editingPrompt?.id || `prompt-${Date.now()}`,
      text: newPromptText.trim(),
      createdAt: editingPrompt?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    
    onSaveQuickPrompt(prompt);
    setNewPromptText('');
    setEditingPrompt(null);
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setNewPromptText(prompt.text);
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setNewPromptText('');
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isApiKeyMissing ? 'opacity-50 pointer-events-none' : ''}
      `}>
        <div className="glass-panel h-full rounded-lg flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Patel Chat</h1>
              <button
                onClick={onClose}
                className="md:hidden glass-button p-1 rounded text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={onCreateNewChat}
              disabled={isApiKeyMissing}
              className="w-full glass-button p-3 rounded-lg text-white flex items-center justify-center space-x-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-white/50"
                placeholder="Search chats..."
              />
            </div>
          </div>

          {/* Quick Prompts Toggle */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className="w-full glass-button p-2 rounded-lg text-white flex items-center justify-between hover:bg-white/20"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Quick Prompts</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {quickPrompts.length}
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {showQuickPrompts ? (
              /* Quick Prompts Section */
              <div className="p-4 space-y-3">
                {/* Add/Edit Prompt */}
                <div className="space-y-2">
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="glass-input w-full p-2 rounded text-white text-sm resize-none"
                    placeholder="Enter a quick prompt..."
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSavePrompt}
                      disabled={!newPromptText.trim()}
                      className="flex-1 bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-white text-sm"
                    >
                      {editingPrompt ? 'Update' : 'Save'}
                    </button>
                    {editingPrompt && (
                      <button
                        onClick={handleCancelEdit}
                        className="glass-button px-3 py-1 rounded text-white text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompts List */}
                {quickPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="glass-panel p-3 rounded-lg group hover:bg-white/10"
                  >
                    <p className="text-white text-sm mb-2 line-clamp-3">
                      {prompt.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditPrompt(prompt)}
                          className="glass-button p-1 rounded text-white hover:bg-white/20"
                          title="Edit prompt"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteQuickPrompt(prompt.id)}
                          className="glass-button p-1 rounded text-red-400 hover:bg-red-500/20"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {quickPrompts.length === 0 && (
                  <div className="text-center text-white/50 py-8">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No quick prompts yet</p>
                    <p className="text-xs">Create reusable prompts for faster conversations</p>
                  </div>
                )}
              </div>
            ) : (
              /* Chat Sessions List */
              <div className="p-4 space-y-2">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectChat(session.id)}
                    className={`
                      glass-panel p-3 rounded-lg cursor-pointer transition-all group hover:bg-white/10
                      ${activeChatSessionId === session.id ? 'bg-white/20 border border-white/30' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-white/70 flex-shrink-0" />
                          <h3 className="text-white font-medium text-sm truncate">
                            {session.title}
                          </h3>
                        </div>
                        
                        {session.messages.length > 0 && (
                          <p className="text-white/60 text-xs line-clamp-2 mb-2">
                            {session.messages[session.messages.length - 1].text}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>
                            {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                          </span>
                          <span>
                            {new Date(session.lastUpdatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 glass-button p-1 rounded text-red-400 hover:bg-red-500/20 ml-2 flex-shrink-0"
                        title="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredSessions.length === 0 && searchTerm && (
                  <div className="text-center text-white/50 py-8">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                )}

                {filteredSessions.length === 0 && !searchTerm && (
                  <div className="text-center text-white/50 py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats yet</p>
                    <p className="text-xs">Start a new conversation to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

