import express from 'express';
import { createSpace, joinSpace, getMySpaces, getSpaceById, updateSpace, deleteSpace } from '../controllers/spaceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createSpace);
router.post('/join', protect, joinSpace);
router.get('/my-groups', protect, getMySpaces);
router.get('/:id', protect, getSpaceById);
router.put('/:id', protect, updateSpace);
router.delete('/:id', protect, deleteSpace);

export default router;