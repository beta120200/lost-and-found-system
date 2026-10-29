-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 03:17 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lost_and_found`
--

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` enum('lost','found') NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `location` varchar(150) NOT NULL,
  `date_lost_found` date NOT NULL,
  `status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `type`, `item_name`, `description`, `image_url`, `icon`, `location`, `date_lost_found`, `status`, `created_at`) VALUES
(1, 1, 'lost', 'Black Leather Wallet', 'Bi-fold wallet, contains a student ID and a couple of cards. Last had it at the counter.', NULL, '💳', 'Canteen, 2nd Floor', '2026-10-15', 'pending', '2026-10-15 02:57:21'),
(4, 2, 'found', 'Red USB Flash Drive', '16GB flash drive, red casing, no labels on it.', NULL, '💾', 'Computer Lab 2', '2026-10-19', 'pending', '2026-10-19 02:57:21'),
(5, 1, 'lost', 'Grey Backpack', 'Grey canvas backpack with a laptop sleeve and a small keychain charm.', NULL, '🎒', 'Library, Ground Floor', '2026-10-12', 'pending', '2026-10-12 02:57:21'),
(6, 2, 'found', 'Wired Earphones', 'White wired earphones, tangled, found tucked under a chair.', NULL, '🎧', 'Lecture Hall B', '2026-10-20', 'pending', '2026-10-20 02:57:21'),
(7, 1, 'lost', 'Chemistry Textbook', 'General Chemistry textbook, name written inside the front cover.', NULL, '📘', 'Room 214', '2026-10-08', 'pending', '2026-10-08 02:57:21'),
(8, 2, 'found', 'Green Water Bottle', 'Stainless steel water bottle, dark green, some stickers on it.', NULL, '🧴', 'Parking Lot', '2026-10-21', 'pending', '2026-10-21 02:57:21'),
(9, 1, 'lost', 'Faded Green Umbrella', 'Compact folding umbrella, faded green fabric, bent tip on one rib.', NULL, '☂️', 'Bus Stop Near Gate 2', '2026-06-24', 'pending', '2026-06-24 02:57:21'),
(11, 1, 'found', 'Small Silver Stud Earring', 'Single silver stud earring, found near the sinks.', NULL, '💠', 'Library Restroom', '2026-07-10', 'pending', '2026-07-10 02:57:21'),
(12, 2, 'found', 'Black Phone Case', 'Plain black silicone phone case, no phone inside, mid-size model.', NULL, '📱', 'Canteen', '2026-07-18', 'pending', '2026-07-18 02:57:21'),
(13, 1, 'lost', 'Grey Hoodie', 'Plain grey pullover hoodie, size medium, left on a bench.', NULL, '🧥', 'Gym Locker Room', '2026-07-25', 'pending', '2026-07-25 02:57:21'),
(14, 2, 'found', 'White Portable Charger', 'Small white power bank, one usb port, no cable with it.', NULL, '🔋', 'Computer Lab 1', '2026-08-01', 'pending', '2026-08-01 02:57:21'),
(15, 1, 'lost', 'Blue Ballpen Set', 'Set of three blue ballpens in a clear pouch, class name on the pouch.', NULL, '🖊️', 'Room 305', '2026-08-09', 'pending', '2026-08-09 02:57:21'),
(16, 2, 'found', 'Prescription Eyeglasses', 'Black-framed prescription glasses in a soft case, no name on the case.', NULL, '👓', 'Faculty Office Hallway', '2026-08-17', 'pending', '2026-08-17 02:57:21'),
(17, 1, 'lost', 'Maroon Scarf', 'Knitted maroon scarf, dropped somewhere near the main gate.', NULL, '🧣', 'Main Entrance', '2026-08-24', 'pending', '2026-08-24 02:57:21'),
(18, 2, 'found', 'Wireless Mouse', 'Black wireless mouse, no receiver, left plugged into a charging cable.', NULL, '🖱️', 'Computer Lab 2', '2026-09-01', 'pending', '2026-09-01 02:57:21'),
(19, 1, 'lost', 'Student ID Lanyard', 'Blue lanyard with a clip, no ID card attached anymore.', NULL, '🪪', 'Parking Lot', '2026-09-09', 'pending', '2026-09-09 02:57:21'),
(20, 2, 'found', 'Small Coin Purse', 'Small brown coin purse with a zipper, a few coins inside.', NULL, '👛', 'Canteen', '2026-09-17', 'pending', '2026-09-17 02:57:21'),
(21, 1, 'lost', 'Denim Jacket', 'Light-wash denim jacket, size small, left draped over a chair.', NULL, '🧥', 'Lecture Hall A', '2026-09-22', 'pending', '2026-09-22 02:57:21'),
(22, 1, 'lost', 'DRIVER LICENSE', 'NAWALA SA MAY FOOD COURT', NULL, '💳', 'FOOD COURT', '2026-10-02', 'pending', '2026-10-24 09:03:13'),
(23, 1, 'found', 'DRIVER LICENSE', 'nawala sa food court', NULL, '💳', 'FOOD COURT', '2026-10-02', 'pending', '2026-10-24 09:05:37'),
(24, 1, 'lost', 'ballpen', 'ballpen red blue black', NULL, '🏷️', 'room b2-23', '2026-10-24', 'pending', '2026-10-24 09:10:54'),
(25, 1, 'lost', 'ballpen', 'blue black red', NULL, '🏷️', 'room b2-23', '2026-10-24', 'pending', '2026-10-24 09:25:11'),
(26, 1, 'lost', 'ballpen', 'black', NULL, '💳', 'room b2-23', '2026-10-24', 'pending', '2026-10-24 09:38:29'),
(27, 1, 'lost', 'ballpen', 'qwe', NULL, '🏷️', 'room b2-23', '2026-10-24', 'pending', '2026-10-24 09:55:23'),
(30, 1, 'found', 'DRIVER LICENSE', 'DRIVER LICENSE', 'https://i.ibb.co/kVmML2TJ/philippine-drivers-license-5fc9f1eb3b9f9.jpg', '💳', 'room b2-23', '2026-10-24', 'pending', '2026-10-24 10:54:09'),
(32, 1, 'lost', 'Black Leather Wallet', 'Bi-fold wallet, contains student ID and couple of cards.', NULL, '💳', 'Canteen, 2nd floor', '2026-10-25', 'pending', '2026-10-29 01:00:49');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(10) UNSIGNED NOT NULL,
  `post_id` int(10) UNSIGNED DEFAULT NULL,
  `reporter_id` int(10) UNSIGNED NOT NULL,
  `post_title` varchar(150) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` enum('pending','dismissed','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `post_id`, `reporter_id`, `post_title`, `reason`, `status`, `created_at`) VALUES
(1, NULL, 1, 'Keys with Blue Lanyard', 'I think these are my keys — please verify with the finder.', 'resolved', '2026-10-19 02:57:21'),
(2, 6, 1, 'Wired Earphones', 'Duplicate of another found post from the same day.', 'pending', '2026-10-20 02:57:21'),
(3, 8, 1, 'Green Water Bottle', 'This item belongs to me — MUKHANG AKIN YAN', 'dismissed', '2026-10-24 09:02:09'),
(4, 8, 1, 'Green Water Bottle', 'This item belongs to me — NAKITA KO NA PO', 'dismissed', '2026-10-24 10:58:57'),
(5, NULL, 2, 'ballpen', 'This item belongs to me — akin po to', 'resolved', '2026-10-29 01:38:30'),
(6, NULL, 2, 'Silver Wristwatch', 'This item belongs to me — akin po ata yan', 'resolved', '2026-10-29 01:50:59');

-- --------------------------------------------------------

--
-- Table structure for table `resolved_log`
--

CREATE TABLE `resolved_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `post_id` int(10) UNSIGNED DEFAULT NULL,
  `item_name` varchar(150) NOT NULL,
  `type` enum('lost','found') NOT NULL,
  `resolved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resolved_log`
--

INSERT INTO `resolved_log` (`id`, `post_id`, `item_name`, `type`, `resolved_at`) VALUES
(1, NULL, 'Blue Umbrella', 'lost', '2026-06-06 02:57:21'),
(2, NULL, 'Brown Sling Bag', 'found', '2026-06-13 02:57:21'),
(3, NULL, 'Set of Classroom Keys', 'found', '2026-06-18 02:57:21'),
(4, NULL, 'Yellow Raincoat', 'lost', '2026-06-26 02:57:21'),
(5, NULL, 'Scientific Calculator', 'lost', '2026-07-06 02:57:21'),
(6, NULL, 'Pair of Earbuds', 'found', '2026-07-14 02:57:21'),
(7, NULL, 'School ID (Laminated)', 'found', '2026-07-21 02:57:21'),
(8, NULL, 'Red Water Jug', 'lost', '2026-07-28 02:57:21'),
(9, NULL, 'Charger Brick', 'found', '2026-08-05 02:57:21'),
(10, NULL, 'Spiral Notebook', 'lost', '2026-08-15 02:57:21'),
(11, NULL, 'Black Cap', 'found', '2026-08-25 02:57:21'),
(12, NULL, 'Hair Clip Set', 'found', '2026-09-04 02:57:21'),
(13, NULL, 'Metal Water Bottle', 'lost', '2026-09-14 02:57:21'),
(14, NULL, 'Pencil Case', 'found', '2026-09-29 02:57:21'),
(15, 3, 'Silver Wristwatch', 'lost', '2026-10-29 01:51:10'),
(16, 10, 'Old Physics Notebook', 'lost', '2026-10-29 01:55:26');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`) VALUES
(1, 'Maria Santos', 'maria@icct.edu.ph', '$2y$10$E7sLupdhFMrOb0rT7PQlG.xFiFoAdmdZbf54LBYCIHRWkJgN6vF7m', 'user', 'active', '2026-10-24 08:57:21'),
(2, 'Jake Rivera', 'jake@icct.edu.ph', '$2y$10$0INJr9Rggj.DHfYIgYroUegykCBbjPIMGTKyZtKJ5Fi4kt5ksqgb2', 'user', 'active', '2026-10-24 08:57:21'),
(3, 'Ms. Cruz', 'admin@icct.edu.ph', '$2y$10$8UcR2I0KN.rqHBrBx7mCxeNIfZD.PHTYxoFEJUdUITu5FHOHizHji', 'admin', 'active', '2026-10-24 08:57:21'),
(4, 'alvin beato', 'alvin@icct.edu.ph', '$2y$10$LbYVTht8pWC9wrHfN4A.UuKJp2Qd0PVG81gZtkVu/eOphRPONmSje', 'user', 'active', '2026-10-24 11:01:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_posts_user` (`user_id`),
  ADD KEY `idx_posts_status` (`status`),
  ADD KEY `idx_posts_type` (`type`),
  ADD KEY `idx_posts_created_at` (`created_at`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_reports_post` (`post_id`),
  ADD KEY `fk_reports_reporter` (`reporter_id`),
  ADD KEY `idx_reports_status` (`status`);

--
-- Indexes for table `resolved_log`
--
ALTER TABLE `resolved_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resolved_post` (`post_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `resolved_log`
--
ALTER TABLE `resolved_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
