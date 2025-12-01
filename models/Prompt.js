
import mongoose from 'mongoose';

const PromptSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    description: String,
    tags: [String],
    spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who favorited this
    version: { type: Number, default: 1 },
    variables: [String]
}, { timestamps: true });

export default mongoose.model('Prompt', PromptSchema);
