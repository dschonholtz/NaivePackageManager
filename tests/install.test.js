const fs = require("fs");
const path = require("path");
const { installPackages } = require("../install");
const axios = require("axios");
const tar = require("tar");

jest.mock("axios");
jest.mock("tar");

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
    JSON.stringify({ dependencies: { lodash: "4.17.21" } }, null, 2)
  );
});

afterEach(() => {
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test("installPackages installs dependencies correctly", async () => {
  axios.get.mockResolvedValue({
    data: {
      dist: {
        tarball: "http://example.com/lodash-4.17.21.tgz",
      },
    },
  });

  axios.mockImplementation((config) => {
    if (config.url === "http://example.com/lodash-4.17.21.tgz") {
      return Promise.resolve({
        data: {
          pipe: (writer) => {
            writer.emit("finish");
          },
        },
      });
    }
  });

  tar.x.mockResolvedValue();

  await installPackages({ path: PACKAGE_JSON_PATH });
  expect(fs.existsSync(path.join(NODE_MODULES_PATH, "lodash"))).toBe(true);
});
