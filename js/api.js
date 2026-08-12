/* ============================================================
   Global API + auth helpers shared by every page.
   Configure the backend base URL here if it's not on localhost:5000.
   ============================================================ */
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "/api"; // adjust if the backend is deployed to a different host

const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

/* ---------- Token / session storage ---------- */
const Auth = {
  setSession(token, user) {
    localStorage.setItem("hms_token", token);
    localStorage.setItem("hms_user", JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem("hms_token");
  },
  getUser() {
    const raw = localStorage.getItem("hms_user");
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    const u = this.getUser();
    return !!u && u.role === "admin";
  },
  requireStudent() {
    const u = this.getUser();
    if (!this.isLoggedIn() || !u || u.role !== "student") {
      window.location.href = "login.html";
    }
  },
  requireAdmin() {
    const u = this.getUser();
    if (!this.isLoggedIn() || !u || u.role !== "admin") {
      window.location.href = "admin-login.html";
    }
  },
  logout(redirect = "login.html") {
    this.clear();
    window.location.href = redirect;
  },
};

/* ---------- Core request wrapper ---------- */
async function apiRequest(path, { method = "GET", body = null, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = Auth.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    return { success: false, message: "Unable to reach the server. Please check your connection.", status: 0 };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "Something went wrong. Please try again." };
  }

  if (response.status === 401 && auth) {
    // Session expired / invalid — clear and bounce to the right login page
    Auth.clear();
  }

  return { ...data, status: response.status };
}

const api = {
  get: (path, auth = true) => apiRequest(path, { method: "GET", auth }),
  post: (path, body, auth = true) => apiRequest(path, { method: "POST", body, auth }),
  put: (path, body, auth = true) => apiRequest(path, { method: "PUT", body, auth }),
  del: (path, auth = true) => apiRequest(path, { method: "DELETE", auth }),
  postForm: (path, formData, auth = true) => apiRequest(path, { method: "POST", body: formData, isForm: true, auth }),
};

/* ---------- Toast notifications ---------- */
function ensureToastContainer() {
  let el = document.querySelector(".toast-container");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast-container";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info", duration = 4000) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ---------- Small shared UI helpers ---------- */
function setupHamburger() {
  const btn = document.querySelector(".hamburger");
  const links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", () => links.classList.toggle("open"));
  }
}

function badgeClass(status) {
  if (!status) return "badge-none";
  const key = status.toLowerCase().replace(/\s+/g, "");
  return `badge-${key}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function currency(amount) {
  if (amount === undefined || amount === null) return "-";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", setupHamburger);
