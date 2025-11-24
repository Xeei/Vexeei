import { cn } from '@/lib/utils';

interface LoadingScreenProps {
	className?: string;
}

export default function LoadingScreen({ className }: LoadingScreenProps) {
	return (
		<div
			className={cn(
				'absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white z-50',
				className
			)}
		>
			{/* Radar / Satellite Animation Container */}
			<div className="relative flex items-center justify-center w-32 h-32 mb-8">
				{/* Core Core */}
				<div className="absolute w-4 h-4 bg-blue-500 rounded-full animate-pulse z-10 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />

				{/* Inner Ring */}
				<div className="absolute w-16 h-16 border border-blue-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
				<div className="absolute w-16 h-16 border-t-2 border-blue-500 rounded-full animate-[spin_3s_linear_infinite]" />

				{/* Middle Ring (Ping) */}
				<div className="absolute w-full h-full border border-blue-500/20 rounded-full animate-ping opacity-20" />

				{/* Outer Ring (Static) */}
				<div className="absolute w-24 h-24 border border-zinc-800 rounded-full" />

				{/* Scanning Line */}
				<div className="absolute w-full h-full rounded-full overflow-hidden animate-[spin_4s_linear_infinite_reverse]">
					<div className="w-1/2 h-1/2 bg-linear-to-br from-blue-500/20 to-transparent absolute top-0 left-0 origin-bottom-right rotate-45" />
				</div>
			</div>

			{/* Text Animation */}
			<div className="flex flex-col items-center gap-2">
				<h2 className="text-xl font-bold tracking-[0.2em] text-white animate-pulse">
					VEXEEI
				</h2>
				<p className="text-xs text-zinc-500 uppercase tracking-widest">
					Establishing Satellite Link...
				</p>
			</div>
		</div>
	);
}
