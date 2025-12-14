// apps/web/components/GameUpdater.tsx
'use client'; // REQUIRED for client-side logic like Sockets and useEffect

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket'; // Import the utility from Step 2

interface MapUpdate {
	hexId: string;
	newHealth: number;
	newFaction: string;
}

export default function GameUpdater() {
	const [lastUpdate, setLastUpdate] = useState<MapUpdate | null>(null);
	const [isConnected, setIsConnected] = useState(socket.connected);

	useEffect(() => {
		// 1. Connect the socket when the component mounts
		socket.connect();

		function onConnect() {
			setIsConnected(true);
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);

		// 2. Listen for 'map_update' events from the Express server
		socket.on('map_update', (data: MapUpdate) => {
			console.log('Received real-time update:', data);
			setLastUpdate(data);

			// In a real app, you would update your Mapbox/Deck.gl state here.
		});

		// 3. CLEANUP: Disconnect the socket when the component unmounts
		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off('map_update');
			socket.disconnect();
		};
	}, []); // Empty dependency array means it runs only on mount/unmount

	return (
		<div className="absolute top-0 right-0 p-2 text-xs bg-gray-900 text-green-400 z-50">
			Game Status: {isConnected ? 'LIVE' : 'Connecting...'}
			{lastUpdate && (
				<p>
					Last Hex Updated: **{lastUpdate.hexId}** (
					{lastUpdate.newHealth}%)
				</p>
			)}
		</div>
	);
}
