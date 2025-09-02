var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const { verifyToken } = require('../utils/auth');
const { releaseBooking } = require('../utils/scheduler');

// Generate default timeslots
const generateDefaultTimeslots = () => {
    const timeslots = {};
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        timeslots[`${hour}:00`] = true;
    }
    return timeslots;
};


// Create bookings when clicked 'Book Now'
router.post('/create', verifyToken, async (req, res) => {
    let db;
    try {
        db = await connectToDB();
        const bookingId = new ObjectId();
        const { 
            roomId,roomName,roomNumber,date,timeslots,totalPrice,userId,username,userContact,userEmail,participant
        } = req.body;

        // Verify user exists and authorization
        const user = await db.collection("users").findOne({ 
            $or: [
                { _id: new ObjectId(userId) }, { _id: userId }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const requestUserId = req.user._id.toString();
        const bookingUserId = user._id.toString();

        if (bookingUserId !== requestUserId) {
            return res.status(403).json({ message: 'Unauthorized booking attempt' });
        }

        // Validate required fields
        if (!roomId || !date || !timeslots || !timeslots.length) {
            return res.status(400).json({ message: 'Missing required booking information' });
        }

        // Check room availability
        let availabilityRecord = await db.collection("roomAvailability").findOne({ 
            roomId: new ObjectId(roomId), date 
        });

        // If no availability record exists, create one with all slots available
        if (!availabilityRecord) {
            availabilityRecord = {
                roomId: new ObjectId(roomId),
                roomName,
                date,
                timeslots: generateDefaultTimeslots(),
                lastUpdated: new Date()
            };
            const result = await db.collection("roomAvailability").insertOne(availabilityRecord);
            availabilityRecord._id = result.insertedId;
        }

        // Check if requested timeslots are available
        const unavailableSlots = timeslots.filter(slot => !availabilityRecord.timeslots[slot]);
        
        if (unavailableSlots.length > 0) {
            return res.status(400).json({
                message: 'Some timeslots are not available',
                unavailableSlots
            });
        }

        // Verify timeslots are consecutive
        const sortedTimeslots = timeslots.sort((a, b) => {
            const timeA = parseInt(a.split(':')[0]);
            const timeB = parseInt(b.split(':')[0]);
            return timeA - timeB;
        });

        for (let i = 1; i < sortedTimeslots.length; i++) {
            const prevHour = parseInt(sortedTimeslots[i-1].split(':')[0]);
            const currHour = parseInt(sortedTimeslots[i].split(':')[0]);
            if (currHour !== prevHour + 1) {
                return res.status(400).json({ 
                    message: 'Selected timeslots must be consecutive' 
                });
            }
        }

        // Update room availability - mark selected slots as unavailable
        const updateObj = {};
        sortedTimeslots.forEach(slot => {
            updateObj[`timeslots.${slot}`] = false;
        });

        const availabilityUpdateResult = await db.collection("roomAvailability").updateOne(
            { _id: availabilityRecord._id },
            { 
                $set: {
                    ...updateObj,
                    lastUpdated: new Date()
                }
            }
        );

        if (availabilityUpdateResult.modifiedCount === 0) {
            return res.status(500).json({ 
                message: 'Failed to update room availability' 
            });
        }

        // Create booking record
        const booking = {
            _id: bookingId,
            roomId: new ObjectId(roomId),
            roomName,
            roomNumber,
            userId: new ObjectId(userId),
            username,
            userContact,
            userEmail,
            date,
            timeslots: sortedTimeslots,
            participant,
            totalPrice,
            paymentProof: null,
            paymentMethod: null,
            status: 'pending payment',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection("bookings").insertOne(booking);

        // Create user booking history record
        const userBookingRecord = {
            bookingId: bookingId,
            roomId: new ObjectId(roomId),
            roomName,
            roomNumber,
            date,
            timeslots: sortedTimeslots,
            participant,
            totalPrice,
            paymentProof: null,
            paymentMethod: null,
            status: 'pending payment',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $push: { bookingHistory: userBookingRecord } }
        );

        // Start the 15-minute timer for this booking
        const timerExpiry = new Date(Date.now() + 15 * 60 * 1000);
        
        return res.status(201).json({
            message: 'Booking created successfully',
            booking: {
                ...booking,
                timerExpiry: timerExpiry.toISOString()
            }
        });

    } catch (error) {
        console.error('Booking error:', error);
        // If error occurs, attempt to rollback any changes
        if (db) {
            try {
                // Rollback room availability if it was updated
                if (availabilityRecord && sortedTimeslots) {
                    const rollbackObj = {};
                    sortedTimeslots.forEach(slot => {
                        rollbackObj[`timeslots.${slot}`] = true;
                    });
                    
                    await db.collection("roomAvailability").updateOne(
                        { _id: availabilityRecord._id },
                        { $set: rollbackObj }
                    );
                }
                // Delete booking if it was created
                if (bookingId) {
                    await db.collection("bookings").deleteOne({ _id: bookingId });
                    await db.collection("users").updateOne(
                        { _id: new ObjectId(userId) },
                        { $pull: { bookingHistory: { bookingId: bookingId } } }
                    );
                }
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        return res.status(500).json({ message: error.message });
    } finally {
        if (db) await db.client.close();
    }
});

router.patch('/update/:id', verifyToken, async (req, res) => {
    let db;
    try {
        db = await connectToDB();
        const { paymentMethod, paymentProof } = req.body;
        const bookingId = req.params.id;

        // Find existing booking
        const booking = await db.collection("bookings").findOne({
            _id: new ObjectId(bookingId)
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify user authorization
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if booking is still in pending payment status
        if (booking.status !== 'pending payment') {
            return res.status(400).json({ 
                message: 'Cannot update booking - payment already processed' 
            });
        }

        // Check if booking has expired (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (booking.createdAt < fifteenMinutesAgo) {
            // Release the room availability
            await db.collection("roomAvailability").updateOne(
                { 
                    roomId: booking.roomId,
                    date: booking.date
                },
                { 
                    $set: booking.timeslots.reduce((acc, slot) => {
                        acc[`timeslots.${slot}`] = true;
                        return acc;
                    }, {})
                }
            );

            return res.status(400).json({ 
                message: 'Booking has expired. Please create a new booking.' 
            });
        }

        // Determine new status based on payment method
        const newStatus = paymentMethod === 'paypal' ? 'confirmed' : 'pending approval';

        // Update booking status
        const bookingUpdateResult = await db.collection("bookings").updateOne(
            { _id: new ObjectId(bookingId) },
            { 
                $set: { 
                    status: newStatus,
                    paymentMethod,
                    paymentProof,
                    updatedAt: new Date()
                } 
            }
        );

        if (bookingUpdateResult.modifiedCount === 0) {
            return res.status(400).json({ 
                message: 'Failed to update booking status' 
            });
        }

        // Update user's booking history
        const userUpdateResult = await db.collection("users").updateOne(
            { 
                _id: booking.userId,
                "bookingHistory.bookingId": new ObjectId(bookingId)
            },
            { 
                $set: { 
                    "bookingHistory.$.status": newStatus,
                    "bookingHistory.$.paymentMethod": paymentMethod,
                    "bookingHistory.$.paymentProof": paymentProof,
                    "bookingHistory.$.updatedAt": new Date()
                } 
            }
        );

        if (userUpdateResult.modifiedCount === 0) {
            // Rollback booking update if user history update fails
            await db.collection("bookings").updateOne(
                { _id: new ObjectId(bookingId) },
                { 
                    $set: { 
                        status: 'pending payment',
                        paymentMethod: null,
                        paymentProof: null,
                        updatedAt: new Date()
                    } 
                }
            );
            return res.status(400).json({ 
                message: 'Failed to update booking status in user history' 
            });
        }

        res.json({
            message: 'Payment processed successfully',
            booking: {
                ...booking,
                status: newStatus,
                paymentMethod,
                paymentProof,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        if (db) await db.client.close();
    }
});

// Get all bookings
router.get('/', async (req, res) => {
    const db = await connectToDB();
    try {
        const results = await db.collection("bookings").find({
            status: { $ne: 'expired' } // Exclude expired bookings
        }).toArray();
        res.json(results)
    } catch (error) {
        console.error('Get bookings error:', error);
    } finally {
        await db.client.close();
    }
});     

// Get booking by ID
router.get('/:id', verifyToken, async (req, res) => {
    const db = await connectToDB();
    try {
        const bookingId = req.params.id;
        const userId = req.user._id;
        const isAdmin = req.user.isAdmin; // Make sure this matches how you store admin status

        const booking = await db.collection("bookings").findOne({ 
            _id: new ObjectId(bookingId),
            status: { $ne: 'expired' } // Exclude expired bookings
        });
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If user is admin, allow access to all bookings
        // If not admin, only allow access to their own bookings
        if (!isAdmin && booking.userId.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'You do not have permission to view this booking' 
            });
        }
        
        res.json(booking);

    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await db.client.close();
    }
});


// Update booking status by id
router.patch('/:id', async (req, res) => {
    const db = await connectToDB();
    try{
        const {status} = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        let booking = await db.collection('bookings').findOne({_id: new ObjectId(req.params.id)});
        if(!booking){
            return res.status(404).json({message: 'Booking not found'});
        }

        // Update the status in the bookings collection
        const bookingUpdateResult = await db.collection('bookings').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status: status, updatedAt: new Date() } }
        );

        if (bookingUpdateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'Failed to update booking status in bookings collection' });
        }

         // Update the status in the user's booking history
         const userUpdateResult = await db.collection('users').updateOne(
            {
                _id: booking.userId,
                "bookingHistory.bookingId": booking._id
            },
            {
                $set: {
                    "bookingHistory.$.status": status,
                    "bookingHistory.$.updatedAt": new Date()
                }
            }
        );

        if (userUpdateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'Failed to update booking status in user history' });
        }

        res.status(200).json({ message: 'Booking status updated successfully' });
    } catch (error){
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await db.client.close();
    }
});

