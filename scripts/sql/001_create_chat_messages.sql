CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` varchar(191) NOT NULL,
  `conversationId` varchar(191) NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `fromRole` varchar(191) NOT NULL,
  `toRole` varchar(191) NOT NULL,
  `driverId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `supportUserId` varchar(191) DEFAULT NULL,
  `text` text NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `metadata` json DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversationId` (`conversationId`),
  KEY `idx_chat_messages_orderId` (`orderId`),
  KEY `idx_chat_messages_driverId` (`driverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

