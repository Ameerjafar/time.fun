/*
  Warnings:

  - A unique constraint covering the columns `[mintAddress]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolAddress]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentPrice" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "initialPrice" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "mintAddress" TEXT,
ADD COLUMN     "poolAddress" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Token_mintAddress_key" ON "Token"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Token_poolAddress_key" ON "Token"("poolAddress");
