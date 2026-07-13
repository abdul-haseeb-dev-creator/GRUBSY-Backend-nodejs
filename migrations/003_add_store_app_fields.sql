-- Migration: Add fields for Grubsy Store App (Section 5)
-- Only adds minimal fields for drivers + handoff functionality
-- Does not modify existing fields or break compatibility

-- Add handoffAt field to Orders table
ALTER TABLE `Orders` ADD COLUMN `handoffAt` DATETIME NULL;

-- Add Grubsy_Partner_ID field to Drivers table (for partner scoping)
ALTER TABLE `Drivers` ADD COLUMN `Grubsy_Partner_ID` VARCHAR(191) NULL;

-- Add index for partner-scoped driver queries
ALTER TABLE `Drivers` ADD INDEX `Drivers_Grubsy Partner ID_fkey` (`Grubsy_Partner_ID`);

-- Create Order_Adjustments table for tracking price adjustments
CREATE TABLE `Order_Adjustments` (
  `id` VARCHAR(191) NOT NULL,
  `Order ID` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `Created At` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `Updated At` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add index for order adjustments queries
ALTER TABLE `Order_Adjustments` ADD INDEX `Order Adjustments_Order ID_fkey` (`Order ID`);

-- Add foreign key constraint (adjust table/field names to match your schema)
-- Note: Update the foreign key reference to match your exact Orders table primary key
ALTER TABLE `Order_Adjustments` ADD CONSTRAINT `Order_Adjustments_Order_ID_fkey`
  FOREIGN KEY (`Order ID`) REFERENCES `Orders`(`Order_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key for Drivers to merchants (partner scoping)
-- Note: Update to match your exact merchants table primary key
ALTER TABLE `Drivers` ADD CONSTRAINT `Drivers_Grubsy_Partner_ID_fkey`
  FOREIGN KEY (`Grubsy_Partner_ID`) REFERENCES `merchants`(`Grubsy_Partner_ID`) ON DELETE SET NULL ON UPDATE CASCADE;