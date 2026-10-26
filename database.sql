-- AccessDesk Assignment 05
-- Use the lecture database and table: mydb8.customers4
-- Run this file in phpMyAdmin SQL tab only if the table needs to be created.
-- If your lecture table already exists, keep its data and check column names.
CREATE DATABASE IF NOT EXISTS mydb8;
USE mydb8;

CREATE TABLE IF NOT EXISTS customers4 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Address VARCHAR(255) NOT NULL
);

-- Optional sample records (only inserted if table is empty)
INSERT INTO customers4 (Name, Address)
SELECT 'Ali', 'Taxila'
WHERE NOT EXISTS (SELECT 1 FROM customers4 LIMIT 1);

INSERT INTO customers4 (Name, Address)
SELECT 'Ayesha', 'Kamra'
WHERE (SELECT COUNT(*) FROM customers4) = 1;

INSERT INTO customers4 (Name, Address)
SELECT 'Ahmed', 'Attock'
WHERE (SELECT COUNT(*) FROM customers4) = 2;

INSERT INTO customers4 (Name, Address)
SELECT 'Fatima', 'Wah Cantt'
WHERE (SELECT COUNT(*) FROM customers4) = 3;

INSERT INTO customers4 (Name, Address)
SELECT 'Usman', 'Islamabad'
WHERE (SELECT COUNT(*) FROM customers4) = 4;
