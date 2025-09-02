const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Connect to MongoDB
async function connectToDB() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);

    //change collection name
    const db = client.db('COMP4117proj');
    db.client = client;
    return db;
}

module.exports = { connectToDB, ObjectId };




// const { MongoClient, ObjectId } = require('mongodb');

// process.env.MONGODB_URI = 'mongodb://roombooking:hSqC7PdlAW1cC0Xokqbgna1bpExBQCvSK3XjjYv3E3CW6EWZfzhsP9Rh0IxE8s2aHEhpelCSbjpMACDbb5tygg==@roombooking.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@roombooking@';

// if (!process.env.MONGODB_URI) {
//     // throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
//     process.env.MONGODB_URI = 'mongodb://localhost:27017';
// }

// // Connect to MongoDB
// async function connectToDB() {
//     const client = await MongoClient.connect(process.env.MONGODB_URI);
//     const db = client.db('COMP4117proj');
//     db.client = client;
//     return db;
// }


// module.exports = { connectToDB, ObjectId };