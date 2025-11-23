'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Trash2, MousePointer2 } from 'lucide-react';

// Dynamic import to prevent SSR window error
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading Vexeei Satellite...</div>
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
      <Card className="absolute top-4 left-4 z-10 p-2 bg-zinc-950/90 border-zinc-800 backdrop-blur text-white w-64">
        <div className="flex items-center justify-between mb-4 px-2">
          <h1 className="font-bold tracking-widest text-blue-500">VEXEEI</h1>
          <div className="text-xs text-zinc-500">v0.1</div>
        </div>
        
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start gap-2 h-8 text-xs">
            <MousePointer2 className="w-3 h-3" />
            Select / Edit
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50">
            <Trash2 className="w-3 h-3" />
            Clear Map
          </Button>
        </div>
      </Card>

      {/* 2. The Map */}
      <div className="h-full w-full">
        <Map onPolygonComplete={handlePolygonComplete} />
      </div>

      {/* 3. The Side Panel (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] bg-zinc-950 border-l-zinc-800 text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <MapPin className="text-blue-500" />
              Road Segment Detected
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              Vexeei has extracted the following vector data from your selection.
            </SheetDescription>
          </SheetHeader>

          {/* Data Display */}
          <div className="mt-6 space-y-6">
            
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Feature Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-zinc-500">Type</span>
                  FeatureCollection
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Count</span>
                  {geoJsonData?.features?.length || 0} Polygons
                </div>
              </div>
            </div>

            {/* Raw JSON View */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">GeoJSON Output</h3>
              <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 font-mono text-xs text-green-400 overflow-x-auto">
                <pre>{JSON.stringify(geoJsonData, null, 2)}</pre>
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