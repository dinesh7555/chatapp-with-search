# Linked-Lists
## Introduction
### What are Linked-Lists?
A linked-list is a linear collection of data elements whose order is not given by their physical placement in memory. Instead, each element points to the next. It is a data structure consisting of a group of nodes which together represent a sequence.

### Why This Matters for data_structures Students
Understanding linked-lists is crucial for data_structures students as they are used extensively in many real-world applications such as databases, web browsers, and file systems. They are used to implement dynamic memory allocation and can be efficiently used for inserting and deleting elements from the list.

## Key Concepts
### Node
#### Definition
A node is the basic unit of a linked-list, consisting of a value and a reference (i.e., a "link") to the next node in the sequence.

#### Example
Consider a linked-list of integers, where each node contains an integer value and a reference to the next node in the list. The node 3 would contain the value 3 and a reference to the node containing the value 5. This allows for efficient insertion and deletion of nodes at any position in the list.

### Linked-List Types
#### Definition
There are two main types of linked-lists: singly-linked and doubly-linked.

#### Example
A singly-linked list only allows traversal in one direction (from the head to the tail), whereas a doubly-linked list allows traversal in both directions (from the head to the tail and from the tail to the head).

### Linked-List Operations
#### Definition
Some common operations performed on linked-lists include adding a new node, removing a node, and traversing the list.

#### Example
To add a new node, you would create a new node and append it to the end of the list. To remove a node, you would find the node to be removed and adjust the references of the adjacent nodes. To traverse the list, you would start at the head node and follow the references of each node until you reach the tail node.

## Formulas Reference
No formulas are generally used for linked-lists, as they are typically manipulated through node references and traversal algorithms.