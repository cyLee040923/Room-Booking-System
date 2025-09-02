var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const jwt = require('jsonwebtoken');
const { generateToken, extractToken, removeToken, verifyToken, authenticate } = require('../utils/auth');

// login
router.post('/api/login', async function (req, res) {
  console.log('trying to login');
  const db = await connectToDB();
  console.log('Request Body:', req.body);
  try {
    // check if the user exists
    var user = await db.collection("users").findOne({ email: req.body.email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    //res.json(user);
    // return a JWT token
    if (req.body.password !== user.password) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid password' });
    }

    console.log('userId', user._id)

    // res.json({ token: await generateToken(user) });
    return res.json({ 
      token: await generateToken(user),
      admin: user.isAdmin,
      userId: user._id.toString(), 
    });

    
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET /api/profile - Get user profile
router.get('/api/profile', async function (req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const db = await connectToDB();
    
    try {
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(decoded._id) },
        { 
          projection: {
            _id: 1,
            company: 1,
            username: 1,
            email: 1,
            mobile: 1,
            department: 1,
            isAdmin: 1
          }
        }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } finally {
      await db.client.close();
    }
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST /api/logout - Logout
router.post('/api/logout', async function (req, res) {
  const token = extractToken(req);

  if (!token) {
      return res.status(400).json({ message: "Bad Request: No token provided" });
  }

  const db = await connectToDB();
  try {
      // First, decode the token to get user ID
      const decoded = jwt.decode(token);
      if (decoded && decoded._id) {
          // Remove the specific token
          await db.collection("users").updateOne(
              { _id: new ObjectId(decoded._id) },
              { 
                  $pull: { tokens: token },
                  $set: { lastLogout: new Date() }
              }
          );
      }

      // Also try to remove token using the helper function as backup
      await removeToken(token);
      
      res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
      console.error("Error during logout:", err);
      res.status(500).json({ message: "Internal Server Error" });
  } finally {
      await db.client.close();
  }
});

module.exports = router;
