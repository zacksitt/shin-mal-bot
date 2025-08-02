import mongoose, { Document } from 'mongoose';
export interface IPayment extends Document {
    billId: mongoose.Types.ObjectId;
    userId: number;
    amount: number;
    description?: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Payment.d.ts.map