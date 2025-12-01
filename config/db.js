import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URL) {
            console.log('No MONGO_URL found, skipping DB connection (Test Mode)');
            return;
        }
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;