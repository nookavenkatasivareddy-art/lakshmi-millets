-- ============================================================
-- Lakshmi Millets - Relational (SQL) reference schema
-- The backend in this project uses MongoDB (see backend/models/*.js
-- and seed/seed.js) for its actual data store. This SQL file is
-- provided as an equivalent relational schema if you prefer
-- MySQL / PostgreSQL instead of MongoDB.
-- ============================================================

CREATE DATABASE IF NOT EXISTS lakshmi_millets;
USE lakshmi_millets;

-- ---------------- USERS (login / register) ----------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- USER ADDRESSES ----------------
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(150),
  phone VARCHAR(20),
  line1 VARCHAR(255),
  line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------- CATEGORIES ----------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  icon VARCHAR(100),
  image VARCHAR(255)
);

-- ---------------- PRODUCTS ----------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  description TEXT,
  image VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  weight VARCHAR(30) DEFAULT '1kg',
  stock INT DEFAULT 100,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ---------------- DELIVERY LOCATIONS (4 supported areas) ----------------
CREATE TABLE delivery_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  free_delivery_above DECIMAL(10,2) DEFAULT 499,
  estimated_days VARCHAR(30) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO delivery_locations (city, state, delivery_charge, free_delivery_above, estimated_days) VALUES
  ('Hyderabad', 'Telangana', 40, 499, '1-2 days'),
  ('Bangalore', 'Karnataka', 60, 499, '2-3 days'),
  ('Chennai', 'Tamil Nadu', 60, 499, '2-3 days'),
  ('Vijayawada', 'Andhra Pradesh', 50, 499, '2-4 days');

-- ---------------- ORDERS ----------------
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  delivery_location_id INT NOT NULL,
  shipping_full_name VARCHAR(150),
  shipping_phone VARCHAR(20),
  shipping_line1 VARCHAR(255),
  shipping_line2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_pincode VARCHAR(10),
  items_total DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('COD','CARD','UPI','NETBANKING') NOT NULL,
  payment_status ENUM('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  payment_id VARCHAR(100),
  order_status ENUM('PLACED','CONFIRMED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') DEFAULT 'PLACED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations(id)
);

-- ---------------- ORDER ITEMS ----------------
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR(150),
  image VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ---------------- PAYMENTS (gateway reference log) ----------------
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  gateway_order_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('CARD','UPI','NETBANKING') NOT NULL,
  status ENUM('CREATED','PAID','FAILED') DEFAULT 'CREATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
