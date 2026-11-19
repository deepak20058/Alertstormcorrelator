import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dal } from '../services/db/dal';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, name, role } = req.body;
      if (!username || !email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Username, email, password, and name are required.' });
      }

      const existingUser = await dal.findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already registered.' });
      }

      const existingEmail = await dal.findUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }

      const validRole: UserRole = role === 'Administrator' ? 'Administrator' : 'Security Analyst';
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await dal.createUser({
        username,
        email,
        passwordHash,
        name,
        role: validRole,
        createdAt: new Date(),
      });

      const token = jwt.sign(
        { id: newUser._id || newUser.id, username: newUser.username, role: newUser.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      await dal.addAuditLog({
        action: 'USER_REGISTERED',
        performedBy: username,
        role: validRole,
        details: `New ${validRole} account registered: ${email}`,
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id: newUser._id || newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Server error during registration: ' + err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
      }

      let user = await dal.findUserByUsername(username);
      if (!user) {
        user = await dal.findUserByEmail(username);
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      }

      const token = jwt.sign(
        { id: user._id || user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      await dal.addAuditLog({
        action: 'USER_LOGIN',
        performedBy: user.username,
        role: user.role,
        details: `User logged into SOC console from IP ${req.ip || '127.0.0.1'}`,
        timestamp: new Date(),
      });

      return res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
    }
  },

  async demoLogin(req: Request, res: Response) {
    try {
      const roleReq = req.body.role === 'Administrator' ? 'Administrator' : 'Security Analyst';
      const targetUsername = roleReq === 'Administrator' ? 'admin' : 'analyst';

      let user = await dal.findUserByUsername(targetUsername);
      if (!user) {
        // Auto-create on the fly if needed
        const defaultHash = await bcrypt.hash(roleReq === 'Administrator' ? 'Admin@12345' : 'Analyst@12345', 10);
        user = await dal.createUser({
          username: targetUsername,
          email: `${targetUsername}@alertstorm.io`,
          passwordHash: defaultHash,
          name: roleReq === 'Administrator' ? 'Chief Information Security Officer (Admin)' : 'Senior SOC Incident Responder',
          role: roleReq,
          createdAt: new Date(),
        });
      }

      const token = jwt.sign(
        { id: user._id || user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: `Demo 1-Click login as ${user.role} successful.`,
        token,
        user: {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Demo login error: ' + err.message });
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      return res.json({ success: true, user: req.user });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    // Simulation for SOC platform
    return res.json({
      success: true,
      message: `Password reset instructions and security token sent to ${email} (Demo SOC Simulation). Use demo credentials admin@alertstorm.io (Admin@12345) to log in immediately.`,
    });
  },
};
