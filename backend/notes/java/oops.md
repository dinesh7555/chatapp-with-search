# OOPS (Object-Oriented Programming System) in Java
## Introduction
### What is OOP?
Object-Oriented Programming (OOP) is a programming paradigm that revolves around the concept of "objects" which have properties (data) and methods (functions) that operate on that data. OOP is a design approach that aims to mimic real-world entities and systems to create more organized, modular, and maintainable code.

### Why This Matters for Java Students
Understanding OOP is crucial for Java students as it's a fundamental concept that allows for the development of complex and maintainable software systems. OOP enables students to write efficient, scalable, and reusable code, ultimately aiding in the creation of robust Java applications.

## Key Concepts
### Inheritance
#### Definition
Inheritance is a mechanism in OOP that allows one class to inherit the properties and methods of another class.

#### Example
Consider a scenario where we have a parent class called `Vehicle` and a child class called `Car`. The `Car` class inherits the properties of `Vehicle`, such as `color` and `maxSpeed`, and adds its own specific properties like `numDoors`.

```java
public class Vehicle {
    private String color;
    private int maxSpeed;

    public Vehicle(String color, int maxSpeed) {
        this.color = color;
        this.maxSpeed = maxSpeed;
    }

    public String getColor() {
        return color;
    }

    public int getMaxSpeed() {
        return maxSpeed;
    }
}

public class Car extends Vehicle {
    private int numDoors;

    public Car(String color, int maxSpeed, int numDoors) {
        super(color, maxSpeed);
        this.numDoors = numDoors;
    }

    public int getNumDoors() {
        return numDoors;
    }
}
```

### Polymorphism
#### Definition
Polymorphism is the ability of an object to take on multiple forms, depending on the context in which it is used.

#### Example
Consider a `Shape` class with methods `draw()` and `area()`. We can create subclasses like `Circle`, `Rectangle`, and `Triangle` that override the `draw()` method to perform different actions, while the `area()` method remains the same.

```java
public abstract class Shape {
    public abstract void draw();
    public abstract double area();
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a circle with radius " + radius);
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private double width;
    private double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a rectangle with width " + width + " and height " + height);
    }

    @Override
    public double area() {
        return width * height;
    }
}
```

### Encapsulation
#### Definition
Encapsulation is the concept of hiding the implementation details of an object from the outside world, exposing only necessary information through public methods.

#### Example
Consider a `BankAccount` class that encapsulates private variables `accountNumber`, `balance`, and methods `deposit()` and `withdraw()` to manage the balance.

```java
public class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double balance) {
        this.accountNumber = accountNumber;
        this.balance = balance;
    }

    public void deposit(double amount) {
        balance += amount;
    }

    public void withdraw(double amount) {
        if (balance >= amount) {
            balance -= amount;
        } else {
            System.out.println("Insufficient funds");
        }
    }

    public double getBalance() {
        return balance;
    }
}
```

### Abstraction
#### Definition
Abstraction is the concept of exposing only the necessary information to the outside world, while hiding the internal implementation details.

#### Example
Consider a `VendingMachine` class that abstracts the internal implementation of selecting a product, inserting coins, and dispensing change. The outside world interacts with the machine through buttons and a display.

```java
public class VendingMachine {
    private int currentSelection;
    private int balance;
    private String[] products;

    public VendingMachine(String[] products) {
        this.products = products;
        this.currentSelection = 0;
        this.balance = 0;
    }

    public void selectProduct(int selection) {
        currentSelection = selection;
    }

    public void insertCoin(int amount) {
        balance += amount;
    }

    public void dispense() {
        if (currentSelection <= products.length && balance >= 1) {
            System.out.println("Dispensing product " + products[currentSelection]);
            balance -= 1;
        } else {
            System.out.println("Invalid selection or insufficient funds");
        }
    }
}
```

## Formulas Reference
None.