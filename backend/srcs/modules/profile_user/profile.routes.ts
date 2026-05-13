import { Router } from 'express';
import ProfileController from './profile.controller';
import { requireAuth } from '../../middlewares/auth/requireAuth';

const profileRouter = Router();

profileRouter.get('/search', requireAuth, (req, res, next) => {
  return ProfileController.searchUsers(req, res, next);
});

profileRouter.get('/blackjack-stats', requireAuth, (req, res, next) => {
  return ProfileController.getBlackjackStats(req, res, next);
});

profileRouter.get('/', requireAuth, (req, res, next) => {
  return ProfileController.getProfile(req, res, next);
});

profileRouter.patch('/', requireAuth, ProfileController.uploadAvatar, (req, res, next) => {
  return ProfileController.updateProfile(req, res, next);
});

export default profileRouter;