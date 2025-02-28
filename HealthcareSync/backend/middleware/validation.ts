import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validator middleware factory
export const validate = (schema: z.ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    return res.status(500).json({ message: 'Internal server error during validation' });
  }
};

// Claim data validation
export const validateClaimData = validate(
  z.object({
    patientId: z.number().or(z.string().transform(val => parseInt(val, 10))),
    doctorId: z.number().or(z.string().transform(val => parseInt(val, 10))),
    amount: z.number().positive(),
    status: z.enum(['pending', 'approved', 'rejected']),
    submissionDate: z.string().or(z.date()),
    description: z.string().min(3).max(500),
  })
);

// User registration schema
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional()
});

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Patient data schema
const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  doctorId: z.string().optional()
});

// Appointment schema
const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required'),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// Claim schema
const claimSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentId: z.string().optional(),
  serviceDate: z.string().min(1, 'Service date is required'),
  procedureCodes: z.array(z.string()).min(1, 'At least one procedure code is required'),
  diagnosisCodes: z.array(z.string()).min(1, 'At least one diagnosis code is required'),
  claimAmount: z.number().min(0, 'Claim amount must be a positive number'),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// Health metrics schema
const healthMetricsSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  recordedAt: z.string().optional(),
  metrics: z.record(z.string(), z.union([z.string(), z.number()])),
  notes: z.string().optional(),
});

// Prescription schema
const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  refills: z.number().min(0, 'Refills must be a non-negative number'),
  instructions: z.string().optional(),
  status: z.string().optional(),
});

// Medical record schema
const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  visitDate: z.string().min(1, 'Visit date is required'),
  symptoms: z.array(z.string()).optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatment: z.string().min(1, 'Treatment is required'),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// Export validation middlewares
export const validateRegistration = validate(registrationSchema);
export const validateLogin = validate(loginSchema);
export const validatePatientData = validate(patientSchema);
export const validateAppointmentData = validate(appointmentSchema);
export const validateHealthMetricsData = validate(healthMetricsSchema);
export const validatePrescriptionData = validate(prescriptionSchema);
export const validateMedicalRecordData = validate(medicalRecordSchema);
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schema for user registration
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  role: z.enum(['ADMIN', 'STAFF', 'PATIENT', 'DOCTOR']).optional()
});

// Schema for user login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Schema for password reset request
const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

// Schema for password reset
const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(100)
});

// Schema for token refresh
const tokenRefreshSchema = z.object({
  refreshToken: z.string()
});

// Validation middleware for registration
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

// Validation middleware for login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Invalid login data' });
  }
};

// Validation middleware for password reset request
export const validatePasswordResetRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    passwordResetRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

// Validation middleware for password reset
export const validatePasswordReset = (req: Request, res: Response, next: NextFunction) => {
  try {
    passwordResetSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

// Validation middleware for token refresh
export const validateTokenRefresh = (req: Request, res: Response, next: NextFunction) => {
  try {
    tokenRefreshSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Invalid request data' });
  }
};
