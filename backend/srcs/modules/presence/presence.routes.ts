import { Router } from 'express';
import PresenceController from './presence.controller';
import { requireAuth } from '../../middlewares/auth/requireAuth';

const presenceRouter = Router();

presenceRouter.use(requireAuth);

presenceRouter.get('/me', (req, res, next) => {
  return PresenceController.getOwnPresence(req, res, next);
});

presenceRouter.get('/:userId', (req, res, next) => {
  return PresenceController.getUserPresence(req, res, next);
});

export default presenceRouter;
