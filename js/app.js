/* ============================================================ LAGNA SETU APPLICATION ENTRY POINT ============================================================ */

function initApp() {
    loadSessionState();

    if (window._sessionTimedOutOnBoot) {
        window._sessionTimedOutOnBoot = false;
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('Logged out due to 10 minutes of inactivity.');
            }
        }, 500);
    }

    if (typeof restoreRememberedLogin === 'function') {
        restoreRememberedLogin();
    }

    if (typeof syncAndPruneDeletedAccounts === 'function') {
        syncAndPruneDeletedAccounts();
    }

    // Live validation against Supabase Single Source of Truth
    if (state.currentUser && state.currentUser.email && typeof supabaseCheckUserExists === 'function') {
        supabaseCheckUserExists(state.currentUser.email).then(check => {
            if (check && check.online && !check.exists) {
                console.warn('[LagnaSetu] Active session user was deleted in Supabase. Logging out.');
                if (typeof purgeUserAccountLocally === 'function') {
                    purgeUserAccountLocally(state.currentUser.email, state.currentUser.id);
                } else {
                    state.currentUser = null;
                    state.profileComplete = false;
                    sessionStorage.clear();
                }
                if (typeof showToast === 'function') showToast('Your account was deleted. Please register again.');
                if (typeof go === 'function') go('scr-welcome', true);
            }
        }).catch(e => {});
    }

    checkMaintenanceMode();
    if (typeof supabaseSubscribeMaintenance === 'function') {
        supabaseSubscribeMaintenance((isMaint) => {
            const modal = document.getElementById('modalMaintenance');
            if (modal) {
                if (isMaint) modal.classList.add('open');
                else modal.classList.remove('open');
            }
        });
    }
    renderHowItWorks();
    renderFaqs();
    initHobbies();
    updateInboxBadge();
    updateHeaderUserDisplay();
    if (typeof updateUserNotifBadge === 'function') updateUserNotifBadge();

    // Start live sync, real-time chat listener, presence tracking & 10-min inactivity timer for active user session
    if (state.currentUser && state.currentUser.email) {
        if (typeof syncUserChatAndInterests === 'function') {
            syncUserChatAndInterests();
        }
        if (typeof initChatRealtimeListener === 'function') {
            initChatRealtimeListener();
        }
        if (typeof supabaseInitPresence === 'function') {
            supabaseInitPresence(state.currentUser);
        }
        if (typeof initInactivityTimer === 'function') {
            initInactivityTimer();
        }
    }

    const visited = sessionStorage.getItem('lagnaSetu_visited');
    const savedScreen = sessionStorage.getItem('lagnaSetu_activeScreen');
    const rawHash = (window.location.hash || '').replace('#/', '').replace('#', '');

    const PUBLIC_GUEST_SCREENS = new Set([
        'scr-welcome', 'scr-login', 'scr-reg1', 'scr-otp-signup', 'scr-splash',
        'scr-forgot', 'scr-forgot-otp', 'scr-newpass', 'scr-howitworks', 'scr-help'
    ]);

    const INCOMPLETE_ALLOWED = new Set([
        'scr-reg1', 'scr-otp-signup', 'scr-reg-caste', 'scr-reg2', 'scr-reg3', 'scr-reg4',
        'scr-welcome', 'scr-login', 'scr-splash', 'scr-forgot', 'scr-forgot-otp', 'scr-newpass',
        'scr-howitworks', 'scr-help'
    ]);

    const hasExplicitHash = Boolean(rawHash && rawHash !== 'splash');
    const hasExistingSession = Boolean(visited || savedScreen || hasExplicitHash || (state.currentUser && state.currentUser.email));

    if (hasExistingSession) {
        let targetScreen = 'scr-welcome';

        // -------------------------------------------------------------
        // SCENARIO 1: UNAUTHENTICATED VISITOR / SHARED LINK RECIPIENT / GUEST
        // -------------------------------------------------------------
        if (!state.currentUser || !state.currentUser.email) {
            state.currentUser = null;
            state.profileComplete = false;
            state.membershipPaid = false;

            if (hasExplicitHash) {
                const requestedScreen = 'scr-' + rawHash;
                // Only explicitly public guest screens are allowed directly
                if (PUBLIC_GUEST_SCREENS.has(requestedScreen) && document.getElementById(requestedScreen)) {
                    targetScreen = requestedScreen;
                } else {
                    // ANY protected internal screen link (e.g. #/browse, #/home, #/profile, #/editprofile, #/membership)
                    // MUST strictly land unauthenticated visitors on scr-welcome.
                    targetScreen = 'scr-welcome';
                }
            } else {
                targetScreen = 'scr-welcome';
            }

            // Clean up URL hash so recipient does not see an internal hash like #/browse or #/home with dummy data
            if (targetScreen === 'scr-welcome' && rawHash && !PUBLIC_GUEST_SCREENS.has('scr-' + rawHash)) {
                try {
                    history.replaceState({ screen: 'scr-welcome' }, null, '#/welcome');
                } catch (e) {
                    window.location.hash = '#/welcome';
                }
            }
        }
        // -------------------------------------------------------------
        // SCENARIO 2: AUTHENTICATED ACTIVE USER
        // -------------------------------------------------------------
        else {
            targetScreen = savedScreen;
            if (hasExplicitHash) {
                const hashScr = 'scr-' + rawHash;
                if (document.getElementById(hashScr)) targetScreen = hashScr;
            }
            if (!targetScreen || !document.getElementById(targetScreen) || targetScreen === 'scr-splash' || targetScreen === 'scr-welcome' || targetScreen === 'scr-login') {
                targetScreen = 'scr-home';
            }

            // Route Guard A: Incomplete Profile Check
            if (!state.profileComplete) {
                if (!INCOMPLETE_ALLOWED.has(targetScreen)) {
                    targetScreen = 'scr-reg-caste';
                    setTimeout(() => { if (typeof openModal === 'function') openModal('modalCompleteProfile'); }, 350);
                }
            }
            // Route Guard B: Boy 30-Day Pass Paywall Check (ONLY FOR BOYS, GIRLS ARE 100% FREE)
            else if (typeof isBoyGender === 'function' ? isBoyGender(state.currentUser.gender) : (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy' || state.currentUser.gender === 'boys')) {
                const passStatus = typeof checkBoyPassStatus === 'function' 
                    ? checkBoyPassStatus(state.currentUser) 
                    : { active: state.currentUser.paymentStatus === 'Active' };
                if (!passStatus.active) {
                    const UNPAID_ALLOWED = new Set([
                        'scr-membership', 'scr-welcome', 'scr-login', 'scr-howitworks', 'scr-help', 
                        'scr-editprofile', 'scr-splash', 'scr-reg1', 'scr-otp-signup', 'scr-reg-caste', 
                        'scr-reg2', 'scr-reg3', 'scr-reg4'
                    ]);
                    if (!UNPAID_ALLOWED.has(targetScreen)) {
                        targetScreen = 'scr-membership';
                        setTimeout(() => { if (typeof openModal === 'function') openModal('modalPaywall'); }, 350);
                    }
                }
            } else if (typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girls')) {
                // Guaranteed 100% Free Lifetime for Girls
                state.currentUser.gender = 'Girl';
                state.currentUser.paymentStatus = 'Free';
                state.membershipPaid = true;
                if (targetScreen === 'scr-membership') {
                    targetScreen = 'scr-home';
                }
            }
        }

        // Activate targeted screen in DOM
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const targetEl = document.getElementById(targetScreen);
        if (targetEl) {
            targetEl.classList.add('active');
            targetEl.scrollTop = 0;
        }

        if (targetScreen === 'scr-chat') {
            document.body.classList.add('in-chat-screen');
        } else {
            document.body.classList.remove('in-chat-screen');
        }
        state.history = [targetScreen];
        updateDesktopNav(targetScreen);

        // Render authorized screen components
        if (state.currentUser && state.currentUser.email) {
            // Restore persistent favorites from database & storage
            if (typeof restoreUserFavorites === 'function') {
                restoreUserFavorites(state.currentUser.email, state.currentUser.id);
            }

            if (targetScreen === 'scr-profile' && state.activeProfileId) {
                openProfile(state.activeProfileId);
            } else if (targetScreen === 'scr-chat' && state.activeChatId) {
                openChatFor(state.activeChatId);
            } else if (targetScreen === 'scr-editprofile') {
                populateEditProfile();
            } else if (targetScreen === 'scr-home') {
                renderHome();
                if (typeof updateHeaderUserDisplay === 'function') updateHeaderUserDisplay();
            } else if (targetScreen === 'scr-browse') {
                renderBrowse();
            } else if (targetScreen === 'scr-favorites') {
                renderFavorites();
            } else if (targetScreen === 'scr-inbox') {
                renderInbox();
            } else if (targetScreen === 'scr-membership') {
                updateMembershipScreen();
            }
        }

        if (targetScreen === 'scr-howitworks') renderHowItWorks();
        if (targetScreen === 'scr-help') renderFaqs();

        showGlobalLoader('Loading...', 240);
        sessionStorage.setItem('lagnaSetu_visited', 'true');
        saveSessionState();
    } else {
        // First fresh visit to root without session or hash: show splash briefly, then welcome
        setTimeout(() => {
            state.history = ['scr-welcome'];
            go('scr-welcome', true);
            sessionStorage.setItem('lagnaSetu_visited', 'true');
            saveSessionState();
        }, 850);
    }
}

// Synchronize changes made in Admin in real-time across tabs
window.addEventListener('storage', (e) => {
    if (e.key === LS_COMMUNITY_MAINTENANCE) {
        checkMaintenanceMode();
    } else if (e.key === LS_HOWITWORKS_KEY) {
        renderHowItWorks();
    } else if (e.key === LS_FAQS_KEY) {
        renderFaqs();
    } else if (e.key === LS_CASTES_KEY) {
        if (typeof renderCasteSelectors === 'function') renderCasteSelectors();
    }
});

let appInitialized = false;
function bootstrapApp() {
    if (appInitialized) return;
    appInitialized = true;
    if (typeof initAppHelpers === 'function') initAppHelpers();
    initApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
    window.addEventListener('load', bootstrapApp);
} else {
    bootstrapApp();
}

if (typeof initApp !== 'undefined') window.initApp = initApp;

