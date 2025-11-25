'use-client'; // 👈 Crucial: Tells Next.js this runs in the browser only

import {
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

// Import the CSS for the map and the drawing tools
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { getGeolocation } from '../lib/map';
import LoadingScreen from './LoadingScreen';

export interface MapRef {
	getMapSnapshot: () => Promise<{
		blob: Blob;
		point: [number, number];
	} | null>;
}

interface MapProps {
	onPolygonComplete: (geoJson: any) => void;
	aiPolygonPixels?: number[][] | null;
}

const Map = forwardRef<MapRef, MapProps>(
	({ onPolygonComplete, aiPolygonPixels }, ref) => {
		const mapContainer = useRef<HTMLDivElement>(null);
		const map = useRef<mapboxgl.Map | null>(null);
		const draw = useRef<MapboxDraw | null>(null);
		const [loaded, setLoaded] = useState(false);

		useImperativeHandle(ref, () => ({
			getMapSnapshot: async () => {
				if (!map.current || !draw.current) return null;

				const data = draw.current.getAll();
				if (data.features.length === 0) return null;

				// Simple centroid calculation
				const feature = data.features[0];
				// @ts-ignore
				const coordinates = feature.geometry.coordinates[0];
				let x = 0,
					y = 0,
					len = coordinates.length;
				coordinates.forEach((coord: any) => {
					x += coord[0];
					y += coord[1];
				});
				const centerLng = x / len;
				const centerLat = y / len;

				// Project to pixels
				const point = map.current!.project([centerLng, centerLat]);

				// Get Blob
				return new Promise((resolve) => {
					map.current!.getCanvas().toBlob((blob) => {
						if (blob) {
							resolve({ blob, point: [point.x, point.y] });
						} else {
							resolve(null);
						}
					});
				});
			},
		}));

		useEffect(() => {
			if (!aiPolygonPixels || !map.current || !draw.current) return;

			console.log('Received AI Polygon Pixels:', aiPolygonPixels);

			// Convert Pixels to Lat/Lng
			const coordinates = aiPolygonPixels.map((pixel) => {
				const point = map.current!.unproject([pixel[0], pixel[1]]);
				return [point.lng, point.lat];
			});

			// Close the loop if not already closed
			if (
				coordinates.length > 0 &&
				(coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
					coordinates[0][1] !==
						coordinates[coordinates.length - 1][1])
			) {
				coordinates.push(coordinates[0]);
			}

			const feature: any = {
				id: 'ai-road-segment',
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'Polygon',
					coordinates: [coordinates],
				},
			};

			// Add to Draw
			draw.current.add(feature);
			console.log('Added AI Feature to Map:', feature);
		}, [aiPolygonPixels]);

		useEffect(() => {
			// 1. Prevent double initialization
			const initialLoad = async () => {
				if (map.current) return;
				if (!mapContainer.current) return;

				// 2. Set the token
				mapboxgl.accessToken =
					process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

				const location = await getGeolocation();
				// 3. Initialize the Map
				map.current = new mapboxgl.Map({
					container: mapContainer.current,
					style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || '', // 👈 Satellite view
					center: location || [-74.5, 40], // Default starting position (NYC area)
					zoom: 15,
					preserveDrawingBuffer: true, // 👈 Important for toBlob()
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
);

export default Map;
