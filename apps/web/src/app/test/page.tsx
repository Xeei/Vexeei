'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

// --- TYPES ---
interface University {
	id: string;
	name: string;
	lat: number;
	lng: number;
	color: string;
	radius: number;
	hp: number;
	maxHp: number;
}

interface HexProperties {
	uniId: string;
	color: string;
	height: number;
	maxHeight: number;
}

// --- CONSTANTS ---
const INITIAL_UNIVERSITIES: University[] = [
	{
		id: 'cu',
		name: 'Chula',
		lat: 13.7384,
		lng: 100.5315,
		color: '#f55b98',
		radius: 1.2,
		hp: 5000,
		maxHp: 5000,
	},
	{
		id: 'tu',
		name: 'Thammasat',
		lat: 13.757,
		lng: 100.4897,
		color: '#e8bc23',
		radius: 1.0,
		hp: 4500,
		maxHp: 5000,
	},
	{
		id: 'ku',
		name: 'Kasetsart',
		lat: 13.8476,
		lng: 100.5696,
		color: '#006b2b',
		radius: 1.5,
		hp: 6000,
		maxHp: 6000,
	},
	{
		id: 'mu',
		name: 'Mahidol',
		lat: 13.7915,
		lng: 100.3256,
		color: '#1a3b8e',
		radius: 1.8,
		hp: 5500,
		maxHp: 6000,
	},
	{
		id: 'kmutnb',
		name: 'KMUTNB',
		lat: 13.8191,
		lng: 100.5143,
		color: '#ff4800',
		radius: 0.9,
		hp: 4000,
		maxHp: 4500,
	},
	{
		id: 'swu',
		name: 'Srinakharinwirot',
		lat: 13.7441,
		lng: 100.5638,
		color: '#a6a6a6',
		radius: 0.8,
		hp: 3500,
		maxHp: 4000,
	},
];

// const API_KEY = ""; // Gemini API Key (Placeholder)

