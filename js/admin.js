/* admin-dashboard.html logic */

Auth.requireAdmin();

const adminUser = Auth.getUser();
const navAdminNameEl = document.getElementById("navAdminName");
if (navAdminNameEl && adminUser) navAdminNameEl.textContent = adminUser.name;

function bindAdminLogout(id) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", (e) => { e.preventDefault(); Auth.logout("admin-login.html"); });
}
bindAdminLogout("navLogout");
bindAdminLogout("sideLogout");

/* ---------------- View switching ---------------- */
const navLinks = document.querySelectorAll(".admin-nav-link");
const views = {
  overview: document.getElementById("view-overview"),
  students: document.getElementById("view-students"),
  bookings: document.getElementById("view-bookings"),
  payments: document.getElementById("view-payments"),
  contact: document.getElementById("view-contact"),
  gallery: document.getElementById("view-gallery"),
  settings: document.getElementById("view-settings"),
};

const loaders = {
  overview: loadOverview,
  students: () => loadStudents(),
  bookings: () => loadBookings(),
  payments: () => loadPayments(),
  contact: loadContactMessages,
  gallery: loadGalleryMgmt,
  settings: loadSettings,
};

function switchView(name) {
  Object.entries(views).forEach(([key, el]) => el.classList.toggle("hidden", key !== name));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === name));
  if (loaders[name]) loaders[name]();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

/* ---------------- Overview ---------------- */
async function loadOverview() {
  const loading = document.getElementById("overviewLoading");
  const cards = document.getElementById("statCards");
  loading.classList.remove("hidden");
  cards.classList.add("hidden");

  const res = await api.get("/admin/dashboard");
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load dashboard.", "error"); return; }

  cards.classList.remove("hidden");
  const d = res.data;
  document.getElementById("statStudents").textContent = d.totalStudents;
  document.getElementById("statBookings").textContent = d.totalBookings;
  document.getElementById("statPending").textContent = d.pendingPayments;
  document.getElementById("statApproved").textContent = d.approvedPayments;
  document.getElementById("statRejected").textContent = d.rejectedPayments;
  document.getElementById("statMessages").textContent = d.contactMessages;
}

