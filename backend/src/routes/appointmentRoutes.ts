import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate } from '../middlewares/auth';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(rateLimiter);

router.post('/appointments', AppointmentController.create);
router.get('/appointments', AppointmentController.findAll);
router.get('/appointments/:id', AppointmentController.findById);
router.put('/appointments/:id', AppointmentController.update);
router.delete('/appointments/:id', AppointmentController.delete);

export default router;