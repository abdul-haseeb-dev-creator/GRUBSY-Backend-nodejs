// Test script to verify the orders API endpoint is working
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002/api';

async function testOrdersAPI() {
  console.log('🧪 Testing Orders API...\n');
  
  try {
    // Test the available orders endpoint
    console.log('📡 Fetching available orders from:', `${API_BASE_URL}/driver/orders/available`);
    
    const response = await fetch(`${API_BASE_URL}/driver/orders/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // No authorization header - should be bypassed by middleware
      },
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ SUCCESS! Orders fetched successfully:');
      console.log('📦 Raw Response:', JSON.stringify(responseData, null, 2));
      
      // Check if response has data property (common API pattern)
      const orders = responseData.data || responseData;
      
      if (Array.isArray(orders) && orders.length > 0) {
        console.log('\n📋 Order Details:');
        orders.forEach((order, index) => {
          console.log(`\n--- Order ${index + 1} ---`);
          console.log('ID:', order.id);
          console.log('Status:', order.status);
          console.log('Customer:', order.user?.name || order.customerName);
          console.log('Total:', order.totalCents || order.totalAmount);
          console.log('Items:', order.items?.length || 0);
          console.log('Created:', new Date(order.createdAt).toLocaleString());
        });
      } else {
        console.log('⚠️  No orders found or unexpected response format');
        console.log('📊 Response type:', typeof responseData);
        console.log('📊 Is array:', Array.isArray(responseData));
      }
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED! Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network/Connection Error:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('- Is the backend server running on port 3002?');
    console.log('- Check if MySQL is running');
    console.log('- Verify the database contains orders');
  }
}

// Run the test
testOrdersAPI();