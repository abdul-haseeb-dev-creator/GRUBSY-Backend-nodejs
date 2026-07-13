import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const establishments = [
  {
    name: 'Load Test Restaurant 1',
    address: '123 Load Test St',
    phone: '555-0101',
    email: 'loadtest1@example.com'
  },
  {
    name: 'Load Test Restaurant 2',
    address: '456 Load Test Ave',
    phone: '555-0102',
    email: 'loadtest2@example.com'
  }
];

const orders = [
  {
    establishmentId: 'test-establishment-1',
    customerName: 'Load Test Customer',
    customerPhone: '555-0199',
    items: [
      { name: 'Test Pizza', quantity: 1, price: 12.99 },
      { name: 'Test Drink', quantity: 2, price: 2.99 }
    ],
    totalAmount: 18.97,
    deliveryAddress: '789 Customer St'
  }
];

export function setup() {
  // Setup phase - create test data
  console.log('Setting up performance test data...');
  
  // Create test establishments
  const createdEstablishments = [];
  establishments.forEach(establishment => {
    const response = http.post(`${BASE_URL}/api/establishments`, JSON.stringify(establishment), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.status === 201) {
      const created = response.json();
      createdEstablishments.push(created);
    }
  });
  
  return { establishments: createdEstablishments };
}

export default function (data) {
  // Main test scenarios
  
  // Scenario 1: Health check (10% of requests)
  if (Math.random() < 0.1) {
    healthCheck();
  }
  
  // Scenario 2: List establishments (30% of requests)
  else if (Math.random() < 0.4) {
    listEstablishments();
  }
  
  // Scenario 3: Create and manage orders (40% of requests)
  else if (Math.random() < 0.8) {
    orderManagement(data);
  }
  
  // Scenario 4: Authentication flow (20% of requests)
  else {
    authenticationFlow();
  }
  
  sleep(1); // Wait 1 second between iterations
}

function healthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
    'health check has correct status': (r) => r.json('status') === 'ok',
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function listEstablishments() {
  const response = http.get(`${BASE_URL}/api/establishments`);
  
  const success = check(response, {
    'list establishments status is 200': (r) => r.status === 200,
    'list establishments response time < 300ms': (r) => r.timings.duration < 300,
    'list establishments returns array': (r) => Array.isArray(r.json()),
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function orderManagement(data) {
  // Create order
  const orderData = {
    ...orders[0],
    establishmentId: data.establishments.length > 0 ? data.establishments[0].id : 'test-establishment-1',
    customerName: `Customer ${__VU}-${__ITER}`, // Unique customer name per virtual user and iteration
  };
  
  const createResponse = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const createSuccess = check(createResponse, {
    'create order status is 201': (r) => r.status === 201,
    'create order response time < 500ms': (r) => r.timings.duration < 500,
    'create order returns success': (r) => r.json('success') === true,
  });
  
  errorRate.add(!createSuccess);
  responseTime.add(createResponse.timings.duration);
  
  if (createResponse.status === 201) {
    const orderId = createResponse.json('id');
    
    // Update order status
    const statusResponse = http.patch(`${BASE_URL}/api/orders/${orderId}/status`, 
      JSON.stringify({ status: 'confirmed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const statusSuccess = check(statusResponse, {
      'update order status is 200': (r) => r.status === 200,
      'update order response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!statusSuccess);
    responseTime.add(statusResponse.timings.duration);
    
    // Get order details
    const getResponse = http.get(`${BASE_URL}/api/orders/${orderId}`);
    
    const getSuccess = check(getResponse, {
      'get order status is 200': (r) => r.status === 200,
      'get order response time < 200ms': (r) => r.timings.duration < 200,
      'get order has correct status': (r) => r.json('status') === 'confirmed',
    });
    
    errorRate.add(!getSuccess);
    responseTime.add(getResponse.timings.duration);
  }
}

function authenticationFlow() {
  const testUser = {
    email: `loadtest-${__VU}-${__ITER}@example.com`,
    password: 'LoadTest123!',
    name: `Load Test User ${__VU}`,
    role: 'customer'
  };
  
  // Register user
  const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const registerSuccess = check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
    'register response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!registerSuccess);
  responseTime.add(registerResponse.timings.duration);
  
  if (registerResponse.status === 201) {
    // Login user
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 300ms': (r) => r.timings.duration < 300,
      'login returns token': (r) => r.json('token') !== undefined,
    });
    
    errorRate.add(!loginSuccess);
    responseTime.add(loginResponse.timings.duration);
    
    if (loginResponse.status === 200) {
      const token = loginResponse.json('token');
      
      // Get user profile
      const profileResponse = http.get(`${BASE_URL}/api/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      const profileSuccess = check(profileResponse, {
        'profile status is 200': (r) => r.status === 200,
        'profile response time < 200ms': (r) => r.timings.duration < 200,
        'profile has correct email': (r) => r.json('email') === testUser.email,
      });
      
      errorRate.add(!profileSuccess);
      responseTime.add(profileResponse.timings.duration);
    }
  }
}

export function teardown(data) {
  // Cleanup phase - remove test data
  console.log('Cleaning up performance test data...');
  
  // Clean up created establishments
  if (data.establishments) {
    data.establishments.forEach(establishment => {
      http.del(`${BASE_URL}/api/establishments/${establishment.id}`);
    });
  }
}

export function handleSummary(data) {
  return {
    'performance-results.json': JSON.stringify(data, null, 2),
    'performance-summary.html': htmlReport(data),
  };
}

function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Grubsy Performance Test Results</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .pass { background-color: #d4edda; }
            .fail { background-color: #f8d7da; }
        </style>
    </head>
    <body>
        <h1>Grubsy Performance Test Results</h1>
        <h2>Summary</h2>
        <div class="metric">
            <strong>Total Requests:</strong> ${data.metrics.http_reqs.count}
        </div>
        <div class="metric">
            <strong>Failed Requests:</strong> ${data.metrics.http_req_failed.count}
        </div>
        <div class="metric">
            <strong>Average Response Time:</strong> ${data.metrics.http_req_duration.avg.toFixed(2)}ms
        </div>
        <div class="metric">
            <strong>95th Percentile Response Time:</strong> ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms
        </div>
        <div class="metric">
            <strong>Test Duration:</strong> ${(data.state.testRunDurationMs / 1000).toFixed(2)}s
        </div>
    </body>
    </html>
  `;
}