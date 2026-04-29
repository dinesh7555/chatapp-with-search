# Interfaces and Abstract Classes
## Introduction
### What are Interfaces and Abstract Classes?
In Java, an interface is a abstract concept that defines a contract, which specifies a set of methods that must be implemented by any class that implements it. An abstract class, on the other hand, is a class that cannot be instantiated and serves as a base class for other classes to inherit from. Both interfaces and abstract classes play a crucial role in achieving abstraction and polymorphism in programming.

### Why This Matters for Java Students
Understanding interfaces and abstract classes is essential for any Java developer, as they provide a way to achieve abstraction, listing the methods that a class must support without providing any implementation. This is especially important in object-oriented programming, where classes and objects are the building blocks of a program. Additionally, interfaces and abstract classes enable developers to create flexible and maintainable code that can be easily extended or modified as needed.

## Key Concepts
### Interfaces
#### Definition
An interface in Java is a purely abstract class that cannot be instantiated. It defines a contract that specifies a set of methods that must be implemented by any class that implements it.

#### Example
Consider a simple interface `Printable` that defines a method `print()`:
```java
public interface Printable {
    void print();
}
```
A class `Document` can implement this interface by providing the implementation for the `print()` method:
```java
public class Document implements Printable {
    @Override
    public void print() {
        System.out.println("Printing a document...");
    }
}
```
### Abstract Classes
#### Definition
An abstract class in Java is a class that cannot be instantiated and serves as a base class for other classes to inherit from. It provides a way to define a common implementation that can be shared among multiple subclasses.

#### Example
Consider an abstract class `Shape` that defines a method `area()`:
```java
public abstract class Shape {
    public abstract double area();
}
```
A class `Circle` can extend this abstract class and provide its own implementation for the `area()` method:
```java
public class Circle extends Shape {
    @Override
    public double area() {
        return Math.PI * Math.pow(getRadius(), 2);
    }
}
```
### Abstract Methods and Method Overriding
#### Definition
Abstract methods are methods that are declared in an abstract class or interface and do not have a body. They must be implemented by any subclass that inherits from the abstract class.

#### Example
Consider an abstract class `Animal` with an abstract method `sound()`:
```java
public abstract class Animal {
    public abstract void sound();
}
```
A class `Dog` can inherit from this abstract class and provide its own implementation for the `sound()` method:
```java
public class Dog extends Animal {
    @Override
    public void sound() {
        System.out.println("Woof!");
    }
}
```
### Multiple Inheritance
#### Definition
Java does not support multiple inheritance of classes, but it does support multiple implementation of interfaces. A class can implement multiple interfaces, but it can inherit from only one class.

#### Example
Consider a class `Vehicle` that implements two interfaces `Flyable` and `Driveable`:
```java
public class Vehicle implements Flyable, Driveable {
    // implementation
}
```
## Formulas Reference
There are no relevant formulas for this topic.