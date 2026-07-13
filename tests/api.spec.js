// grubsy-backend/tests/api.spec.js
import request from 'supertest';
import express from 'express';
import apiRouter from '../src/api.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Merchants API', () => {
  it('lists merchants', async () => {
    const res = await request(app).get('/api/Merchants');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});