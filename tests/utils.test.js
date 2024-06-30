const {
  buildDependencyGraph,
  checkVersionConflicts,
  updatePackageJson,
  generateLockFile,
} = require("../utils");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

jest.mock("axios");

test("buildDependencyGraph handles circular dependencies", async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes("A")) {
      return Promise.resolve({
        data: { version: "1.0.0", dependencies: { B: "1.0.0" } },
      });
    } else if (url.includes("B")) {
      return Promise.resolve({
        data: { version: "1.0.0", dependencies: { A: "1.0.0" } },
      });
    }
  });

  const graph = await buildDependencyGraph("A", "1.0.0");
  expect(graph.has("A")).toBe(true);
  expect(graph.has("B")).toBe(true);
});

test("checkVersionConflicts detects conflicts", () => {
  const dependencyGraph = new Map([
    ["express", { version: "4.17.1", dependencies: {} }],
    ["body-parser", { version: "1.19.0", dependencies: {} }],
  ]);
  const existingDependencies = {
    express: "^4.17.1",
    "body-parser": "^1.18.0",
  };

  const conflicts = checkVersionConflicts(
    dependencyGraph,
    existingDependencies
  );
  expect(conflicts).not.toContain("body-parser: ^1.18.0 vs 1.19.0");
});

test("updatePackageJson updates dependencies correctly", () => {
  const packageJson = { dependencies: {} };
  const dependencyGraph = new Map([
    ["body-parser", { version: "1.19.0", dependencies: {} }],
    ["express", { version: "4.17.1", dependencies: {} }],
  ]);

  updatePackageJson(packageJson, "body-parser", "1.19.0", dependencyGraph);
  expect(packageJson.dependencies).toHaveProperty("body-parser", "^1.19.0");
  expect(packageJson.dependencies).toHaveProperty("express", "^4.17.1");
});

test("generateLockFile creates a correct lock file", () => {
  const packageJson = {
    name: "test",
    version: "1.0.0",
    dependencies: { lodash: "4.17.21" },
  };
  const dependencyGraph = new Map([
    ["lodash", { version: "4.17.21", dependencies: {} }],
  ]);

  generateLockFile(packageJson, dependencyGraph);
  const lockFile = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  expect(lockFile.dependencies).toHaveProperty("lodash", "4.17.21");
  expect(lockFile.dependencyGraph).toHaveProperty("lodash");
});
