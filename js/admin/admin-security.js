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
        email: 'admin@mangalsetu.in',
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

/**
 * Fetch latest admin credentials from Supabase app_settings
 */
async function syncAdminCredsFromSupabase() {
    if (typeof supabaseGetAppSetting !== 'function') return;
    try {
        const remoteCreds = await supabaseGetAppSetting('admin_credentials');
        if (remoteCreds && remoteCreds.email && remoteCreds.passHash) {
            localStorage.setItem(LS_ADMIN_CREDS_KEY, JSON.stringify(remoteCreds));
            ADMIN_CREDS = remoteCreds;
            window.ADMIN_CREDS = ADMIN_CREDS;
            const disp = document.getElementById('adminDisplayEmail');
            if (disp) disp.textContent = remoteCreds.email;
            const inp = document.getElementById('settingsAdminEmail');
            if (inp) inp.value = remoteCreds.email;
            console.info('[Admin Security] Admin credentials synchronized from Supabase');
        }
    } catch (e) {
        console.warn('[Admin Security] Supabase creds sync notice:', e);
    }
}
window.syncAdminCredsFromSupabase = syncAdminCredsFromSupabase;

/**
 * Safe client-side obfuscation for Remember Me stored password
 */
function encodeStoredAdminPass(p) {
    if (!p) return '';
    try {
        return btoa(unescape(encodeURIComponent(p)));
    } catch (_) {
        return btoa(p);
    }
}

function decodeStoredAdminPass(p) {
    if (!p) return '';
    try {
        return decodeURIComponent(escape(atob(p)));
    } catch (_) {
        return atob(p);
    }
}

/**
 * Restore Remembered Admin login (Email + Password)
 */
function restoreAdminRememberMe() {
    try {
        // Purge any legacy stored password immediately
        try { localStorage.removeItem('mangalSetu_admin_rememberPass'); } catch (_) {}

        const isRem = localStorage.getItem('mangalSetu_admin_rememberMe') === 'true';
        const remEmail = localStorage.getItem('mangalSetu_admin_rememberEmail') || '';
        const chk = document.getElementById('adminRememberMe');
        const emailInput = document.getElementById('loginEmail');

        if (chk) chk.checked = isRem;
        if (isRem && remEmail && emailInput && !emailInput.value) {
            emailInput.value = remEmail;
        }
    } catch (_) {}
}
window.restoreAdminRememberMe = restoreAdminRememberMe;

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

        // Handle Remember Me (Remember only email, NEVER store passwords in localStorage)
        const chk = document.getElementById('adminRememberMe');
        if (chk && chk.checked) {
            localStorage.setItem('mangalSetu_admin_rememberMe', 'true');
            localStorage.setItem('mangalSetu_admin_rememberEmail', email);
        } else {
            localStorage.removeItem('mangalSetu_admin_rememberMe');
            localStorage.removeItem('mangalSetu_admin_rememberEmail');
        }
        try { localStorage.removeItem('mangalSetu_admin_rememberPass'); } catch (_) {}

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

    // Save directly to Supabase app_settings
    if (typeof supabaseSetAppSetting === 'function') {
        try {
            await supabaseSetAppSetting('admin_credentials', creds);
            console.info('[Admin Security] Admin credentials updated in Supabase app_settings');
        } catch(e) {
            console.warn('[Admin Security] Failed saving creds to Supabase:', e);
        }
    }

    // Update in-memory creds
    ADMIN_CREDS = getEffectiveAdminCreds();
    window.ADMIN_CREDS = ADMIN_CREDS;

    // Refresh session token with new password hash so active admin remains authenticated
    var refreshedToken = await generateAdminSessionToken(creds.email, newHash);
    sessionStorage.setItem('admin_session_token', refreshedToken);

    // Always purge any stored password
    try { localStorage.removeItem('mangalSetu_admin_rememberPass'); } catch (_) {}

    if (curInput) curInput.value = '';
    if (newInput) newInput.value = '';
    if (confInput) confInput.value = '';

    showToast('Admin password updated successfully! ✨');
}

/* ---------------- Admin Forgot Password Flow ---------------- */
var adminForgotState = {
    email: '',
    otp: '',
    expiresAt: 0,
    verified: false,
    timerId: null
};

function handleAdminForgotOtpInput(el, event) {
    if (event && event.key === 'Backspace') {
        if (!el.value) {
            const prev = el.previousElementSibling;
            if (prev && prev.tagName === 'INPUT') {
                prev.focus();
                prev.select();
            }
        }
        return;
    }
    if (el.value.length >= 1) {
        el.value = el.value.slice(0, 1);
        const next = el.nextElementSibling;
        if (next && next.tagName === 'INPUT') {
            next.focus();
            next.select();
        }
    }
}

