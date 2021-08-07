const mysql = require('mysql2')
require('console.table')
const db = mysql.createConnection('mysql://root:rootroot@localhost:3306/manageEmployee_db')
const { prompt } = require('inquirer')
