const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
        default: 'Untitled Room',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    code: {
        type: String,
        default: '// Write your code here...',
    },
    language: {
        type: String,
        default: 'javascript',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Room', roomSchema);
