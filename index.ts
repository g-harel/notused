import fs from "fs";
import path from "path";

import {Checker, IDependency} from "./checker";

export interface IOptions {
    readonly dir: string;
    readonly pkg: string;
}
type report = [IDependency[], null] | [null, string];

const notused = (opts: IOptions): report => {
    const pkgPath = path.join(opts.dir, opts.pkg);
    const exists = fs.existsSync(pkgPath);
    if (!exists) {
        return [null, `Could not find "${opts.pkg}" in "${opts.dir}"`];
    }

    const checker = new Checker();

    checker.use(/^@types\/(.*)$/g, (ctx, dep, references) => {
        const exists = ctx.dep.indexOf(references) >= 0;
        return {
            name: dep.name,
            score: exists ? references : -1,
        };
    });

    return [checker.check(require(pkgPath), opts), null];
};

export default notused;
