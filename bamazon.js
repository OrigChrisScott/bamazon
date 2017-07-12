const key = require('./keys.js');
const mysql = require('mysql');
const inquirer = require('inquirer');
const consoleTable = require('cli-table');

let itemArray = [];
let choiceArray = [];

const createConnection = () => {
	let connection = mysql.createConnection({
		host: 'localhost',
		port: key.keys.port,
		user: key.keys.user,
		password: key.keys.pass,
		database: 'bamazon'
	});
	return connection;
};

function NewOrder(item_id, product_name, price, qty) {
	this.item_id = item_id;
	this.product_name = product_name;
	this.price = price;
	this.qty = qty;
	this.return = false;
	this.displayOrder = function() {
		let orderTotal = this.price * this.qty;
		let table = new consoleTable({
			head: ['Item ID', 'Product', 'Price', 'Qty', 'Order Total'],
			colWidths: [10, 30, 15, 15, 20]
		});
		table.push([this.item_id, this.product_name, '$ ' + this.price.toLocaleString('en', {currency: 'USD', minimumFractionDigits: 2}), this.qty.toLocaleString(), '$ ' + orderTotal.toLocaleString('en', {currency: 'USD', minimumFractionDigits: 2})]);
		let output = `

		Thank You For Your Purchase!  Your confirmation is below:
		`;
		console.log(output)
		console.log(table.toString() + '\n');
	};
};

const purchaseProduct = (id, qty) => {
	let connection = createConnection();
	connection.connect(function(err) {
		if (err) throw err;
		connection.query("SELECT product_name, price, stock_quantity FROM products WHERE item_id = ?", [id], function(err, res, rows){
			if (res[0].stock_quantity >= qty) {
				let product_name = res[0].product_name;
				let price = res[0].price;
				let newqty = res[0].stock_quantity - parseInt(qty);
				connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [newqty, id], function(err, res, rows){
					if (err) {
						throw err;
					} else {
						let order = new NewOrder(id, product_name, price, qty);
						order.displayOrder();
						continueShopping(order);
					}
				});
			} else {
				console.log("Sorry, there is not enough of that product to fulfill your order.");
				promptAction();
			}
			connection.end(function(err){
				if (err) console.log("Waiting on MySQL connection to close.");
			});
		});
	});
};

function ReturnOrder(order) {
	this.item_id = order.item_id;
	this.product_name = order.product_name;
	this.price = order.price;
	this.qty = (order.qty * -1);
	this.return = true;
	this.displayOrder = function() {
		let table = new consoleTable({
			head: ['Item ID', 'Product', 'Price', 'Qty', 'Order Total'],
			colWidths: [10, 30, 15, 15, 20]
		});
		let orderTotal = (this.price * this.qty) * (-1);
		table.push([this.item_id, this.product_name, '$ ' + this.price.toLocaleString('en', {currency: 'USD', minimumFractionDigits: 2}), this.qty.toLocaleString(), '- $ ' + orderTotal.toLocaleString('en', {currency: 'USD', minimumFractionDigits: 2})]);
		let output = `

	We are sorry these items didn't work out for you.  Your confirmation is below:
		`;
		console.log(output)
		console.log(table.toString() + '\n');
	};
};

const returnProduct = (order) => {
	let connection = createConnection();
	connection.connect(function(err) {
		if (err) throw err;
		let id = order.item_id;
		connection.query("SELECT product_name, price, stock_quantity FROM products WHERE item_id = ?", [id], function(err, res, rows){
			let newqty = res[0].stock_quantity + parseInt(order.qty);
			connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [newqty, id], function(err, res, rows){
				if (err) {
					throw err;
				} else {
					let rOrder = new ReturnOrder(order);
					rOrder.displayOrder();
					continueShopping(rOrder);
				}
				connection.end(function(err){
					if (err) console.log("Waiting on MySQL connection to close.");
				});
			});
		});
	});
};

const promptAction = () => {
	console.log('\n  Place a new order below:\n');
	let action = inquirer.prompt([
		{
			type: 'input',
			name: 'idToBuy',
			message: '    Enter the ID of the product you\'d like to buy:',
			validate: function(input) {
				return itemArray.includes(parseInt(input));
			}
		},
		{
			type: 'input',
			name: 'qtyToBuy',
			message: '    How many of this product would you like to buy:'
		}
	]).then(function(answers){
		purchaseProduct(answers.idToBuy, answers.qtyToBuy);
	});
};

const continueShopping = (recentOrder) => {
	choiceArray = ['\tReturn Your Recent Order', '\tMake a New Order', '\tExit'];
	if (recentOrder.return === true) {
		choiceArray.shift('\tReturn Your Recent Order');
	} else if (!choiceArray.includes('\tReturn Your Recent Order')) {
		choiceArray.unshift('\tReturn Your Recent Order');
	}

	let questions = [{
		type: 'list',
		name: 'toDo',
		message: 'What would you like to do now?',
		choices: choiceArray
	}];

	inquirer.prompt(questions).then(function(answers){
		switch(answers.toDo) {
			case '\tReturn Your Recent Order':
				returnProduct(recentOrder);
				break;
			case '\tMake a New Order':
				displayProducts();
				break;
			case '\tExit':
				console.log(`
Exiting application...

			Thank you for shopping with us!  See you next time.

				`);
		}
	});
};

// Displays products from database.
const displayProducts = () => {
	itemArray = [];
	// Initiate MySQL connection.
	let connection = createConnection();
	connection.connect(function(err) {
		if (err) throw err;
		// Query database for all products, ordered by department then product.
		connection.query('SELECT * FROM products ORDER BY department_name, product_name', function(err, res, rows){
			if (err) {
				console.log('There was an error querying the database.  Please try again.');
			} else {
				// Instantiate consoleTable object with headers/set widths.
				let table = new consoleTable({
					head: ['Item ID', 'Product', 'Department', 'Price', 'Qty In Stock'],
					colWidths: [10, 30, 20, 15, 20]
				});
				// Iterate through results from query, push to consoleTable and itemArray.
				// itemArray is used for validating whether a user has entered a valid item_id on their order.
				for (let i = 0; i < res.length; i++) {
					table.push([res[i].item_id, res[i].product_name, res[i].department_name, '$ ' + res[i].price.toLocaleString('en', {currency: 'USD', minimumFractionDigits: 2}), res[i].stock_quantity.toLocaleString()]);
					itemArray.push(res[i].item_id);
				}
				// Display output to console.
				console.log(`
			***  Welcome to the Bamazon CLI Shopping Application  ***
				`);
				console.log(table.toString());
				// Prompt user for desired action.
				promptAction();
				// Close existing MySQL connection.
				connection.end(function(err){
					if (err) console.log('Waiting on MySQL connection to close.');
				});
			}
		});
	});
};


displayProducts();


