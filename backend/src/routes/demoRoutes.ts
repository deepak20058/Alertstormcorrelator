import { Router } from 'express';
import { demoController } from '../controllers/demoController';

const router = Router();

router.post('/reset', demoController.resetDemo);
router.get('/health', demoController.healthCheck);

export default router;
