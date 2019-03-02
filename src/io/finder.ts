import * as fs from "fs";
import moment = require("moment");

function getInputFiles(baseDir: string, account: string): Promise<string[]> {
    const accountMatcher = new RegExp(`^${account}.*`);

    return new Promise((resolve, reject) => {
        fs.readdir(baseDir, (err, files) => {
            if (err) return reject(err);

            return resolve(files.filter(it => accountMatcher.test(it)));
        });
    });
}

function getLatestFile(files: string[]): string | null {
    if (files.length === 0) {
        return null;
    }

    const dateMatcher = /.*(\d{4}-\d{2}-\d{2}).*/;
    return files.sort((a, b) => {
        const dateA = dateMatcher.exec(a);
        const dateB = dateMatcher.exec(b);

        if (!dateA || !dateB) {
            return 0;
        }

        return moment(dateA[1]).diff(moment(dateB[1]), "days");
    })[files.length - 1];
}

export async function getLatestFileForAccount(
    baseDir: string,
    account: string
): Promise<string> {
    const files = await getInputFiles(baseDir, account);
    const latest = getLatestFile(files);

    if (!latest) {
        throw new Error(
            `No file found for account ${account} in baseDir ${baseDir}.`
        );
    }

    return latest;
}
