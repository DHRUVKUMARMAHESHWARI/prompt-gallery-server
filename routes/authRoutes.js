
import express from 'express';
import { registerUser, loginUser, getMe, deductCredit, rewardCredit } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/deduct-credit', protect, deductCredit);
router.post('/reward-credit', protect, rewardCredit);

export default router;