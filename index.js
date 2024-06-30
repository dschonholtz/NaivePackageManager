const { Command } = require("commander");
const { addPackage } = require("./add");
const { installPackages } = require("./install");

const program = new Command();

program
  .command("add <package>")
  .description("Add a package to dependencies")
  .option("-p, --path <path>", "Path to package.json", "package.json")
  .action(addPackage);

program
  .command("install")
  .description("Install all dependencies")
  .option("-p, --path <path>", "Path to package.json", "package.json")
  .action(installPackages);

program.parse(process.argv);
