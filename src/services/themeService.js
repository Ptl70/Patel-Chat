// Theme management service

import { getThemes, saveTheme, deleteTheme } from './indexedDBService.js';

/**
 * Default themes available in the application
 */
const DEFAULT_THEMES = [
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glassColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    description: 'Cool ocean-inspired gradient'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    glassColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#f59e0b',
    textColor: '#1f2937',
    description: 'Warm sunset colors'
  },
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    glassColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#10b981',
    textColor: '#ffffff',
    description: 'Serene forest atmosphere'
  },
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glassColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#8b5cf6',
    textColor: '#ffffff',
    description: 'Deep space vibes'
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    glassColor: 'rgba(255, 255, 255, 0.12)',
    accentColor: '#06b6d4',
    textColor: '#ffffff',
    description: 'Northern lights inspiration'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    glassColor: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#ec4899',
    textColor: '#1f2937',
    description: 'Soft spring colors'
  },
  {
    id: 'midnight-city',
    name: 'Midnight City',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    glassColor: 'rgba(255, 255, 255, 0.08)',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    description: 'Dark urban aesthetic'
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    glassColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#f59e0b',
    textColor: '#ffffff',
    description: 'Warm golden tones'
  }
];

/**
 * Initialize default themes in IndexedDB
 * @returns {Promise<void>}
 */
export const initializeDefaultThemes = async () => {
  try {
    const existingThemes = await getThemes();
    const existingIds = existingThemes.map(theme => theme.id);
    
    for (const theme of DEFAULT_THEMES) {
      if (!existingIds.includes(theme.id)) {
        await saveTheme(theme);
      }
    }
  } catch (error) {
    console.error('Error initializing default themes:', error);
  }
};

/**
 * Get all available themes
 * @returns {Promise<Array>} Array of theme objects
 */
export const getAllThemes = async () => {
  try {
    await initializeDefaultThemes();
    return await getThemes();
  } catch (error) {
    console.error('Error getting themes:', error);
    return DEFAULT_THEMES;
  }
};

/**
 * Get a specific theme by ID
 * @param {string} themeId - Theme ID
 * @returns {Promise<Object|null>} Theme object or null
 */
export const getThemeById = async (themeId) => {
  try {
    const themes = await getAllThemes();
    return themes.find(theme => theme.id === themeId) || null;
  } catch (error) {
    console.error('Error getting theme by ID:', error);
    return null;
  }
};

/**
 * Save a custom theme
 * @param {Object} theme - Theme object
 * @returns {Promise<void>}
 */
export const saveCustomTheme = async (theme) => {
  try {
    const themeWithId = {
      ...theme,
      id: theme.id || `custom-${Date.now()}`,
      isCustom: true
    };
    await saveTheme(themeWithId);
    return themeWithId;
  } catch (error) {
    console.error('Error saving custom theme:', error);
    throw error;
  }
};

/**
 * Delete a custom theme
 * @param {string} themeId - Theme ID
 * @returns {Promise<void>}
 */
export const deleteCustomTheme = async (themeId) => {
  try {
    const theme = await getThemeById(themeId);
    if (theme && theme.isCustom) {
      await deleteTheme(themeId);
    } else {
      throw new Error('Cannot delete default theme');
    }
  } catch (error) {
    console.error('Error deleting custom theme:', error);
    throw error;
  }
};

/**
 * Apply a theme to the document
 * @param {Object} theme - Theme object
 */
export const applyTheme = (theme) => {
  try {
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-glass-color', theme.glassColor);
    root.style.setProperty('--theme-accent-color', theme.accentColor);
    root.style.setProperty('--theme-text-color', theme.textColor);
    
    // Store current theme in localStorage
    localStorage.setItem('patel-chat-current-theme', theme.id);
    
    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`);
    
  } catch (error) {
    console.error('Error applying theme:', error);
  }
};

/**
 * Get the currently applied theme
 * @returns {Promise<Object>} Current theme object
 */
export const getCurrentTheme = async () => {
  try {
    const currentThemeId = localStorage.getItem('patel-chat-current-theme') || 'ocean-breeze';
    const theme = await getThemeById(currentThemeId);
    return theme || DEFAULT_THEMES[0];
  } catch (error) {
    console.error('Error getting current theme:', error);
    return DEFAULT_THEMES[0];
  }
};

/**
 * Create a theme from user preferences
 * @param {Object} preferences - User color preferences
 * @returns {Object} Generated theme object
 */
export const createThemeFromPreferences = (preferences) => {
  const {
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
    backgroundType = 'gradient',
    glassOpacity = 0.1
  } = preferences;
  
  let background;
  if (backgroundType === 'gradient') {
    background = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  } else {
    background = primaryColor;
  }
  
  return {
    id: `custom-${Date.now()}`,
    name: 'Custom Theme',
    background,
    glassColor: `rgba(255, 255, 255, ${glassOpacity})`,
    accentColor: primaryColor,
    textColor: '#ffffff',
    description: 'User-created custom theme',
    isCustom: true
  };
};

/**
 * Get theme suggestions based on time of day
 * @returns {Array} Suggested theme IDs
 */
export const getTimeBasedThemeSuggestions = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    // Morning
    return ['cherry-blossom', 'golden-hour', 'aurora-borealis'];
  } else if (hour >= 12 && hour < 18) {
    // Afternoon
    return ['ocean-breeze', 'forest-mist', 'sunset-glow'];
  } else {
    // Evening/Night
    return ['midnight-city', 'cosmic-purple', 'aurora-borealis'];
  }
};

