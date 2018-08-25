import fs from "fs";
import path from "path";
import readline from "readline";

import globby from "globby";

export interface IOptions {
    readonly root: string;
    readonly package: string;
    readonly exclude: string[];
}

export class Context {
    public options: IOptions;
    public readonly dependencies: string[];

    private globby(...patterns: string[]) {
        patterns.push(...this.options.exclude.map((pattern) => "!" + pattern));
        return globby(patterns, {
            cwd: this.options.root,
        });
    }

    public constructor(options: IOptions) {
        this.options = options;

        const pkgPath = path.join(options.root, options.package);
        const exists = fs.existsSync(pkgPath);
        if (!exists) {
            throw new Error(
                `Could not find "${options.package}" in "${options.root}"`,
            );
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
        const paths = await this.globby(glob);
        return !!paths.length;
    }

    public async hasContent(
        glob: string,
        ...patterns: Array<string | RegExp>
    ): Promise<boolean> {
        const paths = await this.globby(glob);

        const found: Array<Promise<boolean>> = new Array(paths.length);
        for (let i = 0; i < found.length; ++i) {
            const fileReader = fs.createReadStream(paths[i]);
            const reader = readline.createInterface({input: fileReader});

            found[i] = new Promise<boolean>((resolve) => {
                reader.on("line", (line: string) => {
                    for (let pattern of patterns) {
                        const match = line.match(pattern);
                        if (match) {
                            fileReader.close();
                            resolve(true);
                        }
                    }
                });

                reader.on("close", () => {
                    resolve(false);
                });
            });
        }

        const results = await Promise.all(found);
        return !!results.find((f) => !!f);
    }
}
