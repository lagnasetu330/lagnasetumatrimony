/* ============================================================ COMMUNITY PROFILES DATA ============================================================ */
// Production Mode: Empty default profiles. Real profiles load live from Supabase & Cloudinary CDN.
const DEFAULT_PROFILES = [];

const LS_PROFILES_KEY = 'LS_COMMUNITY_PROFILES';

function loadCommunityProfiles() {
    try {
        const cached = localStorage.getItem(LS_PROFILES_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter(p => p && (typeof isUserPurged !== 'function' || !isUserPurged(p)));
            }
        }
        const sessionCached = sessionStorage.getItem('lagnaSetu_profiles');
        if (sessionCached) {
            const parsed = JSON.parse(sessionCached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter(p => p && (typeof isUserPurged !== 'function' || !isUserPurged(p)));
            }
        }
    } catch(e) {}
    return [];
}

let PROFILES = loadCommunityProfiles();

function saveCommunityProfiles() {
    try {
        if (Array.isArray(PROFILES) && PROFILES.length > 0) {
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(PROFILES));
            sessionStorage.setItem('lagnaSetu_profiles', JSON.stringify(PROFILES));
        }
    } catch(e) {}
}

/**
 * Asynchronously sync profiles from Supabase PostgreSQL on startup or in background
 * @param {boolean} force - Force sync
 * @param {boolean} silent - Silent sync without showing any global spinner
 */
async function syncProfilesFromSupabase(force = false, silent = false) {
    if (typeof supabaseFetchProfiles !== 'function') return;
    const shouldShowLoader = !silent && (!PROFILES || PROFILES.length === 0);
    try {
        if (shouldShowLoader && typeof showGlobalLoader === 'function') {
            showGlobalLoader('Loading verified profiles from Supabase...', 800);
        }
        const remoteProfiles = await supabaseFetchProfiles();
        if (Array.isArray(remoteProfiles)) {
            PROFILES = remoteProfiles.filter(p => p && (typeof isUserPurged !== 'function' || !isUserPurged(p)));
            window.PROFILES = PROFILES;
            saveCommunityProfiles();

            // Reconcile current user's details live as soon as Supabase profiles arrive
            if (typeof state !== 'undefined' && state.currentUser && state.currentUser.email) {
                const myEmail = state.currentUser.email.trim().toLowerCase();
                const curId = state.currentUser.id || state.currentUser.profileId;
                const myProf = PROFILES.find(p => p && ((p.email && p.email.trim().toLowerCase() === myEmail) || (curId && (p.id == curId || p.userId == curId))));
                if (myProf && myProf.name && myProf.community) {
                    if (!state.currentUser.name || state.currentUser.name === 'Member') {
                        state.currentUser.name = myProf.name;
                    }
                    if (!state.currentUser.gender) {
                        state.currentUser.gender = (myProf.gender === 'girls' || myProf.gender === 'Girl') ? 'Girl' : 'Boy';
                    }
                    if (!state.currentUser.caste) {
                        state.currentUser.caste = myProf.community;
                    }
                    if (!state.currentUser.img || !state.currentUser.photo) {
                        state.currentUser.img = myProf.img || (Array.isArray(myProf.photos) && myProf.photos[0]);
                        state.currentUser.photo = state.currentUser.img;
                    }
                    state.currentUser.profileId = myProf.id;
                    const isDone = typeof isProfileFullyComplete === 'function' ? isProfileFullyComplete(state.currentUser) : true;
                    state.currentUser.profileComplete = isDone;
                    state.profileComplete = isDone;
                    if (typeof saveSessionState === 'function') saveSessionState();
                }
            }

            if (typeof updateHeaderUserDisplay === 'function') {
                updateHeaderUserDisplay();
            }
            if (typeof updateHomeStats === 'function') {
                updateHomeStats();
            }
            if (typeof renderHome === 'function' && document.getElementById('homeGirlsList')) {
                renderHome();
            }
            if (typeof renderBrowse === 'function' && document.getElementById('browseList')) {
                renderBrowse();
            }
            if (typeof checkCurrentUserStatus === 'function') {
                checkCurrentUserStatus();
            }
        }
    } catch (err) {
        console.warn('[Profiles] Supabase sync note:', err);
    } finally {
        if (shouldShowLoader && typeof hideGlobalLoader === 'function') {
            hideGlobalLoader();
        }
    }
}

