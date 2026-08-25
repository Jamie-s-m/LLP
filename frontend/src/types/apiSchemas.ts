import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'parent', 'moderator', 'admin']),
  avatar: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  teacherApplicationStatus: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
  billing: z.object({
    plan: z.enum(['none', 'learner', 'family', 'teaching']),
    status: z.string(),
    currentPeriodEnd: z.string().nullable().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
  }).optional(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: UserSchema,
});

export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
    requiresVerification: z.boolean(),
  }),
});

// Course schemas
export const CourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  instructor: z.string(),
  isPublished: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CourseListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CourseSchema).optional(),
  courses: z.array(CourseSchema).optional(),
});

// Chat schemas
export const ChatMessageSchema = z.object({
  _id: z.string(),
  conversation: z.string(),
  sender: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      avatar: z.string().optional(),
    }),
  ]),
  body: z.string(),
  readBy: z.array(z.string()),
  createdAt: z.string(),
});

export const ChatConversationSchema = z.object({
  _id: z.string(),
  participants: z.array(z.union([z.string(), UserSchema])),
  lastMessageAt: z.string().optional(),
  createdAt: z.string().optional(),
});

// Generic API response
export const ApiSuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

// Validation helper
export function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Safe validation (returns null on error)
export function safeValidateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
