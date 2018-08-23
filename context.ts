import fs from "fs";
import path from "path";
import readline from "readline";

import globby from "globby";

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

    public async hasDependency(name: string): Promise<boolean> {
        return this.dependencies.indexOf(name) >= 0;
    }

    public async hasFile(glob: string): Promise<boolean> {
        const paths = await globby(glob, {
            cwd: this.options.dir,
        });
        return !!paths.length;
    }

    public async hasContent(glob: string, ...patterns: RegExp[]): Promise<boolean> {
        const paths = await globby(glob, {
            cwd: this.options.dir,
        });

        const found: boolean[] = await Promise.all(
            paths.map((path) => {
                const fileReader = fs.createReadStream(path);
                const reader = readline.createInterface({input: fileReader});

                // const a = fs.readFileSync(path).toString();
                // for (let pattern in patterns) {
                //     if (a.match(pattern)) {
                //         return true;
                //     }
                // }
                // return false;

                return new Promise<boolean>((resolve) => {
                    reader.on("line", (line: string) => {
                        for (let pattern in patterns) {
                            const match = line.match(pattern);
                            if (match) {
                                resolve(true);
                            }
                        }
                    });

                    reader.on("close", () => {
                        resolve(false);
                    });
                });
            }),
        );

        return !!found.find((f) => !!f);
    }
}
