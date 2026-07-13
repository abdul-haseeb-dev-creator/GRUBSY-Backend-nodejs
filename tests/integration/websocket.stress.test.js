// WebSocket stress test for Grubsy backend
const WebSocket = require('ws');
const SERVER_URL = process.env.WS_URL || 'ws://localhost:3001';

describe('WebSocket Stress Test', () => {
  let clients = [];
  const NUM_CLIENTS = 50; // Adjust for stress level

  beforeAll(() => {
    // Create multiple WebSocket clients
    for (let i = 0; i < NUM_CLIENTS; i++) {
      clients.push(new WebSocket(SERVER_URL));
    }
  });

  afterAll(() => {
    // Close all clients
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    clients = [];
  });

  test('all clients connect and receive welcome event', done => {
    let connected = 0;
    let received = 0;
    clients.forEach(client => {
      client.on('open', () => {
        connected++;
        // Optionally send a test message
        client.send(JSON.stringify({ type: 'ping' }));
      });
      client.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'welcome' || msg.type === 'pong') {
          received++;
        }
        if (connected === NUM_CLIENTS && received === NUM_CLIENTS) {
          done();
        }
      });
      client.on('error', err => {
        // Fail test on error
        done(err);
      });
    });
  }, 20000); // 20s timeout for stress test
});
