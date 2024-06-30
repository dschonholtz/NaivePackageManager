const fs = require("fs");
const path = require("path");
const { installPackages } = require("../install");
const axios = require("axios");
const tar = require("tar");

const TEST_DATA_DIR = path.join(__dirname, "test_data");
const PACKAGE_JSON_PATH = path.join(TEST_DATA_DIR, "package.json");
const NODE_MODULES_PATH = path.join(TEST_DATA_DIR, "node_modules");

beforeEach(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR);
  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify({ dependencies: { "left-pad": "1.3.0" } }, null, 2)
  );
  jest.resetModules(); // Clear the module registry
  jest.clearAllMocks(); // Clear all mocks
});

// afterEach(() => {
//   fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
// });

test("installPackages installs real package with single dependency", async () => {
  // jest.unmock("axios"); // Turn off the mock for axios

  await installPackages({ path: PACKAGE_JSON_PATH });

  // Check if the tar file was downloaded
  const tarFilePath = path.join(TEST_DATA_DIR, "left-pad-1.3.0.tgz");
  console.log(`Checking if ${tarFilePath} exists`);
  expect(fs.existsSync(tarFilePath)).toBe(true);

  // Check if the tar file was extracted
  const leftPadPath = path.join(NODE_MODULES_PATH, "left-pad");
  console.log(`Checking if ${leftPadPath} exists`);
  expect(fs.existsSync(leftPadPath)).toBe(true);

  // Check if the is-number directory exists (dependency of left-pad)
  const isNumberPath = path.join(NODE_MODULES_PATH, "is-number");
  console.log(`Checking if ${isNumberPath} exists`);
  expect(fs.existsSync(isNumberPath)).toBe(true);
});
