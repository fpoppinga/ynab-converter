import * as moment from "moment";
import { BaseInputMapping, FieldMapping, Separators } from "../io/csvReader";
import { YNABField } from "../model/ynab";

export class StarmoneyMapping extends BaseInputMapping {
    date(input: string): Date {
        return moment.utc(input, "YYYY-MM-DD").toDate();
    }

    outflow(input: string): number {
        const cents = parseInt(input, 10);
        return cents < 0 ? Math.abs(cents) / 100 : 0;
    }

    inflow(input: string): number {
        const cents = parseInt(input, 10);
        return cents > 0 ? cents / 100 : 0;
    }
}

export const StarmoneyFields: FieldMapping<string> = new Map<YNABField, string>(
    [
        ["date", "Wertstellungsdatum"],
        ["memo", "VWZ 1"],
        ["category", "Kategorie"],
        ["payee", ""],
        ["inflow", "Betrag"],
        ["outflow", "Betrag"]
    ]
);

export const StarmoneySeparators: Separators = {
    lineSeparator: "\n",
    valueSeparator: ";"
};
