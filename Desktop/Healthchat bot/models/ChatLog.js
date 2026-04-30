const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    user_message: {
        type: String,
        required: true
    },
    bot_response: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatLog', chatLogSchema);
