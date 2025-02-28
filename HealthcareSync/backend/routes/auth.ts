import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { 
  requireAuth, 
  generateToken,
  generateRefreshToken,
  authRateLimit 
} from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['PATIENT', 'DOCTOR', 'STAFF', 'ADMIN']).default('PATIENT')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      }
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.token.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.token.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', requireAuth, auditLog('auth:logout'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Invalidate all refresh tokens for user
    await prisma.token.deleteMany({
      where: {
        userId: req.user.id,
        type: 'REFRESH'
      }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Find valid refresh token
    const tokenRecord = await prisma.token.findFirst({
      where: {
        token: refreshToken,
        type: 'REFRESH',
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const newToken = generateToken(tokenRecord.user);
    const newRefreshToken = generateRefreshToken(tokenRecord.user.id);

    // Replace old refresh token
    await prisma.token.delete({ where: { id: tokenRecord.id } });
    await prisma.token.create({
      data: {
        userId: tokenRecord.user.id,
        token: newRefreshToken,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { comparePasswords, hashPassword } from '../services/security';
import { auditMiddleware } from '../middleware/audit';
import { validateLogin, validateRegistration, validatePasswordReset, validateTokenRefresh } from '../middleware/validation';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

// Configure rate limiters for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts, please try again later' }
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register new user
router.post('/register', validateRegistration, auditMiddleware('user', 'register'), async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.username === username ? 'Username already exists' : 'Email already exists' 
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        fullName,
        role: role || 'PATIENT',
        lastLogin: new Date()
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '1d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// Login user
router.post('/login', validateLogin, authRateLimit, auditMiddleware('user', 'login'), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Check if user exists and password matches
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '1d' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Store refresh token in database with expiry
    await prisma.userToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Refresh token
router.post('/refresh-token', validateTokenRefresh, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Find valid refresh token
    const userToken = await prisma.userToken.findFirst({
      where: {
        token: refreshToken,
        type: 'REFRESH',
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!userToken) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { userId: userToken.user.id, role: userToken.user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '1d' }
    );

    // Remove password from user data
    const { password: _, ...userWithoutPassword } = userToken.user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'An error occurred during token refresh' });
  }
});

// Request password reset
router.post('/request-password-reset', passwordResetRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If your email is in our system, you will receive a password reset link shortly' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token in database with expiry
    await prisma.userToken.create({
      data: {
        userId: user.id,
        token: resetTokenHash,
        type: 'RESET',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@healthcareplatform.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'If your email is in our system, you will receive a password reset link shortly' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'An error occurred during password reset request' });
  }
});

// Reset password
router.post('/reset-password', validatePasswordReset, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Hash token from request
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const userToken = await prisma.userToken.findFirst({
      where: {
        token: resetTokenHash,
        type: 'RESET',
        expiresAt: { gt: new Date() }
      }
    });

    if (!userToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userToken.userId },
      data: { password: hashedPassword }
    });

    // Delete all reset tokens for this user
    await prisma.userToken.deleteMany({
      where: {
        userId: userToken.userId,
        type: 'RESET'
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'An error occurred during password reset' });
  }
});

// Logout
router.post('/logout', auditMiddleware('user', 'logout'), async (req, res) => {
  try {
    // Get refresh token from request
    const refreshToken = req.body.refreshToken;

    // If refresh token is provided, delete it
    if (refreshToken) {
      await prisma.userToken.deleteMany({
        where: {
          token: refreshToken,
          type: 'REFRESH'
        }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
});

export default router;
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-dev-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'PATIENT' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'default-dev-secret'
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