/**
 * Realtime subscription: Listen for profile insertions, updates, and suspensions
 */
function setupProfilesRealtime() {
    if (typeof supabaseSubscribeToTable !== 'function') return;
    try {
        supabaseSubscribeToTable('profiles', 
            (newRow) => {
                if (typeof isUserPurged === 'function' && isUserPurged(newRow)) return;
                const prof = typeof mapProfileFromSupabase === 'function' ? mapProfileFromSupabase(newRow) : newRow;
                if (!prof || !prof.id || prof.accountStatus === 'deleted' || prof.account_status === 'deleted') return;
                const idx = PROFILES.findIndex(p => p.id === prof.id);
                if (idx === -1) {
                    PROFILES.unshift(prof);
                } else {
                    PROFILES[idx] = { ...PROFILES[idx], ...prof };
                }
                window.PROFILES = PROFILES;
                saveCommunityProfiles();
                if (typeof updateHomeStats === 'function') updateHomeStats();
                if (typeof updateHeaderUserDisplay === 'function') updateHeaderUserDisplay();
                if (typeof renderHome === 'function' && document.getElementById('homeGirlsList')) renderHome();
                if (typeof renderBrowse === 'function' && document.getElementById('browseList')) renderBrowse();
                if (typeof checkCurrentUserStatus === 'function') checkCurrentUserStatus();
            },
            (updatedRow) => {
                if (!updatedRow) return;
                // Live check if current user was updated (e.g. suspended or reactivated)
                if (typeof state !== 'undefined' && state.currentUser) {
                    const myId = String(state.currentUser.id || state.currentUser.profileId || '');
                    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
                    const rowId = String(updatedRow.id || '');
                    const rowEmail = (updatedRow.email || '').trim().toLowerCase();
                    if ((rowId && rowId === myId) || (rowEmail && rowEmail === myEmail)) {
                        if (updatedRow.account_status === 'suspended') {
                            state.currentUser.status = 'Suspended';
                            state.currentUser.suspensionReason = updatedRow.suspension_reason || 'Account suspended by administrator.';
                            if (typeof saveSessionState === 'function') saveSessionState();
                            if (typeof enforceUserSuspendedModal === 'function') enforceUserSuspendedModal(state.currentUser.suspensionReason);
                            return;
                        } else if (updatedRow.account_status === 'active' || updatedRow.account_status === 'Active') {
                            state.currentUser.status = 'Active';
                            if (typeof saveSessionState === 'function') saveSessionState();
                            if (typeof dismissUserSuspendedModal === 'function') dismissUserSuspendedModal();
                        }
                    }
                }

                if ((typeof isUserPurged === 'function' && isUserPurged(updatedRow)) || (updatedRow && updatedRow.account_status === 'deleted')) {
                    handleRemoteAccountPurge(updatedRow.id, updatedRow.email, updatedRow);
                    return;
                }
                const prof = typeof mapProfileFromSupabase === 'function' ? mapProfileFromSupabase(updatedRow) : updatedRow;
                if (!prof || !prof.id || prof.accountStatus === 'deleted' || prof.account_status === 'deleted') {
                    // Only purge truly deleted profiles — suspended profiles are NOT deleted!
                    if (updatedRow && updatedRow.id) {
                        handleRemoteAccountPurge(updatedRow.id, updatedRow.email, updatedRow);
                    }
                    return;
                }
                // For suspended profiles: remove from public browse feed but do NOT purge/delete
                if (prof.accountStatus === 'suspended' || prof.account_status === 'suspended') {
                    PROFILES = PROFILES.filter(p => p && String(p.id) !== String(prof.id));
                    window.PROFILES = PROFILES;
                    saveCommunityProfiles();
                    if (typeof renderHome === 'function' && document.getElementById('homeGirlsList')) renderHome();
                    if (typeof renderBrowse === 'function' && document.getElementById('browseList')) renderBrowse();
                    return;
                }
                const idx = PROFILES.findIndex(p => p.id === prof.id);
                if (idx !== -1) {
                    PROFILES[idx] = { ...PROFILES[idx], ...prof };
                } else {
                    PROFILES.unshift(prof);
                }
                window.PROFILES = PROFILES;
                saveCommunityProfiles();
                if (typeof updateHomeStats === 'function') updateHomeStats();
                if (typeof updateHeaderUserDisplay === 'function') updateHeaderUserDisplay();
                if (typeof renderHome === 'function' && document.getElementById('homeGirlsList')) renderHome();
                if (typeof renderBrowse === 'function' && document.getElementById('browseList')) renderBrowse();
                // Only check current user status for own profile updates
                if (typeof checkCurrentUserStatus === 'function' && typeof state !== 'undefined' && state.currentUser) {
                    const myId = String(state.currentUser.id || state.currentUser.profileId || '');
                    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
                    const rowId = String(updatedRow.id || '');
                    const rowEmail = (updatedRow.email || '').trim().toLowerCase();
                    if ((rowId && rowId === myId) || (rowEmail && rowEmail === myEmail)) {
                        checkCurrentUserStatus();
                    }
                }
            },
            (deletedRow) => {
                if (!deletedRow) return;
                handleRemoteAccountPurge(deletedRow.id, deletedRow.email, deletedRow);
            }
        );

        // Also subscribe to users table for live user moderation / deletion events
        supabaseSubscribeToTable(
            'users',
            () => {},
            (updatedUser) => {
                if (!updatedUser) return;
                if (state.currentUser && (String(state.currentUser.id) === String(updatedUser.id) || (updatedUser.email && state.currentUser.email && state.currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()))) {
                    if (updatedUser.status === 'Suspended') {
                        // Verify with profiles table (primary source of truth) before enforcing suspension
                        // to avoid false suspensions from stale users.status data
                        if (typeof supabaseCheckUserSuspended === 'function') {
                            supabaseCheckUserSuspended(state.currentUser.id || state.currentUser.profileId, state.currentUser.email).then(res => {
                                if (res && res.suspended) {
                                    state.currentUser.status = 'Suspended';
                                    state.currentUser.suspensionReason = res.reason || updatedUser.suspension_reason || 'Account suspended by administrator.';
                                    if (typeof saveSessionState === 'function') saveSessionState();
                                    if (typeof enforceUserSuspendedModal === 'function') enforceUserSuspendedModal(state.currentUser.suspensionReason);
                                }
                            }).catch(() => {});
                        }
                    } else if (updatedUser.status === 'Active') {
                        state.currentUser.status = 'Active';
                        if (typeof saveSessionState === 'function') saveSessionState();
                        if (typeof dismissUserSuspendedModal === 'function') dismissUserSuspendedModal();
                    }
                }
            },
            (deletedUser) => {
                if (!deletedUser) return;
                handleRemoteAccountPurge(deletedUser.id, deletedUser.email, deletedUser);
            }
        );

        // Subscribe to Realtime broadcast channel for instant cross-device account deletion
        const client = (typeof getSupabaseClient === 'function') ? getSupabaseClient() : null;
        if (client && typeof client.channel === 'function') {
            const bcChannel = client.channel('realtime:presence:community');
            bcChannel.on('broadcast', { event: 'user_account_deleted' }, ({ payload }) => {
                if (payload) {
                    handleRemoteAccountPurge(payload.id, payload.email, payload);
                }
            }).subscribe();
        }
    } catch (e) {
        console.warn('[Profiles] Realtime setup note:', e);
    }
}

