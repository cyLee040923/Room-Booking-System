const { connectToDB, ObjectId } = require("./db");
const jwt = require('jsonwebtoken');
require('dotenv').config();

if (!process.env.TOKEN_SECRET) {
    throw new Error('Please define the TOKEN_SECRET environment variable in .env file');
}

const generateToken = async (user) => {
    // Minimal token payload
    const tokenData = {
        _id: user._id.toString(),
        email: user.email
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: '24h' });

    const db = await connectToDB();
    try {
        await db.collection("users").updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { currentToken: token } }
        );
        return token;
    } catch (err) {
        console.error("Error storing token:", err);
        throw err;
    } finally {
        await db.client.close();
    }
};

const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
};

const authenticate = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const db = await connectToDB();
        
        try {
            const user = await db.collection("users").findOne(
                { _id: new ObjectId(decoded._id) },
                { projection: { password: 0, currentToken: 0 } }
            );

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } finally {
            await db.client.close();
        }
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const removeToken = async (userId) => {
    if (!userId) return;
    
    const db = await connectToDB();
    try {
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $unset: { currentToken: "" } }
        );
    } catch (err) {
        console.error("Error removing token:", err);
    } finally {
        await db.client.close();
    }
};

module.exports = { generateToken, authenticate, extractToken, removeToken };