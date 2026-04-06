# Transactions
## Introduction
### What is a Transaction?
A transaction is a sequence of operations that are executed as a single, all-or-nothing unit of work. This means that either all operations in the transaction are completed successfully, or none of them are. Transactions ensure that database consistency is maintained by either committing changes or rolling back to a previous state.

### Why This Matters for Database Management Students
Understanding transactions is crucial for ensuring data integrity, reliability, and scalability in database systems. Transactions provide a way to manage concurrent access to shared data, resolve conflicts, and undo changes that have been made in error. In real-world applications, transactions are essential for ensuring that financial transactions are processed correctly, data is backed up reliably, and concurrent updates to shared data are handled correctly.

## Key Concepts
### Atomicity
#### Definition
Atomicity is the property of a transaction that ensures that either all or none of the operations execute. If an error occurs during the execution of a transaction, the database will roll back to its previous state, ensuring that the transaction has no partial effects.

#### Example
Suppose a banking system attempts to transfer $100 from account A to account B. The transaction consists of two operations: (1) deduct $100 from account A and (2) add $100 to account B. If the second operation fails (e.g., due to insufficient funds), the transaction will be rolled back, and the money will be restored to account A. This ensures that the balance of either account is not affected, and the transaction is retried.

### Consistency
#### Definition
Consistency is the property of a transaction that ensures that the transaction leaves the database in a valid state. This means that the transaction must preserve the database's invariant properties, such as referential integrity, primary key constraints, and other business rules.

#### Example
A transaction updates a customer's address by changing their phone number. The transaction must ensure that the updated phone number is valid and does not violate any business rules (e.g., the phone number is not already associated with another customer). If the transaction fails to update the phone number due to invalid input, the transaction will be rolled back, and the customer's original phone number will be restored.

### Isolation
#### Definition
Isolation is the property of a transaction that ensures that its operations are executed independently of other transactions. This means that a transaction will not see the effects of other transactions until they have been committed.

#### Example
Suppose two transactions, T1 and T2, update the same row in a table simultaneously. T1 updates the row with a new value, and T2 updates it with a different value. If the two transactions are executed without isolation, T2 may see the old value before it has been committed, resulting in inconsistent data. With isolation, each transaction will see the original value, ensuring that the updates are executed independently and consistently.

### Durability
#### Definition
Durability is the property of a transaction that ensures that its effects are permanent and persistent, even in the event of a system failure. This means that once a transaction has been committed, its effects will not be lost, even if the system crashes or is shut down.

#### Example
A transaction updates a customer's order status to "delivered". The transaction will be written to a journal or log file, and the changes will be persisted to the database even if the system crashes immediately after. When the system restarts, the transaction will be re-executed, ensuring that the customer's order status is updated correctly and remains consistent.

## Formulas Reference

$$\text{Atomicity} = \begin{cases} 
0 & \text{if transaction fails} \\
1 & \text{if transaction succeeds} 
\end{cases}$$