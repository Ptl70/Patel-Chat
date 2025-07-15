// User statistics and achievements service

import { getUserStats, saveUserStats } from './indexedDBService.js';

/**
 * Initialize user stats if they don't exist
 * @returns {Promise<Object>} User stats object
 */
export const initializeUserStats = async () => {
  let stats = await getUserStats();
  
  if (!stats) {
    stats = {
      totalMessages: 0,
      totalChats: 0,
      totalQuickPrompts: 0,
      achievements: [],
      joinDate: Date.now(),
      streakDays: 0,
      lastActiveDate: Date.now(),
      favoriteFeatures: {},
      timeSpentChatting: 0 // in minutes
    };
    await saveUserStats(stats);
  }
  
  return stats;
};

/**
 * Update user stats
 * @param {Object} updates - Stats to update
 * @returns {Promise<Object>} Updated stats
 */
export const updateUserStats = async (updates) => {
  const currentStats = await getUserStats() || await initializeUserStats();
  const updatedStats = { ...currentStats, ...updates };
  await saveUserStats(updatedStats);
  return updatedStats;
};

/**
 * Increment a specific stat
 * @param {string} statName - Name of the stat to increment
 * @param {number} amount - Amount to increment by (default: 1)
 * @returns {Promise<Object>} Updated stats
 */
export const incrementStat = async (statName, amount = 1) => {
  const currentStats = await getUserStats() || await initializeUserStats();
  currentStats[statName] = (currentStats[statName] || 0) + amount;
  await saveUserStats(currentStats);
  return currentStats;
};

/**
 * Check and award achievements
 * @param {Object} stats - Current user stats
 * @returns {Promise<Array>} New achievements earned
 */
export const checkAchievements = async (stats) => {
  const achievements = [
    {
      id: 'first_message',
      name: 'First Steps',
      description: 'Send your first message',
      condition: (s) => s.totalMessages >= 1,
      icon: '💬'
    },
    {
      id: 'chat_starter',
      name: 'Chat Starter',
      description: 'Create your first chat',
      condition: (s) => s.totalChats >= 1,
      icon: '🚀'
    },
    {
      id: 'conversationalist',
      name: 'Conversationalist',
      description: 'Send 50 messages',
      condition: (s) => s.totalMessages >= 50,
      icon: '🗣️'
    },
    {
      id: 'chat_master',
      name: 'Chat Master',
      description: 'Create 10 chat sessions',
      condition: (s) => s.totalChats >= 10,
      icon: '👑'
    },
    {
      id: 'prompt_creator',
      name: 'Prompt Creator',
      description: 'Create your first quick prompt',
      condition: (s) => s.totalQuickPrompts >= 1,
      icon: '⚡'
    },
    {
      id: 'efficiency_expert',
      name: 'Efficiency Expert',
      description: 'Create 5 quick prompts',
      condition: (s) => s.totalQuickPrompts >= 5,
      icon: '🎯'
    },
    {
      id: 'marathon_chatter',
      name: 'Marathon Chatter',
      description: 'Send 200 messages',
      condition: (s) => s.totalMessages >= 200,
      icon: '🏃‍♂️'
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Use the app for 7 consecutive days',
      condition: (s) => s.streakDays >= 7,
      icon: '🔥'
    },
    {
      id: 'power_user',
      name: 'Power User',
      description: 'Spend 60 minutes chatting',
      condition: (s) => s.timeSpentChatting >= 60,
      icon: '⚡'
    },
    {
      id: 'explorer',
      name: 'Explorer',
      description: 'Create 25 chat sessions',
      condition: (s) => s.totalChats >= 25,
      icon: '🧭'
    }
  ];

  const newAchievements = [];
  const currentAchievements = stats.achievements || [];

  for (const achievement of achievements) {
    if (!currentAchievements.includes(achievement.id) && achievement.condition(stats)) {
      newAchievements.push(achievement);
      currentAchievements.push(achievement.id);
    }
  }

  if (newAchievements.length > 0) {
    await updateUserStats({ achievements: currentAchievements });
  }

  return newAchievements;
};

/**
 * Get all available achievements with their status
 * @returns {Promise<Array>} All achievements with earned status
 */
