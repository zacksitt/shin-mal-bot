import mongoose, { Schema, Document } from 'mongoose';

export interface IBill extends Document {
  title: string;
  description?: string;
  totalAmount: number;
  participants: number[]; // Telegram user IDs
  createdBy: number; // Telegram user ID
  createdAt: Date;
  status: 'active' | 'completed';
}

const BillSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  totalAmount: { type: Number, required: true, min: 0 },
  participants: [{ type: Number, required: true }], // Telegram user IDs
  createdBy: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

export default mongoose.model<IBill>('Bill', BillSchema); 