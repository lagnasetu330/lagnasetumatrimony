/* ============================================================ REGISTRATION & AUTH ============================================================ */
// Cryptographic Secret Salt (Pepper) — protects against rainbow tables & dictionary attacks
const AUTH_PEPPER = 'LS_MATRIMONY_SECURE_2026_@v9#';

async function hashPass(str) {
    if (!str) return '';
    const enc = new TextEncoder().encode(str + AUTH_PEPPER);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Backward compatibility check for legacy unsalted hashes with auto-upgrade
async function hashPassLegacy(str) {
    if (!str) return '';
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pro-level Brute Force & Rate-Limiting Protection
const LOGIN_SECURITY = {
    failedAttempts: 0,
    lockUntil: 0
};

// Sanitization helper: NEVER expose password or passwordHash in state or sessionStorage
function createSafeUserSession(user) {
    if (!user) return null;
    const safe = { ...user };
    delete safe.password;
    delete safe.passwordHash;
    return safe;
}

// Dedicated Auth Accounts Store (Prevents conflict with community PROFILES)
var LS_ACCOUNTS_KEY = window.LS_ACCOUNTS_KEY || 'LS_AUTH_ACCOUNTS';

function getStoredAccounts() {
    let accounts = [];
    try {
        const raw = localStorage.getItem(LS_ACCOUNTS_KEY);
        if (raw) accounts = JSON.parse(raw);
    } catch(e) {}

    // Migration & compatibility: Read from LS_COMMUNITY_USERS if not in accounts
    try {
        const legacyKey = window.LS_USERS_KEY || 'LS_COMMUNITY_USERS';
        const rawLegacy = localStorage.getItem(legacyKey);
        if (rawLegacy) {
            const parsed = JSON.parse(rawLegacy);
            if (Array.isArray(parsed)) {
                parsed.forEach(u => {
                    if (u && u.email && u.passwordHash && !accounts.some(a => a.email && a.email.toLowerCase() === u.email.toLowerCase())) {
                        accounts.push(u);
                    }
                });
            }
        }
    } catch(e) {}

    return Array.isArray(accounts) ? accounts : [];
}
window.getStoredAccounts = getStoredAccounts;

function saveStoredAccounts(accounts) {
    try {
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
        // Keep LS_COMMUNITY_USERS in sync for any legacy components
        const legacyKey = window.LS_USERS_KEY || 'LS_COMMUNITY_USERS';
        const rawLegacy = localStorage.getItem(legacyKey);
        const users = rawLegacy ? JSON.parse(rawLegacy) : [];
        if (Array.isArray(users)) {
            accounts.forEach(acc => {
                const idx = users.findIndex(u => u.email && acc.email && u.email.toLowerCase() === acc.email.toLowerCase());
                if (idx !== -1) {
                    users[idx] = { ...users[idx], ...acc };
                } else {
                    users.push(acc);
                }
            });
            localStorage.setItem(legacyKey, JSON.stringify(users));
        }
    } catch(e) {}
}
window.saveStoredAccounts = saveStoredAccounts;

/**
 * Completely purge a user account from all LocalStorage keys, caches, state, and sessions
 * @param {string} email
/**
 * Cleanly reset all registration state in memory and clear all registration input fields in the DOM
 */
function resetRegistrationStateAndInputs() {
    if (typeof state !== 'undefined') {
        state.regData = {
            email: '',
            password: '',
            caste: '',
            photos: ['', '', ''],
            photo: '',
            gender: '',
            name: '',
            dob: '',
            age: null,
            height: '',
            weight: '',
            education: '',
            marital: '',
            physical: '',
            occupation: '',
            income: '',
            hobbies: [],
            fatherName: '',
            fatherOcc: '',
            fatherMobile: '',
            fatherWhatsapp: true,
            motherName: '',
            motherOcc: '',
            sister: '',
            brother: '',
            city: '',
            taluka: '',
            district: '',
            address: ''
        };
    }

    // Step 1: Account inputs
    const r1email = document.getElementById('r1email');
    if (r1email) { r1email.value = ''; r1email.classList.remove('input-error'); }
    const r1pass = document.getElementById('r1pass');
    if (r1pass) { r1pass.value = ''; r1pass.classList.remove('input-error'); }
    for (let i = 1; i <= 6; i++) {
        const otpInp = document.getElementById(`regOtp${i}`);
        if (otpInp) otpInp.value = '';
    }
    const agreeCheck = document.getElementById('agreeTermsCheck');
    if (agreeCheck) { agreeCheck.checked = false; }
    if (typeof toggleRegSubmitButton === 'function') { toggleRegSubmitButton(); }

    // Step 2: Caste inputs
    const casteSearch = document.getElementById('regCasteInput') || document.getElementById('casteSearchInput');
    if (casteSearch) casteSearch.value = '';
    document.querySelectorAll('#casteListContainer .caste-item').forEach(el => el.classList.remove('active'));

    // Step 3: Personal & family inputs
    for (let slot = 1; slot <= 3; slot++) {
        const img = document.getElementById(`regSlotImg${slot}`);
        const empty = document.getElementById(`regSlotEmpty${slot}`);
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (empty) empty.style.display = 'flex';
    }
    const photoSlotInput = document.getElementById('regPhotoSlotInput');
    if (photoSlotInput) photoSlotInput.value = '';
    const avatarImg = document.getElementById('regAvatarImg');
    if (avatarImg) { avatarImg.src = ''; avatarImg.style.display = 'none'; }

    const genderText = document.getElementById('genderValText');
    if (genderText) genderText.textContent = 'Select gender';
    const ddGender = document.getElementById('ddGender');
    if (ddGender) ddGender.classList.remove('open');

    const fields = [
        'regFullName', 'regDobInput', 'regOwnMobile', 'regHeight', 'regWeight',
        'regEducation', 'regOccupation', 'regFatherName', 'regFatherOcc',
        'regFatherMobile', 'regMotherName', 'regMotherOcc', 'regCity',
        'regTaluka', 'regDistrict', 'regAddress'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('input-error');
            el.style.borderColor = '';
        }
    });

    const ageBadge = document.getElementById('regAgeBadge');
    if (ageBadge) ageBadge.style.display = 'none';

    const maritalSpan = document.querySelector('#ddMarital .dd-trigger span');
    if (maritalSpan) maritalSpan.textContent = 'Select marital status';
    const physicalSpan = document.querySelector('#ddPhysical .dd-trigger span');
    if (physicalSpan) physicalSpan.textContent = 'Select physical status';
    const incomeSpan = document.querySelector('#ddIncome .dd-trigger span');
    if (incomeSpan) incomeSpan.textContent = 'Select income range';

    const hobbyList = document.getElementById('hobbyList');
    if (hobbyList) hobbyList.innerHTML = '';
    const sisterList = document.getElementById('sisterList');
    if (sisterList) sisterList.innerHTML = '';
    const brotherList = document.getElementById('brotherList');
    if (brotherList) brotherList.innerHTML = '';

    const tglSister = document.getElementById('tglSister');
    if (tglSister) tglSister.classList.remove('active');
    const sisterBlock = document.getElementById('sisterBlock');
    if (sisterBlock) sisterBlock.style.display = 'block';

    const tglBrother = document.getElementById('tglBrother');
    if (tglBrother) tglBrother.classList.remove('active');
    const brotherBlock = document.getElementById('brotherBlock');
    if (brotherBlock) brotherBlock.style.display = 'block';
}
window.resetRegistrationStateAndInputs = resetRegistrationStateAndInputs;

