/*
  Warnings:

  - Added the required column `type` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('P2PMESSAGE', 'GROUPMESSAGE');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "type" "MessageType" NOT NULL;
