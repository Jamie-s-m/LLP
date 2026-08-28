# Architecture

## Runtime

The React/Vite frontend is deployed as a Render Static Site. The Express
backend runs as a Render Web Service and exposes `/api/*` plus Socket.IO.
MongoDB Atlas stores users, courses, lessons, exercises, flashcards, progress,
messaging, family links, and billing records. Redis is optional.

## Application boundaries

- `frontend/src/pages` contains user-facing flows.
- `frontend/src/store` contains client state.
- `frontend/src/services` contains API clients.
- `backend/src/routes` defines the API surface.
- `backend/src/controllers` contains request/business orchestration.
- `backend/src/models` contains MongoDB schemas.
- `backend/src/seed.js` is an explicit content synchronization tool.

Authentication uses JWT. Route middleware enforces authentication and role
permissions. Production CORS is restricted to configured HTTPS origins.
