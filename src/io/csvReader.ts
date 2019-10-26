import { IReader } from "./reader";
import { YNABField, YNABRecord } from "../model/ynab";
import * as moment from "moment";

export interface IInputMapping {
    date(input: string): Date;
    payee(input: string): string;
    category(input: string): string;
    memo(input: string): string;
    outflow(input: string): number;
    inflow(input: string): number;
}

export class BaseInputMapping implements IInputMapping {
    date(input: string): Date {
        return moment(input).toDate();
    }

    payee(input: string): string {
        return input;
    }

    category(input: string): string {
        return input;
    }

    memo(input: string): string {
        return input;
    }

    outflow(input: string): number {
        return Number(input);
    }

    inflow(input: string): number {
        return Number(input);
    }
}

export type FieldMapping<T> = Map<YNABField, T>;

export interface Separators {
    lineSeparator: string;
    valueSeparator: string;
    quote?: string;
}

function trim(x: string, c: string | undefined): string {
    if (!c) return x;

    let res = x;
    while (res.startsWith(c)) {
        res = res.substr(1);
    }

    while (res.endsWith(c)) {
        res = res.substr(0, res.length - 1);
    }

    return res;
}

export class CsvReader implements IReader {
    constructor(
        private separators: Separators,
        private fieldMapping: FieldMapping<string>,
        private inputMapping: IInputMapping,
        private text: string,
        private skipLines: number = 0
    ) {}

    *read(): IterableIterator<YNABRecord> {
        const lines = this.text
            .trim()
            .split(this.separators.lineSeparator)
            .slice(this.skipLines);

        const fieldMapping = this.calculateFieldIndices(
            lines[0]
                .split(this.separators.valueSeparator)
                .map(l => trim(l.trim(), this.separators.quote))
        );

        for (const line of lines.slice(1)) {
            yield this.toRecord(
                line
                    .split(this.separators.valueSeparator)
                    .map(l => trim(l.trim(), this.separators.quote)),
                fieldMapping
            );
        }
    }

    private calculateFieldIndices(fieldNames: string[]): FieldMapping<number> {
        const result: FieldMapping<number> = new Map();

        for (const entry of this.fieldMapping.entries()) {
            result.set(entry[0], fieldNames.indexOf(entry[1]));
        }

        return result;
    }

    private getField<FIELD extends YNABField>(
        fieldName: FIELD,
        fieldsValues: string[],
        fieldMapping: FieldMapping<number>
    ): YNABRecord[FIELD] {
        const index = fieldMapping.get(fieldName);
        if (typeof index === "undefined") {
            throw new Error("FieldMapping is incomplete!");
        }

        return this.inputMapping[fieldName](fieldsValues[index]);
    }

    private toRecord(
        fieldsValues: string[],
        fieldMapping: FieldMapping<number>
    ): YNABRecord {
        return {
            date: this.getField("date", fieldsValues, fieldMapping),
            payee: this.getField("payee", fieldsValues, fieldMapping),
            memo: this.getField("memo", fieldsValues, fieldMapping),
            category: this.getField("category", fieldsValues, fieldMapping),
            outflow: this.getField("outflow", fieldsValues, fieldMapping),
            inflow: this.getField("inflow", fieldsValues, fieldMapping)
        };
    }
}
