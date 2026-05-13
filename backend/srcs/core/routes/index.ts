/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: sidiallo <sidiallo@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:36:17 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/15 18:18:59 by sidiallo         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from '../../modules/auth/auth.routes';
import walletRouter from '../../modules/wallet/wallet.routes';
import profileRouter from '../../modules/profile_user/profile.routes';
import friendsRouter from '../../modules/friends/friends.routes';
import presenceRouter from '../../modules/presence/presence.routes';
import leaderboardRouter from '../../modules/leaderboard/leaderboard.routes';

const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/friends', friendsRouter);
apiRouter.use('/presence', presenceRouter);
apiRouter.use('/leaderboard', leaderboardRouter);

export default apiRouter;
