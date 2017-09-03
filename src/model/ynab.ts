export interface YNABRecord {
    date: Date;
    payee: string;
    category: string;
    memo: string;
    outflow: number;
    inflow: number;
}

export type YNABField = keyof YNABRecord;
