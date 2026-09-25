/* ============================================================ COMMUNITY PROFILES DATA ============================================================ */
// Production Mode: Empty default profiles. Real profiles load live from Supabase & Cloudinary CDN.
const DEFAULT_PROFILES = [];

const LS_PROFILES_KEY = 'LS_COMMUNITY_PROFILES';

function loadCommunityProfiles() {
    try {
        const raw = localStorage.getItem(LS_PROFILES_KEY) || localStorage.getItem('lagnaSetu_profiles');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Filter out any leftover mock dummy profiles (those with mock IDs 1 to 15 from old demo data)
                const realOnly = parsed.filter(p => p && p.id && (typeof p.id === 'string' || p.id > 1000));
                if (realOnly.length !== parsed.length) {
                    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(realOnly));
                }
                return realOnly;
            }
        }
    } catch(e) {}
    return [];
}

let PROFILES = loadCommunityProfiles();

function saveCommunityProfiles() {
    try {
        localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(PROFILES));
        sessionStorage.setItem('lagnaSetu_profiles', JSON.stringify(PROFILES));
    } catch(e) {}
}

/**
 * Asynchronously sync profiles from Supabase PostgreSQL on startup
 */
async function syncProfilesFromSupabase() {
    if (typeof supabaseFetchProfiles !== 'function') return;
    try {
        const remoteProfiles = await supabaseFetchProfiles();
        if (Array.isArray(remoteProfiles)) {
            PROFILES = remoteProfiles;
            window.PROFILES = PROFILES;
            saveCommunityProfiles();

            // Reconcile current user's details live as soon as Supabase profiles arrive
            if (typeof state !== 'undefined' && state.currentUser && state.currentUser.email) {
                const myEmail = state.currentUser.email.trim().toLowerCase();
                const curId = state.currentUser.id || state.currentUser.profileId;
                const myProf = PROFILES.find(p => p && ((p.email && p.email.trim().toLowerCase() === myEmail) || (curId && (p.id == curId || p.userId == curId))));
                if (myProf) {
                    if (!state.currentUser.name || state.currentUser.name === 'Member') {
                        state.currentUser.name = myProf.name;
                    }
                    if (!state.currentUser.img || !state.currentUser.photo) {
                        state.currentUser.img = myProf.img || (Array.isArray(myProf.photos) && myProf.photos[0]);
                        state.currentUser.photo = state.currentUser.img;
                    }
                    state.currentUser.profileId = myProf.id;
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
                const prof = typeof mapProfileFromSupabase === 'function' ? mapProfileFromSupabase(newRow) : newRow;
                if (!prof || !prof.id) return;
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
                const prof = typeof mapProfileFromSupabase === 'function' ? mapProfileFromSupabase(updatedRow) : updatedRow;
                if (!prof || !prof.id) return;
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
                if (typeof checkCurrentUserStatus === 'function') checkCurrentUserStatus();
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
                        state.currentUser.status = 'Suspended';
                        if (typeof showToast === 'function') showToast('Your account has been suspended by the administrator.');
                        if (typeof checkCurrentUserStatus === 'function') checkCurrentUserStatus();
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
}
window.handleRemoteAccountPurge = handleRemoteAccountPurge;

// Automatically trigger sync and realtime subscription on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof updateHomeStats === 'function') updateHomeStats();
        syncProfilesFromSupabase();
        setupProfilesRealtime();
    });
}

function checkCurrentUserStatus() {
    if (!state.currentUser) {
        const notice = document.getElementById('userSuspendedNotice');
        if (notice) notice.style.display = 'none';
        return;
    }
    const myProfile = PROFILES.find(p => p.id === state.currentUser?.id) || PROFILES.find(p => p.name === state.currentUser?.name);
    const notice = document.getElementById('userSuspendedNotice');
    if (myProfile && myProfile.accountStatus === 'suspended') {
        state.currentUser.status = 'Suspended';
        state.currentUser.suspensionReason = myProfile.suspensionReason || 'Account suspended by administrator for policy violation.';
        if (notice) notice.style.display = 'block';
    } else {
        state.currentUser.status = 'Active';
        if (notice) notice.style.display = 'none';
    }
}

const FAQS = [
    ['How do I register?', 'Tap "Create account" on the welcome screen and complete all 3 steps: community, personal & family details, and address.'],
    ['Is Lagna Setu free for girls?', 'Yes! 100% Lifetime Free access is guaranteed for all community girls.'],
    ['How much is the membership pass for boys?', 'Boys get 30 Days Full Access for just ₹49, giving direct contact to verified community brides\' families.'],
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
