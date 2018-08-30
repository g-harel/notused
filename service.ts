import fs from "fs";
import readline from "readline";

import globby from "globby";
import mem from "mem";

export const allFilePaths = mem(
    (cwd: string): string[] => {
        return globby.sync("**", {
            absolute: true,
            cwd,
        });
    },
);

export const scanFile = async (
    path: string,
    cb: (chunk: string) => boolean,
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
        const close = cb(line);
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
