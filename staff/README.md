# Agnes Staff Portal (standalone repo)

Only purpose: create and delete the login details (username, email, password, role) that staff use on the
hospital login page. Both apps share the same MySQL `employees` table.

Portal accounts: administrators create their own portal account on the "Create portal account" tab.
This needs the registration code you set in PORTAL_SIGNUP_CODE (sign-up is disabled if it is not set).

Deploy (Render Web Service): Build `npm install`, Start `npm start`.
Env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSL (same database as the hospital backend),
JWT_SECRET, PORTAL_SIGNUP_CODE.
Files: portal-api.js (mounted at /staff, replaces staff-api.js), public/portal.html, portal.js,
staff-portal.css, config.js (set HOSPITAL_URL).
Remove: portal-login.html, portal-login.js, staff-portal.html, staff-portal.js.