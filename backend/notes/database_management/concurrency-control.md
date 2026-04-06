# Concurrency Control
## Introduction
### What is Concurrency Control?
Concurrency control is the mechanism used by a database management system (DBMS) to manage multiple users or transactions accessing and modifying the same data simultaneously. It ensures that the consistency and integrity of the database are maintained even when multiple users are accessing and modifying the data simultaneously.

### Why This Matters for Database Management Students
Concurrency control is essential for ensuring the accuracy and reliability of database systems. As the number of users and transactions increases, the chances of data inconsistencies and conflicts also increase. Without concurrency control, it is possible for multiple transactions to access and modify the same data at the same time, leading to data inconsistencies and anomalies.

## Key Concepts
### Locking Mechanisms
#### Definition
Locking is a concurrency control mechanism that involves acquiring a lock on a resource (such as a row or a table) to prevent other transactions from accessing or modifying it until the transaction is completed.

#### Example
For example, suppose two transactions, T1 and T2, need to access and update the same row in a table. Transaction T1 locks the row and starts to update it, and then transaction T2 tries to access the same row to update it. The DBMS will detect that the row is already locked by T1 and will wait until T1 releases the lock before allowing T2 to access the row.

### Time-Stamping Mechanism
#### Definition
The time-stamping mechanism is a concurrency control mechanism that assigns a unique timestamp to each transaction. The DBMS uses the timestamp to determine the ordering of transactions.

#### Example
For example, suppose two transactions T1 and T2 are executed and their timestamps are 10 and 11, respectively. If T1 and T2 both try to update the same row, the DBMS will apply the updates in the order of their timestamps. The changes made by T1 with timestamp 10 will be applied first, and then the changes made by T2 with timestamp 11 will be applied.

### Optimistic Concurrency Control
#### Definition
Optimistic concurrency control is a concurrency control mechanism that assumes that most transactions will not conflict with each other. It uses version numbers to track changes made to the data and aborts the transaction if it detects a conflict.

#### Example
For example, suppose two transactions T1 and T2 need to update the same row. The DBMS assigns a version number to the row before T1 updates it. If T2 tries to update the same row without checking its version number, the DBMS will detect the conflict and abort T2's transaction.