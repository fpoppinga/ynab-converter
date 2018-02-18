import {YNABConverter} from '../src/io/ynabConverter';
import {IReader, MockReader} from '../src/io/reader';
import * as moment from 'moment';

function assertCsv(line: string, expected: string[]) {
    const entries = line.split(",");
    expect(entries).toEqual(expected);
}

function getMockReader(): IReader {
    return new MockReader([{
        date: moment('2017-02-01').toDate(),
        payee: "PAYEE",
        category: "CATEGORY",
        memo: "MEMO",
        outflow: 32.99,
        inflow: 19.99
    }, {
        date: moment('2017-02-01').toDate(),
        payee: "PAYEE",
        category: "CATEGORY",
        memo: "MEMO",
        outflow: 32.99,
        inflow: NaN
    }]);
}

describe("YNABConverter", () => {
    it("converts empty input", async () => {
        const reader = new MockReader([]);
        jest.spyOn(reader, "read");
        const converter = new YNABConverter(reader);

        const result = await converter.convert();

        expect(reader.read).toHaveBeenCalled();

        expect(result).toEqual("Date,Payee,Category,Memo,Outflow,Inflow");
    });

    it("correctly converts record lines", async () => {
        const reader = getMockReader();
        const converter = new YNABConverter(reader, false);
        const result = await converter.convert();

        const lines = result.split("\n");
        expect(lines.length).toBe(3);

        assertCsv(lines[1], ["01/02/2017", "PAYEE", "CATEGORY", "MEMO", "32.99", "19.99"]);
        assertCsv(lines[2], ["01/02/2017", "PAYEE", "CATEGORY", "MEMO", "32.99", ""]);
    });

    it("can ignore the payee", async () => {
        const reader = getMockReader();
        const converter = new YNABConverter(reader, true);
        const result = await converter.convert();

        const lines = result.split("\n");
        expect(lines.length).toBe(3);

        assertCsv(lines[1], ["01/02/2017", "", "CATEGORY", "MEMO", "32.99", "19.99"]);
        assertCsv(lines[2], ["01/02/2017", "", "CATEGORY", "MEMO", "32.99", ""]);
    });
});
