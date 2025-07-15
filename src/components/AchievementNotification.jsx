import React, { useState, useEffect } from 'react';
import { Award, X, Star } from 'lucide-react';

/**
 * Achievement notification component
 */
const AchievementNotification = ({ 
  achievement, 
  isVisible, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Achievement Card */}
      <div 
        className={`relative glass-panel p-6 rounded-xl shadow-2xl max-w-sm mx-4 pointer-events-auto transform transition-all duration-500 ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-75 opacity-0 translate-y-8'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
          border: '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 glass-button p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Achievement Content */}
        <div className="text-center">
          {/* Header */}
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-3 animate-bounce">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Achievement Unlocked!</h3>
            <div className="flex justify-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <Star 
                  key={i} 
                  className="h-4 w-4 text-yellow-400 fill-current animate-pulse" 
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          {/* Achievement Details */}
          <div className="mb-4">
            <div className="text-4xl mb-2 animate-pulse">
              {achievement.icon}
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {achievement.name}
            </h4>
            <p className="text-white/80 text-sm">
              {achievement.description}
            </p>
          </div>

          {/* Celebration Elements */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping" />
            </div>
            <div className="relative z-10">
              <button
                onClick={handleClose}
                className="glass-button px-6 py-2 rounded-full text-white font-medium hover:bg-white/20 transition-all"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute -top-1 -right-3 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-2 -left-3 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

/**
 * Achievement toast notification (smaller, less intrusive)
 */
export const AchievementToast = ({ 
  achievement, 
  isVisible, 
  onClose, 
  position = 'top-right' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible || !achievement) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 transform transition-all duration-300 ${
        isAnimating 
          ? 'translate-x-0 opacity-100' 
          : position.includes('right') 
            ? 'translate-x-full opacity-0' 
            : '-translate-x-full opacity-0'
      }`}
    >
      <div className="glass-panel p-4 rounded-lg shadow-lg max-w-sm border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-yellow-300 text-xs font-medium">Achievement!</span>
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
            </div>
            <p className="text-white font-medium text-sm truncate">
              {achievement.name}
            </p>
            <p className="text-white/70 text-xs truncate">
              {achievement.description}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="glass-button p-1 rounded text-white/70 hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Achievement progress indicator
 */
export const AchievementProgress = ({ 
  title, 
  current, 
  target, 
  icon, 
  description 
}) => {
  const progress = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;

  return (
    <div className={`glass-panel p-3 rounded-lg border ${
      isCompleted ? 'border-green-500/30 bg-green-500/10' : 'border-white/10'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`text-xl ${isCompleted ? 'grayscale-0' : 'grayscale'}`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium text-sm ${
              isCompleted ? 'text-green-300' : 'text-white'
            }`}>
              {title}
            </h4>
            <span className={`text-xs ${
              isCompleted ? 'text-green-400' : 'text-white/70'
            }`}>
              {current}/{target}
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-400 to-green-500' 
                  : 'bg-gradient-to-r from-blue-400 to-purple-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-white/50">{description}</p>
        </div>
        
        {isCompleted && (
          <div className="text-green-400">
            <Award className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementNotification;

