import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(' ')[1];
    }

    // For sendBeacon requests, check body
    if (!token && req.body && typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        if (parsedBody.authorization) {
          token = parsedBody.authorization.split(' ')[1];
        }
      } catch (e) {
        console.error('Failed to parse request body:', e);
      }
    } else if (!token && req.body && req.body.authorization) {
      token = req.body.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};