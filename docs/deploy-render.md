# Deploying to Render (quick notes)

This project is simple to deploy to Render as a Web Service and connect a PostgreSQL database.

1. Create a Web Service on Render
   - Build command: `npm install && npm run build` (if you build the client) or just `npm install` for server-only
   - Start command: `npm start`
   - Environment: Node 18+ (choose the latest LTS)

2. Add a PostgreSQL database on Render and copy the DATABASE_URL into the Web Service env vars.

3. Required environment variables (set these in Render)
   - PORT (Render sets this automatically, but set to `10000` or leave blank and trust Render's $PORT)
   - DATABASE_URL
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - CORS_ORIGIN_PROD (set to your deployed client URL)

4. Trust proxy
   - `server/index.js` sets `app.set('trust proxy', 1)` when `NODE_ENV=production` so `secure` cookie flag works correctly behind Render's load balancer.

5. Cookies & CORS
   - Refresh cookie is scoped to `/api/auth/refresh`, httpOnly, secure in production, and sameSite `strict` in production. Ensure your client uses HTTPS and matches `CORS_ORIGIN_PROD`.

6. Healthcheck
   - Render can call `/health` to verify the service is up. The health endpoint also returns the `NODE_ENV`.

7. Optional: Build client on Render
   - If you choose to build the client during deploy, add `cd client && npm ci && npm run build` to your build steps and configure static serving.

8. Migration & seed
   - Run `npx prisma migrate deploy` on startup or as a one-off job.

That's it — with the environment vars set and the DB attached the app should start on Render.
