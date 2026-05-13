import { z } from 'zod';

// Schema for sending a friend request
export const SendFriendRequestSchema = z.object({
  friendId: z.number().int().positive('Friend ID must be a positive integer'),
});

export type SendFriendRequestDTO = z.infer<typeof SendFriendRequestSchema>;

// Schema for responding to a friend request
export const RespondToFriendRequestSchema = z.object({
  friendshipId: z.number().int().positive('Friendship ID must be a positive integer'),
  action: z.enum(['accept', 'decline']).refine(
    (val) => ['accept', 'decline'].includes(val),
    { message: 'Action must be either "accept" or "decline"' }
  ),
});

export type RespondToFriendRequestDTO = z.infer<typeof RespondToFriendRequestSchema>;

// Schema for removing a friend
export const RemoveFriendSchema = z.object({
  friendId: z.number().int().positive('Friend ID must be a positive integer'),
});

export type RemoveFriendDTO = z.infer<typeof RemoveFriendSchema>;

// Response types
export type FriendDTO = {
  id: number;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen?: Date;
};

export type FriendshipRequestDTO = {
  id: number;
  requester: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  addressee: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
};