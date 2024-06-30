const axios = require("axios");
const fs = require("fs");
const path = require("path");
const tar = require("tar");
const { buildDependencyGraph, fetchPackageInfo } = require("./utils");

async function installPackages(options) {
  const packageJsonPath = path.resolve(options.path);
  console.log(`Using package.json at: ${packageJsonPath}`);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = packageJson.dependencies || {};
  const nodeModulesPath = path.join(
    path.dirname(packageJsonPath),
    "node_modules"
  );

  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath);
  }

  const dependencyGraph = new Map();
  for (const [name, version] of Object.entries(dependencies)) {
    await buildDependencyGraph(name, version, dependencyGraph);
  }

  for (const [name, info] of dependencyGraph) {
    await installPackage(name, info.version, nodeModulesPath);
  }
}

async function installPackage(name, version, nodeModulesPath) {
  try {
    const packageInfo = await fetchPackageInfo(name, version);
    const tarballUrl = packageInfo.dist.tarball;
    const packagePath = path.join(nodeModulesPath, name);

    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true });
    }

    const tarballPath = path.join(packagePath, `${name}.tgz`);
    await downloadTarball(tarballUrl, tarballPath);
    await extractTarball(tarballPath, packagePath);
    fs.unlinkSync(tarballPath);

    console.log(`Installed ${name}@${version}`);
  } catch (error) {
    console.error(`Failed to install ${name}@${version}: ${error.message}`);
  }
}

async function downloadTarball(url, destination) {
  const writer = fs.createWriteStream(destination);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  console.log("Response:");
  console.log(response);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function extractTarball(tarballPath, destination) {
  await tar.x({
    file: tarballPath,
    cwd: destination,
    strip: 1,
  });
}

module.exports = { installPackages };
