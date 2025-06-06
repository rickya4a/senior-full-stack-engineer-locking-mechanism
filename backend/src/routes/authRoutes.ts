import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { rateLimiter } from '../middlewares/rateLimiter';
import { authenticate } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/authRateLimiter';

const router = Router();

router.use(rateLimiter);

router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);

router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;