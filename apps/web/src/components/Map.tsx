'use-client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl, { GeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { getGeolocation } from '../lib/map';
import LoadingScreen from './LoadingScreen';
import { getUniBou } from '@/service/map';

export default function Map() {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const initialLoad = async () => {
			if (map.current) return;
			if (!mapContainer.current) return;

			mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

			const location = await getGeolocation();
			map.current = new mapboxgl.Map({
				container: mapContainer.current,
				style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || '', // 👈 Satellite view
				center: location || [-74.5, 40], // Default starting position (NYC area)
				zoom: 15,
				preserveDrawingBuffer: true, // 👈 Important for toBlob()
			});

			map.current.on('load', async () => {
				setLoaded(true);

				const ku = await getUniBou('ku');
				console.log(ku);
				if (ku && map.current) {
					if (!map.current.getSource('ku-bou')) {
						map.current.addSource('ku-bou', {
							type: 'geojson',
							data: ku as any,
						});
					}

					if (!map.current.getLayer('ku-bou-layer')) {
						map.current.addLayer({
							id: 'ku-bou-layer',
							type: 'fill',
							source: 'ku-bou',
							layout: {},
							paint: {
								'fill-color':
									ku.features[0]?.properties?.color ||
									'rgba(73, 163, 103, 0.5)',
								'fill-opacity': 0.5,
							},
						});
					}

					if (!map.current.getLayer('ku-bou-extrusion')) {
						map.current.addLayer({
							id: 'ku-bou-extrusion',
							type: 'fill-extrusion',
							source: 'ku-bou',
							paint: {
								'fill-extrusion-color': '#49a367',
								'fill-extrusion-height': ['get', 'height'],
								'fill-extrusion-base': 0,
								'fill-extrusion-opacity': 0.8,
							},
						});
					}
				}
			});
		};

		initialLoad();
	}, []);

	return (
		<div className="relative w-full h-full">
			{!loaded && <LoadingScreen />}
			<div ref={mapContainer} className="w-full h-full" />
		</div>
	);
}
