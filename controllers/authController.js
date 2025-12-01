
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Helper to check and reset credits
const checkAndResetCredits = async (user) => {
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    
    // Check if it's a different day
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
        
        user.aiCredits = 20; // Daily Limit
        user.lastCreditReset = now;
        await user.save();
    }
    return user;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            aiCredits: 20
        });

        if (user) {
            res.status(201).json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    aiCredits: user.aiCredits
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check for daily reset
            user = await checkAndResetCredits(user);

            res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    aiCredits: user.aiCredits
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    // Check for daily reset on profile fetch
    const user = await checkAndResetCredits(req.user);

    const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        aiCredits: user.aiCredits
    };
    res.status(200).json(userData);
};

// @desc    Deduct 1 AI Credit
// @route   POST /api/auth/deduct-credit
// @access  Private
export const deductCredit = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Double check reset just in case
        await checkAndResetCredits(user);

        if (user.aiCredits > 0) {
            user.aiCredits -= 1;
            await user.save();
            res.json({ success: true, aiCredits: user.aiCredits });
        } else {
            res.status(403).json({ message: 'Daily AI limit reached (20/20). Try again tomorrow.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Reward AI Credits (Internal/Game)
// @route   POST /api/auth/reward-credit
// @access  Private
export const rewardCredit = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user._id);
        
        // Cap usage or validation could go here
        if (amount > 0 && amount <= 10) { // Max 10 credits per reward call for safety
             user.aiCredits += amount;
             await user.save();
             res.json({ success: true, aiCredits: user.aiCredits });
        } else {
             res.status(400).json({ message: 'Invalid reward amount' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}