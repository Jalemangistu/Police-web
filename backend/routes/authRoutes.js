import express from 'express';
import { login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPasswordLimiter, resetPassword);

export default router;
