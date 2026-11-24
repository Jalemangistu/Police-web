import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { auth, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSettings);
router.get('/admin', auth, authorize('content:read'), getSettings);
router.put('/admin', auth, authorize('content:write'), updateSettings);

export default router;
