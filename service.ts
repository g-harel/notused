import fs from "fs";
import readline from "readline";

import globby from "globby";

export const allFilePaths = (cwd: string, ignore: string[]): string[] => {
    return globby.sync("**", {
        absolute: true,
        ignore,
        cwd,
    });
};

export const scanFile = async (
    path: string,
    handler: (chunk: string) => boolean,
): Promise<boolean> => {
    if (!fs.existsSync(path)) {
        return false;
    }
    if (!fs.lstatSync(path).isFile()) {
        return false;
    }
    const fileReader = fs.createReadStream(path);
    const reader = readline.createInterface({input: fileReader});
    reader.on("line", (line: string) => {
        const close = handler(line);
        if (close) {
            reader.close();
        }
    });
    return new Promise<boolean>((resolve) => {
        reader.on("close", () => {
            resolve(true);
        });
    });
};
