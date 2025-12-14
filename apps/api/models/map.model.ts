import prisma from '../lib/prisma';
import type { University } from '@prisma/client';

export const getUniversities = async () => {
	const universities = await prisma.$queryRaw<
		(University & { boundary: any })[]
	>`
		SELECT 
			id, 
			name, 
			ST_AsGeoJSON(boundary)::json as boundary 
		FROM "University"
	`;

	return universities;
};

export const getUniHexagons = async () => {
	const hexagons = await prisma.$queryRaw<
		{ id: string; q: number; r: number; s: number }[]
	>`
		select id, status, ST_AsGeoJSON(boundary)::json as boundary , health
		from "HexTile";
	`;

	return hexagons;
};
