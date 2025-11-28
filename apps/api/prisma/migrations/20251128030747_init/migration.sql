-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boundary" geometry(Polygon, 4326),
    "health" INTEGER NOT NULL DEFAULT 100,
    "faction" TEXT NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HexTile" (
    "id" TEXT NOT NULL,
    "uniId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "HexTile_pkey" PRIMARY KEY ("id")
);
