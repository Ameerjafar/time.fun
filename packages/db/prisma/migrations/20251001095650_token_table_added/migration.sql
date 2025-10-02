/*
  Warnings:

  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "GroupChatFixedPrice" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dmPrice" DOUBLE PRECISION,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "videoCallFixedPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "userHoldToken" (
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userHoldToken_pkey" PRIMARY KEY ("tokenId")
);

-- AddForeignKey
ALTER TABLE "userHoldToken" ADD CONSTRAINT "userHoldToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