export const getAllAchievements = async () => {
  const stats = await getUserStats() || await initializeUserStats();
  const earnedAchievements = stats.achievements || [];

  const achievements = [
    {
      id: 'first_message',
      name: 'First Steps',
      description: 'Send your first message',
      icon: '💬',
      earned: earnedAchievements.includes('first_message')
    },
    {
      id: 'chat_starter',
      name: 'Chat Starter',
      description: 'Create your first chat',
      icon: '🚀',
      earned: earnedAchievements.includes('chat_starter')
    },
    {
      id: 'conversationalist',
      name: 'Conversationalist',
      description: 'Send 50 messages',
      icon: '🗣️',
      earned: earnedAchievements.includes('conversationalist')
    },
    {
      id: 'chat_master',
      name: 'Chat Master',
      description: 'Create 10 chat sessions',
      icon: '👑',
      earned: earnedAchievements.includes('chat_master')
    },
    {
      id: 'prompt_creator',
      name: 'Prompt Creator',
      description: 'Create your first quick prompt',
      icon: '⚡',
      earned: earnedAchievements.includes('prompt_creator')
    },
    {
      id: 'efficiency_expert',
      name: 'Efficiency Expert',
      description: 'Create 5 quick prompts',
      icon: '🎯',
      earned: earnedAchievements.includes('efficiency_expert')
    },
    {
      id: 'marathon_chatter',
      name: 'Marathon Chatter',
      description: 'Send 200 messages',
      icon: '🏃‍♂️',
      earned: earnedAchievements.includes('marathon_chatter')
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Use the app for 7 consecutive days',
      icon: '🔥',
      earned: earnedAchievements.includes('week_warrior')
    },
    {
      id: 'power_user',
      name: 'Power User',
      description: 'Spend 60 minutes chatting',
      icon: '⚡',
      earned: earnedAchievements.includes('power_user')
    },
    {
      id: 'explorer',
      name: 'Explorer',
      description: 'Create 25 chat sessions',
      icon: '🧭',
      earned: earnedAchievements.includes('explorer')
    }
  ];

  return achievements;
};

/**
 * Update streak days based on last active date
 * @returns {Promise<Object>} Updated stats
 */
export const updateStreakDays = async () => {
  const stats = await getUserStats() || await initializeUserStats();
  const today = new Date().toDateString();
  const lastActiveDate = new Date(stats.lastActiveDate).toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  let newStreakDays = stats.streakDays || 0;

  if (lastActiveDate === today) {
    // Already active today, no change
    return stats;
  } else if (lastActiveDate === yesterday) {
    // Active yesterday, increment streak
    newStreakDays += 1;
  } else {
    // Streak broken, reset to 1
    newStreakDays = 1;
  }

  return await updateUserStats({
    streakDays: newStreakDays,
    lastActiveDate: Date.now()
  });
};

/**
 * Track time spent chatting
 * @param {number} minutes - Minutes to add
 * @returns {Promise<Object>} Updated stats
 */
export const trackTimeSpent = async (minutes) => {
  return await incrementStat('timeSpentChatting', minutes);
};

/**
 * Get usage insights
 * @returns {Promise<Object>} Usage insights
 */
export const getUsageInsights = async () => {
  const stats = await getUserStats() || await initializeUserStats();
  const daysSinceJoin = Math.floor((Date.now() - stats.joinDate) / (24 * 60 * 60 * 1000));
  
  return {
    totalMessages: stats.totalMessages || 0,
    totalChats: stats.totalChats || 0,
    totalQuickPrompts: stats.totalQuickPrompts || 0,
    daysSinceJoin: daysSinceJoin || 1,
    averageMessagesPerDay: Math.round((stats.totalMessages || 0) / Math.max(daysSinceJoin, 1)),
    averageChatsPerDay: Math.round((stats.totalChats || 0) / Math.max(daysSinceJoin, 1)),
    streakDays: stats.streakDays || 0,
    timeSpentChatting: stats.timeSpentChatting || 0,
    achievementsEarned: (stats.achievements || []).length,
    totalAchievements: 10
  };
};

