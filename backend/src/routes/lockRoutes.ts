import { Router } from 'express';
import { LockController } from '../controllers/lockController';
import { authenticate, isAdmin } from '../middlewares/auth';

const router = Router();

router.get(
  '/appointments/:appointmentId/lock-status',
  authenticate,
  LockController.getLockStatus
);

router.post(
  '/appointments/:appointmentId/acquire-lock',
  authenticate,
  LockController.acquireLock
);

router.delete(
  '/appointments/:appointmentId/release-lock',
  authenticate,
  LockController.releaseLock
);

router.delete(
  '/appointments/:appointmentId/admin-release-lock',
  authenticate,
  isAdmin,
  LockController.adminReleaseLock
);

export default router;