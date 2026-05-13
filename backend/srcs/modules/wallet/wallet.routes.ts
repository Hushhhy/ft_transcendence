/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   wallet.routes.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:36:04 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/02 18:30:04 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';
import WalletController from './wallet.controller';
import { requireAuth } from '../../middlewares/auth/requireAuth';

const	walletRouter = Router();

walletRouter.post('/deposit', requireAuth, (req, res, next) => {
	return (WalletController.deposit(req, res, next));
});

walletRouter.post('/cashout', requireAuth, (req, res, next) => {
	return (WalletController.cashout(req, res, next));
});

export default walletRouter;
