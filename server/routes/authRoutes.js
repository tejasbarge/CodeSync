const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Google Login/Signup Route
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Try to find the user by email
        let user = await User.findOne({ email });

        if (!user) {
            // If new user, create an account without a password
            const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
            user = new User({
                username,
                email,
                googleId,
            });
            await user.save();
        } else if (!user.googleId) {
            // If user exists (registered via email) but no googleId, link them
            user.googleId = googleId;
            await user.save();
        }

        // Generate our own JWT system token
        const jwtToken = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ message: 'Google authentication failed. Please try again.' });
    }
});

module.exports = router;
