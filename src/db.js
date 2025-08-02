import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in .env');
}
export const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    }
    catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
//# sourceMappingURL=db.js.map