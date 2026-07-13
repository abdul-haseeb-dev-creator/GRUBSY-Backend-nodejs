// routes/users.js
// User authentication routes

const express = require('express');
const { registerUser, loginUser, refreshUserToken, getUserProfile } = require('../controllers/users');
const { authenticateUser } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { userSchemas } = require('../middleware/schemas');
const { getRateLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - address
 *         - phone
 *         - dob
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         address:
 *           type: string
 *           description: User's address
 *         phone:
 *           type: string
 *           description: User's phone number
 *         dob:
 *           type: string
 *           format: date
 *           description: User's date of birth
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *     UserRegistration:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - address
 *         - phone
 *         - dob
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         address:
 *           type: string
 *           description: User's address
 *         phone:
 *           type: string
 *           description: User's phone number
 *         dob:
 *           type: string
 *           format: date
 *           description: User's date of birth
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User's password
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register',
  getRateLimiter('userRegister'),
  validateBody(userSchemas.register),
  registerUser
);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login',
  getRateLimiter('userLogin'),
  validateBody(userSchemas.login),
  loginUser
);

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Refresh user authentication token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', refreshUserToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authenticateUser, getUserProfile);

module.exports = router;
