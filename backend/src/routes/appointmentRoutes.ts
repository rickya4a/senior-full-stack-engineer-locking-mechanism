import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate } from '../middlewares/auth';
import { checkLockOwnership } from '../middlewares/checkLockOwnership';

const router = Router();

// Apply authentication and rate limiting to all routes
router.use(authenticate);

router.post('/appointments', AppointmentController.create);
router.get('/appointments', AppointmentController.getAll);
router.get('/appointments/:id', AppointmentController.getOne);

// Update appointment - requires lock ownership
router.put(
  '/appointments/:id',
  checkLockOwnership,
  AppointmentController.update
);

router.delete('/appointments/:id', AppointmentController.delete);

export default router;