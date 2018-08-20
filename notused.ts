#!/usr/bin/env node

import chalk from "chalk";

import notused from ".";
import {IOptions} from "./context";

const opts: IOptions = {
    dir: process.cwd(),
    pkg: "package.json",
};

notused(opts)
    .then((report) => {
        console.log(report);
    })
    .catch((error) => {
        console.log(chalk.bgRed(" "), chalk.red.bold(error));
        process.exit(1);
    });
