/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   requireAuth.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 17:25:40 by pgrellie          #+#    #+#             */
/*   Updated: 2026/03/31 18:51:52 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId?: number;
    sub?: string | number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void
{
    try
	{
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ status: 'error', message: 'Missing token' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const rawUserId = decoded.userId ?? decoded.sub;
        const userId = typeof rawUserId === 'string' ? Number(rawUserId) : rawUserId;
        if (!userId || Number.isNaN(userId)) {
            res.status(401).json({ status: 'error', message: 'Invalid token payload' });
            return;
        }
        req.user = { id: userId };
        next();
    } 
	catch
	{
        res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
}

// interface JwtPayload {
// 	userId?: number;
// 	sub?: string | number;
// };

// export function	requireAuth(req: Request, res: Response, next: NextFunction): void {
// 	try {
// 		const	authHeader = req.header('Authorization');
		
// 		if (!authHeader || !authHeader.startsWith('Bearer '))
// 		{
// 			res.status(401).json({
// 				status: 'error',
// 				message: 'Unauthorized: missing or invalid Bearer token',
// 			});
// 			return ;
// 		}
// 		const	token = authHeader.substring(7);
// 		const	secret = process.env.JWT_SECRET;
// 			if (!secret)
// 		{
// 			res.status(500).json({
// 				status: 'error',
// 				message: 'Server auth configuration error',
// 			});
// 			return ;
// 		}
// 		const	decoded = jwt.verify(token, secret) as JwtPayload;
// 		const	rawUserId = decoded.userId ?? decoded.sub;
// 		const	userId = typeof rawUserId === 'string' ? Number(rawUserId) : rawUserId;
		
// 		if (!userId || Number.isNaN(userId))
// 		{
// 			res.status(401).json({
// 				status: 'error',
// 				message: 'Unauthorized: invalid token payload',
// 			});
// 			return ;
// 		}
// 		req.user = { id: userId };
// 		next();
// 	}
// 	catch {
// 		res.status(401).json({
// 			status: 'error',
// 			message: 'Unauthorized: token invalid or expired',
// 		});
// 	}
// }