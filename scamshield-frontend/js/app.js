(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const client = new ScamShieldClient();
  let activeType = "message";
  let authMode = "login";
  let scanCount = 0;
  let threatCount = 0;
  let toastTimer;

  const labels = { message: "Message", url: "Website URL", phone: "Phone number", email: "Email address" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const showToast = (message, error = false) => {
    const el = $("#toast"); el.textContent = message; el.className = `toast show${error ? " error" : ""}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = "toast", 3400);
  };
  const user = () => { try { return JSON.parse(localStorage.getItem("scamshield_user") || "null"); } catch { return null; } };
  const updateProfile = () => {
    const current = user();
    $("#profile-name").textContent = current?.name || "Guest user";
    $("#profile-email").textContent = current?.email || "Sign in to sync scans";
    $("#avatar").textContent = (current?.name || "G").trim().charAt(0).toUpperCase();
    $("#top-auth").textContent = current ? "Account" : "Sign in";
  };
  const setView = (name) => {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
    $$(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    $("#page-title").textContent = ({ overview:"Overview", scanner:"Scam scanner", history:"Scan history", report:"Report a scam" })[name] || "Overview";
    $("#sidebar").classList.remove("open");
    if (name === "history") loadHistory();
  };
  const setScanType = (type) => {
    activeType = type;
    $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === type));
    $$(".scan-field").forEach(p => p.classList.toggle("active", p.dataset.panel === type));
    $("#result-panel").innerHTML = '<div class="result-empty"><div class="empty-symbol">⌕</div><h3>Your scan result will appear here</h3><p>Submit an item to see its risk assessment and recommendations.</p></div>';
  };
  const currentValue = () => {
    const id = ({ message:"#message-input", url:"#url-input", phone:"#phone-input", email:"#email-input" })[activeType];
    return $(id).value.trim();
  };
  const riskLevel = (result) => {
    const raw = String(result.risk || result.level || result.status || "").toLowerCase();
    if (raw.includes("high") || raw.includes("danger") || raw.includes("malicious") || raw.includes("scam")) return "high";
    if (raw.includes("medium") || raw.includes("suspicious") || raw.includes("warning")) return "medium";
    const score = Number(result.score ?? result.riskScore ?? 0);
    if (score >= 70) return "high";
    if (score >= 35) return "medium";
    return "low";
  };
  const renderResult = (result, type, value) => {
    const level = riskLevel(result);
    const score = Number(result.score ?? result.riskScore);
    const scoreText = Number.isFinite(score) && (result.score !== undefined || result.riskScore !== undefined) ? `${Math.max(0, Math.min(100, score))}/100` : "—";
    const title = level === "high" ? "High risk detected" : level === "medium" ? "Suspicious indicators found" : "No major warning signs found";
    const summary = result.summary || result.message || result.explanation || "The scan completed. Review the indicators below and verify independently.";
    const signals = result.signals || result.reasons || result.findings || [];
    const list = Array.isArray(signals) ? signals : [String(signals)];
    $("#result-panel").innerHTML = `<div class="result-content">
      <div class="result-header"><div class="result-badge risk-${level}">${level === "high" ? "!" : level === "medium" ? "⚠" : "✓"}</div>
      <div><h3>${title}</h3><p>${esc(labels[type])} analysis completed</p></div>
      <div class="risk-score"><strong>${esc(scoreText)}</strong><small>Risk score</small></div></div>
      <p class="result-summary">${esc(summary)}</p>
      <div class="result-subtitle">What we noticed</div>
      <div class="signal-list">${list.length ? list.map(s => `<div class="signal"><b>•</b><span>${esc(typeof s === "string" ? s : (s.message || s.reason || JSON.stringify(s)))}</span></div>`).join("") : '<div class="signal"><b>•</b><span>No detailed indicators were returned by the server.</span></div>'}</div>
      <div class="result-actions"><button class="button button-secondary" id="report-result">Report item</button><button class="button button-quiet" id="new-scan">New scan</button></div>
      <p class="field-hint">This result is an automated indicator, not a guarantee. Verify through official channels.</p>
    </div>`;
    $("#report-result").addEventListener("click", () => {
      $("#report-type").value = type; $("#report-value").value = value; setView("report");
    });
    $("#new-scan").addEventListener("click", () => { const id = ({message:"#message-input",url:"#url-input",phone:"#phone-input",email:"#email-input"})[type]; $(id).focus(); });
    scanCount++; if (level !== "low") threatCount++;
    $("#stat-scans").textContent = scanCount; $("#stat-threats").textContent = threatCount;
  };
  const doScan = async (event) => {
    event.preventDefault();
    const value = currentValue();
    if (!value) return showToast(`Enter a ${labels[activeType].toLowerCase()} to scan.`, true);
    const button = $("#scan-submit"); button.disabled = true; button.innerHTML = "Analysing…";
    try {
      const result = await client.scan(activeType, value);
      renderResult(result, activeType, value);
    } catch (error) { showToast(error.message, true); }
    finally { button.disabled = false; button.innerHTML = "<span>⌕</span> Analyse now"; }
  };
  const openAuth = (mode = "login") => {
    authMode = mode; $("#auth-modal").classList.add("open"); $("#auth-modal").setAttribute("aria-hidden","false");
    const loggedIn = !!user();
    $("#auth-title").textContent = loggedIn ? "Your account" : mode === "login" ? "Welcome back" : "Create your account";
    $("#auth-subtitle").textContent = loggedIn ? "Your account is currently signed in on this browser." : mode === "login" ? "Sign in to sync your scan history." : "Create an account to save your scans.";
    $("#auth-name-wrap").classList.toggle("hidden", loggedIn || mode === "login");
    $("#auth-email").closest("label")?.classList.toggle("hidden", loggedIn);
    $("#auth-form").classList.toggle("hidden", loggedIn);
    $("#auth-switch").classList.toggle("hidden", loggedIn);
    $("#signout-button").classList.toggle("hidden", !loggedIn);
  };
  const closeAuth = () => { $("#auth-modal").classList.remove("open"); $("#auth-modal").setAttribute("aria-hidden","true"); };
  const submitAuth = async (event) => {
    event.preventDefault();
    const button = $("#auth-submit"); button.disabled = true;
    try {
      const data = authMode === "login"
        ? await client.login($("#auth-email").value.trim(), $("#auth-password").value)
        : await client.register($("#auth-name").value.trim(), $("#auth-email").value.trim(), $("#auth-password").value);
      client.setToken(data.token); localStorage.setItem("scamshield_user", JSON.stringify(data.user));
      updateProfile(); closeAuth(); showToast(authMode === "login" ? "Signed in successfully." : "Account created successfully.");
      if ($("#view-history").classList.contains("active")) loadHistory();
    } catch (error) { showToast(error.message, true); }
    finally { button.disabled = false; }
  };
  const signOut = () => { client.setToken(""); localStorage.removeItem("scamshield_user"); updateProfile(); closeAuth(); showToast("Signed out."); };
  const loadHistory = async () => {
    if (!user()) {
      $("#history-count").textContent = "Sign in to sync history";
      $("#history-content").innerHTML = '<div class="result-empty compact"><div class="empty-symbol">◷</div><h3>Sign in to view your history</h3><p>Only scans saved to your account appear here.</p><button class="button button-primary" id="history-signin">Sign in</button></div>';
      $("#history-signin").addEventListener("click", () => openAuth("login")); return;
    }
    $("#history-count").textContent = "Loading…";
    try {
      const data = await client.history(); const items = data.items || [];
      $("#history-count").textContent = `${items.length} record${items.length === 1 ? "" : "s"}`;
      if (!items.length) { $("#history-content").innerHTML = '<div class="result-empty compact"><div class="empty-symbol">◷</div><h3>No scans saved yet</h3><p>Your authenticated scans will appear here.</p></div>'; return; }
      $("#history-content").innerHTML = `<table class="history-table"><thead><tr><th>TYPE</th><th>ITEM</th><th>RISK</th><th>DATE</th></tr></thead><tbody>${items.map(item => {
        const level = riskLevel(item);
        return `<tr><td>${esc(labels[item.type] || item.type)}</td><td>${esc(String(item.target || "").slice(0,58))}</td><td><span class="pill ${level}">${level.toUpperCase()}</span></td><td>${esc(item.createdAt ? new Date(item.createdAt).toLocaleString() : "—")}</td></tr>`;
      }).join("")}</tbody></table>`;
    } catch (error) { $("#history-count").textContent = "Could not load"; showToast(error.message, true); }
  };
  const submitReport = async (event) => {
    event.preventDefault();
    const type = $("#report-type").value, value = $("#report-value").value.trim(), details = $("#report-details").value.trim();
    if (!value) return showToast("Enter the item you want to report.", true);
    const button = event.submitter; if (button) button.disabled = true;
    try {
      const result = await client.report(type, value, details);
      showToast(result.message || "Report submitted for review.");
      $("#report-form").reset();
    } catch (error) { showToast(error.message, true); }
    finally { if (button) button.disabled = false; }
  };

  $$(".nav-link").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  $$("[data-view='scanner']").forEach(b => b.addEventListener("click", () => setView("scanner")));
  $$("[data-scan]").forEach(b => b.addEventListener("click", () => { setView("scanner"); setScanType(b.dataset.scan); }));
  $$(".tab").forEach(b => b.addEventListener("click", () => setScanType(b.dataset.tab)));
  $("#scan-form").addEventListener("submit", doScan);
  $("#message-input").addEventListener("input", e => $("#message-count").textContent = `${e.target.value.length} / 5000`);
  $("#report-form").addEventListener("submit", submitReport);
  $("#refresh-history").addEventListener("click", loadHistory);
  $("#auth-open").addEventListener("click", () => openAuth(user() ? "login" : "login"));
  $("#top-auth").addEventListener("click", () => openAuth("login"));
  $("#auth-close").addEventListener("click", closeAuth);
  $("#auth-modal").addEventListener("click", e => { if (e.target === $("#auth-modal")) closeAuth(); });
  $("#auth-form").addEventListener("submit", submitAuth);
  $("#auth-toggle").addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));
  $("#signout-button").addEventListener("click", signOut);
  $("#menu-toggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#year").textContent = new Date().getFullYear();
  updateProfile();
  client.health().then(() => { $(".api-status").classList.add("online"); $("#api-label").textContent = "API connected"; })
    .catch(() => { $(".api-status").classList.add("offline"); $("#api-label").textContent = "API unavailable"; });
  $("#stat-scans").textContent = "0"; $("#stat-threats").textContent = "0";
})();