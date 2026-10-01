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

Lucky draw admin access uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.
For local development, the defaults are `admin@bingenbliss.com` and `admin123`.

Winner WhatsApp notifications use the WhatsApp Cloud API. Set
`WHATSAPP_SENDER_NUMBER=9550764936`, `WHATSAPP_PHONE_NUMBER_ID`, and
`WHATSAPP_ACCESS_TOKEN` in `backend/.env`. Set `WHATSAPP_LOGO_URL` to a public
HTTPS URL for the Binge N Bliss logo if the winner message should include it.
The admin popup derives the prefilled WhatsApp recipient from the selected
winner&apos;s Excel phone number. Indian 10-digit numbers are automatically
converted to the `91...` format; opening the link still requires the admin to
press Send in WhatsApp.

## Backend structure

- `server.js`: HTTP server bootstrap
- `src/app.js`: Express application setup
- `src/config/db.js`: JSON store persistence
- `src/models/luckyDrawModel.js`: user and order data access
- `src/controllers/luckyDrawController.js`: API request handlers
- `src/routes/luckyDrawRoutes.js`: API route definitions
- `src/middleware/errorMiddleware.js`: centralized error responses
