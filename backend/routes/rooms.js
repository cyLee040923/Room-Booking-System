var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { createBlob } = require('../utils/azure-blob');


// GET /api/rooms - Get all rooms and top rooms
router.get('/', async (req, res) => {
    const db = await connectToDB();
    try {
        // Get regular rooms
        const query = {};
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: "i" };
        }
        if (req.query.highlight) {
            query.highlight = req.query.highlight === 'true';
        }
        const results = await db.collection("rooms").find(query).toArray();

        res.json(results);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

router.get('/top', async (req, res) => {
    const db = await connectToDB();
    try {
        // Define query variable that was missing
        const query = {};
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: "i" };
        }
        if (req.query.highlight) {
            query.highlight = req.query.highlight === 'true';
        }
        
        const rooms = await db.collection("rooms").find(query).toArray();

        // Get top rooms using a different approach
        console.log('Starting top rooms aggregation...');
        
        // First, get booking counts for all rooms
        const bookingCounts = await db.collection('bookings').aggregate([
            { $unwind: "$timeslots" },
            {
                $group: {
                    _id: "$roomId",
                    bookingCount: { $sum: 1 }
                }
            }
        ]).toArray();

        // Create a map of roomId to booking count
        const bookingCountMap = {};
        bookingCounts.forEach(count => {
            bookingCountMap[count._id.toString()] = count.bookingCount;
        });

        // Get all rooms and add booking counts
        const allRoomsWithBookings = await db.collection('rooms').find({}).toArray();
        
        // Add booking counts to rooms and sort
        const roomsWithBookings = allRoomsWithBookings.map(room => ({
            roomDetails: room,
            bookingCount: bookingCountMap[room._id.toString()] || 0
        }));

        // Log all rooms with their booking counts
        console.log('\nAll Rooms Booking Counts:');
        roomsWithBookings.forEach(room => {
            console.log(`Room: ${room.roomDetails.name}, ID: ${room.roomDetails._id}, Bookings: ${room.bookingCount}`);
        });

        // Sort by booking count and get top 3
        const topRooms = roomsWithBookings
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 3);

        console.log('\nTop 3 Rooms Selected:');
        topRooms.forEach(room => {
            console.log(`Room: ${room.roomDetails.name}, Bookings: ${room.bookingCount}`);
        });

        res.json({
            rooms,
            topRooms
        });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

//Get /api/rooms/highlighted - Get all rooms with highlight
router.get('/highlighted', async (req, res) => {
    const db = await connectToDB();
    try {
        const query = { highlight: true };
        const results = await db.collection("rooms").find(query).toArray();
        res.json(results);
    } catch (err) {
        console.error('Error fetching highlighted rooms:', err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


// POST /api/rooms - Create a new room
router.post('/', upload.single('image'), async (req, res) => {
    const db = await connectToDB();
    try {
        console.log('Received request body:', req.body);
        console.log('Received file:', req.file);

        let imageUrl= null;

        const filename = req.body.name + '-' + req.body.location

        
        if (req.file) {
            try {
                const blobResult = await createBlob('roomimages', filename, req.file.buffer);
                imageUrl = blobResult.url;  // Store the public URL
                console.log('Blob created successfully:', blobResult);
            } catch (error) {
                console.error('Error creating blob:', error);
                throw new Error('Failed to upload image to Azure');
            }
        }

        const roomData = {
            room_number: req.body.room_number,
            name: req.body.name,
            type: req.body.type,
            category: req.body.category,
            capacity: parseInt(req.body.capacity),
            additional_price_per_participant: req.body.additional_price_per_participant,
            location: req.body.location,
            availability: req.body.availability === 'true',
            under_maintenance: req.body.under_maintenance === 'true',
            price: parseFloat(req.body.price),
            description: req.body.description,
            imageUrl: imageUrl,  // Use the public URL
            highlight: req.body.highlight === 'true',
            created_at: new Date(),
            modified_at: new Date()
        };  

        console.log('Processing room data:', roomData);      
        
        const result = await db.collection("rooms").insertOne(roomData);
        console.log('Room created in database:', result);
        
        const responseData = {
            ...roomData,
        };
        
        res.status(201).json({ 
            message: 'Room created', 
            roomId: result.insertedId,
            roomData: responseData 
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        await db.client.close();
    }
});

// Update Room (Edit Room Page)
router.put('/:id', upload.single('image'), async (req, res) => {
    const db = await connectToDB();
    try {
        const { room_number, name, type, category, capacity, additional_price_per_participant, location, availability, under_maintenance, price, description, imageUrl, highlight } = req.body;
        console.log(req.body)

        // Find the room by ID
        let room = await db.collection('rooms').findOne({ _id: new ObjectId(req.params.id) });
        if (!room) return res.status(404).json({ message: "Room not found" });

        let newImageUrl= room.imageUrl;
        const filename = `${name || "default-name"}-${location || "default-location"}-${new Date().toUTCString()}`;
        // Handle Image Upload
        if (req.file) {
            try {
                const blobResult = await createBlob('roomimages', filename, req.file.buffer);
                newImageUrl = blobResult.url;  // Update the public URL
                console.log('Blob created successfully:', blobResult);
            } catch (error) {
                console.error('Error creating blob:', error);
                throw new Error('Failed to upload image to Azure');
            }
        }


        const updatedRoom = {
            room_number: room_number,
            name: name,
            type: type,
            category: category,
            capacity: capacity,
            additional_price_per_participant: additional_price_per_participant,
            location: location,
            availability: availability === 'true',
            under_maintenance: under_maintenance === 'true',
            price: price,
            description: description,
            imageUrl: newImageUrl,
            highlight: highlight === 'true',
            modified_at: new Date()
        };

        console.log("Updated room data:", updatedRoom);

        
        // Save the updated room

        let result = await db.collection("rooms").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updatedRoom });

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Room information updated" });
        } else {
            res.status(404).json({ message: "Room not found" });
        }
        // await room.save();
        // res.json({ message: "Room updated successfully", room });
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// GET /api/rooms/:id - Get room by ID
router.get('/:id', async (req, res) => {
    const db = await connectToDB();
    try {
        const room = await db.collection("rooms").findOne({ _id: new ObjectId(req.params.id) });
        console.log(room);
        
        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: "Room not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

// PUT /api/rooms/:id - Update room by ID
router.put('/:id', async (req, res) => {
    const db = await connectToDB();
    
    try {
        delete req.body._id;
        req.body.highlight = req.body.highlight ? true : false;
        req.body.modified_at = new Date();

        const result = await db.collection("rooms").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
        
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Room updated" });
        } else {
            res.status(404).json({ message: "Room not found" });
        }
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

// DELETE /api/rooms/:id - Delete rooms by ID
router.delete('/:id', async (req, res) => {
    const db = await connectToDB();
    try {
        const result = await db.collection("rooms").deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount > 0) {
            res.status(200).json({ message: "Room deleted" });
        } else {
            res.status(404).json({ message: "Room not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


module.exports = router;