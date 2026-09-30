/* ============================================================ ROUTER & NAVIGATION ============================================================ */
/* ============================================================ DESKTOP SIDEBAR STATE ============================================================ */
const APP_SCREENS = new Set(['scr-home', 'scr-browse', 'scr-profile', 'scr-favorites', 'scr-inbox', 'scr-chat', 'scr-notifs', 'scr-editprofile', 'scr-membership', 'scr-howitworks', 'scr-help', 'scr-report']);
function navKeyFor(id) {
    if (id === 'scr-profile' || id === 'scr-report') return 'scr-browse';
    if (id === 'scr-chat') return 'scr-inbox';
    if (id === 'scr-howitworks') return null;
    return id;
}
function updateDesktopNav(id) {
    document.body.classList.toggle('sidebar-active', APP_SCREENS.has(id));
    const key = navKeyFor(id);
    document.querySelectorAll('.desktop-sidebar .ds-item[data-nav]').forEach(btn => {
        btn.classList.toggle('active', !!key && btn.dataset.nav === key);
    });
}

/* ============================================================ NAVIGATION & ROUTE LOADER ============================================================ */
const PUBLIC_GUEST_SCREENS = new Set([
    'scr-welcome', 'scr-login', 'scr-reg1', 'scr-otp-signup', 'scr-splash',
    'scr-forgot', 'scr-forgot-otp', 'scr-newpass', 'scr-howitworks', 'scr-help'
]);

const INCOMPLETE_ALLOWED = new Set([
    'scr-reg1', 'scr-otp-signup', 'scr-reg-caste', 'scr-reg2', 'scr-reg3', 'scr-reg4',
    'scr-welcome', 'scr-login', 'scr-splash', 'scr-forgot', 'scr-forgot-otp', 'scr-newpass',
    'scr-howitworks', 'scr-help'
]);

function goToCompleteProfile() {
    closeModal('modalCompleteProfile');
    go('scr-reg-caste');
}

