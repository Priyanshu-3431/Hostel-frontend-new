/* Shared logic for student-area pages: auth guard, nav name, logout, dashboard data */

Auth.requireStudent();

const currentUser = Auth.getUser();
const navNameEl = document.getElementById("navStudentName");
if (navNameEl && currentUser) navNameEl.textContent = currentUser.name;

function bindLogout(id) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.logout("login.html");
    });
  }
}
bindLogout("navLogout");
bindLogout("sideLogout");

/* Dashboard overview (only runs if these elements exist, i.e. on dashboard.html) */
(async function loadDashboard() {
  const loading = document.getElementById("dashLoading");
  const content = document.getElementById("dashContent");
  if (!loading || !content) return;

  const res = await api.get("/student/dashboard");
  loading.classList.add("hidden");

  if (!res.success) {
    showToast(res.message || "Could not load dashboard.", "error");
    return;
  }

  content.classList.remove("hidden");
  const { student, booking, payment } = res.data;

  document.getElementById("welcomeName").textContent = student.name.split(" ")[0];
  document.getElementById("infoName").textContent = student.name;
  document.getElementById("infoReg").textContent = student.registrationNumber;
  document.getElementById("infoEmail").textContent = student.email;
  document.getElementById("infoBranch").textContent = student.branch;

  const hostelStatusEl = document.getElementById("hostelStatus");
  hostelStatusEl.textContent = student.hostelStatus;
  hostelStatusEl.className = "badge " + badgeClass(student.hostelStatus);

  const bookingStatusEl = document.getElementById("bookingStatus");
  const bStatus = booking ? booking.bookingStatus : "No Booking";
  bookingStatusEl.textContent = bStatus;
  bookingStatusEl.className = "badge " + badgeClass(bStatus);

  const paymentStatusEl = document.getElementById("paymentStatus");
  const pStatus = payment ? payment.paymentStatus : "No Payment";
  paymentStatusEl.textContent = pStatus;
  paymentStatusEl.className = "badge " + badgeClass(pStatus);
})();
