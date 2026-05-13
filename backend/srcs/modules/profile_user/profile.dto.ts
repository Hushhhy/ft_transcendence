import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens')
    .optional(),
  avatarUrl: z.string().optional(),
}).refine((data) => data.username !== undefined || data.avatarUrl !== undefined, {
  message: 'At least one field must be provided to update the profile',
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
