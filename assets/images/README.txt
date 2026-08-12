Place your images here:

- hostel-hero.jpg        -> Home page hero background
- hostel-building.jpg    -> About page building photo
- upi-qr-placeholder.png -> Fallback UPI QR shown on the Payment page until
                             the admin uploads a real one via Admin > Settings

These are referenced directly in the HTML/CSS by filename. Replace them with
real photos before deploying; the site will otherwise show broken image icons
for these three files (everything else, like the gallery, loads from the
database/API instead of static files).
