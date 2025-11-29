import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export class AuthMiddleware {
  static authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      req.userId = decoded.userId;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  static optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        req.userId = decoded.userId;
        req.user = decoded;
      }
      next();
    } catch (error) {
      next();
    }
  }
}