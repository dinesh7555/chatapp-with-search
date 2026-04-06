# Memory-Management
## Introduction
### What is Memory-Management?
Memory-management refers to the process by which an operating system allocates and deallocates memory units to and from running programs, ensuring efficient and safe use of system resources.

### Why This Matters for Operating Systems Students
Effective memory management is crucial in modern computing systems, where multiple programs may run concurrently, competing for limited memory resources. Operating systems must dynamically allocate and deallocate memory to prevent memory allocation failures, memory leakage, and crashes. Understanding memory-management is essential for designing and implementing efficient and reliable operating systems.

## Key Concepts
### Memory Allocation
#### Definition
Memory allocation is the process of assigning a chunk of memory to a program or process for storing data, instructions, or other information.

#### Example
Imagine a memory management system as a shopkeeper allocating racks to customers. Each customer (program) requests a specific size of storage space (memory allocation), and the shopkeeper (memory manager) allocates the corresponding number of racks. When a customer no longer needs the storage space, the shopkeeper deallocates the allocated racks, freeing them up for future use.

### Memory Deallocation
#### Definition
Memory deallocation is the process of releasing previously allocated memory back to the system, making it available for future use.

#### Example
Continuing the shopkeeper analogy, when a customer no longer needs a rack, the shopkeeper removes the rack, making it available for another customer. Similarly, when a program no longer needs a memory allocation, the memory manager deallocates the memory, making it available for reuse.

### Memory Fragmentation
#### Definition
Memory fragmentation occurs when the memory space is broken into small, non-contiguous blocks, making it difficult to find a large, contiguous block of memory.

#### Example
Imagine a set of misaligned puzzle pieces. Despite having plenty of individual pieces, it becomes challenging to find a complete, contiguous puzzle. Similarly, when memory is fragmented, it becomes difficult for the memory manager to allocate large blocks of memory, leading to inefficiencies and potential crashes.

### Page Replacement Algorithms
#### Definition
Page replacement algorithms decide which page of memory to replace when the number of pages exceeds the available memory, ensuring efficient use of system resources.

#### Example
Suppose a program requests a new page of memory, but the system is already running low on memory pages. A page replacement algorithm like First-In-First-Out (FIFO) or Optimal (OPT) assesses which page is least recently used or has the best chance of being replaced, and removes that page from memory. This makes room for the new page and ensures the system's overall efficiency.

## Formulas Reference
$$Memory\_Efficiency = \frac{(Total\_Allocated\_Memory - Total\_Wasted\_Memory)}{Total\_Physical\_Memory}$$

$$Page\_Hit\_Ratio = \frac{Number\_of\_Pages\_Accessed\_and\_Found\_in\_Memory}{Total\_Number\_of\_Page\_Accesses}$$