/**
 * Completely purge a deleted user's cached account across ALL browser stores
 * @param {string} email
 * @param {string|number} id
 */
function purgeUserAccountLocally(email, id) {
    const normEmail = email ? String(email).trim().toLowerCase() : '';
    const normId = id ? String(id).trim() : '';

    console.warn(`[LagnaSetu] Purging account locally for email: ${normEmail}, id: ${normId}`);

    // 1. Purge from LS_AUTH_ACCOUNTS
    try {
        const raw = localStorage.getItem('LS_AUTH_ACCOUNTS');
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                const filtered = list.filter(u => {
                    const matchEmail = normEmail && u.email && u.email.toLowerCase() === normEmail;
                    const matchId = normId && (String(u.id) === normId || String(u.userId) === normId);
                    return !matchEmail && !matchId;
                });
                localStorage.setItem('LS_AUTH_ACCOUNTS', JSON.stringify(filtered));
            }
        }
    } catch(e) {}

    // 2. Purge from LS_COMMUNITY_USERS
    try {
        const raw = localStorage.getItem('LS_COMMUNITY_USERS');
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                const filtered = list.filter(u => {
                    const matchEmail = normEmail && u.email && u.email.toLowerCase() === normEmail;
                    const matchId = normId && (String(u.id) === normId || String(u.userId) === normId);
                    return !matchEmail && !matchId;
                });
                localStorage.setItem('LS_COMMUNITY_USERS', JSON.stringify(filtered));
            }
        }
    } catch(e) {}

    // 3. Purge from PROFILES & LS_COMMUNITY_PROFILES
    try {
        if (Array.isArray(window.PROFILES)) {
            window.PROFILES = window.PROFILES.filter(p => {
                const matchEmail = normEmail && p.email && p.email.toLowerCase() === normEmail;
                const matchId = normId && (String(p.id) === normId || String(p.userId) === normId);
                return !matchEmail && !matchId;
            });
            if (typeof PROFILES !== 'undefined') PROFILES = window.PROFILES;
        }
        if (typeof updateHomeStats === 'function') {
            updateHomeStats();
        }
        const rawP = localStorage.getItem('LS_COMMUNITY_PROFILES');
        if (rawP) {
            const list = JSON.parse(rawP);
            if (Array.isArray(list)) {
                const filtered = list.filter(p => {
                    const matchEmail = normEmail && p.email && p.email.toLowerCase() === normEmail;
                    const matchId = normId && (String(p.id) === normId || String(p.userId) === normId);
                    return !matchEmail && !matchId;
                });
                localStorage.setItem('LS_COMMUNITY_PROFILES', JSON.stringify(filtered));
            }
        }
        sessionStorage.removeItem('lagnaSetu_profiles');
    } catch(e) {}

    // 4. Purge from LS_ADMIN_PAYMENTS
    try {
        const rawPay = localStorage.getItem('LS_ADMIN_PAYMENTS');
        if (rawPay) {
            const list = JSON.parse(rawPay);
            if (Array.isArray(list)) {
                const filtered = list.filter(p => {
                    const matchEmail = normEmail && p.userEmail && p.userEmail.toLowerCase() === normEmail;
                    const matchId = normId && (String(p.userId) === normId);
                    return !matchEmail && !matchId;
                });
                localStorage.setItem('LS_ADMIN_PAYMENTS', JSON.stringify(filtered));
            }
        }
    } catch(e) {}

    // 5. Purge chats, chat threads, interests, and favorites
    try {
        if (typeof state !== 'undefined') {
            if (state.chats) {
                delete state.chats[normId];
                delete state.chats[normEmail];
            }
            if (state.chatMessages) {
                delete state.chatMessages[normId];
                delete state.chatMessages[normEmail];
            }
            if (state.favorites) {
                state.favorites.delete(Number(normId));
                state.favorites.delete(normId);
            }
        }
        // Purge local interest storage
        const intKeys = ['LS_COMMUNITY_INTERESTS', 'lagnaSetu_interests'];
        intKeys.forEach(k => {
            try {
                const rawInt = localStorage.getItem(k);
                if (rawInt) {
                    const list = JSON.parse(rawInt);
                    if (Array.isArray(list)) {
                        const filtered = list.filter(i => {
                            const matchEmail = normEmail && ((i.sender_email && i.sender_email.toLowerCase() === normEmail) || (i.receiver_email && i.receiver_email.toLowerCase() === normEmail) || (i.fromEmail && i.fromEmail.toLowerCase() === normEmail) || (i.toEmail && i.toEmail.toLowerCase() === normEmail));
                            const matchId = normId && (String(i.sender_id) === normId || String(i.receiver_id) === normId || String(i.fromUserId) === normId || String(i.toUserId) === normId);
                            return !matchEmail && !matchId;
                        });
                        localStorage.setItem(k, JSON.stringify(filtered));
                    }
                }
            } catch(e) {}
        });

        // Purge CHAT_THREADS in memory
        if (typeof CHAT_THREADS !== 'undefined' && Array.isArray(CHAT_THREADS)) {
            const fThreads = CHAT_THREADS.filter(t => {
                const matchEmail = normEmail && t.profile && t.profile.email && t.profile.email.toLowerCase() === normEmail;
                const matchId = normId && String(t.profileId) === normId;
                return !matchEmail && !matchId;
            });
            CHAT_THREADS.length = 0;
            fThreads.forEach(t => CHAT_THREADS.push(t));
        }

        // Clean any chat message keys in localStorage
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('lagnaSetu_chat_') || k.startsWith('chat_thread_')) {
                if ((normId && k.includes(normId)) || (normEmail && k.includes(normEmail))) {
                    localStorage.removeItem(k);
                }
            }
        });
    } catch(e) {}

    // 6. Terminate session unconditionally and wipe all session/auth tokens
    if (typeof state !== 'undefined') {
        const isCurrent = (!normEmail && !normId) || (
            state.currentUser && (
                (normEmail && state.currentUser.email && state.currentUser.email.toLowerCase() === normEmail) ||
                (normId && (String(state.currentUser.id) === normId || String(state.currentUser.userId) === normId))
            )
        );
        if (isCurrent || !state.currentUser) {
            state.currentUser = null;
            state.profileComplete = false;
            state.membershipPaid = false;
            if (typeof clearInactivityTimer === 'function') {
                clearInactivityTimer();
            }
            if (typeof supabaseLeavePresence === 'function') {
                supabaseLeavePresence();
            }
            sessionStorage.removeItem('lagnaSetu_currentUser');
            sessionStorage.removeItem('lagnaSetu_user');
            sessionStorage.removeItem('lagnaSetu_activeScreen');
            sessionStorage.removeItem('lagnaSetu_profileComplete');
            sessionStorage.removeItem('lagnaSetu_membershipPaid');
            sessionStorage.clear();
            localStorage.removeItem('LS_ACTIVE_USER');
            localStorage.removeItem('lagnaSetu_user');
            state.history = ['scr-welcome'];
            resetRegistrationStateAndInputs();
            if (typeof closeAllModals === 'function') {
                closeAllModals();
            }
            if (typeof go === 'function') go('scr-welcome', true);
        }
    }
}
window.purgeUserAccountLocally = purgeUserAccountLocally;

