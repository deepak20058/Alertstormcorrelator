import { Router } from 'express';
import { threatIntelController } from '../controllers/threatIntelController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', threatIntelController.getIndicators);
router.get('/:id', threatIntelController.getIndicatorById);
router.post('/', authMiddleware as any, requireRole(['Administrator']) as any, threatIntelController.createIndicator as any);

export default router;
