const axios = require("axios");
const fs = require("fs");
const path = require("path");
const tar = require("tar");

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

  for (const [name, version] of Object.entries(dependencies)) {
    try {
      const response = await axios.get(
        `https://registry.npmjs.org/${name}/${version}`
      );
      const tarballUrl = response.data.dist.tarball;
      const packagePath = path.join(nodeModulesPath, name);

      if (!fs.existsSync(packagePath)) {
        fs.mkdirSync(packagePath);
      }

      const writer = fs.createWriteStream(
        path.join(packagePath, `${name}.tgz`)
      );
      const downloadResponse = await axios({
        url: tarballUrl,
        method: "GET",
        responseType: "stream",
      });

      downloadResponse.data.pipe(writer);

      writer.on("finish", async () => {
        await tar.x({
          file: path.join(packagePath, `${name}.tgz`),
          cwd: packagePath,
          strip: 1,
        });
        fs.unlinkSync(path.join(packagePath, `${name}.tgz`));
        console.log(`Installed ${name}@${version}`);
      });

      writer.on("error", (error) => {
        console.error(`Failed to install ${name}@${version}: ${error.message}`);
      });
    } catch (error) {
      console.error(`Failed to install ${name}@${version}: ${error.message}`);
    }
  }
}

module.exports = { installPackages };
