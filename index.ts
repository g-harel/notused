import {Checker, IResult} from "./checker";
import {Context, IOptions} from "./context";

const notused = async (opts: IOptions): Promise<IResult[]> => {
    const ctx = new Context(opts);
    const checker = new Checker(ctx);

    checker.use(/.*/g, async (ctx, name) => {
        return ctx.isIgnored(name);
    });

    checker.use(/^@types\/(.*)$/g, async (ctx, _, reference) => {
        const exists = await ctx.hasDependency(reference);
        return exists ? reference : false;
    });

    checker.use("typescript", async (ctx) => {
        return ctx.hasFile("*.ts");
    });

    checker.use(/.*/g, async (ctx, name) => {
        return ctx.hasScript(name);
    });

    checker.use(/.*/g, async (ctx, name) => {
        return ctx.hasContent(
            ["*.json", "!package.json", "!package-lock.json"],
            name,
        );
    });

    checker.use(/.*/g, async (ctx, name) => {
        return ctx.pkgHasContent(name);
    });

    checker.use(/.*/g, async (ctx, name) => {
        return ctx.hasContent(
            ["**/*.{js,jsx,ts,tsx}"],
            new RegExp(`import.*('|")${name}('|")`),
            new RegExp(`require.*('|")${name}('|")`),
        );
    });

    return checker.check();
};

export default notused;
