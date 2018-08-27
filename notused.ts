#!/usr/bin/env node

import chalk from "chalk";

import notused from ".";
import {IOptions} from "./context";

const opts: IOptions = {
    root: process.cwd(),
    exclude: ["node_modules"],
    ignore: [],
};

console.time();
notused(opts)
    .then((report) => {
        console.log(report);
        console.timeEnd();
    })
    .catch((error) => {
        console.log(chalk.bgRed(" "), chalk.red.bold(error));
        process.exit(1);
    });
