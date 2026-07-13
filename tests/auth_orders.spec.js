// grubsy-backend/tests/auth_orders.spec.js
import request from 'supertest';
import express from 'express';
import apiRouter from '../src/api.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Auth + Orders', () => {
  let accessToken;
  let merchantId;
  let menuItemId;

  it('lists merchants and picks one', async () => {
    const res = await request(app).get('/api/Merchants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    merchantId = res.body.data[0].id;
  });

  it('logs in demo user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@grubsy.com', password: 'Demo123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
  });

  it('gets menus and picks an item', async () => {
    const res = await request(app).get(`/api/Merchants/${merchantId}/menus`);
    expect(res.status).toBe(200);
    const menus = res.body.data.menus || res.body.data?.menus || [];
    expect(Array.isArray(menus)).toBe(true);
    const firstMenu = menus[0];
    expect(firstMenu).toBeTruthy();
    expect(firstMenu.items.length).toBeGreaterThan(0);
    menuItemId = firstMenu.items[0].id;
  });

  it('creates an order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        merchantId,
        deliveryAddress: '1 Demo Street, London',
        items: [{ menuItemId, quantity: 2 }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.items.length).toBe(1);
  });
});