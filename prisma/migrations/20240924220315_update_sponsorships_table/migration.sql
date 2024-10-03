/*
  Warnings:

  - Added the required column `teamId` to the `Sponsorship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sponsorship` ADD COLUMN `teamId` INTEGER NOT NULL;
