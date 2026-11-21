# ScamShield Frontend

Responsive static frontend for the ScamShield starter backend.

## Files
- `index.html` — dashboard, scanner, history, reports and account modal
- `css/style.css` — responsive UI styles
- `js/config.js` — public backend URL configuration
- `scamshield-client.js` — API client
- `js/app.js` — UI behavior and API integration
- `assets/shield.svg` — favicon

## Configure
Edit `js/config.js` and replace the placeholder with your deployed backend URL:

```js
window.SCAMSHIELD_CONFIG = {
  API_BASE_URL: "https://your-service.onrender.com"
};
```

Do not place secrets, MongoDB credentials, JWT signing keys or private API keys in frontend files.

## GitHub Pages
Upload the *contents* of this folder to the root of the GitHub repository's Pages branch (or publish this folder using an appropriate Pages workflow). `index.html` must be at the published root.

## Backend routes used
- `GET /health`
- `POST /api/scan/message`
- `POST /api/scan/url`
- `POST /api/scan/phone`
- `POST /api/scan/email`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/history` (authenticated)
- `POST /api/reports`

The backend must allow your GitHub Pages origin in `CORS_ORIGIN`.

## Important limitations
This is a web dashboard and manual scanning interface. It does not block calls from a browser. Native Android/iOS call screening requires separate mobile app builds and OS permissions. AI analysis also remains unavailable unless a provider is configured on the backend.
