'use client';

import { Fragment, useState } from 'react';
import { MousePointer2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HeaderTools() {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Fragment>
			<div
				className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div
					className={cn(
						'bg-zinc-950/90 border-zinc-800 backdrop-blur text-white rounded-b-md border-b border-x transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center',
						isHovered ? 'h-32 w-64 p-4' : 'h-10 w-32 p-2'
					)}
				>
					<div className="flex items-center justify-center w-full mb-0 shrink-0">
						<h1 className="font-bold tracking-widest text-blue-500">
							VEXEEI
						</h1>
					</div>

					<div
						className={cn(
							'space-y-2 w-full transition-opacity duration-300 delay-100',
							isHovered
								? 'opacity-100'
								: 'opacity-0 pointer-events-none'
						)}
					>
						<Button
							variant="secondary"
							className="w-full justify-start gap-2 h-8 text-xs"
						>
							<MousePointer2 className="w-3 h-3" />
							Select / Edit
						</Button>
						<Button
							variant="ghost"
							className="w-full justify-start gap-2 h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50"
						>
							<Trash2 className="w-3 h-3" />
							Clear Map
						</Button>
					</div>
				</div>
			</div>
		</Fragment>
	);
}
