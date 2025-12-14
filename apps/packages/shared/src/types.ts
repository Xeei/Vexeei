export interface University {
	id: string;
	name: string;
	health: number;
	// Don't put heavy Polygon data here if not needed everywhere
}

export interface AttackPayload {
	attackerId: string;
	targetHexId: string;
	damage: number;
}
