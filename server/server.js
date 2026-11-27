const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Ensure .env is loaded regardless of whether node is executed from root or server/
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); // Fallback to root directory .env

const Event = require('./models/Event');

const app = express();

// Middlewares
app.use(cors()); // Allows cross-origin requests from frontend
app.use(express.json()); // Allows parsing of JSON in request bodies

// Serve static client frontend files directly
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));

// API status endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'EventRush API',
        status: 'Online',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            events: '/api/events'
        }
    });
});

// Root route serves client index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Seed default events if database is empty
const seedDatabase = async () => {
    try {
        const eventCount = await Event.countDocuments();
        if (eventCount === 0) {
            console.log('No events found, seeding initial events...');
            const events = [
                {
                    title: 'City Marathon 2026',
                    sport: 'Running',
                    description: 'Annual city-wide marathon for all skill levels. Categories include 5K Fun Run, 10K Challenge, and 21K Half Marathon.',
                    date: new Date('2026-10-26T07:00:00Z'),
                    location: 'Pune Downtown, MG Road',
                    imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'Community Football Cup',
                    sport: 'Football',
                    description: 'A friendly 5-a-side community football tournament with trophies, awards, and refreshments for all participants.',
                    date: new Date('2026-11-02T10:00:00Z'),
                    location: 'Khadki Football Ground, Pune',
                    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'Open Badminton Championship',
                    sport: 'Badminton',
                    description: 'Open entry badminton championship featuring singles and doubles categories on professional synthetic indoor courts.',
                    date: new Date('2026-11-15T09:00:00Z'),
                    location: 'Shivaji Sports Complex, Pune',
                    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'Weekend Cricket League',
                    sport: 'Cricket',
                    description: 'Exciting weekend leather-ball cricket tournament with certified umpires, live scoring, and man of the match awards.',
                    date: new Date('2026-12-05T08:30:00Z'),
                    location: 'Deccan Gymkhana Ground, Pune',
                    imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b10f01b40?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: '3v3 Street Basketball Clash',
                    sport: 'Basketball',
                    description: 'Fast-paced half-court 3-on-3 basketball tournament with music, 3-point shootouts, and great community vibes.',
                    date: new Date('2026-12-12T16:00:00Z'),
                    location: 'Fergusson College Sports Ground, Pune',
                    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
                }
            ];
            await Event.insertMany(events);
            console.log(`Seeded ${events.length} default events.`);
        }
    } catch (seedErr) {
        console.error('Error during database seed:', seedErr.message);
    }
};

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('⚠️  Warning: MONGO_URI is not defined in .env. Falling back to local MongoDB.');
} else {
    const isCloud = MONGO_URI.includes('mongodb+srv://') || MONGO_URI.includes('.mongodb.net');
    console.log(`Connecting to ${isCloud ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}...`);
}

const connectionString = MONGO_URI || 'mongodb://127.0.0.1:27017/eventrush';

mongoose.connect(connectionString)
    .then(async () => {
        console.log('✓ MongoDB Connected successfully.');
        await seedDatabase();
    })
    .catch(err => {
        console.error('✗ MongoDB Connection Error:', err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.log('\n[Troubleshooting Tip]');
            console.log('1. Local MongoDB is not running on port 27017.');
            console.log('2. If you want to use MongoDB Atlas cloud database, ensure MONGO_URI is set in server/.env:');
            console.log('   MONGO_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/eventrush?retryWrites=true&w=majority"\n');
        } else if (err.message.includes('querySrv ETIMEOUT') || err.message.includes('ENOTFOUND')) {
            console.log('\n[MongoDB Atlas Tip]');
            console.log('DNS/Network Timeout: Check your internet connection and verify your MongoDB Atlas cluster hostname.');
        } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
            console.log('\n[MongoDB Atlas Tip]');
            console.log('Authentication Failed: Check your MongoDB Atlas database username and password in server/.env.');
        } else if (err.message.includes('Could not connect to any servers') || err.message.includes('IP that isn\'t whitelisted')) {
            console.log('\n[MongoDB Atlas Tip]');
            console.log('IP Whitelist: Ensure your current IP address is added to Network Access in MongoDB Atlas (or allow 0.0.0.0/0).');
        }
    });

// 404 Handler for undefined routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ msg: 'API route not found' });
    }
    res.status(404).sendFile(path.join(__dirname, '../client/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