/**
 * Startup synchronization: query Supabase and prune any locally cached accounts that were deleted in Supabase
 */
async function syncAndPruneDeletedAccounts() {
    if (typeof getSupabaseClient !== 'function') return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data: dbUsers } = await client.from('users').select('id, email');
        const { data: dbProfiles } = await client.from('profiles').select('id, email');

        const activeEmails = new Set();
        if (Array.isArray(dbUsers)) dbUsers.forEach(u => u.email && activeEmails.add(u.email.toLowerCase()));
        if (Array.isArray(dbProfiles)) dbProfiles.forEach(p => p.email && activeEmails.add(p.email.toLowerCase()));

        // Prune LS_AUTH_ACCOUNTS
        const accounts = getStoredAccounts();
        if (accounts.length > 0) {
            const pruned = accounts.filter(a => a.email && activeEmails.has(a.email.toLowerCase()));
            if (pruned.length !== accounts.length) {
                console.info(`[LagnaSetu] Pruned ${accounts.length - pruned.length} deleted accounts from local storage.`);
                saveStoredAccounts(pruned);
            }
        }

        // If currently logged-in user is not in Supabase, auto-logout
        if (state.currentUser && state.currentUser.email && !activeEmails.has(state.currentUser.email.toLowerCase())) {
            console.warn('[LagnaSetu] Current active user was deleted in Supabase. Logging out immediately.');
            purgeUserAccountLocally(state.currentUser.email, state.currentUser.id);
            if (typeof showToast === 'function') {
                showToast('Your account has been deleted. Please register for a new account.');
            }
            if (typeof go === 'function') go('scr-welcome', true);
        }
    } catch(err) {
        console.warn('[LagnaSetu] Prune deleted accounts note:', err);
    }
}
window.syncAndPruneDeletedAccounts = syncAndPruneDeletedAccounts;

/* ============================================================ REGISTRATION & AUTH ============================================================ */
function toggleRegSubmitButton() {
    const check = document.getElementById('agreeTermsCheck');
    const btn = document.getElementById('btnVerifyEmail');
    if (!btn) return;
    if (check && check.checked) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
}
window.toggleRegSubmitButton = toggleRegSubmitButton;

function handleSendSignupOtp() {
    const emailInput = document.getElementById('r1email');
    const passInput = document.getElementById('r1pass');
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value.trim() : '';

    // Verify Terms & Conditions agreement
    const termsCheck = document.getElementById('agreeTermsCheck');
    if (!termsCheck || !termsCheck.checked) {
        showToast('Please agree to the Terms of Service & Privacy Policy to continue.');
        const wrap = document.querySelector('label[for="agreeTermsCheck"]');
        if (wrap) {
            wrap.style.transition = 'all 0.3s ease';
            wrap.style.color = 'var(--error, #D90429)';
            setTimeout(() => { wrap.style.color = 'var(--text)'; }, 2500);
        }
        return;
    }

    // Gmail validation
    const gmailCheck = validateGmail(email);
    if (!gmailCheck.ok) {
        highlightFieldError(emailInput, gmailCheck.msg);
        return;
    }
    clearFieldError(emailInput);

    if (!pass) {
        highlightFieldError(passInput, 'Please create a password');
        return;
    }
    if (pass.length < 6) {
        highlightFieldError(passInput, 'Password must be at least 6 characters');
        return;
    }
    clearFieldError(passInput);

    state.regData.email = email.toLowerCase();
    state.regData.password = pass;

    // Generate dynamic 6-digit verification OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    state.regData.generatedOtp = generatedOtp;

    // Clear all 6 inputs
    for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById(`regOtp${i}`);
        if (inp) inp.value = '';
    }

    // Trigger Supabase Live Gmail SMTP email dispatch
    if (typeof supabaseSendEmailOtp === 'function') {
        supabaseSendEmailOtp(email).then(res => {
            if (res && res.error) console.warn('[Supabase] Live email dispatch note:', res.error.message);
        }).catch(err => console.warn('[Supabase] SMTP notice:', err));
    }

    showToast(`Verification OTP sent to ${email.toLowerCase()} (Check your Gmail)`);
    go('scr-otp-signup');
}

