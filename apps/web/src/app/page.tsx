'use client';

import dynamic from 'next/dynamic';
import HeaderTools from '../components/HeaderTools';
import LoadingScreen from '@/components/LoadingScreen';

const Map = dynamic(() => import('../components/Map'), {
	ssr: false,
	loading: () => <LoadingScreen />,
});

export default function Home() {
	return (
		<main className="h-screen w-screen relative overflow-hidden bg-zinc-950">
			{/* 1. Floating Header / Tools */}
			<HeaderTools />

			{/* 2. The Map */}
			<div className="h-full w-full">
				<Map />
			</div>
		</main>
	);
}
