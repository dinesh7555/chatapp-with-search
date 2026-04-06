# Disk-Scheduling
## Introduction
### What is Disk-Scheduling?
Disk-scheduling is a process in operating systems that determines the order in which disk requests are processed. It is a critical component of the operating system as it affects the performance and responsiveness of the system.

### Why This Matters for Operating Systems Students
Understanding disk-scheduling is crucial for operating systems students as it directly impacts the overall performance of the system. Disk-scheduling is responsible for managing the access to the disk, which is a critical resource. Poor disk-scheduling can lead to a significant decrease in system performance, causing delays and errors.

## Key Concepts
### FCFS (First-Come-First-Served) Disk-Scheduling
#### Definition
FCFS is a simple and straightforward disk-scheduling algorithm that services disk requests in the order they are received.

#### Example
Suppose a system has three disk requests: R1, R2, and R3, arriving at time 0, 2, and 4 seconds, respectively. If the system uses FCFS, the requests will be serviced in the order they arrived: R1, R2, and R3. This algorithm is simple to implement but has a significant problem: it does not consider the current location of the disk head and the average latency of the disk.

### SCAN (Scanner) Disk-Scheduling
#### Definition
SCAN is a modified version of FCFS that aims to reduce the latency associated with disk requests. It scans the disk from one end to the other, servicing requests along the way.

#### Example
Continuing the example from FCFS, if the system uses SCAN, the disk head starts at the beginning of the disk and moves towards the end of the disk, servicing requests R1, R2, and R3 in that order.

### SSTF (Shortest Seek Time First) Disk-Scheduling
#### Definition
SSTF is an algorithm that prioritizes disk requests based on the seek time required to access each request. It is designed to reduce the average latency of the disk by minimizing seek time.

#### Example
Suppose a system has three disk requests: R1, R2, and R3, with seek times of 10, 5, and 7 seconds, respectively. If the system uses SSTF, the requests will be serviced in the order of R2, R1, and R3, as SSTF prioritizes the request with the shortest seek time.

### C-SCAN (Circular SCAN) Disk-Scheduling
#### Definition
C-SCAN is an improvement over SCAN that wraps around the disk, allowing the disk head to continue scanning from the end of the disk to the beginning, rather than returning to the starting point.

#### Example
Continuing the example from SCAN, if the system uses C-SCAN, the disk head scans the disk from the beginning to the end, servicing requests R1, R2, and R3, and then continues scanning from the end back to the beginning.

## Formulas Reference

$$
\begin{aligned}
T sideways &= \frac{L}{n} \mbox{ (time to move sideways)}
\\
T rotate &= \frac{1}{RPM} \mbox{ (time to rotate the disk once)}
\\
T avg &= \frac{1}{n} (\mbox{average response or service time})
\end{aligned}
$$

Note: These formulas are used to calculate the average response time, average seek time, and average rotation time of the disk. The actual formulas used in disk-scheduling algorithms may vary depending on the specific implementation.