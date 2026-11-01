-- Database: app_db
-- Read-only queries. Safe to run any number of times.
SELECT * FROM users;

SELECT name, email FROM users;

SELECT * FROM users WHERE name = 'Kishan';

SELECT COUNT(*) FROM users;
