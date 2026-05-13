import { z } from 'zod';

// Schéma de validation pour Sign Up
export const SignUpSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  birthDate: z.coerce.date().refine((birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 18;
  }, 'You must be at least 18 years old'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type inféré de Zod
export type SignUpDTO = z.infer<typeof SignUpSchema>;

// Schéma de validation pour Login
export const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// Response DTO (sans password!)
export interface AuthResponseDTO {
  id: number;
  email: string;
  username: string;
  birthDate: Date;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: Date;
  token?: string;
  refreshToken?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: unknown;
}

export interface SuccessResponse<T> {
  status: 'success';
  message: string;
  data?: T;
}
