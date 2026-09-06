const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // We default to 'user'. You can change this to 'admin' or 'hr' manually in MongoDB for specific staff.
    role: { type: String, enum: ['admin', 'hr', 'user'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = mongoose.model('User', userSchema);