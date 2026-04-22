import { z } from 'zod';

// Auth
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER', 'ADMIN', 'VIEWER']).default('VIEWER'),
});

// Institutions
export const CreateInstitutionSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['Primary', 'Secondary', 'University']),
  county: z.string().optional(),
});

// Students
export const CreateStudentSchema = z.object({
  name: z.string().min(2),
  instId: z.string().optional(),
  level: z.enum(['Primary', 'Secondary', 'University']),
  class: z.string().min(1),
  programme: z.string().optional(),
  // inline new institution
  newInstitution: z.object({
    name: z.string().min(2),
    type: z.enum(['Primary', 'Secondary', 'University']),
    county: z.string().optional(),
  }).optional(),
}).refine(data => (data.instId && data.instId.length > 0) || data.newInstitution, {
  message: "Either instId or newInstitution must be provided",
  path: ["instId"],
});

// Results
export const CreateResultSchema = z.object({
  stuId: z.string().min(1),
  subject: z.string().min(1),
  score: z.number().nonnegative(),
  scoreType: z.enum(['percent', 'gpa']).default('percent'),
  term: z.string().min(1),
  year: z.string().min(4),
});

export const BulkResultSchema = z.array(z.object({
  student_id: z.string(),
  subject: z.string(),
  score: z.coerce.number(),
  score_type: z.enum(['percent', 'gpa']).default('percent'),
  term: z.string(),
  year: z.string(),
}));
