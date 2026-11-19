import { Router } from 'express';
import { incidentController } from '../controllers/incidentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', incidentController.getIncidents);
router.get('/:id', incidentController.getIncidentById);
router.get('/:id/alerts', incidentController.getCorrelatedAlerts);
router.patch('/:id', authMiddleware as any, incidentController.updateIncident as any);
router.post('/:id/notes', authMiddleware as any, incidentController.addNote as any);

export default router;
