// AGNES MEMORIAL - STAFF PORTAL (create / delete hospital staff logins)
const API = ((typeof API_URL !== "undefined" && API_URL) || "").replace(/\/$/, "");
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let token = sessionStorage.getItem("portalToken");
let employees = [];
let lastCred = "";

function toast(text, isErr) {
    const t = $("toast");
    t.innerHTML = '<i class="fa-solid ' + (isErr ? "fa-circle-exclamation" : "fa-circle-check") + '"></i><span>' + esc(text) + '</span>';
    t.className = "show" + (isErr ? " err" : "");
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ""), 3200);
}

// ---------- styled confirm box (replaces the plain browser confirm) ----------
function ask(title, text, okText, danger) {
    return new Promise((resolve) => {
        const d = $("confirmDialog");
        $("qTitle").textContent = title; $("qText").textContent = text; $("qOk").textContent = okText || "Yes";
        $("qIcon").className = "fa-solid " + (danger ? "fa-triangle-exclamation" : "fa-key");
        d.className = "ask" + (danger ? " danger" : "");
        const done = (v) => { d.close(); resolve(v); };
        $("qOk").onclick = () => done(true);
        $("qCancel").onclick = () => done(false);
        d.oncancel = (e) => { e.preventDefault(); done(false); };
        d.showModal();
    });
}

async function call(path, method, body, noRedirect) {
    const res = await fetch(API + "/staff" + path, {
        method: method || "GET",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !noRedirect) { logout(); throw new Error(data.message || "Session expired"); }
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// ---------- screens ----------
function enter(admin) {
    $("authSection").hidden = true; $("appSection").hidden = false; $("topNav").hidden = false;
    $("who").innerHTML = '<i class="fa fa-user-shield"></i> Administrator';
    loadEmployees();
}
function logout() {
    sessionStorage.removeItem("portalToken"); token = null;
    $("appSection").hidden = true; $("topNav").hidden = true; $("authSection").hidden = false;
}
$("logoutBtn").onclick = logout;

function tab(signup) {
    $("loginForm").hidden = signup; $("signupForm").hidden = !signup;
    $("tabLogin").className = "btn" + (signup ? " ghost" : "");
    $("tabSignup").className = "btn" + (signup ? "" : " ghost");
}
$("tabLogin").onclick = () => tab(false);
$("tabSignup").onclick = () => tab(true);

async function authSubmit(e, path, body, msgEl, btn) {
    e.preventDefault(); msgEl.textContent = ""; btn.disabled = true;
    try {
        const d = await call(path, "POST", body, true);
        token = d.token; sessionStorage.setItem("portalToken", token);
        enter(d.admin);
    } catch (err) { msgEl.textContent = err.message; }
    btn.disabled = false;
}
$("loginForm").addEventListener("submit", (e) =>
    authSubmit(e, "/login", { username: $("lUser").value, password: $("lPass").value }, $("lMsg"), $("lBtn")));
$("signupForm").addEventListener("submit", (e) =>
    authSubmit(e, "/signup", { name: $("sName").value, username: $("sUser").value, password: $("sPass").value, code: $("sCode").value }, $("sMsg"), $("sBtn")));

// ---------- credentials slip ----------
function showCreds(c, person, title) {
    $("credTitle").textContent = title;
    $("cRole").textContent = person.role; $("cEmail").textContent = person.email || "-";
    $("cUrl").textContent = (typeof HOSPITAL_URL !== "undefined" ? HOSPITAL_URL.replace(/\/$/, "") : "") + "/hospital-login.html";
    $("cUser").textContent = c.username; $("cPass").textContent = c.password;
    lastCred = "Agnes Memorial staff login\nRole: " + person.role + "\nLogin page: " + $("cUrl").textContent +
        "\nUsername: " + c.username + "\nTemporary password: " + c.password;
    $("credDialog").showModal();
}
$("credClose").onclick = () => $("credDialog").close();
$("printBtn").onclick = () => window.print();
$("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(lastCred); toast("Copied"); }
    catch (e) { toast("Copy not allowed here. Use Print instead.", true); }
};

// ---------- register employee ----------
$("genBtn").onclick = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let p = "";
    for (const n of crypto.getRandomValues(new Uint8Array(10))) p += chars[n % chars.length];
    $("ePass").value = p + "7"; // guarantees a digit
};

$("empForm").addEventListener("submit", async (e) => {
    e.preventDefault(); $("empBtn").disabled = true;
    try {
        const d = await call("/employees", "POST", {
            username: $("eUser").value, email: $("eEmail").value, name: $("eName").value,
            role: $("eRole").value, password: $("ePass").value
        });
        $("empForm").reset();
        showCreds(d.credentials, d.employee, "New staff login. Hand these details to the employee.");
        loadEmployees();
    } catch (err) { toast(err.message, true); }
    $("empBtn").disabled = false;
});

// ---------- list / delete / reset ----------
function renderEmployees() {
    $("empCount").textContent = "(" + employees.length + ")";
    $("empBody").innerHTML = employees.length ? employees.map((e) =>
        "<tr><td>" + esc(e.employee_id) + "</td><td>" + esc(e.username) + "</td><td>" + esc(e.email) + "</td>" +
        "<td>" + esc(e.role) + "</td><td>" + esc(e.last_login || "Never") + "</td>" +
        '<td class="acts"><button class="btn sm ghost" data-act="reset" data-id="' + e.id + '">Reset password</button>' +
        '<button class="btn sm danger" data-act="delete" data-id="' + e.id + '">Delete</button></td></tr>').join("")
        : '<tr><td colspan="6" class="empty">No employees yet.</td></tr>';
}
async function loadEmployees() {
    try { employees = await call("/employees"); renderEmployees(); loadRequests(); }
    catch (err) { toast(err.message, true); }
}
$("empBody").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const emp = employees.find((x) => String(x.id) === b.dataset.id); if (!emp) return;
    try {
        if (b.dataset.act === "delete") {
            if (!(await ask("Delete employee?", "Permanently delete " + emp.username + "? Their login is removed and this cannot be undone.", "Yes, delete", true))) return;
            toast((await call("/employees/" + emp.id, "DELETE")).message);
        } else {
            if (!(await ask("Reset password?", "Reset the password for " + emp.username + "? The current password will stop working.", "Yes, reset", false))) return;
            const d = await call("/employees/" + emp.id + "/reset-password", "POST");
            showCreds(d.credentials, d.employee, "Password reset. Give the new temporary password to the employee.");
        }
        loadEmployees();
    } catch (err) { toast(err.message, true); }
});

