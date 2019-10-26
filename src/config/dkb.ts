import { BaseInputMapping, FieldMapping, Separators } from "../io/csvReader";
import { YNABField } from "../model/ynab";
import * as moment from "moment";

export class DKBMapping extends BaseInputMapping {
    date(input: string): Date {
        return moment(input, "DD.MM.YYYY").toDate();
    }

    outflow(input: string): number {
        const euros = parseFloat(input.replace(",", "."));
        return euros < 0 ? Math.abs(euros) : 0;
    }

    inflow(input: string): number {
        const euros = parseFloat(input.replace(",", "."));
        return euros > 0 ? euros : 0;
    }
}

export const DKBFields: FieldMapping<string> = new Map<YNABField, string>([
    ["date", "Belegdatum"],
    ["memo", "Beschreibung"],
    ["category", ""],
    ["payee", ""],
    ["inflow", "Betrag (EUR)"],
    ["outflow", "Betrag (EUR)"]
]);

export const DKBSeparators: Separators = {
    lineSeparator: "\n",
    valueSeparator: ";",
    quote: '"'
};
