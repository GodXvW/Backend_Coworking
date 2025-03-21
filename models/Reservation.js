const mongoose = require('mongoose');
const Coworking = require('./Coworking');
const ReservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    telephone: {
        type: String,
        required: true
    },
    coworking: {
        type: mongoose.Schema.ObjectId,
        ref: 'Coworking',
        required: true
    },
    resvTime: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderEndSent: {
        type: Boolean,
        default: false // Tracks end-time reminder
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);