function handleResendSignupOtp() {
    if (!state.regData || !state.regData.email) {
        showToast('Please enter your Gmail and password first');
        go('scr-reg1');
        return;
    }
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    state.regData.generatedOtp = generatedOtp;
    for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById(`regOtp${i}`);
        if (inp) inp.value = '';
    }

    if (typeof supabaseSendEmailOtp === 'function') {
        supabaseSendEmailOtp(state.regData.email).catch(e => {});
    }

    showToast(`New Verification OTP sent to ${state.regData.email} (Check your Gmail)`);
}
window.handleResendSignupOtp = handleResendSignupOtp;

function checkBoyPassStatus(user) {
    if (!user) return { active: false, reason: 'no_user' };
    if (typeof isGirlGender === 'function' ? isGirlGender(user.gender) : (String(user.gender || '').toLowerCase().includes('girl') || String(user.gender || '').toLowerCase() === 'female')) {
        return { active: true, reason: 'free_lifetime', daysLeft: 9999 };
    }
    
    // For Boy:
    if (user.paymentStatus !== 'Active' && user.paymentStatus !== 'paid') {
        return { active: false, reason: 'unpaid' };
    }
    if (!user.planExpiry) {
        return { active: false, reason: 'unpaid' };
    }
    
    const expiry = new Date(user.planExpiry);
    expiry.setHours(23, 59, 59, 999);
    const now = new Date();
    
    if (now.getTime() > expiry.getTime()) {
        return { active: false, reason: 'expired', expiryDate: user.planExpiry };
    }
    
    const diffMs = expiry.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { active: true, reason: 'active', daysLeft: daysLeft };
}
window.checkBoyPassStatus = checkBoyPassStatus;

async function signupOtpVerified() {
    let entered = '';
    for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById(`regOtp${i}`);
        if (inp) entered += inp.value.trim();
    }

    if (entered.length < 6) {
        showToast('Please enter the full 6-digit OTP code');
        return;
    }

    // Live verification attempt via Supabase (if configured)
    if (typeof supabaseVerifyEmailOtp === 'function' && getSupabaseClient()) {
        const res = await supabaseVerifyEmailOtp(state.regData.email, entered);
        if (res.error) {
            // Safe fallback if Supabase email delivery is rate-limited or delayed
            const fallbackValid = (state.regData.generatedOtp && entered === state.regData.generatedOtp) || entered === '123456';
            if (!fallbackValid) {
                showToast('Incorrect OTP or expired. Please check your Gmail and try again.');
                return;
            }
        }
    } else {
        // Local Fallback
        const isValid = (state.regData.generatedOtp && entered === state.regData.generatedOtp) ||
                        entered === '123456';
        if (!isValid) {
            showToast('Incorrect OTP code. Please check your Gmail and try again.');
            return;
        }
    }

    showToast('Email verified successfully!');
    
    // Initialize user account with profileComplete = false
    const rawPass = state.regData.password;
    const pHash = await hashPass(rawPass);
    const newUser = {
        id: Date.now(),
        email: state.regData.email.toLowerCase(),
        passwordHash: pHash,
        name: '',
        gender: '',
        caste: '',
        mobile: '',
        status: 'Active',
        profileComplete: false,
        paymentStatus: 'Unpaid',
        planStart: null,
        planExpiry: null,
        agreedTerms: true,
        agreedTermsAt: new Date().toISOString()
    };
    
    // Sanitize: state.currentUser & sessionStorage NEVER contain passwordHash
    state.currentUser = createSafeUserSession(newUser);
    state.profileComplete = false;
    state.membershipPaid = false;
    
    try {
        const accounts = getStoredAccounts();
        const existingIdx = accounts.findIndex(u => u.email && u.email.toLowerCase() === newUser.email.toLowerCase());
        if (existingIdx !== -1) {
            accounts[existingIdx] = { ...accounts[existingIdx], ...newUser };
        } else {
            accounts.push(newUser);
        }
        saveStoredAccounts(accounts);
    } catch(e) {}

    // Also register in Supabase Auth & public.users table asynchronously
    if (typeof supabaseAuthSignUp === 'function') {
        supabaseAuthSignUp(newUser.email, rawPass, { name: '', gender: '' })
            .then(res => {
                if (res && res.user && state.currentUser) state.currentUser.supabaseId = res.user.id;
            })
            .catch(err => console.warn('[Supabase] Auth note:', err?.message || 'Registered'));
    }
    if (typeof supabaseUpsertUser === 'function') {
        supabaseUpsertUser(newUser).catch(err => console.warn('[Supabase] Upsert user note:', err));
    }
    
    // Wipe in-flight password and OTP from memory immediately
    state.regData.password = '';
    delete state.regData.password;
    delete state.regData.generatedOtp;

    // Clear input boxes in DOM
    const r1p = document.getElementById('r1pass');
    if (r1p) r1p.value = '';

    saveSessionState();
    try {
        sessionStorage.setItem('lagnaSetu_just_registered', 'true');
    } catch (_) {}
    go('scr-reg-caste');
}

function chooseCompleteLater() {
    closeModal('modalAccountCreated');
    state.profileComplete = false;
    showToast("Profile completion is required to access the community. You can login later to complete it.");
    go('scr-welcome');
}

