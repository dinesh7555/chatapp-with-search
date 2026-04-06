# SQL Queries
## Introduction
### What are SQL Queries?
A SQL query is a request to a Database Management System (DBMS) to retrieve or manipulate data stored in a database. SQL queries use a specific syntax to request data from one or more database tables.

### Why This Matters for Database Management Students
SQL queries are the building blocks of database management. They enable users to manage and interact with data stored in a database, making them an essential aspect of database management.

## Key Concepts

### Basic Query Syntax
#### Definition
The basic syntax of a SQL query consists of a SELECT statement, clauses to specify the data to retrieve, and optional clauses to filter, sort, or manipulate the data.

#### Example
Consider a simple query to retrieve the names and addresses of customers from a customers table:
```sql
SELECT name, address
FROM customers
```
This query specifies that the database should retrieve the name and address columns from the customers table.

### Query Clauses
#### SELECT Clause
The SELECT clause defines the columns or expressions to include in the output of the query. Multiple columns are separated by commas.
```sql
SELECT name, email, phone
FROM customers
```
#### WHERE Clause
The WHERE clause is used to filter the data. It specifies conditions that the data must meet to be included in the output.
```sql
SELECT *
FROM customers
WHERE country='USA'
```
This query retrieves all columns from the customers table where the country is 'USA'.

#### JOIN Clause
The JOIN clause is used to combine data from two or more tables based on a common column.
```sql
SELECT orders.order_id, customers.name
FROM orders
JOIN customers
ON orders.customer_id=customers.customer_id
```
This query retrieves the order ID and name of customers from the orders and customers tables, respectively, based on the customer_id column.

### Advanced Query Concepts

#### Subqueries
A subquery is a query nested inside another query. It is used to perform complex operations on the data.
```sql
SELECT *
FROM orders
WHERE order_total > (
  SELECT AVG(order_total)
  FROM orders
)
```
This query retrieves all orders with a total amount greater than the average order total.

#### Grouping and Aggregates
Grouping and aggregates are used to summarize and analyze data. Common aggregate functions include SUM, AVG, MAX, MIN, and COUNT.
```sql
SELECT product_name, SUM(quantity) as total_quantity
FROM orders
GROUP BY product_name
```
This query retrieves the product name and total quantity for each product in the orders table.

## Formulas Reference

$$
\begin{align}
\text{Query Plan} &= \text{SELECT Clause} + \text{FROM Clause} + \text{WHERE Clause} + \text{ORDER BY Clause} \\
\text{JOIN Types} &= \text{INNER JOIN}, \text{LEFT JOIN}, \text{RIGHT JOIN}, \text{FULL OUTER JOIN} \\
\text{Subquery Syntax} &= \text{SELECT statement} + \text{FROM clause} + \text{WHERE clause} + \text{GROUP BY clause}
\end{align}
$$