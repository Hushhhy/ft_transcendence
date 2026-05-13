import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import PresenceService from '../presence/presence.service';
import type {
  FriendDTO,
  FriendshipRequestDTO,
  SendFriendRequestDTO,
  RespondToFriendRequestDTO,
  RemoveFriendDTO
} from './friends.dto';
import { friendshipWithUsersInclude, toFriendshipRequestDTO } from './friends.mapper';

class FriendsService {
  // Get a user's friend list
  async getFriends(userId: number): Promise<FriendDTO[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'accepted' },
          { addresseeId: userId, status: 'accepted' },
        ],
      },
      include: friendshipWithUsersInclude,
    });

    return friendships.map((friendship) => {
      const friend = friendship.requesterId === userId
        ? friendship.addressee
        : friendship.requester;
      const presence = PresenceService.getPresence(friend.id);
      return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        isOnline: presence.isOnline,
        lastSeen: presence.lastSeen ?? friendship.updatedAt,
      };
    });
  }

  // Get received friend requests (pending)
  async getPendingRequests(userId: number): Promise<FriendshipRequestDTO[]> {
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'pending',
      },
      include: friendshipWithUsersInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(toFriendshipRequestDTO);
  }

  // Get sent friend requests (pending)
  async getSentRequests(userId: number): Promise<FriendshipRequestDTO[]> {
    const requests = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'pending',
      },
      include: friendshipWithUsersInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(toFriendshipRequestDTO);
  }

  // Send a friend request
  async sendFriendRequest(userId: number, data: SendFriendRequestDTO): Promise<FriendshipRequestDTO> {
    const { friendId } = data;

    // Ensure the user is not sending a request to themselves
    if (userId === friendId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check that the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check that a relationship does not already exist
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new Error('Users are already friends');
      } else if (existingFriendship.status === 'pending') {
        throw new Error('Friend request already exists');
      } else if (existingFriendship.status === 'blocked') {
        throw new Error('Cannot send friend request to blocked user');
      } else if (existingFriendship.status === 'declined') {
        const reopenedFriendship = await prisma.friendship.update({
          where: { id: existingFriendship.id },
          data: {
            requesterId: userId,
            addresseeId: friendId,
            status: 'pending',
          },
          include: friendshipWithUsersInclude,
        });

        logger.info(`Friend request re-opened from user ${userId} to user ${friendId}`);

        return toFriendshipRequestDTO(reopenedFriendship);
      }
    }

    // Create the friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: friendId,
        status: 'pending',
      },
      include: friendshipWithUsersInclude,
    });

    logger.info(`Friend request sent from user ${userId} to user ${friendId}`);

    return toFriendshipRequestDTO(friendship);
  }

  // Respond to a friend request
  async respondToFriendRequest(userId: number, data: RespondToFriendRequestDTO): Promise<FriendshipRequestDTO> {
    const { friendshipId, action } = data;

    // Find the friend request
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: friendshipWithUsersInclude,
    });

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    // Check that the user is the addressee
    if (friendship.addresseeId !== userId) {
      throw new Error('Unauthorized to respond to this friend request');
    }

    // Verify that the request is pending
    if (friendship.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    // Update the status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: newStatus },
      include: friendshipWithUsersInclude,
    });

    logger.info(`Friend request ${friendshipId} ${action}ed by user ${userId}`);

    return toFriendshipRequestDTO(updatedFriendship);
  }

  // Remove a friend
  async removeFriend(userId: number, data: RemoveFriendDTO): Promise<void> {
    const { friendId } = data;

    // Find the friendship relation
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId, status: 'accepted' },
          { requesterId: friendId, addresseeId: userId, status: 'accepted' },
        ],
      },
    });

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    logger.info(`Friendship between users ${userId} and ${friendId} removed`);
  }


  // Check if two users are friends
  async areFriends(userId: number, friendId: number): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId, status: 'accepted' },
          { requesterId: friendId, addresseeId: userId, status: 'accepted' },
        ],
      },
    });

    return !!friendship;
  }

}

export default new FriendsService();