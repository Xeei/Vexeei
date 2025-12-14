'use-client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { getGeolocation } from '../lib/map';
import LoadingScreen from './LoadingScreen';
import { getUniBou, getUniHexBou } from '@/service/map';

interface University {
	id: string;
	name: string;
	faction: string;
	health: number;
	boundary: GeoJSON.Polygon;
}

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

				const uniBou = await getUniBou();
				if (!uniBou) return;

				const formattedData: GeoJSON.FeatureCollection = {
					type: 'FeatureCollection',
					features: Array.isArray(uniBou)
						? uniBou.map((u: University) => ({
								type: 'Feature',
								geometry: u.boundary,
								properties: {
									id: u.id,
									name: u.name,
									faction: u.faction,
									health: u.health,
								},
						  }))
						: [],
				};

				if (!map.current?.getSource('uni-bou')) {
					map.current?.addSource('uni-bou', {
						type: 'geojson',
						data: formattedData,
					});
				}

				if (!map.current?.getLayer('uni-bou-fill')) {
					map.current?.addLayer({
						id: 'uni-bou-fill',
						type: 'fill',
						source: 'uni-bou',
						paint: {
							'fill-color': [
								'match',
								['get', 'faction'],
								'NEUTRAL',
								'#3d71c4',
								'ALLY',
								'#00FF00',
								'ENEMY',
								'#FF0000',
								'#888888',
							],
							'fill-opacity': 0.4,
						},
					});
				}

				if (!map.current?.getLayer('uni-bou-line')) {
					map.current?.addLayer({
						id: 'uni-bou-line',
						type: 'line',
						source: 'uni-bou',
						paint: {
							'line-color': '#3d71c4',
							'line-width': 2,
						},
					});
				}

				// fetch and add hexagon boundaries layer
				const uniHexBou = await getUniHexBou();
				if (!uniHexBou) return;

				const formattedHexData: GeoJSON.FeatureCollection = {
					type: 'FeatureCollection',
					features: Array.isArray(uniHexBou)
						? uniHexBou.map((u: University) => ({
								type: 'Feature',
								geometry: u.boundary,
								properties: {
									id: u.id,
									name: u.name,
									health: u.health,
								},
						  }))
						: [],
				};

				if (!map.current?.getSource('uni-hex-bou')) {
					map.current?.addSource('uni-hex-bou', {
						type: 'geojson',
						data: formattedHexData,
					});
				}

				if (!map.current?.getLayer('uni-hex-bou-line')) {
					map.current?.addLayer({
						id: 'uni-hex-bou-line',
						type: 'line',
						source: 'uni-hex-bou',
						paint: {
							'line-color': '#FFAA00',
							'line-width': 2,
						},
					});
				}

				// extrude hex by health property
				if (!map.current?.getLayer('uni-hex-bou-extrude')) {
					map.current?.addLayer({
						id: 'uni-hex-bou-extrude',
						type: 'fill-extrusion',
						source: 'uni-hex-bou',
						paint: {
							'fill-extrusion-color': '#FFAA00',
							'fill-extrusion-height': [
								'*',
								['get', 'health'],
								10,
							],
							'fill-extrusion-opacity': 0.6,
						},
					});
				}

				// aniamte to hex layer extent
				const bounds = new mapboxgl.LngLatBounds();
				formattedHexData.features.forEach((feature) => {
					const coordinates = feature.geometry.coordinates[0];
					coordinates.forEach((coord) => {
						bounds.extend(coord as [number, number]);
					});
				});
				map.current?.fitBounds(bounds, { padding: 20 });
			});
		};

		initialLoad();

		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, []);

	return (
		<div className="relative w-full h-full">
			{!loaded && <LoadingScreen />}
			<div ref={mapContainer} className="w-full h-full" />
		</div>
	);
}
