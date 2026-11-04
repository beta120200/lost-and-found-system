-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 04, 2026 at 05:40 PM
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
(33, 9, 'lost', 'Black Leather Wallet', 'Bi-fold wallet, contains a student ID and a couple of cards. Last had it at the counter.', NULL, '💳', 'Canteen, 2nd Floor', '2026-10-26', 'pending', '2026-10-26 09:37:48'),
(34, 10, 'found', 'Keys with Blue Lanyard', 'Small bunch of keys, one looks like a padlock key, on a blue lanyard.', NULL, '🔑', 'Gymnasium Entrance', '2026-10-29', 'pending', '2026-10-29 09:37:48'),
(35, 9, 'lost', 'Silver Wristwatch', 'Simple silver analog watch with a leather strap, slightly scratched glass.', NULL, '⌚', 'Room 301', '2026-10-21', 'pending', '2026-10-21 09:37:48'),
(36, 10, 'found', 'Red USB Flash Drive', '16GB flash drive, red casing, no labels on it.', NULL, '💾', 'Computer Lab 2', '2026-10-30', 'pending', '2026-10-30 09:37:48'),
(37, 9, 'lost', 'Grey Backpack', 'Grey canvas backpack with a laptop sleeve and a small keychain charm.', NULL, '🎒', 'Library, Ground Floor', '2026-10-23', 'pending', '2026-10-23 09:37:48'),
(38, 10, 'found', 'Wired Earphones', 'White wired earphones, tangled, found tucked under a chair.', NULL, '🎧', 'Lecture Hall B', '2026-10-31', 'pending', '2026-10-31 09:37:48'),
(39, 9, 'lost', 'Chemistry Textbook', 'General Chemistry textbook, name written inside the front cover.', NULL, '📘', 'Room 214', '2026-10-19', 'pending', '2026-10-19 09:37:48'),
(40, 10, 'found', 'Green Water Bottle', 'Stainless steel water bottle, dark green, some stickers on it.', NULL, '🧴', 'Parking Lot', '2026-11-01', 'pending', '2026-11-01 09:37:48'),
(41, 9, 'lost', 'Faded Green Umbrella', 'Compact folding umbrella, faded green fabric, bent tip on one rib.', NULL, '☂️', 'Bus Stop Near Gate 2', '2026-07-05', 'pending', '2026-07-05 09:37:48'),
(42, 10, 'lost', 'Old Physics Notebook', 'Spiral notebook full of problem sets, name written on the first page.', NULL, '📘', 'Room 210', '2026-07-13', 'pending', '2026-07-13 09:37:48'),
(43, 9, 'found', 'Small Silver Stud Earring', 'Single silver stud earring, found near the sinks.', NULL, '💠', 'Library Restroom', '2026-07-21', 'pending', '2026-07-21 09:37:48'),
(44, 10, 'found', 'Black Phone Case', 'Plain black silicone phone case, no phone inside, mid-size model.', NULL, '📱', 'Canteen', '2026-07-29', 'pending', '2026-07-29 09:37:48'),
(45, 9, 'lost', 'Grey Hoodie', 'Plain grey pullover hoodie, size medium, left on a bench.', NULL, '🧥', 'Gym Locker Room', '2026-08-05', 'pending', '2026-08-05 09:37:48'),
(46, 10, 'found', 'White Portable Charger', 'Small white power bank, one usb port, no cable with it.', NULL, '🔋', 'Computer Lab 1', '2026-08-12', 'pending', '2026-08-12 09:37:48'),
(47, 9, 'lost', 'Blue Ballpen Set', 'Set of three blue ballpens in a clear pouch, class name on the pouch.', NULL, '🖊️', 'Room 305', '2026-08-20', 'pending', '2026-08-20 09:37:48'),
(48, 10, 'found', 'Prescription Eyeglasses', 'Black-framed prescription glasses in a soft case, no name on the case.', NULL, '👓', 'Faculty Office Hallway', '2026-08-28', 'pending', '2026-08-28 09:37:48'),
(49, 9, 'lost', 'Maroon Scarf', 'Knitted maroon scarf, dropped somewhere near the main gate.', NULL, '🧣', 'Main Entrance', '2026-09-04', 'pending', '2026-09-04 09:37:48'),
(50, 10, 'found', 'Wireless Mouse', 'Black wireless mouse, no receiver, left plugged into a charging cable.', NULL, '🖱️', 'Computer Lab 2', '2026-09-12', 'pending', '2026-09-12 09:37:48'),
(51, 9, 'lost', 'Student ID Lanyard', 'Blue lanyard with a clip, no ID card attached anymore.', NULL, '🪪', 'Parking Lot', '2026-09-20', 'pending', '2026-09-20 09:37:48'),
(52, 10, 'found', 'Small Coin Purse', 'Small brown coin purse with a zipper, a few coins inside.', NULL, '👛', 'Canteen', '2026-09-28', 'pending', '2026-09-28 09:37:48'),
(53, 9, 'lost', 'Denim Jacket', 'Light-wash denim jacket, size small, left draped over a chair.', NULL, '🧥', 'Lecture Hall A', '2026-10-03', 'pending', '2026-10-03 09:37:48');

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
(7, 34, 9, 'Keys with Blue Lanyard', 'I think these are my keys — please verify with the finder.', 'pending', '2026-10-30 09:37:48'),
(8, 38, 9, 'Wired Earphones', 'Duplicate of another found post from the same day.', 'pending', '2026-10-31 09:37:48');

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
(17, NULL, 'Blue Umbrella', 'lost', '2026-06-17 09:37:48'),
(18, NULL, 'Brown Sling Bag', 'found', '2026-06-24 09:37:48'),
(19, NULL, 'Set of Classroom Keys', 'found', '2026-06-29 09:37:48'),
(20, NULL, 'Yellow Raincoat', 'lost', '2026-07-07 09:37:48'),
(21, NULL, 'Scientific Calculator', 'lost', '2026-07-17 09:37:48'),
(22, NULL, 'Pair of Earbuds', 'found', '2026-07-25 09:37:48'),
(23, NULL, 'School ID (Laminated)', 'found', '2026-08-01 09:37:48'),
(24, NULL, 'Red Water Jug', 'lost', '2026-08-08 09:37:48'),
(25, NULL, 'Charger Brick', 'found', '2026-08-16 09:37:48'),
(26, NULL, 'Spiral Notebook', 'lost', '2026-08-26 09:37:48'),
(27, NULL, 'Black Cap', 'found', '2026-09-05 09:37:48'),
(28, NULL, 'Hair Clip Set', 'found', '2026-09-15 09:37:48'),
(29, NULL, 'Metal Water Bottle', 'lost', '2026-09-25 09:37:48'),
(30, NULL, 'Pencil Case', 'found', '2026-10-10 09:37:48');

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
(9, 'Maria Santos', 'maria@icct.edu.ph', '$2y$10$PsY.t.hS1uCIPnKBv.anx.TXN9DNlwrEskRAwK2Lli.a3w/sdF07q', 'user', 'active', '2026-11-04 16:37:48'),
(10, 'Jake Rivera', 'jake@icct.edu.ph', '$2y$10$TElnUdP4vaG9nLAgBT.5Ke0pe/0DBrP747Og3FO3MvxrccGsY02Ai', 'user', 'active', '2026-11-04 16:37:48'),
(11, 'Francisco Ocsan', 'admin@icct.edu.ph', '$2y$10$kPArPbGrroDiMQjMrzjELe58UvZDWb6BnqHsqLnnLcK5HSi3eR8Yu', 'admin', 'active', '2026-11-04 16:37:48');

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `resolved_log`
--
ALTER TABLE `resolved_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
