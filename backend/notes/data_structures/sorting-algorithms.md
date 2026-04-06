# Sorting Algorithms
## Introduction
### What is Sorting?
Sorting is a fundamental concept in computer science and data structures, referring to the process of arranging data in a specific order, such as alphabetical, numerical, or categorical. This is crucial for efficient querying, indexing, and data processing in various applications, including databases, file systems, and networks.

### Why This Matters for Data Structures Students
Sorting algorithms are a critical component in many data structures, such as arrays, linked lists, and databases. In data structures, the ability to efficiently sort data structures is essential for searching, retrieving, and maintaining large datasets. Moreover, many data structures rely heavily on sorting algorithms for efficient querying and indexing, making them a vital tool for students of data structures.

## Key Concepts
### Bubble Sort
#### Definition
Bubble sort is a simple, non-comparison, and inefficient sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.

#### Example
Suppose we have an unsorted list: `[5, 1, 3, 2, 4]`. We start by comparing the first two elements, `5` and `1`, and swap them since `1` is smaller than `5`. Then, we compare `1` and `3`, and swap them since `3` is smaller than `1`. We continue this process until the list is sorted: `[1, 2, 3, 4, 5]`.

### Selection Sort
#### Definition
Selection sort is a simple, non-comparison, and inefficient sorting algorithm that repeatedly finds the minimum element in the unsorted part of the list and swaps it with the first element.

#### Example
Suppose we have an unsorted list: `[5, 1, 3, 2, 4]`. We start by finding the minimum element, `1`, and swap it with the first element, `5`. Then, we find the minimum element in the unsorted part of the list, which is `2`, and swap it with the first element, which is now `1`. We continue this process until the list is sorted: `[1, 2, 3, 4, 5]`.

### Insertion Sort
#### Definition
Insertion sort is a simple, comparison-based, and efficient sorting algorithm that builds the final sorted array one element at a time, by comparing each element to the elements that have already been sorted.

#### Example
Suppose we have an unsorted list: `[5, 1, 3, 2, 4]`. We start by comparing the first two elements, `5` and `1`, and since `1` is smaller than `5`, we insert `1` into the sorted part of the list, which is currently empty. Then, we compare `1` and `3`, and since `3` is greater than `1`, we insert `3` into the unsorted part of the list. We continue this process until the list is sorted: `[1, 2, 3, 4, 5]`.

## Formulas Reference
$$\boxed{\mbox{Time complexity of Bubble Sort: } O(n^2)}$$

$$\boxed{\mbox{Time complexity of Selection Sort: } O(n^2)}$$

$$\boxed{\mbox{Time complexity of Insertion Sort: } O(n^2)}$$

Note: These formulas and notes are intended to conform to the highest standards of academic rigor and integrity.