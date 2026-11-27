// EventRush Client Application

document.addEventListener('DOMContentLoaded', () => {
    // API Base URL - adapts to local dev or same origin
    const API_URL = window.location.port === '5000' 
        ? `${window.location.origin}/api` 
        : 'http://localhost:5000/api';

    // State
    const token = localStorage.getItem('token');
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        currentUser = null;
    }

    // --- Navigation & Mobile Menu Setup ---
    setupNavigation();

    // --- Page Specific Handlers ---
    const eventsContainer = document.getElementById('events-list');
    if (eventsContainer) {
        initEventsPage();
    }

    const eventDetailContainer = document.getElementById('event-detail-container');
    if (eventDetailContainer) {
        initEventDetailPage();
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        initAuthPage();
    }

    // --- Helper Functions ---

    function setupNavigation() {
        const navLinksContainer = document.querySelector('.nav-links');
        const loginLink = document.getElementById('login-link');
        const mobileToggle = document.getElementById('mobile-menu-btn');

        // Mobile menu toggle
        if (mobileToggle && navLinksContainer) {
            mobileToggle.addEventListener('click', () => {
                navLinksContainer.classList.toggle('nav-open');
                mobileToggle.textContent = navLinksContainer.classList.contains('nav-open') ? '✕' : '☰';
            });
        }

        // Highlight active page link
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });

        // Update nav based on authentication state
        if (token && loginLink) {
            // Fetch fresh user profile if needed
            fetchUserProfile();

            const displayName = currentUser?.username ? currentUser.username : 'Account';
            
            // Create user greeting and logout item
            const userNavItem = document.createElement('li');
            userNavItem.className = 'user-nav-item';
            userNavItem.innerHTML = `<span class="user-greeting">👋 Hi, ${escapeHtml(displayName)}</span>`;
            
            if (navLinksContainer) {
                navLinksContainer.insertBefore(userNavItem, loginLink.parentElement);
            }

            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.className = 'logout-link';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
    }

    async function fetchUserProfile() {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const user = await res.json();
                localStorage.setItem('user', JSON.stringify(user));
                currentUser = user;
                const greetingEl = document.querySelector('.user-greeting');
                if (greetingEl) {
                    greetingEl.textContent = `👋 Hi, ${escapeHtml(user.username)}`;
                }
            } else if (res.status === 401) {
                // Token has expired or is invalid
                logoutUser(false);
            }
        } catch (e) {
            console.warn('Could not fetch user profile:', e);
        }
    }

    function logoutUser(redirect = true) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (redirect) {
            window.location.href = 'login.html';
        }
    }

    // --- Events Page Logic ---
    function initEventsPage() {
        let allEvents = [];
        const searchInput = document.getElementById('search-input');
        const sportFilter = document.getElementById('sport-filter');
        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-filter-btn');

        async function fetchEvents(sport = 'All', search = '') {
            eventsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading events...</p></div>';
            try {
                let url = `${API_URL}/events`;
                const params = new URLSearchParams();
                if (sport && sport !== 'All') params.append('sport', sport);
                if (search && search.trim()) params.append('search', search.trim());
                
                const queryString = params.toString();
                if (queryString) url += `?${queryString}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to retrieve events');
                }
                const events = await response.json();
                allEvents = events;
                displayEvents(events);
            } catch (error) {
                console.error('Failed to fetch events:', error);
                eventsContainer.innerHTML = `
                    <div class="empty-state">
                        <p class="error-msg">⚠️ Unable to connect to the EventRush server.</p>
                        <p class="hint">Make sure the backend server is running on port 5000.</p>
                        <button onclick="window.location.reload()" class="cta-button retry-btn">Retry</button>
                    </div>
                `;
            }
        }

        function displayEvents(events) {
            eventsContainer.innerHTML = '';
            if (events.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No upcoming events match your search.</p>
                        <button id="reset-filter-btn" class="secondary-btn">Show All Events</button>
                    </div>
                `;
                const resetBtn = document.getElementById('reset-filter-btn');
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        if (searchInput) searchInput.value = '';
                        if (sportFilter) sportFilter.value = 'All';
                        fetchEvents();
                    });
                }
                return;
            }

            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';

                const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                const participantCount = event.participants ? event.participants.length : 0;
                const fallbackImg = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80';

                eventCard.innerHTML = `
                    <div class="event-card-img-wrapper">
                        <img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                        <span class="sport-badge">${escapeHtml(event.sport)}</span>
                    </div>
                    <div class="event-card-content">
                        <h3>${escapeHtml(event.title)}</h3>
                        <p class="event-meta"><strong>📍 Location:</strong> ${escapeHtml(event.location)}</p>
                        <p class="event-meta"><strong>📅 Date:</strong> ${eventDate}</p>
                        <p class="event-meta"><strong>👥 Joined:</strong> ${participantCount} participant${participantCount === 1 ? '' : 's'}</p>
                        <a href="event-details.html?id=${event._id}" class="details-button">View Details →</a>
                    </div>
                `;
                eventsContainer.appendChild(eventCard);
            });
        }

        // Search and filter event listeners
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchEvents(sportFilter?.value || 'All', searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                fetchEvents(sportFilter?.value || 'All', searchInput?.value || '');
            });
        }

        if (sportFilter) {
            sportFilter.addEventListener('change', () => {
                fetchEvents(sportFilter.value, searchInput?.value || '');
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (sportFilter) sportFilter.value = 'All';
                fetchEvents('All', '');
            });
        }

        // Initial fetch
        fetchEvents();
    }

    // --- Event Details Page Logic ---
    function initEventDetailPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            eventDetailContainer.innerHTML = `
                <div class="empty-state">
                    <h2>Event Not Found</h2>
                    <p>No event ID was specified in the link.</p>
                    <a href="events.html" class="cta-button">Browse Events</a>
                </div>
            `;
            return;
        }

        async function fetchEventDetails() {
            eventDetailContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading event details...</p></div>';
            try {
                const response = await fetch(`${API_URL}/events/${eventId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'Event could not be found');
                }

                displayEventDetails(data);
            } catch (error) {
                console.error('Failed to fetch event details:', error);
                eventDetailContainer.innerHTML = `
                    <div class="empty-state">
                        <h2>Event Error</h2>
                        <p class="error-msg">${escapeHtml(error.message)}</p>
                        <a href="events.html" class="cta-button">Back to Events</a>
                    </div>
                `;
            }
        }

        function displayEventDetails(event) {
            const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const participants = event.participants || [];
            const participantCount = participants.length;

            // Check if logged-in user is already registered
            let isUserRegistered = false;
            if (currentUser && currentUser.id) {
                isUserRegistered = participants.some(p => {
                    const id = typeof p === 'object' && p !== null ? (p._id || p.id) : p;
                    return id === currentUser.id;
                });
            }

            const fallbackImg = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80';

            eventDetailContainer.innerHTML = `
                <a href="events.html" class="back-link">← Back to All Events</a>
                <div class="event-detail-header">
                    <img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)}" class="event-detail-image" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <span class="sport-badge large">${escapeHtml(event.sport)}</span>
                </div>
                <h1>${escapeHtml(event.title)}</h1>
                <div class="event-info">
                    <p><strong>🏅 Sport:</strong> ${escapeHtml(event.sport)}</p>
                    <p><strong>📍 Location:</strong> ${escapeHtml(event.location)}</p>
                    <p><strong>📅 Date:</strong> ${eventDate}</p>
                    <p id="participant-count-display"><strong>👥 Participants:</strong> <span>${participantCount}</span></p>
                </div>
                <div class="event-description-box">
                    <h3>About this Event</h3>
                    <p class="event-description">${escapeHtml(event.description)}</p>
                </div>
                <div class="event-action-bar">
                    <button id="participate-btn" class="cta-button ${isUserRegistered ? 'registered' : ''}">
                        ${isUserRegistered ? '✓ You Are Registered' : 'Participate in Event'}
                    </button>
                    ${isUserRegistered ? '<button id="cancel-btn" class="secondary-btn cancel-btn">Cancel Registration</button>' : ''}
                </div>
                <div id="action-message" class="action-message"></div>
            `;

            attachParticipationHandlers(eventId, isUserRegistered);
        }

        function attachParticipationHandlers(eventId, isRegistered) {
            const participateBtn = document.getElementById('participate-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const messageEl = document.getElementById('action-message');
            const countSpan = document.querySelector('#participant-count-display span');

            if (participateBtn && !isRegistered) {
                participateBtn.addEventListener('click', async () => {
                    if (!token) {
                        const returnUrl = encodeURIComponent(window.location.href);
                        if (confirm('You must be logged in to participate in events. Would you like to login now?')) {
                            window.location.href = `login.html?redirect=${returnUrl}`;
                        }
                        return;
                    }

                    participateBtn.disabled = true;
                    participateBtn.textContent = 'Registering...';
                    messageEl.textContent = '';

                    try {
                        const res = await fetch(`${API_URL}/events/${eventId}/participate`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token
                            }
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            throw new Error(data.msg || 'Could not register for the event.');
                        }

                        participateBtn.textContent = '✓ You Are Registered';
                        participateBtn.classList.add('registered');
                        participateBtn.disabled = true;

                        messageEl.textContent = '🎉 You have successfully registered for this event!';
                        messageEl.className = 'action-message success';

                        if (countSpan && data.participantCount !== undefined) {
                            countSpan.textContent = data.participantCount;
                        }

                        // Refresh details after a brief moment to show cancel option
                        setTimeout(() => fetchEventDetails(), 1200);

                    } catch (error) {
                        participateBtn.disabled = false;
                        participateBtn.textContent = 'Participate in Event';
                        messageEl.textContent = error.message;
                        messageEl.className = 'action-message error';
                    }
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to cancel your registration for this event?')) {
                        return;
                    }

                    cancelBtn.disabled = true;
                    cancelBtn.textContent = 'Cancelling...';

                    try {
                        const res = await fetch(`${API_URL}/events/${eventId}/cancel`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token
                            }
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            throw new Error(data.msg || 'Could not cancel registration.');
                        }

                        messageEl.textContent = 'Registration cancelled.';
                        messageEl.className = 'action-message info';

                        setTimeout(() => fetchEventDetails(), 800);
                    } catch (error) {
                        cancelBtn.disabled = false;
                        cancelBtn.textContent = 'Cancel Registration';
                        messageEl.textContent = error.message;
                        messageEl.className = 'action-message error';
                    }
                });
            }
        }

        fetchEventDetails();
    }

    // --- Authentication Page Logic ---
    function initAuthPage() {
        const registerForm = document.getElementById('register-form');
        const showRegisterLink = document.getElementById('show-register');
        const showLoginLink = document.getElementById('show-login');
        const authContainer = document.querySelector('.form-container');

        // Check if user is already logged in
        if (token && currentUser) {
            authContainer.innerHTML = `
                <div class="logged-in-box">
                    <h3>Already Signed In</h3>
                    <p>You are currently signed in as <strong>${escapeHtml(currentUser.username || 'User')}</strong> (${escapeHtml(currentUser.email || '')}).</p>
                    <div class="auth-actions">
                        <a href="events.html" class="cta-button">Browse Events</a>
                        <button id="logout-btn" class="secondary-btn">Sign Out</button>
                    </div>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => {
                logoutUser();
            });
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') ? decodeURIComponent(urlParams.get('redirect')) : 'events.html';

        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                clearMessages();
            });
        }

        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                clearMessages();
            });
        }

        function clearMessages() {
            document.querySelectorAll('.form-message').forEach(el => {
                el.textContent = '';
                el.className = 'form-message';
            });
        }

        // Handle Registration
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = registerForm.querySelector('.form-message');
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;

            if (password.length < 6) {
                messageEl.textContent = 'Password must be at least 6 characters long';
                messageEl.className = 'form-message error';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            messageEl.textContent = '';

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Registration failed');

                // Auto-login on successful registration
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                messageEl.textContent = 'Registration successful! Redirecting...';
                messageEl.className = 'form-message success';

                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1200);

            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register';
                messageEl.textContent = err.message;
                messageEl.className = 'form-message error';
            }
        });

        // Handle Login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = loginForm.querySelector('.form-message');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            messageEl.textContent = '';

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Login failed');

                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                messageEl.textContent = 'Login successful! Redirecting...';
                messageEl.className = 'form-message success';

                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);

            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
                messageEl.textContent = err.message;
                messageEl.className = 'form-message error';
            }
        });
    }

    // Security helper to escape HTML and prevent XSS injection
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
