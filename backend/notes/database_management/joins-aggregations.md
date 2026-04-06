# Joins and Aggregations

## Introduction

### What are Joins and Aggregations?

In database management, joins and aggregations are two fundamental concepts used to manipulate and analyze data within a relational database. A join is a mechanism to combine rows from multiple tables, based on a related column between them, to create a new table with the most relevant data. Aggregations, on the other hand, are used to summarize data by performing operations such as counting, summing, or grouping.

### Why This Matters for Database Management Students

Understanding joins and aggregations is crucial for database management students as it enables them to efficiently extract relevant data from a database, manipulate and transform data, and make informed decisions based on the analysis of data. In real-world scenarios, databases are often schema-less, requiring data analysts and developers to be proficient in joining and aggregating data to extract meaningful insights.

## Key Concepts

### Joining Tables

#### Definition

A join is a SQL operation that combines rows from two or more tables, based on a matching column or set of columns, to create a new table.

#### Example

Suppose we have two tables, `orders` and `customers`, with the following schema:

| orders | customer_id | order_date | total |
| --- | --- | --- | --- |
| 1 | 1 | 2020-01-01 | 100 |
| 2 | 1 | 2020-02-01 | 200 |
| 3 | 2 | 2020-03-01 | 300 |

| customers | customer_id | name | email |
| --- | --- | --- | --- |
| 1 | John Smith | john.smith@example.com |
| 2 | Jane Doe | jane.doe@example.com |

To join these tables, we can use the following SQL query:

```sql
SELECT *
FROM orders
JOIN customers
ON orders.customer_id = customers.customer_id;
```

This query combines rows from the `orders` and `customers` tables where the `customer_id` column matches.

### Aggregating Data

#### Definition

An aggregate function is a function that takes in one or more input values and returns a single output value, such as the sum, average, or count of the input values.

#### Example

Suppose we want to calculate the total sales for each region. We can use the `GROUP BY` clause and aggregate function to achieve this. For example:

```sql
SELECT region, SUM(total) AS total_sales
FROM orders
GROUP BY region;
```

This query groups the `orders` table by the `region` column and calculates the total sales for each region using the `SUM` aggregate function.

### Filtering and Sorting

#### Definition

Filters and sorting are used to refine and organize the data after joining and aggregating. Filters restrict the output to specific rows that meet certain conditions, while sorting rearranges the rows based on a specific column or set of columns.

#### Example

Suppose we want to find the top 3 highest-selling regions. We can use the following SQL query:

```sql
SELECT region, SUM(total) AS total_sales
FROM orders
GROUP BY region
ORDER BY total_sales DESC
LIMIT 3;
```

This query groups the `orders` table by the `region` column, calculates the total sales for each region, and then sorts the results in descending order. Finally, it limits the output to the top 3 results.