const axios = require("axios");
const semver = require("semver");
const fs = require("fs");

async function buildDependencyGraph(
  name,
  version,
  graph = new Map(),
  visited = new Set(),
  stack = new Set()
) {
  if (stack.has(name)) {
    console.warn(`Circular dependency detected: ${name}`);
    // Mark the circular dependency in the graph
    if (graph.has(name)) {
      graph.get(name).circular = true;
    }
    return graph; // Return here, but only for this specific dependency
  }

  if (visited.has(name)) {
    return graph;
  }

  visited.add(name);
  stack.add(name);
  const packageInfo = await fetchPackageInfo(name, version);
  graph.set(name, {
    version: packageInfo.version,
    dependencies: packageInfo.dependencies,
    circular: false,
  });

  for (const [depName, depVersion] of Object.entries(
    packageInfo.dependencies || {}
  )) {
    // Continue processing other dependencies even if one is circular
    await buildDependencyGraph(depName, depVersion, graph, visited, stack);
  }

  stack.delete(name);
  return graph;
}

function checkVersionConflicts(dependencyGraph, existingDependencies) {
  const conflicts = [];

  for (const [name, info] of dependencyGraph) {
    const existingVersion = existingDependencies[name];
    console.log(`Checking ${name}: ${existingVersion} vs ${info.version}`);
    if (existingVersion && !semver.satisfies(info.version, existingVersion)) {
      conflicts.push(`${name}: ${existingVersion} vs ${info.version}`);
    }
  }

  return conflicts;
}

function updatePackageJson(packageJson, name, version, dependencyGraph) {
  packageJson.dependencies = packageJson.dependencies || {};

  // Preserve the original version specifier if present
  const versionWithSpecifier = /^[~^]/.test(version) ? version : `^${version}`;
  packageJson.dependencies[name] = versionWithSpecifier;

  // Update other dependencies based on the graph
  for (const [depName, depInfo] of dependencyGraph) {
    if (depName !== name) {
      // Preserve the version specifier for other dependencies as well
      const depVersion = depInfo.version.startsWith("^")
        ? depInfo.version
        : `^${depInfo.version}`;
      packageJson.dependencies[depName] = depVersion;
    }
  }
}

function generateLockFile(packageJson, dependencyGraph) {
  const lockFile = {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: {},
    dependencyGraph: {},
  };

  for (const [name, info] of dependencyGraph) {
    lockFile.dependencies[name] = info.version;
    lockFile.dependencyGraph[name] = {
      version: info.version,
      dependencies: info.dependencies,
    };
  }

  fs.writeFileSync("package-lock.json", JSON.stringify(lockFile, null, 2));
}

async function fetchPackageInfo(name, version) {
  const url = `https://registry.npmjs.org/${name}/${version}`;
  console.log(`Fetching package info from URL: ${url}`);
  const response = await axios.get(url);
  return response.data;
}

module.exports = {
  buildDependencyGraph,
  checkVersionConflicts,
  updatePackageJson,
  generateLockFile,
  fetchPackageInfo,
};
