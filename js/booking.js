/* booking.html logic */
(async function initBooking() {
  const loading = document.getElementById("bookingLoading");
  const content = document.getElementById("bookingContent");
  const alreadyBooked = document.getElementById("alreadyBooked");
  if (!content) return;

  // Check for an existing active booking first
  const existingRes = await api.get("/bookings/my-booking");
  const profileRes = await api.get("/student/profile");
  const settingsRes = await api.get("/settings", false);

  loading.classList.add("hidden");

  if (!profileRes.success || !settingsRes.success) {
    showToast("Could not load booking details.", "error");
    return;
  }

  const student = profileRes.data;
  const settings = settingsRes.data;
  const existingBooking = existingRes.success ? existingRes.data : null;

  if (existingBooking && ["Pending", "Confirmed"].includes(existingBooking.bookingStatus)) {
    alreadyBooked.classList.remove("hidden");
    alreadyBooked.innerHTML = `You already have a booking with status <strong>${escapeHtml(existingBooking.bookingStatus)}</strong>. Visit <a href="payment-status.html" style="color:var(--primary); font-weight:600;">Booking Status</a> or <a href="payment.html" style="color:var(--primary); font-weight:600;">Payment</a> to continue.`;
    return;
  }

  content.classList.remove("hidden");
  document.getElementById("bName").textContent = student.name;
  document.getElementById("bReg").textContent = student.registrationNumber;
  document.getElementById("bBranch").textContent = student.branch;
  document.getElementById("bHostelFee").textContent = currency(settings.hostelFee);
  document.getElementById("bMessFee").textContent = currency(settings.messFee);
  document.getElementById("bTotal").textContent = currency(settings.hostelFee + settings.messFee);

  const modal = document.getElementById("confirmModal");
  document.getElementById("proceedBtn").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("cancelConfirm").addEventListener("click", () => modal.classList.remove("open"));

  document.getElementById("confirmBooking").addEventListener("click", async () => {
    const btn = document.getElementById("confirmBooking");
    btn.disabled = true;
    btn.textContent = "Booking...";

    const res = await api.post("/bookings", {});

    btn.disabled = false;
    btn.textContent = "Confirm & Continue";
    modal.classList.remove("open");

    if (res.success) {
      showToast("Booking created successfully.", "success");
      setTimeout(() => (window.location.href = "payment.html"), 900);
    } else {
      showToast(res.message || "Could not create booking.", "error");
    }
  });
})();
