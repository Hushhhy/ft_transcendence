/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   wallet.controller.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:36:01 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/02 18:30:04 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../../middlewares/auth/requireAuth'
import WalletService from './wallet.service'
import logger from '../../lib/logger'

class WalletController {

    async deposit(req: Request, res: Response, next: NextFunction): Promise<void>
    {
        try
        {
            const   userId = req.user?.id;
            if (!userId){
                res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized',
                });
                return ;
            }
            const   wallet = await WalletService.deposit(userId);
            res.status(200).json({
                status: 'success',
                message: 'Deposit applied (+100000)',
                data: wallet,
            });
        }
        catch (error)
        {
            next(error);
        }
    }

    async cashout(req: Request, res: Response, next: NextFunction): Promise<void>
    {
        try
        {
            const   userId = req.user?.id;
            if (!userId)
            {
                res.status(401).json({
                    status: 'error',
                    message: 'Unauthorized',
                });
                return ;
            }
            const   wallet = await WalletService.cashout(userId);
            res.status(200).json({
                status: 'success',
                message: 'cashOut successfully done',
                data: wallet,
            });
        }
        catch (error)
        {
            next(error);
        }
    }
}

export default new WalletController();
