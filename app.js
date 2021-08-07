const mysql = require('mysql2')
require('console.table')
const db = mysql.createConnection('mysql://root:rootroot@localhost:3306/manageEmployee_db')
const inquirer = require('inquirer')

const contAgain = _ => {
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'cont',
      message: 'Would you like to continue?'
    }
  ])
    .then(({ cont }) => {
      if (cont) {
        ask()
      } else {
        process.exit()
      }
    })
    .catch(err => console.log(err))
}

async function getEmployees() {
  const response = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM employee', (err, employee) => {
      if (err) {
        reject(err)
      }
      resolve(employee)
    })
  })
  return response
}

async function getRoles() {
  const response = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM role', (err, role) => {
      if (err) {
        reject(err)
      }
      resolve(role)
    })
  })
  return response
}

async function getDepartment() {
  const response = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM department', (err, department) => {
      if (err) {
        reject(err)
      }
      resolve(department)
    })
  })
  return response
}

const view = _ => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      choices: ['All Employees', 'All Roles', 'All Departments', 'Employees By Department', 'Employees by Manager', 'Budget', 'Go Back'],
      message: 'What would you like to view?'
    }
  ])
    .then(({ action }) => {
      switch (action) {
        case 'All Employees':
          allEmployees()
          break
        case 'All Roles':
          db.query('SELECT * FROM role', (err, roles) => {
            if (err) {
              console.log(err)
            }
            console.table(roles)
            contAgain()
          })
          break
        case 'All Departments':
          db.query('SELECT * FROM department', (err, dpts) => {
            if (err) {
              console.log(err)
            }
            console.table(dpts)
            contAgain()
          })
          break
        case 'Employees By Department':
          viewByDepartment()
          break
        case 'Employees by Manager':
          viewByManager()
          break
        case 'Budget':
          calculateBudget()
          break
        case 'Go Back':
          ask()
          break
        default:
          console.log('error in view switch.')
          break
      }
    })
    .catch(err => console.log(err))
}

const allEmployees = _ => {
  db.query(`
    SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS name, role.title, role.salary, department.title AS department, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employee
    LEFT JOIN role
    ON employee.role_id = role.id
    LEFT JOIN department
    ON role.department_id = department.id
    LEFT JOIN employee manager
    ON manager.id = employee.manager_id;
    `, (err, employee) => {
    if (err) {
      console.log(err)
    }
    console.table(employee)
    contAgain()
  })
}

const viewByDepartment = _ => {
  db.query(`
    SELECT department.title AS department, CONCAT(employee.first_name, ' ', employee.last_name) AS name
    FROM department
    LEFT JOIN role
    ON department.id = role.department_id
    RIGHT JOIN employee
    ON role.id = employee.role_id
    `, (err, employee) => {
    if (err) {
      console.log(err)
    }
    console.table(employee)
    contAgain()
  })
}

const viewByManager = _ => {
  db.query(`
  SELECT CONCAT(manager.first_name, ' ', manager.last_name) AS manager, CONCAT(employee.first_name, ' ', employee.last_name) AS name
  FROM employee manager
  INNER JOIN employee
  on manager.id = employee.manager_id
  `, (err, managers) => {
    if (err) {
      console.log(err)
    }
    console.table(managers)
    contAgain()
  })
}

const calculateBudget = _ => {
  getDepartment()
    .then((departments) => {
      const dptArray = departments.map((department) => ({
        name: department.title,
        value: department.id
      }))
      inquirer.prompt([
        {
          type: 'list',
          name: 'id',
          choices: dptArray,
          message: 'Which department would you like to see the budget of?'
        }
      ])
        .then(({ id }) => {
          db.query(`
            SELECT department.title AS department, CONCAT(employee.first_name, ' ', employee.last_name) AS name, role.salary
            FROM employee
            LEFT JOIN role
            ON role.id = employee.role_id
            INNER JOIN department
            ON department.id = role.department_id
            WHERE department.id = ${id}
          `, (err, salaries) => {
            if (err) {
              console.log(err)
            }
            if (salaries === []) {
              console.log('Selected department has no employees and the budget is $0')
              contAgain()
            } else {
              let sum = 0
              salaries.forEach((person) => {
                sum += parseInt(person.salary)
              })
              console.log(`The total budget of the ${salaries[0].department} department is $${sum}.\n`)
              contAgain()
            }
          })
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const add = _ => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      choices: ['Add Employee', 'Add Role', 'Add Department', 'Go Back'],
      mesasge: 'What would you like to add?'
    }
  ])
    .then(({ choice }) => {
      switch (choice) {
        case 'Add Employee':
          addEmployee()
          break
        case 'Add Role':
          addRole()
          break
        case 'Add Department':
          addDepartment()
          break
        default:
          ask()
          break
      }
    })
    .catch(err => console.log(err))
}

const addDepartment = _ => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of the new department?'
    }
  ])
    .then((answer) => {
      db.query('INSERT INTO department SET ?', answer, err => {
        if (err) {
          console.log(err)
        }
        console.log('Department added!')
      })
    })
  contAgain()
}

