
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './app-error';

// User schemas
const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'staff', 'patient']).optional(),
});

const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Patient schema
const patientSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }),
  gender: z.enum(['male', 'female', 'other']),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  emergencyContact: z.string().min(5, 'Emergency contact is required'),
});

// Appointment schema
const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  dateTime: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }),
  reason: z.string().min(5, 'Reason is required'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'in-progress']).optional(),
  notes: z.string().optional(),
});

// Middleware validators
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    userRegistrationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    userLoginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
};

export const validatePatient = (req: Request, res: Response, next: NextFunction) => {
  try {
    patientSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
};

export const validateAppointment = (req: Request, res: Response, next: NextFunction) => {
  try {
    appointmentSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
};
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './app-error';

// User schemas
const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Full name is required'),
  role: z.enum(['ADMIN', 'DOCTOR', 'STAFF', 'PATIENT']).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  insuranceInfo: z.string().optional(),
  medicalHistory: z.string().optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  bio: z.string().optional(),
  availability: z.any().optional()
});

const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Patient schema
const patientSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  insuranceInfo: z.string().optional(),
  medicalHistory: z.string().optional(),
});

// Appointment schema
const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }),
  startTime: z.string().refine((time) => !isNaN(new Date(time).getTime()), {
    message: 'Invalid time format',
  }),
  endTime: z.string().refine((time) => !isNaN(new Date(time).getTime()), {
    message: 'Invalid time format',
  }),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// Health metric schema
const healthMetricSchema = z.object({
  patientId: z.string().uuid(),
  type: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }).optional(),
  notes: z.string().optional(),
});

// Medical record schema
const medicalRecordSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  date: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid date format',
  }),
  provider: z.string().optional(),
  attachments: z.any().optional(),
});

// Middleware to validate request data
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    userRegistrationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    userLoginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export const validatePatient = (req: Request, res: Response, next: NextFunction) => {
  try {
    patientSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export const validateAppointment = (req: Request, res: Response, next: NextFunction) => {
  try {
    appointmentSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export const validateHealthMetric = (req: Request, res: Response, next: NextFunction) => {
  try {
    healthMetricSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export const validateMedicalRecord = (req: Request, res: Response, next: NextFunction) => {
  try {
    medicalRecordSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};
