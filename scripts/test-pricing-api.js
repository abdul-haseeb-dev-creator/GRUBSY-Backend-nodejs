/**
 * Pricing API Test Script
 * Tests the POST /api/pricing/preview endpoint against client requirements
 * 
 * Usage: node scripts/test-pricing-api.js
 */

const BASE_URL = 'https://www.uk-gds.com/api';

// Test cases based on client requirements
const testCases = [
  {
    name: 'Normal Order - 2 miles, £20 subtotal',
    input: { distance: 2, subtotal: 20 },
    expected: {
      subtotal: 20,
      fees: {
        service: 1.50,
        delivery: 4.40  // Normal delivery, no small order surcharge
      },
      grandTotal: 25.90
    }
  },
  {
    name: 'Small Order - 2 miles, £12 subtotal',
    input: { distance: 2, subtotal: 12 },
    expected: {
      subtotal: 12,
      fees: {
        service: 1.50,
        delivery: 7.65  // £4.40 delivery + £3.25 small order surcharge
      },
      grandTotal: 21.15
    }
  },
  {
    name: 'Normal Order - 1 mile, £25 subtotal',
    input: { distance: 1, subtotal: 25 },
    expected: {
      subtotal: 25,
      fees: {
        service: 1.50,
        delivery: 3.45
      },
      grandTotal: 29.95
    }
  },
  {
    name: 'Small Order - 1 mile, £10 subtotal',
    input: { distance: 1, subtotal: 10 },
    expected: {
      subtotal: 10,
      fees: {
        service: 1.50,
        delivery: 5.90  // £3.45 delivery + £2.45 small order surcharge
      },
      grandTotal: 17.40
    }
  },
  {
    name: 'Normal Order - 3 miles, £50 subtotal (verifies fixed service charge)',
    input: { distance: 3, subtotal: 50 },
    expected: {
      subtotal: 50,
      fees: {
        service: 1.50,  // Should be fixed £1.50, NOT 7% = £3.50
        delivery: 5.35
      },
      grandTotal: 56.85
    }
  },
  {
    name: 'Small Order - 3 miles, £14 subtotal',
    input: { distance: 3, subtotal: 14 },
    expected: {
      subtotal: 14,
      fees: {
        service: 1.50,
        delivery: 9.34  // £5.35 delivery + £3.99 small order surcharge
      },
      grandTotal: 24.84
    }
  },
  {
    name: 'Normal Order - 4 miles, £30 subtotal',
    input: { distance: 4, subtotal: 30 },
    expected: {
      subtotal: 30,
      fees: {
        service: 1.50,
        delivery: 6.15
      },
      grandTotal: 37.65
    }
  },
  {
    name: 'Small Order - 4 miles, £8 subtotal',
    input: { distance: 4, subtotal: 8 },
    expected: {
      subtotal: 8,
      fees: {
        service: 1.50,
        delivery: 10.95  // £6.15 delivery + £4.80 small order surcharge
      },
      grandTotal: 20.45
    }
  },
  {
    name: 'Normal Order - 5 miles, £100 subtotal (verifies fixed service charge on large order)',
    input: { distance: 5, subtotal: 100 },
    expected: {
      subtotal: 100,
      fees: {
        service: 1.50,  // Should be fixed £1.50, NOT 8% = £8.00
        delivery: 7.10
      },
      grandTotal: 108.60
    }
  },
  {
    name: 'Small Order - 5 miles, £5 subtotal',
    input: { distance: 5, subtotal: 5 },
    expected: {
      subtotal: 5,
      fees: {
        service: 1.50,
        delivery: 12.09  // £7.10 delivery + £4.99 small order surcharge
      },
      grandTotal: 18.59
    }
  },
  {
    name: 'Edge Case - Exactly £15 subtotal (should NOT be small order)',
    input: { distance: 2, subtotal: 15 },
    expected: {
      subtotal: 15,
      fees: {
        service: 1.50,
        delivery: 4.40  // No small order surcharge
      },
      grandTotal: 20.90
    }
  },
  {
    name: 'Edge Case - £14.99 subtotal (should be small order)',
    input: { distance: 2, subtotal: 14.99 },
    expected: {
      subtotal: 14.99,
      fees: {
        service: 1.50,
        delivery: 7.65  // £4.40 + £3.25 small order surcharge
      },
      grandTotal: 24.14
    }
  }
];

// Helper function to compare numbers with tolerance for floating point
function isClose(a, b, tolerance = 0.01) {
  return Math.abs(a - b) < tolerance;
}

// Helper function to validate response structure
function validateResponseStructure(response) {
  const errors = [];
  
  if (typeof response.subtotal !== 'number') {
    errors.push('Missing or invalid "subtotal" field');
  }
  if (!response.fees || typeof response.fees !== 'object') {
    errors.push('Missing or invalid "fees" object');
  } else {
    if (typeof response.fees.service !== 'number') {
      errors.push('Missing or invalid "fees.service" field');
    }
    if (typeof response.fees.delivery !== 'number') {
      errors.push('Missing or invalid "fees.delivery" field');
    }
  }
  if (typeof response.grandTotal !== 'number') {
    errors.push('Missing or invalid "grandTotal" field');
  }
  
  return errors;
}

// Run a single test
async function runTest(testCase) {
  const { name, input, expected } = testCase;
  
  console.log(`\n📋 Testing: ${name}`);
  console.log(`   Input: distance=${input.distance} miles, subtotal=£${input.subtotal}`);
  
  try {
    const response = await fetch(`${BASE_URL}/pricing/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: HTTP ${response.status} - ${errorText}`);
      return { passed: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    // Validate structure
    const structureErrors = validateResponseStructure(data);
    if (structureErrors.length > 0) {
      console.log(`   ❌ FAILED: Invalid response structure`);
      structureErrors.forEach(err => console.log(`      - ${err}`));
      return { passed: false, error: 'Invalid structure' };
    }
    
    // Compare values
    const errors = [];
    
    if (!isClose(data.subtotal, expected.subtotal)) {
      errors.push(`subtotal: expected £${expected.subtotal}, got £${data.subtotal}`);
    }
    if (!isClose(data.fees.service, expected.fees.service)) {
      errors.push(`fees.service: expected £${expected.fees.service}, got £${data.fees.service}`);
    }
    if (!isClose(data.fees.delivery, expected.fees.delivery)) {
      errors.push(`fees.delivery: expected £${expected.fees.delivery}, got £${data.fees.delivery}`);
    }
    if (!isClose(data.grandTotal, expected.grandTotal)) {
      errors.push(`grandTotal: expected £${expected.grandTotal}, got £${data.grandTotal}`);
    }
    
    if (errors.length > 0) {
      console.log(`   ❌ FAILED: Value mismatch`);
      errors.forEach(err => console.log(`      - ${err}`));
      console.log(`   📦 Response: ${JSON.stringify(data)}`);
      return { passed: false, error: 'Value mismatch', details: errors };
    }
    
    console.log(`   ✅ PASSED`);
    console.log(`   📦 Response: { subtotal: ${data.subtotal}, fees: { service: ${data.fees.service}, delivery: ${data.fees.delivery} }, grandTotal: ${data.grandTotal} }`);
    return { passed: true };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       GRUBSY PRICING API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Endpoint: POST /pricing/preview`);
  console.log(`Total Tests: ${testCases.length}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({ name: testCase.name, ...result });
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The pricing API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
