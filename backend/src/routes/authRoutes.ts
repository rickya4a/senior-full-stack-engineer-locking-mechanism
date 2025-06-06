import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(rateLimiter);

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

export default router;