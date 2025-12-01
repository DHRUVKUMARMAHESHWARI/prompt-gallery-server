
import Space from '../models/Space.js';
import Prompt from '../models/Prompt.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';

// @desc    Create a new space (group)
// @route   POST /api/groups/create
// @access  Private
export const createSpace = async (req, res) => {
    try {
        const { name, type, description } = req.body;
        
        let joinCode = null;
        if (type === 'TEAM' || type === 'PUBLIC') {
            joinCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
        }

        const space = await Space.create({
            name,
            type,
            description,
            joinCode,
            createdBy: req.user._id,
            members: [req.user._id],
            icon: 'Folder',
            color: 'text-neon-blue'
        });

        res.status(201).json({
            id: space._id,
            name: space.name,
            type: space.type,
            description: space.description,
            joinCode: space.joinCode,
            memberCount: space.members.length,
            promptCount: 0,
            role: 'OWNER',
            icon: space.icon,
            color: space.color
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a space via code
// @route   POST /api/groups/join
// @access  Private
export const joinSpace = async (req, res) => {
    try {
        const { groupCode } = req.body;
        
        const space = await Space.findOne({ joinCode: groupCode });
        
        if (!space) {
            return res.status(404).json({ message: 'Invalid Join Code' });
        }

        if (space.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already a member of this space' });
        }

        // Add member
        space.members.push(req.user._id);
        await space.save();

        // 1. Notify Owner (if the joiner is not the owner)
        if (space.createdBy.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: space.createdBy,
                message: `${req.user.name} joined your space "${space.name}"`,
                type: 'JOIN'
            });
        }

        // 2. Notify the Joiner (Confirmation)
        await Notification.create({
            recipient: req.user._id,
            message: `You successfully joined the space "${space.name}"`,
            type: 'INFO'
        });

        res.status(200).json({
            id: space._id,
            name: space.name,
            type: space.type,
            description: space.description,
            joinCode: space.joinCode,
            memberCount: space.members.length,
            promptCount: 0, // In real app, agg this
            role: 'MEMBER',
            icon: space.icon,
            color: space.color
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all spaces for the user
// @route   GET /api/groups/my-groups
// @access  Private
export const getMySpaces = async (req, res) => {
    try {
        const spaces = await Space.find({ members: req.user._id });
        
        const formattedSpaces = spaces.map(space => ({
            id: space._id,
            name: space.name,
            type: space.type,
            description: space.description,
            joinCode: space.joinCode,
            memberCount: space.members.length,
            promptCount: 0, // Placeholder
            role: space.createdBy.toString() === req.user._id.toString() ? 'OWNER' : 'MEMBER',
            icon: space.icon,
            color: space.color
        }));

        res.status(200).json(formattedSpaces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single space (middleware checks access)
// @route   GET /api/groups/:id
// @access  Private
export const getSpaceById = async (req, res) => {
    const space = await Space.findById(req.params.id);
    if(space && space.members.includes(req.user._id)) {
        res.json(space);
    } else {
        res.status(404).json({message: 'Space not found or access denied'});
    }
}

// @desc    Update a space
// @route   PUT /api/groups/:id
// @access  Private
export const updateSpace = async (req, res) => {
    try {
        const space = await Space.findById(req.params.id);

        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // Only owner can update details
        if (space.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this space' });
        }

        space.name = req.body.name || space.name;
        space.description = req.body.description || space.description;
        
        if (req.body.type) space.type = req.body.type;

        await space.save();

        res.status(200).json({
            id: space._id,
            name: space.name,
            type: space.type,
            description: space.description,
            joinCode: space.joinCode,
            memberCount: space.members.length,
            promptCount: 0,
            role: 'OWNER',
            icon: space.icon,
            color: space.color
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a space
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteSpace = async (req, res) => {
    try {
        const space = await Space.findById(req.params.id);

        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // Only owner can delete
        if (space.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this space' });
        }

        // Delete all prompts associated with this space
        await Prompt.deleteMany({ spaceId: space._id });

        // Delete the space
        await space.deleteOne();

        res.status(200).json({ message: 'Space deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
