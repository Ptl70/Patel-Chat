import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MessageSquare, User, Tag, X } from 'lucide-react';
import { searchChatSessions, filterChatSessionsByDate, sortChatSessions } from '../services/chatLogicService.js';
import { semanticSearch } from '../services/embeddingService.js';

/**
 * Advanced search component with multiple filters
 */
const AdvancedSearch = ({ 
  chatSessions, 
  onResults, 
  isOpen, 
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, today, week, month, year, custom
    customDateStart: '',
    customDateEnd: '',
    messageCount: 'all', // all, short, medium, long
    sortBy: 'lastUpdated', // lastUpdated, created, title, messageCount
    sortOrder: 'desc', // asc, desc
    searchType: 'keyword' // keyword, semantic
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    if (searchQuery.trim() || hasActiveFilters()) {
      performSearch();
    } else {
      setResults(chatSessions);
      onResults(chatSessions);
    }
  }, [searchQuery, filters, chatSessions]);

  const hasActiveFilters = () => {
    return filters.dateRange !== 'all' || 
           filters.messageCount !== 'all' ||
           filters.sortBy !== 'lastUpdated' ||
           filters.sortOrder !== 'desc';
  };

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      let filteredSessions = [...chatSessions];

      // Apply text search
      if (searchQuery.trim()) {
        if (filters.searchType === 'semantic') {
          // Semantic search (placeholder - would need full implementation)
          filteredSessions = searchChatSessions(filteredSessions, searchQuery);
        } else {
          // Keyword search
          filteredSessions = searchChatSessions(filteredSessions, searchQuery);
        }
      }

      // Apply date filter
      if (filters.dateRange !== 'all') {
        filteredSessions = applyDateFilter(filteredSessions);
      }

      // Apply message count filter
      if (filters.messageCount !== 'all') {
        filteredSessions = applyMessageCountFilter(filteredSessions);
      }

      // Apply sorting
      filteredSessions = sortChatSessions(filteredSessions, filters.sortBy, filters.sortOrder);

      setResults(filteredSessions);
      onResults(filteredSessions);
      updateActiveFilters();
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const applyDateFilter = (sessions) => {
    const now = Date.now();
    let cutoffDate;

    switch (filters.dateRange) {
      case 'today':
        cutoffDate = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (filters.customDateStart && filters.customDateEnd) {
          const startDate = new Date(filters.customDateStart).getTime();
          const endDate = new Date(filters.customDateEnd).getTime() + (24 * 60 * 60 * 1000);
          return sessions.filter(session => 
            session.lastUpdatedAt >= startDate && session.lastUpdatedAt <= endDate
          );
        }
        return sessions;
      default:
        return sessions;
    }

    return sessions.filter(session => session.lastUpdatedAt >= cutoffDate);
  };

  const applyMessageCountFilter = (sessions) => {
    switch (filters.messageCount) {
      case 'short':
        return sessions.filter(session => session.messages.length <= 5);
      case 'medium':
        return sessions.filter(session => session.messages.length > 5 && session.messages.length <= 20);
      case 'long':
        return sessions.filter(session => session.messages.length > 20);
      default:
        return sessions;
    }
  };

  const updateActiveFilters = () => {
    const active = [];
    
    if (searchQuery.trim()) {
      active.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        value: searchQuery
      });
    }
    
    if (filters.dateRange !== 'all') {
      active.push({
        type: 'date',
        label: `Date: ${filters.dateRange}`,
        value: filters.dateRange
      });
    }
    
    if (filters.messageCount !== 'all') {
      active.push({
        type: 'messageCount',
        label: `Messages: ${filters.messageCount}`,
        value: filters.messageCount
      });
    }
    
    if (filters.sortBy !== 'lastUpdated' || filters.sortOrder !== 'desc') {
      active.push({
        type: 'sort',
        label: `Sort: ${filters.sortBy} (${filters.sortOrder})`,
        value: `${filters.sortBy}-${filters.sortOrder}`
      });
    }

    setActiveFilters(active);
  };

  const clearFilter = (filterType) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'date':
        setFilters(prev => ({ ...prev, dateRange: 'all' }));
        break;
      case 'messageCount':
        setFilters(prev => ({ ...prev, messageCount: 'all' }));
        break;
      case 'sort':
        setFilters(prev => ({ ...prev, sortBy: 'lastUpdated', sortOrder: 'desc' }));
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      dateRange: 'all',
      customDateStart: '',
      customDateEnd: '',
      messageCount: 'all',
      sortBy: 'lastUpdated',
      sortOrder: 'desc',
      searchType: 'keyword'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Search className="h-6 w-6 mr-2" />
            Advanced Search
          </h2>
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Search Query
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white"
              placeholder="Search in chat titles and messages..."
            />
          </div>
          
          {/* Search Type Toggle */}
          <div className="flex items-center mt-2 space-x-4">
            <label className="flex items-center text-sm text-white/70">
              <input
                type="radio"
                name="searchType"
                value="keyword"
                checked={filters.searchType === 'keyword'}
                onChange={(e) => setFilters(prev => ({ ...prev, searchType: e.target.value }))}
                className="mr-2"
              />
              Keyword Search
            </label>
            <label className="flex items-center text-sm text-white/70">
              <input
                type="radio"
                name="searchType"
                value="semantic"
                checked={filters.searchType === 'semantic'}
                onChange={(e) => setFilters(prev => ({ ...prev, searchType: e.target.value }))}
                className="mr-2"
              />
              Semantic Search
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="glass-input w-full p-2 rounded text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="date"
                  value={filters.customDateStart}
                  onChange={(e) => setFilters(prev => ({ ...prev, customDateStart: e.target.value }))}
                  className="glass-input p-2 rounded text-white text-sm"
                />
                <input
                  type="date"
                  value={filters.customDateEnd}
                  onChange={(e) => setFilters(prev => ({ ...prev, customDateEnd: e.target.value }))}
                  className="glass-input p-2 rounded text-white text-sm"
                />
              </div>
            )}
          </div>

          {/* Message Count Filter */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Message Count
            </label>
            <select
              value={filters.messageCount}
              onChange={(e) => setFilters(prev => ({ ...prev, messageCount: e.target.value }))}
              className="glass-input w-full p-2 rounded text-white"
            >
              <option value="all">All Lengths</option>
              <option value="short">Short (≤5 messages)</option>
              <option value="medium">Medium (6-20 messages)</option>
              <option value="long">Long (&gt;20 messages)</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="glass-input w-full p-2 rounded text-white"
              >
                <option value="lastUpdated">Last Updated</option>
                <option value="created">Created Date</option>
                <option value="title">Title</option>
                <option value="messageCount">Message Count</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="glass-input w-full p-2 rounded text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/80">Active Filters</h4>
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {filter.label}
                  <button
                    onClick={() => clearFilter(filter.type)}
                    className="ml-1 hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-white/70 mb-4">
          <span>
            {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          </span>
          {results.length !== chatSessions.length && (
            <span>
              (filtered from {chatSessions.length} total)
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={clearAllFilters}
            className="glass-button px-4 py-2 rounded text-white"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="bg-blue-500/80 hover:bg-blue-500 px-4 py-2 rounded text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;

