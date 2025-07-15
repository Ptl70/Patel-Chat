// Chat logic service for managing chat operations

/**
 * Calculate the next state after deleting a chat session
 * @param {Array} currentSessions - Current chat sessions
 * @param {string} sessionIdToDelete - ID of session to delete
 * @param {string|null} currentActiveSessionId - Currently active session ID
 * @returns {Object} Updated sessions and new active session ID
 */
export const calculateNextStateAfterDeletion = (
  currentSessions,
  sessionIdToDelete,
  currentActiveSessionId
) => {
  const originalIndexToDelete = currentSessions.findIndex(s => s.id === sessionIdToDelete);
  const updatedSessions = currentSessions.filter(session => session.id !== sessionIdToDelete);
  let newActiveSessionId = currentActiveSessionId;

  if (currentActiveSessionId === sessionIdToDelete) {
    // The active chat was deleted
    if (updatedSessions.length === 0) {
      newActiveSessionId = null; // No chats left
    } else {
      // Try to select the session at the same original index, or the new last one if the deleted was last.
      if (originalIndexToDelete >= 0) { 
        if (originalIndexToDelete < updatedSessions.length) {
          // A session exists at the same original index in the updated list
          newActiveSessionId = updatedSessions[originalIndexToDelete].id;
        } else {
          // The deleted session was the last one (or index is now out of bounds for the updated list)
          // Select the new last session
          newActiveSessionId = updatedSessions[updatedSessions.length - 1].id;
        }
      } else {
        // Fallback: This should ideally not be reached if sessionIdToDelete was a valid active ID.
        // If it is, just select the first available.
        newActiveSessionId = updatedSessions[0].id;
      }
    }
  } else {
    // A non-active chat was deleted, or no active chat was set.
    // The current active ID might still be valid or might have been null.
    if (updatedSessions.length === 0) {
      newActiveSessionId = null; // No chats left, so active must be null.
    } else if (currentActiveSessionId === null) {
      // No active chat was set, but now sessions exist (or still exist after deleting a non-active one).
      newActiveSessionId = updatedSessions[0].id; // Default to the first one.
    } else {
      // An active chat was set, and it wasn't the one deleted.
      // We need to ensure it still exists in the updated list (it should).
      const activeStillExists = updatedSessions.some(s => s.id === currentActiveSessionId);
      if (!activeStillExists) {
        // This case indicates an inconsistency if currentActiveSessionId was valid before.
        // However, as a safeguard, if the active ID is somehow gone, pick the first.
        newActiveSessionId = updatedSessions[0].id; 
      }
      // Otherwise, newActiveSessionId remains currentActiveSessionId (it's still valid).
    }
  }

  return { updatedSessions, newActiveSessionId };
};

/**
 * Generate a chat title from the first user message
 * @param {Array} messages - Array of messages
 * @returns {string} Generated title
 */
export const generateChatTitle = (messages) => {
  const firstUserMessage = messages.find(m => m.sender === 'user');
  if (firstUserMessage) {
    return firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '');
  }
  return "New Chat";
};

/**
 * Create a new chat session
 * @returns {Object} New chat session object
 */
export const createNewChatSession = () => {
  const timestamp = Date.now();
  return {
    id: timestamp.toString(),
    title: 'New Chat',
    messages: [{
      id: (timestamp + 1).toString(),
      sender: 'bot',
      text: "Welcome to Patel Chat! I'm your AI assistant, ready to help with your queries, search the web, or just chat. How can I assist you today?",
      timestamp: timestamp + 1,
      isLoading: false,
    }],
    createdAt: timestamp,
    lastUpdatedAt: timestamp,
    systemInstruction: '', 
  };
};

/**
 * Search through chat messages
 * @param {Array} sessions - Chat sessions to search
 * @param {string} searchTerm - Term to search for
 * @returns {Array} Filtered sessions with matching messages
 */
export const searchChatSessions = (sessions, searchTerm) => {
  if (!searchTerm.trim()) return sessions;

  const term = searchTerm.toLowerCase();
  return sessions.filter(session => {
    // Search in title
    if (session.title.toLowerCase().includes(term)) return true;
    
    // Search in messages
    return session.messages.some(message => 
      message.text.toLowerCase().includes(term)
    );
  });
};

/**
 * Filter chat sessions by date range
 * @param {Array} sessions - Chat sessions to filter
 * @param {number} daysAgo - Number of days ago to filter from
 * @returns {Array} Filtered sessions
 */
export const filterChatSessionsByDate = (sessions, daysAgo) => {
  const cutoffDate = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
  return sessions.filter(session => session.lastUpdatedAt >= cutoffDate);
};

/**
 * Sort chat sessions by various criteria
 * @param {Array} sessions - Chat sessions to sort
 * @param {string} sortBy - Sort criteria ('lastUpdated', 'created', 'title', 'messageCount')
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted sessions
 */
export const sortChatSessions = (sessions, sortBy = 'lastUpdated', order = 'desc') => {
  const sorted = [...sessions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'created':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'messageCount':
        aValue = a.messages.length;
        bValue = b.messages.length;
        break;
      case 'lastUpdated':
      default:
        aValue = a.lastUpdatedAt;
        bValue = b.lastUpdatedAt;
        break;
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return sorted;
};