// ---------- forgot-password requests ----------
async function loadRequests() {
    try {
        const list = await call("/password-requests");
        $("reqCard").hidden = !list.length; $("reqCount").textContent = "(" + list.length + ")";
        $("reqBody").innerHTML = list.map((r) =>
            "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.username) + "</td><td>" + esc(r.created_at) + "</td>" +
            '<td class="acts"><button class="btn sm ghost" data-act="req-reset" data-emp="' + r.employee_id + '">Reset password</button>' +
            '<button class="btn sm danger" data-act="req-dismiss" data-id="' + r.id + '">Dismiss</button></td></tr>').join("");
    } catch (err) { /* ignore */ }
}
$("reqBody").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    try {
        if (b.dataset.act === "req-reset") {
            if (!(await ask("Reset password?", "Give this employee a new temporary password? The old one will stop working.", "Yes, reset", false))) return;
            const d = await call("/employees/" + b.dataset.emp + "/reset-password", "POST");
            showCreds(d.credentials, d.employee, "Password reset. Give the new temporary password to the employee.");
        } else await call("/password-requests/" + b.dataset.id + "/dismiss", "POST");
        loadEmployees();
    } catch (err) { toast(err.message, true); }
});

// ---------- start ----------
if (token) call("/me").then((d) => enter(d.admin)).catch(() => {});