// Type definitions for the chat application

/**
 * @typedef {Object} Message
 * @property {string} id - Unique identifier for the message
 * @property {'user' | 'bot'} sender - Who sent the message
 * @property {string} text - The message content
 * @property {number} timestamp - When the message was sent
 * @property {boolean} isLoading - Whether the message is still loading
 * @property {boolean} [isError] - Whether there was an error with this message
 * @property {Array} [sources] - Sources for the message (if any)
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id - Unique identifier for the chat session
 * @property {string} title - Display title for the chat
 * @property {Message[]} messages - Array of messages in this chat
 * @property {number} createdAt - When the chat was created
 * @property {number} lastUpdatedAt - When the chat was last updated
 * @property {string} [systemInstruction] - Custom system instruction for this chat
 */

/**
 * @typedef {Object} QuickPrompt
 * @property {string} id - Unique identifier for the quick prompt
 * @property {string} title - Display title for the prompt
 * @property {string} text - The prompt text content
 */

/**
 * @typedef {Object} UserStats
 * @property {number} totalMessages - Total messages sent
 * @property {number} totalChats - Total chats created
 * @property {number} totalQuickPrompts - Total quick prompts created
 * @property {string[]} achievements - Array of achievement IDs
 * @property {number} joinDate - When the user first used the app
 */

/**
 * @typedef {Object} Theme
 * @property {string} id - Unique identifier for the theme
 * @property {string} name - Display name for the theme
 * @property {string} background - Background gradient or color
 * @property {string} glassColor - Glass panel color
 * @property {string} accentColor - Accent color for buttons and highlights
 */

export {};

