import fs from "fs";
import path from "path";

export interface IOptions {
    dir: string;
    pkg: string;
}

type dependency = {
    name: string;
    score: number;
};

type report = [dependency[], null] | [null, string];

const notused = (opts: IOptions): report => {
    const pkgPath = path.join(opts.dir, opts.pkg);
    const exists = fs.existsSync(pkgPath);
    if (!exists) {
        return [null, `Could not find "${opts.pkg}" in "${opts.dir}"`];
    }

    const pkg = require(pkgPath);

    console.log(pkg.dependencies);
    console.log(pkg.devDependencies);

    return [[], null];
};

export default notused;