/**
 * Handle remote account deletion broadcast or DB change in realtime
 * Instantly wipes user from memory, UI, and favorites across all tabs & devices
 */
function handleRemoteAccountPurge(delId, delEmail, rawPayload = {}) {
    const normEmail = delEmail ? String(delEmail).trim().toLowerCase() : '';
    const normId = delId ? String(delId).trim() : '';
    const ids = Array.isArray(rawPayload.ids) ? rawPayload.ids.map(String) : (normId ? [normId] : []);
    const emails = Array.isArray(rawPayload.emails) ? rawPayload.emails.map(e => String(e).trim().toLowerCase()) : (normEmail ? [normEmail] : []);

    if (typeof registerPurgedUserId === 'function') {
        registerPurgedUserId(...ids, ...emails);
    }

    console.info(`[Realtime Purge] Processing account deletion for IDs: [${ids.join(', ')}], Emails: [${emails.join(', ')}]`);

    // 1. Remove from in-memory PROFILES and localStorage
    PROFILES = PROFILES.filter(p => {
        if (!p) return false;
        const pId = String(p.id || '');
        const pUid = String(p.user_id || p.userId || '');
        const pEml = (p.email || '').trim().toLowerCase();
        if (ids.some(id => id && (id === pId || id === pUid))) return false;
        if (emails.some(eml => eml && eml === pEml)) return false;
        return true;
    });
    window.PROFILES = PROFILES;
    saveCommunityProfiles();

    // 2. Remove from favorites
    if (typeof state !== 'undefined' && state.favorites) {
        ids.forEach(id => {
            state.favorites.delete(Number(id));
            state.favorites.delete(id);
        });
        saveSessionState();
    }

    // 3. If currently viewing this deleted profile modal/screen, close it immediately!
    const profileScreen = document.getElementById('scr-profile');
    if (profileScreen && profileScreen.classList.contains('active')) {
        const viewingId = String(window.currentViewingProfileId || '');
        if (ids.some(id => id && id === viewingId)) {
            if (typeof goBack === 'function') goBack();
            else if (typeof go === 'function') go('scr-home');
            if (typeof showToast === 'function') showToast('This profile is no longer available.');
        }
    }

    // 3b. If currently chatting with this deleted user, close chat screen immediately!
    const chatScreen = document.getElementById('scr-chat');
    if (chatScreen && chatScreen.classList.contains('active')) {
        const viewingChatId = String(state.activeChatId || '');
        if (ids.some(id => id && id === viewingChatId) || (emails.length > 0 && emails.includes((state.activeChatEmail || '').toLowerCase()))) {
            if (typeof goBack === 'function') goBack();
            else if (typeof go === 'function') go('scr-inbox');
            if (typeof showToast === 'function') showToast('This user account is no longer active.');
        }
    }

    // 4. Check if currently logged-in user is the one deleted
    if (typeof state !== 'undefined' && state.currentUser) {
        const myId = String(state.currentUser.id || state.currentUser.userId || '');
        const myProfId = String(state.currentUser.profileId || '');
        const myEmail = (state.currentUser.email || '').trim().toLowerCase();

        const isMe = (ids.some(id => id && (id === myId || id === myProfId))) ||
                     (emails.some(eml => eml && eml === myEmail));

        if (isMe) {
            console.warn('[Realtime] Current user account was deleted remotely. Auto-logging out.');
            if (typeof purgeUserAccountLocally === 'function') {
                purgeUserAccountLocally(state.currentUser.email, state.currentUser.id);
            } else {
                state.currentUser = null;
                state.profileComplete = false;
                sessionStorage.clear();
                if (typeof go === 'function') go('scr-welcome', true);
            }
            if (typeof showToast === 'function') showToast('Your account has been permanently deleted.');
            return;
        }
    }

    // 5. Live update UI across the app
    if (typeof updateHomeStats === 'function') updateHomeStats();
    if (typeof renderHome === 'function' && document.getElementById('homeGirlsList')) renderHome();
    if (typeof renderBrowse === 'function' && document.getElementById('browseList')) renderBrowse();
    if (typeof renderFavorites === 'function' && document.getElementById('favContent')) renderFavorites();
    if (typeof syncUserChatAndInterests === 'function' && typeof state !== 'undefined' && state.currentUser) syncUserChatAndInterests();
}
window.handleRemoteAccountPurge = handleRemoteAccountPurge;

