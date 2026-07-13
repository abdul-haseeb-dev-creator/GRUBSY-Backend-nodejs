import express from 'express';
import { getAll, getAssigned, rateCourier } from '../controllers/couriers.js';
import { authRequired } from '../src/middleware/authRequired.js';

const router = express.Router();

// Get all couriers (for restaurant staff)
router.get('/', authRequired, getAll);
// Get couriers assigned to current restaurant
router.get('/assigned', authRequired, getAssigned);
// Rate a courier for an order
router.post('/:courierId/ratings', authRequired, rateCourier);

export default router;