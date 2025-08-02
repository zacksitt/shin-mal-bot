import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  billId: mongoose.Types.ObjectId;
  userId: number; // Telegram user ID
  amount: number;
  description?: string;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
  userId: { type: Number, required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema); 