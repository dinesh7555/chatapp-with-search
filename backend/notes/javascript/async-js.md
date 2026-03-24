# Async-JS
## Introduction
### What is Async-JS?
Async-JS refers to the asynchronous programming paradigm in JavaScript, which allows developers to write code that can perform multiple tasks concurrently, improving the responsiveness and scalability of web applications.

### Why This Matters for JavaScript Students
In JavaScript, synchronous code runs sequentially, blocking the execution of subsequent code until it completes. This can lead to performance issues, especially in web applications with high-frequency user interactions. Async-JS enables developers to handle tasks asynchronously, reducing the risk of blocking and improving the overall user experience. Understanding Async-JS is crucial for building efficient, scalable, and user-friendly web applications.

## Key Concepts
### Promise-Based Programming
#### Definition
A promise is a result object that represents the eventual completion or failure of an asynchronous operation. It provides a way for developers to handle asynchronous code in a more readable and manageable way.

#### Example
Suppose you need to make an API request to fetch user data. Instead of using callback functions, you can create a promise that resolves with the user data when the request completes:
```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    fetch('/user-data')
     .then(response => response.json())
     .then(data => resolve(data))
     .catch(error => reject(error));
  });
}
```
### Async-Await
#### Definition
Async-await is a syntax sugar on top of promises, allowing developers to write asynchronous code that looks and feels like synchronous code.

#### Example
You can rewrite the fetchData function using async-await:
```javascript
async function fetchData() {
  try {
    const response = await fetch('/user-data');
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
```
### Callback Functions
#### Definition
Callback functions are a traditional way of handling asynchronous code in JavaScript, where a function is passed as an argument to another function, to be executed when a specific task is completed.

#### Example
Suppose you need to make an API request and handle the response using a callback function:
```javascript
function fetchData(callback) {
  fetch('/user-data')
   .then(response => response.json())
   .then(data => callback(null, data))
   .catch(error => callback(error));
}

fetchData((err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});
```
## Formulas Reference

$\tracker(t) = \frac{1}{\sum_{i=1}^n p_i(t)} \sum_{i=1}^n p_i(t) \cdot \Delta_i(t)$

where:

* $\tracker(t)$ is the average response time
* $p_i(t)$ is the probability of the $i^{th}$ task being completed at time $t$
* $\Delta_i(t)$ is the time it takes to complete the $i^{th}$ task at time $t$
* $n$ is the number of tasks

This formula can be used to calculate the average response time of an async-js application, taking into account the probabilities and completion times of multiple tasks.