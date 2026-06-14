import fs from 'fs';
import path from 'path';

const PERFORMANCE_LOG_FILE = path.join(process.cwd(), 'performance-metrics.json');

// Initialize performance log file
if (!fs.existsSync(PERFORMANCE_LOG_FILE)) {
  fs.writeFileSync(PERFORMANCE_LOG_FILE, JSON.stringify({
    timestamps: [],
    metrics: [],
  }, null, 2));
}

function logPerformanceMetrics(metrics) {
  const timestamp = new Date().toISOString();
  
  const logData = JSON.parse(fs.readFileSync(PERFORMANCE_LOG_FILE, 'utf8'));
  
  logData.timestamps.push(timestamp);
  logData.metrics.push({
    timestamp,
    ...metrics,
  });
  
  // Keep only last 100 entries
  if (logData.timestamps.length > 100) {
    logData.timestamps = logData.timestamps.slice(-100);
    logData.metrics = logData.metrics.slice(-100);
  }
  
  fs.writeFileSync(PERFORMANCE_LOG_FILE, JSON.stringify(logData, null, 2));
}

function calculateTrends() {
  const logData = JSON.parse(fs.readFileSync(PERFORMANCE_LOG_FILE, 'utf8'));
  const metrics = logData.metrics;
  
  if (metrics.length < 2) {
    return null;
  }
  
  const recentMetrics = metrics.slice(-10);
  const olderMetrics = metrics.slice(-20, -10);
  
  const trends = {};
  
  // Calculate trends for each metric
  const metricKeys = Object.keys(recentMetrics[0]).filter(key => 
    key !== 'timestamp' && typeof recentMetrics[0][key] === 'number'
  );
  
  metricKeys.forEach(key => {
    const recentAvg = recentMetrics.reduce((sum, m) => sum + (m[key] || 0), 0) / recentMetrics.length;
    const olderAvg = olderMetrics.reduce((sum, m) => sum + (m[key] || 0), 0) / olderMetrics.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    trends[key] = {
      recent: recentAvg,
      older: olderAvg,
      change: change.toFixed(2),
      direction: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
    };
  });
  
  return trends;
}

function checkPerformanceThresholds(metrics, thresholds) {
  const violations = [];
  
  for (const [metric, value] of Object.entries(metrics)) {
    if (typeof value !== 'number') continue;
    
    const threshold = thresholds[metric];
    if (threshold && value > threshold) {
      violations.push({
        metric,
        value,
        threshold,
        severity: value > threshold * 1.5 ? 'critical' : 'warning',
      });
    }
  }
  
  return violations;
}

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  'First Contentful Paint': 1800,
  'Largest Contentful Paint': 2500,
  'First Input Delay': 100,
  'Time to Interactive': 3800,
  'Cumulative Layout Shift': 0.1,
  'Total Blocking Time': 200,
};

// API performance thresholds
const API_THRESHOLDS = {
  'responseTime': 1000,
  'databaseQueryTime': 500,
  'externalApiTime': 2000,
};

// Memory thresholds
const MEMORY_THRESHOLDS = {
  'usedJSHeapSize': 500 * 1024 * 1024, // 500MB
  'totalJSHeapSize': 1000 * 1024 * 1024, // 1GB
};

export {
  logPerformanceMetrics,
  calculateTrends,
  checkPerformanceThresholds,
  WEB_VITALS_THRESHOLDS,
  API_THRESHOLDS,
  MEMORY_THRESHOLDS,
};