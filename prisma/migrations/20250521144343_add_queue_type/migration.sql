-- CreateEnum
CREATE TYPE "QueueType" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Queue" ADD COLUMN "queueType" "QueueType" NOT NULL DEFAULT 'OFFLINE';
