/*
  Warnings:

  - Added the required column `awayTeamLogoUrl` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeamLogoUrl` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `match` ADD COLUMN `awayTeamLogoUrl` VARCHAR(191) NOT NULL,
    ADD COLUMN `homeTeamLogoUrl` VARCHAR(191) NOT NULL;
