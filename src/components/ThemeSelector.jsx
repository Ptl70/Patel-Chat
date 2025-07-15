import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Eye, Check } from 'lucide-react';
import { getAllThemes, getCurrentTheme, applyTheme, saveCustomTheme, deleteCustomTheme } from '../services/themeService.js';

/**
 * Theme selector component
 */
const ThemeSelector = ({ isOpen, onClose }) => {
  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [showCustomThemeForm, setShowCustomThemeForm] = useState(false);
  const [customThemeForm, setCustomThemeForm] = useState({
    name: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    backgroundType: 'gradient',
    glassOpacity: 0.1
  });

  useEffect(() => {
    if (isOpen) {
      loadThemes();
    }
  }, [isOpen]);

  const loadThemes = async () => {
    try {
      const [allThemes, current] = await Promise.all([
        getAllThemes(),
        getCurrentTheme()
      ]);
      setThemes(allThemes);
      setCurrentTheme(current);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const handleThemeSelect = async (theme) => {
    try {
      applyTheme(theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleCustomThemeSubmit = async (e) => {
    e.preventDefault();
    
    if (!customThemeForm.name.trim()) {
      alert('Please enter a theme name');
      return;
    }

    try {
      const newTheme = {
        id: `custom-${Date.now()}`,
        name: customThemeForm.name,
        background: customThemeForm.backgroundType === 'gradient' 
          ? `linear-gradient(135deg, ${customThemeForm.primaryColor} 0%, ${customThemeForm.secondaryColor} 100%)`
          : customThemeForm.primaryColor,
        glassColor: `rgba(255, 255, 255, ${customThemeForm.glassOpacity})`,
        accentColor: customThemeForm.primaryColor,
        textColor: '#ffffff',
        description: 'Custom user theme',
        isCustom: true
      };

      await saveCustomTheme(newTheme);
      await loadThemes();
      setShowCustomThemeForm(false);
      setCustomThemeForm({
        name: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundType: 'gradient',
        glassOpacity: 0.1
      });
    } catch (error) {
      console.error('Error saving custom theme:', error);
      alert('Failed to save custom theme');
    }
  };

  const handleDeleteTheme = async (themeId) => {
    if (!confirm('Are you sure you want to delete this custom theme?')) {
      return;
    }

    try {
      await deleteCustomTheme(themeId);
      await loadThemes();
      
      // If the deleted theme was current, switch to default
      if (currentTheme?.id === themeId) {
        const defaultTheme = themes.find(t => t.id === 'ocean-breeze');
        if (defaultTheme) {
          handleThemeSelect(defaultTheme);
        }
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Failed to delete theme');
    }
  };

  const previewTheme = (theme) => {
    // Temporarily apply theme for preview
    const root = document.documentElement;
    root.style.setProperty('--preview-background', theme.background);
    root.style.setProperty('--preview-glass-color', theme.glassColor);
    root.style.setProperty('--preview-accent-color', theme.accentColor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Palette className="h-6 w-6 mr-2" />
            Theme Selector
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative glass-panel p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                currentTheme?.id === theme.id ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => handleThemeSelect(theme)}
              onMouseEnter={() => previewTheme(theme)}
            >
              {/* Theme Preview */}
              <div 
                className="h-20 rounded-lg mb-3 relative overflow-hidden"
                style={{ background: theme.background }}
              >
                <div 
                  className="absolute inset-2 rounded border"
                  style={{ 
                    backgroundColor: theme.glassColor,
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div 
                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
              </div>

              {/* Theme Info */}
              <div className="text-white">
                <h3 className="font-medium text-sm mb-1">{theme.name}</h3>
                <p className="text-xs text-white/70 mb-2">{theme.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {currentTheme?.id === theme.id && (
                      <Check className="h-4 w-4 text-green-400" />
                    )}
                    <span className="text-xs text-white/60">
                      {theme.isCustom ? 'Custom' : 'Built-in'}
                    </span>
                  </div>
                  
                  {theme.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTheme(theme.id);
                      }}
                      className="glass-button p-1 rounded text-red-400 hover:bg-red-500/20"
                      title="Delete theme"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Custom Theme Button */}
          <div
            className="glass-panel p-4 rounded-lg cursor-pointer transition-all hover:scale-105 border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/70 hover:text-white hover:border-white/50"
            onClick={() => setShowCustomThemeForm(true)}
          >
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Create Custom Theme</span>
          </div>
        </div>

        {/* Custom Theme Form */}
        {showCustomThemeForm && (
          <div className="glass-panel p-4 rounded-lg border border-white/20">
            <h3 className="text-lg font-medium text-white mb-4">Create Custom Theme</h3>
            
            <form onSubmit={handleCustomThemeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={customThemeForm.name}
                  onChange={(e) => setCustomThemeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input w-full p-2 rounded text-white"
                  placeholder="My Awesome Theme"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customThemeForm.primaryColor}
                      onChange={(e) => setCustomThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={customThemeForm.primaryColor}
                      onChange={(e) => setCustomThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="glass-input flex-1 p-2 rounded text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customThemeForm.secondaryColor}
                      onChange={(e) => setCustomThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={customThemeForm.secondaryColor}
                      onChange={(e) => setCustomThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="glass-input flex-1 p-2 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Background Type
                  </label>
                  <select
                    value={customThemeForm.backgroundType}
                    onChange={(e) => setCustomThemeForm(prev => ({ ...prev, backgroundType: e.target.value }))}
                    className="glass-input w-full p-2 rounded text-white"
                  >
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Glass Opacity ({Math.round(customThemeForm.glassOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.05"
                    value={customThemeForm.glassOpacity}
                    onChange={(e) => setCustomThemeForm(prev => ({ ...prev, glassOpacity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-white/80 mb-2">Preview</label>
                <div 
                  className="h-16 rounded-lg relative overflow-hidden"
                  style={{ 
                    background: customThemeForm.backgroundType === 'gradient' 
                      ? `linear-gradient(135deg, ${customThemeForm.primaryColor} 0%, ${customThemeForm.secondaryColor} 100%)`
                      : customThemeForm.primaryColor
                  }}
                >
                  <div 
                    className="absolute inset-2 rounded border flex items-center justify-center"
                    style={{ 
                      backgroundColor: `rgba(255, 255, 255, ${customThemeForm.glassOpacity})`,
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="text-white text-sm font-medium">Glass Panel Preview</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomThemeForm(false)}
                  className="glass-button px-4 py-2 rounded text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500/80 hover:bg-blue-500 px-4 py-2 rounded text-white"
                >
                  Create Theme
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;

