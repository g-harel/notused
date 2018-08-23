import {Checker, IDependency} from "./checker";
import {Context, IOptions} from "./context";

const notused = async (opts: IOptions): Promise<IDependency[]> => {
    const ctx = new Context(opts);
    const checker = new Checker(ctx);

    checker.use(/^@types\/(.*)$/g, async (ctx, _, reference) => {
        const exists = await ctx.hasDependency(reference);
        return exists ? reference : false;
    });

    checker.use("typescript", async (ctx) => {
        return ctx.hasFile("*.ts");
    });

    checker.use(/.*/g, async (ctx, dep) => {
        return ctx.hasContent(
            "**/*.js",
            new RegExp(`import.*${dep.name}`),
            new RegExp(`require.*${dep.name}`),
        );
    });

    return checker.check();
};

export default notused;
