import { BaseInputMapping, CsvReader } from "../src/io/csvReader";
import { YNABField } from "../src/model/ynab";
import * as moment from "moment";
import { DKBFields, DKBMapping, DKBSeparators } from "../src/config/dkb";

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

    it("parses DKB csv", () => {
        const csv = `
            "Kreditkarte:";"xxxx********xxxx";
    
            "Zeitraum:";"letzten 30 Tage";
            "Saldo:";"-15.24 EUR";
            "Datum:";"25.10.2019";
            
            "Umsatz abgerechnet und nicht im Saldo enthalten";"Wertstellung";"Belegdatum";"Beschreibung";"Betrag (EUR)";"UrsprBetrag (EUR)";
            "Nein";"23.10.2019";"22.10.2019";"Ausgleich Kreditkarte gem. Abrechnung v. 22.10.19";"508,70";"";
            "Nein";"23.10.2019";"20.10.2019";"ARAL STATION";"-15,24";"";
            "Ja";"21.10.2019";"19.10.2019";"BIO COMPANY";"-4,48";"";
            "Ja";"21.10.2019";"19.10.2019";"E CENTER";"-53,65";"";
        `;

        const reader = new CsvReader(
            DKBSeparators,
            DKBFields,
            new DKBMapping(),
            csv,
            6
        );

        const iterator = reader.read();

        const records = [...iterator];

        expect(records).toHaveLength(4);
        expect(records[0].date).toEqual(moment("2019-10-22").toDate());
        expect(records[0].inflow).toEqual(508.7);
        expect(records[0].outflow).toEqual(0);
        expect(records[0].memo).toBe(
            "Ausgleich Kreditkarte gem. Abrechnung v. 22.10.19"
        );

        expect(records[1].inflow).toEqual(0);
        expect(records[1].outflow).toEqual(15.24);
        expect(records[1].memo).toBe("ARAL STATION");
    });
});
