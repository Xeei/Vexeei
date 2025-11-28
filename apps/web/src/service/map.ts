import uniBou from '../../mock/uni.json';
import * as turf from '@turf/turf';
import type { FeatureCollection, Polygon } from 'geojson';

export async function getUniBou(uni_name: string) {
	try {
		if (!(uni_name in uniBou)) {
			throw new Error('University not found');
		}
		const uni_bou = uniBou[
			uni_name as keyof typeof uniBou
		] as FeatureCollection<Polygon>;
		const bbox = turf.bbox(uni_bou);
		const hexGrid = turf.hexGrid(bbox, 50, {
			units: 'meters',
			mask: uni_bou.features[0],
		});
		hexGrid.features.forEach((f) => {
			f.properties = {
				...f.properties,
				height: Math.random() * 500,
			};
		});
		return hexGrid;
	} catch (error) {
		console.error('Error fetching mock geojson:', error);
		return null;
	}
}
