# 🏆 EventRush - Sporting Event Discovery Platform

EventRush is a full-stack web application designed to simplify discovering, exploring, and participating in local sporting events. From marathons and community football tournaments to open badminton leagues, EventRush connects athletes, sports enthusiasts, and community organizers.

---

## 🌟 Key Features

- **Dynamic Event Discovery**: Browse sporting events sorted by date with event details, locations, and real-time participant counts.
- **Search & Sport Filters**: Instantly search events by keyword or filter by sport (Running, Football, Badminton, Cricket, Basketball).
- **Event Participation & Cancellation**: Authenticated users can register for events in one click and withdraw if plans change.
- **Secure Authentication**: User registration and login powered by JSON Web Tokens (JWT) and `bcryptjs` password hashing.
- **Responsive & Modern UI**: Built with HTML5, CSS3, and Vanilla JavaScript, optimized for desktop, tablet, and mobile devices.
- **Smart Fallback & Image Handling**: Automatic image fallbacks and user greetings in navigation.
- **Automated Database Seeding**: Pre-seeds realistic sporting events on first run if the database is empty.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Flexbox/Grid, CSS Variables), Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB / MongoDB Atlas via Mongoose ODM |
| **Authentication**| JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing |
| **Cross-Origin** | `cors` middleware for API requests |

---

## 📁 Project Structure

```text
EventRush/
├── client/                     # Frontend Client
│   ├── index.html              # Landing page with hero & platform highlights
│   ├── events.html             # Events listing with search and filters
│   ├── event-details.html      # Individual event view & participation button
│   ├── login.html              # User login and registration forms
│   ├── app.js                  # Frontend application logic & API fetchers
│   ├── style.css               # Responsive design and modern styling
│   └── package.json            # Client package descriptor
├── server/                     # Backend API Server
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication middleware (x-auth-token & Bearer)
│   ├── models/
│   │   ├── User.js             # User Mongoose schema (username, email, password)
│   │   └── Event.js            # Event Mongoose schema with participants array
│   ├── routes/
│   │   ├── auth.js             # Auth endpoints (/register, /login, /me)
│   │   └── events.js           # Event endpoints (list, details, participate, cancel)
│   ├── .env                    # Environment configuration (PORT, MONGO_URI, JWT_SECRET)
│   ├── .env.example            # Sample configuration template
│   ├── server.js               # Express server entry point & DB seeder
│   ├── verify_api.js           # Verification test suite
│   └── package.json            # Server dependencies and start scripts
├── notes/                      # Academic documentation & screenshots
├── report & notes/             # Project reports and presentations
├── package.json                # Root package with convenient start scripts
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local instance or free MongoDB Atlas cloud cluster)

### 2. Backend Setup
1. Open a terminal in the project directory:
   ```bash
   cd server
   ```
2. Check or update `.env` in the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventrush?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   ```
   *(A sample file is provided at `server/.env.example`)*

3. Start the backend server:
   ```bash
   npm start
   ```
   *(Or run `npm run dev` for automatic reload on file changes).*

   The server will start at `http://localhost:5000` and automatically connect to MongoDB and seed default sporting events.

### 3. Frontend Setup
You can view the frontend by either:
- **Option A (Direct File)**: Open `client/index.html` directly in your web browser.
- **Option B (Local Live Server)**:
  ```bash
  cd client
  npx serve .
  ```
  Then open `http://localhost:3000` in your browser.

---

## 🔌 API Endpoints Reference

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`username`, `email`, `password`) |
| `POST` | `/api/auth/login` | Public | Login with `email` and `password`, returns JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve currently authenticated user's profile |

### Event Routes (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | List all upcoming events (supports `?sport=` and `?search=`) |
| `GET` | `/api/events/:id` | Public | Get single event details and populated participant list |
| `POST` | `/api/events/:id/participate` | Private | Register logged-in user for an event |
| `POST` | `/api/events/:id/cancel` | Private | Cancel participation for the event |
| `POST` | `/api/events` | Private | Create a new event (`title`, `sport`, `date`, `location`, `imageUrl`) |

---

## 🛡️ Bugs Fixed & Improvements Made

1. **Server Architecture & Structure Cleanup**:
   - Replaced redundant and messy duplicate directory (`server1`) with a clean, unified `server/` module.
   - Configured root `package.json` with `npm start` and `npm run dev` scripts.
2. **Fixed Duplicate MongoDB Connections**:
   - Eliminated duplicate `mongoose.connect()` calls and removed deprecated options (`useNewUrlParser`, `useUnifiedTopology`).
   - Ensured database seeding executes only *after* MongoDB successfully connects.
3. **Fixed ObjectId Comparison Bug in Event Participation**:
   - Resolved bug where `event.participants.includes(req.user.id)` failed because Mongoose `ObjectId` objects cannot be strictly compared to string IDs.
4. **Resolved Broken Image URLs**:
   - Replaced Unsplash HTML webpage URLs with direct high-resolution image links.
   - Added frontend image `onerror` fallback handlers.
5. **Fixed API Error Response Types**:
   - Replaced plain text `res.status(500).send('Server Error')` with consistent JSON responses (`{ msg: '...' }`), preventing JSON parse crashes in frontend `response.json()`.
6. **Filename Casing Standardization**:
   - Corrected `authMIddleware.js` to `authMiddleware.js` to prevent module resolution failures on Linux and CI environments.
7. **Frontend State & UX Polish**:
   - Added instant search and sport category dropdown filter.
   - Added dynamic participation state (displays "You Are Registered" and "Cancel Registration" when already enrolled).
   - Added mobile hamburger menu navigation.
   - Added profile greeting ("Hi, [Username]") and seamless logout handling.