// Automatically trigger sync and realtime subscription on load
let _lastSilentProfilesSync = 0;
function triggerSilentProfilesSync(minIntervalMs = 8000) {
    const now = Date.now();
    if (now - _lastSilentProfilesSync < minIntervalMs) return;
    _lastSilentProfilesSync = now;
    if (typeof syncProfilesFromSupabase === 'function') {
        syncProfilesFromSupabase(false, true);
    }
}
window.triggerSilentProfilesSync = triggerSilentProfilesSync;

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof updateHomeStats === 'function') updateHomeStats();
        // Initial sync silent if cached profiles already exist, else quick loader
        const isSilentInitial = Array.isArray(PROFILES) && PROFILES.length > 0;
        syncProfilesFromSupabase(false, isSilentInitial);
        setupProfilesRealtime();

        // Silently sync platform auto_approve setting from Supabase
        if (typeof supabaseGetAppSetting === 'function') {
            supabaseGetAppSetting('auto_approve').then(res => {
                if (res && typeof res.enabled === 'boolean') {
                    try { localStorage.setItem('LS_COMMUNITY_AUTO_APPROVE', JSON.stringify(res)); } catch(_) {}
                }
            }).catch(() => {});
        }
    });

    // Auto-sync when user returns to tab / unlocks phone
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) triggerSilentProfilesSync(8000);
        });
        window.addEventListener('focus', () => {
            triggerSilentProfilesSync(8000);
        });
    }

    // Failsafe background periodic refresh every 40 seconds
    setInterval(() => {
        if (typeof document !== 'undefined' && !document.hidden) {
            triggerSilentProfilesSync(25000);
        }
    }, 40000);
}