function handleAdminForgotOtpPaste(e) {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData).getData('text');
    if (!clip) return;
    const digits = clip.replace(/\D/g, '').slice(0, 6);
    for (let i = 0; i < 6; i++) {
        const inp = document.getElementById('adminForgotOtp' + (i + 1));
        if (inp) inp.value = digits[i] || '';
    }
    const focusIdx = Math.min(digits.length + 1, 6);
    const target = document.getElementById('adminForgotOtp' + focusIdx);
    if (target) target.focus();
}

function startAdminForgotResendCountdown(sec) {
    var resendBtn = document.getElementById('adminForgotResendBtn');
    var timerText = document.getElementById('adminForgotTimerText');
    if (adminForgotState.timerId) {
        clearInterval(adminForgotState.timerId);
        adminForgotState.timerId = null;
    }

    var remaining = sec;
    if (resendBtn) {
        resendBtn.dataset.disabled = 'true';
        resendBtn.style.opacity = '0.5';
        resendBtn.style.pointerEvents = 'none';
        resendBtn.style.cursor = 'not-allowed';
    }
    if (timerText) {
        timerText.style.display = 'inline';
        timerText.textContent = '(' + remaining + 's)';
    }

    adminForgotState.timerId = setInterval(function() {
        remaining--;
        if (remaining <= 0) {
            clearInterval(adminForgotState.timerId);
            adminForgotState.timerId = null;
            if (resendBtn) {
                resendBtn.dataset.disabled = 'false';
                resendBtn.style.opacity = '1';
                resendBtn.style.pointerEvents = 'auto';
                resendBtn.style.cursor = 'pointer';
            }
            if (timerText) {
                timerText.style.display = 'none';
                timerText.textContent = '';
            }
        } else {
            if (timerText) {
                timerText.textContent = '(' + remaining + 's)';
            }
        }
    }, 1000);
}

async function sendAdminForgotOtp() {
    var emailInput = document.getElementById('forgotAdminEmail');
    var email = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@') || !email.includes('.')) {
        showToast('Please enter your registered admin email');
        if (emailInput) emailInput.focus();
        return;
    }

    var creds = getEffectiveAdminCreds();
    if (email.toLowerCase() !== creds.email.toLowerCase()) {
        showToast('This email is not registered as an administrator');
        return;
    }

    var otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminForgotState.email = creds.email;
    adminForgotState.otp = otp;
    adminForgotState.expiresAt = Date.now() + (10 * 60 * 1000); // 10 mins
    adminForgotState.verified = false;

    // Update display text on OTP screen
    var targetEl = document.getElementById('adminForgotTargetEmail');
    if (targetEl) targetEl.textContent = creds.email;

    // Reset OTP boxes
    for (var i = 1; i <= 6; i++) {
        var box = document.getElementById('adminForgotOtp' + i);
        if (box) box.value = '';
    }

    go('scr-forgot-otp');
    setTimeout(function() {
        var firstBox = document.getElementById('adminForgotOtp1');
        if (firstBox) firstBox.focus();
    }, 200);

    startAdminForgotResendCountdown(60);

    showToast('Sending verification code...');
    try {
        if (typeof sendOtpEmail === 'function') {
            var res = await sendOtpEmail(creds.email, otp, 'Administrator', 'reset');
            if (res && res.success) {
                showToast('6-digit code sent to ' + creds.email + ' ✨');
            } else {
                console.warn('[Admin Security] Email send notice:', res);
                showToast('Code sent to ' + creds.email);
            }
        } else {
            console.warn('[Admin Security] sendOtpEmail not available, OTP is:', otp);
            showToast('Verification code generated');
        }
    } catch(err) {
        console.error('[Admin Security] sendOtpEmail error:', err);
        showToast('Code sent to ' + creds.email);
    }
}

async function resendAdminForgotOtp() {
    var resendBtn = document.getElementById('adminForgotResendBtn');
    if (resendBtn && resendBtn.dataset.disabled === 'true') {
        return;
    }

    if (!adminForgotState.email) {
        showToast('Please enter your admin email first');
        go('scr-forgot');
        return;
    }

    var otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminForgotState.otp = otp;
    adminForgotState.expiresAt = Date.now() + (10 * 60 * 1000);
    adminForgotState.verified = false;

    for (var i = 1; i <= 6; i++) {
        var box = document.getElementById('adminForgotOtp' + i);
        if (box) box.value = '';
    }
    var firstBox = document.getElementById('adminForgotOtp1');
    if (firstBox) firstBox.focus();

    startAdminForgotResendCountdown(60);
    showToast('Resending verification code...');

    try {
        if (typeof sendOtpEmail === 'function') {
            await sendOtpEmail(adminForgotState.email, otp, 'Administrator', 'reset');
        }
        showToast('New verification code sent! ✨');
    } catch(err) {
        console.error('[Admin Security] Resend OTP error:', err);
        showToast('Code re-sent to ' + adminForgotState.email);
    }
}

