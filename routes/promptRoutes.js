
import express from 'express';
import { createPrompt, getPromptsBySpace, deletePrompt, updatePrompt, toggleFavorite, submitUsageSignal, getUsageSummary, getUsageHistory } from '../controllers/promptController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createPrompt);
router.get('/:spaceId', protect, getPromptsBySpace);
router.delete('/:id', protect, deletePrompt);
router.put('/:id', protect, updatePrompt);
router.put('/:id/favorite', protect, toggleFavorite);
router.post('/:id/usage-signal', protect, submitUsageSignal);
router.get('/:id/usage-summary', protect, getUsageSummary);
router.get('/:id/usage-history', protect, getUsageHistory);

export default router;
