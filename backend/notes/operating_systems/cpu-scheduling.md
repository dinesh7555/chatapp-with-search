# CPU Scheduling
## Introduction
### What is CPU Scheduling?
CPU scheduling, also known as program scheduling or task scheduling, is a fundamental process in operating systems (OS) responsible for allocating the Central Processing Unit (CPU) to the processes or threads that are waiting to be executed. In other words, CPU scheduling determines which process should run next, and for how long, to ensure efficient CPU utilization and fair resource allocation.

### Why This Matters for Operating Systems Students
Understanding CPU scheduling is crucial for operating systems students as it directly affects system performance, responsiveness, and overall user experience. A well-designed CPU scheduling algorithm can significantly improve system efficiency, reduce latency, and prevent deadlocks or starvation. Moreover, knowledge of CPU scheduling is vital for programming operating systems, as it requires a deep understanding of process management, resource allocation, and efficient use of system resources.

## Key Concepts
### Scheduling Algorithms
#### Definition
Scheduling algorithms are the heart of CPU scheduling, determining how to allocate the CPU to processes. There are various algorithms, each with its pros and cons, designed to optimize specific performance metrics, such as CPU utilization, throughput, and turnaround time.

#### Example
For instance, the Round-Robin (RR) scheduling algorithm assigns a fixed time slice (called the time quantum) to each process. When the time quantum expires, the process is preempted and another process is scheduled. This approach ensures fairness among processes, preventing one process from monopolizing the CPU. However, it may lead to context switching overhead and increased CPU utilization.

### Process States
#### Definition
Processes can be in one of three primary states: Running, Ready, and Blocked.

#### Example
A process in the Running state is currently executing on the CPU, whereas a process in the Ready state is waiting for its turn to execute. A process in the Blocked state is waiting for an event, such as I/O completion, to proceed.

## Formulas Reference
$$\text{Turnaround Time (TAT)} = \text{(Completion Time - Arrival Time)}$$

$$\text{Response Time (RT)} = \text{Time from arrival to first response}$$

$$\text{Throughput (TP)} = \frac{\text{Number of Processes Completed}}{\text{Total Time}}$$

Note: These formulas aim to quantify the performance of various CPU scheduling algorithms and are crucial for understanding the trade-offs between different scheduling strategies.