const admin = require('firebase-admin');
const AWS = require('aws-sdk');

let firebaseInitialized = false;

async function initializeFirebase() {
  if (!firebaseInitialized && admin.apps.length === 0) {
    try {
      const secretsManager = new AWS.SecretsManager({ region: 'eu-west-2' });
      const secret = await secretsManager.getSecretValue({
        SecretId: 'firebase_service_account_json',
      }).promise();

      const serviceAccount = JSON.parse(secret.SecretString);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Firebase init failed:', error);
      throw error;
    }
  }
}

async function sendPushToTokens(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  await initializeFirebase();

  const message = {
    notification: { title, body },
    data: { ...data, timestamp: Date.now().toString() },
    android: {
      priority: 'high',
      notification: {
        channelId: 'orders',
        sound: 'default',
      },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default' } },
    },
  };

  try {
    const response = await admin.messaging().sendMulticast({
      tokens,
      ...message,
    });

    console.log(`📲 Push sent: ${response.successCount}/${tokens.length} successful`);

    // TODO: cleanup invalid tokens
    return response;
  } catch (error) {
    console.error('Push error:', error);
    throw error;
  }
}

module.exports = { sendPushToTokens };