import { config } from 'dotenv';
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import app from './app';
import emailService from './lib/email.service';
import logger from './lib/logger';
import { setIO } from './lib/socket';
import { initBlackjackNamespace } from './casin/blackjack/socket/bj21Socket'
import { startExpiredUnverifiedAccountsCleanup } from './modules/auth/authCleanup.service';
import { initPresenceSocket } from './modules/presence/presenceSocket.service';

config();
const PORT: number = Number(process.env.PORT) || 4000;

const startServer = async () => {
	startExpiredUnverifiedAccountsCleanup();

	const emailConnected = await emailService.verifyConnection();
	if (!emailConnected) {
		logger.warn('SMTP server is not reachable. Emails will fail until it becomes available.');
	}
	const httpServer = createServer(app);
	const io = new SocketIOServer(httpServer, {
		cors: {
			origin: true,
			credentials: true,
		},
		pingTimeout: 5000,
		pingInterval: 10000,
	});
	setIO(io);
	initPresenceSocket(io);

	const nsp = io.of('/blackjack');
	initBlackjackNamespace(io, nsp);
	httpServer.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
};

void startServer();
