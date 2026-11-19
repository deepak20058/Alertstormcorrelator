import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { dal } from '../services/db/dal';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    }

    const user = await dal.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User associated with token no longer exists.' });
    }

    req.user = {
      id: user._id || user.id || decoded.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Unauthorized: ' + (err?.message || 'Token verification failed') });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }
    next();
  };
}
