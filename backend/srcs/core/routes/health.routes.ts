import { Router, Request, Response } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString()
	});
});

export default healthRouter;