/* ============================================================ STATE & SESSION ============================================================ */
/* ============================================================ STATE ============================================================ */
var state = {
    tab: 'girls',
    favorites: new Set(),
    siblingCount: { sister: 0, brother: 0 },
    siblingEnabled: { sister: true, brother: true },
    history: [],
    reportPicked: false,
    hobbies: [],
    inboxTab: 'requests',
    activeInterestId: null,
    activeChatId: null,
    activeReportId: null,
    activeProfileId: null,
    profileComplete: false, // false until member submits profile
    membershipPaid: false,  // false for boys before paying ₹49 pass
    filters: {
        gender: 'all',
        caste: 'All', // Default: show all communities, no restriction
        ageMin: 18,
        ageMax: 50,
        city: 'All',
        marital: 'All'
    },
    currentUser: null,
    regData: {
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
    }
};
window.state = state;

// LocalStorage Keys
var LS_USERS_KEY = 'LS_COMMUNITY_USERS';
var LS_ACCOUNTS_KEY = 'LS_AUTH_ACCOUNTS';
var LS_REPORTS_KEY = 'LS_COMMUNITY_REPORTS';
var LS_CASTES_KEY = 'LS_COMMUNITY_CASTES';
var LS_FAQS_KEY = 'LS_COMMUNITY_FAQS';
var LS_HOWITWORKS_KEY = 'LS_COMMUNITY_HOWITWORKS';
var LS_CONTACT_KEY = 'LS_COMMUNITY_CONTACT';

window.LS_USERS_KEY = LS_USERS_KEY;
window.LS_ACCOUNTS_KEY = LS_ACCOUNTS_KEY;
window.LS_REPORTS_KEY = LS_REPORTS_KEY;
window.LS_CASTES_KEY = LS_CASTES_KEY;
window.LS_FAQS_KEY = LS_FAQS_KEY;
window.LS_HOWITWORKS_KEY = LS_HOWITWORKS_KEY;
window.LS_CONTACT_KEY = LS_CONTACT_KEY;


/* ============================================================ SESSION PERSISTENCE (SPA RELOAD & MULTI-DEVICE) ============================================================ */
function isSelfProfile(p) {
    if (!p || !state.currentUser) return false;
    const myId = Number(state.currentUser.id || 0);
    const myProfId = Number(state.currentUser.profileId || 0);
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    const pid = typeof p === 'object' ? Number(p.id || 0) : Number(p || 0);
    const pEmail = typeof p === 'object' && p.email ? p.email.trim().toLowerCase() : '';

    if (pid && (pid === myId || pid === myProfId)) return true;
    if (myEmail && pEmail && myEmail === pEmail) return true;
    return false;
}
window.isSelfProfile = isSelfProfile;

function saveSessionState() {
    try {
        const currentScreen = document.querySelector('.screen.active')?.id || 'scr-home';
        sessionStorage.setItem('lagnaSetu_visited', 'true');
        sessionStorage.setItem('lagnaSetu_activeScreen', currentScreen);
        sessionStorage.setItem('lagnaSetu_activeProfileId', state.activeProfileId ? String(state.activeProfileId) : '');
        sessionStorage.setItem('lagnaSetu_activeChatId', state.activeChatId ? String(state.activeChatId) : '');
        if (state.currentUser) {
            sessionStorage.setItem('lagnaSetu_currentUser', JSON.stringify(state.currentUser));
            try {
                localStorage.setItem('lagnaSetu_activeUser', JSON.stringify(state.currentUser));
                localStorage.setItem('lagnaSetu_lastActiveTimestamp', Date.now().toString());
            } catch (_) {}
        } else {
            sessionStorage.removeItem('lagnaSetu_currentUser');
            sessionStorage.removeItem('lagnaSetu_user');
            try {
                localStorage.removeItem('lagnaSetu_activeUser');
            } catch (_) {}
        }
        sessionStorage.setItem('lagnaSetu_profileComplete', JSON.stringify(state.profileComplete));
        sessionStorage.setItem('lagnaSetu_membershipPaid', JSON.stringify(state.membershipPaid));
        sessionStorage.setItem('lagnaSetu_favorites', JSON.stringify(Array.from(state.favorites)));
        sessionStorage.setItem('lagnaSetu_profiles', JSON.stringify(PROFILES));
        sessionStorage.setItem('lagnaSetu_chatThreads', JSON.stringify(CHAT_THREADS));
        sessionStorage.setItem('lagnaSetu_incomingRequests', JSON.stringify(typeof INCOMING_REQUESTS !== 'undefined' ? INCOMING_REQUESTS : []));
        sessionStorage.setItem('lagnaSetu_outgoingRequests', JSON.stringify(typeof OUTGOING_REQUESTS !== 'undefined' ? OUTGOING_REQUESTS : []));
        sessionStorage.setItem('lagnaSetu_history', JSON.stringify(state.history));
    } catch (e) {
        console.error('saveSessionState error', e);
    }
}

