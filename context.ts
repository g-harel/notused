import fs from "fs";
import path from "path";
import readline from "readline";

import globby from "globby";

export interface IOptions {
    readonly root: string;
    readonly exclude: string[];
}

export class Context {
    private pkg: any;
    public readonly options: IOptions;

    get dependencies(): string[] {
        return [
            ...Object.keys(this.pkg.dependencies || {}),
            ...Object.keys(this.pkg.devDependencies || {}),
        ];
    }

    private globby(...patterns: string[]) {
        patterns.push(...this.options.exclude.map((pattern) => "!" + pattern));
        return globby(patterns, {
            cwd: this.options.root,
        });
    }

    public constructor(options: IOptions) {
        this.options = options;

        const pkgPath = path.join(options.root, "package.json");
        const exists = fs.existsSync(pkgPath);
        if (!exists) {
            throw new Error(`Could not find "package.json" in "${options.root}"`);
        }

        this.pkg = require(pkgPath) || {};
    }

    public async hasDependency(name: string): Promise<boolean> {
        return this.dependencies.indexOf(name) >= 0;
    }

    public async hasScript(content: string): Promise<boolean> {
        const scripts = this.pkg.scripts || {};
        const values = Object.keys(scripts).map((name) => scripts[name]);
        for (let value of values) {
            if (value.indexOf(content) >= 0) {
                return true;
            }
        }
        return false;
    }

    public async hasFile(...glob: string[]): Promise<boolean> {
        const paths = await this.globby(...glob);
        return !!paths.length;
    }

    public async hasContent(
        glob: string[],
        ...patterns: Array<string | RegExp>
    ): Promise<boolean> {
        const paths = await this.globby(...glob);

        const found: Array<Promise<boolean>> = new Array(paths.length);
        for (let i = 0; i < found.length; ++i) {
            const fileReader = fs.createReadStream(
                path.join(this.options.root, paths[i]),
            );
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

    public async pkgHasContent(
        ...patterns: Array<string | RegExp>
    ): Promise<boolean> {
        const pkg = Object.assign(this.pkg);
        delete pkg.dependencies;
        delete pkg.devDependencies;
        for (let pattern of patterns) {
            if (JSON.stringify(pkg).match(pattern)) {
                return true;
            }
        }
        return false;
    }
}
