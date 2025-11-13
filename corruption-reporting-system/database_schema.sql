CREATE DATABASE IF NOT EXISTS corruption_db;
USE corruption_db;

-- Table for corruption reports
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    department VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date_reported DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- Insert default admin user
-- Username: admin
-- Password: admin123
INSERT INTO admin_users (username, password) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Sample data for testing (optional)
INSERT INTO reports (name, department, description, date_reported, status) VALUES
('Anonymous', 'Finance Department', 'Irregularities found in budget allocation for Q3 2024', CURDATE(), 'Pending'),
('John Doe', 'Procurement', 'Suspicious vendor selection process without proper bidding', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Under Review'),
('', 'Human Resources', 'Nepotism in recent hiring practices', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Pending');