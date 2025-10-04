/*
  Warnings:

  - The primary key for the `UserHoldToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `UserHoldToken` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ROLE" AS ENUM ('USER', 'CREATOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "ROLE" NOT NULL;

-- AlterTable
ALTER TABLE "UserHoldToken" DROP CONSTRAINT "UserHoldToken_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "UserHoldToken_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Tokens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tokens_userId_key" ON "Tokens"("userId");

-- AddForeignKey
ALTER TABLE "Tokens" ADD CONSTRAINT "Tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
