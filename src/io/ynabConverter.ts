import { IReader } from "./reader";
import { YNABRecord } from "../model/ynab";
import * as moment from "moment";

export class YNABConverter {
    constructor(private reader: IReader, private ignorePayee: boolean = true) {}

    async convert(): Promise<string> {
        const lines = [];
        lines.push(this.preamble);

        for (const record of this.reader.read()) {
            lines.push(this.serializeRecord(record));
        }

        return lines.join("\n");
    }

    private get preamble(): string {
        return "Date,Payee,Category,Memo,Outflow,Inflow";
    }

    private get separator(): string {
        return ",";
    }

    private serializeRecord(record: YNABRecord): string {
        return [
            moment(record.date).format("DD/MM/YYYY"),
            this.ignorePayee ? "" : record.payee,
            record.category,
            record.memo,
            this.formatAmount(record.outflow),
            this.formatAmount(record.inflow)
        ]
            .map(v => v.replace(new RegExp(this.separator, "g"), ""))
            .join(this.separator);
    }

    private formatAmount(amount: number): string {
        if (isNaN(amount)) {
            return "";
        }

        return amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}
