module.exports = {
  // Stripe Payment Methods
  createStripePaymentIntent: jest.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_mock_123',
      object: 'payment_intent',
      client_secret: 'mock_client_secret_abc',
      status: 'succeeded',
      amount: 1000,
      currency: 'gbp',
    },
    clientSecret: 'mock_client_secret_abc',
  }),
  
  confirmStripePayment: jest.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_mock_123',
      status: 'succeeded',
    },
    status: 'succeeded',
  }),
  
  // Apple Pay & Google Pay (handled through Stripe)
  createApplePaySession: jest.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_mock_apple_123',
      object: 'payment_intent',
      client_secret: 'mock_apple_client_secret_abc',
      status: 'succeeded',
      amount: 1000,
      currency: 'gbp',
    },
    clientSecret: 'mock_apple_client_secret_abc',
  }),
  
  createGooglePaySession: jest.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_mock_google_123',
      object: 'payment_intent',
      client_secret: 'mock_google_client_secret_abc',
      status: 'succeeded',
      amount: 1000,
      currency: 'gbp',
    },
    clientSecret: 'mock_google_client_secret_abc',
  }),
  
  // PayPal Payment Methods
  createPayPalOrder: jest.fn().mockResolvedValue({
    success: true,
    orderId: 'pp_mock_123',
    approvalUrl: 'https://paypal.com/approval',
  }),
  
  capturePayPalOrder: jest.fn().mockResolvedValue({
    success: true,
    captureId: 'capture_mock_123',
    status: 'COMPLETED',
  }),
  
  // Klarna Payment Methods
  createKlarnaSession: jest.fn().mockResolvedValue({
    success: true,
    sessionId: 'klarna_session_mock_123',
    clientToken: 'client_token_mock_abc',
  }),
  
  createKlarnaOrder: jest.fn().mockResolvedValue({
    success: true,
    orderId: 'klarna_order_mock_123',
    status: 'authorized',
  }),
  
  // Refund Methods
  processRefund: jest.fn().mockResolvedValue({
    success: true,
    refundId: 'refund_mock_123',
    amount: 10.99,
    status: 'completed',
  }),
  
  // Fraud Detection
  validatePayment: jest.fn().mockResolvedValue({
    isValid: true,
    riskScore: 10,
    recommendations: ['low_risk'],
  }),
  
  // Webhook verification methods (mock implementations)
  verifyPayPalWebhookSignature: jest.fn().mockResolvedValue(true),
  
  updateOrderStatus: jest.fn().mockResolvedValue({ success: true }),
  
  updateOrderFraudStatus: jest.fn().mockResolvedValue({ success: true }),
  
  processPaymentCapture: jest.fn().mockResolvedValue({ success: true }),
  
  processOrderRefund: jest.fn().mockResolvedValue({ success: true }),
};