# Binge N Bliss

Binge N Bliss is a React and Express application for celebration venue bookings and monthly Lucky Draw entries.

## Run locally

Start the backend:

```bash
cd backend
npm install
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on Vite and proxies API requests to the backend at `http://localhost:4000`.

## Backend structure

- `server.js`: HTTP server bootstrap
- `src/app.js`: Express application setup
- `src/config/db.js`: JSON store persistence
- `src/models/luckyDrawModel.js`: user and order data access
- `src/controllers/luckyDrawController.js`: API request handlers
- `src/routes/luckyDrawRoutes.js`: API route definitions
- `src/middleware/errorMiddleware.js`: centralized error responses
