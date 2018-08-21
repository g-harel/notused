import {Checker, IDependency} from "./checker";
import {Context, IOptions} from "./context";

const notused = async (opts: IOptions): Promise<IDependency[]> => {
    const ctx = new Context(opts);
    const checker = new Checker(ctx);

    checker.use(/^@types\/(.*)$/g, (ctx, _, reference) => {
        const exists = ctx.hasDependency(reference);
        return exists ? reference : false;
    });

    checker.use(/t/, () => true);

    return checker.check();
};

export default notused;
