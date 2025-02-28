
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class AuthService {
  static async registerUser({ email, password, fullName, role }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: role || 'patient',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  static async loginUser(email, password) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async register(userData: any) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: userData.role || 'PATIENT'
        }
      });

      // Create patient profile if role is PATIENT
      if (user.role === 'PATIENT') {
        await prisma.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: userData.dateOfBirth,
            phone: userData.phone,
            address: userData.address,
            insuranceInfo: userData.insuranceInfo,
            medicalHistory: userData.medicalHistory
          }
        });
      }

      // Create doctor profile if role is DOCTOR
      if (user.role === 'DOCTOR') {
        await prisma.doctor.create({
          data: {
            userId: user.id,
            specialty: userData.specialty,
            licenseNumber: userData.licenseNumber,
            bio: userData.bio,
            availability: userData.availability
          }
        });
      }

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = this.generateToken(user.id);

      return { user: userWithoutPassword, token };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Registration failed', 500);
    }
  }

  static async login(email: string, password: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = this.generateToken(user.id);

      return { user: userWithoutPassword, token };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500);
    }
  }

  static generateToken(userId: string) {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

    return jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  static async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          patientProfile: user => user.role === 'PATIENT' ? true : false,
          doctorProfile: user => user.role === 'DOCTOR' ? true : false
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch user profile', 500);
    }
  }
}
