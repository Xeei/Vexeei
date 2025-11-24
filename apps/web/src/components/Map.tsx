'use-client'; // 👈 Crucial: Tells Next.js this runs in the browser only

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

// Import the CSS for the map and the drawing tools
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { getGeolocation } from '../lib/map';
import LoadingScreen from './LoadingScreen';

interface MapProps {
	onPolygonComplete: (geoJson: any) => void;
}

export default function Map({ onPolygonComplete }: MapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const draw = useRef<MapboxDraw | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		// 1. Prevent double initialization
		const initialLoad = async () => {
			if (map.current) return;
			if (!mapContainer.current) return;

			// 2. Set the token
			mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

			const location = await getGeolocation();
			// 3. Initialize the Map
			map.current = new mapboxgl.Map({
				container: mapContainer.current,
				style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || '', // 👈 Satellite view
				center: location || [-74.5, 40], // Default starting position (NYC area)
				zoom: 15,
			});

			// 4. Add the Drawing Tools (The "Vexeei" Magic)
			draw.current = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					polygon: true, // Only allow drawing polygons
					trash: true, // Allow deleting them
				},
				defaultMode: 'draw_polygon', // Start in drawing mode automatically
			});

			map.current.addControl(draw.current, 'top-left');

			// 5. Listen for events (When user finishes drawing)
			map.current.on('draw.create', (e) => {
				const data = draw.current?.getAll();
				console.log('User drew a polygon:', data);
				onPolygonComplete(data); // Send to parent
			});

			map.current.on('load', () => {
				setLoaded(true);
			});
		};

		initialLoad();
	}, [onPolygonComplete]);

	return (
		<div className="relative w-full h-full">
			{!loaded && <LoadingScreen />}
			<div ref={mapContainer} className="w-full h-full" />
		</div>
	);
}
