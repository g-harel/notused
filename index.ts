import {Checker, IDependency} from "./checker";
import {Context} from "./context";

export interface IOptions {
    readonly dir: string;
    readonly pkg: string;
}
type report = [IDependency[], null] | [null, string];

const notused = async (opts: IOptions): Promise<report> => {
    const ctx = new Context(opts);
    const checker = new Checker(ctx);

    checker.use(/^@types\/(.*)$/g, (ctx, dep, references) => {
        const exists = ctx.hasDependency(references);
        return {
            name: dep.name,
            score: exists ? references : -1,
        };
    });

    return [checker.check(), null];
};

export default notused;
