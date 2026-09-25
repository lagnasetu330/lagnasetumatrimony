/* ============================================================
   ADMIN SECURITY & AUTHENTICATION
   Cryptographic hashing, rate limiting, session token protection & XSS utils
   ============================================================ */

/**
 * Global HTML Escaping Utility for XSS Prevention
 * Accessible early to all admin scripts
 */
function escapeHtmlAdmin(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeHtmlAdmin = escapeHtmlAdmin;
window.escapeHtml = escapeHtmlAdmin;

/**
 * SHA-256 password hashing via Web Crypto API
 */
async function hashAdminPass(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

var DEFAULT_ADMIN_HASH = 'bc78e58d55cde1346e68f8e5fe588dedf62fa457aa646a500a53347faff6ee24';
var LS_ADMIN_CREDS_KEY = 'LS_ADMIN_CREDENTIALS';
window.DEFAULT_ADMIN_HASH = DEFAULT_ADMIN_HASH;
window.LS_ADMIN_CREDS_KEY = LS_ADMIN_CREDS_KEY;

/**
 * Helper to fetch freshest credentials from localStorage
 */
function getEffectiveAdminCreds() {
    var creds = {
        email: 'admin@lagnasetu.app',
        passHash: DEFAULT_ADMIN_HASH
    };
    try {
        var stored = localStorage.getItem(LS_ADMIN_CREDS_KEY);
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed && parsed.email) {
                creds.email = parsed.email.trim();
                creds.passHash = parsed.passHash || DEFAULT_ADMIN_HASH;
            }
        }
    } catch (e) {
        console.warn('[Admin Security] Credentials read warning:', e);
    }
    return creds;
}

var ADMIN_CREDS = getEffectiveAdminCreds();
window.ADMIN_CREDS = ADMIN_CREDS;

/* ---------------- Rate Limiting / Brute Force Protection ---------------- */
var LOGIN_SECURITY = {
    KEY: 'LS_ADMIN_LOGIN_SECURITY',
    MAX_ATTEMPTS: 5,
    LOCKOUT_SECONDS: 30
};

function getLoginSecurityState() {
    try {
        var raw = sessionStorage.getItem(LOGIN_SECURITY.KEY);
        if (!raw) return { attempts: 0, lockedUntil: 0 };
        var parsed = JSON.parse(raw);
        return {
            attempts: Number(parsed.attempts) || 0,
            lockedUntil: Number(parsed.lockedUntil) || 0
        };
    } catch (e) {
        return { attempts: 0, lockedUntil: 0 };
    }
}

function recordFailedLoginAttempt() {
    var s = getLoginSecurityState();
    s.attempts += 1;
    if (s.attempts >= LOGIN_SECURITY.MAX_ATTEMPTS) {
        s.lockedUntil = Date.now() + (LOGIN_SECURITY.LOCKOUT_SECONDS * 1000);
    }
    sessionStorage.setItem(LOGIN_SECURITY.KEY, JSON.stringify(s));
    return s;
}

function clearLoginSecurityState() {
    sessionStorage.removeItem(LOGIN_SECURITY.KEY);
}

/* ---------------- Cryptographic Session Token ---------------- */
async function generateAdminSessionToken(email, passHash) {
    var raw = email.toLowerCase() + '::' + passHash + '::ls_sec_salt_2026';
    return await hashAdminPass(raw);
}

async function verifyAdminSession() {
    var isLoggedIn = sessionStorage.getItem('admin_isLoggedIn') === 'true';
    var token = sessionStorage.getItem('admin_session_token');
    if (!isLoggedIn || !token) return false;

    var creds = getEffectiveAdminCreds();
    var expectedToken = await generateAdminSessionToken(creds.email, creds.passHash);
    return token === expectedToken;
}

function isSessionValidSync() {
    return sessionStorage.getItem('admin_isLoggedIn') === 'true' &&
           !!sessionStorage.getItem('admin_session_token');
}

window.verifyAdminSession = verifyAdminSession;
window.isSessionValidSync = isSessionValidSync;

