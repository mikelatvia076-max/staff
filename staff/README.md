# Agnes Staff Portal (static site)

Only purpose: create and delete the login details (username, email, password, role) that staff use on the
hospital login page. Pages only - the API lives in the hospital backend repo (portal-api.js, mounted at /staff).

Files: index.html, portal.js, staff-portal.css, config.js (all in the repo root).

Setup:
1. Edit config.js: set API_URL (backend address) and HOSPITAL_URL (hospital site address).
2. Add this site's address to CORS_ORIGINS on the backend.

Portal accounts: administrators create their own portal account on the "Create portal account" tab.
This needs the registration code set in PORTAL_SIGNUP_CODE on the backend.

Deploy (Render Static Site): Build command empty, Publish directory `.`