import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.05'],                 // Error rate must be less than 5%
    errors: ['rate<0.05'],                          // Custom error rate must be less than 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

export default function loadTest() {
  // Test 1: Save History API
  const historyPayload = {
    event: 'timeupdate',
    currentTime: Math.floor(Math.random() * 3600),
    duration: 7200,
    mediaId: Math.floor(Math.random() * 1000) + 1,
    mediaType: 'movie',
    mediaDetails: {
      adult: false,
      backdrop_path: '/path.jpg',
      poster_path: '/poster.jpg',
      release_date: '2024-01-01',
      title: 'Test Movie',
      vote_average: 8.5,
    },
  };

  const historyResponse = http.post(
    `${BASE_URL}/api/player/save-history`,
    JSON.stringify(historyPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const historySuccess = check(historyResponse, {
    'history status is 200 or 401': (r) => r.status === 200 || r.status === 401, // 401 is expected without auth
    'history response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!historySuccess);

  sleep(1);

  // Test 2: Auth Callback API (simulation)
  const callbackResponse = http.get(`${BASE_URL}/api/auth/callback?code=test_code`);

  const callbackSuccess = check(callbackResponse, {
    'callback status is 307 or 400': (r) => r.status === 307 || r.status === 400,
    'callback response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!callbackSuccess);

  sleep(1);

  // Test 3: Auth Confirm API (simulation)
  const confirmResponse = http.get(`${BASE_URL}/api/auth/confirm?token_hash=test&type=email`);

  const confirmSuccess = check(confirmResponse, {
    'confirm status is 302 or 400': (r) => r.status === 302 || r.status === 400,
    'confirm response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!confirmSuccess);

  sleep(2);
}