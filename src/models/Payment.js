import mongoose, { Schema, Document } from 'mongoose';
const PaymentSchema = new Schema({
    billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    userId: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Payment', PaymentSchema);
//# sourceMappingURL=Payment.js.map