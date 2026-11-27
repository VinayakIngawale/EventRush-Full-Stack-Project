const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/events
// @desc    Get all events (optional ?sport= and ?search= filtering)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { sport, search } = req.query;
        let query = {};

        if (sport && sport.trim() && sport.toLowerCase() !== 'all') {
            query.sport = new RegExp(`^${sport.trim()}$`, 'i');
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: regex },
                { description: regex },
                { location: regex },
                { sport: regex }
            ];
        }

        const events = await Event.find(query).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error('Fetch events error:', err.message);
        res.status(500).json({ msg: 'Server error fetching events' });
    }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid event ID' });
        }

        const event = await Event.findById(req.params.id).populate('participants', 'username email');
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        console.error('Fetch event detail error:', err.message);
        res.status(500).json({ msg: 'Server error fetching event details' });
    }
});

// @route   POST /api/events/:id/participate
// @desc    Register for an event
// @access  Private
router.post('/:id/participate', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid event ID' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is already registered (comparing ObjectId strings)
        const isRegistered = event.participants.some(
            p => p.toString() === req.user.id
        );

        if (isRegistered) {
            return res.status(400).json({ msg: 'User already registered for this event' });
        }

        event.participants.push(req.user.id);
        await event.save();

        res.json({
            msg: 'Successfully registered for the event',
            participants: event.participants,
            participantCount: event.participants.length
        });
    } catch (err) {
        console.error('Participate error:', err.message);
        res.status(500).json({ msg: 'Server error registering for event' });
    }
});

// @route   POST /api/events/:id/cancel
// @desc    Cancel registration for an event
// @access  Private
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid event ID' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const isRegistered = event.participants.some(
            p => p.toString() === req.user.id
        );

        if (!isRegistered) {
            return res.status(400).json({ msg: 'You are not registered for this event' });
        }

        event.participants = event.participants.filter(
            p => p.toString() !== req.user.id
        );
        await event.save();

        res.json({
            msg: 'Successfully cancelled registration',
            participants: event.participants,
            participantCount: event.participants.length
        });
    } catch (err) {
        console.error('Cancel registration error:', err.message);
        res.status(500).json({ msg: 'Server error cancelling registration' });
    }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, sport, description, date, location, imageUrl } = req.body;

        if (!title || !sport || !description || !date || !location || !imageUrl) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const newEvent = new Event({
            title: title.trim(),
            sport: sport.trim(),
            description: description.trim(),
            date: new Date(date),
            location: location.trim(),
            imageUrl: imageUrl.trim(),
            participants: []
        });

        await newEvent.save();
        res.status(201).json({ msg: 'Event created successfully', event: newEvent });
    } catch (err) {
        console.error('Create event error:', err.message);
        res.status(500).json({ msg: 'Server error creating event' });
    }
});

module.exports = router;