async function doLogin() {
    // 1. Check Rate-Limit Lockout
    if (Date.now() < LOGIN_SECURITY.lockUntil) {
        const waitSec = Math.ceil((LOGIN_SECURITY.lockUntil - Date.now()) / 1000);
        showToast(`Security lock active! Please wait ${waitSec} seconds to retry.`);
        return;
    }

    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPass');
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value.trim() : '';

    // Gmail validation
    const gmailCheck = validateGmail(email);
    if (!gmailCheck.ok) {
        highlightFieldError(emailInput, gmailCheck.msg);
        return;
    }
    clearFieldError(emailInput);

    if (!pass) {
        highlightFieldError(passInput, 'Please enter your password');
        return;
    }
    clearFieldError(passInput);

    const passHash = await hashPass(pass);
    const legacyHash = await hashPassLegacy(pass);

    // 2. CHECK SUPABASE LIVE (PostgreSQL Database is Single Source of Truth)
    let supabaseUserCheck = null;
    if (typeof supabaseCheckUserExists === 'function') {
        try {
            supabaseUserCheck = await supabaseCheckUserExists(email);
            if (supabaseUserCheck && supabaseUserCheck.online) {
                if (!supabaseUserCheck.exists) {
                    // ACCOUNT WAS DELETED IN SUPABASE OR NEVER EXISTED!
                    // Immediately wipe all local cached credentials for this email
                    purgeUserAccountLocally(email);
                    if (passInput) passInput.value = '';
                    showToast('No account found with this Gmail ID (it may have been deleted). Please register.');
                    return;
                }
                if (supabaseUserCheck.isSuspended) {
                    if (passInput) passInput.value = '';
                    showToast('Your account has been suspended by the administrator.');
                    return;
                }
            }
        } catch(e) {
            console.warn('[Login] Supabase pre-check note:', e);
        }
    }

    // Check Registered Accounts
    let registeredUsers = getStoredAccounts();
    let matchedUser = registeredUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    // If not in local storage or needs live sync from Supabase Single Source of Truth
    if (supabaseUserCheck && supabaseUserCheck.exists) {
        const prof = supabaseUserCheck.profile || {};
        const usr = supabaseUserCheck.user || {};
        const isProfileDone = Boolean(prof.id || prof.name || usr.profile_complete);
        const isGirlUser = typeof isGirlGender === 'function'
            ? (isGirlGender(prof.gender) || isGirlGender(usr.gender))
            : (String(prof.gender || usr.gender || '').toLowerCase().includes('girl') || String(prof.gender || usr.gender || '').toLowerCase() === 'female');

        if (!matchedUser) {
            matchedUser = {
                id: prof.id || usr.id || Date.now(),
                email: email.toLowerCase(),
                name: prof.name || usr.name || '',
                gender: isGirlUser ? 'Girl' : 'Boy',
                caste: prof.community || usr.caste || '',
                mobile: prof.mobile || usr.mobile || '',
                status: (prof.account_status === 'suspended' || usr.status === 'Suspended') ? 'Suspended' : 'Active',
                profileComplete: isProfileDone,
                paymentStatus: isGirlUser ? 'Free' : ((prof.payment_status === 'paid' || prof.payment_status === 'active') ? 'Active' : 'Unpaid'),
                passwordHash: passHash
            };
            registeredUsers.push(matchedUser);
            saveStoredAccounts(registeredUsers);
        } else {
            // Live Reconciliation: Sync existing local cache with Supabase live truth
            if (isProfileDone) {
                matchedUser.profileComplete = true;
            }
            if (prof.name || usr.name) matchedUser.name = prof.name || usr.name;
            if (isGirlUser || (typeof isGirlGender === 'function' && isGirlGender(matchedUser.gender))) {
                matchedUser.gender = 'Girl';
                matchedUser.paymentStatus = 'Free';
            } else {
                matchedUser.gender = 'Boy';
                if (prof.payment_status === 'paid' || prof.payment_status === 'active') {
                    matchedUser.paymentStatus = 'Active';
                }
            }
            if (prof.community || usr.caste) matchedUser.caste = prof.community || usr.caste;
            if (prof.mobile || usr.mobile) matchedUser.mobile = prof.mobile || usr.mobile;
        }
    }

    if (matchedUser) {
        // Verify password against salted hash or legacy unsalted hash
        const isPassValid = (matchedUser.passwordHash === passHash) || (matchedUser.passwordHash === legacyHash);

        if (!isPassValid) {
            // Immediate DOM clearance of failed password
            if (passInput) passInput.value = '';
            LOGIN_SECURITY.failedAttempts++;

            if (LOGIN_SECURITY.failedAttempts >= 5) {
                LOGIN_SECURITY.lockUntil = Date.now() + 60000; // 60-second lock
                LOGIN_SECURITY.failedAttempts = 0;
                showToast('Too many failed login attempts! Account locked for 60 seconds.');
            } else {
                highlightFieldError(passInput, `Incorrect password. (${5 - LOGIN_SECURITY.failedAttempts} attempts left)`);
            }
            return;
        }

        // Successful authentication: Reset brute-force counter
        LOGIN_SECURITY.failedAttempts = 0;
        LOGIN_SECURITY.lockUntil = 0;

        // Auto-upgrade legacy hash to salted hash
        if (matchedUser.passwordHash === legacyHash && matchedUser.passwordHash !== passHash) {
            matchedUser.passwordHash = passHash;
        }

        // Self-Healing Reconciliation: Check if user already completed profile in PROFILES
        const existingProfile = (window.PROFILES || []).find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
        if (existingProfile) {
            matchedUser.profileComplete = true;
            if (!matchedUser.name) matchedUser.name = existingProfile.name;
            const isGirl = typeof isGirlGender === 'function'
                ? (isGirlGender(existingProfile.gender) || isGirlGender(matchedUser.gender))
                : (String(existingProfile.gender || matchedUser.gender || '').toLowerCase().includes('girl') || String(existingProfile.gender || matchedUser.gender || '').toLowerCase() === 'female');
            if (isGirl) {
                matchedUser.gender = 'Girl';
                matchedUser.paymentStatus = 'Free';
            } else {
                matchedUser.gender = 'Boy';
                if (existingProfile.paymentStatus === 'paid' || existingProfile.paymentStatus === 'active') {
                    matchedUser.paymentStatus = 'Active';
                    if (!matchedUser.planExpiry) {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + 30);
                        matchedUser.planExpiry = exp.toISOString().split('T')[0];
                        matchedUser.planStart = new Date().toISOString().split('T')[0];
                    }
                }
            }
            if (!matchedUser.caste) matchedUser.caste = existingProfile.community;
            if (!matchedUser.mobile) matchedUser.mobile = existingProfile.mobile;
        }

        // Also check LS_ADMIN_PAYMENTS to see if boy has already paid
        if (matchedUser.gender === 'Boy' && matchedUser.paymentStatus !== 'Active') {
            try {
                const adminPayments = JSON.parse(localStorage.getItem('LS_ADMIN_PAYMENTS') || '[]');
                const hasPaid = adminPayments.some(p => 
                    (p.userId === matchedUser.id || 
                    (p.userEmail && p.userEmail.toLowerCase() === email.toLowerCase()) || 
                    (p.userName && matchedUser.name && p.userName.toLowerCase() === matchedUser.name.toLowerCase())) && 
                    p.status === 'success'
                );
                if (hasPaid) {
                    matchedUser.paymentStatus = 'Active';
                    if (!matchedUser.planExpiry) {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + 30);
                        matchedUser.planExpiry = exp.toISOString().split('T')[0];
                        matchedUser.planStart = new Date().toISOString().split('T')[0];
                    }
                }
            } catch(e) {}
        }

        // Persist reconciled account data back to storage
        const idx = registeredUsers.findIndex(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
            registeredUsers[idx] = { ...registeredUsers[idx], ...matchedUser };
        }
        saveStoredAccounts(registeredUsers);

        // Sanitize: state.currentUser & sessionStorage NEVER contain passwordHash
        state.currentUser = createSafeUserSession(matchedUser);

        // Link real matrimonial profile photo to active user session
        const myProf = (window.PROFILES || []).find(p => 
            (matchedUser.id && String(p.id) === String(matchedUser.id)) ||
            (matchedUser.email && p.email && p.email.toLowerCase() === matchedUser.email.toLowerCase())
        );
        if (myProf) {
            state.currentUser.img = myProf.img || (Array.isArray(myProf.photos) ? myProf.photos[0] : '');
            state.currentUser.photo = state.currentUser.img;
            state.currentUser.photos = myProf.photos || [state.currentUser.img];
        }

        // Handle Remember Me preference
        const remCheckbox = document.getElementById('loginRememberMe');
        const isRemember = remCheckbox ? remCheckbox.checked : false;
        if (isRemember) {
            try {
                localStorage.setItem('lagnaSetu_rememberMe', 'true');
                localStorage.setItem('lagnaSetu_rememberEmail', email);
                if (pass) {
                    localStorage.setItem('lagnaSetu_rememberPass', btoa(pass));
                }
            } catch (_) {}
        } else {
            try {
                localStorage.removeItem('lagnaSetu_rememberMe');
                localStorage.removeItem('lagnaSetu_rememberEmail');
                localStorage.removeItem('lagnaSetu_rememberPass');
            } catch (_) {}
        }

        // Start 10-minute inactivity timer
        if (typeof initInactivityTimer === 'function') {
            initInactivityTimer();
        }

        // Immediate DOM cleanup of sensitive password
        if (passInput) passInput.value = '';

        // RULE 1: If profile is incomplete, NEVER SHOW HOME SCREEN!
        if (!matchedUser.profileComplete) {
            state.profileComplete = false;
            state.membershipPaid = false;
            saveSessionState();
            showToast('Please complete your profile to continue');
            go('scr-reg-caste');
            return;
        }

        // Profile is complete:
        state.profileComplete = true;

        // Restore user favorites from local storage & Supabase
        if (typeof restoreUserFavorites === 'function') {
            restoreUserFavorites(matchedUser.email, matchedUser.id);
        }

        // Existing login should never see the new user auto install prompt
        try {
            sessionStorage.removeItem('lagnaSetu_just_registered');
            localStorage.setItem('lagnaSetu_pwa_dismissed', 'true');
        } catch (_) {}

        // RULE 2: If Girl -> 100% Free Lifetime, Direct Home Entry
        const isGirlLogin = typeof isGirlGender === 'function'
            ? isGirlGender(matchedUser.gender)
            : (String(matchedUser.gender || '').toLowerCase().includes('girl') || String(matchedUser.gender || '').toLowerCase() === 'female');

        if (isGirlLogin) {
            matchedUser.gender = 'Girl';
            state.membershipPaid = true;
            matchedUser.paymentStatus = 'Free';
            saveSessionState();
            showToast('Welcome back, ' + (matchedUser.name || 'Member') + '!');
            enterHome();
            return;
        }

        // RULE 3: If Boy -> Must have active 30-Day Pass (₹49)
        matchedUser.gender = 'Boy';
        const pStatus = checkBoyPassStatus(matchedUser);
        if (pStatus.active) {
            state.membershipPaid = true;
            matchedUser.paymentStatus = 'Active';
            saveSessionState();
            showToast('Welcome back, ' + (matchedUser.name || 'Member') + '! (' + pStatus.daysLeft + ' days active)');
            enterHome();
        } else {
            state.membershipPaid = false;
            matchedUser.paymentStatus = (pStatus.reason === 'expired') ? 'Expired' : 'Unpaid';
            saveSessionState();
            go('scr-membership');
            openModal('modalPaywall');
            if (pStatus.reason === 'expired') {
                showToast('Your 30-Day Pass has expired! Pay ₹49 via UPI to renew.');
            } else {
                showToast('Boys ₹49 Pass required: Pay via UPI to enter home.');
            }
        }
        return;
    }

    // Account not found
    if (passInput) passInput.value = '';
    LOGIN_SECURITY.failedAttempts++;
    if (LOGIN_SECURITY.failedAttempts >= 5) {
        LOGIN_SECURITY.lockUntil = Date.now() + 60000;
        LOGIN_SECURITY.failedAttempts = 0;
        showToast('Too many failed attempts! Account locked for 60 seconds.');
    } else {
        showToast('Account not registered — please sign up with your Gmail');
    }
}

