import { Router } from 'express';
import { correlationController } from '../controllers/correlationController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.post('/run', authMiddleware as any, correlationController.runCorrelation as any);
router.get('/results', correlationController.getCorrelationResults);
router.get('/rules', correlationController.getRules);
router.post('/rules', authMiddleware as any, requireRole(['Administrator']) as any, correlationController.createRule as any);
router.patch('/rules/:ruleId', authMiddleware as any, requireRole(['Administrator']) as any, correlationController.updateRule as any);

export default router;
