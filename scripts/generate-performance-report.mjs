import fs from 'fs';
import path from 'path';
import {
  calculateTrends,
  checkPerformanceThresholds,
  WEB_VITALS_THRESHOLDS,
  API_THRESHOLDS,
  MEMORY_THRESHOLDS,
} from './performance-monitor.mjs';

const PERFORMANCE_LOG_FILE = path.join(process.cwd(), 'performance-metrics.json');
const REPORT_FILE = path.join(process.cwd(), 'performance-report.md');

function generateReport() {
  if (!fs.existsSync(PERFORMANCE_LOG_FILE)) {
    console.log('No performance data found. Run performance tests first.');
    return;
  }

  const logData = JSON.parse(fs.readFileSync(PERFORMANCE_LOG_FILE, 'utf8'));
  const metrics = logData.metrics;
  
  if (metrics.length === 0) {
    console.log('No performance metrics recorded.');
    return;
  }

  const trends = calculateTrends();
  const latestMetrics = metrics[metrics.length - 1];
  
  // Check for threshold violations
  const webVitalsViolations = checkPerformanceThresholds(latestMetrics, WEB_VITALS_THRESHOLDS);
  const apiViolations = checkPerformanceThresholds(latestMetrics, API_THRESHOLDS);
  const memoryViolations = checkPerformanceThresholds(latestMetrics, MEMORY_THRESHOLDS);

  let report = `# Performance Report
Generated: ${new Date().toISOString()}

## Summary
- Total measurements: ${metrics.length}
- First measurement: ${logData.timestamps[0]}
- Latest measurement: ${logData.timestamps[logData.timestamps.length - 1]}

## Latest Metrics
`;

  // Add latest metrics
  for (const [key, value] of Object.entries(latestMetrics)) {
    if (key !== 'timestamp' && typeof value === 'number') {
      report += `- **${key}**: ${value.toFixed(2)}\n`;
    }
  }

  // Add trends
  if (trends) {
    report += `\n## Performance Trends\n`;
    for (const [metric, trend] of Object.entries(trends)) {
      const emoji = trend.direction === 'increasing' ? '📈' : trend.direction === 'decreasing' ? '📉' : '➡️';
      report += `- ${emoji} **${metric}**: ${trend.recent.toFixed(2)} (${trend.change}% ${trend.direction})\n`;
    }
  }

  // Add violations
  if (webVitalsViolations.length > 0) {
    report += `\n## Web Vitals Violations\n`;
    webVitalsViolations.forEach(violation => {
      const emoji = violation.severity === 'critical' ? '🚨' : '⚠️';
      report += `- ${emoji} **${violation.metric}**: ${violation.value.toFixed(2)} > ${violation.threshold}\n`;
    });
  }

  if (apiViolations.length > 0) {
    report += `\n## API Performance Violations\n`;
    apiViolations.forEach(violation => {
      const emoji = violation.severity === 'critical' ? '🚨' : '⚠️';
      report += `- ${emoji} **${violation.metric}**: ${violation.value.toFixed(2)} > ${violation.threshold}\n`;
    });
  }

  if (memoryViolations.length > 0) {
    report += `\n## Memory Violations\n`;
    memoryViolations.forEach(violation => {
      const emoji = violation.severity === 'critical' ? '🚨' : '⚠️';
      report += `- ${emoji} **${violation.metric}**: ${(violation.value / 1024 / 1024).toFixed(2)}MB > ${(violation.threshold / 1024 / 1024).toFixed(2)}MB\n`;
    });
  }

  if (webVitalsViolations.length === 0 && apiViolations.length === 0 && memoryViolations.length === 0) {
    report += `\n## ✅ No threshold violations detected\n`;
  }

  // Add recommendations
  report += `\n## Recommendations\n`;
  
  if (webVitalsViolations.some(v => v.metric === 'Largest Contentful Paint')) {
    report += `- Consider optimizing images and lazy loading content to improve LCP\n`;
  }
  
  if (webVitalsViolations.some(v => v.metric === 'Total Blocking Time')) {
    report += `- Consider code splitting and reducing JavaScript execution time\n`;
  }
  
  if (webVitalsViolations.some(v => v.metric === 'Cumulative Layout Shift')) {
    report += `- Ensure images have dimensions specified and avoid inserting content above existing content\n`;
  }
  
  if (memoryViolations.length > 0) {
    report += `- Monitor for memory leaks and consider implementing cleanup routines\n`;
  }

  if (apiViolations.some(v => v.metric === 'responseTime')) {
    report += `- Consider implementing caching for API responses\n`;
  }

  if (webVitalsViolations.length === 0 && apiViolations.length === 0 && memoryViolations.length === 0) {
    report += `- Performance is within acceptable thresholds. Continue monitoring.\n`;
  }

  // Write report
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Performance report generated: ${REPORT_FILE}`);
  
  // Print summary to console
  console.log('\n📊 Performance Summary:');
  console.log(`- Total measurements: ${metrics.length}`);
  console.log(`- Web Vitals violations: ${webVitalsViolations.length}`);
  console.log(`- API violations: ${apiViolations.length}`);
  console.log(`- Memory violations: ${memoryViolations.length}`);
  
  if (webVitalsViolations.length > 0 || apiViolations.length > 0 || memoryViolations.length > 0) {
    console.log('\n⚠️  Performance issues detected. Review the full report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ Performance is within acceptable thresholds.');
  }
}

generateReport();