/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friends.controller.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/04/13 12:00:00 by sidy              #+#    #+#             */
/*   Updated: 2026/04/13 12:00:00 by sidy              ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import {
  SendFriendRequestSchema,
  RespondToFriendRequestSchema,
  RemoveFriendSchema,
  type SendFriendRequestDTO,
  type RespondToFriendRequestDTO,
  type RemoveFriendDTO
} from './friends.dto';
import FriendsService from './friends.service';

class FriendsController {
  // Get the friend list
  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const friends = await FriendsService.getFriends(userId);
      res.status(200).json({
        status: 'success',
        message: 'Friends retrieved successfully',
        data: friends
      });
    } catch (error) {
      next(error);
    }
  }

  // Get received friend requests
  async getPendingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const requests = await FriendsService.getPendingRequests(userId);
      res.status(200).json({
        status: 'success',
        message: 'Pending friend requests retrieved successfully',
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sent friend requests
  async getSentRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const requests = await FriendsService.getSentRequests(userId);
      res.status(200).json({
        status: 'success',
        message: 'Sent friend requests retrieved successfully',
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  // Send a friend request
  async sendFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validation = SendFriendRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: validation.error.issues[0].message
        });
        return;
      }

      const friendRequest = await FriendsService.sendFriendRequest(userId, validation.data);
      res.status(201).json({
        status: 'success',
        message: 'Friend request sent successfully',
        data: friendRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // Respond to a friend request
  async respondToFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validation = RespondToFriendRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: validation.error.issues[0].message
        });
        return;
      }

      const response = await FriendsService.respondToFriendRequest(userId, validation.data);
      res.status(200).json({
        status: 'success',
        message: `Friend request ${validation.data.action}ed successfully`,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a friend
  async removeFriend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validation = RemoveFriendSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: validation.error.issues[0].message
        });
        return;
      }

      await FriendsService.removeFriend(userId, validation.data);
      res.status(200).json({
        status: 'success',
        message: 'Friend removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }


  // Check if two users are friends
  async checkFriendship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const friendId = parseInt(req.params.friendId);
      if (isNaN(friendId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid friend ID'
        });
        return;
      }

      const areFriends = await FriendsService.areFriends(userId, friendId);
      res.status(200).json({
        status: 'success',
        message: 'Friendship status checked successfully',
        data: { areFriends }
      });
    } catch (error) {
      next(error);
    }
  }

}

export default new FriendsController();