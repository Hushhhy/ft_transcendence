/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   wallet.service.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: sidy <sidy@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/04/02 16:57:36 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/12 21:25:49 by sidy             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import logger from '../../lib/logger'
import prisma from '../../lib/prisma'
import type { User } from '@prisma/client'

class   WalletService
{
    async   deposit(userId: number): Promise<User>
    {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
        if (!user)
            throw new Error('User not found');
        if (user.balance !== 0)
            throw new Error('Deposit only allowed when balance is 0');
        const   wallet = await prisma.user.update({
            where: { id: userId },
            data: {
                balance: {
                    increment: 5000,
                },
            },
        });
        return (wallet);
    }

    async   cashout(userId: number): Promise<User>
    {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
        if (!user)
            throw new Error('User not found');
        if (user.balance <= 0)
            throw new Error ('Cashout not possible without cash');
        const wallet = await prisma.user.update({
            where: { id: userId },
            data: {
                balance: {
                    set: 0,
                },
            },
        });
        return (wallet);
    }
}

export default new WalletService();