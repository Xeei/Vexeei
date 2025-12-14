'use client';

import dynamic from 'next/dynamic';
import HeaderTools from '../components/FeedHeader';
import LoadingScreen from '@/components/LoadingScreen';
import GameUpdater from '@/components/GameUpdater';

const Map = dynamic(() => import('../components/Map'), {
	ssr: false,
	loading: () => <LoadingScreen />,
});

export default function Home() {
	return (
		<main className="h-screen w-screen relative overflow-hidden bg-zinc-950">
			{/* 1. Floating Header / Tools */}
			<GameUpdater />

			{/* 2. The Map */}
			<div className="h-full w-full">
				<Map />
			</div>
		</main>
	);
}
