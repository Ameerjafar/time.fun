/*
  Warnings:

  - You are about to drop the `userHoldToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "userHoldToken" DROP CONSTRAINT "userHoldToken_userId_fkey";

-- DropTable
DROP TABLE "userHoldToken";

-- CreateTable
CREATE TABLE "UserHoldToken" (
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHoldToken_pkey" PRIMARY KEY ("tokenId")
);

-- AddForeignKey
ALTER TABLE "UserHoldToken" ADD CONSTRAINT "UserHoldToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
