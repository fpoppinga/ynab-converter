import { BaseInputMapping, CsvReader } from "../src/io/csvReader";
import { YNABField } from "../src/model/ynab";
import * as moment from "moment";

describe("CSVReader", () => {
    it("parses base csv", () => {
        const csv = `
            Date,Payee,Category,Memo,Outflow,Inflow
            2017-01-02,PAYEE,CATEGORY,MEMO,39.99,19.99
        `;

        const reader = new CsvReader(
            {
                lineSeparator: "\n",
                valueSeparator: ","
            },
            new Map<YNABField, string>([
                ["date", "Date"],
                ["payee", "Payee"],
                ["category", "Category"],
                ["memo", "Memo"],
                ["outflow", "Outflow"],
                ["inflow", "Inflow"]
            ]),
            new BaseInputMapping(),
            csv
        );

        const iterator = reader.read();

        const first = iterator.next();
        expect(first.value).toEqual({
            date: moment("2017-01-02").toDate(),
            category: "CATEGORY",
            payee: "PAYEE",
            memo: "MEMO",
            outflow: 39.99,
            inflow: 19.99
        });
    });
});
