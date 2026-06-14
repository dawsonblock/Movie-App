import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const urls = [
  'http://localhost:3000',
  'http://localhost:3000/movie/550',
  'http://localhost:3000/tv/1396',
  'http://localhost:3000/auth',
];

const performanceThresholds = {
  'First Contentful Paint': 1800, // ms
  'Largest Contentful Paint': 2500, // ms
  'Time to Interactive': 3800, // ms
  'Total Blocking Time': 200, // ms
  'Cumulative Layout Shift': 0.1,
  'Speed Index': 3400, // ms
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options);
    const report = runnerResult.report;
    const result = JSON.parse(report);

    chrome.kill();
    return result;
  } catch (error) {
    chrome.kill();
    throw error;
  }
}

function checkThresholds(metrics, url) {
  const audits = metrics.audits;
  const results = [];

  for (const [metric, threshold] of Object.entries(performanceThresholds)) {
    const auditKey = metric.toLowerCase().replace(/ /g, '-');
    const audit = audits[auditKey];
    
    if (audit) {
      const value = audit.numericValue;
      const passed = value <= threshold;
      
      results.push({
        metric,
        value,
        threshold,
        passed,
        url,
      });

      if (!passed) {
        console.error(`❌ ${metric} failed for ${url}: ${value}ms > ${threshold}ms`);
      } else {
        console.log(`✅ ${metric} passed for ${url}: ${value}ms <= ${threshold}ms`);
      }
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Starting performance baseline tests...\n');

  const allResults = [];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    
    try {
      const result = await runLighthouse(url);
      const results = checkThresholds(result, url);
      allResults.push(...results);
      
      const score = result.categories.performance.score * 100;
      console.log(`Performance Score: ${score}\n`);
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
    }
  }

  const failedTests = allResults.filter(r => !r.passed);
  
  console.log('\n📊 Summary:');
  console.log(`Total tests: ${allResults.length}`);
  console.log(`Passed: ${allResults.length - failedTests.length}`);
  console.log(`Failed: ${failedTests.length}`);

  if (failedTests.length > 0) {
    console.log('\n❌ Performance baseline tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All performance baseline tests passed!');
  }
}

main().catch(console.error);