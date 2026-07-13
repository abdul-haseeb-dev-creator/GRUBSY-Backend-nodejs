-- Migration: Create new merchants table with merchants_name column
-- This creates a new table alongside the existing Establishments table

-- Step 1: Create the new merchants table with merchants_name column
CREATE TABLE `merchants` (
  `id` varchar(191) NOT NULL,
  `Grubsy Partner ID` varchar(191) NOT NULL,
  `merchants_name` varchar(255) DEFAULT NULL,
  `Description` text,
  `Cuisine` varchar(255) DEFAULT NULL,
  `Address` text,
  `Area` varchar(255) DEFAULT NULL,
  `PostCode` varchar(255) DEFAULT NULL,
  `Hygiene Rating` varchar(255) DEFAULT NULL,
  `Opening Times` text,
  `حلال Halal Friendly?` varchar(255) DEFAULT NULL,
  `Photo` varchar(255) DEFAULT NULL,
  `Booking Available` varchar(255) DEFAULT NULL,
  `Relation` varchar(255) DEFAULT NULL,
  `Active` varchar(255) DEFAULT NULL,
  `Owner Email` varchar(255) DEFAULT NULL,
  `Created at` varchar(255) DEFAULT NULL,
  `Owners Name` varchar(255) DEFAULT NULL,
  `Owners number` varchar(255) DEFAULT NULL,
  `Establishments Enrolement Status` varchar(255) DEFAULT NULL,
  `Establishment Fee Per Order` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchants_Grubsy Partner ID_key` (`Grubsy Partner ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Copy all data from Establishments to merchants table
INSERT INTO `merchants` (
  `id`,
  `Grubsy Partner ID`, 
  `merchants_name`,
  `Description`,
  `Cuisine`,
  `Address`,
  `Area`,
  `PostCode`,
  `Hygiene Rating`,
  `Opening Times`,
  `حلال Halal Friendly?`,
  `Photo`,
  `Booking Available`,
  `Relation`,
  `Active`,
  `Owner Email`,
  `Created at`,
  `Owners Name`,
  `Owners number`,
  `Establishments Enrolement Status`,
  `Establishment Fee Per Order`
)
SELECT 
  `id`,
  `Grubsy Partner ID`,
  `Establishment Name` AS `merchants_name`,  -- Map old column to new merchants_name
  `Description`,
  `Cuisine`,
  `Address`,
  `Area`,
  `PostCode`,
  `Hygiene Rating`,
  `Opening Times`,
  `حلال Halal Friendly?`,
  `Photo`,
  `Booking Available`,
  `Relation`,
  `Active`,
  `Owner Email`,
  `Created at`,
  `Owners Name`,
  `Owners number`,
  `Establishments Enrolement Status`,
  `Establishment Fee Per Order`
FROM `Establishments`;

-- Step 3: Verify the new table
SELECT COUNT(*) as total_merchants FROM `merchants`;
SELECT `merchants_name`, `Cuisine` FROM `merchants` LIMIT 5;