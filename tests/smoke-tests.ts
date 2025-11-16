/**
 * Smoke Tests for RENUS Frontend Integration
 * Basic end-to-end tests to validate critical functionality
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://72.60.151.78:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://renus-frontend.vercel.app';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

const results: TestResult[] = [];

/**
 * Assert helper
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Measure response time
 */
async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Test endpoint helper
 */
async function testEndpoint(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

/**
 * Test 1: Frontend loads successfully
 */
async function testFrontendLoads(): Promise<TestResult> {
  const testName = 'Frontend Loads';
  const start = Date.now();

  try {
    const { result: response, duration } = await measureResponseTime(() =>
      fetch(FRONTEND_URL)
    );

    assert(response.ok, `Expected 200, got ${response.status}`);
    assert(
      response.headers.get('content-type')?.includes('text/html') || false,
      'Expected HTML content type'
    );

    const html = await response.text();
    assert(html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'), 'Expected HTML document');

    return {
      name: testName,
      passed: true,
      duration: Date.now() - start,
      details: {
        responseTime: duration,
        statusCode: response.status,
        contentType: response.headers.get('content-type'),
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 2: API health check
 */
async function testAPIHealthCheck(): Promise<TestResult> {
  const testName = 'API Health Check';
  const start = Date.now();

  try {
    const { result: response, duration } = await measureResponseTime(() =>
      testEndpoint(`${API_BASE_URL}/health`)
    );

    assert(response.ok, `Expected 200, got ${response.status}`);

    const data = await response.json();
    assert(data.status === 'healthy', 'Expected healthy status');

    return {
      name: testName,
      passed: true,
      duration: Date.now() - start,
      details: {
        responseTime: duration,
        statusCode: response.status,
        health: data,
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 3: CORS validation
 */
async function testCORSValidation(): Promise<TestResult> {
  const testName = 'CORS Validation';
  const start = Date.now();

  try {
    const { result: response, duration } = await measureResponseTime(() =>
      testEndpoint(`${API_BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      })
    );

    // OPTIONS should return 204 or 200
    assert(
      response.status === 204 || response.status === 200,
      `Expected 204 or 200, got ${response.status}`
    );

    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    const allowHeaders = response.headers.get('access-control-allow-headers');

    return {
      name: testName,
      passed: true,
      duration: Date.now() - start,
      details: {
        responseTime: duration,
        statusCode: response.status,
        cors: {
          allowOrigin,
          allowMethods,
          allowHeaders,
        },
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 4: WebSocket connection
 */
async function testWebSocketConnection(): Promise<TestResult> {
  const testName = 'WebSocket Connection';
  const start = Date.now();

  try {
    const wsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const fullWsUrl = `${wsUrl}/api/v1/agent/voice-stream`;

    const { result: connected, duration } = await measureResponseTime(
      () =>
        new Promise<boolean>((resolve, reject) => {
          const ws = new WebSocket(fullWsUrl);
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
          }, 5000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          };

          ws.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket error'));
          };
        })
    );

    assert(connected, 'WebSocket connection failed');

    return {
      name: testName,
      passed: true,
      duration: Date.now() - start,
      details: {
        connectionTime: duration,
        wsUrl: fullWsUrl,
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 5: Leads API endpoint
 */
async function testLeadsAPI(): Promise<TestResult> {
  const testName = 'Leads API';
  const start = Date.now();

  try {
    const { result: response, duration } = await measureResponseTime(() =>
      testEndpoint(`${API_BASE_URL}/api/v1/leads`)
    );

    // 401 is acceptable if authentication is required
    // 200 is acceptable if endpoint is public
    assert(
      response.status === 200 || response.status === 401,
      `Expected 200 or 401, got ${response.status}`
    );

    return {
      name: testName,
      passed: true,
      duration: Date.now() - start,
      details: {
        responseTime: duration,
        statusCode: response.status,
        requiresAuth: response.status === 401,
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 6: Performance metrics
 */
async function testPerformanceMetrics(): Promise<TestResult> {
  const testName = 'Performance Metrics';
  const start = Date.now();

  try {
    // Test frontend load time
    const frontendStart = Date.now();
    const frontendResponse = await fetch(FRONTEND_URL);
    const frontendDuration = Date.now() - frontendStart;

    // Test API response time
    const apiStart = Date.now();
    const apiResponse = await fetch(`${API_BASE_URL}/health`);
    const apiDuration = Date.now() - apiStart;

    // Performance targets
    const FRONTEND_TARGET = 3000; // 3 seconds
    const API_TARGET = 500; // 500ms

    const frontendPass = frontendDuration < FRONTEND_TARGET;
    const apiPass = apiDuration < API_TARGET;

    return {
      name: testName,
      passed: frontendPass && apiPass,
      duration: Date.now() - start,
      details: {
        frontend: {
          duration: frontendDuration,
          target: FRONTEND_TARGET,
          passed: frontendPass,
        },
        api: {
          duration: apiDuration,
          target: API_TARGET,
          passed: apiPass,
        },
      },
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all tests
 */
async function runSmokeTests(): Promise<void> {
  console.log('========================================');
  console.log('RENUS Smoke Tests');
  console.log('========================================');
  console.log('');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('');
  console.log('Running tests...');
  console.log('');

  // Run basic tests
  results.push(await testFrontendLoads());
  results.push(await testAPIHealthCheck());
  results.push(await testCORSValidation());

  // Run advanced tests
  results.push(await testWebSocketConnection());
  results.push(await testLeadsAPI());
  results.push(await testPerformanceMetrics());

  // Print results
  console.log('========================================');
  console.log('Test Results');
  console.log('========================================');
  console.log('');

  let passedCount = 0;
  let failedCount = 0;

  results.forEach((result) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${status}${reset} ${result.name} (${result.duration}ms)`);

    if (result.passed && result.details) {
      console.log(`  Details:`, JSON.stringify(result.details, null, 2));
      passedCount++;
    } else if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
      failedCount++;
    }

    console.log('');
  });

  // Summary
  console.log('========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('');

  // Exit with error code if any test failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run tests
runSmokeTests().catch((error) => {
  console.error('Fatal error running smoke tests:', error);
  process.exit(1);
});
