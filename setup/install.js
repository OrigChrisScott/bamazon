
const fs = require('fs');
const execsql = require('execsql');
const mysql = require('mysql');
const inquirer = require('inquirer');

const createConnection = function(port, user, pass, db) {
	let connection = mysql.createConnection({
		host: 'localhost',
		port: port,
		user: user,
		password: pass,
		database: db
	});
	return connection;
};

const dbSetup = function() {
	let userParams = [{
			type: 'input',
			name: 'user',
			message: 'What MySQL username would you like to use to run this program?'
		},
		{
			type: 'input',
			name: 'pass',
			message: 'Please enter the above username\'s MySQL password'
		},
		{
			type: 'input',
			name: 'port',
			message: 'Please enter your MySQL conection port (default: 3306)',
			default: 3306,
			validate: function(input) {
				//RegEx test to check for whole numbers
				let regEx = /^\d+$/;
				return regEx.test(input);
			}
		}];

	inquirer.prompt(userParams).then(function(response){
		let port = response.port;
		let user = response.user;
		let pass = response.pass;
		let writeString = "exports.keys = {port: \'" + port + "\', user: \'" + user + "\', pass: \'" + pass + "\'}";
		fs.writeFileSync('keys.js', writeString, function(err, res){
			if (err) throw err;
		});
		let dbConfig = {
			host: 'localhost',
			user: response.user,
			password: response.pass
		};
		let sqlFile = 'setup/db.sql';
		execsql.config(dbConfig)
			.execFile(sqlFile, function(err, results) {
				if (err) {
					console.log("There was an error with creating the database.  Error: " + err);
				} else {
					let exitMessage = `
						
						Database and Tables successfully created.
						Application ready for use.
						Have fun!

					`;
					console.log(exitMessage);
				}
				execsql.end();
			});
	});
};

dbSetup();
