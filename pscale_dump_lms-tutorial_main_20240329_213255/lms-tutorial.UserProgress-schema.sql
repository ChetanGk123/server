CREATE TABLE `UserProgress` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapterId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserProgress_userId_chapterId_key` (`userId`,`chapterId`),
  KEY `UserProgress_chapterId_idx` (`chapterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
