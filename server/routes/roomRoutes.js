const express = require('express');
const router = express.Router();
const Room = require('../models/roomModel');
const authMiddleware = require('../middleware/authMiddleware');

// Check if a room exists and get its name (for auto-fill in Lobby)
router.get('/check/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });
        if (room) {
            return res.json({ exists: true, name: room.name });
        }
        res.json({ exists: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all rooms for a specific user (Created or Joined)
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const rooms = await Room.find({
            $or: [{ creator: userId }, { members: userId }]
        }).sort({ updatedAt: -1 });

        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get or Create a room by ID
router.get('/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { name } = req.query;
        let room = await Room.findOne({ roomId });

        if (!room) {
            // If room doesn't exist, create it (default state)
            room = new Room({
                roomId,
                name: name || 'Untitled Room',
                creator: req.user.userId,
                members: [req.user.userId],
            });
            await room.save();
        } else {
            // If it exists, add user to members if not already there
            if (!room.members.includes(req.user.userId)) {
                room.members.push(req.user.userId);
                await room.save();
            }
        }

        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save room state (Code & Language)
router.post('/save', authMiddleware, async (req, res) => {
    try {
        const { roomId, code, language } = req.body;
        const room = await Room.findOneAndUpdate(
            { roomId },
            { code, language },
            { returnDocument: 'after', upsert: true }
        );

        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a room
router.delete('/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Only creator can delete
        if (room.creator.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this room' });
        }

        await Room.deleteOne({ roomId });
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
