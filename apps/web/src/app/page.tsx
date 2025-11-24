'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
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
				<Map onPolygonComplete={handlePolygonComplete} />
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

						<Button className="w-full bg-blue-600 hover:bg-blue-500">
							Process with AI Engine 🚀
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</main>
	);
}
