import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MessageSquare, Calendar, Award, Clock, Target } from 'lucide-react';
import { getUsageInsights, getAllAchievements } from '../services/statsService.js';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Statistics and insights panel
 */
const StatsPanel = ({ isOpen, onClose, chatSessions }) => {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, chatSessions]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [insights, allAchievements] = await Promise.all([
        getUsageInsights(),
        getAllAchievements()
      ]);
      
      setStats(insights);
      setAchievements(allAchievements);
      
      // Generate additional analytics from chat sessions
      if (chatSessions && chatSessions.length > 0) {
        const additionalStats = generateChatAnalytics(chatSessions);
        setStats(prev => ({ ...prev, ...additionalStats }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChatAnalytics = (sessions) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Activity over time
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - (i * oneDay));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + oneDay;
      
      const dayMessages = sessions.reduce((count, session) => {
        return count + session.messages.filter(msg => 
          msg.timestamp >= dayStart && msg.timestamp < dayEnd
        ).length;
      }, 0);

      activityData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        messages: dayMessages,
        date: date.toISOString().split('T')[0]
      });
    }

    // Chat length distribution
    const lengthDistribution = [
      { name: 'Short (1-5)', value: sessions.filter(s => s.messages.length <= 5).length },
      { name: 'Medium (6-20)', value: sessions.filter(s => s.messages.length > 5 && s.messages.length <= 20).length },
      { name: 'Long (21-50)', value: sessions.filter(s => s.messages.length > 20 && s.messages.length <= 50).length },
      { name: 'Very Long (50+)', value: sessions.filter(s => s.messages.length > 50).length }
    ];

    // Most active hours
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const count = sessions.reduce((total, session) => {
        return total + session.messages.filter(msg => {
          const msgHour = new Date(msg.timestamp).getHours();
          return msgHour === hour;
        }).length;
      }, 0);
      
      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        messages: count
      };
    });

    // Recent activity trends
    const recentSessions = sessions.filter(s => s.lastUpdatedAt >= now - oneWeek);
    const weeklyGrowth = recentSessions.length;
    const monthlyGrowth = sessions.filter(s => s.lastUpdatedAt >= now - oneMonth).length;

    return {
      activityData,
      lengthDistribution: lengthDistribution.filter(item => item.value > 0),
      hourlyActivity: hourlyActivity.filter(item => item.messages > 0),
      weeklyGrowth,
      monthlyGrowth,
      averageSessionLength: sessions.length > 0 ? 
        Math.round(sessions.reduce((sum, s) => sum + s.messages.length, 0) / sessions.length) : 0,
      longestSession: sessions.length > 0 ? 
        Math.max(...sessions.map(s => s.messages.length)) : 0
    };
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="glass-panel p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const AchievementCard = ({ achievement }) => (
    <div className={`glass-panel p-3 rounded-lg border ${
      achievement.earned 
        ? 'border-green-500/30 bg-green-500/10' 
        : 'border-white/10'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`text-2xl ${achievement.earned ? 'grayscale-0' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${
            achievement.earned ? 'text-green-300' : 'text-white/70'
          }`}>
            {achievement.name}
          </h4>
          <p className="text-xs text-white/50">{achievement.description}</p>
        </div>
        {achievement.earned && (
          <div className="text-green-400">
            <Award className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
        <div className="glass-panel p-8 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Usage Statistics & Insights
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'activity', label: 'Activity', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={MessageSquare}
                  title="Total Messages"
                  value={stats?.totalMessages || 0}
                  subtitle={`${stats?.averageMessagesPerDay || 0}/day avg`}
                  color="blue"
                />
                <StatCard
                  icon={Calendar}
                  title="Chat Sessions"
                  value={stats?.totalChats || 0}
                  subtitle={`${stats?.averageChatsPerDay || 0}/day avg`}
                  color="green"
                />
                <StatCard
                  icon={Target}
                  title="Quick Prompts"
                  value={stats?.totalQuickPrompts || 0}
                  subtitle="Created"
                  color="purple"
                />
                <StatCard
                  icon={Clock}
                  title="Time Spent"
                  value={`${Math.round((stats?.timeSpentChatting || 0) / 60)}h`}
                  subtitle={`${stats?.timeSpentChatting || 0}m total`}
                  color="orange"
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={TrendingUp}
                  title="Streak Days"
                  value={stats?.streakDays || 0}
                  subtitle="Consecutive days"
                  color="red"
                />
                <StatCard
                  icon={Award}
                  title="Achievements"
                  value={`${stats?.achievementsEarned || 0}/${stats?.totalAchievements || 0}`}
                  subtitle="Unlocked"
                  color="yellow"
                />
                <StatCard
                  icon={Calendar}
                  title="Member Since"
                  value={`${stats?.daysSinceJoin || 0}`}
                  subtitle="days ago"
                  color="indigo"
                />
              </div>

              {/* Chat Length Distribution */}
              {stats?.lengthDistribution && stats.lengthDistribution.length > 0 && (
                <div className="glass-panel p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Chat Length Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.lengthDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.lengthDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Weekly Activity */}
              {stats?.activityData && (
                <div className="glass-panel p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Hourly Activity Pattern */}
              {stats?.hourlyActivity && stats.hourlyActivity.length > 0 && (
                <div className="glass-panel p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity by Hour</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Session Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Average Length:</span>
                      <span className="text-white">{stats?.averageSessionLength || 0} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Longest Session:</span>
                      <span className="text-white">{stats?.longestSession || 0} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">This Week:</span>
                      <span className="text-white">{stats?.weeklyGrowth || 0} new chats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">This Month:</span>
                      <span className="text-white">{stats?.monthlyGrowth || 0} new chats</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Engagement</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Current Streak:</span>
                      <span className="text-white">{stats?.streakDays || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Daily Average:</span>
                      <span className="text-white">{stats?.averageMessagesPerDay || 0} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Most Active Day:</span>
                      <span className="text-white">
                        {stats?.activityData ? 
                          stats.activityData.reduce((max, day) => 
                            day.messages > max.messages ? day : max, 
                            stats.activityData[0]
                          )?.name || 'N/A' 
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {achievements.filter(a => a.earned).length} / {achievements.length}
                </h3>
                <p className="text-white/70">Achievements Unlocked</p>
                <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(achievements.filter(a => a.earned).length / achievements.length) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} />
                ))}
              </div>

              {achievements.filter(a => !a.earned).length > 0 && (
                <div className="glass-panel p-4 rounded-lg border border-yellow-500/30">
                  <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Next Goals
                  </h4>
                  <div className="space-y-2">
                    {achievements
                      .filter(a => !a.earned)
                      .slice(0, 3)
                      .map((achievement, index) => (
                        <div key={index} className="text-sm text-white/70">
                          • {achievement.description}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;