/* ---------------- Admin Login Flow ---------------- */
async function doLogin() {
    var emailInput = document.getElementById('loginEmail');
    var passInput = document.getElementById('loginPass');

    var email = emailInput ? emailInput.value.trim() : '';
    var pass = passInput ? passInput.value.trim() : '';

    if (!email || !pass) {
        showToast('Please enter your admin email and password');
        return;
    }

    // Check brute-force lockout status
    var secState = getLoginSecurityState();
    var now = Date.now();
    if (secState.lockedUntil && secState.lockedUntil > now) {
        var waitSec = Math.ceil((secState.lockedUntil - now) / 1000);
        showToast('Too many attempts. Login locked for ' + waitSec + 's');
        return;
    }

    var inputHash = await hashAdminPass(pass);
    var creds = getEffectiveAdminCreds();
    var isCustomPassSet = creds.passHash && creds.passHash !== DEFAULT_ADMIN_HASH;

    var isMatch = false;
    if (isCustomPassSet) {
        // Once admin sets a custom password, old default password is permanently disabled
        isMatch = (email.toLowerCase() === creds.email.toLowerCase() && inputHash === creds.passHash);
    } else {
        // Initial setup only
        isMatch = (email.toLowerCase() === creds.email.toLowerCase() && inputHash === DEFAULT_ADMIN_HASH);
    }

    if (isMatch) {
        clearLoginSecurityState();
        var sessionToken = await generateAdminSessionToken(creds.email, creds.passHash);
        sessionStorage.setItem('admin_isLoggedIn', 'true');
        sessionStorage.setItem('admin_session_token', sessionToken);
        sessionStorage.setItem('admin_activeScreen', 'scr-dashboard');

        if (typeof saveAdminData === 'function') saveAdminData();
        showToast('Welcome back, Admin!');
        setTimeout(function() { go('scr-dashboard', true); }, 300);
    } else {
        var failState = recordFailedLoginAttempt();
        if (failState.lockedUntil && failState.lockedUntil > Date.now()) {
            showToast('Too many failed attempts! Login locked for 30 seconds.');
        } else {
            var rem = LOGIN_SECURITY.MAX_ATTEMPTS - failState.attempts;
            showToast('Invalid credentials (' + rem + ' attempt' + (rem === 1 ? '' : 's') + ' left)');
        }
        if (passInput) {
            passInput.value = '';
            passInput.focus();
        }
    }
}

function confirmLogout() { openModal('modalLogout'); }

function doLogout() {
    closeModal('modalLogout');
    sessionStorage.removeItem('admin_isLoggedIn');
    sessionStorage.removeItem('admin_session_token');
    sessionStorage.removeItem('admin_activeScreen');
    sessionStorage.removeItem('admin_activeUserId');
    sessionStorage.removeItem('admin_activeReportId');
    sessionStorage.removeItem('admin_activePayId');
    sessionStorage.removeItem('admin_activeInterestId');
    sessionStorage.removeItem('admin_helpTab');
    sessionStorage.removeItem('admin_chatUserA');
    sessionStorage.removeItem('admin_chatUserB');
    clearLoginSecurityState();
    go('scr-login', true);
    showToast('Logged out');
}

/* ---------------- Password Update Flow ---------------- */
async function updateAdminPassword() {
    var curInput = document.getElementById('settingsCurrentPass') || document.getElementById('settingsCurPass');
    var newInput = document.getElementById('settingsNewPass');
    var confInput = document.getElementById('settingsConfirmPass') || document.getElementById('settingsConfPass');

    var curPass = curInput ? curInput.value.trim() : '';
    var newPass = newInput ? newInput.value.trim() : '';
    var confPass = confInput ? confInput.value.trim() : '';

    if (!curPass) {
        showToast('Please enter current password');
        if (curInput) curInput.focus();
        return;
    }

    var curHash = await hashAdminPass(curPass);
    var creds = getEffectiveAdminCreds();
    var expectedHash = creds.passHash || DEFAULT_ADMIN_HASH;

    if (curHash !== expectedHash) {
        showToast('Current password is incorrect');
        if (curInput) curInput.focus();
        return;
    }

    if (newPass.length < 8) {
        showToast('New password must be at least 8 characters');
        if (newInput) newInput.focus();
        return;
    }

    if (newPass !== confPass) {
        showToast('New password and confirmation do not match');
        if (confInput) confInput.focus();
        return;
    }

    var newHash = await hashAdminPass(newPass);
    creds.passHash = newHash;
    delete creds.pass;
    localStorage.setItem(LS_ADMIN_CREDS_KEY, JSON.stringify(creds));

    // Update in-memory creds
    ADMIN_CREDS = getEffectiveAdminCreds();
    window.ADMIN_CREDS = ADMIN_CREDS;

    // Refresh session token with new password hash so active admin remains authenticated
    var refreshedToken = await generateAdminSessionToken(creds.email, newHash);
    sessionStorage.setItem('admin_session_token', refreshedToken);

    if (curInput) curInput.value = '';
    if (newInput) newInput.value = '';
    if (confInput) confInput.value = '';

    showToast('Admin password updated successfully!');
}

// Global Window Exports
if (typeof doLogin !== 'undefined') window.doLogin = doLogin;
if (typeof doLogout !== 'undefined') window.doLogout = doLogout;
if (typeof confirmLogout !== 'undefined') window.confirmLogout = confirmLogout;
if (typeof updateAdminPassword !== 'undefined') window.updateAdminPassword = updateAdminPassword;
