import express, { Router } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import map_router from './routes/map.route.js';

const app = express();
// Allow Next.js (port 3000) to talk to us
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: 'http://localhost:3000', // Allow the game frontend
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

io.on('connection', (socket) => {
	console.log('Player connected:', socket.id);

	socket.on('attack_hex', (data) => {
		// Game logic here
		io.emit('map_update', { hexId: data.id, newColor: 'red' });
	});

	socket.on('disconnect', () => {
		console.log('Player disconnected:', socket.id);
	});
});

const apiV1 = Router();
apiV1.use('/map', map_router);

app.use('/api/v1', apiV1);

httpServer.listen(4000, () => {
	console.log('Game Server running on port 4000');
});