function verifyAdminForgotOtp() {
    var digits = '';
    for (var i = 1; i <= 6; i++) {
        var box = document.getElementById('adminForgotOtp' + i);
        digits += (box ? box.value.trim() : '');
    }

    if (digits.length !== 6) {
        showToast('Please enter all 6 digits of the code');
        return;
    }

    if (!adminForgotState.otp || Date.now() > adminForgotState.expiresAt) {
        showToast('Verification code has expired. Please request a new code.');
        return;
    }

    if (digits !== adminForgotState.otp) {
        showToast('Invalid verification code. Please check and try again.');
        return;
    }

    adminForgotState.verified = true;
    showToast('Code verified successfully! 👍');

    var newPassInp = document.getElementById('adminResetNewPass');
    var confPassInp = document.getElementById('adminResetConfirmPass');
    if (newPassInp) newPassInp.value = '';
    if (confPassInp) confPassInp.value = '';

    go('scr-newpass');
    setTimeout(function() {
        if (newPassInp) newPassInp.focus();
    }, 200);
}

async function completeAdminPasswordReset() {
    if (!adminForgotState || !adminForgotState.verified) {
        showToast('Verification required. Please verify OTP first.');
        go('scr-forgot');
        return;
    }

    var newPassInp = document.getElementById('adminResetNewPass');
    var confPassInp = document.getElementById('adminResetConfirmPass');
    var newPass = newPassInp ? newPassInp.value.trim() : '';
    var confPass = confPassInp ? confPassInp.value.trim() : '';

    if (!newPass) {
        showToast('Please enter a new password');
        if (newPassInp) newPassInp.focus();
        return;
    }

    if (newPass.length < 8) {
        showToast('Password must be at least 8 characters');
        if (newPassInp) newPassInp.focus();
        return;
    }

    if (newPass !== confPass) {
        showToast('Passwords do not match');
        if (confPassInp) confPassInp.focus();
        return;
    }

    var newHash = await hashAdminPass(newPass);
    var creds = getEffectiveAdminCreds();
    creds.passHash = newHash;
    delete creds.pass;
    localStorage.setItem(LS_ADMIN_CREDS_KEY, JSON.stringify(creds));

    if (typeof supabaseSetAppSetting === 'function') {
        try {
            await supabaseSetAppSetting('admin_credentials', creds);
            console.info('[Admin Security] Password reset saved to Supabase app_settings');
        } catch(e) {
            console.warn('[Admin Security] Supabase password reset save warning:', e);
        }
    }

    ADMIN_CREDS = creds;
    window.ADMIN_CREDS = ADMIN_CREDS;

    // Always purge any stored password
    try { localStorage.removeItem('mangalSetu_admin_rememberPass'); } catch (_) {}

    // Clear security lockouts & reset state
    clearLoginSecurityState();
    if (adminForgotState.timerId) {
        clearInterval(adminForgotState.timerId);
        adminForgotState.timerId = null;
    }
    adminForgotState = { email: '', otp: '', expiresAt: 0, verified: false, timerId: null };

    // Auto-login into dashboard with fresh session token
    var sessionToken = await generateAdminSessionToken(creds.email, newHash);
    sessionStorage.setItem('admin_isLoggedIn', 'true');
    sessionStorage.setItem('admin_session_token', sessionToken);
    sessionStorage.setItem('admin_activeScreen', 'scr-dashboard');

    if (newPassInp) newPassInp.value = '';
    if (confPassInp) confPassInp.value = '';

    showToast('Password reset successfully! Welcome, Admin ✨');
    setTimeout(function() {
        go('scr-dashboard', true);
    }, 400);
}

// Global Window Exports
if (typeof doLogin !== 'undefined') window.doLogin = doLogin;
if (typeof doLogout !== 'undefined') window.doLogout = doLogout;
if (typeof confirmLogout !== 'undefined') window.confirmLogout = confirmLogout;
if (typeof updateAdminPassword !== 'undefined') window.updateAdminPassword = updateAdminPassword;
if (typeof sendAdminForgotOtp !== 'undefined') window.sendAdminForgotOtp = sendAdminForgotOtp;
if (typeof resendAdminForgotOtp !== 'undefined') window.resendAdminForgotOtp = resendAdminForgotOtp;
if (typeof verifyAdminForgotOtp !== 'undefined') window.verifyAdminForgotOtp = verifyAdminForgotOtp;
if (typeof completeAdminPasswordReset !== 'undefined') window.completeAdminPasswordReset = completeAdminPasswordReset;
if (typeof handleAdminForgotOtpInput !== 'undefined') window.handleAdminForgotOtpInput = handleAdminForgotOtpInput;
if (typeof handleAdminForgotOtpPaste !== 'undefined') window.handleAdminForgotOtpPaste = handleAdminForgotOtpPaste;

// Auto-sync credentials and remember-me state on load
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            restoreAdminRememberMe();
            syncAdminCredsFromSupabase();
        });
    } else {
        restoreAdminRememberMe();
        syncAdminCredsFromSupabase();
    }
}
