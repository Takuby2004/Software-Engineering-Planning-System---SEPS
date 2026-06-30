import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    createdAt: Date | null;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    // Auto-sync user to PostgreSQL
    const email = decodedToken.email || 'no-email@auth.user';
    const dbUser = await getOrCreateUser(decodedToken.uid, email);
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token or syncing user:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token or sync failure' });
  }
};
