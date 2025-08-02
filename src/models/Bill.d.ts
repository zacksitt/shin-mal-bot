import mongoose, { Document } from 'mongoose';
export interface IBill extends Document {
    title: string;
    description?: string;
    totalAmount: number;
    participants: number[];
    createdBy: number;
    createdAt: Date;
    status: 'active' | 'completed';
}
declare const _default: mongoose.Model<IBill, {}, {}, {}, mongoose.Document<unknown, {}, IBill, {}, {}> & IBill & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Bill.d.ts.map