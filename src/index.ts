#!/usr/bin/env node
import * as program from 'commander';
import {CsvReader} from './io/csvReader';
import {StarmoneyFields, StarmoneyMapping, StarmoneySeparators} from './config/starmoney';
import * as fs from 'mz/fs';
import {YNABConverter} from './io/ynabConverter';
import * as path from 'path';
import {Command} from 'commander';
import {config as initEnvironment} from "dotenv";
import {YnabClient} from './io/ynabClient';

initEnvironment();

program
    .version('2.0.0');

program
    .command('convert <input> [<output>]')
    .description('parse StarMoney export format and output it as YNAB format.')
    .action((async (input: string, output: string | Command) => {
        if (typeof output !== "string") {
            output = input.replace(/\.txt$/, ".csv");
        }

        try {
            const file = await fs.readFile(path.resolve(input));
            const reader = new CsvReader(StarmoneySeparators, StarmoneyFields, new StarmoneyMapping(), file.toString('utf-8'));
            const converter = new YNABConverter(reader);

            const result = await converter.convert();
            await fs.writeFile(path.resolve(output), result);
        } catch (err) {
            console.error("Error when converting file:", err);
            process.exit(1);
        }
    }));

program
    .command("push <input>")
    .option("-t, --token <token>", `
        Your YNAB access token. Don't have one? 
        Go to https://app.youneedabudget.com/settings/developer to get one.
        
        You can alternatively just set the environment variable YNAB_TOKEN to the value of your token.`)
    .option("-b, --budget <budget>", `
        The name of your YNAB Budget. If you don't provide a budget, the one with the most 
        recent change will be used.`)
    .option("-a, --account <account>", `
        Your account's name. Partial name is enough.
    `)
    .description("parse StarMoney export format and push contents to YNAB directly.")
    .action(async (input: string, command: Command) => {
        const token = command.opts()["token"] || process.env["YNAB_TOKEN"];
        if (!token) {
            console.error("You have to provide a YNAB token.");
            return process.exit(1);
        }

        const accountName = command.opts()["account"];
        if (!accountName) {
            console.error("You have to provide an account name.");
            return process.exit(1);
        }

        try {
            const file = await fs.readFile(path.resolve(input));
            const reader = new CsvReader(StarmoneySeparators, StarmoneyFields, new StarmoneyMapping(), file.toString('utf-8'));

            const ynabClient = new YnabClient(token, accountName, command.opts()["budget"]);
            await ynabClient.createTransactions([...reader.read()]);
        } catch (err) {
            console.error("Error when pushing: ", err);
            process.exit(1);
        }
    });

program.parse(process.argv);
