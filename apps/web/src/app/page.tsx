'use client';

import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import { MapRef } from '../components/Map';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Trash2, MousePointer2 } from 'lucide-react';
import HeaderTools from '../components/HeaderTools';
import LoadingScreen from '@/components/LoadingScreen';

// Dynamic import to prevent SSR window error
const Map = dynamic(() => import('../components/Map'), {
	ssr: false,
	loading: () => <LoadingScreen />,
});

export default function Home() {
	const [geoJsonData, setGeoJsonData] = useState<any>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [aiPolygonPixels, setAiPolygonPixels] = useState<number[][] | null>(
		null
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const mapRef = useRef<MapRef>(null);

	// Debug State
	const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
	const [debugPayload, setDebugPayload] = useState<string | null>(null);

	const handlePolygonComplete = (data: any) => {
		if (data?.features?.length > 0) {
			setGeoJsonData(data);
			setIsSheetOpen(true); // Auto-open the panel when drawing finishes
		}
	};

	return (
		<main className="h-screen w-screen relative overflow-hidden bg-zinc-950">
			{/* 1. Floating Header / Tools */}
			<HeaderTools />

			{/* 2. The Map */}
			<div className="h-full w-full">
				<Map
					ref={mapRef}
					onPolygonComplete={handlePolygonComplete}
					aiPolygonPixels={aiPolygonPixels}
				/>
			</div>

			{/* 3. The Side Panel (Sheet) */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent
					side="right"
					className="w-[30vw] bg-zinc-950 border-l-zinc-800 text-white overflow-y-auto p-2"
				>
					<SheetHeader>
						<SheetTitle className="text-white flex items-center gap-2">
							<MapPin className="text-blue-500" />
							Road Segment Detected
						</SheetTitle>
						<SheetDescription className="text-zinc-400">
							Vexeei has extracted the following vector data from
							your selection.
						</SheetDescription>
					</SheetHeader>

					{/* Data Display */}
					<div className="mt-6 space-y-6">
						<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
							<h3 className="text-sm font-medium text-zinc-400 mb-2">
								Feature Info
							</h3>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="block text-xs text-zinc-500">
										Type
									</span>
									FeatureCollection
								</div>
								<div>
									<span className="block text-xs text-zinc-500">
										Count
									</span>
									{geoJsonData?.features?.length || 0}{' '}
									Polygons
								</div>
							</div>
						</div>

						{/* Raw JSON View */}
						<div>
							<h3 className="text-sm font-medium text-zinc-400 mb-2">
								GeoJSON Output
							</h3>
							<div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 font-mono text-xs text-green-400 overflow-x-auto">
								<pre>
									{JSON.stringify(geoJsonData, null, 2)}
								</pre>
							</div>
						</div>

						<Button
							className="w-full bg-blue-600 hover:bg-blue-500"
							disabled={isProcessing}
							onClick={async () => {
								if (!mapRef.current) return;
								setIsProcessing(true);

								try {
									const snapshot =
										await mapRef.current.getMapSnapshot();
									if (!snapshot) {
										console.error(
											'Failed to get map snapshot'
										);
										return;
									}

									const formData = new FormData();
									formData.append(
										'file',
										snapshot.blob,
										'map-snapshot.png'
									);
									formData.append(
										'coords',
										JSON.stringify(snapshot.point)
									);

									// Debug Info
									setDebugImageUrl(
										URL.createObjectURL(snapshot.blob)
									);
									setDebugPayload(
										JSON.stringify(snapshot.point)
									);

									const response = await fetch(
										'http://localhost:8000/segment',
										{
											method: 'POST',
											body: formData,
										}
									);

									const data = await response.json();
									if (data.success && data.polygon) {
										setAiPolygonPixels(data.polygon);
										setIsSheetOpen(false); // Close sheet to see map
									} else {
										console.error('AI Engine Error:', data);
									}
								} catch (error) {
									console.error(
										'Error calling AI Engine:',
										error
									);
								} finally {
									setIsProcessing(false);
								}
							}}
						>
							{isProcessing
								? 'Processing...'
								: 'Process with AI Engine 🚀'}
						</Button>

						{/* Debug Info Section */}
						{(debugImageUrl || debugPayload) && (
							<div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4">
								<h3 className="text-sm font-medium text-zinc-400">
									Debug Request Info
								</h3>
								{debugImageUrl && (
									<div>
										<span className="block text-xs text-zinc-500 mb-1">
											Captured Image
										</span>
										<img
											src={debugImageUrl}
											alt="Map Snapshot"
											className="w-full rounded border border-zinc-700"
										/>
									</div>
								)}
								{debugPayload && (
									<div>
										<span className="block text-xs text-zinc-500 mb-1">
											Payload (Coords)
										</span>
										<div className="bg-black p-2 rounded border border-zinc-800 font-mono text-xs text-yellow-400">
											{debugPayload}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</main>
	);
}
