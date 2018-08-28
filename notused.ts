#!/usr/bin/env node

import chalk from "chalk";
import yargs from "yargs";

import notused from ".";
import {IOptions} from "./context";

yargs.alias("r", "root");
yargs.default("root", process.cwd());
yargs.string("root");
yargs.normalize("root");

yargs.alias("e", "exclude");
yargs.default("exclude", ["node_modules"]);
yargs.string("exclude");

yargs.alias("i", "ignore");
yargs.string("ignore");
yargs.default("ignore", []);

const {argv} = yargs;

const opts: IOptions = {
    root: argv.root,
    exclude: [].concat(argv.exclude),
    ignore: [].concat(argv.ignore),
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
