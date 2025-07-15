import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Chart renderer component for displaying data visualizations
 */
const ChartRenderer = ({ data, type = 'line', title, width = '100%', height = 300 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="glass-panel p-4 rounded-lg text-center text-white/70">
        <p>No data available for chart</p>
      </div>
    );
  }

  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'line':
        return (
          <LineChart data={data}>
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
            <Legend />
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
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
            <Legend />
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
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
            <Legend />
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        const pieData = data.map((item, index) => ({
          ...item,
          fill: colors[index % colors.length]
        }));
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
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
        );

      default:
        return (
          <div className="text-center text-white/70 p-4">
            <p>Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel p-4 rounded-lg my-4">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Parse chart data from text
 * @param {string} text - Text containing chart data
 * @returns {Object|null} Parsed chart configuration
 */
export const parseChartFromText = (text) => {
  // Look for chart patterns in text
  const chartPatterns = [
    // JSON format: {"type": "bar", "data": [...], "title": "..."}
    /```(?:json|chart)\s*\n?({[\s\S]*?})\s*```/i,
    // Simple table format
    /\|[\s\S]*?\|/g,
    // CSV-like format
    /^[\w\s,]+(?:\n[\w\s,]+)+$/m
  ];

  for (const pattern of chartPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Try to parse as JSON first
        if (match[1]) {
          const config = JSON.parse(match[1]);
          if (config.data && config.type) {
            return config;
          }
        }
        
        // Try to parse as table
        if (match[0].includes('|')) {
          return parseTableToChart(match[0]);
        }
        
        // Try to parse as CSV
        return parseCSVToChart(match[0]);
      } catch (error) {
        console.error('Error parsing chart data:', error);
      }
    }
  }

  return null;
};

/**
 * Parse table format to chart data
 * @param {string} tableText - Table text
 * @returns {Object} Chart configuration
 */
const parseTableToChart = (tableText) => {
  const lines = tableText.split('\n').filter(line => line.trim());
  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  
  const data = [];
  for (let i = 2; i < lines.length; i++) { // Skip header separator
    const values = lines[i].split('|').map(v => v.trim()).filter(v => v);
    if (values.length === headers.length) {
      const row = { name: values[0] };
      for (let j = 1; j < values.length; j++) {
        const value = parseFloat(values[j]);
        if (!isNaN(value)) {
          row[headers[j]] = value;
        }
      }
      data.push(row);
    }
  }

  return {
    type: 'bar',
    data,
    title: 'Data Visualization'
  };
};

/**
 * Parse CSV format to chart data
 * @param {string} csvText - CSV text
 * @returns {Object} Chart configuration
 */
const parseCSVToChart = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length) {
      const row = { name: values[0] };
      for (let j = 1; j < values.length; j++) {
        const value = parseFloat(values[j]);
        if (!isNaN(value)) {
          row[headers[j]] = value;
        }
      }
      data.push(row);
    }
  }

  return {
    type: 'line',
    data,
    title: 'Data Visualization'
  };
};

export default ChartRenderer;