/* ---------------- Students ---------------- */
async function loadStudents() {
  const loading = document.getElementById("studentsLoading");
  const wrap = document.getElementById("studentsTableWrap");
  const empty = document.getElementById("studentsEmpty");
  const body = document.getElementById("studentsTableBody");

  loading.classList.remove("hidden");
  wrap.classList.add("hidden");
  empty.classList.add("hidden");

  const search = document.getElementById("studentSearch").value.trim();
  const branch = document.getElementById("studentBranchFilter").value;
  const paymentStatus = document.getElementById("studentPaymentFilter").value;
  const bookingStatus = document.getElementById("studentBookingFilter").value;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (branch) params.set("branch", branch);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  if (bookingStatus) params.set("bookingStatus", bookingStatus);

  const res = await api.get(`/admin/students?${params.toString()}`);
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load students.", "error"); return; }

  if (!res.data.length) { empty.classList.remove("hidden"); return; }

  wrap.classList.remove("hidden");
  body.innerHTML = res.data
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.registrationNumber)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.branch)}</td>
        <td>${formatDate(s.createdAt)}</td>
        <td><span class="badge ${badgeClass(s.hostelStatus)}">${escapeHtml(s.hostelStatus)}</span></td>
        <td><span class="badge ${badgeClass(s.bookingStatus)}">${escapeHtml(s.bookingStatus)}</span></td>
        <td><span class="badge ${badgeClass(s.paymentStatus)}">${escapeHtml(s.paymentStatus)}</span></td>
      </tr>`
    )
    .join("");
}
document.getElementById("studentFilterBtn").addEventListener("click", loadStudents);

/* ---------------- Bookings ---------------- */
async function loadBookings() {
  const loading = document.getElementById("bookingsLoading");
  const wrap = document.getElementById("bookingsTableWrap");
  const empty = document.getElementById("bookingsEmpty");
  const body = document.getElementById("bookingsTableBody");

  loading.classList.remove("hidden");
  wrap.classList.add("hidden");
  empty.classList.add("hidden");

  const search = document.getElementById("bookingSearch").value.trim();
  const status = document.getElementById("bookingStatusFilter").value;
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  const res = await api.get(`/admin/bookings?${params.toString()}`);
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load bookings.", "error"); return; }
  if (!res.data.length) { empty.classList.remove("hidden"); return; }

  wrap.classList.remove("hidden");
  body.innerHTML = res.data
    .map((b) => {
      const canAct = b.bookingStatus === "Pending";
      return `
      <tr>
        <td>${escapeHtml(b.studentName)}</td>
        <td>${escapeHtml(b.registrationNumber)}</td>
        <td>${escapeHtml(b.branch)}</td>
        <td>${currency(b.hostelFee)}</td>
        <td>${currency(b.messFee)}</td>
        <td>${currency(b.totalAmount)}</td>
        <td>${formatDate(b.createdAt)}</td>
        <td><span class="badge ${badgeClass(b.bookingStatus)}">${escapeHtml(b.bookingStatus)}</span></td>
        <td>
          ${canAct ? `<button class="btn btn-success btn-sm" data-action="approve-booking" data-id="${b._id}">Approve</button>
          <button class="btn btn-danger btn-sm" data-action="reject-booking" data-id="${b._id}" style="margin-top:6px;">Reject</button>` : "-"}
        </td>
      </tr>`;
    })
    .join("");

  body.querySelectorAll("[data-action='approve-booking']").forEach((btn) =>
    btn.addEventListener("click", () => openRemarkModal("Approve Booking", async (remark) => {
      const r = await api.put(`/admin/bookings/${btn.dataset.id}/approve`, { remark });
      handleActionResult(r, loadBookings);
    }))
  );
  body.querySelectorAll("[data-action='reject-booking']").forEach((btn) =>
    btn.addEventListener("click", () => openRemarkModal("Reject Booking", async (remark) => {
      const r = await api.put(`/admin/bookings/${btn.dataset.id}/reject`, { remark });
      handleActionResult(r, loadBookings);
    }))
  );
}
document.getElementById("bookingFilterBtn").addEventListener("click", loadBookings);

/* ---------------- Payments ---------------- */
async function loadPayments() {
  const loading = document.getElementById("paymentsLoading");
  const wrap = document.getElementById("paymentsTableWrap");
  const empty = document.getElementById("paymentsEmpty");
  const body = document.getElementById("paymentsTableBody");

  loading.classList.remove("hidden");
  wrap.classList.add("hidden");
  empty.classList.add("hidden");

  const search = document.getElementById("paymentSearch").value.trim();
  const status = document.getElementById("paymentStatusFilter").value;
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  const res = await api.get(`/admin/payments?${params.toString()}`);
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load payments.", "error"); return; }
  if (!res.data.length) { empty.classList.remove("hidden"); return; }

  wrap.classList.remove("hidden");
  body.innerHTML = res.data
    .map((p) => {
      const canAct = p.paymentStatus === "Pending";
      const student = p.userId || {};
      return `
      <tr>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.registrationNumber)}</td>
        <td>${escapeHtml(student.branch)}</td>
        <td>${currency(p.amount)}</td>
        <td>${escapeHtml(p.utrNumber)}</td>
        <td>${formatDate(p.paymentDate)}</td>
        <td><span class="badge ${badgeClass(p.paymentStatus)}">${escapeHtml(p.paymentStatus)}</span></td>
        <td>
          ${canAct ? `<button class="btn btn-success btn-sm" data-action="approve-payment" data-id="${p._id}">Approve</button>
          <button class="btn btn-danger btn-sm" data-action="reject-payment" data-id="${p._id}" style="margin-top:6px;">Reject</button>` : "-"}
        </td>
      </tr>`;
    })
    .join("");

  body.querySelectorAll("[data-action='approve-payment']").forEach((btn) =>
    btn.addEventListener("click", () => openRemarkModal("Approve Payment", async (remark) => {
      const r = await api.put(`/admin/payments/${btn.dataset.id}/approve`, { remark });
      handleActionResult(r, loadPayments);
    }))
  );
  body.querySelectorAll("[data-action='reject-payment']").forEach((btn) =>
    btn.addEventListener("click", () => openRemarkModal("Reject Payment", async (remark) => {
      const r = await api.put(`/admin/payments/${btn.dataset.id}/reject`, { remark });
      handleActionResult(r, loadPayments);
    }))
  );
}
document.getElementById("paymentFilterBtn").addEventListener("click", loadPayments);

/* ---------------- Contact Messages ---------------- */
async function loadContactMessages() {
  const loading = document.getElementById("contactLoading");
  const wrap = document.getElementById("contactTableWrap");
  const empty = document.getElementById("contactEmpty");
  const body = document.getElementById("contactTableBody");

  loading.classList.remove("hidden");
  wrap.classList.add("hidden");
  empty.classList.add("hidden");

  const res = await api.get("/admin/contact");
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load messages.", "error"); return; }
  if (!res.data.length) { empty.classList.remove("hidden"); return; }

  wrap.classList.remove("hidden");
  body.innerHTML = res.data
    .map(
      (m) => `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.mobile)}</td>
        <td style="max-width:320px;">${escapeHtml(m.message)}</td>
        <td>${formatDateTime(m.createdAt)}</td>
      </tr>`
    )
    .join("");
}

/* ---------------- Gallery Management ---------------- */
async function loadGalleryMgmt() {
  const loading = document.getElementById("galleryMgmtLoading");
  const grid = document.getElementById("galleryMgmtGrid");
  const empty = document.getElementById("galleryMgmtEmpty");

  loading.classList.remove("hidden");
  grid.innerHTML = "";
  empty.classList.add("hidden");

  const res = await api.get("/gallery", false);
  loading.classList.add("hidden");

  if (!res.success || !res.data.length) { empty.classList.remove("hidden"); return; }

  grid.innerHTML = res.data
    .map(
      (img) => `
      <div class="gallery-item">
        <img src="${UPLOADS_BASE_URL}${img.imageUrl}" alt="${escapeHtml(img.title)}">
        <div class="caption">
          <h4>${escapeHtml(img.title)}</h4>
          ${img.description ? `<p>${escapeHtml(img.description)}</p>` : ""}
          <button class="btn btn-danger btn-sm" style="margin-top:10px;" data-delete-id="${img._id}">Delete</button>
        </div>
      </div>`
    )
    .join("");

  grid.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this image? This cannot be undone.")) return;
      const res = await api.del(`/admin/gallery/${btn.dataset.deleteId}`);
      if (res.success) {
        showToast(res.message || "Image deleted successfully.", "success");
        loadGalleryMgmt();
      } else {
        showToast(res.message || "Could not delete image.", "error");
      }
    });
  });
}

document.getElementById("galleryUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("galleryUploadError");
  errorEl.classList.remove("show");

  const title = document.getElementById("galleryTitle").value.trim();
  const description = document.getElementById("galleryDesc").value.trim();
  const fileInput = document.getElementById("galleryFile");
  const file = fileInput.files[0];

  if (!title) { errorEl.textContent = "Image title is required."; errorEl.classList.add("show"); return; }
  if (!file) { errorEl.textContent = "Please select an image to upload."; errorEl.classList.add("show"); return; }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("image", file);

  const btn = document.getElementById("galleryUploadBtn");
  btn.disabled = true;
  btn.textContent = "Uploading...";

  const res = await api.postForm("/admin/gallery", formData);

  btn.disabled = false;
  btn.textContent = "Upload Image";

  if (res.success) {
    showToast(res.message || "Image uploaded successfully.", "success");
    document.getElementById("galleryUploadForm").reset();
    loadGalleryMgmt();
  } else {
    errorEl.textContent = res.message || "Could not upload image.";
    errorEl.classList.add("show");
  }
});

/* ---------------- Settings ---------------- */
async function loadSettings() {
  const loading = document.getElementById("settingsLoading");
  const box = document.getElementById("settingsBox");
  loading.classList.remove("hidden");
  box.classList.add("hidden");

  const res = await api.get("/settings", false);
  loading.classList.add("hidden");

  if (!res.success) { showToast(res.message || "Could not load settings.", "error"); return; }

  box.classList.remove("hidden");
  const s = res.data;
  document.getElementById("collegeName").value = s.collegeName || "";
  document.getElementById("hostelName").value = s.hostelName || "";
  document.getElementById("hostelFee").value = s.hostelFee || 0;
  document.getElementById("messFee").value = s.messFee || 0;
  document.getElementById("upiId").value = s.upiId || "";
  document.getElementById("contactNumber").value = s.contactNumber || "";
  document.getElementById("settingsEmail").value = s.email || "";
  document.getElementById("address").value = s.address || "";
  document.getElementById("logo").value = s.logo || "";
  document.getElementById("backgroundImage").value = s.backgroundImage || "";
  document.getElementById("qrCode").value = s.qrCode || "";
}

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const successEl = document.getElementById("settingsSuccess");
  const errorEl = document.getElementById("settingsError");
  successEl.classList.remove("show");
  errorEl.classList.remove("show");

  const payload = {
    collegeName: document.getElementById("collegeName").value.trim(),
    hostelName: document.getElementById("hostelName").value.trim(),
    hostelFee: Number(document.getElementById("hostelFee").value) || 0,
    messFee: Number(document.getElementById("messFee").value) || 0,
    upiId: document.getElementById("upiId").value.trim(),
    contactNumber: document.getElementById("contactNumber").value.trim(),
    email: document.getElementById("settingsEmail").value.trim(),
    address: document.getElementById("address").value.trim(),
    logo: document.getElementById("logo").value.trim(),
    backgroundImage: document.getElementById("backgroundImage").value.trim(),
    qrCode: document.getElementById("qrCode").value.trim(),
  };

  const btn = document.getElementById("settingsSaveBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  const res = await api.put("/admin/settings", payload);

  btn.disabled = false;
  btn.textContent = "Save Settings";

  if (res.success) {
    successEl.textContent = res.message || "Settings updated successfully.";
    successEl.classList.add("show");
  } else {
    errorEl.textContent = res.message || "Something went wrong. Please try again.";
    errorEl.classList.add("show");
  }
});

/* ---------------- Shared: remark modal + action result handling ---------------- */
const remarkModal = document.getElementById("remarkModal");
const remarkModalTitle = document.getElementById("remarkModalTitle");
const remarkInput = document.getElementById("remarkInput");
let currentRemarkCallback = null;

function openRemarkModal(title, onConfirm) {
  remarkModalTitle.textContent = title;
  remarkInput.value = "";
  currentRemarkCallback = onConfirm;
  remarkModal.classList.add("open");
}
document.getElementById("remarkCancel").addEventListener("click", () => remarkModal.classList.remove("open"));
document.getElementById("remarkConfirm").addEventListener("click", async () => {
  const remark = remarkInput.value.trim();
  remarkModal.classList.remove("open");
  if (currentRemarkCallback) await currentRemarkCallback(remark);
});

function handleActionResult(res, reload) {
  if (res.success) {
    showToast(res.message || "Action completed successfully.", "success");
    reload();
    loadOverview();
  } else {
    showToast(res.message || "Something went wrong. Please try again.", "error");
  }
}

/* Load overview on first paint */
loadOverview();
