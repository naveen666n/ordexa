-- =============================================================================
--  MySQL Auto-Truncate Script
--  Truncates all tables in a database, with exclusion list support.
--  Usage: mysql -u root -p your_database < truncate_all.sql
-- =============================================================================

USE product_catalog_dev;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
--  Generate & execute TRUNCATE for all tables EXCEPT excluded ones
-- =============================================================================
SELECT CONCAT('TRUNCATE TABLE `', table_name, '`;') AS stmt
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN (
    'migrations',
    'settings',
    'users',
    'roles',
    'permissions'
  );

-- =============================================================================
--  The query above shows you what WILL be truncated (dry-run preview).
--  To actually execute, use the stored procedure below.
--  Call it: CALL truncate_all_tables();
-- =============================================================================

DROP PROCEDURE IF EXISTS truncate_all_tables;

DELIMITER $$

CREATE PROCEDURE truncate_all_tables()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE tbl  VARCHAR(255);

  -- Cursor: fetch all non-excluded tables in current database
  DECLARE cur CURSOR FOR
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type   = 'BASE TABLE'
      AND table_name NOT IN (
        -- ── ADD TABLES TO EXCLUDE HERE ──────────────────────────────────
        'migrations',
        'settings',
        'users',
        'roles',
        'permissions'
        -- ────────────────────────────────────────────────────────────────
      );

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  SET FOREIGN_KEY_CHECKS = 0;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO tbl;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Log which table is being truncated
    SELECT CONCAT('Truncating: ', DATABASE(), '.', tbl) AS status;

    -- Execute the truncate dynamically
    SET @sql = CONCAT('TRUNCATE TABLE `', tbl, '`');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

  END LOOP;

  CLOSE cur;

  SET FOREIGN_KEY_CHECKS = 1;

  SELECT CONCAT('Done. All tables truncated in: ', DATABASE()) AS status;

END$$

DELIMITER ;

-- =============================================================================
--  RUN IT
-- =============================================================================
CALL truncate_all_tables();
