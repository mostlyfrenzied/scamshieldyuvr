(function () {
  "use strict";
  class ScamShieldClient {
    constructor(options = {}) {
      this.baseUrl = (options.baseUrl || window.SCAMSHIELD_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");
      this.token = options.token || localStorage.getItem("scamshield_token") || "";
    }
    setToken(token) {
      this.token = token || "";
      if (this.token) localStorage.setItem("scamshield_token", this.token);
      else localStorage.removeItem("scamshield_token");
    }
    async request(path, options = {}) {
      if (!this.baseUrl || this.baseUrl.includes("YOUR-RENDER-SERVICE")) {
        throw new Error("Set your Render API URL in js/config.js before using live scans.");
      }
      const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
      if (this.token) headers.Authorization = `Bearer ${this.token}`;
      let response;
      try {
        response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      } catch {
        throw new Error("Could not reach the ScamShield API. Check the backend URL and deployment status.");
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Request failed. Please try again.";
        throw new Error(message);
      }
      return data;
    }
    health() { return this.request("/health"); }
    scan(type, value) {
      const key = type === "message" ? "text" : type;
      return this.request(`/api/scan/${type}`, { method: "POST", body: JSON.stringify({ [key]: value }) });
    }
    login(email, password) { return this.request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); }
    register(name, email, password) { return this.request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }); }
    history() { return this.request("/api/history"); }
    report(type, value, details) { return this.request("/api/reports", { method: "POST", body: JSON.stringify({ type, value, details }) }); }
  }
  window.ScamShieldClient = ScamShieldClient;
})();