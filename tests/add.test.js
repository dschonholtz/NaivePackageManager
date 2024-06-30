const fs = require("fs");
const path = require("path");
const { addPackage } = require("../add");
const {
  buildDependencyGraph,
  checkVersionConflicts,
  updatePackageJson,
  generateLockFile,
} = require("../utils");
const axios = require("axios");

jest.mock("axios");

const TEST_DATA_DIR = path.join(__dirname, "test_data");
const PACKAGE_JSON_PATH = path.join(TEST_DATA_DIR, "package.json");
const LOCK_FILE_PATH = path.join(TEST_DATA_DIR, "package-lock.json");

beforeEach(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR);
  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify({ dependencies: {} }, null, 2)
  );
  fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify({}, null, 2)); // Add this line to create the lock file
});

afterEach(() => {
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test("addPackage handles circular dependencies", async () => {
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

  await addPackage("A@1.0.0", { path: PACKAGE_JSON_PATH });
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const lockFile = JSON.parse(fs.readFileSync(LOCK_FILE_PATH, "utf8")); // Add this line to read the lock file

  expect(packageJson.dependencies).toHaveProperty("A", "1.0.0");
  expect(packageJson.dependencies).toHaveProperty("B", "1.0.0");
  expect(lockFile).toHaveProperty("dependencies"); // Add this line to check the lock file
});