export default function HexWarPage() {
	// --- STATE ---
	const mapContainer = useRef<HTMLDivElement>(null);
	const miniMapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const miniMap = useRef<mapboxgl.Map | null>(null);
	const [mapboxToken, setMapboxToken] = useState<string>('');
	const [myTeamId] = useState<string | null>('cu'); // Default to Chula for UI demo
	const [playerEnergy, setPlayerEnergy] = useState<number>(100);
	const [universities, setUniversities] =
		useState<University[]>(INITIAL_UNIVERSITIES);
	const [gameState, setGameState] = useState<'token' | 'game'>('token');

	// Refs for mutable data accessed in closures/intervals
	const universitiesRef = useRef(universities);
	const geojsonDataRef = useRef<GeoJSON.FeatureCollection>({
		type: 'FeatureCollection',
		features: [],
	});
	const playerEnergyRef = useRef(playerEnergy);

	// Sync refs
	useEffect(() => {
		universitiesRef.current = universities;
	}, [universities]);

	useEffect(() => {
		playerEnergyRef.current = playerEnergy;
	}, [playerEnergy]);

	// --- INITIALIZATION ---
	useEffect(() => {
		// Use a timeout to avoid synchronous setState warning in strict mode/lint
		const timer = setTimeout(() => {
			const storedToken = localStorage.getItem('mapbox_token');
			if (storedToken) {
				setMapboxToken(storedToken);
				setGameState('game');
			}
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const saveToken = (token: string) => {
		if (token) {
			localStorage.setItem('mapbox_token', token);
			setMapboxToken(token);
			setGameState('game');
		}
	};

	// --- MAP LOGIC ---
	const calculateHeight = (uni: University) => {
		return (uni.hp / uni.maxHp) * 1500;
	};

	const generateHexGrid = useCallback(() => {
		try {
			const features: GeoJSON.Feature[] = [];

			universitiesRef.current.forEach((uni) => {
				const center: [number, number] = [uni.lng, uni.lat];
				const radius = uni.radius;
				const options: { units: turf.Units } = { units: 'kilometers' };
				const cellSize = 0.15;

				const circle = turf.circle(center, radius, options);
				const bbox = turf.bbox(circle);
				const hexGrid = turf.hexGrid(bbox, cellSize, options);

				hexGrid.features.forEach((hex) => {
					if (turf.booleanIntersects(hex, circle)) {
						hex.properties = {
							uniId: uni.id,
							color: uni.color,
							height: calculateHeight(uni),
							maxHeight: 2000,
						};
						features.push(hex);
					}
				});
			});

			geojsonDataRef.current.features = features;
			if (map.current && map.current.getSource('hex-territories')) {
				(
					map.current.getSource(
						'hex-territories'
					) as mapboxgl.GeoJSONSource
				).setData(geojsonDataRef.current);
			}
			if (
				miniMap.current &&
				miniMap.current.getSource('hex-territories')
			) {
				(
					miniMap.current.getSource(
						'hex-territories'
					) as mapboxgl.GeoJSONSource
				).setData(geojsonDataRef.current);
			}
		} catch {
			console.error('Hex generation failed');
		}
	}, []);

	const updateMapData = () => {
		if (!map.current || !map.current.getSource('hex-territories')) return;

		geojsonDataRef.current.features.forEach((f: GeoJSON.Feature) => {
			const uni = universitiesRef.current.find(
				(u) => u.id === f.properties?.uniId
			);
			if (uni && f.properties) {
				f.properties.height = calculateHeight(uni);
			}
		});

		if (map.current && map.current.getSource('hex-territories')) {
			(
				map.current.getSource(
					'hex-territories'
				) as mapboxgl.GeoJSONSource
			).setData(geojsonDataRef.current);
		}
		if (miniMap.current && miniMap.current.getSource('hex-territories')) {
			(
				miniMap.current.getSource(
					'hex-territories'
				) as mapboxgl.GeoJSONSource
			).setData(geojsonDataRef.current);
		}
	};

	const handleHexClick = useCallback(
		(targetId: string) => {
			if (playerEnergyRef.current < 10) {
				// showToast("Low Energy! Wait to recharge.", "error");
				return;
			}

			setPlayerEnergy((prev) => prev - 10);

			setUniversities((prevUnis) => {
				const newUnis = prevUnis.map((uni) => {
					if (uni.id === targetId) {
						const isMe = targetId === myTeamId;
						if (isMe) {
							// Fortify
							const heal = 200 + Math.floor(Math.random() * 100);
							const newHp = Math.min(uni.maxHp, uni.hp + heal);
							// showFloatingText(lngLat, `+${heal}`, "#4ade80");
							return { ...uni, hp: newHp };
						} else {
							// Attack
							const dmg = 300 + Math.floor(Math.random() * 300);
							const newHp = Math.max(0, uni.hp - dmg);
							// showFloatingText(lngLat, `-${dmg}`, "#ef4444");
							return { ...uni, hp: newHp };
						}
					}
					return uni;
				});
				return newUnis;
			});
		},
		[myTeamId]
	);

	const startSimulation = useCallback(() => {
		// Energy Regen
		const energyInterval = setInterval(() => {
			setPlayerEnergy((prev) => {
				if (prev < 100) return prev + 5;
				return prev;
			});
		}, 2000);

		// Random Battles
		const battleInterval = setInterval(() => {
			setUniversities((prevUnis) => {
				const attacker =
					prevUnis[Math.floor(Math.random() * prevUnis.length)];
				const defender =
					prevUnis[Math.floor(Math.random() * prevUnis.length)];

				if (attacker.id !== defender.id && defender.hp > 0) {
					const newUnis = prevUnis.map((u) => {
						if (u.id === defender.id) {
							return { ...u, hp: Math.max(0, u.hp - 50) };
						}
						return u;
					});
					return newUnis;
				}
				return prevUnis;
			});
		}, 800);

		return () => {
			clearInterval(energyInterval);
			clearInterval(battleInterval);
		};
	}, []);

	const initMap = useRef<(() => void) | null>(null);

	useEffect(() => {
		initMap.current = () => {
			if (!mapboxToken || !myTeamId) return;

			mapboxgl.accessToken = mapboxToken;
			const myUni = universities.find((u) => u.id === myTeamId);
			if (!myUni) return;

			try {
				map.current = new mapboxgl.Map({
					container: mapContainer.current!,
					style: 'mapbox://styles/mapbox/dark-v11',
					center: [myUni.lng, myUni.lat],
					zoom: 13,
					pitch: 60,
					bearing: -17,
					antialias: true,
				});

				map.current.on('load', () => {
					generateHexGrid();

					if (map.current) {
						map.current.addSource('hex-territories', {
							type: 'geojson',
							data: geojsonDataRef.current,
						});

						map.current.addLayer({
							id: 'hex-3d',
							type: 'fill-extrusion',
							source: 'hex-territories',
							paint: {
								'fill-extrusion-color': ['get', 'color'],
								'fill-extrusion-height': ['get', 'height'],
								'fill-extrusion-base': 0,
								'fill-extrusion-opacity': 0.8,
							},
						});

						map.current.on('click', 'hex-3d', (e) => {
							if (e.features && e.features[0]) {
								const props = e.features[0]
									.properties as HexProperties;
								handleHexClick(props.uniId, e.lngLat);
							}
						});

						map.current.on('mouseenter', 'hex-3d', () => {
							if (map.current)
								map.current.getCanvas().style.cursor =
									'pointer';
						});
						map.current.on('mouseleave', 'hex-3d', () => {
							if (map.current)
								map.current.getCanvas().style.cursor = '';
						});

						startSimulation();
					}
				});

				// Initialize Mini-Map
				if (miniMapContainer.current) {
					miniMap.current = new mapboxgl.Map({
						container: miniMapContainer.current,
						style: 'mapbox://styles/mapbox/dark-v11',
						center: [100.5018, 13.7563], // Bangkok center roughly
						zoom: 9,
						interactive: false,
						attributionControl: false,
					});

					miniMap.current.on('load', () => {
						if (miniMap.current) {
							miniMap.current.addSource('hex-territories', {
								type: 'geojson',
								data: geojsonDataRef.current,
							});
							miniMap.current.addLayer({
								id: 'hex-3d-mini',
								type: 'fill-extrusion',
								source: 'hex-territories',
								paint: {
									'fill-extrusion-color': ['get', 'color'],
									'fill-extrusion-height': ['get', 'height'],
									'fill-extrusion-base': 0,
									'fill-extrusion-opacity': 0.8,
								},
							});
						}
					});
				}
			} catch (err) {
				console.error('Failed to initialize map:', err);
				alert('Map failed to load. Check your token.');
			}
		};
	}, [
		mapboxToken,
		myTeamId,
		universities,
		generateHexGrid,
		handleHexClick,
		startSimulation,
	]);

	useEffect(() => {
		if (
			gameState === 'game' &&
			mapboxToken &&
			myTeamId &&
			mapContainer.current &&
			initMap.current
		) {
			if (!map.current) {
				initMap.current();
			}
		}
		return () => {
			// Cleanup handled by ref check usually, but here we keep map alive if possible or strict cleanup
			// For now, let's strictly cleanup to avoid dupes
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
			if (miniMap.current) {
				miniMap.current.remove();
				miniMap.current = null;
			}
		};
	}, [gameState, mapboxToken, myTeamId, initMap]);

	// Effect to update map when universities change
	useEffect(() => {
		if (gameState === 'game') {
			updateMapData();
		}
	}, [universities, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

	// --- RENDER ---
	return (
		<div className="flex flex-col h-screen max-h-screen bg-[#f6f6f8] dark:bg-[#101622] font-sans text-white overflow-hidden">
			<style jsx global>{`
				@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');
				@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

				body {
					font-family: 'Space Grotesk', sans-serif;
				}
				.material-symbols-outlined {
					font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0,
						'opsz' 24;
				}

				/* Custom Colors mapped to Tailwind classes via style or just inline */
				.bg-surface-dark {
					background-color: #1a202c;
				}
				.border-border-dark {
					border-color: #4a5568;
				}
				.text-text-neutral {
					color: #a0aec0;
				}
				.text-accent {
					color: #00bfff;
				}
				.bg-accent {
					background-color: #00bfff;
				}
				.hover-bg-accent:hover {
					background-color: #00bfff;
				}
			`}</style>

			{/* TOKEN SCREEN OVERLAY */}
			{gameState === 'token' && (
				<div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col items-center justify-center p-4">
					<div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 text-center">
						<h2 className="text-2xl font-bold text-white mb-4">
							Mapbox Token Required
						</h2>
						<input
							type="text"
							placeholder="pk.eyJ1..."
							className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
							onKeyDown={(e) => {
								if (e.key === 'Enter')
									saveToken(
										(e.target as HTMLInputElement).value
									);
							}}
						/>
						<button
							onClick={(e) => {
								const input = (e.target as HTMLElement)
									.previousElementSibling as HTMLInputElement;
								saveToken(input.value);
							}}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
						>
							Enter World
						</button>
					</div>
				</div>
			)}

			{/* TOP NAV BAR */}
			<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark/50 px-6 py-3 bg-surface-dark flex-shrink-0">
				<div className="flex items-center gap-4 text-white">
					<span className="material-symbols-outlined text-accent text-2xl">
						school
					</span>
					<h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
						University Warfare
					</h1>
				</div>
				<div className="flex items-center gap-9">
					<a
						className="text-text-neutral text-sm font-medium leading-normal"
						href="#"
					>
						Campaign: West Coast Domination
					</a>
				</div>
				<div className="flex items-center gap-2">
					<button className="flex items-center justify-center rounded-lg h-10 w-10 bg-surface-dark/50 hover:bg-white/10 text-text-neutral hover:text-white">
						<span className="material-symbols-outlined">
							settings
						</span>
					</button>
				</div>
			</header>

			{/* MAIN CONTENT AREA */}
			<main className="flex-grow flex p-4 gap-4 overflow-hidden">
				{/* LEFT COLUMN: PLAYER STATUS & MINI MAP */}
				<aside className="flex flex-col gap-4 w-72 flex-shrink-0">
					{/* Player Status Panel */}
					<div className="flex flex-col gap-4 rounded-lg bg-surface-dark p-4 border border-border-dark/50">
						<div className="flex items-center gap-4">
							<div
								className="w-16 h-16 bg-center bg-no-repeat aspect-square bg-cover rounded-lg flex-shrink-0"
								style={{
									backgroundImage:
										"url('https://lh3.googleusercontent.com/aida-public/AB6AXuALQpluTYxjA9Xt1qvFGLegaHgv10442mlhJeZLBlhad6acz51XrcfjGvCFAM0GiEuCrFLKfI2QyWkzbjZojVvw_cCayY2X4gZNmXvinQZzfCWcrxQ9q8ygIEMygCAK6itCYl32vntfP85EXm736t2x26-V-fqDHXfPFNs6xbLE6QtPXylXyUEeO6IadHFz77-EpmTN6NAO6P5hqREP6hV--8bOSV6QQ0cTRaomK9XcG15QILvjZlvWHoagHBtqK6DoOiVvKGqnzhw')",
								}}
							></div>
							<div className="flex flex-col gap-1">
								<p className="text-text-neutral text-sm font-normal leading-normal">
									Player 1
								</p>
								<p className="text-white text-base font-bold leading-tight">
									Chula University
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 text-center">
							<div className="bg-black/20 p-2 rounded-md">
								<p className="text-text-neutral text-xs uppercase tracking-wider">
									Funding
								</p>
								<p className="text-white font-bold text-lg">
									$12,500
								</p>
							</div>
							<div className="bg-black/20 p-2 rounded-md">
								<p className="text-text-neutral text-xs uppercase tracking-wider">
									Research
								</p>
								<p className="text-white font-bold text-lg">
									850 RP
								</p>
							</div>
						</div>
						<div className="bg-black/20 p-2 rounded-md text-center">
							<p className="text-text-neutral text-xs uppercase tracking-wider">
								Territories
							</p>
							<p className="text-white font-bold text-lg">12</p>
						</div>
					</div>

					{/* Mini-Map Panel */}
					<div className="flex-grow flex flex-col rounded-lg bg-surface-dark border border-border-dark/50 overflow-hidden relative">
						<h2 className="text-white text-sm font-bold leading-tight tracking-[-0.015em] px-4 py-2 border-b border-border-dark/50 z-10 bg-surface-dark">
							Global View
						</h2>
						<div
							ref={miniMapContainer}
							className="flex-grow w-full h-full min-h-[200px]"
						/>
					</div>
				</aside>

				{/* CENTER COLUMN: MAP */}
				<div className="flex-grow flex flex-col relative rounded-lg border border-border-dark/50 overflow-hidden">
					<div
						ref={mapContainer}
						className="absolute inset-0 w-full h-full"
					/>

					{/* Map Overlays (Buttons) */}
					<div className="absolute top-4 right-4 flex flex-col items-end gap-3 pointer-events-none">
						<div className="flex flex-col gap-0.5 pointer-events-auto">
							<button
								onClick={() => map.current?.zoomIn()}
								className="flex size-10 items-center justify-center rounded-t-lg bg-surface-dark shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-accent hover:text-white text-text-neutral"
							>
								<span className="material-symbols-outlined">
									add
								</span>
							</button>
							<button
								onClick={() => map.current?.zoomOut()}
								className="flex size-10 items-center justify-center rounded-b-lg bg-surface-dark shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-accent hover:text-white text-text-neutral"
							>
								<span className="material-symbols-outlined">
									remove
								</span>
							</button>
						</div>
						<button
							onClick={() => {
								const myUni = universities.find(
									(u) => u.id === myTeamId
								);
								if (myUni && map.current)
									map.current.flyTo({
										center: [myUni.lng, myUni.lat],
										zoom: 14,
									});
							}}
							className="flex size-10 items-center justify-center rounded-lg bg-surface-dark shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-accent hover:text-white text-text-neutral pointer-events-auto"
						>
							<span className="material-symbols-outlined">
								navigation
							</span>
						</button>
					</div>
				</div>

				{/* RIGHT COLUMN: SELECTED HEX & EVENT LOG */}
				<aside className="flex flex-col gap-4 w-80 flex-shrink-0">
					{/* Selected Hex Panel */}
					<div className="flex flex-col rounded-lg bg-surface-dark p-4 border border-border-dark/50">
						<h2 className="text-accent text-base font-bold leading-tight tracking-[-0.015em] pb-2 text-left border-b border-border-dark/50">
							Selected: Chula
						</h2>
						<div className="py-2 grid grid-cols-[30%_1fr] gap-x-4">
							<div className="col-span-2 grid grid-cols-subgrid border-b border-border-dark/50 py-3">
								<p className="text-text-neutral text-sm font-normal leading-normal">
									Owner
								</p>
								<p className="text-white text-sm font-semibold leading-normal">
									Player 1
								</p>
							</div>
							<div className="col-span-2 grid grid-cols-subgrid border-b border-border-dark/50 py-3">
								<p className="text-text-neutral text-sm font-normal leading-normal">
									Defense
								</p>
								<p className="text-white text-sm font-semibold leading-normal">
									{universities.find((u) => u.id === myTeamId)
										?.hp || 0}{' '}
									/{' '}
									{universities.find((u) => u.id === myTeamId)
										?.maxHp || 0}
								</p>
							</div>
							<div className="col-span-2 grid grid-cols-subgrid border-b border-border-dark/50 py-3">
								<p className="text-text-neutral text-sm font-normal leading-normal">
									Research
								</p>
								<p className="text-white text-sm font-semibold leading-normal">
									+150 RP / turn
								</p>
							</div>
						</div>
						<h3 className="text-white text-sm font-bold leading-tight tracking-[-0.015em] pt-4 pb-2">
							Units Present
						</h3>
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between gap-4 rounded-lg bg-black/20 p-3">
								<div className="flex flex-col gap-0">
									<p className="text-white text-sm font-bold leading-tight">
										Research Team
									</p>
									<p className="text-text-neutral text-xs font-normal leading-normal">
										Enhances research output
									</p>
								</div>
								<div
									className="w-10 h-10 bg-center bg-no-repeat aspect-square bg-cover rounded-md"
									style={{
										backgroundImage:
											"url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxE1ujE99HCrmadSi2GOXIil2jrF0JSWZniInnXseyceKvm32qz6AhoICGlqO_klzjB3YgJ_w0J8PyZ4ZJ_YDk06jdujf4NydYWMgG-BObys62WSUxs-Xk9hMKAn2DWgi4GXKUH1TcvtrMk3Nc8tGC4VWY-jcW-xNr7XLQjZBFv26PIstc6m4kHliDiX9lYHaIR_MY1mYo9Y_mExbqRplZ5VHetWGX4aIDkLn-kVC5VnbjPqwpxTt_6sEBvb8jCFCf_3TIWWBZPEg')",
									}}
								></div>
							</div>
							<div className="flex items-center justify-between gap-4 rounded-lg bg-black/20 p-3">
								<div className="flex flex-col gap-0">
									<p className="text-white text-sm font-bold leading-tight">
										Campus Security
									</p>
									<p className="text-text-neutral text-xs font-normal leading-normal">
										Provides basic defense
									</p>
								</div>
								<div
									className="w-10 h-10 bg-center bg-no-repeat aspect-square bg-cover rounded-md"
									style={{
										backgroundImage:
											"url('https://lh3.googleusercontent.com/aida-public/AB6AXuCaC2VUhhrJU7myJI6bQCtzrabCS2GjZCV5NzfLuPhSM8EmVPoZdo1DSYn7ARLtmXrpct8X-xvtJBd9SPcJV6f-9jf33aaDKLPs6ohOf8j2-i7p0GJtD7wbn7Wmh4ROvqFVW4wQEDxfPJWezzW_Hi3rFHINz6uJRbpitj0h5_9BhZHkz9Y-kpXUyTrCBJdj5pIWVk3ypUMvRLlWLPT8I0cj0AlksLzfRmdLr7aZWC2aM68Xf7mbMpan8LR9W_TE1Cs-9UPZWVzeEAA')",
									}}
								></div>
							</div>
						</div>
					</div>

					{/* Event Log Panel */}
					<div className="flex-grow flex flex-col rounded-lg bg-surface-dark border border-border-dark/50 overflow-hidden">
						<div className="px-4 py-2 border-b border-border-dark/50 flex items-center justify-between">
							<h2 className="text-white text-sm font-bold leading-tight tracking-[-0.015em]">
								Event Log
							</h2>
							<button className="text-text-neutral hover:text-white">
								<span className="material-symbols-outlined text-base">
									unfold_less
								</span>
							</button>
						</div>
						<div className="p-4 flex-grow overflow-y-auto space-y-3 text-sm">
							<p>
								<span className="text-green-400">
									[Turn 12]
								</span>{' '}
								Gained $12,500 funding.
							</p>
							<p>
								<span className="text-red-400">[Turn 11]</span>{' '}
								UCLA attacked Berkeley. Battle lost.
							</p>
							<p>
								<span className="text-yellow-400">
									[Turn 11]
								</span>{' '}
								USC recruited a new unit.
							</p>
							<p>
								<span className="text-blue-400">[Turn 11]</span>{' '}
								Research on &apos;Advanced AI&apos; completed.
							</p>
						</div>
					</div>
				</aside>
			</main>

			{/* BOTTOM ACTION & TURN CONTROL PANEL */}
			<footer className="flex items-center justify-between gap-6 p-4 bg-surface-dark border-t border-border-dark/50 flex-shrink-0">
				<div className="flex items-center gap-2">
					<button
						className="flex items-center justify-center gap-2 px-4 h-12 rounded-lg bg-black/20 text-text-neutral hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
						disabled
					>
						<span className="material-symbols-outlined">
							group_add
						</span>
						<span className="font-bold">Recruit Unit</span>
					</button>
					<button className="flex items-center justify-center gap-2 px-4 h-12 rounded-lg bg-black/20 text-text-neutral hover:bg-accent hover:text-white">
						<span className="material-symbols-outlined">
							domain_add
						</span>
						<span className="font-bold">Upgrade</span>
					</button>
					<button
						className="flex items-center justify-center gap-2 px-4 h-12 rounded-lg bg-black/20 text-text-neutral hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
						disabled
					>
						<span className="material-symbols-outlined">
							swords
						</span>
						<span className="font-bold">Attack</span>
					</button>
				</div>
				<div className="flex items-center gap-6">
					<div className="text-center">
						<p className="text-text-neutral text-sm">
							Current Turn
						</p>
						<p className="text-white font-bold text-2xl">12</p>
					</div>
					<button className="px-8 h-12 rounded-lg bg-accent text-white font-bold text-lg hover:bg-blue-400 transition-colors">
						End Turn
					</button>
				</div>
			</footer>
		</div>
	);
}
