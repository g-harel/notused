import {Context} from "./context";

export interface IDependency {
    readonly name: string;
    score: number | string;
}

type check = (ctx: Context, dep: IDependency, ...groups: string[]) => IDependency;

export class Checker {
    private ctx: Context;
    private checks: Array<{
        pattern: string | RegExp;
        check: check;
    }> = [];

    public constructor(ctx: Context) {
        this.ctx = ctx;
    }

    public use(pattern: string | RegExp, check: check): void {
        this.checks.push({pattern, check});
    }

    public check(): IDependency[] {
        const deps: IDependency[] = this.ctx.dependencies.map((name) => ({
            name,
            score: 0,
        }));

        return deps.map((dep) => {
            for (let i = 0; i < this.checks.length; ++i) {
                const {pattern, check} = this.checks[i];

                if (typeof pattern === "string") {
                    if (pattern === dep.name) {
                        return check(this.ctx, dep);
                    } else {
                        continue;
                    }
                }

                pattern.lastIndex = 0;
                const match = pattern.exec(dep.name);
                if (match) {
                    match.shift();
                    return check(this.ctx, dep, ...match);
                }
            }
            return dep;
        });
    }
}
