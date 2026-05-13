/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:36:28 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/22 16:57:13 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */



import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import apiRouter from './core/routes';
import logger from './lib/logger';

const app: Express = express();

type PrismaP2002LikeError = {
  code: 'P2002';
  meta?: {
    target?: unknown;
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// function isObject(value: unknown): value is Record<string, unknown> {
//  return typeof value === 'object' && value !== null;
// }

const isPrismaP2002Error = (err: unknown): err is PrismaP2002LikeError =>
  isObject(err) && err.code === 'P2002';

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.get('/', (_req: Request, res: Response) => {
	res.json({ message: 'Backend is running!' });
});

app.use('/api', apiRouter);

// 404 middleware
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	logger.error('Request error:', err);

	// Zod validation errors
	if (err instanceof z.ZodError) {
		res.status(400).json({
			status: 'error',
			message: 'Validation error',
			errors: err.issues?.map((issue) => ({
				path: issue.path.join('.'),
				message: issue.message,
			})) || [],
		});
		return;
	}
	// Database errors (Prisma)
	if (isPrismaP2002Error(err)) {
		const target = err.meta?.target;
		let field = 'field';
		if (Array.isArray(target) && typeof target[0] === 'string') {
			field = target[0];
		}
		res.status(409).json({
			status: 'error',
			message: `${field} already exists`,
		});
		return;
	}
	// Generic errors
	if (err instanceof Error) {
		const status = err.message.includes('not found') ? 404 : 400;
		res.status(status).json({
			status: 'error',
			message: err.message,
		});
		return;
	}
	// Unknown errors
	res.status(500).json({
		status: 'error',
		message: 'Internal server error',
		...(process.env.NODE_ENV !== 'production' && { error: err }),
	});
});
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        logger.info(
            `[REQ DEBUG] originalUrl=${req.originalUrl} | baseUrl=${req.baseUrl} | url=${req.url}`
        );
        next();
    });
}

export default app;