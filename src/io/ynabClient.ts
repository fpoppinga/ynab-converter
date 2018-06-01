import * as crypto from "crypto";
import { api as YNABApi, SaveTransaction } from "ynab";
import { YNABRecord } from "../model/ynab";

export class YnabClient {
    private api: YNABApi;
    private _accountId: string | null = null;

    constructor(
        private appToken: string,
        private accountName: string,
        private budgetId: string | null = null
    ) {
        this.api = new YNABApi(appToken);
    }

    async createTransactions(transactions: Array<YNABRecord>): Promise<void> {
        try {
            const budgetId = await this.getBudgetId();

            const response = await this.api.transactions.bulkCreateTransactions(
                budgetId,
                {
                    transactions: await Promise.all(
                        transactions.map(t => this.convertTransaction(t))
                    )
                }
            );

            console.info("response: ", response);
        } catch (e) {
            console.error("Error when creating transactions: ", e);
        }
    }

    private async getBudgetId(): Promise<string> {
        if (this.budgetId) {
            return this.budgetId;
        }

        const response = await this.api.budgets.getBudgets();

        return response.data.budgets.sort((a, b) => {
            if (!a.last_modified_on || !b.last_modified_on) {
                return 0;
            }

            return a.last_modified_on.localeCompare(b.last_modified_on);
        })[0].id;
    }

    private async getAccountId(name: string): Promise<string> {
        if (this._accountId) {
            return this._accountId;
        }

        const accounts = await this.api.accounts.getAccounts(
            await this.getBudgetId()
        );

        const matchingAccounts = accounts.data.accounts.filter(a =>
            RegExp(name, "i").test(a.name)
        );
        if (matchingAccounts.length > 1) {
            console.error(
                "Account name is ambiguos. Candidates: ",
                matchingAccounts.map(a => a.name)
            );
            throw new Error("AMBIGUOUS_ACCOUNT");
        }

        const matchingAccount = matchingAccounts[0];

        if (!matchingAccount) {
            console.error(
                "Can't find a matching account! Possibilities:",
                accounts.data.accounts.map(a => a.name)
            );
            throw new Error("NO_MATCHING_ACCOUNT");
        }

        this._accountId = matchingAccount.id;
        return matchingAccount.id;
    }

    private async convertTransaction(t: YNABRecord): Promise<SaveTransaction> {
        const amount = (t.inflow - t.outflow) * 1e3;
        const date = t.date.toISOString();
        const hash = crypto
            .createHash("sha256")
            .update(t.memo)
            .digest("hex");

        return {
            account_id: await this.getAccountId(this.accountName),
            date,
            amount,
            memo: t.memo.slice(0, 100),
            cleared: SaveTransaction.ClearedEnum.Cleared,
            import_id: (date + ":" + amount + ":" + hash).substring(0, 36)
        };
    }
}