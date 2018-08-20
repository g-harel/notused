import fs from "fs";
import path from "path";

export interface IOptions {
    readonly dir: string;
    readonly pkg: string;
}

export class Context {
    public options: IOptions;
    public readonly dependencies: string[];

    public constructor(options: IOptions) {
        this.options = options;

        const pkgPath = path.join(options.dir, options.pkg);
        const exists = fs.existsSync(pkgPath);
        if (!exists) {
            throw new Error(`Could not find "${options.pkg}" in "${options.dir}"`);
        }

        const pkg = require(pkgPath);
        this.dependencies = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ];
    }

    public hasDependency(name: string) {
        return this.dependencies.indexOf(name) >= 0;
    }
}
