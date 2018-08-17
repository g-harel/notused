import {IOptions} from "./index";

interface IContext {
    readonly opt: IOptions;
    readonly dep: string[];
}

export interface IDependency {
    readonly name: string;
    score: number | string;
}

type check = (ctx: IContext, dep: IDependency, ...groups: string[]) => IDependency;

export class Checker {
    private checks: Array<{
        pattern: RegExp;
        check: check;
    }> = [];

    public use(pattern: RegExp, check: check): void {
        this.checks.push({pattern, check});
    }

    public check(pkg: any, opt: IOptions): IDependency[] {
        const deps = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ].map((name) => ({
            name,
            score: 0,
        }));

        const ctx = {
            opt,
            dep: deps.map((dep) => dep.name),
        };

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
                return check(ctx, dep, ...match);
            }
            return dep;
        });
    }
}
