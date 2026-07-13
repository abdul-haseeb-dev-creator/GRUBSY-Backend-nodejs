import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../src/middleware/authRequired.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', authRequired, async (req, res) => {
  try {
    const { platform, token, deviceId } = req.body;
    const user = req.user; // From JWT: { id, role, ... }

    // Validate
    if (!platform || !token || !deviceId) {
      return res.status(400).json({ error: 'platform, token, and deviceId required' });
    }
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({ error: 'platform must be android or ios' });
    }

    // Build data
    const data = {
      token,
      platform,
      deviceId,
      updatedAt: new Date(),
    };

    if (user.role === 'driver') {
      data.driverId = user.id;
    } else {
      data.userId = user.id;
    }

    // Upsert
    await prisma.deviceToken.upsert({
      where: { token },
      update: data,
      create: data,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Device register error:', err);
    return res.status(500).json({ error: 'Failed to register device' });
  }
});

export default router;