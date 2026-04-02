# IPv4-IPv6
## Introduction
### What is IPv4-IPv6?
IPv4-IPv6 refers to the transition period between the Internet Protocol version 4 (IPv4) and Internet Protocol version 6 (IPv6). IPv4 is the fourth version of the Internet Protocol, which has been the primary communication protocol for the internet since the early 1980s. However, as the internet expanded and the number of devices connected to it increased exponentially, the need for a larger address space and improved network functionality became apparent. IPv6 is the sixth version of the Internet Protocol, designed to address these limitations of its predecessor.

### Why This Matters for Computer Networks Students
Understanding IPv4-IPv6 is crucial for computer networks students as it shows the development of the internet architecture and the solutions adopted to address scaling issues. Knowledge of both protocols enables network engineers to manage and design networks, understand legacy systems, and make informed decisions when migrating to newer networks or integrating with older systems.

## Key Concepts
### IPv4 Addressing
#### Definition
IPv4 uses a 32-bit address space, divided into four parts (octets) separated by dots (e.g., 192.168.1.1). It supports a maximum of approximately 4.3 billion unique addresses, which was insufficient for the growing global network.

#### Example
Consider a company setting up a home network. To assign IPv4 addresses, an administrator would need to use private addresses from the reserved range (10.0.0.0 to 10.255.255.255) within the LAN, using Network Address Translation (NAT) to map those addresses to a single public IPv4 address for internet access. This example illustrates the limitations and the necessity for an upgrade to IPv6.

### IPv6 Addressing
#### Definition
IPv6 uses a 128-bit address space, allowing an almost unlimited number of possible addresses. It is based on a hexadecimal structure with eight groups (hextets) separated by colons (e.g., 2604:A880:4224:0050:00E5:67CF:F68D:E248).

#### Example
When setting up a new network using IPv6, one would allocate a /64 subnet to each interface (very common in home networks), providing a large number of unique addresses within the network for client and server-side communication.

### IPv4-Ipv6 Transition Mechanisms
#### Definition
Transition mechanisms were developed to allow both IPv4 and IPv6 to coexist during the migration period, ensuring a smooth transition and minimal disruption to services. These include technologies like NAT-PT and 6to4, which allow IPv6 traffic to be carried over IPv4 networks or vice versa.

#### Example
The Dual-Stack Transition Mechanism (6RD) is an example of how the transition was coined to bridge both worlds. It involved using the IPv6 Internet Service Provider's prefix within an IPv4 space and using translation encapsulation of both the data and header IPv4 for the Router RFC7122 creating two channels where both IPv4 and IPv6 can now access each other between routers with either encoding using a co-existence provider.

## Formulas Reference
Not applicable to this topic as it overview upgrade forms of communication between internet protocols rather than calculations and formulas.