function loadSessionState() {
    try {
        const savedProfiles = sessionStorage.getItem('lagnaSetu_profiles');
        if (savedProfiles) {
            const parsed = JSON.parse(savedProfiles);
            if (Array.isArray(parsed) && parsed.length > 0) {
                PROFILES.length = 0;
                parsed.forEach(p => PROFILES.push(p));
            }
        }
        // Strict 10-minute session validation:
        // Check whether more than 10 minutes have elapsed since last active timestamp
        const TEN_MINUTES_MS = 10 * 60 * 1000;
        const lastActive = Number(localStorage.getItem('lagnaSetu_lastActiveTimestamp') || 0);
        const lsUser = localStorage.getItem('lagnaSetu_activeUser');
        const sessionUser = sessionStorage.getItem('lagnaSetu_currentUser');

        let savedUser = null;
        if (lastActive > 0 && (Date.now() - lastActive > TEN_MINUTES_MS)) {
            // More than 10 minutes have elapsed since last activity -> Session expired!
            console.warn(`[Session] Expired due to 10 minutes inactivity (${Date.now() - lastActive}ms). Clearing session.`);
            sessionStorage.removeItem('lagnaSetu_currentUser');
            sessionStorage.removeItem('lagnaSetu_user');
            try {
                localStorage.removeItem('lagnaSetu_activeUser');
                localStorage.removeItem('lagnaSetu_lastActiveTimestamp');
            } catch (_) {}
            state.currentUser = null;
            window._sessionTimedOutOnBoot = true;
        } else if (sessionUser || lsUser) {
            // Within 10 minutes: session is valid!
            savedUser = sessionUser || lsUser;
            sessionStorage.setItem('lagnaSetu_currentUser', savedUser);
            try {
                localStorage.setItem('lagnaSetu_activeUser', savedUser);
                localStorage.setItem('lagnaSetu_lastActiveTimestamp', Date.now().toString());
            } catch (_) {}
        }
        if (savedUser) {
            state.currentUser = JSON.parse(savedUser);
            // Reconcile profileId, name, and photo from PROFILES if available
            if (typeof PROFILES !== 'undefined' && Array.isArray(PROFILES)) {
                const myEmail = (state.currentUser.email || '').trim().toLowerCase();
                const curId = state.currentUser.id || state.currentUser.profileId;
                const matchedProf = PROFILES.find(p => p && ((myEmail && p.email && p.email.trim().toLowerCase() === myEmail) || (curId && (p.id == curId || p.userId == curId))));
                if (matchedProf) {
                    state.currentUser.profileId = matchedProf.id;
                    if (!state.currentUser.name || state.currentUser.name === 'Member') {
                        state.currentUser.name = matchedProf.name;
                    }
                    if (!state.currentUser.img || !state.currentUser.photo) {
                        state.currentUser.img = matchedProf.img || (matchedProf.photos && matchedProf.photos[0]);
                        state.currentUser.photo = state.currentUser.img;
                    }
                }
            }
        }
        const savedComplete = sessionStorage.getItem('lagnaSetu_profileComplete');
        if (savedComplete !== null) {
            state.profileComplete = JSON.parse(savedComplete);
        } else if (state.currentUser && state.currentUser.profileId) {
            state.profileComplete = true;
        }
        const savedPaid = sessionStorage.getItem('lagnaSetu_membershipPaid');
        if (savedPaid !== null) {
            state.membershipPaid = JSON.parse(savedPaid);
        }
        const savedFavs = sessionStorage.getItem('lagnaSetu_favorites');
        if (savedFavs) {
            state.favorites = new Set(JSON.parse(savedFavs));
        }
        const savedChat = sessionStorage.getItem('lagnaSetu_chatThreads');
        if (savedChat) {
            const parsedChat = JSON.parse(savedChat);
            if (Array.isArray(parsedChat) && parsedChat.length > 0) {
                CHAT_THREADS.length = 0;
                parsedChat.forEach(c => {
                    if (c && Array.isArray(c.messages)) {
                        c.messages.forEach(m => {
                            if (!m.id) m.id = 'msg_' + Math.random().toString(36).substring(2, 9);
                        });
                    }
                    CHAT_THREADS.push(c);
                });
            }
        }
        const savedIncoming = sessionStorage.getItem('lagnaSetu_incomingRequests');
        if (savedIncoming && typeof INCOMING_REQUESTS !== 'undefined') {
            const parsed = JSON.parse(savedIncoming);
            if (Array.isArray(parsed)) {
                INCOMING_REQUESTS.length = 0;
                parsed.forEach(r => INCOMING_REQUESTS.push(r));
            }
        }
        const savedOutgoing = sessionStorage.getItem('lagnaSetu_outgoingRequests');
        if (savedOutgoing && typeof OUTGOING_REQUESTS !== 'undefined') {
            const parsed = JSON.parse(savedOutgoing);
            if (Array.isArray(parsed)) {
                OUTGOING_REQUESTS.length = 0;
                parsed.forEach(r => OUTGOING_REQUESTS.push(r));
            }
        }
        const savedHistory = sessionStorage.getItem('lagnaSetu_history');
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        }
        const pId = sessionStorage.getItem('lagnaSetu_activeProfileId');
        if (pId) state.activeProfileId = Number(pId);
        const cId = sessionStorage.getItem('lagnaSetu_activeChatId');
        if (cId) state.activeChatId = Number(cId);

        // If user is logged in, asynchronously trigger Supabase live chat & interest sync
        if (state.currentUser && state.currentUser.email) {
            if (typeof syncUserChatAndInterests === 'function') {
                syncUserChatAndInterests();
            } else if (typeof syncUserInterests === 'function') {
                syncUserInterests();
            }
            if (typeof initChatRealtimeListener === 'function') {
                initChatRealtimeListener();
            }
        }
    } catch (e) {
        console.error('loadSessionState error', e);
    }
}

