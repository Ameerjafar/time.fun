/*
  Warnings:

  - You are about to drop the column `GroupChatFixedPrice` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dmPrice` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `videoCallFixedPrice` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tokens" DROP CONSTRAINT "Tokens_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "GroupChatFixedPrice",
DROP COLUMN "dmPrice",
DROP COLUMN "videoCallFixedPrice";

-- DropTable
DROP TABLE "Tokens";

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fixedDmPrice" DOUBLE PRECISION,
    "fixedGroupChatPrice" DOUBLE PRECISION,
    "fixedVideoCallPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_userId_key" ON "Token"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingModel_userId_key" ON "PricingModel"("userId");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingModel" ADD CONSTRAINT "PricingModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
