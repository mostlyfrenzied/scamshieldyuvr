// Set this to your deployed Render API URL before publishing.
// Keep the URL public; never put secret keys or database credentials here.
window.SCAMSHIELD_CONFIG = {
  API_BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:4000"
    : "https://YOUR-RENDER-SERVICE.onrender.com"
};
