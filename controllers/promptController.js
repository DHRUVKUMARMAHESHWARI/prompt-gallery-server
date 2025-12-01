
import Prompt from '../models/Prompt.js';
import Space from '../models/Space.js';

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
