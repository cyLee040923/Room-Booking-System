// scheduler.js
const cron = require('node-cron');
const { connectToDB } = require('./db');

// Move the releaseBooking function from bookings.js to here so it can be shared
const releaseBooking = async (db, booking) => {
    try {
        // First, get the room availability record
        const availabilityRecord = await db.collection("roomAvailability").findOne({
            roomId: booking.roomId,
            date: booking.date
        });

        if (availabilityRecord) {
            // Update each timeslot individually
            const updateObj = {};
            booking.timeslots.forEach(slot => {
                updateObj[`timeslots.${slot}`] = true;
            });

            await db.collection("roomAvailability").updateOne(
                { _id: availabilityRecord._id },
                { 
                    $set: {
                        ...updateObj,
                        lastUpdated: new Date()
                    }
                }
            );
        }

        // Update booking status (instead of deleting)
        await db.collection("bookings").updateOne(
            { _id: booking._id },
            { 
                $set: { 
                    status: 'expired',
                    updatedAt: new Date()
                } 
            }
        );

        // Update user's booking history
        await db.collection("users").updateOne(
            { _id: booking.userId },
            { 
                $set: { 
                    "bookingHistory.$[elem].status": 'expired',
                    "bookingHistory.$[elem].updatedAt": new Date()
                }
            },
            {
                arrayFilters: [{ "elem.bookingId": booking._id }]
            }
        );

        return true;
    } catch (error) {
        console.error('Error in releaseBooking:', error);
        throw error;
    }
};

const checkExpiredBookings = async () => {
    let db;
    try {
        db = await connectToDB();
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        // Find all expired pending payment bookings
        const expiredBookings = await db.collection("bookings").find({
            status: 'pending payment',
            createdAt: { $lt: fifteenMinutesAgo }
        }).toArray();

        for (const booking of expiredBookings) {
            try {
                await releaseBooking(db, booking);
                console.log(`Automatically expired booking ${booking._id}`);
            } catch (error) {
                console.error(`Error processing expired booking ${booking._id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in checkExpiredBookings:', error);
    } finally {
        if (db) await db.client.close();
    }
};

// Run every minute
cron.schedule('* * * * *', checkExpiredBookings);

module.exports = { releaseBooking };