// Quick test for opening hours utility
import { isRestaurantOpen } from './utils/openingHours.js';

// Test cases
const testCases = [
  {
    openingTimes: '11:00-23:00',
    isActive: true,
    expected: true, // Assuming current time is within 11:00-23:00
    description: 'Simple daily hours - should be open during business hours'
  },
  {
    openingTimes: '11:00-23:00',
    isActive: false,
    expected: false,
    description: 'Inactive restaurant - should be closed'
  },
  {
    openingTimes: 'Mon-Sun: 10:00-22:00',
    isActive: true,
    expected: true, // Assuming current time is within 10:00-22:00
    description: 'Days specified - should be open during business hours'
  },
  {
    openingTimes: '',
    isActive: true,
    expected: false,
    description: 'No opening times - should be closed'
  }
];

console.log('Testing opening hours utility...\n');

testCases.forEach((testCase, index) => {
  const result = isRestaurantOpen(testCase.openingTimes, testCase.isActive);
  const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';

  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Opening Times: "${testCase.openingTimes}"`);
  console.log(`  Active: ${testCase.isActive}`);
  console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
  console.log('');
});

console.log('Test completed.');