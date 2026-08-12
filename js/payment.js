/* payment.html logic */
(async function initPayment() {
  const loading = document.getElementById("paymentLoading");
  const content = document.getElementById("paymentContent");
  const noBookingMsg = document.getElementById("noBookingMsg");
  const alreadySubmitted = document.getElementById("alreadySubmitted");
  if (!content) return;

  const [bookingRes, paymentRes, settingsRes] = await Promise.all([
    api.get("/bookings/my-booking"),
    api.get("/payments/my-payment"),
    api.get("/settings", false),
  ]);

  loading.classList.add("hidden");

  if (!bookingRes.success || !bookingRes.data) {
    noBookingMsg.classList.remove("hidden");
    noBookingMsg.innerHTML = `You don't have a room booking yet. Please <a href="booking.html" style="color:var(--primary); font-weight:600;">book a room</a> first.`;
    return;
  }

  const booking = bookingRes.data;
  const payment = paymentRes.success ? paymentRes.data : null;
  const settings = settingsRes.success ? settingsRes.data : {};

  if (payment && ["Pending", "Approved"].includes(payment.paymentStatus)) {
    alreadySubmitted.classList.remove("hidden");
    alreadySubmitted.innerHTML = `A payment has already been submitted for your booking. Status: <strong>${escapeHtml(payment.paymentStatus)}</strong>. Check <a href="payment-status.html" style="color:var(--primary); font-weight:600;">Booking Status</a> for details.`;
    return;
  }

  content.classList.remove("hidden");
  document.getElementById("pName").textContent = booking.studentName;
  document.getElementById("pReg").textContent = booking.registrationNumber;
  document.getElementById("pHostelFee").textContent = currency(booking.hostelFee);
  document.getElementById("pMessFee").textContent = currency(booking.messFee);
  document.getElementById("pTotal").textContent = currency(booking.totalAmount);
  document.getElementById("upiId").textContent = settings.upiId || "-";
  if (settings.qrCode) {
    document.getElementById("qrImage").src = `${UPLOADS_BASE_URL}${settings.qrCode}`;
  }

  const form = document.getElementById("paymentForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorAlert = document.getElementById("paymentError");
    const utrError = document.getElementById("utrNumberError");
    errorAlert.classList.remove("show");
    utrError.classList.remove("show");

    const utrNumber = document.getElementById("utrNumber").value.trim();
    if (!utrNumber || utrNumber.length < 4) {
      utrError.textContent = "Please enter a valid UTR number.";
      utrError.classList.add("show");
      return;
    }

    const btn = document.getElementById("submitPaymentBtn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    const res = await api.post("/payments", { bookingId: booking._id, utrNumber });

    btn.disabled = false;
    btn.textContent = "Submit Payment";

    if (res.success) {
      showToast(res.message || "Payment submitted successfully and is awaiting admin verification.", "success");
      setTimeout(() => (window.location.href = "payment-status.html"), 1200);
    } else {
      errorAlert.textContent = res.message || "Please enter a valid UTR number.";
      errorAlert.classList.add("show");
    }
  });
})();
