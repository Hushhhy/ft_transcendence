import type { Prisma } from '@prisma/client';
import type { FriendshipRequestDTO } from './friends.dto';

export const friendUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
} as const;

export const friendshipWithUsersInclude = {
  requester: {
    select: friendUserSelect,
  },
  addressee: {
    select: friendUserSelect,
  },
} as const;

export type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: typeof friendshipWithUsersInclude;
}>;

export function toFriendshipRequestDTO(friendship: FriendshipWithUsers): FriendshipRequestDTO {
  return {
    id: friendship.id,
    requester: friendship.requester,
    addressee: friendship.addressee,
    status: friendship.status as FriendshipRequestDTO['status'],
    createdAt: friendship.createdAt,
    updatedAt: friendship.updatedAt,
  };
}
