import {Context} from "./context";

export interface IDependency {
    readonly name: string;
    score: number | string;
}

type check = (ctx: Context, dep: IDependency, ...groups: string[]) => IDependency;

export class Checker {
    private ctx: Context;
    private checks: Array<{
        pattern: RegExp;
        check: check;
    }> = [];

    public constructor(ctx: Context) {
        this.ctx = ctx;
    }

    public use(pattern: RegExp, check: check): void {
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
                pattern.lastIndex = 0;
                const match = pattern.exec(dep.name);
                if (match) {
                    match.shift();
                } else {
                    continue;
                }
                return check(this.ctx, dep, ...match);
            }
            return dep;
        });
    }
}
