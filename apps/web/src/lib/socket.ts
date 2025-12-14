// apps/web/lib/socket.ts
import { io } from 'socket.io-client';

// The URL MUST point to your long-running Express server, not the Next.js frontend.
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
	// Tells the server we accept cookies/credentials (for authentication later)
	withCredentials: true,
	// Don't auto-connect on page load; we'll connect manually in a useEffect hook.
	autoConnect: false,
});

/**
 * You can listen for common events here if needed, or in the component.
socket.on('connect', () => {
  console.log('Connected to game server!');
});
*/
