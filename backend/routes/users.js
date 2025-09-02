var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { createBlob } = require('../utils/azure-blob');


// Get ALL users
router.get('/', async(req, res) =>{
  const db = await connectToDB();
  try {
      const users = await db.collection("users").find().toArray();
      res.json(users);
  } catch (err) {
      res.status(400).json({ message: err.message });
  } finally {
      await db.client.close();
  }
});

// POST /api/users - Add new user
router.post('/', async (req, res) => {
  const db = await connectToDB();
  try {
      const newUser = {
          ...req.body,
          created_at: new Date(),
          modified_at: new Date()
      };
      const result = await db.collection("users").insertOne(newUser);
      res.status(201).json({ id: result.insertedId });
  } catch (err) {
      res.status(400).json({ message: err.message });
  } finally {
      await db.client.close();
  }
});

// GET /api/users/bookingHistory - Get booking history for user
router.get('/bookingHistory', async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"
    
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
    
        try {
            // Verify the token using `jsonwebtoken`
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            
            // Connect to DB after successful token verification
            const db = await connectToDB();
            try {
                const user = await db.collection("users").findOne({ _id: new ObjectId(decoded._id) });
        
                if (!user) {
                    console.error("User not found");
                    return res.status(404).json({ message: "User not found" });
                }
        
                // Check if bookingHistory exists
                const bookingHistory = user.bookingHistory || [];
                
                res.json(bookingHistory);
                console.log('Booking history:', bookingHistory);
            } finally {
                await db.client.close();
            }
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET /api/users/bookingHistory/:bookingId - Get booking by ID
router.get('/bookingHistory/:id', async (req, res) => {
    try {
        console.log('Trying to get booking details for id: ', req.params.id);
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        try {
            // Verify the token using `jsonwebtoken`
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            // Connect to DB after successful token verification
            const db = await connectToDB();
            try {
                const user = await db.collection("users").findOne({ _id: new ObjectId(decoded._id) });
                if (!user) {
                    console.error("User not found");
                    return res.status(404).json({ message: "User not found" });
                }
                // Check if bookingHistory exists
                const bookingHistory = user.bookingHistory || [];
             
                console.log('params id', req.params.id)

                const booking = bookingHistory.find(booking => booking.bookingId === req.params.id);

                if (!booking) {
                    console.error("Booking not found");
                    return res.status(404).json({ message: "Booking not found" });
                }
                console.log('Booking Details:', booking);
                res.json(booking);
            } finally {
                await db.client.close();
            }
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// PUT /api/users/bookingHistory/:id/uploadPaymentProof
router.put('/bookingHistory/:id/uploadPaymentProof', upload.single('paymentProof'), async (req, res) => {
    try {
        console.log('Trying to upload payment proof for booking ID:', req.params.id);
        console.log(req.file)
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            // Verify the token using `jsonwebtoken`
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            // Connect to DB after successful token verification
            const db = await connectToDB();
            try {
                const user = await db.collection("users").findOne({ _id: new ObjectId(decoded._id) });
                if (!user) {
                    console.error("User not found");
                    return res.status(404).json({ message: "User not found" });
                }
                // Check if bookingHistory exists
                const bookingHistory = user.bookingHistory || [];
                console.log('Looking for booking ID:', req.params.id);
                const booking = bookingHistory.find(booking => booking.bookingId.toString() === req.params.id.toString());
                if (!booking) {
                    console.error("Booking not found");
                    return res.status(404).json({ message: "Booking not found" });
                }
                console.log('Booking Details:', booking);

                console.log('Received request body:', req.body);
                console.log('Received file:', req.file);

                // Update payment proof

                // if(req.file){
                    try {
                        const filename = `${req.params.id}`
                        const blobResult = await createBlob('paymentproofs', filename, req.file.buffer);

                        // Update payment proof and status in the user's booking history
                        const userUpdateResult = await db.collection("users").updateOne(
                            {
                                _id: new ObjectId(decoded._id),
                                "bookingHistory.bookingId": new ObjectId(req.params.id)
                            },
                            {
                                $set: {
                                    "bookingHistory.$.paymentProof": blobResult.url,
                                    "bookingHistory.$.status": "pending approval",
                                    "bookingHistory.$.updatedAt": new Date()
                                }
                            }
                        );

                        if (userUpdateResult.modifiedCount === 0) {
                            throw new Error('Failed to update booking record in user history');
                        }

                        // Update status in the bookings collection
                        const bookingUpdateResult = await db.collection("bookings").updateOne(
                            { _id: new ObjectId(req.params.id) },
                            {
                                $set: {
                                    paymentProof: blobResult.url,
                                    status: "pending approval",
                                    updatedAt: new Date()
                                }
                            }
                );

                        if (bookingUpdateResult.modifiedCount === 0) {
                            throw new Error('Failed to update booking record in bookings collection');
                        }

                        console.log('Blob created successfully:', blobResult);
                        res.json({ 
                            message: 'Payment proof uploaded successfully',
                            url: blobResult.url
                        });

                    } catch (error) {
                        console.error('Error creating blob:', error);
                        throw new Error('Failed to upload payment proof');
                    }

            } finally {
                await db.client.close();
            }
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});



// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  const db = await connectToDB();
  try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
      if (user) {
          res.json(user);
      } else {
          res.status(404).json({ message: "User not found" });
      }
  } catch (err) {
      res.status(400).json({ message: err.message });
  } finally {
      await db.client.close();
  }
});

// PUT /api/users/:id - Update user by ID
router.put('/:id', async (req, res) => {
  const db = await connectToDB();
  try {
      delete req.body._id;
      const updatedUser = {
          ...req.body,
          modified_at: new Date()
      };
      const result = await db.collection("users").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updatedUser });
      if (result.modifiedCount > 0) {
          res.status(200).json({ message: "User updated" });
      } else {
          res.status(404).json({ message: "User not found" });
      }
  } catch (err) {
      res.status(400).json({ message: err.message });
  } finally {
      await db.client.close();
  }
});

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', async (req, res) => {
  const db = await connectToDB();
  try {
      const result = await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount > 0) {
          res.status(200).json({ message: "User deleted" });
      } else {
          res.status(404).json({ message: "User not found" });
      }
  } catch (err) {
      res.status(400).json({ message: err.message });
  } finally {
      await db.client.close();
  }
});



module.exports = router;
