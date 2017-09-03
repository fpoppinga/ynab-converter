import {YNABRecord} from '../model/ynab';

export interface IReader {
    read(): IterableIterator<YNABRecord>
}

export class MockReader implements IReader {
    constructor(private records: YNABRecord[]) {}

    *read() : IterableIterator<YNABRecord> {
        for (const record of this.records) {
            yield record;
        }
    }
}