// Get room availability for a specific date
router.get('/availability/:roomId/:date', async (req, res) => {
    const db = await connectToDB();
    try {
        const { roomId, date } = req.params;
        
        let availabilityRecord = await db.collection("roomAvailability").findOne({ 
            roomId: new ObjectId(roomId), 
            date 
        });

        if (!availabilityRecord) {
            // If no record exists, all slots are available
            availabilityRecord = {
                roomId: new ObjectId(roomId),
                date,
                timeslots: generateDefaultTimeslots()
            };
        }

        res.json(availabilityRecord.timeslots);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await db.client.close();
    }
});

// const releaseBooking = async (db, booking) => {
//     try {
//         // First, get the room availability record
//         const availabilityRecord = await db.collection("roomAvailability").findOne({
//             roomId: booking.roomId,
//             date: booking.date
//         });

//         if (availabilityRecord) {
//             // Update each timeslot individually
//             const updateObj = {};
//             booking.timeslots.forEach(slot => {
//                 updateObj[`timeslots.${slot}`] = true;
//             });

//             await db.collection("roomAvailability").updateOne(
//                 { _id: availabilityRecord._id },
//                 { 
//                     $set: {
//                         ...updateObj,
//                         lastUpdated: new Date()
//                     }
//                 }
//             );
//         }

