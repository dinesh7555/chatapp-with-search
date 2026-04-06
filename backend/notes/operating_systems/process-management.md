# Process Management
## Introduction
### What is Process Management?
Process management is the mechanism by which an operating system schedules and manages the execution of processes, ensuring efficient use of system resources and maximizing system performance.

### Why This Matters for Operating Systems Students
Understanding process management is crucial for operating systems students as it enables them to design and implement efficient process scheduling algorithms, allocate system resources effectively, and develop operating systems that can handle a large number of concurrent processes and threads.

## Key Concepts
### Process Scheduling
#### Definition
Process scheduling is the algorithm used by the operating system to decide which process should be executed next, given a set of processes in the ready queue.

#### Example
Suppose a system has three processes: P1, P2, and P3. The ready queue contains these processes in the order P1, P2, P3. The process scheduling algorithm is Round Robin (RR) with a time quantum of 2 time units. The current time is 0 time units. The operating system will execute P1 for 2 time units, then context switch to P2, execute it for 2 time units, and finally context switch to P3. This process continues until all processes have been executed.

### Context Switching
#### Definition
Context switching is the process of saving the current state of a process and restoring the state of the previously running process.

#### Example
Suppose P1 is currently executing and its state includes the current program counter, registers, and memory pointers. The operating system needs to switch to P2. The operating system would save P1's state, including the program counter, registers, and memory pointers, and restore P2's state, bringing P2 out of the idle state.

### Process States
#### Definition
A process can be in one of several states, including Newborn, Running, Waiting, Sleeping, and Zombie.

#### Example
Suppose a process P1 is in the Newborn state and is about to start executing. The operating system would allocate resources for P1, bring it into memory, and initialize its state. Once P1 has allocated all its resources, it transitions to the Running state and begins executing.

### Synchronization
#### Definition
Synchronization is the mechanism used to coordinate the actions of multiple processes, ensuring that they access shared resources correctly and avoiding conflicts.

#### Example
Suppose two processes, P1 and P2, need to access a shared resource, a file. A semaphore is used to synchronize access to the file. When P1 wants to access the file, it decrements the semaphore value, checks if it is greater than 0, and if so, accesses the file. When P1 finishes accessing the file, it increments the semaphore value. P2 follows a similar procedure.

## Formulas Reference
$$W(S) = \frac{\sum_{i=1}^{n} (T_i - T_i^o)}{\sum_{i=1}^{n} T_i}$$
where W(S) is the average waiting time, T_i is the arrival time of process i, and T_i^o is the completion time of process i.

$$T(S) = \frac{\sum_{i=1}^{n} T_i}{n}$$
where T(S) is the average service time and n is the number of processes.