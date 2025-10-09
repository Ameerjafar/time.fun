/*
  Warnings:

  - You are about to drop the column `userId` on the `Message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tokens" DROP CONSTRAINT "Tokens_userId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Tokens" ADD CONSTRAINT "Tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
