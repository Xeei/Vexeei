'use client'; // Needed because we use the Map component

import dynamic from 'next/dynamic';
import { useState } from 'react';

// ⚠️ Dynamic Import to fix "window is not defined" error
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p className="text-white">Loading Map Module...</p>
});

export default function Home() {
  const [geoJsonData, setGeoJsonData] = useState(null);

  const handlePolygonComplete = (data: any) => {
    setGeoJsonData(data);
    // TODO: Send this 'data' to your Python backend later
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center z-10 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-widest text-blue-500">VEXEEI</h1>
        <div className="text-sm text-gray-400">
          {geoJsonData ? '✅ Polygon Captured' : 'Draw a shape on the road...'}
        </div>
      </header>

      {/* Map Canvas */}
      <div className="grow relative">
        <Map onPolygonComplete={handlePolygonComplete} />
      </div>
    </main>
  );
}