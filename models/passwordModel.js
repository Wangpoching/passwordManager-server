const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
    },
    account: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    passwordHistory: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true  // 建議改用這種寫法
});

module.exports = mongoose.model('password', passwordSchema);
