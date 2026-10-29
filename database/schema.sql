-- =====================================================================
-- Lost and Found System — Database Schema
-- Matches Section 8 (Database Design) of the system design document.
--
-- How to use with XAMPP:
--   1. Start Apache + MySQL from the XAMPP Control Panel.
--   2. Open http://localhost/phpmyadmin
--   3. Click "Import", choose this file, and run it.
--      (This creates the database and all three tables for you.)
--   4. Then open http://localhost/lost-and-found-system/api/seed.php
--      once in your browser to load demo accounts + demo posts.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS lost_and_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lost_and_found;

-- ---------------------------------------------------------------------
-- users — Section 8, Table 5. Stores user and administrator accounts.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- posts — Section 8, Table 5. Stores lost and found item reports.
-- Resolved posts are DELETED outright per Section 8.2 (Data Retention
-- and Cleanup Policy), so `status` only ever holds 'pending' in
-- practice — it is kept so the schema matches the documented design.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  type            ENUM('lost','found') NOT NULL,
  item_name       VARCHAR(150) NOT NULL,
  description     TEXT NOT NULL,
  image_url       VARCHAR(500) NULL,
  icon            VARCHAR(10) NULL,
  location        VARCHAR(150) NOT NULL,
  date_lost_found DATE NOT NULL,
  status          ENUM('pending','resolved') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_status (status),
  INDEX idx_posts_type (type),
  INDEX idx_posts_created_at (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- reports — Section 8, Table 5. Stores reports filed against a post.
-- post_id is nullable + ON DELETE SET NULL so a report's history
-- survives even after an admin removes the post it was filed against.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NULL,
  reporter_id INT UNSIGNED NOT NULL,
  post_title  VARCHAR(150) NOT NULL,
  reason      VARCHAR(500) NOT NULL,
  status      ENUM('pending','dismissed','resolved') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- resolved_log — not in the original doc's table list, added so the
-- Administrator Dashboard's "Resolved Items" summary card (Section
-- 12.1) has something to count even though resolved posts are
-- permanently deleted (Section 8.2). Each row is a lightweight,
-- anonymous record of a resolution — not a copy of the post.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resolved_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NULL,
  item_name   VARCHAR(150) NOT NULL,
  type        ENUM('lost','found') NOT NULL,
  resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  INDEX idx_resolved_post (post_id)
) ENGINE=InnoDB;
