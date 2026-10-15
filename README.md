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

## Deploy to a Linux VPS with Nginx

The production frontend uses same-origin `/api` requests by default. Nginx
serves the Vite build and proxies `/api/` to the Node backend, avoiding
cross-origin browser requests. `VITE_API_BASE_URL` can be set at build time
only if the API is hosted on a different origin.

1. Point your domain DNS record to the VPS and deploy this repository to
   `/var/www/binge-n-bliss` (or update the paths in
   `deploy/nginx/binge-n-bliss.conf`).
2. Configure the backend environment:

   ```bash
   cd /var/www/binge-n-bliss/backend
   cp .env.example .env
   nano .env
   chmod 600 .env
   ```

   Set the production MySQL connection and a unique, strong admin password.
   Keep `.env` private and do not commit it.
3. Install dependencies and build the frontend:

   ```bash
   cd /var/www/binge-n-bliss/backend
   npm ci --omit=dev
   cd ../frontend
   npm ci
   npm run build
   ```

4. Install PM2 on the VPS if needed, then start and persist the backend
   process:

   ```bash
   sudo npm install --global pm2
   cd /var/www/binge-n-bliss/backend
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

   Run the additional command printed by `pm2 startup` to enable startup after
   a VPS reboot. The backend creates its MySQL tables during startup.
5. Install `deploy/nginx/binge-n-bliss.conf` as an Nginx site configuration.
   Replace `YOUR_DOMAIN` with the DNS name and make sure the `root` points to
   the deployed `frontend/dist` directory. Enable the site, run
   `sudo nginx -t`, and reload Nginx. Configure HTTPS with your VPS
   certificate manager (for example, Certbot) before directing users to the
   site.
6. If importing legacy winner history, copy the old `backend/data/store.json`
   to the backend deployment and run `npm run db:migrate-lucky-draw-history`
   from `backend` once the production database settings are in place.

Lucky draw admin access uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.
For local development, the defaults are `admin@bingenbliss.com` and `admin123`.
Set a long, random `ADMIN_TOKEN_SECRET` in production and keep it unchanged
between backend restarts and instances. Admin sessions expire after 12 hours;
sign in again after deploying this token change because old in-memory tokens
are no longer valid.

Before starting a draw, the admin can configure optional eligibility options.
Annual entry eligibility and previous-winner exclusion are separate options, each
covering the prior 12 months. The draw is triggered manually by the admin from the
admin portal.

Lucky draw customer entries and winner history are stored in MySQL. Configure
`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and optionally `DB_PORT` in
`backend/.env`; the backend creates the required tables on startup.

To import history from the legacy JSON store, run
`npm run db:migrate-lucky-draw-history` from `backend` in an environment that
has both the legacy `backend/data/store.json` and the target database
configuration. The import is safe to rerun and skips spin IDs already present
in MySQL.

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
