import { Router } from 'express';
import { LockController } from '../controllers/lockController';
import { authenticate, isAdmin } from '../middlewares/auth';
import { adminOnly } from '../middlewares/adminOnly';
import { lockRateLimiter } from '../middlewares/lockRateLimiter';

const router = Router();

router.get(
  '/appointments/:appointmentId/lock-status',
  authenticate,
  LockController.getLockStatus
);

router.post(
  '/appointments/:appointmentId/acquire-lock',
  authenticate,
  lockRateLimiter,
  LockController.acquireLock
);

// For normal release lock
router.delete(
  '/appointments/:appointmentId/release-lock',
  authenticate,
  LockController.releaseLock
);

// For sendBeacon release lock
router.post(
  '/appointments/release-lock',
  authenticate,
  LockController.postReleaseLock
);

router.delete(
  '/appointments/:appointmentId/admin-release-lock',
  authenticate,
  isAdmin,
  LockController.adminReleaseLock
);

// Admin force release lock
router.delete(
  '/appointments/:appointmentId/force-release-lock',
  authenticate,
  adminOnly,
  LockController.adminReleaseLock
);

export default router;