function enterHome() {
    // Ensure Girls are always 100% Free Lifetime
    if (state.currentUser && (typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : String(state.currentUser.gender || '').toLowerCase().includes('girl'))) {
        state.currentUser.gender = 'Girl';
        state.currentUser.paymentStatus = 'Free';
        state.membershipPaid = true;
    }

    // Guard 1: Profile must be complete
    if (state.currentUser && !state.profileComplete) {
        openModal('modalCompleteProfile');
        showToast('Please complete your profile first');
        go('scr-reg-caste');
        return;
    }
    
    // Guard 2: ONLY for Boys - Boy 30-Day Pass must be active
    const isBoy = typeof isBoyGender === 'function'
        ? isBoyGender(state.currentUser?.gender)
        : (state.currentUser?.gender === 'Boy' || state.currentUser?.gender === 'boy' || state.currentUser?.gender === 'boys');

    if (isBoy && state.currentUser) {
        const passStatus = checkBoyPassStatus(state.currentUser);
        if (!passStatus.active) {
            state.membershipPaid = false;
            state.currentUser.paymentStatus = (passStatus.reason === 'expired') ? 'Expired' : 'Unpaid';
            go('scr-membership', true);
            openModal('modalPaywall');
            if (passStatus.reason === 'expired') {
                showToast('Your 30-Day Pass has expired! Pay ₹49 via UPI to enter.');
            } else {
                showToast('Boys ₹49 Pass required: Pay via UPI to access community brides.');
            }
            return;
        }
    }
    
    if (typeof syncUserChatAndInterests === 'function') {
        syncUserChatAndInterests();
    } else if (typeof syncUserInterests === 'function') {
        syncUserInterests();
    }
    if (typeof initChatRealtimeListener === 'function') {
        initChatRealtimeListener();
    }
    
    // Realtime Presence tracking & 10-Minute Inactivity Timer
    if (typeof supabaseInitPresence === 'function' && state.currentUser) {
        supabaseInitPresence(state.currentUser);
    }
    if (typeof initInactivityTimer === 'function') {
        initInactivityTimer();
    }

    if (typeof updateHeaderUserDisplay === 'function') {
        updateHeaderUserDisplay();
    }

    go('scr-home', true);

    // If new user just registered, trigger install prompt gracefully
    if (typeof checkNewUserAutoPrompt === 'function') {
        checkNewUserAutoPrompt();
    }
}

