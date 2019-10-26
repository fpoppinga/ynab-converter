#!/usr/bin/env node
import * as program from "commander";
import { CsvReader } from "./io/csvReader";
import {
    StarmoneyFields,
    StarmoneyMapping,
    StarmoneySeparators
} from "./config/starmoney";
import * as fs from "mz/fs";
import { YNABConverter } from "./io/ynabConverter";
import * as path from "path";
import { Command } from "commander";
import { config as initEnvironment } from "dotenv";
import { YnabClient } from "./io/ynabClient";
import { getLatestFileForAccount } from "./io/finder";
import { DKBFields, DKBMapping, DKBSeparators } from "./config/dkb";

initEnvironment();

program.version("2.0.0");

program
    .command("convert <input> [<output>]")
    .description("parse StarMoney export format and output it as YNAB format.")
    .action(async (input: string, output: string | Command) => {
        if (typeof output !== "string") {
            output = input.replace(/\.txt$/, ".csv");
        }

        try {
            const file = await fs.readFile(path.resolve(input));
            const reader = new CsvReader(
                StarmoneySeparators,
                StarmoneyFields,
                new StarmoneyMapping(),
                file.toString("utf-8")
            );
            const converter = new YNABConverter(reader);

            const result = await converter.convert();
            await fs.writeFile(path.resolve(output), result);
        } catch (err) {
            console.error("Error when converting file:", err);
            process.exit(1);
        }
    });

async function pushAccount(
    input: string,
    accountName: string,
    token: string,
    budget: string,
    format: string
) {
    let resolvedPath = path.resolve(input);
    const stats = await fs.lstat(resolvedPath);
    if (stats.isDirectory()) {
        resolvedPath = path.resolve(
            path.join(
                input,
                await getLatestFileForAccount(resolvedPath, accountName)
            )
        );
    }

    const file = await fs.readFile(resolvedPath);
    const reader = getReader(file, format);

    const ynabClient = new YnabClient(token, accountName, budget);
    await ynabClient.createTransactions([...reader.read()]);
}

function getReader(file: Buffer, format: string): CsvReader {
    if (format === "starmoney") {
        return new CsvReader(
            StarmoneySeparators,
            StarmoneyFields,
            new StarmoneyMapping(),
            file.toString("utf-8")
        );
    }

    if (format === "dkb") {
        return new CsvReader(
            DKBSeparators,
            DKBFields,
            new DKBMapping(),
            file.toString("utf-8"),
            7
        );
    }

    throw new Error(`Illegal value for "format": ${format}`);
}

program
    .command("push <input>")
    .option(
        "-t, --token <token>",
        `
        Your YNAB access token. Don't have one? 
        Go to https://app.youneedabudget.com/settings/developer to get one.
        
        You can alternatively just set the environment variable YNAB_TOKEN to the value of your token.`
    )
    .option(
        "-b, --budget <budget>",
        `
        The name of your YNAB Budget. If you don't provide a budget, the one with the most 
        recent change will be used.`
    )
    .option(
        "-a, --account [account]",
        `Your account's names. Partial names are sufficient.`,
        (value, memo) => {
            memo.push(value);
            return memo;
        },
        []
    )
    .option(
        "-f, --format [format]",
        `a format specifier. One of starmoney, dkb`,
        /(starmoney)|(dkb)/,
        "starmoney"
    )
    .description(
        "parse StarMoney export format and push contents to YNAB directly."
    )
    .action(async (input: string, command: Command) => {
        const token = command.opts()["token"] || process.env["YNAB_TOKEN"];
        if (!token) {
            console.error("You have to provide a YNAB token.");
            return process.exit(1);
        }

        const accountNames: string[] = command.opts()["account"];

        if (accountNames.length === 0) {
            console.error("You have to provide an account name.");
            return process.exit(1);
        }

        try {
            await Promise.all(
                accountNames.map(accountName =>
                    pushAccount(
                        input,
                        accountName,
                        token,
                        command.opts()["budget"],
                        command.opts()["format"]
                    )
                )
            );
        } catch (err) {
            console.error("Error when pushing: ", err);
            process.exit(1);
        }
    });

program.parse(process.argv);
