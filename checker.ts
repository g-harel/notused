import {Context} from "./context";

type score = boolean | string;

export interface IResult {
    readonly name: string;
    score: score;
    reason: string;
}

type check = (ctx: Context, name: string, ...groups: string[]) => Promise<score>;

export class Checker {
    private ctx: Context;
    private checks: Array<{pattern: string | RegExp; check: check}> = [];

    public constructor(ctx: Context) {
        this.ctx = ctx;
    }

    public use(pattern: string | RegExp, check: check): void {
        this.checks.push({pattern, check});
    }

    public async check(): Promise<IResult[]> {
        const deps: IResult[] = this.ctx.dependencies.map((name) => ({
            name,
            score: false,
            reason: "",
        }));

        const res = await Promise.all(
            deps.map(async (dep) => {
                let score: score = false;

                for (let i = 0; i < this.checks.length; ++i) {
                    const {pattern, check} = this.checks[i];

                    if (typeof pattern === "string") {
                        if (pattern === dep.name) {
                            score = await check(this.ctx, dep.name);
                        }
                    } else {
                        pattern.lastIndex = 0;
                        const match = pattern.exec(dep.name);
                        if (match) {
                            match.shift();
                            score = await check(this.ctx, dep.name, ...match);
                        }
                    }

                    if (score) {
                        break;
                    }
                }

                dep.score = score;
                return dep;
            }),
        );

        return res.map((dep) => {
            if (typeof dep.score === "string") {
                dep.score =
                    (res.find((d) => d.name === dep.score) || ({} as any)).score ||
                    false;
            }
            return dep;
        });
    }
}