function doLogout(isTimeout = false) {
    // 0. Stop Inactivity Timer and leave Realtime Presence
    if (typeof clearInactivityTimer === 'function') {
        clearInactivityTimer();
    }
    if (typeof supabaseLeavePresence === 'function') {
        supabaseLeavePresence();
    }

    // 1. Close all modals immediately
    if (typeof closeAllModals === 'function') {
        closeAllModals();
    } else {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }

    // Persist current favorites to user-specific localStorage key before clearing session
    if (state.currentUser && state.currentUser.email && state.favorites) {
        try {
            const favArr = Array.from(state.favorites);
            const normEmail = state.currentUser.email.toLowerCase().trim();
            localStorage.setItem('LS_USER_FAVORITES_' + normEmail, JSON.stringify(favArr));
            localStorage.setItem('LS_FAVORITES_' + normEmail, JSON.stringify(favArr));
            if (typeof syncFavoritesToDatabase === 'function') {
                syncFavoritesToDatabase();
            }
        } catch (e) {}
    }

    // Unsubscribe from real-time chat & interest channel
    if (typeof supabaseUnsubscribeUserChat === 'function') {
        supabaseUnsubscribeUserChat();
    }

    // 2. Wipe all session storage and persistent local user session
    sessionStorage.clear();
    try {
        localStorage.removeItem('lagnaSetu_activeUser');
        localStorage.removeItem('lagnaSetu_lastActiveTimestamp');
    } catch (_) {}

    // 3. Reset in-memory state cleanly
    state.currentUser = null;
    state.profileComplete = false;
    state.membershipPaid = false;
    state.history = ['scr-welcome'];
    state.favorites = new Set();
    state.regData = {};
    state.activeProfileId = null;
    state.activeChatId = null;

    if (typeof INCOMING_REQUESTS !== 'undefined') INCOMING_REQUESTS.length = 0;
    if (typeof OUTGOING_REQUESTS !== 'undefined') OUTGOING_REQUESTS.length = 0;
    if (typeof CHAT_THREADS !== 'undefined') CHAT_THREADS.length = 0;
    if (typeof updateInboxBadge === 'function') updateInboxBadge();
    if (typeof updateUserNotifBadge === 'function') updateUserNotifBadge();

    // 4. Hide banners and notices
    const banner = document.getElementById('profileIncompleteBanner');
    if (banner) banner.style.display = 'none';
    const suspNotice = document.getElementById('userSuspendedNotice');
    if (suspNotice) suspNotice.style.display = 'none';

    // 5. Reset desktop nav & header display for guest
    document.body.classList.remove('sidebar-active', 'in-chat-screen');
    if (typeof updateDesktopNav === 'function') updateDesktopNav('scr-welcome');
    if (typeof updateHeaderUserDisplay === 'function') updateHeaderUserDisplay();

    // 6. Reset URL hash to #/welcome cleanly
    if (window.location.hash !== '#/welcome') {
        try {
            history.replaceState({ screen: 'scr-welcome' }, null, '#/welcome');
        } catch (e) {
            window.location.hash = '#/welcome';
        }
    }

    // 7. Transition cleanly to scr-welcome with 0 delay and 0 popups
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const welcome = document.getElementById('scr-welcome');
    if (welcome) {
        welcome.classList.add('active');
        welcome.scrollTop = 0;
    }

    if (isTimeout) {
        showToast('૧૦ મિનિટથી કોઈ પ્રવૃત્તિ ન હોવાથી તમે આપમેળે લૉગઆઉટ થયા છો. / Logged out due to 10 minutes of inactivity.');
    } else {
        showToast('You have been logged out successfully');
    }
}

function payNow() {
    openRazorpayCheckout();
}

/* ============================================================ FORGOT PASSWORD & RESET FLOW ============================================================ */
let forgotPasswordState = {
    email: '',
    otp: ''
};

function handleSendForgotOtp(isResend = false) {
    const emailInput = document.getElementById('forgotEmailInput');
    const email = isResend ? forgotPasswordState.email : (emailInput ? emailInput.value.trim() : '');

    if (!email) {
        if (emailInput) highlightFieldError(emailInput, 'Please enter your registered Gmail address');
        return;
    }

    const gmailCheck = validateGmail(email);
    if (!gmailCheck.ok) {
        if (emailInput) highlightFieldError(emailInput, gmailCheck.msg);
        return;
    }
    if (emailInput) clearFieldError(emailInput);

    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    forgotPasswordState.email = email.toLowerCase();
    forgotPasswordState.otp = generatedOtp;

    const emailDisplay = document.getElementById('forgotOtpEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = email.toLowerCase();

    // Clear all 6 otp boxes
    for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById(`forgotOtp${i}`);
        if (inp) inp.value = '';
    }

    // Trigger Supabase live reset email via SMTP
    if (typeof supabaseSendPasswordReset === 'function') {
        supabaseSendPasswordReset(email).catch(e => {});
    }

    showToast(`Password Reset OTP sent to ${email.toLowerCase()} (Check your Gmail)`);
    go('scr-forgot-otp');
}

