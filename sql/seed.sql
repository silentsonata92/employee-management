USE manageEmployee_db

INSERT INTO department(title)
VALUES ('Marketing'),
('Engineering'),
('Finance'),
('Sales'),

INSERT INTO role (title, salary, department_id)
VALUES ('Marketing Leader','80000', 1),
('Marketing Assistant','50000', 1),
('Engineering Leader','120000', 2),
('Engineering Assistant','70000', 2),
('Finance Leader','100000', 3),
('Finance Assistant','60000', 3),
('Sales Leader','110000', 4),
('Sales Assistant','30000', 4),

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('Joon','Ahn', 2, 1),
('Mike','Kim', 2, 1),
('Jake', 'Long', 5, 3),
('Kevin','Park', 4, null),
('Heather','Song', 5, 3),
('Dia','Lee', 2, 1),
('Jim', 'Woo', 7, null),
('Tim','Yang', 6, 8)