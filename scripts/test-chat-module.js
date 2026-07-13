// scripts/test-chat-module.js
// Minimal smoke-test for driver chat history endpoint.
//
// Usage:
//   DRIVER_JWT="..." ORDER_ID="GDS-004XV" node scripts/test-chat-module.js
//
// Optional:
//   BASE_URL="https://www.uk-gds.com" CONVERSATION_ID="order_GDS-004XV"
//
import fetch from 'node-fetch';

const baseUrl = process.env.BASE_URL || 'https://www.uk-gds.com';
const driverJwt = process.env.DRIVER_JWT;
const orderId = process.env.ORDER_ID;
const conversationId = process.env.CONVERSATION_ID;

if (!driverJwt) {
  console.error('Missing DRIVER_JWT env var');
  process.exit(1);
}

const url = new URL('/api/driver/messages', baseUrl);
if (orderId) url.searchParams.set('orderId', orderId);
if (conversationId) url.searchParams.set('conversationId', conversationId);

const res = await fetch(url.toString(), {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${driverJwt}`,
    'Content-Type': 'application/json',
  },
});

const body = await res.json().catch(() => ({}));

console.log('Status:', res.status);
console.log('Body:', JSON.stringify(body, null, 2));

if (!res.ok) process.exit(1);

