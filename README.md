# Addis Ababa Police Portal — MERN Stack

The application is now a JavaScript MERN project:

- `frontend/` — React + Vite single-page application
- `backend/` — Express REST API, Mongoose models, JWT authentication
- MongoDB — stores users, news, alerts, services, and public submissions

## Run locally

1. Install and start MongoDB.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
3. Run `npm install`, then `npm run install:all`.
4. Add starter content with `npm --prefix backend run seed`.
5. Run both applications using `npm run dev`.

The React portal runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.

Seeded admin account: `admin@aap.local` / `password`. Change this password before deployment.