function go(id, replace = false) {
    // If entering registration screen, ensure fresh empty inputs
    if (id === 'scr-reg1') {
        if (typeof resetRegistrationStateAndInputs === 'function') {
            resetRegistrationStateAndInputs();
        }
    }

    // If entering login screen, pre-fill remembered credentials if enabled
    if (id === 'scr-login') {
        if (typeof restoreRememberedLogin === 'function') {
            restoreRememberedLogin();
        }
    }

    // 1. Unauthenticated Guest Protection Rule:
    // If not logged in, guests may ONLY access public screens.
    // Any attempt to access internal screens (scr-home, scr-browse, scr-editprofile, scr-membership, etc.)
    // MUST strictly redirect straight to scr-welcome with no modals or dummy data.
    if (!state.currentUser || !state.currentUser.email) {
        if (!PUBLIC_GUEST_SCREENS.has(id)) {
            id = 'scr-welcome';
            replace = true;
        }
    }

    // 2. Account status interceptor (Strict blocking modal for suspended users)
    if (state.currentUser && state.currentUser.status === 'Suspended') {
        if (id !== 'scr-welcome') {
            if (typeof enforceUserSuspendedModal === 'function') {
                enforceUserSuspendedModal(state.currentUser.suspensionReason);
            } else if (typeof openModal === 'function') {
                openModal('modalSuspended');
            }
            return;
        }
    }

    // 3. Profile completion verification using strict validator
    if (state.currentUser) {
        const isComplete = typeof isProfileFullyComplete === 'function' 
            ? isProfileFullyComplete(state.currentUser) 
            : false;
        state.profileComplete = isComplete;
        state.currentUser.profileComplete = isComplete;
    }

    // Incomplete Profile Gatekeeper:
    // If user has NOT completed their profile, they MUST NOT access member screens (home, browse, inbox, etc.)
    if (state.currentUser && !state.profileComplete) {
        if (!INCOMPLETE_ALLOWED.has(id)) {
            console.warn(`[Router] Profile incomplete. Blocking access to ${id}, strictly routing to scr-reg-caste.`);
            id = 'scr-reg-caste';
            replace = true;
            setTimeout(() => {
                if (typeof openModal === 'function') openModal('modalCompleteProfile');
            }, 100);
        }
    }

    // If profile is FULLY complete, prevent navigation back into registration steps
    if (state.currentUser && state.profileComplete) {
        if (id === 'scr-reg-caste' || id === 'scr-reg2' || id === 'scr-reg3' || id === 'scr-reg4') {
            const isBoy = typeof isBoyGender === 'function' ? isBoyGender(state.currentUser.gender) : (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy');
            const passCheck = typeof checkBoyPassStatus === 'function' ? checkBoyPassStatus(state.currentUser) : { active: state.currentUser.paymentStatus === 'Active' };
            if (isBoy && !passCheck.active) {
                id = 'scr-membership';
            } else {
                id = 'scr-home';
            }
        }
    }

    // Strict Girl Lifetime Free Pass: Girls NEVER go to scr-membership or see paywalls
    const isGirlUser = state.currentUser && (typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl' || state.currentUser.gender === 'girls'));
    if (isGirlUser) {
        state.membershipPaid = true;
        if (state.currentUser) state.currentUser.paymentStatus = 'Free';
        if (id === 'scr-membership') {
            id = 'scr-home'; // Seamlessly redirect girl to home
        }
    }

    // Boys Paywall Gatekeeper (Strict 30-Day & Unpaid Access Enforcement - ONLY FOR BOYS)
    const isBoyUser = state.currentUser && (typeof isBoyGender === 'function' ? isBoyGender(state.currentUser.gender) : (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy'));
    if (isBoyUser) {
        const passCheck = typeof checkBoyPassStatus === 'function' 
            ? checkBoyPassStatus(state.currentUser) 
            : { active: state.currentUser.paymentStatus === 'Active' };

        if (!passCheck.active) {
            state.membershipPaid = false;
            state.currentUser.paymentStatus = (passCheck.reason === 'expired') ? 'Expired' : 'Unpaid';
            const UNPAID_ALLOWED = new Set([
                'scr-membership', 'scr-welcome', 'scr-login', 'scr-howitworks', 'scr-help', 
                'scr-editprofile', 'scr-splash', 'scr-reg1', 'scr-otp-signup', 'scr-reg-caste', 
                'scr-reg2', 'scr-reg3', 'scr-reg4'
            ]);
            if (!UNPAID_ALLOWED.has(id)) {
                // Strictly deny entry to home, browse, or any girl profiles — direct straight to scr-membership
                if (id !== 'scr-membership') {
                    go('scr-membership', true);
                    openModal('modalPaywall');
                    if (passCheck.reason === 'expired') {
                        showToast('Your 30-Day Pass has expired! Pay ₹99 via UPI to renew.');
                    } else {
                        showToast('Boys ₹99 Pass required: Pay via UPI to explore community brides.');
                    }
                    return;
                }
            }
        }
    }

    // Update URL hash for clean page identification & bookmarking
    const routeName = id.replace('scr-', '');
    if (window.location.hash !== '#/' + routeName) {
        if (replace) {
            history.replaceState({ screen: id }, null, '#/' + routeName);
        } else {
            history.pushState({ screen: id }, null, '#/' + routeName);
        }
    }

    const currentScreen = document.querySelector('.screen.active')?.id;
    if (currentScreen === id && state.history.length > 0) {
        return;
    }

    // Show Global Page Loader transition
    if (id !== 'scr-splash') {
        showGlobalLoader('Loading...', 240);
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(id);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.scrollTop = 0;
    }

    if (id === 'scr-chat') {
        document.body.classList.add('in-chat-screen');
    } else {
        document.body.classList.remove('in-chat-screen');
    }

    // Maintain history stack cleanly without duplicates or splash
    if (id !== 'scr-splash') {
        if (replace) {
            if (state.history.length > 0) {
                state.history[state.history.length - 1] = id;
            } else {
                state.history = [id];
            }
        } else {
            if (state.history.length === 0 || state.history[state.history.length - 1] !== id) {
                state.history.push(id);
            }
        }
    }

    if (id === 'scr-home') { renderHome(); updateHeaderUserDisplay(); }
    if (id === 'scr-browse') renderBrowse();
    if (id === 'scr-favorites') renderFavorites();
    if (id === 'scr-inbox') renderInbox();
    if (id === 'scr-notifs') {
        if (typeof renderUserNotifs === 'function') renderUserNotifs();
        if (typeof markAllUserNotifsAsRead === 'function') {
            setTimeout(() => { markAllUserNotifsAsRead(true); }, 400);
        }
    }
    if (id === 'scr-help') renderFaqs();
    if (id === 'scr-howitworks') renderHowItWorks();
    if (id === 'scr-membership') updateMembershipScreen();
    if (id === 'scr-editprofile') populateEditProfile();

    updateDesktopNav(id);
    updateInboxBadge();
    if (typeof updateUserNotifBadge === 'function') updateUserNotifBadge();
    saveSessionState();
    window.scrollTo(0, 0);

    if (id === 'scr-home' && state.currentUser) {
        const isComplete = typeof isProfileFullyComplete === 'function' ? isProfileFullyComplete(state.currentUser) : state.profileComplete;
        if (!isComplete) {
            setTimeout(() => {
                if (!state.profileComplete && (typeof isProfileFullyComplete === 'function' ? !isProfileFullyComplete(state.currentUser) : true)) {
                    openModal('modalCompleteProfile');
                }
            }, 250);
        } else {
            state.profileComplete = true;
            if (typeof closeModal === 'function') closeModal('modalCompleteProfile');
        }
    }
}

function goBack() {
    const current = document.querySelector('.screen.active')?.id;

    // Contextual fallback: Unpaid boy on membership screen should not navigate back into registration or home
    if (current === 'scr-membership' && state.currentUser && (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy')) {
        const pStatus = typeof checkBoyPassStatus === 'function' ? checkBoyPassStatus(state.currentUser) : { active: false };
        if (!pStatus.active) {
            openModal('modalLogout');
            return;
        }
    }

    if (state.history.length > 1) {
        state.history.pop(); // Remove current screen
        let prev = state.history[state.history.length - 1];

        // If user already completed profile, never navigate back into registration screens
        if (state.currentUser && state.profileComplete && prev && (prev.startsWith('scr-reg') || prev.startsWith('scr-otp'))) {
            state.history = state.history.filter(h => !h.startsWith('scr-reg') && !h.startsWith('scr-otp'));
            prev = state.history[state.history.length - 1];
        }

        if (prev && prev !== 'scr-splash' && document.getElementById(prev)) {
            go(prev, true);
            return;
        }
    }

    if (!state.currentUser || !state.currentUser.email) {
        go('scr-welcome', true);
    } else if (current && (current.startsWith('scr-reg') || current.startsWith('scr-login') || current.startsWith('scr-forgot') || current.startsWith('scr-otp'))) {
        go('scr-welcome', true);
    } else {
        go('scr-home', true);
    }
}

/* Handle browser back / forward navigation */
window.addEventListener('popstate', (e) => {
    const hash = window.location.hash.replace('#/', '');
    let targetId = 'scr-' + (hash || (state.currentUser ? 'home' : 'welcome'));
    if ((!state.currentUser || !state.currentUser.email) && !PUBLIC_GUEST_SCREENS.has(targetId)) {
        targetId = 'scr-welcome';
        try {
            history.replaceState({ screen: 'scr-welcome' }, null, '#/welcome');
        } catch(err) {
            window.location.hash = '#/welcome';
        }
    }
    if (document.getElementById(targetId)) {
        if (state.history.length > 1 && state.history[state.history.length - 2] === targetId) {
            state.history.pop();
            go(targetId, true);
        } else {
            go(targetId, false);
        }
    }
});

// Global Window Exports
if (typeof go !== 'undefined') window.go = go;
if (typeof goBack !== 'undefined') window.goBack = goBack;
if (typeof updateDesktopNav !== 'undefined') window.updateDesktopNav = updateDesktopNav;
if (typeof openModal !== 'undefined') window.openModal = openModal;
if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
