-- Database: app_db
-- Safe to re-run: rows whose email already exists are skipped.
INSERT INTO users (name, email, password)
VALUES
('Raman', 'raman@gmail.com', 'abc@123'),
('Kishan', 'kishan@gmail.com', 'kishan@123'),
('Raaju', 'raju@gmail.com', 'raju@123') ON CONFLICT (email) DO NOTHING;