//         // Update user's booking history
//         const userUpdateResult = await db.collection("users").updateOne(
//             { _id: booking.userId },
//             { 
//                 $pull: { 
//                     bookingHistory: { 
//                         bookingId: booking._id 
//                     } 
//                 } 
//             }
//         );

//         // Delete the booking
//         const bookingDeleteResult = await db.collection("bookings").deleteOne({
//             _id: booking._id
//         });

//         console.log('Release results:', {
//             availability: availabilityRecord ? 'updated' : 'not found',
//             userUpdate: userUpdateResult.modifiedCount,
//             bookingDelete: bookingDeleteResult.deletedCount
//         });

//         return true;
//     } catch (error) {
//         console.error('Error in releaseBooking:', error);
//         throw error;
//     }
// };

// Endpoint to check and handle expired bookings
router.post('/checkExpired', verifyToken, async (req, res) => {
    let db;
    try {
        db = await connectToDB();
        
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: 'Booking ID is required' });
        }

        // Find the booking
        const booking = await db.collection("bookings").findOne({
            _id: new ObjectId(bookingId),
            status: 'pending payment'
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or already processed' });
        }

        // Check if booking is expired
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (booking.createdAt > fifteenMinutesAgo) {
            return res.status(400).json({ message: 'Booking is not expired yet' });
        }

        // Release the booking
        await releaseBooking(db, booking);

        res.json({
            message: 'Booking released successfully',
            bookingId: booking._id
        });

    } catch (error) {
        console.error('Error in checkExpired:', error);
        res.status(500).json({
            message: 'Failed to handle expired booking',
            error: error.message
        });
    } finally {
        if (db) await db.client.close();
    }
});


// Endpoint to handle expiration check on payment page load
router.get('/checkStatus/:id', verifyToken, async (req, res) => {
    let db;
    try {
        db = await connectToDB();
        const bookingId = req.params.id;

        const booking = await db.collection('bookings').findOne({
            _id: new ObjectId(bookingId)
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking is expired
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const isExpired = booking.status === 'pending payment' && 
                         booking.createdAt < fifteenMinutesAgo;

        if (isExpired) {
            await releaseBooking(db, booking);
            return res.json({
                status: 'expired',
                message: 'Booking has expired'
            });
        }

        res.json({
            status: booking.status,
            createdAt: booking.createdAt,
            timeRemaining: Math.max(0, 
                900 - Math.floor((Date.now() - booking.createdAt.getTime()) / 1000)
            )
        });

    } catch (error) {
        console.error('Error checking booking status:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (db) await db.client.close();
    }
});

  
module.exports = router;