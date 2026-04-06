# Paging
## Introduction
### What is Paging?
Paging is a memory-management technique used by operating systems to handle memory allocation and deallocation. It involves dividing the main memory into equally sized blocks called frames, and providing each process with a unique set of frames that it can use for storage.

### Why This Matters for operating_systems Students
Paging is a crucial concept in operating systems as it allows for efficient memory management, enabling multiple processes to share the main memory while ensuring each process has a dedicated and secure space. This technique is particularly important in modern computing systems where multiple processes and applications are running simultaneously, requiring a reliable and scalable approach to memory allocation.

## Key Concepts
### Frame Allocation
#### Definition
Frame allocation is the process of assigning frames from the main memory to a process.

#### Example
For example, if the main memory is divided into 8 frames of 1KB each, and a process requires 2 frames for its execution, the operating system will allocate 2 frames from the main memory to the process, ensuring that the process has the necessary space to execute.

### Page Replacement Algorithms
#### Definition
Page replacement algorithms are used to manage the allocation of frames to processes. These algorithms determine which frames to allocate and deallocate when a process is switched out, ensuring efficient use of the available memory.

#### Example
Consider a simple page replacement algorithm like the "First-In-First-Out" (FIFO) algorithm. When a new process is switched in, the oldest frame in the memory that is not being used is deallocated, and a new frame is allocated to the new process.

### Major Page Replacement Algorithms
#### Definition
There are several page replacement algorithms in use, each with its strengths and weaknesses.

#### Example
Some popular page replacement algorithms include:

* **FIFO (First-In-First-Out)**: allocates frames based on the order they were used, with the oldest frames being deallocated first.
* **LRU (Least Recently Used)**: allocates frames based on how recently they were used, with the frames that were used least recently being deallocated first.
* **Optimal**: allocates frames in such a way that the total number of page faults is minimized in the long run.

## Formulas Reference
$$PageFaults = \sum_{1 \le i \le n} \left(B_\pi(n, i) + H_\pi(n, i) \right)$$
where $\pi$ is the process, $n$ is the total number of frames, $B_\pi(n, i)$ represents the busy slots in the process $i$'s frame, and $H_\pi(n, i)$ represents the hazard rate of the process $i$'s frame.