function updateHeaderUserDisplay() {
    const curId = state.currentUser ? (state.currentUser.id || state.currentUser.profileId) : null;
    const curEmail = (state.currentUser?.email || '').trim().toLowerCase();

    // 1. Locate matrimonial profile from window.PROFILES (by id or email)
    const myProfile = (typeof window.PROFILES !== 'undefined' && Array.isArray(window.PROFILES))
        ? window.PROFILES.find(p => {
            if (!p) return false;
            if (curId && (p.id == curId || p.userId == curId || p.user_id == curId)) return true;
            if (curEmail && p.email && p.email.trim().toLowerCase() === curEmail) return true;
            return false;
        })
        : null;

    // 2. Resolve User's Real Name
    let rawName = (state.currentUser?.name || '').trim();
    if (!rawName || rawName === 'Member' || rawName === 'User') {
        if (myProfile && myProfile.name && myProfile.name.trim()) {
            rawName = myProfile.name.trim();
        } else if (state.regData && state.regData.name && state.regData.name.trim()) {
            rawName = state.regData.name.trim();
        } else if (typeof getStoredAccounts === 'function') {
            try {
                const accs = getStoredAccounts();
                const match = accs.find(a => (curEmail && a.email && a.email.toLowerCase() === curEmail) || (curId && a.id == curId));
                if (match && match.name && match.name.trim()) rawName = match.name.trim();
            } catch (e) {}
        }
    }

    // Sync back to state.currentUser so it persists across views
    if (rawName && state.currentUser && (!state.currentUser.name || state.currentUser.name === 'Member')) {
        state.currentUser.name = rawName;
    }

    const displayName = rawName || 'Member';
    const firstName = (rawName ? rawName.split(' ')[0] : '') || 'Member';

    const greetingEl = document.getElementById('homeUserGreeting');
    if (greetingEl) {
        greetingEl.innerHTML = `Hello, ${firstName} <i class="fa-solid fa-hand" style="color:var(--accent);"></i>`;
    }

    // 3. Resolve User's Real Profile Photo
    const isGirl = (state.currentUser && state.currentUser.gender === 'Girl') || (myProfile && myProfile.gender === 'girls');
    const fallbackPhoto = isGirl 
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';

    let photo = (myProfile && (myProfile.img || (Array.isArray(myProfile.photos) && myProfile.photos[0]))) ||
                (state.currentUser && (state.currentUser.photo || state.currentUser.img || (Array.isArray(state.currentUser.photos) && state.currentUser.photos[0]))) ||
                (state.regData && (state.regData.photo || (Array.isArray(state.regData.photos) && state.regData.photos[0]))) ||
                fallbackPhoto;

    // Sync photo back to state.currentUser
    if (photo && state.currentUser && (!state.currentUser.img || !state.currentUser.photo)) {
        state.currentUser.img = photo;
        state.currentUser.photo = photo;
    }

    checkCurrentUserStatus();

    const homeAvatar = document.getElementById('homeUserAvatar');
    if (homeAvatar) {
        homeAvatar.src = photo;
        homeAvatar.onerror = function () { this.src = fallbackPhoto; };
    }
    const menuAvatar = document.getElementById('menuUserAvatar');
    if (menuAvatar) {
        menuAvatar.src = photo;
        menuAvatar.onerror = function () { this.src = fallbackPhoto; };
    }
    const menuName = document.getElementById('menuUserName');
    if (menuName) menuName.textContent = displayName;

    // Automatically synchronize matrimony gender UI whenever user display changes
    if (typeof syncGenderUI === 'function') {
        syncGenderUI();
    }
}

let globalLoaderTimer = null;
function showGlobalLoader(text = 'Loading...', minDuration = 240) {
    const loader = document.getElementById('globalPageLoader');
    const txtEl = document.getElementById('globalLoaderText');
    if (txtEl) txtEl.textContent = text;
    if (loader) loader.classList.add('active');
    if (minDuration > 0) {
        clearTimeout(globalLoaderTimer);
        globalLoaderTimer = setTimeout(() => {
            hideGlobalLoader();
        }, minDuration);
    }
}
function hideGlobalLoader() {
    clearTimeout(globalLoaderTimer);
    const loader = document.getElementById('globalPageLoader');
    if (loader) loader.classList.remove('active');
    const preloadStyle = document.getElementById('spa-preload-css');
    if (preloadStyle) preloadStyle.remove();
    document.documentElement.classList.remove('bypassing-splash');
}

window.saveSessionState = saveSessionState;
window.loadSessionState = loadSessionState;
window.updateHeaderUserDisplay = updateHeaderUserDisplay;
window.showGlobalLoader = showGlobalLoader;
window.hideGlobalLoader = hideGlobalLoader;
