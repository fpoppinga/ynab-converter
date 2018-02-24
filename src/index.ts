#!/usr/bin/env node
import * as program from 'commander';
import {CsvReader} from './io/csvReader';
import {StarmoneyFields, StarmoneyMapping, StarmoneySeparators} from './config/starmoney';
import * as fs from 'mz/fs';
import {YNABConverter} from './io/ynabConverter';
import * as path from 'path';
import {Command} from 'commander';

program
    .version('1.0.0')
    .command('<input> [<output>]', 'parse StarMoney export format and output it as YNAB format.')
    .action(async (input : string, output : string | Command) => {
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
        }
    })
    .parse(process.argv);
