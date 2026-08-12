/* Handles register.html, login.html, admin-login.html forms */

function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => {
    el.classList.remove("show");
    el.textContent = "";
  });
  const successAlert = form.parentElement.querySelector(".alert-success");
  const errorAlert = form.parentElement.querySelector(".alert-error");
  if (successAlert) successAlert.classList.remove("show");
  if (errorAlert) errorAlert.classList.remove("show");
}

function setFieldError(id, msg) {
  const el = document.getElementById(id + "Error");
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
  }
}

/* ---------------- Registration ---------------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  // If already logged in as a student, skip straight to dashboard
  if (Auth.isLoggedIn() && !Auth.isAdmin()) window.location.href = "dashboard.html";

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors(registerForm);

    const name = document.getElementById("name").value.trim();
    const registrationNumber = document.getElementById("registrationNumber").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const branch = document.getElementById("branch").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let valid = true;
    if (!name) { setFieldError("name", "Full name is required."); valid = false; }
    if (!registrationNumber) { setFieldError("registrationNumber", "Registration number is required."); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("email", "Please enter a valid email address."); valid = false; }
    if (mobile && !/^[0-9]{10}$/.test(mobile)) { setFieldError("mobile", "Please enter a valid 10-digit mobile number."); valid = false; }
    if (!branch) { setFieldError("branch", "Please select your branch."); valid = false; }
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setFieldError("password", "Password must be at least 8 characters with letters and numbers.");
      valid = false;
    }
    if (password !== confirmPassword) { setFieldError("confirmPassword", "Passwords do not match."); valid = false; }
    if (!valid) return;

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Registering...";

    const res = await api.post(
      "/auth/register",
      { name, registrationNumber, email, mobile, branch, password, confirmPassword },
      false
    );

    btn.disabled = false;
    btn.textContent = "Register";

    const successAlert = document.getElementById("successAlert");
    const errorAlert = document.getElementById("errorAlert");

    if (res.success) {
      successAlert.textContent = res.message || "Registration successful. Please login.";
      successAlert.classList.add("show");
      registerForm.reset();
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } else {
      errorAlert.textContent = res.message || "Something went wrong. Please try again.";
      errorAlert.classList.add("show");
    }
  });
}

/* ---------------- Student Login ---------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  if (Auth.isLoggedIn() && !Auth.isAdmin()) window.location.href = "dashboard.html";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors(loginForm);

    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;

    let valid = true;
    if (!identifier) { setFieldError("identifier", "Please enter your email or registration number."); valid = false; }
    if (!password) { setFieldError("password", "Please enter your password."); valid = false; }
    if (!valid) return;

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Logging in...";

    const res = await api.post("/auth/login", { identifier, password }, false);

    btn.disabled = false;
    btn.textContent = "Login";

    const errorAlert = document.getElementById("errorAlert");

    if (res.success) {
      Auth.setSession(res.token, res.data);
      window.location.href = "dashboard.html";
    } else {
      errorAlert.textContent = res.message || "Invalid email or password.";
      errorAlert.classList.add("show");
    }
  });
}

/* ---------------- Admin Login ---------------- */
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
  if (Auth.isLoggedIn() && Auth.isAdmin()) window.location.href = "admin-dashboard.html";

  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors(adminLoginForm);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("email", "Please enter a valid email address."); valid = false; }
    if (!password) { setFieldError("password", "Please enter your password."); valid = false; }
    if (!valid) return;

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Logging in...";

    const res = await api.post("/auth/admin-login", { email, password }, false);

    btn.disabled = false;
    btn.textContent = "Login as Admin";

    const errorAlert = document.getElementById("errorAlert");

    if (res.success) {
      Auth.setSession(res.token, res.data);
      window.location.href = "admin-dashboard.html";
    } else {
      errorAlert.textContent = res.message || "Invalid email or password.";
      errorAlert.classList.add("show");
    }
  });
}
