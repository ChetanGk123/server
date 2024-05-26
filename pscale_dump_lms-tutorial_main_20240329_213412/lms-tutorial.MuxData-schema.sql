CREATE TABLE `MuxData` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assetId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `playbackId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chapterId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MuxData_chapterId_key` (`chapterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
