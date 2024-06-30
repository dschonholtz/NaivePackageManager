const axios = require("axios");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const {
  buildDependencyGraph,
  checkVersionConflicts,
  updatePackageJson,
  generateLockFile,
  fetchPackageInfo,
} = require("./utils");

async function addPackage(pkg, options) {
  const [name, version] = pkg.split("@");
  const packageJsonPath = path.resolve(options.path);
  console.log(`Using package.json at: ${packageJsonPath}`);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const versionToUse = version || "latest";

  try {
    const dependencyGraph = await buildDependencyGraph(name, versionToUse);
    const conflicts = checkVersionConflicts(
      dependencyGraph,
      packageJson.dependencies
    );

    if (conflicts.length > 0) {
      console.error("Version conflicts detected:");
      conflicts.forEach((conflict) => console.error(`  ${conflict}`));
      return;
    }

    updatePackageJson(packageJson, name, versionToUse, dependencyGraph);
    console.log(
      `Updated package.json: ${JSON.stringify(packageJson, null, 2)}`
    ); // Debug log

    generateLockFile(packageJson, dependencyGraph);

    console.log(`Added ${name}@${versionToUse} to dependencies`);
  } catch (error) {
    console.error(`Failed to add package: ${error.message}`);
  }
}

module.exports = { addPackage };
