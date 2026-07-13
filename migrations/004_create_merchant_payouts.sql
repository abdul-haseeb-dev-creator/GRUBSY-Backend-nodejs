-- Migration: Create merchant_payouts table for merchant payout tracking

CREATE TABLE IF NOT EXISTS `merchant_payouts` (
  `id` varchar(191) NOT NULL,
  `partner_id` varchar(64) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
  `method` varchar(32) DEFAULT NULL,
  `external_reference` varchar(128) DEFAULT NULL,
  `requested_at` datetime NOT NULL,
  `processed_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_partner_created` (`partner_id`,`requested_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

