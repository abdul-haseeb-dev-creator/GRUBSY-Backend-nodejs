const { test, expect } = require('@playwright/test');

test.describe('Grubsy API E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or state
  });

  test('should handle establishment management flow', async ({ request }) => {
    // Test the complete establishment management workflow
    
    // 1. Create a new establishment
    const newEstablishment = {
      name: 'E2E Test Restaurant',
      address: '123 E2E Test Street',
      phone: '555-0199',
      email: 'e2e@test.com',
      cuisine: 'Italian'
    };

    const createResponse = await request.post('/api/establishments', {
      data: newEstablishment
    });
    
    expect(createResponse.ok()).toBeTruthy();
    const createdEstablishment = await createResponse.json();
    expect(createdEstablishment).toHaveProperty('success', true);
    
    const establishmentId = createdEstablishment.id;

    // 2. Retrieve the establishment
    const getResponse = await request.get(`/api/establishments/${establishmentId}`);
    expect(getResponse.ok()).toBeTruthy();
    
    const retrievedEstablishment = await getResponse.json();
    expect(retrievedEstablishment.name).toBe(newEstablishment.name);
    expect(retrievedEstablishment.email).toBe(newEstablishment.email);

    // 3. Update the establishment
    const updateData = {
      name: 'Updated E2E Test Restaurant',
      phone: '555-0299'
    };

    const updateResponse = await request.put(`/api/establishments/${establishmentId}`, {
      data: updateData
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    const updateResult = await updateResponse.json();
    expect(updateResult).toHaveProperty('success', true);

    // 4. Verify the update
    const verifyResponse = await request.get(`/api/establishments/${establishmentId}`);
    const updatedEstablishment = await verifyResponse.json();
    expect(updatedEstablishment.name).toBe(updateData.name);
    expect(updatedEstablishment.phone).toBe(updateData.phone);

    // 5. Clean up - delete the establishment
    const deleteResponse = await request.delete(`/api/establishments/${establishmentId}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('should handle order management workflow', async ({ request }) => {
    // Test order creation, updates, and status changes
    
    const newOrder = {
      establishmentId: 'test-establishment-1',
      customerName: 'John Doe',
      customerPhone: '555-0123',
      items: [
        {
          name: 'Margherita Pizza',
          quantity: 2,
          price: 15.99
        },
        {
          name: 'Caesar Salad',
          quantity: 1,
          price: 8.99
        }
      ],
      totalAmount: 40.97,
      deliveryAddress: '456 Customer Street'
    };

    // Create order
    const createOrderResponse = await request.post('/api/orders', {
      data: newOrder
    });
    
    expect(createOrderResponse.ok()).toBeTruthy();
    const createdOrder = await createOrderResponse.json();
    expect(createdOrder).toHaveProperty('success', true);
    
    const orderId = createdOrder.id;

    // Update order status
    const statusUpdates = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    
    for (const status of statusUpdates) {
      const statusResponse = await request.patch(`/api/orders/${orderId}/status`, {
        data: { status }
      });
      
      expect(statusResponse.ok()).toBeTruthy();
      const statusResult = await statusResponse.json();
      expect(statusResult).toHaveProperty('success', true);
      
      // Verify status update
      const orderResponse = await request.get(`/api/orders/${orderId}`);
      const order = await orderResponse.json();
      expect(order.status).toBe(status);
    }
  });

  test('should handle authentication flow', async ({ request }) => {
    // Test user registration and login
    
    const testUser = {
      email: 'e2e-test@grubsy.com',
      password: 'TestPassword123!',
      name: 'E2E Test User',
      role: 'establishment'
    };

    // Register user
    const registerResponse = await request.post('/api/auth/register', {
      data: testUser
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerResult = await registerResponse.json();
    expect(registerResult).toHaveProperty('success', true);

    // Login user
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginResult = await loginResponse.json();
    expect(loginResult).toHaveProperty('token');
    expect(loginResult).toHaveProperty('user');
    
    const token = loginResult.token;

    // Test authenticated request
    const profileResponse = await request.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();
    expect(profile.email).toBe(testUser.email);
    expect(profile.name).toBe(testUser.name);
  });

  test('should handle error scenarios gracefully', async ({ request }) => {
    // Test various error conditions
    
    // 1. Test 404 for non-existent resource
    const notFoundResponse = await request.get('/api/establishments/non-existent-id');
    expect(notFoundResponse.status()).toBe(404);

    // 2. Test validation errors
    const invalidDataResponse = await request.post('/api/establishments', {
      data: {
        // Missing required fields
        name: ''
      }
    });
    expect(invalidDataResponse.status()).toBe(400);

    // 3. Test unauthorized access
    const unauthorizedResponse = await request.get('/api/auth/profile');
    expect(unauthorizedResponse.status()).toBe(401);

    // 4. Test invalid authentication token
    const invalidTokenResponse = await request.get('/api/auth/profile', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(invalidTokenResponse.status()).toBe(401);
  });

  test('should handle concurrent requests', async ({ request }) => {
    // Test system behavior under concurrent load
    
    const concurrentRequests = [];
    const numberOfRequests = 10;

    for (let i = 0; i < numberOfRequests; i++) {
      const requestPromise = request.get('/api/establishments').then(response => {
        expect(response.ok()).toBeTruthy();
        return response.json();
      });
      concurrentRequests.push(requestPromise);
    }

    // Wait for all requests to complete
    const results = await Promise.all(concurrentRequests);
    
    // Verify all requests succeeded
    expect(results).toHaveLength(numberOfRequests);
    results.forEach(result => {
      expect(Array.isArray(result)).toBeTruthy();
    });
  });
});