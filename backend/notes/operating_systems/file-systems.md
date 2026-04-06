# File-Systems
## Introduction
### What are File-Systems?
A file system is a method of organizing and storing files on a computer's storage device in a way that makes them easily accessible. It is the interface between a computer's hardware storage devices and the operating system, allowing the OS to manage files, directories, and other data.

### Why This Matters for Operating Systems Students
Understanding file systems is crucial for operating system students as it provides a foundation for building and managing storage devices. File systems enable users to interact with storage devices in a logical and organized manner, making it easier to navigate and manage files. Moreover, file systems play a critical role in optimizing storage efficiency, ensuring data integrity, and providing recovery mechanisms in case of data loss.

## Key Concepts
### Organization and Structure
#### Definition
A file system organizes files and directories in a hierarchical structure, typically using a root directory and subdirectories.

#### Example
Consider a file system with a root directory `/`. Under the root directory, there are three subdirectories: `bin`, `lib`, and `home`. The `bin` directory contains executable files, `lib` directory holds library files, and `home` directory is for user files. This organization enables users to easily navigate and find specific files.

### File Types and Attributes
#### Definition
Files can have different types and attributes, such as files, directories, symbolic links, and special files.

#### Example
In a file system, a file named `user.txt` is a regular file, while a directory named `pics` is a directory. A symbolic link named `link` points to the `/home/user` directory, and a special file named `/dev/sda1` is a block device.

### File System Operations
#### Definition
File system operations include creating, deleting, reading, writing, and modifying files and directories.

#### Example
Some common file system operations include: creating a new directory `new_dir`, deleting a file `old_file`, reading the contents of a file `text.txt`, writing data to a file `output.txt`, and modifying the permissions of a directory `perms_dir`.

### File System Types
#### Definition
There are various types of file systems, including local file systems, network file systems, and flash file systems.

#### Example
Some common file system types include: FAT (File Allocation Table), NTFS (New Technology File System), ext4 (Fourth Extended File System), and HFS (Hierarchical File System).

## Formulas Reference
$$\mathit{Block\ Size} = \log_2 \mathit{Cluster\ Size}$$
$$\mathit{Cluster\ Size} = \frac{\mathit{Total\ Blocks}}{\mathit{Number\ of\ Clusters}}$$