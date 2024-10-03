-- AlterTable
ALTER TABLE `event` ADD COLUMN `registrationFee` DOUBLE NULL,
    ADD COLUMN `registrationLink` VARCHAR(191) NULL,
    ADD COLUMN `requiresPayment` BOOLEAN NOT NULL DEFAULT false;
