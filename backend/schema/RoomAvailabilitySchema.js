const mongoose = require('mongoose');

const RoomAvailabilitySchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    room_number: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    under_maintenance: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    highlight: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,  // URL or file path for the room image
        default: ""
    },
    date: {
        type: String, // Format: 'YYYY-MM-DD'
        required: true
    },
    timeslots: {
        type: Map,
        of: Boolean,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RoomAvailability', RoomAvailabilitySchema);
