-- AlterTable
ALTER TABLE "Palette" ALTER COLUMN "isPublic" SET DEFAULT false;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "paletteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Like_paletteId_key" ON "Like"("paletteId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_paletteId_fkey" FOREIGN KEY ("paletteId") REFERENCES "Palette"("id") ON DELETE CASCADE ON UPDATE CASCADE;
