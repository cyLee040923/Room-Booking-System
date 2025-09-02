const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userMobile: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required
    },
    bookingDate: {
        type: String, // Format: 'YYYY-MM-DD'
        required: true
    },
    timeslots: {
        type: [String], // Array of booked times
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentProof: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);