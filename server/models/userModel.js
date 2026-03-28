const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false, // Optional for Google Auth users
        minlength: 6,
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true // Allows multiple null/undefined values
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
