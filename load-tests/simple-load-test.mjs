import http from 'http';

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          duration: Date.now() - req.startTime,
          body: body,
        });
      });
    });

    req.on('error', reject);
    req.startTime = Date.now();

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runLoadTest() {
  console.log('🚀 Starting API load test...');
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}\n`);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errors: [],
  };

  const testCases = [
    {
      name: 'Save History API',
      url: `${BASE_URL}/api/player/save-history`,
      method: 'POST',
      data: {
        event: 'timeupdate',
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: 'movie',
        mediaDetails: {
          adult: false,
          backdrop_path: '/path.jpg',
          poster_path: '/poster.jpg',
          release_date: '2024-01-01',
          title: 'Test Movie',
          vote_average: 8.5,
        },
      },
    },
    {
      name: 'Auth Callback API',
      url: `${BASE_URL}/api/auth/callback?code=test`,
      method: 'GET',
    },
    {
      name: 'Auth Confirm API',
      url: `${BASE_URL}/api/auth/confirm?token_hash=test&type=email`,
      method: 'GET',
    },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    const batchResults = {
      total: 0,
      success: 0,
      failed: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
    };

    // Run concurrent requests
    const requests = [];
    for (let i = 0; i < Math.ceil(TOTAL_REQUESTS / testCases.length); i++) {
      requests.push(
        makeRequest(testCase.url, testCase.method, testCase.data)
          .then((response) => {
            batchResults.total++;
            batchResults.totalTime += response.duration;
            batchResults.minTime = Math.min(batchResults.minTime, response.duration);
            batchResults.maxTime = Math.max(batchResults.maxTime, response.duration);
            
            // Consider 2xx and 3xx as success, 4xx and 5xx as expected failures
            if (response.status >= 200 && response.status < 400) {
              batchResults.success++;
            } else {
              batchResults.failed++;
            }
          })
          .catch((error) => {
            batchResults.total++;
            batchResults.failed++;
            batchResults.errors.push(error.message);
          })
      );
    }

    await Promise.all(requests);

    const avgTime = batchResults.totalTime / batchResults.total;
    const successRate = (batchResults.success / batchResults.total) * 100;

    console.log(`  Total requests: ${batchResults.total}`);
    console.log(`  Success: ${batchResults.success} (${successRate.toFixed(2)}%)`);
    console.log(`  Failed: ${batchResults.failed}`);
    console.log(`  Avg response time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min response time: ${batchResults.minTime.toFixed(2)}ms`);
    console.log(`  Max response time: ${batchResults.maxTime.toFixed(2)}ms`);
    console.log();

    results.total += batchResults.total;
    results.success += batchResults.success;
    results.failed += batchResults.failed;
    results.totalTime += batchResults.totalTime;
    results.minTime = Math.min(results.minTime, batchResults.minTime);
    results.maxTime = Math.max(results.maxTime, batchResults.maxTime);
  }

  const overallAvgTime = results.totalTime / results.total;
  const overallSuccessRate = (results.success / results.total) * 100;

  console.log('📊 Overall Results:');
  console.log(`Total requests: ${results.total}`);
  console.log(`Success: ${results.success} (${overallSuccessRate.toFixed(2)}%)`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Avg response time: ${overallAvgTime.toFixed(2)}ms`);
  console.log(`Min response time: ${results.minTime.toFixed(2)}ms`);
  console.log(`Max response time: ${results.maxTime.toFixed(2)}ms`);

  // Performance thresholds
  const thresholds = {
    avgResponseTime: 500, // ms
    successRate: 95, // %
    maxResponseTime: 2000, // ms
  };

  let passed = true;

  if (overallAvgTime > thresholds.avgResponseTime) {
    console.log(`\n❌ Avg response time ${overallAvgTime.toFixed(2)}ms exceeds threshold ${thresholds.avgResponseTime}ms`);
    passed = false;
  }

  if (overallSuccessRate < thresholds.successRate) {
    console.log(`\n❌ Success rate ${overallSuccessRate.toFixed(2)}% below threshold ${thresholds.successRate}%`);
    passed = false;
  }

  if (results.maxTime > thresholds.maxResponseTime) {
    console.log(`\n❌ Max response time ${results.maxTime.toFixed(2)}ms exceeds threshold ${thresholds.maxResponseTime}ms`);
    passed = false;
  }

  if (passed) {
    console.log('\n✅ All load tests passed!');
  } else {
    console.log('\n❌ Some load tests failed!');
    process.exit(1);
  }
}

runLoadTest().catch(console.error);