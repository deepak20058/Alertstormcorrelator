import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { alertController } from '../controllers/alertController';
import { authMiddleware } from '../middleware/auth';

const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlertById);
router.post('/', authMiddleware as any, alertController.createAlert as any);
router.post('/upload', authMiddleware as any, upload.single('file'), alertController.uploadAlerts as any);
router.post('/simulate', authMiddleware as any, alertController.simulateAlert as any);
router.delete('/:id', authMiddleware as any, alertController.deleteAlert as any);

export default router;