const addRole = _ => {
  getDepartment()
    .then((departments) => {
      const dptArray = departments.map((department) => ({
        name: department.title,
        value: department.id
      }))
      inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'What is the title of the new role?'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'What is the salary of the new role?'
        },
        {
          type: 'list',
          name: 'department_id',
          choices: dptArray,
          message: 'What department does the new role belong to?'
        }
      ])
        .then((answer) => {
          db.query('INSERT INTO role SET ?', answer, err => {
            if (err) { console.log(err) }
          })
          contAgain()
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const addEmployee = _ => {
  getEmployees()
    .then((managers) => {
      const managersArray = managers.map((manager) => ({
        name: `${manager.first_name} ${manager.last_name}`,
        value: manager.id
      }))
      managersArray.push({
        name: 'No Manager',
        value: null
      })
      getRoles()
        .then((roles) => {
          const rolesArray = roles.map((role) => ({
            name: role.title,
            value: role.id
          }))

          inquirer.prompt([
            {
              type: 'input',
              name: 'first_name',
              message: 'What is the new employee\'s first name?'
            },
            {
              type: 'input',
              name: 'last_name',
              message: 'What is the new employee\'s last name?'
            },
            {
              type: 'list',
              name: 'role_id',
              choices: rolesArray,
              message: 'What is the new employee\'s role?'
            },
            {
              type: 'list',
              name: 'manager_id',
              choices: managersArray,
              message: 'Who is the new employee\'s manager?'
            }
          ])
            .then((answer) => {
              // add into employee db now
              db.query('INSERT INTO employee SET ?', answer, err => {
                if (err) {
                  console.log(err)
                }
                console.log('Employee added!')
                contAgain()
              })
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const remove = _ => {
  getEmployees()
    .then((employees) => {
      const employeesArray = employees.map((employee) => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
      }))
      employeesArray.push({
        name: 'Go back <-',
        value: null
      })
      inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          choices: employeesArray,
          message: 'Which employee would you like to delete?'
        }
      ])
        .then(({ choice }) => {
          if (choice === null) {
            ask()
          } else {
            const condition = {
              id: choice
            }
            db.query('DELETE FROM employee WHERE ?', condition, err => {
              if (err) {
                console.log(err)
              }
              console.log('Employee deleted')
              contAgain()
            })
          }
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const update = _ => {
  getEmployees()
    .then(employees => {
      inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          choices: employees.map(employee => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id
          })),
          message: 'Who would you like to update?'
        },
        {
          type: 'list',
          name: 'updateType',
          choices: ["Employee's Role", "Employee's Manager"],
          message: 'What would you like to update?'
        }
      ])
        .then((answer) => {
          switch (answer.updateType) {
            case "Employee's Role":
              updateRole(answer)
              break
            case "Employee's Manager":
              updateManager(answer)
              break
            default:
              console.log('Error')
              break
          }
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const updateRole = answer => {
  getRoles()
    .then((roles) => {
      inquirer.prompt([
        {
          type: 'list',
          name: 'newRole',
          choices: roles.map((role) => ({
            name: role.title,
            value: role.id
          })),
          message: 'What role would you like to give the employee?'
        }
      ])
        .then(({ newRole }) => {
          const condition = [
            {
              role_id: newRole
            },
            {
              id: answer.choice
            }
          ]
          db.query('UPDATE employee SET ? WHERE ?', condition, err => {
            if (err) {
              console.log(err)
            }
            console.log('updated!')
            contAgain()
          })
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const updateManager = answer => {
  getEmployees()
    .then((managers) => {
      const managersArray = managers.map((manager) => ({
        name: manager.first_name + ' ' + manager.last_name,
        value: manager.id
      }))
      managersArray.push(({
        name: 'No Manager',
        value: null
      }))
      inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          choices: managersArray,
          message: 'Select a manager.'
        }
      ])
        .then(({ choice }) => {
          const condition = [
            {
              manager_id: choice
            },
            {
              id: answer.choice
            }
          ]
          db.query('UPDATE employee SET ? WHERE ?', condition, err => {
            if (err) {
              console.log(err)
            }
            console.log('updated!')
            contAgain()
          })
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

const ask = _ => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      choices: ['View', 'Add', 'Remove', 'Update Employee']
    }
  ])
    .then(({ action }) => {
      switch (action) {
        case 'View':
          view()
          break
        case 'Add':
          add()
          break
        case 'Remove':
          remove()
          break
        case 'Update Employee':
          update()
          break
        default:
          console.log('error')
          break
      }
    })
    .catch(err => console.log(err))
}

ask()