
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['JOIN', 'SYSTEM', 'INFO'], default: 'INFO' },
    read: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
