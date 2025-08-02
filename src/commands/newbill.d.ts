import { Context } from 'telegraf';
interface BillData {
    title: string;
    totalAmount: number;
    participants: number[];
    participantNames?: string[];
    payments: {
        userId: number;
        amount: number;
    }[];
}
export declare const userStates: Map<number, {
    step: string;
    billData: BillData;
    billType?: "single" | "multi";
}>;
export declare const newBillCommand: (ctx: Context) => Promise<import("@telegraf/types").Message.TextMessage | undefined>;
export declare const handleBillCreation: (ctx: Context) => Promise<void>;
export declare function calculateBillSplit(billData: BillData): {
    totalAmount: number;
    totalPaid: number;
    perPerson: number;
    results: {
        personNumber: number;
        paid: any;
        shouldPay: number;
        difference: number;
        status: string;
    }[];
    summary: {
        overpaid: {
            personNumber: number;
            paid: any;
            shouldPay: number;
            difference: number;
            status: string;
        }[];
        underpaid: {
            personNumber: number;
            paid: any;
            shouldPay: number;
            difference: number;
            status: string;
        }[];
        exact: {
            personNumber: number;
            paid: any;
            shouldPay: number;
            difference: number;
            status: string;
        }[];
    };
};
export declare function saveBillAndShowResult(ctx: Context, billData: BillData, result: any): Promise<void>;
export {};
//# sourceMappingURL=newbill.d.ts.map