import path from "path";

import mem from "mem";
import multimatch from "multimatch";

import {allFilePaths, scanFile} from "./service";

const pkg = "package.json";

const _allFilePaths = mem(allFilePaths);
const _multimatch = mem(multimatch);

export interface IOptions {
    readonly root: string;
    readonly exclude: string[];
    readonly ignore: string[];
}

export class Context {
    private pkg: any;
    private options!: IOptions;

    get dependencies(): string[] {
        return [
            ...Object.keys(this.pkg.dependencies || {}),
            ...Object.keys(this.pkg.devDependencies || {}),
        ];
    }

    private globby(...patterns: string[]) {
        const paths = _allFilePaths(this.options.root, this.options.exclude);
        return _multimatch(paths, patterns);
    }

    public static async fromOptions(options: IOptions): Promise<Context> {
        const ctx = new Context();
        ctx.options = options;

        let content = "";
        const ok = await scanFile(
            path.join(options.root, pkg),
            (chunk) => {
                content += chunk;
                return false;
            },
        );
        if (!ok) {
            throw new Error(`Could not read "${pkg}" in "${options.root}"`);
        }

        try {
            ctx.pkg = JSON.parse(content);
        } catch (e) {
            throw new Error(
                `Could not parse contents of "${pkg}" in "${options.root}"`,
            );
        }

        return ctx;
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
