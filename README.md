Messaging App (ChatApp)
=======================

Real-time team messaging app showcasing WebSocket-powered communication, presence and basic moderation.

This repository contains the messaging-app (ChatApp) project. It's intended as a compact, self-contained example of building a real-time web app with a focus on accessibility, performance and simplicity.

Table of contents
-----------------

- Features
- Tech stack
- Requirements
- Local development
- Running tests
- Deployment
- Security & privacy notes
- Folder layout (example)
- Contributing
- Contact

Features
--------

- Real-time chat rooms with message broadcast
- User presence and simple typing indicators
- Room list and channel navigation
- Basic moderation tools (mute/kick) – configurable
- Responsive UI and keyboard-accessible interactions

Tech stack
----------

- Backend: Node.js + Express + ws/socket.io
- Database: PostgreSQL or Redis for presence (optional)
- Frontend: React, Preact, or Vanilla JS
- Testing: Jest / Supertest for API, integration tests for socket flows

Requirements
------------

- Node.js (>= 16)
- PostgreSQL (optional for message persistence)
- Redis (optional for presence/scaling)
- Git

Local development
-----------------

1. Clone the repository

```bash
git clone https://github.com/nathanhrussell/messaging-app.git
cd messaging-app
```

2. Copy environment example

```bash
cp .env.example .env
# Edit .env to set PORT, DATABASE_URL, JWT_SECRET, REDIS_URL, etc.
```

3. Install dependencies

```bash
npm install
```

4. Start the app in development

```bash
npm run dev
```

Open http://localhost:3000 (or the configured port) and open multiple browsers/tabs to test real-time messaging.

Running tests
-------------

```bash
npm test
# or
npm run test:watch
```

Deployment
----------

- Deploy backend to a host that supports WebSockets (Render, Fly, Heroku, DigitalOcean). If using Redis for presence, ensure your host provides a Redis instance.
- For production, use a process manager (PM2) or containerisation (Docker).
- Set environment variables (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.) in your production environment.

Security & privacy notes
------------------------

- Sanitise and validate all incoming messages on the server to avoid XSS.
- Rate-limit and authenticate socket connections to prevent abuse.
- If storing messages, consider retention policies and user privacy.

Folder layout (example)
------------------------

```
├── server/           # backend (WebSocket handlers, API)
├── client/           # frontend app
├── tests/            # integration and unit tests
├── .env.example
└── README.md
```

Contributing
------------

- Fork, branch, add tests, and open a PR. For features that affect realtime behaviour, include integration tests that exercise socket flows.


Contact
-------

Open an issue on GitHub or contact: https://github.com/nathanhrussell
