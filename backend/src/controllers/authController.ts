import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ message: 'Email, password and name are required' });
        return;
      }

      const result = await AuthService.register({ email, password, name, role });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Error in register:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({ message: error.message });
        return;
      }
      console.error('Error in login:', error);
      res.status(500).json({ message: 'Failed to login' });
    }
  }
}