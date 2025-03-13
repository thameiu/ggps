-- AlterTable
ALTER TABLE "Chatroom" ADD COLUMN     "delay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "privacy" TEXT NOT NULL DEFAULT 'write';
