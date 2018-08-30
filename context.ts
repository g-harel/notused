import fs from "fs";
import path from "path";

import multimatch from "multimatch";

import {allFilePaths, scanFile} from "./service";

export interface IOptions {
    readonly root: string;
    readonly exclude: string[];
    readonly ignore: string[];
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
        const paths = allFilePaths(this.options.root);
        patterns.push(...this.options.exclude.map((pattern) => "!" + pattern));
        return multimatch(paths, patterns);
    }

    public constructor(options: IOptions) {
        this.options = options;

        // TODO remove fs package
        const pkgPath = path.join(options.root, "package.json");
        const exists = fs.existsSync(pkgPath);
        if (!exists) {
            throw new Error(`Could not read "package.json" in "${options.root}"`);
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

        let found = false;
        const done: Array<Promise<any>> = new Array(paths.length);
        for (let i = 0; i < done.length; ++i) {
            done[i] = scanFile(paths[i], (line) => {
                for (let pattern of patterns) {
                    const match = line.match(pattern);
                    if (match) {
                        found = true;
                        break;
                    }
                }
                return found;
            });
        }

        await Promise.all(done);
        return found;
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

    public async isIgnored(name: string): Promise<boolean> {
        return this.options.ignore.indexOf(name) >= 0;
    }
}
