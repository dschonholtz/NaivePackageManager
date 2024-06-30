## Implementation Plan for Robust Dependency Tracking

### Modifications to add command:

1. When adding a new package, perform a depth-first search (DFS) of its dependencies.
2. For each dependency encountered:
   a. Add it to a temporary dependency graph structure.
   b. Check for version conflicts with existing dependencies.
   c. If a conflict is found, exit and report the conflict to the user.
   d. If the dependency already exists, adjust the version range based on the new requirement.
   e. If a cycle is detected, mark it but continue processing (don't follow the cycle).
3. After successful DFS, update the package.json with the new direct dependency.
4. Generate or update the package-lock.json file:
   a. Include all discovered dependencies with their exact versions.
   b. Store the dependency graph structure, including cycle information.

### Modifications to install command:

5. Read the package-lock.json file if it exists, otherwise perform the DFS as described in the add command.
6. Create a dependency graph based on the lock file or DFS results.
7. Implement a modified topological sort algorithm to determine the installation order:
   a. Start with packages that have no dependencies.
   b. As each package is installed, remove it from the dependency lists of other packages.
   c. Add packages to the installation queue as their dependencies are satisfied.
   d. If a cycle is encountered, break it by arbitrarily choosing one package in the cycle to install first.
8. Process the installation queue:
   a. Download and extract each package.
   b. After each successful installation, check if any waiting packages now have all dependencies satisfied.
   c. Add newly eligible packages to the installation queue.
9. Continue until all packages are installed or an error occurs.
10. After installation, perform a final check to ensure all cyclic dependencies are satisfied.

### Additional considerations:

- Implement caching mechanisms to store downloaded packages locally.
- Add validation steps to verify the integrity of downloaded packages.
- Provide clear warnings for circular dependencies and explain how they were resolved.
- Consider implementing a progress bar or other visual feedback for long-running operations.
- Implement a mechanism to detect and prevent infinite loops in case of complex circular dependencies.

This approach handles cycles in the dependency graph by detecting them during the DFS, marking them in the dependency graph, and then breaking them during the installation process. It also includes a final check to ensure all cyclic dependencies are satisfied after the main installation process.

## Two hour update...

1. Circular dependencies are getting tripped up.
2. I think I always create a package.json rather than updating it.
3. Since I am working on fixing circular dependencies install doesn't properly read from and install from the package-lock.json

My problems here come back to having bit off a bit more than I should have.
From the list of "things you should only attempt to do one of if you are really feeling it"

I am doing lock files (sort of probably not deterministic)
and circular dependencies.


## Final update:
Ripped out lock files
Was getting tripped up by mocks for a while there.... But now simple installs work.
This isn't anywhere near fully tested. 
Ideally, I'd spend another 4 hours on this getting the code clean. But it is midnight :)

It was a fun project!
