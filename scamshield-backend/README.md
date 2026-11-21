# ScamShield Backend API

Node.js + Express + MongoDB API used by the ScamShield static frontend.

## Requirements
- Node.js 20 or later
- MongoDB Atlas database (or local MongoDB for development)

## Local setup

```bash
cd scamshield-backend
cp .env.example .env
npm install
npm run dev
```

Edit `.env` and set:
- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a random secret with at least 32 characters
- `CORS_ORIGIN`: exact frontend origin, such as `http://localhost:5500`
- `GOOGLE_SAFE_BROWSING_API_KEY`: optional key for URL reputation checks

The API starts on `http://localhost:4000` unless `PORT` is set.

Health check:

```bash
curl http://localhost:4000/health
```

## Render deployment

Create a Render **Web Service** connected to your GitHub repository:

| Setting | Value |
|---|---|
| Root Directory | `backend` (if this folder is named backend in your repo) |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

If you upload this backend folder at the repository root instead, leave Root Directory blank.

Add the environment variables in Render's Environment tab. Do not commit `.env` or put secrets in frontend files. Set `CORS_ORIGIN` to the exact GitHub Pages origin, for example `https://YOUR-GITHUB-USERNAME.github.io` (no repository path or trailing slash).

## API routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Service and database status |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/scan/message` | Optional | Scan a message; JSON `{ "text": "..." }` |
| POST | `/api/scan/url` | Optional | Scan a URL; JSON `{ "url": "https://..." }` |
| POST | `/api/scan/phone` | Optional | Scan phone; JSON `{ "phone": "+91..." }` |
| POST | `/api/scan/email` | Optional | Scan email; JSON `{ "email": "..." }` |
| GET | `/api/history` | Yes | Current user's scan history |
| POST | `/api/reports` | Optional | Submit a community report |
| POST | `/api/calls/report` | Yes | Submit a phone report for call-directory review |
| GET | `/api/calls/directory` | Yes | Retrieve verified phone entries |
| GET | `/api/threats` | Yes | Retrieve verified community reports |

For authenticated endpoints, send `Authorization: Bearer <token>`.

## Detection and limitations

- Message, phone and email checks use heuristic/rule-based indicators. They can produce false positives and false negatives.
- URL checks use local URL heuristics. If `GOOGLE_SAFE_BROWSING_API_KEY` is configured, the API also queries Google Safe Browsing.
- The AI adapter is intentionally disabled by default; no external AI provider is called.
- Reports are created with `pending` status. They are not trusted or added to call-blocking directories until a separate moderation process marks them `verified`.
- This API does not itself block calls. Android/iOS native apps must consume the verified call directory and implement platform call-screening APIs.
- This is a development starter, not a security-certified or production-audited service. Add monitoring, backups, privacy policy, retention controls, abuse review and security testing before public launch.
