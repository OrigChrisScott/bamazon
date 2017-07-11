DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;
CREATE TABLE products (
	item_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	product_name VARCHAR(50) NOT NULL,
	department_name VARCHAR(50) NOT NULL,
	price DECIMAL(7,2) NOT NULL,
	stock_quantity INT(7) NULL
);
LOAD DATA LOCAL INFILE 'setup/product_data.csv' INTO TABLE products FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n'; 
