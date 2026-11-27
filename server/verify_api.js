// EventRush In-Memory Unit & Route Verification
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function runVerification() {
    console.log('=== EventRush Core Functionality Verification ===\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✓ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ✗ FAIL: ${message}`);
            failed++;
        }
    }

    // 1. Verify Environment and Models
    console.log('[1] Testing Mongoose Models & Schemas...');
    const User = require('./models/User');
    const Event = require('./models/Event');

    assert(User.schema.paths.username !== undefined, 'User model has "username" path');
    assert(User.schema.paths.email !== undefined, 'User model has "email" path');
    assert(User.schema.paths.password !== undefined, 'User model has "password" path');
    assert(Event.schema.paths.title !== undefined, 'Event model has "title" path');
    assert(Event.schema.paths.sport !== undefined, 'Event model has "sport" path');
    assert(Event.schema.paths.participants !== undefined, 'Event model has "participants" path');

    // 2. Verify Authentication Logic (Bcrypt + JWT)
    console.log('\n[2] Testing Auth Security (Hashing & JWT Tokens)...');
    const rawPassword = 'SecurePassword123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    assert(hashedPassword !== rawPassword, 'Bcrypt successfully hashes passwords');

    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert(isMatch === true, 'Bcrypt correctly matches valid password');

    const isWrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
    assert(isWrongMatch === false, 'Bcrypt correctly rejects invalid password');

    const secret = 'test_jwt_secret_key';
    const payload = { user: { id: '654321098765432109876543' } };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    assert(typeof token === 'string' && token.length > 20, 'JWT token generated');

    const decoded = jwt.verify(token, secret);
    assert(decoded.user.id === payload.user.id, 'JWT token decodes payload accurately');

    // 3. Verify Auth Middleware
    console.log('\n[3] Testing Auth Middleware Logic...');
    process.env.JWT_SECRET = secret;
    const authMiddleware = require('./middleware/authMiddleware');

    // Test missing token
    let statusSent = null;
    let jsonSent = null;
    const mockRes1 = {
        status: (s) => { statusSent = s; return { json: (j) => { jsonSent = j; } }; }
    };
    const mockReq1 = {
        header: () => null
    };
    authMiddleware(mockReq1, mockRes1, () => {});
    assert(statusSent === 401 && jsonSent?.msg?.includes('No token'), 'Auth middleware blocks requests without token');

    // Test valid token via x-auth-token
    let nextCalled = false;
    const mockReq2 = {
        header: (name) => (name === 'x-auth-token' ? token : null)
    };
    authMiddleware(mockReq2, {}, () => { nextCalled = true; });
    assert(nextCalled === true && mockReq2.user?.id === payload.user.id, 'Auth middleware authenticates valid x-auth-token');

    // Test valid token via Authorization Bearer
    let bearerNext = false;
    const mockReq3 = {
        header: (name) => (name === 'Authorization' ? `Bearer ${token}` : null)
    };
    authMiddleware(mockReq3, {}, () => { bearerNext = true; });
    assert(bearerNext === true && mockReq3.user?.id === payload.user.id, 'Auth middleware authenticates Bearer token');

    // 4. Verify Express Routes & Route Handlers
    console.log('\n[4] Testing Express Routes Configuration...');
    const authRoutes = require('./routes/auth');
    const eventRoutes = require('./routes/events');

    const authRoutePaths = authRoutes.stack.map(layer => ({
        path: layer.route?.path,
        methods: Object.keys(layer.route?.methods || {})
    })).filter(r => r.path);

    const eventRoutePaths = eventRoutes.stack.map(layer => ({
        path: layer.route?.path,
        methods: Object.keys(layer.route?.methods || {})
    })).filter(r => r.path);

    assert(authRoutePaths.some(r => r.path === '/register' && r.methods.includes('post')), 'Route POST /api/auth/register exists');
    assert(authRoutePaths.some(r => r.path === '/login' && r.methods.includes('post')), 'Route POST /api/auth/login exists');
    assert(authRoutePaths.some(r => r.path === '/me' && r.methods.includes('get')), 'Route GET /api/auth/me exists');

    assert(eventRoutePaths.some(r => r.path === '/' && r.methods.includes('get')), 'Route GET /api/events exists');
    assert(eventRoutePaths.some(r => r.path === '/:id' && r.methods.includes('get')), 'Route GET /api/events/:id exists');
    assert(eventRoutePaths.some(r => r.path === '/:id/participate' && r.methods.includes('post')), 'Route POST /api/events/:id/participate exists');
    assert(eventRoutePaths.some(r => r.path === '/:id/cancel' && r.methods.includes('post')), 'Route POST /api/events/:id/cancel exists');

    console.log(`\n==================================================`);
    console.log(`Verification Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================`);

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runVerification().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