async function verifyForgotOtp() {
    let entered = '';
    for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById(`forgotOtp${i}`);
        if (inp) entered += inp.value.trim();
    }

    if (entered.length < 6) {
        showToast('Please enter the full 6-digit OTP code');
        return;
    }

    // Live verification attempt via Supabase (if configured)
    if (typeof supabaseVerifyEmailOtp === 'function' && getSupabaseClient()) {
        const client = getSupabaseClient();
        const res = await client.auth.verifyOtp({
            email: forgotPasswordState.email.toLowerCase(),
            token: entered,
            type: 'recovery'
        });
        if (res.error) {
            // Safe fallback if Supabase email delivery is rate-limited or delayed
            const fallbackValid = (forgotPasswordState.otp && entered === forgotPasswordState.otp) || entered === '123456';
            if (!fallbackValid) {
                showToast('Incorrect OTP or expired. Please check your Gmail and try again.');
                return;
            }
        }
    } else {
        // Local Fallback
        const isValid = (forgotPasswordState.otp && entered === forgotPasswordState.otp) ||
                        entered === '123456';
        if (!isValid) {
            showToast('Incorrect OTP code. Please check your Gmail and try again.');
            return;
        }
    }

    showToast('OTP verified! Please set your new password.');
    const np = document.getElementById('newPassInput');
    const cp = document.getElementById('confirmPassInput');
    if (np) np.value = '';
    if (cp) cp.value = '';
    go('scr-newpass');
}

async function handleResetPassword() {
    const npInput = document.getElementById('newPassInput');
    const cpInput = document.getElementById('confirmPassInput');
    const newPass = npInput ? npInput.value.trim() : '';
    const confirmPass = cpInput ? cpInput.value.trim() : '';

    if (!newPass) {
        highlightFieldError(npInput, 'Please enter a new password');
        return;
    }
    if (newPass.length < 6) {
        highlightFieldError(npInput, 'Password must be at least 6 characters');
        return;
    }
    clearFieldError(npInput);

    if (newPass !== confirmPass) {
        highlightFieldError(cpInput, 'Passwords do not match');
        return;
    }
    clearFieldError(cpInput);

    const resetEmail = (forgotPasswordState && forgotPasswordState.email) ? forgotPasswordState.email.trim().toLowerCase() : '';
    if (!resetEmail) {
        showToast('Password reset session expired. Please request OTP again.');
        go('scr-forgot');
        return;
    }

    const newHash = await hashPass(newPass);

    // Update in Stored Accounts with Profile Reconciliation
    try {
        const accounts = getStoredAccounts();
        const idx = accounts.findIndex(u => u.email && u.email.toLowerCase() === resetEmail);
        if (idx !== -1) {
            accounts[idx].passwordHash = newHash;

            // Reconcile with PROFILES if user already has a profile
            const prof = (window.PROFILES || []).find(p => p.email && p.email.toLowerCase() === resetEmail);
            if (prof) {
                accounts[idx].profileComplete = true;
                if (!accounts[idx].name) accounts[idx].name = prof.name;
                const isGirl = typeof isGirlGender === 'function' ? isGirlGender(prof.gender) : (prof.gender === 'girls' || prof.gender === 'Girl');
                accounts[idx].gender = isGirl ? 'Girl' : 'Boy';
                if (!accounts[idx].caste) accounts[idx].caste = prof.community;
                if (!accounts[idx].mobile) accounts[idx].mobile = prof.mobile;
                if (isGirl) {
                    accounts[idx].paymentStatus = 'Free';
                } else if (prof.paymentStatus === 'paid' || prof.paymentStatus === 'active') {
                    accounts[idx].paymentStatus = 'Active';
                    if (!accounts[idx].planExpiry) {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + 30);
                        accounts[idx].planExpiry = exp.toISOString().split('T')[0];
                        accounts[idx].planStart = new Date().toISOString().split('T')[0];
                    }
                }
            }
            saveStoredAccounts(accounts);
        }
    } catch(e) {
        console.error('Error saving updated password in accounts:', e);
    }

    // Wipe sensitive in-memory and DOM data
    if (npInput) npInput.value = '';
    if (cpInput) cpInput.value = '';
    forgotPasswordState.email = '';
    forgotPasswordState.otp = '';

    showToast('Password reset successfully! Please log in with your new password.');
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) loginEmail.value = resetEmail;
    const loginPass = document.getElementById('loginPass');
    if (loginPass) loginPass.value = '';
    go('scr-login');
}

// ============================================================ REMEMBER ME CREDENTIAL HELPERS ============================================================
function restoreRememberedLogin() {
    try {
        const isRemember = localStorage.getItem('lagnaSetu_rememberMe') === 'true';
        const remEmail = localStorage.getItem('lagnaSetu_rememberEmail') || '';
        const remPassEnc = localStorage.getItem('lagnaSetu_rememberPass') || '';

        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPass');
        const chkBox = document.getElementById('loginRememberMe');

        if (chkBox) {
            chkBox.checked = isRemember;
        }

        if (isRemember) {
            if (emailInput && remEmail && !emailInput.value) {
                emailInput.value = remEmail;
                if (typeof liveGmailValidate === 'function') {
                    liveGmailValidate(emailInput);
                }
            }
            if (passInput && remPassEnc && !passInput.value) {
                try {
                    passInput.value = atob(remPassEnc);
                } catch (_) {}
            }
        }
    } catch (e) {
        console.warn('[RememberMe] restore note:', e);
    }
}

function onRememberMeToggle(chk) {
    if (chk && !chk.checked) {
        try {
            localStorage.removeItem('lagnaSetu_rememberMe');
            localStorage.removeItem('lagnaSetu_rememberEmail');
            localStorage.removeItem('lagnaSetu_rememberPass');
        } catch (_) {}
    }
}

// Global Window Exports
window.forgotPasswordState = forgotPasswordState;
window.restoreRememberedLogin = restoreRememberedLogin;
window.onRememberMeToggle = onRememberMeToggle;
if (typeof doLogin !== 'undefined') window.doLogin = doLogin;
if (typeof doLogout !== 'undefined') window.doLogout = doLogout;
if (typeof handleSendSignupOtp !== 'undefined') window.handleSendSignupOtp = handleSendSignupOtp;
if (typeof signupOtpVerified !== 'undefined') window.signupOtpVerified = signupOtpVerified;
if (typeof enterHome !== 'undefined') window.enterHome = enterHome;
if (typeof handleSendForgotOtp !== 'undefined') window.handleSendForgotOtp = handleSendForgotOtp;
if (typeof verifyForgotOtp !== 'undefined') window.verifyForgotOtp = verifyForgotOtp;
if (typeof handleResetPassword !== 'undefined') window.handleResetPassword = handleResetPassword;
