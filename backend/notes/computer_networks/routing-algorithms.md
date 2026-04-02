# Routing-Algorithms
## Introduction
### What are Routing-Algorithms?
Routing algorithms are a set of rules or protocols used in network routing to select the best path for forwarding data to its desired destination. They are essential in computer networks for enabling data communication between nodes and ensuring efficient, reliable data transfer.

### Why This Matters for Computer Networks Students
Understanding routing algorithms is crucial for computer networks students as it enables them to comprehend how networks operate, particularly in deploying, managing, and optimizing network structures and protocols. This knowledge is vital in implementing real-world networks, such as internet service providers' networks, corporate networks, or the networks of organizations.

## Key Concepts
### Distance Vector Routing
#### Definition
Distance vector routing protocol is a type of routing algorithm where each router maintains a table of its neighbors, listing each possible destination network and its distance. Each distance is calculated by the time taken to reach the destination network via its shortest path. Routers then share their distance vectors with their neighbors periodically.

#### Example
Consider a network with three routers A, B, and C connected to each other forming a triangle, and a router D not connected to the triangle. Suppose the distance vectors of routers A and B to other routers are as follows:
- Router A to Router B: Cost 2
- Router A to Router C: Cost 4
- Router A to Router D: Cost 10
- Router B to Router A: Cost 2
- Router B to Router C: Cost 3
- Router B to Router D: Cost 9

Router A shares its distance vector, {2, 4, 10} with Router B, and Router B shares its distance vector, {2, 3, 9}, with Router A. Router C shares its distance vector, { x, y, 5}, with Router B, and Router C shares its distance vector, {6, z, 5} with Router A. Using these vectors, Router B calculates its own distance vector and shares it with its neighbors. The process continues until the routers converge on a common routing table.

### Link State Routing
#### Definition
Link state routing protocol is a type of routing algorithm where each router maintains a map of its neighbors and their direct connections. This ‘map’ or ‘graph’ is then shared with all connected routers. Each router calculates the shortest path to networks by analyzing each possible path from every other router’s view and recording the shortest path to each network.

### Path Vector Routing
#### Definition
Path vector routing is a more complex version of distance vector routing. In path vector routing, not just the distances but complete paths to destinations are exchanged between routers, allowing for loops to be more easily avoided.

### Split Horizon
#### Definition
Split horizon is a technique used by distance vector routers to prevent feedback routing. A router won’t advertise a route to its neighbor until it has received this route from that neighbor first, ensuring that the route isn’t a loop.

### Comparative Analysis
!Note: Comparative analysis has been omitted, but you can add it according to your specific requirements.

## Formulas Reference
$$
\begin{aligned}
&amp; \text{Hop Count} (d) = \min(\text{hop\_count}(r_t) + 1) \text{ where r_t is the route to destination network } d \text{ Tencent}\\ &amp; Dijkstra's \text{ algorithm’s formula to find the shortest path between two nodes, s and t:} \\ 
&amp;         \left \{ w_{1}, w_{2}, ..., w_{n}  \right\} \text{are the weights}\\ &amp; d(s,t) = \min  \ w(s,t) + d(s,v) \nonumber \\ &amp; w(s,t) \text{ can be a constant value or auto-callable function (eg distance, latency)}
\end{aligned}
$$