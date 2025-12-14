/*
  Warnings:

  - You are about to drop the column `faction` on the `University` table. All the data in the column will be lost.
  - You are about to drop the column `health` on the `University` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "University" DROP COLUMN "faction",
DROP COLUMN "health";

-- AddForeignKey
ALTER TABLE "HexTile" ADD CONSTRAINT "HexTile_uniId_fkey" FOREIGN KEY ("uniId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
