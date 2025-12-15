
import Prompt from '../models/Prompt.js';
import Space from '../models/Space.js';
import PromptUsageSignal from '../models/PromptUsageSignal.js';

// @desc    Create a new prompt
// @route   POST /api/prompts/create
// @access  Private
export const createPrompt = async (req, res) => {
    try {
        const { title, content, description, tags, spaceId, variables } = req.body;

        // Check if user is member of space
        const space = await Space.findById(spaceId);
        if (!space) return res.status(404).json({ message: 'Space not found' });

        if (!space.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to post in this space' });
        }

        const prompt = await Prompt.create({
            title,
            content,
            description,
            tags,
            spaceId,
            authorId: req.user._id,
            variables: variables || [],
            version: 1,
            favoritedBy: []
        });

        res.status(201).json({
            id: prompt._id,
            ...prompt._doc,
            isFavorite: false // New prompt is not favorite by default
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prompts by space ID
// @route   GET /api/prompts/:spaceId
// @access  Private
export const getPromptsBySpace = async (req, res) => {
    try {
        const spaceId = req.params.spaceId;

        // Security: Check if user belongs to space
        const space = await Space.findById(spaceId);
        if (!space) return res.status(404).json({ message: 'Space not found' });
        if (!space.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const prompts = await Prompt.find({ spaceId }).sort({ createdAt: -1 });

        // Map prompts to check if current user has favorited them
        const formattedPrompts = prompts.map(p => ({
            id: p._id,
            title: p.title,
            content: p.content,
            description: p.description,
            tags: p.tags,
            spaceId: p.spaceId,
            authorId: p.authorId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            isFavorite: p.favoritedBy.includes(req.user._id), // Compute boolean for frontend
            version: p.version,
            variables: p.variables
        }));

        res.status(200).json(formattedPrompts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle favorite status
// @route   PUT /api/prompts/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        const userId = req.user._id;
        const index = prompt.favoritedBy.indexOf(userId);

        if (index === -1) {
            prompt.favoritedBy.push(userId); // Add favorite
        } else {
            prompt.favoritedBy.splice(index, 1); // Remove favorite
        }

        await prompt.save();

        res.status(200).json({
            id: prompt._id,
            isFavorite: prompt.favoritedBy.includes(userId)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a prompt
// @route   DELETE /api/prompts/:id
// @access  Private
export const deletePrompt = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        // Check ownership or admin status (simplified to owner only for now)
        if (prompt.authorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete' });
        }

        await prompt.deleteOne();
        res.json({ message: 'Prompt removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a prompt
// @route   PUT /api/prompts/:id
// @access  Private
export const updatePrompt = async (req, res) => {
    try {
        const prompt = await Prompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        const updatedPrompt = await Prompt.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );

        res.status(200).json({
            id: updatedPrompt._id,
            ...updatedPrompt._doc,
            isFavorite: updatedPrompt.favoritedBy.includes(req.user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit usage signal
// @route   POST /api/prompts/:id/usage-signal
// @access  Private
export const submitUsageSignal = async (req, res) => {
    try {
        const { signal, note } = req.body;
        const promptId = req.params.id;
        const userId = req.user._id;

        // Validate prompt
        const prompt = await Prompt.findById(promptId);
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        // Logic Rule: One signal per user per prompt per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existingSignal = await PromptUsageSignal.findOne({
            promptId,
            userId,
            createdAt: { $gte: startOfDay }
        });

        if (existingSignal) {
            return res.status(400).json({ message: 'You have already submitted a signal for this prompt today' });
        }

        // Create signal
        await PromptUsageSignal.create({
            promptId,
            userId,
            signal,
            note
        });

        // Return updated stats
        const stats = await PromptUsageSignal.aggregate([
            { $match: { promptId: prompt._id } },
            {
                $group: {
                    _id: "$signal",
                    count: { $sum: 1 },
                    lastWorkedAt: { $max: { $cond: [{ $eq: ["$signal", "WORKED"] }, "$createdAt", null] } }
                }
            }
        ]);

        const summary = {
            worked: 0,
            didntWork: 0,
            lastWorkedAt: null
        };

        stats.forEach(stat => {
            if (stat._id === 'WORKED') {
                summary.worked = stat.count;
                summary.lastWorkedAt = stat.lastWorkedAt;
            } else if (stat._id === 'DIDNT_WORK') {
                summary.didntWork = stat.count;
            }
        });

        res.status(201).json(summary);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get usage summary
// @route   GET /api/prompts/:id/usage-summary
// @access  Private
export const getUsageSummary = async (req, res) => {
    try {
        const promptId = req.params.id;
        const prompt = await Prompt.findById(promptId);
        if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

        const stats = await PromptUsageSignal.aggregate([
            { $match: { promptId: prompt._id } },
            {
                $group: {
                    _id: "$signal",
                    count: { $sum: 1 },
                    lastWorkedAt: { $max: { $cond: [{ $eq: ["$signal", "WORKED"] }, "$createdAt", null] } }
                }
            }
        ]);

        const summary = {
            worked: 0,
            didntWork: 0,
            lastWorkedAt: null
        };

        stats.forEach(stat => {
            if (stat._id === 'WORKED') {
                summary.worked = stat.count;
                summary.lastWorkedAt = stat.lastWorkedAt;
            } else if (stat._id === 'DIDNT_WORK') {
                summary.didntWork = stat.count;
            }
        });

        res.status(200).json(summary);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get usage history
// @route   GET /api/prompts/:id/usage-history
// @access  Private
export const getUsageHistory = async (req, res) => {
    try {
        const promptId = req.params.id;

        const history = await PromptUsageSignal.find({ promptId })
            .select('signal note createdAt -_id')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(history);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
