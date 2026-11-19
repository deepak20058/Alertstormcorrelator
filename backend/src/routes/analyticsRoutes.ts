import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/trends', analyticsController.getTrends);
router.get('/distribution', analyticsController.getDistribution);
router.get('/export', analyticsController.exportReport);

export default router;
