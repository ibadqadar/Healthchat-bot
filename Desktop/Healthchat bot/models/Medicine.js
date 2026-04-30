const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    uses: {
        type: [String],
        required: true
    },
    precautions: {
        type: [String],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
