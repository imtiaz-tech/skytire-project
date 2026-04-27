-- CreateEnum
CREATE TYPE "BrandCategory" AS ENUM ('tire', 'wheel', 'wire_wheel', 'accessory', 'bolt_on_wheels');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandLogo" TEXT NOT NULL,
    "category" "BrandCategory" NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brand_brandName_idx" ON "Brand"("brandName");
