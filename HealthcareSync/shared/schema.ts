import { pgTable, text, serial, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { 
    enum: ["admin", "staff", "patient"] 
  }).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  specialty: text("specialty"), // For staff/doctors
  department: text("department"), // For staff/admin
  lastLogin: timestamp("last_login"),
});

// Add relations for users
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  claims: many(claims),
}));

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  medicalHistory: text("medical_history"),
}, (table) => {
  return {
    nameIdx: index("patients_name_idx").on(table.firstName, table.lastName),
    emailIdx: index("patients_email_idx").on(table.email),
  };
});

// Add relations for patients
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  assessments: many(assessments),
  claims: many(claims),
  medicalRecords: many(medicalRecords),
}));

// Add new composite indexes for frequently joined tables
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull(),
  notes: text("notes"),
  consultationType: text("consultation_type", { enum: ["in-person", "telemedicine"] }).notNull(),
}, (table) => {
  return {
    patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("appointments_doctor_id_idx").on(table.doctorId),
    dateIdx: index("appointments_date_idx").on(table.date),
    statusIdx: index("appointments_status_idx").on(table.status),
    // Add composite indexes for common queries
    patientDateIdx: index("appointments_patient_date_idx").on(table.patientId, table.date),
    doctorDateIdx: index("appointments_doctor_date_idx").on(table.doctorId, table.date),
    statusDateIdx: index("appointments_status_date_idx").on(table.status, table.date),
  };
});

// Add new tables for symptom assessment with indexes
export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["mild", "moderate", "severe"] }).notNull(),
  category: text("category").notNull(),
}, (table) => {
  return {
    categoryIdx: index("symptoms_category_idx").on(table.category),
    severityIdx: index("symptoms_severity_idx").on(table.severity),
  };
});

// Add composite indexes for assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  symptoms: jsonb("symptoms").notNull(),
  urgencyLevel: text("urgency_level", {
    enum: ["non_urgent", "mild", "moderate", "urgent", "emergency"]
  }).notNull(),
  recommendation: text("recommendation").notNull(),
  notes: text("notes"),
}, (table) => {
  return {
    patientIdIdx: index("assessments_patient_id_idx").on(table.patientId),
    dateIdx: index("assessments_date_idx").on(table.date),
    urgencyIdx: index("assessments_urgency_idx").on(table.urgencyLevel),
    // Add composite index for patient timeline queries
    patientTimelineIdx: index("assessments_patient_timeline_idx").on(table.patientId, table.date),
    // Add index for urgent cases queries
    urgencyDateIdx: index("assessments_urgency_date_idx").on(table.urgencyLevel, table.date),
  };
});

// Add composite indexes for claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull(),
  submissionDate: timestamp("submission_date").notNull(),
  description: text("description").notNull(),
}, (table) => {
  return {
    patientIdIdx: index("claims_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("claims_doctor_id_idx").on(table.doctorId),
    statusIdx: index("claims_status_idx").on(table.status),
    dateIdx: index("claims_date_idx").on(table.submissionDate),
    // Add composite indexes for common queries
    patientStatusIdx: index("claims_patient_status_idx").on(table.patientId, table.status),
    doctorStatusIdx: index("claims_doctor_status_idx").on(table.doctorId, table.status),
    statusDateIdx: index("claims_status_date_idx").on(table.status, table.submissionDate),
  };
});

// Add new tables for health metrics
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  type: text("type", {
    enum: ["heart_rate", "blood_pressure", "weight", "temperature", "blood_sugar"]
  }).notNull(),
  value: text("value").notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
}, (table) => {
  return {
    patientIdIdx: index("health_metrics_patient_id_idx").on(table.patientId),
    timestampIdx: index("health_metrics_timestamp_idx").on(table.timestamp),
    typeIdx: index("health_metrics_type_idx").on(table.type),
  };
});

// Add notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: ["appointment", "prescription", "lab_result", "message", "alert"]
  }).notNull(),
  read: boolean("read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => {
  return {
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    timestampIdx: index("notifications_timestamp_idx").on(table.timestamp),
    readIdx: index("notifications_read_idx").on(table.read),
  };
});

// Add prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status", {
    enum: ["active", "completed", "cancelled", "pending_refill"]
  }).notNull().default("active"),
  instructions: text("instructions").notNull(),
  sideEffects: text("side_effects"),
  refillCount: integer("refill_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    patientIdIdx: index("prescriptions_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("prescriptions_doctor_id_idx").on(table.doctorId),
    statusIdx: index("prescriptions_status_idx").on(table.status),
    dateRangeIdx: index("prescriptions_date_range_idx").on(table.startDate, table.endDate),
  };
});

// Add after the existing tables, before the insert schemas
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer("doctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recordType: text("record_type", {
    enum: ["lab_result", "prescription", "diagnosis", "imaging", "vaccination", "procedure"]
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  status: text("status", { 
    enum: ["pending", "final", "amended"] 
  }).notNull().default("final"),
  confidentiality: text("confidentiality", {
    enum: ["normal", "restricted", "very_restricted"]
  }).notNull().default("normal"),
  metadata: jsonb("metadata"),
  attachmentUrl: text("attachment_url"),
}, (table) => {
  return {
    patientIdIdx: index("medical_records_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("medical_records_doctor_id_idx").on(table.doctorId),
    dateIdx: index("medical_records_date_idx").on(table.date),
    typeIdx: index("medical_records_type_idx").on(table.recordType),
    patientDateIdx: index("medical_records_patient_date_idx").on(table.patientId, table.date),
  };
});

// Add relations for new tables
export const healthMetricsRelations = relations(healthMetrics, ({ one }) => ({
  patient: one(patients, {
    fields: [healthMetrics.patientId],
    references: [patients.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
}));

// Add new insert schemas
export const insertSymptomSchema = createInsertSchema(symptoms);
export const insertAssessmentSchema = createInsertSchema(assessments).extend({
  date: z.string().transform((str) => new Date(str)),
  symptoms: z.array(z.object({
    symptomId: z.number(),
    severity: z.enum(["mild", "moderate", "severe"])
  }))
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPatientSchema = createInsertSchema(patients);
export const insertAppointmentSchema = createInsertSchema(appointments).extend({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format. Please use ISO date string format.",
  }),
});
export const insertClaimSchema = createInsertSchema(claims);
// Add after other insert schemas
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).extend({
  date: z.string().transform((str) => new Date(str)),
  metadata: z.record(z.unknown()).optional(),
});
export const insertHealthMetricSchema = createInsertSchema(healthMetrics);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertPrescriptionSchema = createInsertSchema(prescriptions);


// Types
export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Symptom = typeof symptoms.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;

// Add after other types
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;

// Add insert types
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// Add types for dashboard stats
export interface AdminStats {
  totalPatients: number;
  todayAppointments: number;
  pendingClaims: number;
  criticalCases: number;
  recentActivity: Array<{
    description: string;
    timestamp: string;
  }>;
}

export interface StaffStats {
  todayAppointments: number;
  checkedInPatients: number;
  pendingActions: number;
  upcomingAppointments: Array<{
    patientName: string;
    time: string;
    type: string;
    isUrgent: boolean;
  }>;
}

export interface PatientStats {
  nextAppointment?: {
    date: string;
    doctor: string;
  };
  activePrescriptions: number;
  alerts: number;
  recentActivities: Array<{
    title: string;
    date: string;
  }>;
}