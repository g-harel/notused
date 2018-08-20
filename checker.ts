import {Context} from "./context";

type score = boolean | string;

export interface IDependency {
    readonly name: string;
    score: score;
}

type check = (ctx: Context, dep: IDependency, ...groups: string[]) => score;

export class Checker {
    private ctx: Context;
    private checks: Array<{pattern: string | RegExp; check: check}> = [];

    public constructor(ctx: Context) {
        this.ctx = ctx;
    }

    public use(pattern: string | RegExp, check: check): void {
        this.checks.push({pattern, check});
    }

    public check(): IDependency[] {
        const deps: IDependency[] = this.ctx.dependencies.map((name) => ({
            name,
            score: false,
        }));

        return deps.map((dep) => {
            let score: score = dep.score;

            for (let i = 0; i < this.checks.length; ++i) {
                const {pattern, check} = this.checks[i];

                if (typeof pattern === "string") {
                    if (pattern === dep.name) {
                        score = check(this.ctx, dep);
                        break;
                    } else {
                        continue;
                    }
                }

                pattern.lastIndex = 0;
                const match = pattern.exec(dep.name);
                if (match) {
                    match.shift();
                    score = check(this.ctx, dep, ...match);
                    break;
                }
            }

            dep.score = score;
            return dep;
        });
    }
}