/**
 * Enforce non-dismissible suspended modal for suspended accounts
 */
function enforceUserSuspendedModal(reason) {
    if (typeof state !== 'undefined' && state.currentUser) {
        state.currentUser.status = 'Suspended';
        state.currentUser.suspensionReason = reason || state.currentUser.suspensionReason || 'Violation of community guidelines or pending verification.';
    }
    const modal = document.getElementById('modalSuspended');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
        const reasonEl = document.getElementById('suspensionReasonText');
        if (reasonEl && reason) {
            reasonEl.textContent = reason;
        }
    }
}

/**
 * Dismiss suspended modal upon admin reactivation
 */
function dismissUserSuspendedModal() {
    if (typeof state !== 'undefined' && state.currentUser && state.currentUser.status === 'Suspended') {
        state.currentUser.status = 'Active';
    }
    const modal = document.getElementById('modalSuspended');
    if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }
}
window.enforceUserSuspendedModal = enforceUserSuspendedModal;
window.dismissUserSuspendedModal = dismissUserSuspendedModal;

async function checkCurrentUserStatus() {
    if (!state.currentUser || !state.currentUser.email) {
        dismissUserSuspendedModal();
        return;
    }

    // Direct live query to Supabase PostgreSQL (Single Source of Truth)
    if (typeof supabaseCheckUserSuspended === 'function') {
        try {
            const myId = state.currentUser.id || state.currentUser.profileId;
            const myEmail = state.currentUser.email;
            const res = await supabaseCheckUserSuspended(myId, myEmail);
            if (res && res.suspended) {
                enforceUserSuspendedModal(res.reason);
                return;
            } else {
                state.currentUser.status = 'Active';
                dismissUserSuspendedModal();
            }
        } catch (e) {
            console.warn('[Status] check error:', e);
        }
    }
}

const FAQS = [
    ['How do I register?', 'Tap "Create account" on the welcome screen and complete all 3 steps: community, personal & family details, and address.'],
    ['Is Lagna Setu free for girls?', 'Yes! 100% Lifetime Free access is guaranteed for all community girls.'],
    ['How much is the membership pass for boys?', 'Boys get 30 Days Full Access for just ₹99, giving direct contact to verified community brides\' families.'],
    ['How do I contact a profile?', 'You can direct Call or WhatsApp the girl\'s father using the verified contact buttons, or send an in-app interest request.'],
    ['Is my personal phone number visible to everyone?', 'No. Your personal registration number is kept strictly private for Admin review only. Only your father\'s contact number is shown to verified members.'],
    ['How do multi-photo profiles work?', 'Profiles with 2 or 3 photos display a photo counter badge. Tap on the photo to open the high-resolution photo carousel.'],
    ['How does the DOB age calculator work?', 'Tap on Date of Birth to open the custom scrollable calendar modal. Your exact age in years is calculated and verified automatically.'],
];

window.DEFAULT_PROFILES = DEFAULT_PROFILES;
window.PROFILES = PROFILES;
window.loadCommunityProfiles = loadCommunityProfiles;
window.saveCommunityProfiles = saveCommunityProfiles;
window.syncProfilesFromSupabase = syncProfilesFromSupabase;
window.setupProfilesRealtime = setupProfilesRealtime;
window.checkCurrentUserStatus = checkCurrentUserStatus;
window.FAQS = FAQS;
