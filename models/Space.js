import mongoose from 'mongoose';

const SpaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['PRIVATE', 'TEAM', 'PUBLIC'], default: 'PRIVATE' },
    description: String,
    joinCode: { type: String }, // For TEAM spaces
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    icon: { type: String, default: 'Folder' },
    color: { type: String, default: 'text-white' }
}, { timestamps: true });

export default mongoose.model('Space', SpaceSchema);