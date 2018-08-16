#!/usr/bin/env node

import chalk from "chalk";

import notused, {IOptions} from ".";

const opts: IOptions = {
    dir: process.cwd(),
    pkg: "package.json",
};

const [report, error] = notused(opts);
if (error) {
    console.log(chalk.bgRed(" "), chalk.red.bold(error));
    process.exit(1);
}

console.log(report);
