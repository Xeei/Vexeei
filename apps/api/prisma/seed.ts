import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as turf from '@turf/turf';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'university.geojson');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function importUnis() {
	console.log(`Found ${rawData.features.length} items. Filtering...`);

	for (const feature of rawData.features) {
		const props = feature.properties;
		const name = props['name:en'] || props['name'];

		if (!name) continue;

		const area = turf.area(feature);
		if (area < 5000) continue;

		const geometry = JSON.stringify(feature.geometry);

		try {
			await prisma.$executeRaw`
				INSERT INTO "University" (id, name, faction, health, boundary)
				VALUES (
					gen_random_uuid(),
					${name},
					'NEUTRAL',
					100,
					ST_GeomFromGeoJSON(${geometry})
				)
			`;

			console.log(`Imported: ${name}`);
		} catch (err: any) {
			console.error(`Failed to import ${name}:`, err.message);
		}
	}
}

importUnis()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
