# Trees-Graphs
## Introduction
### What are Trees-Graphs?
In the context of data structures, trees and graphs are fundamental concepts used to model relationships between nodes or vertices. Trees are a special type of graph that satisfy certain properties, such as being connected, having no cycles, and having a unique root node.

### Why This Matters for data_structures Students
Trees and graphs are crucial in computer science, as they provide a way to represent complex relationships between data entities. Understanding trees and graphs is essential for computer programmers, database designers, and data analysts, as they are used in various applications such as file structures, social networks, and database indexing. Studying trees and graphs helps data structures students develop problem-solving skills, and grasping the underlying concepts is vital for building efficient algorithms and data storage systems.

## Key Concepts
### Tree Definition
A tree is a connected graph with no cycles, i.e., a graph that has only one path between any two nodes or vertices. In a tree, each node has at most two children, and each node except the root node has exactly one parent.

### Graph Definition
A graph is a non-linear data structure consisting of nodes or vertices connected by edges. A graph can be either directed (edges have direction) or undirected (edges do not have direction).

### Traversal Techniques
There are several traversal techniques used to traverse trees and graphs, including:
#### Breadth-First Traversal (BFT)
 traversal involves visiting all the nodes at the current level before moving to the next level.
#### Depth-First Traversal (DFT)
traversal involves visiting a node and then traversing as far as possible along each of its edges before backtracking.

## Formulas Reference
$$
t(n) = O(n^d)
$$

*   Where $t(n)$ is the time complexity, $n$ is the number of nodes, and $d$ is the depth of the tree.
$$
s(n) = O(n)
$$

*   Where $s(n)$ is the space complexity, $n$ is the number of nodes, and $d$ is the depth of the tree.

Note: These formulas are specific to tree traversal and are used to estimate time and space complexity.