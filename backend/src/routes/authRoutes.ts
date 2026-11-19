import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/demo-login', authController.demoLogin);
router.post('/forgot-password', authController.forgotPassword);
router.get('/me', authMiddleware as any, authController.getMe as any);

export default router;
