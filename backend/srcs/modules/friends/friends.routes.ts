/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friends.routes.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/04/13 12:00:00 by sidy              #+#    #+#             */
/*   Updated: 2026/04/13 12:00:00 by sidy              ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';
import FriendsController from './friends.controller';
import { requireAuth } from '../../middlewares/auth/requireAuth';

const friendsRouter = Router();

// All routes require authentication
friendsRouter.use(requireAuth);

// Get the friend list
friendsRouter.get('/', (req, res, next) => {
  return FriendsController.getFriends(req, res, next);
});

// Get received friend requests (pending)
friendsRouter.get('/requests/pending', (req, res, next) => {
  return FriendsController.getPendingRequests(req, res, next);
});

// Get sent friend requests
friendsRouter.get('/requests/sent', (req, res, next) => {
  return FriendsController.getSentRequests(req, res, next);
});

// Send a friend request
friendsRouter.post('/request', (req, res, next) => {
  return FriendsController.sendFriendRequest(req, res, next);
});

// Respond to a friend request (accept/decline)
friendsRouter.patch('/request/respond', (req, res, next) => {
  return FriendsController.respondToFriendRequest(req, res, next);
});

// Remove a friend
friendsRouter.delete('/friend', (req, res, next) => {
  return FriendsController.removeFriend(req, res, next);
});

// Check if two users are friends
friendsRouter.get('/check-friendship/:friendId', (req, res, next) => {
  return FriendsController.checkFriendship(req, res, next);
});

export default friendsRouter;