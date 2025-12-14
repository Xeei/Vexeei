-- AlterTable
ALTER TABLE "HexTile" ADD COLUMN     "boundary" geometry(Polygon, 4326),
ADD COLUMN     "health" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "status" SET DEFAULT 'active';
