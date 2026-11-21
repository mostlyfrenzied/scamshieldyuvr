// Set this to your deployed API URL if hosting backend separately.
// Empty string means same-origin relative endpoints (works automatically on Vercel).
window.SCAMSHIELD_CONFIG = {
  API_BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:4000"
    : ""
};
