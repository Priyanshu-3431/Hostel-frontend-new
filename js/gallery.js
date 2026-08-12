/* Public gallery rendering + lightbox (used by gallery.html) */
(async function loadGallery() {
  const loading = document.getElementById("galleryLoading");
  const empty = document.getElementById("galleryEmpty");
  const grid = document.getElementById("galleryGrid");

  const res = await api.get("/gallery", false);
  loading.classList.add("hidden");

  if (!res.success || !res.data || res.data.length === 0) {
    empty.classList.remove("hidden");
    return;
  }

  grid.innerHTML = res.data
    .map(
      (img) => `
      <div class="gallery-item" data-url="${UPLOADS_BASE_URL}${img.imageUrl}" data-title="${escapeHtml(img.title)}" data-desc="${escapeHtml(img.description || "")}">
        <img src="${UPLOADS_BASE_URL}${img.imageUrl}" alt="${escapeHtml(img.title)}" loading="lazy">
        <div class="caption">
          <h4>${escapeHtml(img.title)}</h4>
          ${img.description ? `<p>${escapeHtml(img.description)}</p>` : ""}
        </div>
      </div>`
    )
    .join("");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");

  grid.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      lightboxImg.src = item.dataset.url;
      lightboxCaption.textContent = item.dataset.desc
        ? `${item.dataset.title} — ${item.dataset.desc}`
        : item.dataset.title;
      lightbox.classList.add("open");
    });
  });

  document.getElementById("lightboxClose").addEventListener("click", () => {
    lightbox.classList.remove("open");
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("open");
  });
})();
