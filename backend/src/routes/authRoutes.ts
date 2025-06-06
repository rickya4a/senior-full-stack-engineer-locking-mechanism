import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { rateLimiter } from '../middlewares/rateLimiter';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(rateLimiter);

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;