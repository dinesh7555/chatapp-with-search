# Normalization
## Introduction
### What is Normalization?
Normalization is a systematic approach to organizing the structure of a relational database to minimize data redundancy and dependency. It ensures that each piece of data is stored in one place and one place only, making it easier to maintain and modify the database.

### Why This Matters for Database Management Students
Normalization is crucial in database design as it helps maintain data consistency, reduce data inconsistencies, and improve data integrity. It also enables efficient querying, reduces data duplication, and improves overall database performance. Proper normalization is essential for creating reliable and scalable databases that can handle large amounts of data and complex queries.

## Key Concepts
### First Normal Form (1NF)
#### Definition
A table is in 1NF if and only if the table has only a single table attribute or composite attribute (made up of atomic values).

#### Example
Consider a table called "Students" with attributes "Student Name" and "Mark" where "Student Name" is a column with variable-length strings (e.g., John, Jane, etc.). The table is not in 1NF because "Student Name" is a composite attribute. To achieve 1NF, we can create a separate table called "Student Names" with attributes "Student ID" and "Name".

### Second Normal Form (2NF)
#### Definition
A table is in 2NF if and only if it is in 1NF and all non-key attributes are fully functional dependencies on the primary key.

#### Example
Imagine a "Course" table with attributes "Course ID", "Course Name", "Semester", and "Credit". The table is not in 2NF because "Semester" and "Credit" are not fully functional dependencies on the primary key "Course ID". To normalize the table, we can create a separate table called "Course Details" with attributes "Course ID", "Semester", and "Credit".

### Third Normal Form (3NF)
#### Definition
A table is in 3NF if and only if it is in 2NF and there are no transitive dependencies.

#### Example
Consider a "Department" table with attributes "Department ID", "Department Name", and "Faculty ID". The table is not in 3NF because "Faculty ID" is a foreign key referencing the "Faculty" table, which creates a transitive dependency. To normalize the table, we can create a separate table called "Department Faculty" with attributes "Department ID", "Faculty ID", and "Start Date".

## Formulas Reference
$$\text{Normalization rules:}$$
* 1NF: Each table cell contains a single value.
* 2NF: Partial dependencies are eliminated.
* 3NF: Transitive dependencies are eliminated.

These notes provide a comprehensive introduction to normalization in database management, highlighting its importance, definition, and application. Key concepts such as 1NF, 2NF, and 3NF are explained with concrete examples, illustrating how to identify and resolve data redundancy and dependency issues.