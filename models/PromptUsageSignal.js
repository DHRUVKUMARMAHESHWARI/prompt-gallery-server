import mongoose from 'mongoose';

const PromptUsageSignalSchema = new mongoose.Schema({
    promptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    signal: {
        type: String,
        enum: ['WORKED', 'DIDNT_WORK', 'NOT_SURE'],
        required: true
    },
    note: {
        type: String,
        maxLength: 500 // Reasonable limit for a "short text"
    }
}, { timestamps: true });

// Index for efficient querying by prompt and preventing duplicate daily entries logic if later needed at DB level
// but requirement says "enforced via logic, not DB lock", so we'll just index for lookups.
PromptUsageSignalSchema.index({ promptId: 1, createdAt: -1 });
PromptUsageSignalSchema.index({ userId: 1, promptId: 1 }); // For checking user's daily usage

export default mongoose.model('PromptUsageSignal', PromptUsageSignalSchema);
