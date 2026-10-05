/* ============================================================ CHAT & INTEREST DATA (PRODUCTION) ============================================================ */
let INCOMING_REQUESTS = [];
let OUTGOING_REQUESTS = [];
let CHAT_THREADS = [];

// Local Seen Messages Cache (Production-grade persistence against page reloads)
const LS_SEEN_CACHE_PREFIX = 'ls_seen_msg_ids_';

function getLocalSeenMsgIds(userId) {
    if (!userId) return new Set();
    try {
        const raw = localStorage.getItem(LS_SEEN_CACHE_PREFIX + userId);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return new Set(arr);
        }
    } catch (_) {}
    return new Set();
}

function markMessagesSeenLocally(userId, msgIds) {
    if (!userId || !Array.isArray(msgIds) || msgIds.length === 0) return;
    try {
        const set = getLocalSeenMsgIds(userId);
        let changed = false;
        msgIds.forEach(id => {
            if (id && !set.has(String(id))) {
                set.add(String(id));
                changed = true;
            }
        });
        if (changed) {
            const arr = Array.from(set);
            const trimmed = arr.length > 2500 ? arr.slice(arr.length - 2500) : arr;
            localStorage.setItem(LS_SEEN_CACHE_PREFIX + userId, JSON.stringify(trimmed));
        }
    } catch (_) {}
}

function findProfile(id, email) { 
    if (!id && !email) return null;
    const pid = Number(id);
    const strId = String(id || '').trim();
    const strEmail = String(email || (strId.includes('@') ? strId : '')).trim().toLowerCase();

    if (typeof isUserPurged === 'function') {
        if (strId && isUserPurged(strId)) return null;
        if (!isNaN(pid) && pid > 0 && isUserPurged(pid)) return null;
        if (strEmail && isUserPurged(strEmail)) return null;
    }

    const profilesList = Array.isArray(window.PROFILES) ? window.PROFILES : [];

    // 1. Direct match by id or userId / user_id in window.PROFILES
    if (id) {
        let p = profilesList.find(x => x && (
            x.id === id || 
            String(x.id) === strId || 
            (!isNaN(pid) && pid > 0 && Number(x.id) === pid) ||
            (x.userId && (String(x.userId) === strId || (!isNaN(pid) && pid > 0 && Number(x.userId) === pid))) ||
            (x.user_id && (String(x.user_id) === strId || (!isNaN(pid) && pid > 0 && Number(x.user_id) === pid)))
        ));
        if (p) {
            if (p.accountStatus === 'deleted' || p.account_status === 'deleted' || p.name === '[Deleted Account]') return null;
            if (typeof isUserPurged === 'function' && isUserPurged(p)) return null;
            return p;
        }
    }

    // 2. Match by email in window.PROFILES
    if (strEmail && !strEmail.includes('•')) {
        let p = profilesList.find(x => x && x.email && x.email.trim().toLowerCase() === strEmail);
        if (p) {
            if (p.accountStatus === 'deleted' || p.account_status === 'deleted' || p.name === '[Deleted Account]') return null;
            if (typeof isUserPurged === 'function' && isUserPurged(p)) return null;
            return p;
        }
    }

    // 2B. Match from sessionStorage / localStorage cached profiles
    try {
        const cachedRaw = sessionStorage.getItem('mangalSetu_profiles') || localStorage.getItem('LS_COMMUNITY_PROFILES');
        if (cachedRaw) {
            const cachedList = JSON.parse(cachedRaw);
            if (Array.isArray(cachedList) && cachedList.length > 0) {
                let p = cachedList.find(x => x && (
                    (id && (x.id === id || String(x.id) === strId || (!isNaN(pid) && pid > 0 && Number(x.id) === pid) || (x.userId && (String(x.userId) === strId || Number(x.userId) === pid)))) ||
                    (strEmail && !strEmail.includes('•') && x.email && x.email.trim().toLowerCase() === strEmail)
                ));
                if (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member') {
                    if (p.accountStatus === 'deleted' || p.account_status === 'deleted' || p.name === '[Deleted Account]') return null;
                    if (typeof isUserPurged === 'function' && isUserPurged(p)) return null;
                    return p;
                }
            }
        }
    } catch (_) {}

    // 3. Match from existing CHAT_THREADS in memory
    if (typeof CHAT_THREADS !== 'undefined' && Array.isArray(CHAT_THREADS)) {
        const thread = CHAT_THREADS.find(t => t && (
            (id && (String(t.profileId) === strId || (!isNaN(pid) && pid > 0 && Number(t.profileId) === pid))) ||
            (strEmail && t.peerEmail && t.peerEmail.trim().toLowerCase() === strEmail)
        ));
        if (thread && thread.name && thread.name !== 'Community Member' && thread.name !== 'Community Match' && thread.name !== 'Member') {
            return {
                id: thread.profileId || pid || id,
                name: thread.name,
                img: thread.img || thread.peerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
                email: thread.peerEmail || strEmail || ''
            };
        }
    }

    // 4. Fallback: Lookup in INCOMING_REQUESTS and OUTGOING_REQUESTS
    const allReqs = [
        ...(typeof INCOMING_REQUESTS !== 'undefined' && Array.isArray(INCOMING_REQUESTS) ? INCOMING_REQUESTS : []),
        ...(typeof OUTGOING_REQUESTS !== 'undefined' && Array.isArray(OUTGOING_REQUESTS) ? OUTGOING_REQUESTS : [])
    ];
    const matchedReq = allReqs.find(r => r && (
        (id && (Number(r.profileId) === pid || Number(r.senderId) === pid || Number(r.receiverId) === pid || String(r.profileId) === strId)) ||
        (strEmail && ((r.senderEmail && r.senderEmail.trim().toLowerCase() === strEmail) || (r.receiverEmail && r.receiverEmail.trim().toLowerCase() === strEmail)))
    ));
    if (matchedReq) {
        const isSender = (id && (Number(matchedReq.senderId) === pid || String(matchedReq.senderId) === strId)) || 
                         (strEmail && matchedReq.senderEmail && matchedReq.senderEmail.trim().toLowerCase() === strEmail);
        const reqEmail = (isSender ? matchedReq.senderEmail : matchedReq.receiverEmail) || strEmail || '';
        if (typeof isUserPurged === 'function' && (isUserPurged(reqEmail) || isUserPurged(pid))) return null;
        if (reqEmail && !reqEmail.includes('•')) {
            let p = profilesList.find(x => x && x.email && x.email.trim().toLowerCase() === reqEmail.trim().toLowerCase());
            if (p) {
                if (p.accountStatus === 'deleted' || p.account_status === 'deleted' || p.name === '[Deleted Account]') return null;
                if (typeof isUserPurged === 'function' && isUserPurged(p)) return null;
                return p;
            }
        }
        const name = (isSender ? matchedReq.senderName : matchedReq.receiverName) || 'Community Member';
        const img = (isSender ? matchedReq.senderPhoto : matchedReq.receiverPhoto) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
        return {
            id: (isSender ? matchedReq.senderId : matchedReq.receiverId) || pid || id,
            name: name,
            img: img,
            email: reqEmail,
            age: (isSender ? matchedReq.senderAge : matchedReq.receiverAge) || 24,
            city: (isSender ? matchedReq.senderCity : matchedReq.receiverCity) || 'Gujarat',
            community: (isSender ? matchedReq.senderCaste : matchedReq.receiverCaste) || 'Community Member'
        };
    }

    // 5. Fallback: Match from getStoredAccounts (LocalStorage)
    if (typeof getStoredAccounts === 'function') {
        try {
            const accs = getStoredAccounts();
            if (Array.isArray(accs) && accs.length > 0) {
                const acc = accs.find(a => a && (
                    (id && (String(a.id) === strId || (!isNaN(pid) && pid > 0 && Number(a.id) === pid))) ||
                    (strEmail && a.email && a.email.trim().toLowerCase() === strEmail)
                ));
                if (acc && acc.name && acc.name !== 'Community Member' && acc.name !== 'Community Match' && acc.name !== 'Member') {
                    return {
                        id: acc.id || pid || id,
                        name: acc.name,
                        img: acc.photo || acc.img || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
                        email: acc.email || strEmail || ''
                    };
                }
            }
        } catch (_) {}
    }

    return null;
}

/* ============================================================ INTEREST REQUESTS ============================================================ */
function interestStatusFor(profileId) {
    if (!profileId) return null;
    const pid = Number(profileId);
    const p = (typeof findProfile === 'function') ? findProfile(profileId) : null;
    const pEmail = (p && p.email && !p.email.includes('•')) ? p.email.trim().toLowerCase() : '';

    // 1. Check outgoing requests sent by me
    const out = OUTGOING_REQUESTS.find(r => 
        (!isNaN(pid) && pid > 0 && (Number(r.profileId) === pid || Number(r.receiverId) === pid)) ||
        (pEmail && r.receiverEmail && r.receiverEmail.trim().toLowerCase() === pEmail)
    );
    if (out) return out.status;

    // 2. Check incoming requests received by me
    const inc = INCOMING_REQUESTS.find(r => 
        (!isNaN(pid) && pid > 0 && (Number(r.profileId) === pid || Number(r.senderId) === pid)) ||
        (pEmail && r.senderEmail && r.senderEmail.trim().toLowerCase() === pEmail)
    );
    if (inc) return inc.status;

    // 3. Check unlocked threads
    const thread = CHAT_THREADS.find(t => 
        (!isNaN(pid) && pid > 0 && Number(t.profileId) === pid) ||
        (pEmail && t.peerEmail && t.peerEmail.trim().toLowerCase() === pEmail)
    );
    if (thread && thread.messages && thread.messages.length > 0) return 'accepted';

    return null;
}

/* ============================================================ DAILY INTEREST LIMIT (5 / DAY) ============================================================ */
const DAILY_INTEREST_LIMIT = 5;

/**
 * Get daily interest usage for the current user (female or male)
 * Enforces a maximum limit of 5 requests per 24 hours
 */
function getDailyInterestUsage() {
    const curUser = (typeof state !== 'undefined' && state.currentUser) ? state.currentUser : null;
    if (!curUser) return { count: 0, remaining: DAILY_INTEREST_LIMIT, isLimitReached: false, resetInHours: 0, resetInMinutes: 0, timestamps: [] };

    const normId = String(curUser.id || curUser.userId || '');
    const normEmail = (curUser.email || '').toLowerCase().trim();
    const userKey = 'LS_DAILY_INTERESTS_' + (normId || normEmail || 'guest');

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    let localTimestamps = [];
    try {
        const raw = localStorage.getItem(userKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                localTimestamps = parsed.filter(t => typeof t === 'number' && !isNaN(t));
            }
        }
    } catch (_) {
        localTimestamps = [];
    }

    // Merge with any timestamps stored in OUTGOING_REQUESTS
    const memTimestamps = (typeof OUTGOING_REQUESTS !== 'undefined' && Array.isArray(OUTGOING_REQUESTS))
        ? OUTGOING_REQUESTS
            .map(r => r.timestamp || (r.createdAt ? new Date(r.createdAt).getTime() : 0))
            .filter(t => t > 0 && typeof t === 'number' && !isNaN(t))
        : [];

    const all = [...localTimestamps, ...memTimestamps];
    const valid = all.filter(t => (now - t) < TWENTY_FOUR_HOURS);
    valid.sort((a, b) => a - b);

    // Deduplicate timestamps that were logged within 5 seconds of each other
    const deduped = [];
    for (const t of valid) {
        if (!deduped.some(existing => Math.abs(existing - t) < 5000)) {
            deduped.push(t);
        }
    }

    try {
        localStorage.setItem(userKey, JSON.stringify(deduped));
    } catch (_) {}

    const count = deduped.length;
    const remaining = Math.max(0, DAILY_INTEREST_LIMIT - count);
    const isLimitReached = count >= DAILY_INTEREST_LIMIT;

    let resetInHours = 0;
    let resetInMinutes = 0;
    if (deduped.length > 0) {
        const oldest = deduped[0];
        const diffMs = Math.max(0, (oldest + TWENTY_FOUR_HOURS) - now);
        resetInHours = Math.ceil(diffMs / (60 * 60 * 1000));
        resetInMinutes = Math.ceil(diffMs / (60 * 1000));
    }

    return {
        count,
        remaining,
        isLimitReached,
        resetInHours,
        resetInMinutes,
        timestamps: deduped
    };
}
window.getDailyInterestUsage = getDailyInterestUsage;

function recordDailyInterestSent(timestamp = Date.now()) {
    const curUser = (typeof state !== 'undefined' && state.currentUser) ? state.currentUser : null;
    if (!curUser) return;
    const normId = String(curUser.id || curUser.userId || '');
    const normEmail = (curUser.email || '').toLowerCase().trim();
    const userKey = 'LS_DAILY_INTERESTS_' + (normId || normEmail || 'guest');

    const usage = getDailyInterestUsage();
    usage.timestamps.push(timestamp);
    try {
        localStorage.setItem(userKey, JSON.stringify(usage.timestamps));
    } catch (_) {}
}
window.recordDailyInterestSent = recordDailyInterestSent;

function openInterestModal(id) {
    const p = findProfile(id);
    if (!p) return;

    // Strict Anti-Spam: Daily Limit of 5 Requests (for both girls and boys)
    const usage = getDailyInterestUsage();
    if (usage.isLimitReached) {
        showToast('Daily limit reached! Your daily credit of 5 interest requests is finished for today. You can send 5 more interest requests after 24 hours (tomorrow).');
        return;
    }

    state.activeInterestId = id;
    const txtEl = document.getElementById('interestText');
    if (txtEl) {
        txtEl.innerHTML =
            `You're about to send an interest request to <b>${escapeHtml(p.name || 'this member')}</b>. They will receive an instant email notification on their registered email with your profile details. If they accept, safe text chat and family contact details will unlock immediately.<br><br>` +
            `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(123,44,191,0.08);color:var(--primary,#7B2CBF);border:1px solid rgba(123,44,191,0.2);border-radius:20px;font-size:12px;font-weight:700;">` +
            `<i class="fa-solid fa-clock-rotate-left"></i> Daily Limit: ${usage.remaining} of 5 interest requests left today</div>`;
    }
    openModal('modalInterest');
}

async function confirmSendInterest() {
    const id = state.activeInterestId;
    const p = findProfile(id);
    if (!p) {
        closeModal('modalInterest');
        return;
    }
    const currentUsr = state.currentUser;
    if (!currentUsr || !currentUsr.email) {
        closeModal('modalInterest');
        showToast('Please log in or register to send an interest');
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) {
        closeModal('modalInterest');
        if (typeof openModal === 'function') openModal('modalCompleteProfile');
        return;
    }

    // Strict Anti-Spam: Check 5 daily interest requests limit
    const usage = getDailyInterestUsage();
    if (usage.isLimitReached) {
        closeModal('modalInterest');
        showToast('Daily limit reached! Your daily credit of 5 interest requests is finished for today. You can send 5 more interest requests after 24 hours (tomorrow).');
        return;
    }

    const pid = Number(id);
    const nowTs = Date.now();

    const cleanEmailCheck = (em) => {
        if (!em || typeof em !== 'string') return '';
        const c = em.trim().toLowerCase();
        if (c.includes('•') || c.includes('Ã') || c.includes('â') || c.includes('*') || c.includes('..')) return '';
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(c) ? c : '';
    };

    const realReceiverEmail = cleanEmailCheck(p.rawEmail) || cleanEmailCheck(p.email) || '';

    const existing = OUTGOING_REQUESTS.find(r => Number(r.profileId) === pid);
    if (existing) {
        existing.status = 'pending';
        existing.date = 'Just now';
        existing.timestamp = nowTs;
        if (realReceiverEmail && (!existing.receiverEmail || !cleanEmailCheck(existing.receiverEmail))) {
            existing.receiverEmail = realReceiverEmail;
        }
    } else {
        OUTGOING_REQUESTS.push({
            id: `int_${currentUsr.id}_${pid}`,
            profileId: pid,
            receiverEmail: realReceiverEmail,
            receiverName: p.name || 'Member',
            status: 'pending',
            date: 'Just now',
            timestamp: nowTs
        });
    }

    // Record the sent request to update daily count
    recordDailyInterestSent(nowTs);
    const remainingCount = Math.max(0, DAILY_INTEREST_LIMIT - (usage.count + 1));

    closeModal('modalInterest');
    showToast(`Interest request sent to ${p.name}! (${remainingCount} of 5 daily requests remaining) 💍`);
    refreshProfileButtons();
    updateInboxBadge();
    saveSessionState();

    // Persist to Supabase PostgreSQL & Send Notification Email with real sender photo
    const sendInterestFn = (typeof supabaseSendInterest === 'function')
        ? supabaseSendInterest
        : ((typeof window !== 'undefined' && typeof window.supabaseSendInterest === 'function') ? window.supabaseSendInterest : null);

    if (sendInterestFn) {
        try {
            const senderObj = resolveFullUserProfile(currentUsr);
            const receiverObj = {
                ...(p || {}),
                id: pid,
                name: p.name || 'Member',
                email: realReceiverEmail,
                rawEmail: realReceiverEmail || cleanEmailCheck(p.rawEmail)
            };
            await sendInterestFn(senderObj, receiverObj);
            console.info('[Interest] Successfully persisted to Supabase for:', p.name);
        } catch (err) {
            if (err && err.message === 'DAILY_LIMIT_EXCEEDED') {
                showToast('Daily limit reached! Your daily credit of 5 interest requests is finished for today. You can send 5 more interest requests after 24 hours (tomorrow).');
            } else {
                console.warn('[Interest] Supabase note:', err);
            }
        }
    }
}

/**
 * Helper to ensure real uploaded photo is always linked to user session
 */
function resolveFullUserProfile(userObj) {
    if (!userObj) return {};
    const normEmail = (userObj.email || userObj.rawEmail || '').toLowerCase().trim();
    const cleanEmail = (normEmail && !normEmail.includes('•')) ? normEmail : '';
    const normId = String(userObj.id || userObj.userId || '');
    
    let found = (window.PROFILES || []).find(p => 
        (normId && String(p.id) === normId) ||
        (cleanEmail && ((p.rawEmail && p.rawEmail.toLowerCase().trim() === cleanEmail) || (p.email && p.email.toLowerCase().trim() === cleanEmail)))
    );
    if (!found) {
        try {
            const raw = localStorage.getItem('LS_COMMUNITY_PROFILES');
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    found = list.find(p => 
                        (normId && String(p.id) === normId) ||
                        (cleanEmail && ((p.rawEmail && p.rawEmail.toLowerCase().trim() === cleanEmail) || (p.email && p.email.toLowerCase().trim() === cleanEmail)))
                    );
                }
            }
        } catch(e) {}
    }

    const resolvedPhoto = (found && (found.img || (Array.isArray(found.photos) ? found.photos[0] : ''))) ||
                          userObj.img || userObj.photo || (Array.isArray(userObj.photos) ? userObj.photos[0] : '') ||
                          (typeof state !== 'undefined' && state.regData && (state.regData.photo || (Array.isArray(state.regData.photos) ? state.regData.photos[0] : ''))) || '';

    const finalEmail = cleanEmail || (found && found.rawEmail && !found.rawEmail.includes('•') ? found.rawEmail : '') || (userObj.email && !userObj.email.includes('•') ? userObj.email : '') || '';

    return {
        ...(found || {}),
        ...userObj,
        email: finalEmail || userObj.email || '',
        rawEmail: finalEmail || userObj.rawEmail || '',
        photo: resolvedPhoto,
        img: resolvedPhoto,
        photos: (found && found.photos) || userObj.photos || (resolvedPhoto ? [resolvedPhoto] : [])
    };
}

function refreshProfileButtons() {
    const btn = document.getElementById('fullInterestBtn');
    if (btn) {
        const pid = parseInt(btn.dataset.pid);
        setInterestBtnState(btn, pid);
        if (typeof window.refreshProfileContactState === 'function') {
            window.refreshProfileContactState(pid);
        }
    }
}

function setInterestBtnState(btn, pid) {
    const status = interestStatusFor(pid);
    if (status === 'accepted') {
        btn.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Message (Text Only)';
        btn.className = 'btn btn-primary';
        btn.onclick = () => openChatFor(pid);
        btn.disabled = false;
    } else if (status === 'pending') {
        btn.innerHTML = '<i class="fa-solid fa-clock"></i> Request sent';
        btn.className = 'btn btn-outline';
        btn.onclick = null;
        btn.disabled = true;
    } else if (status === 'declined') {
        btn.innerHTML = '<i class="fa-solid fa-ban"></i> Request declined';
        btn.className = 'btn btn-outline';
        btn.onclick = null;
        btn.disabled = true;
    } else {
        btn.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> I\'m interested';
        btn.className = 'btn btn-gold';
        btn.onclick = () => openInterestModal(pid);
        btn.disabled = false;
    }
}

/* ============================================================ INBOX & CHAT ============================================================ */
function setInboxTab(t) {
    state.inboxTab = t;
    const rT = document.getElementById('inboxTabRequests'), cT = document.getElementById('inboxTabChats');
    if (rT && cT) { rT.classList.toggle('active', t === 'requests'); cT.classList.toggle('active', t === 'chats'); }
    renderInbox();
}

/**
 * Compute total unread count for badges (pending incoming requests + unread chat messages)
 */
function getInboxBadgeCount() {
    const pendingRequests = (INCOMING_REQUESTS || []).filter(r => r && r.status === 'pending').length;
    let unreadMessages = 0;
    (CHAT_THREADS || []).forEach(t => {
        if (t && Array.isArray(t.messages)) {
            unreadMessages += t.messages.filter(m => m && m.from === 'them' && !m.isRead && !m.is_read).length;
        }
    });
    return pendingRequests + unreadMessages;
}

/**
 * Update all unread badges across the entire application:
 * - Home header button (#inboxDotHome)
 * - Desktop sidebar (#dsInboxBadge)
 * - Bottom tabbar (.tab-badge)
 * - Inbox segmented toggle buttons (#inboxReqBadge & #inboxChatBadge)
 */
function updateInboxBadge() {
    const pendingCount = (INCOMING_REQUESTS || []).filter(r => r && r.status === 'pending').length;
    const myId = Number(state.currentUser ? state.currentUser.id : 0);
    const myProfId = Number(state.currentUser && state.currentUser.profileId ? state.currentUser.profileId : 0);
    const myEmail = (state.currentUser && state.currentUser.email ? state.currentUser.email : '').trim().toLowerCase();

    let unreadMsgsCount = 0;
    (CHAT_THREADS || []).forEach(t => {
        if (t && Array.isArray(t.messages)) {
            // Exclude self-thread
            if (typeof isSelfProfile === 'function' && isSelfProfile(t.profileId)) return;
            unreadMsgsCount += t.messages.filter(m => {
                if (!m || m.isDeleted) return false;
                if (m.isRead || m.is_read) return false;
                const sId = Number(m.senderId || m.sender_id || 0);
                const sEmail = (m.senderEmail || m.sender_email || '').trim().toLowerCase();
                // Never count messages sent by current user
                if (sId && (sId === myId || sId === myProfId)) return false;
                if (myEmail && sEmail && sEmail === myEmail) return false;
                return m.from === 'them' || (m.from !== 'me' && sId !== myId);
            }).length;
        }
    });
    const totalCount = pendingCount + unreadMsgsCount;

    // 1. Home header badge
    const homeBadge = document.getElementById('inboxDotHome');
    if (homeBadge) {
        if (totalCount > 0) {
            homeBadge.textContent = totalCount > 99 ? '99+' : totalCount;
            homeBadge.style.display = 'block';
        } else {
            homeBadge.style.display = 'none';
        }
    }

    // 2. Desktop sidebar badge
    const dsBadge = document.getElementById('dsInboxBadge');
    if (dsBadge) {
        if (totalCount > 0) {
            dsBadge.textContent = totalCount > 99 ? '99+' : totalCount;
            dsBadge.style.display = 'block';
        } else {
            dsBadge.style.display = 'none';
        }
    }

    // 3. Tabbar badges
    document.querySelectorAll('.tabbar button[onclick*="scr-inbox"]').forEach(btn => {
        let badge = btn.querySelector('.tab-badge');
        if (totalCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'tab-badge';
                btn.appendChild(badge);
            }
            badge.textContent = totalCount > 99 ? '99+' : totalCount;
        } else if (badge) {
            badge.remove();
        }
    });

    // 4. Inbox screen segment toggle badges
    const reqBadge = document.getElementById('inboxReqBadge');
    if (reqBadge) {
        if (pendingCount > 0) {
            reqBadge.textContent = pendingCount;
            reqBadge.style.display = 'inline-flex';
        } else {
            reqBadge.style.display = 'none';
        }
    }
    const chatBadge = document.getElementById('inboxChatBadge');
    if (chatBadge) {
        if (unreadMsgsCount > 0) {
            chatBadge.textContent = unreadMsgsCount;
            chatBadge.style.display = 'inline-flex';
        } else {
            chatBadge.style.display = 'none';
        }
    }
}

/**
 * Unified Chat & Interests Synchronization with Supabase Database
 * Fetches all persistent chat messages and match inquiries
 * Guaranteed to restore messages even after 5 days, page reloads, or logging into a new device!
 */
async function syncUserChatAndInterests() {
    if (!state.currentUser || !state.currentUser.email) return;
    try {
        const myId = Number(state.currentUser.id || 0);
        const myEmail = state.currentUser.email.trim().toLowerCase();

        const myProfId = (state.currentUser && state.currentUser.profileId) ? Number(state.currentUser.profileId) : 0;

        // Canonical peer ID resolver by email and profile lookup
        function getCanonicalPeerId(rawPid, rawEmail) {
            if (rawEmail) {
                const norm = rawEmail.trim().toLowerCase();
                const matched = (window.PROFILES || []).find(prof => prof && prof.email && prof.email.trim().toLowerCase() === norm);
                if (matched && matched.id) return Number(matched.id);
            }
            if (rawPid && typeof findProfile === 'function') {
                const fp = findProfile(rawPid, rawEmail);
                if (fp && fp.id) return Number(fp.id);
            }
            return Number(rawPid);
        }

        // 1. Fetch Interests from Supabase
        let interestsRes = { incoming: [], outgoing: [] };
        if (typeof supabaseFetchUserInterests === 'function') {
            interestsRes = await supabaseFetchUserInterests(myEmail, myId);
            if (interestsRes) {
                if (Array.isArray(interestsRes.incoming)) {
                    INCOMING_REQUESTS.length = 0;
                    const seenIn = new Set();
                    interestsRes.incoming.forEach(r => {
                        if (!r) return;
                        const pid = getCanonicalPeerId(r.profileId || r.senderId, r.senderEmail);
                        const pEmail = (r.senderEmail || '').trim().toLowerCase();
                        if (pid === myId || (myProfId && pid === myProfId)) return;
                        if (myEmail && pEmail && pEmail === myEmail) return;
                        if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) return;
                        if (typeof isUserPurged === 'function' && (isUserPurged(pid) || isUserPurged(pEmail))) return;
                        const key = pEmail || pid;
                        if (!seenIn.has(key)) {
                            seenIn.add(key);
                            r.profileId = pid;
                            INCOMING_REQUESTS.push(r);
                        }
                    });
                }
                if (Array.isArray(interestsRes.outgoing)) {
                    OUTGOING_REQUESTS.length = 0;
                    const seenOut = new Set();
                    interestsRes.outgoing.forEach(r => {
                        if (!r) return;
                        const pid = getCanonicalPeerId(r.profileId || r.receiverId, r.receiverEmail);
                        const pEmail = (r.receiverEmail || '').trim().toLowerCase();
                        if (pid === myId || (myProfId && pid === myProfId)) return;
                        if (myEmail && pEmail && pEmail === myEmail) return;
                        if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) return;
                        if (typeof isUserPurged === 'function' && (isUserPurged(pid) || isUserPurged(pEmail))) return;
                        const key = pEmail || pid;
                        if (!seenOut.has(key)) {
                            seenOut.add(key);
                            r.profileId = pid;
                            OUTGOING_REQUESTS.push(r);
                        }
                    });
                }
            }
        }

        // 2. Fetch All Messages from Supabase
        let allDbMessages = [];
        if (typeof supabaseFetchAllUserMessages === 'function') {
            allDbMessages = await supabaseFetchAllUserMessages(myId, myEmail);
        }

        const localSeenIds = getLocalSeenMsgIds(myId);
        const pendingCloudSyncIds = [];

        // Group messages by peerId
        const messagesByPeer = new Map();
        (allDbMessages || []).forEach(m => {
            const senderNum = Number(m.senderId);
            const isMe = senderNum === myId || (myProfId && senderNum === myProfId) || (myEmail && m.senderEmail && m.senderEmail.toLowerCase() === myEmail);
            const rawPeerId = isMe ? Number(m.receiverId) : Number(m.senderId);
            const rawPeerEmail = isMe ? (m.receiverEmail || '') : (m.senderEmail || '');
            const peerId = getCanonicalPeerId(rawPeerId, rawPeerEmail);
            if (!peerId) return;
            // Strictly exclude self-messages
            if (peerId === myId || (myProfId && peerId === myProfId)) return;
            if (typeof isSelfProfile === 'function' && isSelfProfile(peerId)) return;

            // Strictly exclude messages that are marked deleted or cleared for this user
            if (typeof isUserInDeletedList === 'function' && isUserInDeletedList(m.deletedForUsers || m.deleted_for_users, myId, myEmail, myProfId)) return;
            if (typeof isChatClearedForUser === 'function' && isChatClearedForUser(myId, peerId, myEmail, rawPeerEmail, m.createdAt)) return;

            const isSeenLocally = m.id && localSeenIds.has(String(m.id));
            const finalIsRead = isMe || !!m.isRead || !!m.is_read || isSeenLocally;

            if (!isMe && isSeenLocally && (!m.isRead && !m.is_read) && m.id) {
                pendingCloudSyncIds.push(String(m.id));
            }

            if (!messagesByPeer.has(peerId)) {
                messagesByPeer.set(peerId, []);
            }
            messagesByPeer.get(peerId).push({
                id: m.id,
                from: isMe ? 'me' : 'them',
                senderId: Number(m.senderId) || m.senderId,
                receiverId: Number(m.receiverId) || m.receiverId,
                senderEmail: m.senderEmail,
                receiverEmail: m.receiverEmail,
                text: m.text,
                time: m.time,
                edited: !!m.edited,
                isDeleted: !!m.isDeleted,
                deletedForUsers: Array.isArray(m.deletedForUsers) ? m.deletedForUsers : [],
                isRead: finalIsRead,
                is_read: finalIsRead,
                createdAt: m.createdAt
            });
        });

        if (pendingCloudSyncIds.length > 0 && typeof supabaseMarkMessagesAsRead === 'function') {
            supabaseMarkMessagesAsRead(myId, 0, myEmail, '', pendingCloudSyncIds).catch(() => {});
        }

        // 3. Reconstruct CHAT_THREADS
        const updatedThreads = [];
        const processedPeers = new Set();
        const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';

        // A. Add threads for accepted matches from interests
        [...INCOMING_REQUESTS, ...OUTGOING_REQUESTS].forEach(r => {
            if (r.status === 'accepted') {
                const pid = Number(r.profileId);
                if (pid === myId || (myProfId && pid === myProfId)) return;
                if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) return;
                if (!processedPeers.has(pid)) {
                    processedPeers.add(pid);
                    const msgs = messagesByPeer.get(pid) || [];
                    const pEmail = (r.senderEmail === myEmail ? r.receiverEmail : r.senderEmail) || '';
                    const peerProf = findProfile(pid, pEmail);
                    const peerName = (peerProf && peerProf.name && peerProf.name !== 'Community Match' && peerProf.name !== 'Community Member')
                        ? peerProf.name
                        : ((r.senderName === state.currentUser.name ? r.receiverName : r.senderName) || 'Member');
                    const peerImg = (peerProf && peerProf.img && !peerProf.img.includes('default_avatar'))
                        ? peerProf.img
                        : ((r.senderPhoto === (state.currentUser.photo || state.currentUser.img) ? r.receiverPhoto : r.senderPhoto) || fallbackAvatar);

                    updatedThreads.push({
                        profileId: pid,
                        peerEmail: pEmail,
                        name: peerName,
                        img: peerImg,
                        messages: msgs
                    });
                }
            }
        });

        // B. Also include any peer who has exchanged messages
        messagesByPeer.forEach((msgs, pid) => {
            if (pid === myId || (myProfId && pid === myProfId)) return;
            if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) return;
            if (!processedPeers.has(pid)) {
                processedPeers.add(pid);
                const firstMsg = (msgs && msgs.length > 0) ? msgs[0] : null;
                const peerEmail = firstMsg
                    ? ((Number(firstMsg.senderId) === myId || (firstMsg.senderEmail || '').toLowerCase() === myEmail)
                        ? (firstMsg.receiverEmail || '')
                        : (firstMsg.senderEmail || ''))
                    : '';
                let peerProf = findProfile(pid, peerEmail);
                let peerName = (peerProf && peerProf.name && peerProf.name !== 'Community Match' && peerProf.name !== 'Community Member')
                    ? peerProf.name
                    : '';
                let peerImg = (peerProf && peerProf.img && !peerProf.img.includes('default_avatar'))
                    ? peerProf.img
                    : '';

                if (!peerName) {
                    const allReqs = [...INCOMING_REQUESTS, ...OUTGOING_REQUESTS];
                    const matchedReq = allReqs.find(r => r && (
                        Number(r.profileId) === pid || 
                        Number(r.senderId) === pid || 
                        Number(r.receiverId) === pid ||
                        (peerEmail && ((r.senderEmail && r.senderEmail.toLowerCase() === peerEmail.toLowerCase()) || (r.receiverEmail && r.receiverEmail.toLowerCase() === peerEmail.toLowerCase())))
                    ));
                    if (matchedReq) {
                        const isSender = (Number(matchedReq.senderId) === pid) || (peerEmail && matchedReq.senderEmail && matchedReq.senderEmail.toLowerCase() === peerEmail.toLowerCase());
                        peerName = (isSender ? matchedReq.senderName : matchedReq.receiverName) || '';
                        peerImg = peerImg || (isSender ? matchedReq.senderPhoto : matchedReq.receiverPhoto) || '';
                    }
                }
                if (!peerName && peerEmail) {
                    const parts = peerEmail.split('@')[0].split(/[._-]/).filter(Boolean);
                    peerName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                }
                if (!peerName || peerName === 'Community Match') peerName = 'Member';
                if (!peerImg) peerImg = fallbackAvatar;

                updatedThreads.push({
                    profileId: pid,
                    peerEmail: peerEmail,
                    name: peerName,
                    img: peerImg,
                    messages: msgs
                });
            }
        });

        // C. Sort threads: threads with newest message at the top
        updatedThreads.sort((a, b) => {
            const aLast = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1] : null;
            const bLast = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1] : null;
            const aTime = aLast && aLast.createdAt ? new Date(aLast.createdAt).getTime() : 0;
            const bTime = bLast && bLast.createdAt ? new Date(bLast.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        CHAT_THREADS.length = 0;
        updatedThreads.forEach(t => CHAT_THREADS.push(t));

        saveSessionState();
        updateInboxBadge();
        refreshProfileButtons();

        // Refresh currently active screen
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            if (activeScreen.id === 'scr-inbox') {
                renderInbox();
            } else if (activeScreen.id === 'scr-chat' && state.activeChatId) {
                renderChatMessages();
            }
        }
    } catch (e) {
        console.warn('[Chat] syncUserChatAndInterests error:', e);
    }
}

function setInboxTab(t) {
    state.inboxTab = t;
    const rT = document.getElementById('inboxTabRequests'), cT = document.getElementById('inboxTabChats');
    if (rT && cT) { rT.classList.toggle('active', t === 'requests'); cT.classList.toggle('active', t === 'chats'); }
    try {
        renderInbox();
    } catch (e) {
        console.warn('[Inbox] setInboxTab render error:', e);
    }
}

// Backward compatibility alias
const syncUserInterests = syncUserChatAndInterests;

function renderInbox() {
    try {
        if (typeof buildTabbar === 'function') buildTabbar('tabbarInbox', 'inbox');
        const wrap = document.getElementById('inboxContent');
        if (!wrap) return;
        wrap.innerHTML = '';
        if (state.inboxTab === 'requests') {
            const received = (INCOMING_REQUESTS || []).filter(Boolean);
            const sent = (OUTGOING_REQUESTS || []).filter(Boolean);
            if (received.length === 0 && sent.length === 0) {
                wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-heart-circle-check"></i><h3>No requests yet</h3><p>Interest requests you send or receive will show up here permanently.</p></div>`;
                return;
            }
            if (received.length) {
                const label = document.createElement('div');
                label.className = 'p-muted';
                label.style.cssText = 'font-weight:800;font-size:11.5px;letter-spacing:.02em;color:var(--primary-dark);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;';
                label.innerHTML = `<span>RECEIVED (${received.length})</span><span style="font-size:10.5px;color:var(--muted);font-weight:500;">Direct from community members</span>`;
                wrap.appendChild(label);
                received.forEach(r => {
                    const card = requestCard(r, 'received');
                    if (card) wrap.appendChild(card);
                });
            }
            if (sent.length) {
                const label = document.createElement('div');
                label.className = 'p-muted';
                label.style.cssText = 'font-weight:800;font-size:11.5px;letter-spacing:.02em;color:var(--primary-dark);margin:18px 0 10px;display:flex;align-items:center;justify-content:space-between;';
                label.innerHTML = `<span>SENT (${sent.length})</span><span style="font-size:10.5px;color:var(--muted);font-weight:500;">Requests you dispatched</span>`;
                wrap.appendChild(label);
                sent.forEach(r => {
                    const card = requestCard(r, 'sent');
                    if (card) wrap.appendChild(card);
                });
            }
        } else {
            // Strict Gatekeeper: Only show chats that have been ACCEPTED and exclude self-chat
            const activeAcceptedChats = (CHAT_THREADS || []).filter(t => {
                if (!t) return false;
                if (typeof isSelfProfile === 'function' && isSelfProfile(t.profileId)) return false;
                return interestStatusFor(t.profileId) === 'accepted';
            });
            if (activeAcceptedChats.length === 0) {
                wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-comments"></i><h3>No unlocked chats yet</h3><p>Once another member accepts your interest request, safe text messaging unlocks here immediately.</p></div>`;
                return;
            }
            // Sort chats so the conversation with the newest message is always at the top
            activeAcceptedChats.sort((a, b) => {
                const aLast = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1] : null;
                const bLast = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1] : null;
                const aTime = aLast && aLast.createdAt ? new Date(aLast.createdAt).getTime() : 0;
                const bTime = bLast && bLast.createdAt ? new Date(bLast.createdAt).getTime() : 0;
                return bTime - aTime;
            });
            activeAcceptedChats.forEach(t => {
                const card = chatThreadCard(t);
                if (card) wrap.appendChild(card);
            });
        }
    } catch (err) {
        console.error('[Inbox] Error rendering inbox:', err);
    }
}

function requestCard(r, kind) {
    if (!r) return null;
    const pid = Number(r.profileId || (kind === 'received' ? r.senderId : r.receiverId));
    const reqEmail = (kind === 'received' ? r.senderEmail : r.receiverEmail) || '';
    const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    const p = (pid ? findProfile(pid, reqEmail) : null) || {
        id: pid || 0,
        name: (kind === 'received' ? r.senderName : r.receiverName) || 'Member',
        img: (kind === 'received' ? r.senderPhoto : r.receiverPhoto) || fallbackAvatar,
        age: (kind === 'received' ? r.senderAge : r.receiverAge) || 24,
        city: (kind === 'received' ? r.senderCity : r.receiverCity) || 'Gujarat',
        community: (kind === 'received' ? r.senderCaste : r.receiverCaste) || 'Community Member'
    };
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:10px;cursor:pointer;';

    let actionContent = '';
    if (kind === 'received') {
        if (r.status === 'accepted') {
            actionContent = `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openChatFor(${pid})" style="padding:6px 12px;font-size:11.5px;flex-shrink:0;"><i class="fa-solid fa-comment-dots"></i> Chat</button>`;
        } else if (r.status === 'declined') {
            actionContent = `<span style="font-size:11px;font-weight:700;color:var(--error);flex-shrink:0;"><i class="fa-solid fa-xmark"></i> Declined</span>`;
        } else {
            actionContent = `
                <div style="display:flex;gap:6px;flex-shrink:0;">
                   <button class="icon-btn" style="color:var(--error);" title="Decline request" onclick="event.stopPropagation();declineRequest(${pid})"><i class="fa-solid fa-xmark"></i></button>
                   <button class="icon-btn" style="background:var(--grad-primary);color:#fff;" title="Accept request" onclick="event.stopPropagation();acceptRequest(${pid})"><i class="fa-solid fa-check"></i></button>
                </div>`;
        }
    } else {
        if (r.status === 'accepted') {
            actionContent = `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openChatFor(${pid})" style="padding:6px 12px;font-size:11.5px;flex-shrink:0;"><i class="fa-solid fa-comment-dots"></i> Chat</button>`;
        } else if (r.status === 'declined') {
            actionContent = `<span style="font-size:11px;font-weight:700;color:var(--error);flex-shrink:0;"><i class="fa-solid fa-xmark"></i> Declined</span>`;
        } else {
            actionContent = `<span class="p-muted" style="font-size:11px;font-weight:800;color:var(--pending);flex-shrink:0;"><i class="fa-solid fa-clock"></i> Pending</span>`;
        }
    }

    const cardName = (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member')
        ? p.name
        : ((kind === 'received' ? r.senderName : r.receiverName) || 'Member');
    const cardImg = (p && p.img && !p.img.includes('default_avatar'))
        ? p.img
        : ((kind === 'received' ? r.senderPhoto : r.receiverPhoto) || fallbackAvatar);

    card.innerHTML = `
            <img src="${cardImg}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:52px;height:52px;border-radius:14px;object-fit:cover;flex-shrink:0;" alt="${escapeHtml(cardName)}">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:800;font-size:14px;">${escapeHtml(cardName)}${p.age ? ', ' + p.age : ''}</div>
              <div class="p-muted" style="font-size:11.5px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.village || p.city || 'Gujarat')} · ${escapeHtml(p.community || '')}</div>
              <div class="p-muted" style="font-size:10.5px;margin-top:2px;">${r.date || 'Recently'}</div>
            </div>
            ${actionContent}
            `;
    card.addEventListener('click', () => {
        if (p.id) openProfile(p.id);
    });
    return card;
}

function chatThreadCard(t) {
    if (!t) return null;
    const pid = Number(t.profileId);
    const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    let p = findProfile(pid, t.peerEmail);
    let resolvedName = (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member')
        ? p.name
        : ((t.name && t.name !== 'Community Match' && t.name !== 'Community Member' && t.name !== 'Member')
            ? t.name
            : '');
    let resolvedImg = (p && p.img && !p.img.includes('default_avatar'))
        ? p.img
        : ((t.img && !t.img.includes('default_avatar')) ? t.img : '');

    if (!resolvedName) {
        const allReqs = [...(INCOMING_REQUESTS || []), ...(OUTGOING_REQUESTS || [])];
        const matchReq = allReqs.find(r => r && (
            Number(r.profileId) === pid || 
            Number(r.senderId) === pid || 
            Number(r.receiverId) === pid || 
            (t.peerEmail && ((r.senderEmail && r.senderEmail.toLowerCase() === t.peerEmail.toLowerCase()) || (r.receiverEmail && r.receiverEmail.toLowerCase() === t.peerEmail.toLowerCase())))
        ));
        if (matchReq) {
            const isSender = (Number(matchReq.senderId) === pid) || (t.peerEmail && matchReq.senderEmail && matchReq.senderEmail.toLowerCase() === t.peerEmail.toLowerCase());
            resolvedName = (isSender ? matchReq.senderName : matchReq.receiverName) || '';
            resolvedImg = resolvedImg || (isSender ? matchReq.senderPhoto : matchReq.receiverPhoto) || '';
        }
    }
    if (!resolvedName && t.peerEmail) {
        const parts = t.peerEmail.split('@')[0].split(/[._-]/).filter(Boolean);
        resolvedName = parts.map(pt => pt.charAt(0).toUpperCase() + pt.slice(1)).join(' ');
    }
    if (!resolvedName || resolvedName === 'Community Match') resolvedName = 'Member';
    if (!resolvedImg) resolvedImg = fallbackAvatar;

    // Sync back into thread
    t.name = resolvedName;
    t.img = resolvedImg;

    const last = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
    const myId = Number(state.currentUser ? state.currentUser.id : 0);
    const myProfId = Number(state.currentUser && state.currentUser.profileId ? state.currentUser.profileId : 0);
    const myEmail = (state.currentUser && state.currentUser.email ? state.currentUser.email : '').trim().toLowerCase();

    const unreadCount = (t.messages || []).filter(m => {
        if (!m || m.isDeleted) return false;
        if (m.isRead || m.is_read) return false;
        const sId = Number(m.senderId || m.sender_id || 0);
        const sEmail = (m.senderEmail || m.sender_email || '').trim().toLowerCase();
        // Never count messages sent by current user
        if (sId && (sId === myId || sId === myProfId)) return false;
        if (myEmail && sEmail && sEmail === myEmail) return false;
        return m.from === 'them' || (m.from !== 'me' && sId !== myId);
    }).length;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:10px;cursor:pointer;position:relative;';

    let metaSnippet = 'Say hello 👋';
    if (last) {
        const prefix = last.from === 'me' ? 'You: ' : '';
        metaSnippet = prefix + escapeHtml(last.text || '');
    }

    let unreadBadgeHtml = '';
    if (unreadCount > 0) {
        unreadBadgeHtml = `<span class="chat-thread-unread-pill">${unreadCount > 99 ? '99+' : unreadCount}</span>`;
    }

    card.innerHTML = `
            <div style="position:relative;flex-shrink:0;">
                <img src="${resolvedImg}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:52px;height:52px;border-radius:14px;object-fit:cover;display:block;" alt="${escapeHtml(resolvedName)}">
                ${unreadCount > 0 ? '<span style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:linear-gradient(135deg,#e63946,#d90429);border:2px solid #fff;"></span>' : ''}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                <span style="font-weight:800;font-size:14px;color:var(--text);">${escapeHtml(resolvedName)}</span>
                <span class="p-muted" style="font-size:11px;font-weight:600;">${last && last.time ? last.time : ''}</span>
              </div>
              <div class="p-muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${unreadCount > 0 ? 'font-weight:700;color:var(--primary);' : ''}">
                ${metaSnippet}
              </div>
            </div>
            ${unreadBadgeHtml}
            <i class="fa-solid fa-chevron-right chev" style="color:var(--text-faint);font-size:12px;margin-left:4px;"></i>`;
    card.addEventListener('click', () => openChatFor(pid));
    return card;
}

async function acceptRequest(profileId) {
    const pid = Number(profileId);
    const r = INCOMING_REQUESTS.find(x => Number(x.profileId) === pid || Number(x.senderId) === pid);
    if (r) r.status = 'accepted';
    
    const p = findProfile(pid, r ? r.senderEmail : '');
    const peerName = (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member')
        ? p.name
        : ((r && r.senderName) || 'Member');
    const peerImg = (p && p.img && !p.img.includes('default_avatar'))
        ? p.img
        : ((r && r.senderPhoto) || '');

    // Resolve clean unmasked sender email (never masked with bullets)
    const realSenderEmail = (r && r.senderEmail && !r.senderEmail.includes('•'))
        ? r.senderEmail.trim().toLowerCase()
        : ((p && p.rawEmail && !p.rawEmail.includes('•'))
            ? p.rawEmail.trim().toLowerCase()
            : ((p && p.email && !p.email.includes('•')) ? p.email.trim().toLowerCase() : ''));

    const peerEmail = realSenderEmail || (p && p.email && !p.email.includes('•') ? p.email : '') || (r && r.senderEmail && !r.senderEmail.includes('•') ? r.senderEmail : '') || '';

    let thread = CHAT_THREADS.find(t => Number(t.profileId) === pid || (peerEmail && t.peerEmail && t.peerEmail.toLowerCase() === peerEmail.toLowerCase()));
    if (!thread) {
        thread = { profileId: pid, peerEmail, name: peerName, img: peerImg, messages: [] };
        CHAT_THREADS.push(thread);
    } else {
        if (!thread.name || thread.name === 'Community Match' || thread.name === 'Member') thread.name = peerName;
        if (!thread.img || thread.img.includes('default_avatar')) thread.img = peerImg;
        if (!thread.peerEmail && peerEmail) thread.peerEmail = peerEmail;
    }

    showToast(`Matched with ${peerName}! Safe text chat & family contact unlocked 🎉`);
    saveSessionState();
    renderInbox();
    updateInboxBadge();
    refreshProfileButtons();
    if (typeof window.refreshProfileContactState === 'function') {
        window.refreshProfileContactState(pid);
    }

    // Persist to Supabase and send congratulatory email to sender
    const updateStatusFn = (typeof supabaseUpdateInterestStatus === 'function')
        ? supabaseUpdateInterestStatus
        : ((typeof window !== 'undefined' && typeof window.supabaseUpdateInterestStatus === 'function') ? window.supabaseUpdateInterestStatus : null);

    if (updateStatusFn) {
        const interestId = (r && r.id) || `int_${pid}_${state.currentUser.id}`;
        try {
            const receiverObj = resolveFullUserProfile(state.currentUser);
            const senderObj = {
                ...(p || {}),
                id: pid,
                name: peerName,
                email: realSenderEmail,
                rawEmail: realSenderEmail,
                photo: peerImg,
                img: peerImg
            };
            await updateStatusFn(interestId, 'accepted', senderObj, receiverObj);
        } catch (e) {
            console.warn('[Interest] Update status error:', e);
        }
    }
}

async function declineRequest(profileId) {
    const pid = Number(profileId);
    const r = INCOMING_REQUESTS.find(x => Number(x.profileId) === pid || Number(x.senderId) === pid);
    if (r) r.status = 'declined';
    const p = findProfile(pid, r ? r.senderEmail : '');
    const peerName = (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member')
        ? p.name
        : ((r && r.senderName) || 'Member');
    const realSenderEmail = (r && r.senderEmail && !r.senderEmail.includes('•'))
        ? r.senderEmail.trim().toLowerCase()
        : ((p && p.rawEmail && !p.rawEmail.includes('•'))
            ? p.rawEmail.trim().toLowerCase()
            : ((p && p.email && !p.email.includes('•')) ? p.email.trim().toLowerCase() : ''));

    showToast('Request declined');
    saveSessionState();
    renderInbox();
    updateInboxBadge();
    refreshProfileButtons();

    // Persist to Supabase and send polite notification to sender
    const updateStatusFn = (typeof supabaseUpdateInterestStatus === 'function')
        ? supabaseUpdateInterestStatus
        : ((typeof window !== 'undefined' && typeof window.supabaseUpdateInterestStatus === 'function') ? window.supabaseUpdateInterestStatus : null);

    if (updateStatusFn) {
        const interestId = (r && r.id) || `int_${pid}_${state.currentUser.id}`;
        try {
            const receiverObj = resolveFullUserProfile(state.currentUser);
            const senderObj = {
                ...(p || {}),
                id: pid,
                name: peerName,
                email: realSenderEmail,
                rawEmail: realSenderEmail
            };
            await updateStatusFn(interestId, 'declined', senderObj, receiverObj);
        } catch (e) {
            console.warn('[Interest] Update status error:', e);
        }
    }
}

/* ============================================================ STRICT TEXT-ONLY CHAT (WHATSAPP ARCHITECTURE) ============================================================ */
function scrollChatToBottom(smooth = false) {
    const wrap = document.getElementById('chatMessagesWrap') || document.getElementById('chatMessages');
    if (wrap) {
        if (smooth) {
            wrap.scrollTo({ top: wrap.scrollHeight, behavior: 'smooth' });
        } else {
            wrap.scrollTop = wrap.scrollHeight;
        }
    }
    const list = document.getElementById('chatMessages');
    if (list && list !== wrap) {
        list.scrollTop = list.scrollHeight;
    }
}

let editingMessageId = null;
let pendingDeleteMsgId = null;

function openChatFor(profileId) {
    if (!state.currentUser || !state.currentUser.email) {
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) {
        if (typeof openModal === 'function') openModal('modalCompleteProfile');
        return;
    }

    const pid = Number(profileId);
    if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) {
        if (typeof showToast === 'function') showToast('You cannot chat with yourself');
        return;
    }

    let thread = CHAT_THREADS.find(t => Number(t.profileId) === pid);
    const knownEmail = thread ? thread.peerEmail : '';
    const p = findProfile(pid, knownEmail);
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();

    // Strict Gatekeeper: verify that interest between currentUser and profileId is ACCEPTED
    const status = interestStatusFor(pid);
    if (status !== 'accepted') {
        if (status === 'pending') {
            showToast(`🔒 Chat is locked. Messaging unlocks as soon as ${p ? p.name : 'member'} accepts your interest request.`);
        } else if (status === 'declined') {
            showToast(`🔒 Chat unavailable. This interest request was declined.`);
        } else {
            showToast(`🔒 Chat is locked. Please send an interest request first — chat unlocks once accepted.`);
            if (p && typeof openInterestModal === 'function') {
                openInterestModal(pid);
            }
        }
        return;
    }

    if (!thread) { 
        thread = { profileId: pid, peerEmail: (p && p.email) || '', name: (p && p.name) || '', img: (p && p.img) || '', messages: [] }; 
        CHAT_THREADS.push(thread); 
    }

    const peerEmail = (p && p.email && !p.email.includes('•')) ? p.email.trim().toLowerCase() : ((thread && thread.peerEmail) ? thread.peerEmail.trim().toLowerCase() : '');
    const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    let peerName = (p && p.name && p.name !== 'Community Match' && p.name !== 'Community Member' && p.name !== 'Member')
        ? p.name
        : ((thread && thread.name && thread.name !== 'Community Match' && thread.name !== 'Community Member' && thread.name !== 'Member')
            ? thread.name
            : '');

    if (!peerName) {
        const allReqs = [...(INCOMING_REQUESTS || []), ...(OUTGOING_REQUESTS || [])];
        const matchReq = allReqs.find(r => r && (
            Number(r.profileId) === pid || 
            Number(r.senderId) === pid || 
            Number(r.receiverId) === pid ||
            (peerEmail && ((r.senderEmail && r.senderEmail.toLowerCase() === peerEmail.toLowerCase()) || (r.receiverEmail && r.receiverEmail.toLowerCase() === peerEmail.toLowerCase())))
        ));
        if (matchReq) {
            const isSender = (Number(matchReq.senderId) === pid) || (peerEmail && matchReq.senderEmail && matchReq.senderEmail.toLowerCase() === peerEmail.toLowerCase());
            peerName = (isSender ? matchReq.senderName : matchReq.receiverName) || '';
        }
    }
    if (!peerName && peerEmail) {
        const parts = peerEmail.split('@')[0].split(/[._-]/).filter(Boolean);
        peerName = parts.map(pt => pt.charAt(0).toUpperCase() + pt.slice(1)).join(' ');
    }
    if (!peerName || peerName === 'Community Match') peerName = 'Member';

    let peerImg = (p && p.img && !p.img.includes('default_avatar')) ? p.img : ((thread && thread.img && !thread.img.includes('default_avatar')) ? thread.img : '');
    if (!peerImg) peerImg = fallbackAvatar;

    thread.name = peerName;
    thread.img = peerImg;
    if (peerEmail) thread.peerEmail = peerEmail;

    state.activeChatId = pid;
    cancelChatEdit();
    closeAllChatActions();

    // Mark all incoming messages in this thread as read immediately
    let hadUnread = false;
    const readMsgIds = [];
    if (thread && Array.isArray(thread.messages)) {
        thread.messages.forEach(m => {
            if (m.from === 'them') {
                if (!m.isRead || !m.is_read) {
                    hadUnread = true;
                    if (m.id) readMsgIds.push(String(m.id));
                }
                m.isRead = true;
                m.is_read = true;
            }
        });
    }
    if (hadUnread) {
        updateInboxBadge();
    }
    if (readMsgIds.length > 0 && state.currentUser && state.currentUser.id) {
        markMessagesSeenLocally(state.currentUser.id, readMsgIds);
    }
    saveSessionState();

    if (typeof supabaseMarkMessagesAsRead === 'function' && state.currentUser && state.currentUser.id) {
        supabaseMarkMessagesAsRead(state.currentUser.id, pid, myEmail, peerEmail, readMsgIds).catch(e => console.warn('[Chat] Mark read note:', e));
    }

    const aEl = document.getElementById('chatAvatar');
    const nEl = document.getElementById('chatName');
    if (aEl) {
        aEl.src = peerImg;
        aEl.onerror = function() { this.src = fallbackAvatar; };
    }
    if (nEl) nEl.textContent = peerName;
    updateChatOnlineStatus(pid);
    renderChatMessages();
    const inp = document.getElementById('chatInput');
    if (inp) {
        inp.value = '';
        autoResizeChatInput(inp);
    }
    go('scr-chat');
    setTimeout(() => scrollChatToBottom(false), 60);
    setTimeout(() => scrollChatToBottom(false), 240);

    // Asynchronously pull latest live messages from Supabase with Smart Merge
    if (typeof supabaseFetchChatMessages === 'function' && state.currentUser && state.currentUser.id) {
        const myProfId = (state.currentUser && state.currentUser.profileId) ? Number(state.currentUser.profileId) : 0;
        supabaseFetchChatMessages(state.currentUser.id, pid, myEmail, peerEmail).then(dbMsgs => {
            if (Array.isArray(dbMsgs)) {
                // Filter out messages that were cleared or deleted for this user
                const validDbMsgs = dbMsgs.filter(m => {
                    if (typeof isUserInDeletedList === 'function' && isUserInDeletedList(m.deletedForUsers || m.deleted_for_users, state.currentUser.id, myEmail, myProfId)) return false;
                    if (typeof isChatClearedForUser === 'function' && isChatClearedForUser(state.currentUser.id, pid, myEmail, peerEmail, m.createdAt)) return false;
                    return true;
                });

                const newlyReadDbIds = [];
                validDbMsgs.forEach(m => {
                    if (m.from === 'them') {
                        if (!m.isRead || !m.is_read) {
                            if (m.id) newlyReadDbIds.push(String(m.id));
                        }
                        m.isRead = true;
                        m.is_read = true;
                    }
                });
                if (newlyReadDbIds.length > 0 && state.currentUser && state.currentUser.id) {
                    markMessagesSeenLocally(state.currentUser.id, newlyReadDbIds);
                }

                // Prune any deleted or cleared messages from thread.messages in memory too
                thread.messages = (thread.messages || []).filter(m => {
                    if (typeof isUserInDeletedList === 'function' && isUserInDeletedList(m.deletedForUsers || m.deleted_for_users, state.currentUser.id, myEmail, myProfId)) return false;
                    if (typeof isChatClearedForUser === 'function' && isChatClearedForUser(state.currentUser.id, pid, myEmail, peerEmail, m.createdAt)) return false;
                    return true;
                });

                // SMART MERGE: Deduplicate by id
                const msgMap = new Map();
                thread.messages.forEach(m => {
                    if (m && m.id) msgMap.set(m.id, m);
                });
                validDbMsgs.forEach(m => {
                    if (m && m.id) {
                        const existing = msgMap.get(m.id);
                        if (existing) {
                            msgMap.set(m.id, { ...existing, ...m });
                        } else {
                            msgMap.set(m.id, m);
                        }
                    }
                });
                thread.messages = Array.from(msgMap.values()).sort((a, b) => {
                    const tA = new Date(a.createdAt || 0).getTime();
                    const tB = new Date(b.createdAt || 0).getTime();
                    return tA - tB;
                });

                saveSessionState();
                updateInboxBadge();
                renderChatMessages();
                if (typeof supabaseMarkMessagesAsRead === 'function') {
                    supabaseMarkMessagesAsRead(state.currentUser.id, pid, myEmail, peerEmail, newlyReadDbIds).catch(() => {});
                }
            }
        }).catch(e => console.warn('[Chat] Supabase messages fetch note:', e));
    }
}

function renderChatMessages() {
    const thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    const wrap = document.getElementById('chatMessages');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!thread || thread.messages.length === 0) {
        wrap.innerHTML = `
            <div class="chat-empty-state">
                <div class="chat-empty-icon"><i class="fa-solid fa-comments"></i></div>
                <h3>Safe Matrimonial Chat</h3>
                <p>Say hello and start a polite conversation. Strictly text-only messaging with end-to-end privacy.</p>
            </div>`;
        return;
    }

    // Defensive read-check: ensure all rendered incoming messages in active chat are marked read
    let unreadIncomingFound = false;
    const incomingUnreadIds = [];
    thread.messages.forEach(m => {
        if (m && m.from === 'them' && (!m.isRead || !m.is_read)) {
            m.isRead = true;
            m.is_read = true;
            unreadIncomingFound = true;
            if (m.id) incomingUnreadIds.push(String(m.id));
        }
    });
    if (unreadIncomingFound) {
        if (incomingUnreadIds.length > 0 && state.currentUser && state.currentUser.id) {
            markMessagesSeenLocally(state.currentUser.id, incomingUnreadIds);
        }
        updateInboxBadge();
        saveSessionState();
        if (typeof supabaseMarkMessagesAsRead === 'function' && state.currentUser && state.currentUser.id) {
            const peerEmail = thread.peerEmail || '';
            const myEmail = (state.currentUser && state.currentUser.email) || '';
            supabaseMarkMessagesAsRead(state.currentUser.id, state.activeChatId, myEmail, peerEmail, incomingUnreadIds).catch(() => {});
        }
    }
    thread.messages.forEach(m => {
        if (!m.id) {
            m.id = 'msg_' + Math.random().toString(36).substring(2, 9);
        }
        const isMe = m.from === 'me';
        const isDeleted = !!(m.isDeleted || m.is_deleted);
        const isEditingThis = editingMessageId === m.id;
        const row = document.createElement('div');
        row.className = `chat-msg-row ${isMe ? 'msg-me' : 'msg-them'}`;
        row.id = `msgRow-${m.id}`;

        if (isDeleted) {
            // WhatsApp-style Deleted Message Bubble
            const deletedText = isMe ? '<i class="fa-solid fa-ban" style="font-size:12px;opacity:0.75;"></i> You deleted this message' : '<i class="fa-solid fa-ban" style="font-size:12px;opacity:0.75;"></i> This message was deleted';
            if (isMe) {
                row.innerHTML = `
                    <div class="chat-msg-actions-popup" id="actions-${m.id}">
                        <button type="button" class="chat-bubble-action-btn btn-delete" onclick="promptDeleteChatMessage('${m.id}', event)" title="Delete for me">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="chat-bubble bubble-me is-deleted" onclick="toggleChatMessageActions('${m.id}', event)" title="Deleted message">
                        <div class="chat-bubble-text chat-deleted-text">${deletedText}</div>
                        <div class="chat-bubble-meta">
                            <span class="chat-bubble-time">${m.time || ''}</span>
                        </div>
                    </div>`;
            } else {
                row.innerHTML = `
                    <div class="chat-bubble bubble-them is-deleted" onclick="toggleChatMessageActions('${m.id}', event)" title="Deleted message">
                        <div class="chat-bubble-text chat-deleted-text">${deletedText}</div>
                        <div class="chat-bubble-meta">
                            <span class="chat-bubble-time">${m.time || ''}</span>
                        </div>
                    </div>
                    <div class="chat-msg-actions-popup" id="actions-${m.id}">
                        <button type="button" class="chat-bubble-action-btn btn-delete" onclick="promptDeleteChatMessage('${m.id}', event)" title="Delete for me">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>`;
            }
        } else if (isMe) {
            const isRead = !!(m.isRead || m.is_read);
            const checkIconHtml = isRead
                ? `<i class="fa-solid fa-check-double chat-bubble-check is-read" style="color:#38bdf8;font-size:11px;" title="Read"></i>`
                : `<i class="fa-solid fa-check-double chat-bubble-check" style="color:rgba(255,255,255,0.7);font-size:11px;" title="Delivered"></i>`;

            row.innerHTML = `
                <div class="chat-msg-actions-popup" id="actions-${m.id}">
                    <button type="button" class="chat-bubble-action-btn btn-edit" onclick="startEditChatMessage('${m.id}', event)" title="Edit Message">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="chat-bubble-action-btn btn-delete" onclick="promptDeleteChatMessage('${m.id}', event)" title="Delete Message">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="chat-bubble bubble-me ${isEditingThis ? 'is-editing' : ''}" onclick="toggleChatMessageActions('${m.id}', event)" title="Click to edit or delete">
                    <div class="chat-bubble-text">${escapeHtml(m.text || '')}</div>
                    <div class="chat-bubble-meta">
                        ${m.edited ? '<span class="chat-bubble-edited"><i class="fa-solid fa-pen-nib" style="font-size:9px;margin-right:2px;"></i>Edited</span>' : ''}
                        <span class="chat-bubble-time">${m.time || ''}</span>
                        ${checkIconHtml}
                    </div>
                </div>`;
        } else {
            row.innerHTML = `
                <div class="chat-bubble bubble-them" onclick="toggleChatMessageActions('${m.id}', event)" title="Click for options">
                    <div class="chat-bubble-text">${escapeHtml(m.text || '')}</div>
                    <div class="chat-bubble-meta">
                        ${m.edited ? '<span class="chat-bubble-edited"><i class="fa-solid fa-pen-nib" style="font-size:9px;margin-right:2px;"></i>Edited</span>' : ''}
                        <span class="chat-bubble-time">${m.time || ''}</span>
                    </div>
                </div>
                <div class="chat-msg-actions-popup" id="actions-${m.id}">
                    <button type="button" class="chat-bubble-action-btn btn-delete" onclick="promptDeleteChatMessage('${m.id}', event)" title="Delete Message">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
        }
        wrap.appendChild(row);
    });
    scrollChatToBottom(false);
}

function toggleChatMessageActions(msgId, event) {
    if (event) event.stopPropagation();
    const targetRow = document.getElementById(`msgRow-${msgId}`);
    if (!targetRow) return;
    const isAlreadyOpen = targetRow.classList.contains('show-actions');
    closeAllChatActions();
    if (!isAlreadyOpen) {
        targetRow.classList.add('show-actions');
    }
}

function closeAllChatActions() {
    document.querySelectorAll('.chat-msg-row.show-actions').forEach(el => {
        el.classList.remove('show-actions');
    });
}

// Global click listener to close chat actions popups when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-msg-row') && !e.target.closest('.chat-msg-actions-popup')) {
        closeAllChatActions();
    }
});

function promptDeleteChatMessage(msgId, event) {
    if (event) event.stopPropagation();
    closeAllChatActions();
    pendingDeleteMsgId = msgId;

    const thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    const msg = thread && thread.messages ? thread.messages.find(m => m.id === msgId) : null;

    const titleEl = document.getElementById('delModalTitle');
    const descEl = document.getElementById('delModalDesc');
    const btnEveryone = document.getElementById('btnDelEveryone');
    const btnForMe = document.getElementById('btnDelForMe');

    if (msg && msg.from === 'me' && !msg.isDeleted && !msg.is_deleted) {
        // User's own active message: WhatsApp options (Delete for everyone OR Delete for me)
        if (titleEl) titleEl.textContent = 'Delete message?';
        if (descEl) descEl.textContent = 'Choose whether to delete this message for everyone or only for yourself.';
        if (btnEveryone) btnEveryone.style.display = 'inline-flex';
        if (btnForMe) btnForMe.style.display = 'inline-flex';
    } else {
        // Friend's message OR already deleted placeholder: ONLY Delete for Me
        if (titleEl) titleEl.textContent = 'Delete message?';
        if (descEl) descEl.textContent = 'This message will be removed from your chat. The other member will still be able to see it.';
        if (btnEveryone) btnEveryone.style.display = 'none';
        if (btnForMe) btnForMe.style.display = 'inline-flex';
    }
    openModal('modalDeleteChatMsg');
}

function confirmDeleteChatMessage(mode = 'everyone') {
    if (!pendingDeleteMsgId) {
        closeModal('modalDeleteChatMsg');
        return;
    }
    const thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    if (!thread || !Array.isArray(thread.messages)) {
        closeModal('modalDeleteChatMsg');
        return;
    }

    if (editingMessageId === pendingDeleteMsgId) {
        cancelChatEdit();
    }

    const msg = thread.messages.find(m => m.id === pendingDeleteMsgId);

    if (mode === 'everyone' && msg && msg.from === 'me') {
        // 1. WhatsApp Delete for Everyone
        msg.isDeleted = true;
        msg.is_deleted = true;
        msg.text = 'This message was deleted';
        msg.edited = false;
        saveSessionState();
        renderChatMessages();
        showToast('Message deleted for everyone');
        if (typeof supabaseDeleteChatMessageForEveryone === 'function') {
            supabaseDeleteChatMessageForEveryone(pendingDeleteMsgId).catch(e => console.warn('[Chat] Delete for everyone error:', e));
        }
    } else {
        // 2. Delete for Me
        thread.messages = thread.messages.filter(m => m.id !== pendingDeleteMsgId);
        saveSessionState();
        renderChatMessages();
        showToast('Message deleted for you');
        if (typeof supabaseDeleteChatMessageForMe === 'function' && state.currentUser && state.currentUser.id) {
            supabaseDeleteChatMessageForMe(pendingDeleteMsgId, state.currentUser.id, state.currentUser.email).catch(e => console.warn('[Chat] Delete for me error:', e));
        }
    }

    pendingDeleteMsgId = null;
    closeModal('modalDeleteChatMsg');
}

function promptClearChatHistory() {
    const thread = CHAT_THREADS.find(t => String(t.profileId) === String(state.activeChatId) || Number(t.profileId) === Number(state.activeChatId));
    if (!thread || !thread.messages || thread.messages.length === 0) {
        showToast('Chat is already empty');
        return;
    }
    openModal('modalClearChat');
}

async function confirmClearChatHistory() {
    const activeId = state.activeChatId;
    const thread = CHAT_THREADS.find(t => String(t.profileId) === String(activeId) || Number(t.profileId) === Number(activeId));
    if (thread) {
        if (editingMessageId) cancelChatEdit();

        // 1. Gather all message IDs and any peer sender/receiver IDs & emails from current thread
        const msgIdsToClear = (thread.messages || []).map(m => m.id).filter(Boolean);
        const extraPeerIds = [];
        const extraPeerEmails = [];
        const myIdStr = String(state.currentUser?.id || '');
        const myProfIdStr = String(state.currentUser?.profileId || '');
        const myEm = (state.currentUser?.email || '').trim().toLowerCase();

        (thread.messages || []).forEach(m => {
            if (m.senderId && String(m.senderId) !== myIdStr && String(m.senderId) !== myProfIdStr) {
                extraPeerIds.push(m.senderId);
            }
            if (m.receiverId && String(m.receiverId) !== myIdStr && String(m.receiverId) !== myProfIdStr) {
                extraPeerIds.push(m.receiverId);
            }
            if (m.senderEmail && m.senderEmail.trim().toLowerCase() !== myEm && !m.senderEmail.includes('•')) {
                extraPeerEmails.push(m.senderEmail.trim().toLowerCase());
            }
            if (m.receiverEmail && m.receiverEmail.trim().toLowerCase() !== myEm && !m.receiverEmail.includes('•')) {
                extraPeerEmails.push(m.receiverEmail.trim().toLowerCase());
            }
        });

        // 2. Clear locally immediately for snappy UI
        thread.messages = [];
        saveSessionState();
        renderChatMessages();
        updateInboxBadge();
        showToast('Chat history cleared');

        // 3. Register cleared timestamp
        const myId = state.currentUser ? (state.currentUser.id || state.currentUser.profileId) : '';
        const peer = (typeof findProfile === 'function') ? findProfile(activeId) : null;
        let peerEmail = peer ? (peer.rawEmail || peer.email || '') : (thread.peerEmail || '');
        if (peerEmail && peerEmail.includes('•')) peerEmail = '';

        if (typeof registerClearedChat === 'function') {
            registerClearedChat(myId, activeId, myEm, peerEmail);
            if (state.currentUser && state.currentUser.profileId) {
                registerClearedChat(state.currentUser.profileId, activeId, myEm, peerEmail);
            }
        }

        // 4. Persist to Supabase Database
        if (typeof supabaseClearUserChat === 'function' && state.currentUser && state.currentUser.id && activeId) {
            supabaseClearUserChat(state.currentUser.id, activeId, state.currentUser.email, peerEmail, {
                knownMsgIds: msgIdsToClear,
                extraPeerIds: extraPeerIds,
                extraPeerEmails: extraPeerEmails,
                myProfId: state.currentUser.profileId
            }).catch(e => console.warn('[Chat] Clear chat error:', e));
        }
    }
    closeModal('modalClearChat');
}

function startEditChatMessage(msgId, event) {
    if (event) event.stopPropagation();
    closeAllChatActions();
    const thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    if (!thread) return;
    const msg = thread.messages.find(m => m.id === msgId);
    if (!msg) return;

    editingMessageId = msgId;
    const input = document.getElementById('chatInput');
    const banner = document.getElementById('chatEditBanner');
    const snippet = document.getElementById('chatEditSnippet');
    const sendIcon = document.getElementById('chatSendIcon');
    const sendBtn = document.getElementById('btnSendChat');

    if (banner) banner.style.display = 'flex';
    if (snippet) snippet.textContent = msg.text;
    if (input) {
        input.value = msg.text;
        autoResizeChatInput(input);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
    if (sendIcon) {
        sendIcon.className = 'fa-solid fa-check';
    }
    if (sendBtn) {
        sendBtn.title = 'Save edited message';
        sendBtn.classList.add('editing-active');
    }

    // Highlight the bubble
    document.querySelectorAll('.chat-bubble.is-editing').forEach(b => b.classList.remove('is-editing'));
    const bubbleEl = document.querySelector(`#msgRow-${msgId} .chat-bubble`);
    if (bubbleEl) bubbleEl.classList.add('is-editing');

    // Scroll to bubble
    const rowEl = document.getElementById(`msgRow-${msgId}`);
    if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelChatEdit() {
    editingMessageId = null;
    const banner = document.getElementById('chatEditBanner');
    const input = document.getElementById('chatInput');
    const sendIcon = document.getElementById('chatSendIcon');
    const sendBtn = document.getElementById('btnSendChat');

    if (banner) banner.style.display = 'none';
    if (input) {
        input.value = '';
        autoResizeChatInput(input);
    }
    if (sendIcon) {
        sendIcon.className = 'fa-solid fa-paper-plane';
    }
    if (sendBtn) {
        sendBtn.title = 'Send Message';
        sendBtn.classList.remove('editing-active');
    }
    document.querySelectorAll('.chat-bubble.is-editing').forEach(b => b.classList.remove('is-editing'));
}

/* escapeHtml is provided centrally by js/utils/helpers.js */

function autoResizeChatInput(el) {
    if (!el) return;
    el.style.height = 'auto';
    const minH = 46;
    const maxH = 125;
    const computed = window.getComputedStyle(el);
    const borderY = (parseFloat(computed.borderTopWidth) || 0) + (parseFloat(computed.borderBottomWidth) || 0);
    const targetHeight = el.scrollHeight + borderY;
    if (targetHeight > maxH) {
        el.style.height = maxH + 'px';
        el.style.overflowY = 'auto';
    } else {
        el.style.height = Math.max(targetHeight, minH) + 'px';
        el.style.overflowY = 'hidden';
    }
}

function handleChatInputKeyDown(event) {
    if (event.key === 'Escape' && editingMessageId) {
        cancelChatEdit();
        return;
    }
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            setTimeout(() => {
                const el = document.getElementById('chatInput');
                if (el) autoResizeChatInput(el);
            }, 0);
            return;
        }
        // Enter without Shift:
        const isCoarseTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
        if (!isCoarseTouchOnly) {
            event.preventDefault();
            sendChatMessage();
        } else {
            // Mobile touchscreen keyboard: Enter key adds a new line, paper-plane button sends
            setTimeout(() => {
                const el = document.getElementById('chatInput');
                if (el) autoResizeChatInput(el);
            }, 0);
        }
    }
}

function sendChatMessage() {
    if (!state.currentUser || !state.currentUser.email) {
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) { openModal('modalCompleteProfile'); return; }
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    let thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    if (!thread) { thread = { profileId: state.activeChatId, messages: [] }; CHAT_THREADS.push(thread); }

    // If in edit mode, save the updated message text
    if (editingMessageId) {
        const msg = thread.messages.find(m => m.id === editingMessageId);
        if (msg) {
            msg.text = text;
            msg.edited = true;
            msg.editedAt = Date.now();
            showToast('Message updated');
            if (typeof supabaseUpdateChatMessage === 'function') {
                supabaseUpdateChatMessage(editingMessageId, text).catch(e => console.warn('[Chat] Edit message note:', e));
            }
        }
        cancelChatEdit();
        saveSessionState();
        renderChatMessages();
        return;
    }

    // New message
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        from: 'me',
        senderId: Number(state.currentUser.id),
        receiverId: Number(state.activeChatId),
        text,
        time,
        edited: false,
        isDeleted: false,
        isRead: false,
        createdAt: now.toISOString()
    };
    thread.messages.push(newMsg);
    // Move this active thread to index 0 so it immediately appears first in Inbox
    const curIdx = CHAT_THREADS.indexOf(thread);
    if (curIdx > 0) {
        CHAT_THREADS.splice(curIdx, 1);
        CHAT_THREADS.unshift(thread);
    }
    input.value = '';
    autoResizeChatInput(input);
    saveSessionState();
    renderChatMessages();
    setTimeout(() => scrollChatToBottom(true), 40);
    if (window.innerWidth >= 1024) {
        input.focus();
    }

    // Persist to Supabase PostgreSQL
    if (typeof supabaseSaveChatMessage === 'function' && state.currentUser && state.currentUser.id) {
        const peer = findProfile(state.activeChatId);
        let resolvedReceiverEmail = (peer && peer.rawEmail && !peer.rawEmail.includes('•'))
            ? peer.rawEmail
            : ((peer && peer.email && !peer.email.includes('•'))
                ? peer.email
                : ((thread && thread.peerEmail && !thread.peerEmail.includes('•'))
                    ? thread.peerEmail
                    : ''));
        if (!resolvedReceiverEmail && peer && typeof PROFILES !== 'undefined' && Array.isArray(PROFILES)) {
            const pMatch = PROFILES.find(x => x && (x.id === state.activeChatId || x.userId === state.activeChatId || x.id == peer.id));
            if (pMatch && pMatch.rawEmail && !pMatch.rawEmail.includes('•')) {
                resolvedReceiverEmail = pMatch.rawEmail;
            }
        }
        supabaseSaveChatMessage({
            id: newMsg.id,
            senderId: state.currentUser.id,
            receiverId: state.activeChatId,
            senderEmail: state.currentUser.email,
            receiverEmail: resolvedReceiverEmail || '',
            text: text,
            time: time,
            edited: false
        }).catch(e => console.warn('[Chat] Supabase save error:', e));
    }
}

function viewChatProfile() {
    if (state.activeChatId) openProfile(state.activeChatId);
}

function setupChatMobileHandlers() {
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('input', () => autoResizeChatInput(input));
        input.addEventListener('focus', () => {
            setTimeout(() => scrollChatToBottom(true), 150);
            setTimeout(() => scrollChatToBottom(true), 350);
        });
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id === 'scr-chat') {
                scrollChatToBottom(false);
            }
        });
    }
}

/* ============================================================ REAL-TIME CHAT TOAST NOTIFICATION ============================================================ */
let activeChatToastPeerId = null;
let chatToastTimer = null;

function showChatToast(senderProfile, messageText, peerId) {
    const banner = document.getElementById('chatToastBanner');
    if (!banner) return;

    activeChatToastPeerId = Number(peerId);
    const avatarEl = document.getElementById('chatToastAvatar');
    const senderEl = document.getElementById('chatToastSender');
    const textEl = document.getElementById('chatToastText');

    const defaultImg = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    let profileImg = (senderProfile?.img && !senderProfile.img.includes('default_avatar')) ? senderProfile.img : (senderProfile?.photo || '');
    if (!profileImg) {
        const thread = typeof CHAT_THREADS !== 'undefined' ? CHAT_THREADS.find(t => Number(t.profileId) === Number(peerId)) : null;
        if (thread && thread.img && !thread.img.includes('default_avatar')) {
            profileImg = thread.img;
        }
    }
    if (!profileImg) profileImg = defaultImg;

    if (avatarEl) {
        avatarEl.src = profileImg;
        avatarEl.onerror = function() { this.src = defaultImg; };
    }

    let name = senderProfile?.name || '';
    if (!name || name === 'Community Match' || name === 'Community Member') {
        const thread = typeof CHAT_THREADS !== 'undefined' ? CHAT_THREADS.find(t => Number(t.profileId) === Number(peerId)) : null;
        if (thread && thread.name && thread.name !== 'Community Match' && thread.name !== 'Community Member') {
            name = thread.name;
        } else if (typeof findProfile === 'function') {
            const fp = findProfile(peerId, senderProfile?.email);
            if (fp && fp.name && fp.name !== 'Community Match' && fp.name !== 'Community Member') {
                name = fp.name;
            }
        }
    }
    if (!name || name === 'Community Match' || name === 'Community Member') {
        if (senderProfile?.email) {
            const parts = senderProfile.email.split('@')[0].split(/[._-]/).filter(Boolean);
            name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
    }
    if (!name || name === 'Community Match') {
        name = 'Member';
    }

    if (senderEl) {
        senderEl.textContent = name;
    }
    if (textEl) textEl.textContent = messageText || 'Sent you a message';

    banner.classList.remove('dismissing');
    banner.style.display = 'flex';

    if (chatToastTimer) clearTimeout(chatToastTimer);
    chatToastTimer = setTimeout(() => {
        closeChatToast();
    }, 5500);
}

function openChatFromToast() {
    if (activeChatToastPeerId) {
        const pid = activeChatToastPeerId;
        closeChatToast();
        openChatFor(pid);
    }
}

function closeChatToast() {
    const banner = document.getElementById('chatToastBanner');
    if (!banner) return;
    banner.classList.add('dismissing');
    setTimeout(() => {
        banner.style.display = 'none';
        banner.classList.remove('dismissing');
        activeChatToastPeerId = null;
    }, 220);
}

/* ============================================================ REAL-TIME CHAT & INTEREST LISTENER ============================================================ */
function initChatRealtimeListener() {
    if (!state.currentUser || !state.currentUser.id || !state.currentUser.email) return;
    if (typeof supabaseSubscribeToUserChat !== 'function') return;

    supabaseSubscribeToUserChat(state.currentUser.id, state.currentUser.email, {
        onNewMessage: (dbMsg) => {
            handleIncomingRealtimeMessage(dbMsg);
        },
        onMessageUpdate: (dbMsg) => {
            handleRealtimeMessageUpdate(dbMsg);
        },
        onMessageDelete: (oldMsg) => {
            handleRealtimeMessageDelete(oldMsg);
        },
        onInterestUpdate: (dbInterest) => {
            handleRealtimeInterestUpdate(dbInterest);
        },
        onInterestInsert: (dbInterest) => {
            handleRealtimeInterestInsert(dbInterest);
        }
    });
}

function handleIncomingRealtimeMessage(dbMsg) {
    if (!dbMsg || !state.currentUser) return;
    const myId = Number(state.currentUser.id || 0);
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    const senderId = Number(dbMsg.sender_id);
    const receiverId = Number(dbMsg.receiver_id);
    const senderEmail = (dbMsg.sender_email || '').trim().toLowerCase();
    const receiverEmail = (dbMsg.receiver_email || '').trim().toLowerCase();

    const myProfId = (state.currentUser && state.currentUser.profileId) ? Number(state.currentUser.profileId) : 0;
    const isMeSender = (myId && (senderId === myId || (myProfId && senderId === myProfId))) || (myEmail && senderEmail === myEmail);
    const isMeReceiver = (myId && (receiverId === myId || (myProfId && receiverId === myProfId))) || (myEmail && receiverEmail === myEmail);

    if (!isMeSender && !isMeReceiver) return;

    const peerId = isMeSender ? receiverId : senderId;
    const peerEmail = isMeSender ? receiverEmail : senderEmail;

    if (typeof isUserInDeletedList === 'function' && isUserInDeletedList(dbMsg.deleted_for_users, myId, myEmail, myProfId)) return;
    if (typeof isChatClearedForUser === 'function' && isChatClearedForUser(myId, peerId, myEmail, peerEmail, dbMsg.created_at)) return;

    // 1. Resolve peer profile through comprehensive multi-tier lookup (Profiles, Threads, Requests, Accounts)
    let peerProf = (typeof findProfile === 'function') ? findProfile(peerId, peerEmail) : null;

    // 2. Find thread by peerId OR by peerEmail OR by resolved profile ID
    let thread = CHAT_THREADS.find(t => {
        if (!t) return false;
        if (peerId && Number(t.profileId) === peerId) return true;
        if (peerProf && peerProf.id && Number(t.profileId) === Number(peerProf.id)) return true;
        if (peerEmail && t.peerEmail && t.peerEmail.trim().toLowerCase() === peerEmail) return true;
        return false;
    });

    const canonicalPeerId = (peerProf && peerProf.id)
        ? Number(peerProf.id)
        : (thread && thread.profileId ? Number(thread.profileId) : peerId);

    // If thread not found, initialize it with all known attributes
    if (!thread) {
        thread = {
            profileId: canonicalPeerId,
            peerEmail: peerEmail || (peerProf ? peerProf.email : ''),
            name: peerProf ? peerProf.name : '',
            img: peerProf ? peerProf.img : '',
            messages: []
        };
        CHAT_THREADS.push(thread);
    } else {
        // Backfill missing info in existing thread
        if (!thread.name && peerProf && peerProf.name) thread.name = peerProf.name;
        if (!thread.img && peerProf && peerProf.img) thread.img = peerProf.img;
        if (!thread.peerEmail && peerEmail) thread.peerEmail = peerEmail;
        if (canonicalPeerId && Number(thread.profileId) !== canonicalPeerId) {
            thread.profileId = canonicalPeerId;
        }
    }

    if (thread.messages.some(m => m.id === dbMsg.id)) return;

    const activeScreen = document.querySelector('.screen.active');
    const isInThisChat = activeScreen && activeScreen.id === 'scr-chat' && (
        Number(state.activeChatId) === peerId ||
        Number(state.activeChatId) === canonicalPeerId ||
        (thread && Number(state.activeChatId) === Number(thread.profileId))
    );

    const incomingObj = {
        id: dbMsg.id,
        from: isMeSender ? 'me' : 'them',
        senderId: senderId,
        receiverId: receiverId,
        senderEmail: dbMsg.sender_email,
        receiverEmail: dbMsg.receiver_email,
        text: dbMsg.text,
        time: dbMsg.time || new Date(dbMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        edited: !!dbMsg.edited,
        isDeleted: !!dbMsg.is_deleted,
        isRead: isInThisChat || isMeSender,
        is_read: isInThisChat || isMeSender,
        createdAt: dbMsg.created_at
    };

    thread.messages.push(incomingObj);
    // Move updated thread to the top of CHAT_THREADS so it pops up in Inbox
    const threadIdx = CHAT_THREADS.indexOf(thread);
    if (threadIdx > 0) {
        CHAT_THREADS.splice(threadIdx, 1);
        CHAT_THREADS.unshift(thread);
    }
    if (isInThisChat && !isMeSender && dbMsg.id && state.currentUser && state.currentUser.id) {
        markMessagesSeenLocally(state.currentUser.id, [dbMsg.id]);
    }
    saveSessionState();

    if (isInThisChat) {
        renderChatMessages();
        setTimeout(() => scrollChatToBottom(true), 40);
        if (!isMeSender && typeof supabaseMarkMessagesAsRead === 'function') {
            supabaseMarkMessagesAsRead(myId, canonicalPeerId, myEmail, peerEmail, [dbMsg.id]).catch(() => {});
        }
    } else {
        updateInboxBadge();
        if (activeScreen && activeScreen.id === 'scr-inbox') {
            renderInbox();
        }
        if (!isMeSender) {
            // High-fidelity sender name and avatar resolution
            const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
            let bestName = '';
            if (peerProf && peerProf.name && peerProf.name !== 'Community Match' && peerProf.name !== 'Community Member' && peerProf.name !== 'Member') {
                bestName = peerProf.name;
            } else if (thread && thread.name && thread.name !== 'Community Match' && thread.name !== 'Community Member' && thread.name !== 'Member') {
                bestName = thread.name;
            } else if (peerEmail) {
                const parts = peerEmail.split('@')[0].split(/[._-]/).filter(Boolean);
                bestName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            }
            if (!bestName || bestName === 'Community Match') bestName = 'Member';

            let bestImg = (peerProf && peerProf.img && !peerProf.img.includes('default_avatar')) ? (peerProf.img || peerProf.photo) : null;
            if (!bestImg && thread && thread.img && !thread.img.includes('default_avatar')) {
                bestImg = thread.img;
            }
            if (!bestImg) {
                bestImg = fallbackAvatar;
            }

            const toastPeerObj = {
                id: canonicalPeerId,
                name: bestName,
                img: bestImg,
                email: peerEmail
            };

            showChatToast(toastPeerObj, dbMsg.text, canonicalPeerId);

            if (typeof addUserRealtimeNotification === 'function') {
                const activeScr = document.querySelector('.screen.active');
                if (!activeScr || activeScr.id !== 'scr-chat') {
                    addUserRealtimeNotification({
                        id: `msg_${dbMsg.id || Date.now()}`,
                        icon: 'fa-comment-dots',
                        title: `New message from ${bestName}`,
                        desc: String(dbMsg.text || 'Sent you a message').slice(0, 70),
                        time: 'Just now',
                        unread: true,
                        actionType: 'chat',
                        actionTarget: String(canonicalPeerId)
                    });
                }
            }

            // Realtime async backfill from Supabase to guarantee 100% profile accuracy
            if (typeof getSupabaseClient === 'function' && getSupabaseClient() && (peerEmail || canonicalPeerId)) {
                (async () => {
                    try {
                        const client = getSupabaseClient();
                        let pQuery = client.from('profiles').select('id, name, email, user_id, img, photo, photos');
                        if (peerEmail && !peerEmail.includes('•')) {
                            pQuery = pQuery.ilike('email', peerEmail);
                        } else if (canonicalPeerId) {
                            pQuery = pQuery.or(`id.eq.${canonicalPeerId},user_id.eq.${canonicalPeerId}`);
                        }
                        const { data: dbProfs } = await pQuery.limit(1);
                        if (Array.isArray(dbProfs) && dbProfs.length > 0) {
                            const rawP = dbProfs[0];
                            const realName = rawP.name || '';
                            const realImg = rawP.img || rawP.photo || (Array.isArray(rawP.photos) ? rawP.photos[0] : '');
                            if (realName && realName !== 'Community Match' && realName !== 'Member') {
                                if (thread) {
                                    thread.name = realName;
                                    if (realImg) thread.img = realImg;
                                    if (rawP.id) thread.profileId = Number(rawP.id);
                                }
                                if (Array.isArray(window.PROFILES)) {
                                    const ex = window.PROFILES.find(x => x && (Number(x.id) === Number(rawP.id) || (x.email && x.email.toLowerCase() === (rawP.email || '').toLowerCase())));
                                    if (ex) {
                                        ex.name = realName;
                                        if (realImg) ex.img = realImg;
                                    } else {
                                        window.PROFILES.push({
                                            id: rawP.id,
                                            userId: rawP.user_id || rawP.id,
                                            name: realName,
                                            email: rawP.email,
                                            img: realImg,
                                            photos: rawP.photos || [realImg]
                                        });
                                    }
                                }
                                // Update toast DOM live if currently visible
                                const banner = document.getElementById('chatToastBanner');
                                if (banner && banner.style.display !== 'none' && (activeChatToastPeerId === canonicalPeerId || activeChatToastPeerId === Number(rawP.id) || activeChatToastPeerId === Number(peerId))) {
                                    const senderEl = document.getElementById('chatToastSender');
                                    const avatarEl = document.getElementById('chatToastAvatar');
                                    if (senderEl) senderEl.textContent = realName;
                                    if (avatarEl && realImg) avatarEl.src = realImg;
                                }
                                // Refresh inbox if currently visible
                                const curScr = document.querySelector('.screen.active');
                                if (curScr && curScr.id === 'scr-inbox' && typeof renderInbox === 'function') {
                                    renderInbox();
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[Chat] Async profile backfill note:', e);
                    }
                })();
            }
        }
    }
}

function handleRealtimeMessageUpdate(dbMsg) {
    if (!dbMsg || !state.currentUser) return;
    const myId = state.currentUser.id;
    const myProfId = state.currentUser.profileId;
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    
    // Check if THIS user deleted or cleared this message
    const deletedForMe = typeof isUserInDeletedList === 'function'
        ? isUserInDeletedList(dbMsg.deleted_for_users, myId, myEmail, myProfId)
        : (Array.isArray(dbMsg.deleted_for_users) && (dbMsg.deleted_for_users.includes(myId) || (myProfId && dbMsg.deleted_for_users.includes(myProfId)) || (myEmail && dbMsg.deleted_for_users.includes(myEmail))));

    if (deletedForMe) {
        // ONLY if it was deleted/cleared for THIS user, remove it from THIS user's in-memory view
        CHAT_THREADS.forEach(t => {
            if (Array.isArray(t.messages)) {
                t.messages = t.messages.filter(x => x.id !== dbMsg.id);
            }
        });
        saveSessionState();
        renderChatMessages();
        return;
    }

    // Match thread by ID or email
    const numMyId = Number(myId);
    const strMyId = String(myId).trim();
    const sEmail = (dbMsg.sender_email || '').trim().toLowerCase();
    const rEmail = (dbMsg.receiver_email || '').trim().toLowerCase();
    const isSenderMe = (!isNaN(numMyId) && Number(dbMsg.sender_id) === numMyId) || (strMyId && String(dbMsg.sender_id) === strMyId) || (myEmail && sEmail === myEmail);
    const peerId = isSenderMe ? dbMsg.receiver_id : dbMsg.sender_id;
    const peerEmail = isSenderMe ? rEmail : sEmail;

    let thread = CHAT_THREADS.find(t => String(t.profileId) === String(peerId) || Number(t.profileId) === Number(peerId));
    if (!thread && peerEmail) {
        const p = (window.PROFILES || []).find(prof => prof && prof.email && prof.email.toLowerCase().trim() === peerEmail);
        if (p) {
            thread = CHAT_THREADS.find(t => Number(t.profileId) === Number(p.id));
        }
    }
    if (thread && Array.isArray(thread.messages)) {
        const m = thread.messages.find(x => x.id === dbMsg.id);
        if (m) {
            m.text = dbMsg.text;
            m.edited = !!dbMsg.edited;
            m.isDeleted = !!dbMsg.is_deleted;
            const curUserId = state.currentUser ? state.currentUser.id : 0;
            const localSeen = curUserId ? getLocalSeenMsgIds(curUserId) : null;
            const wasRead = !!m.isRead || !!m.is_read || (localSeen && localSeen.has(String(dbMsg.id)));
            m.isRead = wasRead || !!dbMsg.is_read;
            m.is_read = m.isRead;
            m.readAt = dbMsg.read_at;
            saveSessionState();
            updateInboxBadge();
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id === 'scr-chat') {
                renderChatMessages();
            } else if (activeScreen && activeScreen.id === 'scr-inbox') {
                renderInbox();
            }
        }
    }
}

function handleRealtimeMessageDelete(oldMsg) {
    if (!oldMsg || !oldMsg.id) return;
    CHAT_THREADS.forEach(t => {
        if (Array.isArray(t.messages)) {
            t.messages = t.messages.filter(m => m.id !== oldMsg.id);
        }
    });
    saveSessionState();
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'scr-chat') {
        renderChatMessages();
    } else if (activeScreen && activeScreen.id === 'scr-inbox') {
        renderInbox();
    }
}

function handleRealtimeInterestUpdate(dbInterest) {
    if (!dbInterest || !state.currentUser) return;
    const myId = Number(state.currentUser.id);
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    const sendId = Number(dbInterest.sender_id);
    const recId = Number(dbInterest.receiver_id);
    const sendEmail = (dbInterest.sender_email || '').trim().toLowerCase();
    const recEmail = (dbInterest.receiver_email || '').trim().toLowerCase();

    const isMeSender = sendId === myId || (myEmail && sendEmail === myEmail);
    const isMeReceiver = recId === myId || (myEmail && recEmail === myEmail);

    if (!isMeSender && !isMeReceiver) return;

    const peerId = isMeSender ? recId : sendId;

    if (isMeSender) {
        let out = OUTGOING_REQUESTS.find(r => Number(r.profileId) === peerId);
        if (out) {
            out.status = dbInterest.status;
        } else {
            OUTGOING_REQUESTS.push({
                id: dbInterest.id,
                profileId: peerId,
                receiverEmail: dbInterest.receiver_email,
                receiverName: dbInterest.receiver_name,
                status: dbInterest.status,
                date: 'Just now'
            });
        }
    } else {
        let inc = INCOMING_REQUESTS.find(r => Number(r.profileId) === peerId);
        if (inc) {
            inc.status = dbInterest.status;
        }
    }

    const peerEmail = (isMeSender ? dbInterest.receiver_email : dbInterest.sender_email) || '';
    const peerName = (isMeSender ? dbInterest.receiver_name : dbInterest.sender_name) || '';
    const peerPhoto = (isMeSender ? dbInterest.receiver_photo : dbInterest.sender_photo) || '';
    const peerProf = findProfile(peerId, peerEmail);
    const resolvedName = (peerProf && peerProf.name && peerProf.name !== 'Community Match' && peerProf.name !== 'Community Member')
        ? peerProf.name
        : (peerName || 'Member');
    const resolvedImg = (peerProf && peerProf.img && !peerProf.img.includes('default_avatar'))
        ? peerProf.img
        : (peerPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop');

    if (dbInterest.status === 'accepted') {
        let thread = CHAT_THREADS.find(t => Number(t.profileId) === peerId || (peerEmail && t.peerEmail && t.peerEmail.toLowerCase() === peerEmail.toLowerCase()));
        if (!thread) {
            thread = {
                profileId: peerId,
                peerEmail: peerEmail,
                name: resolvedName,
                img: resolvedImg,
                messages: []
            };
            CHAT_THREADS.push(thread);
        } else {
            if (!thread.name || thread.name === 'Community Match' || thread.name === 'Member') thread.name = resolvedName;
            if (!thread.img || thread.img.includes('default_avatar')) thread.img = resolvedImg;
            if (!thread.peerEmail && peerEmail) thread.peerEmail = peerEmail;
        }
    }

    saveSessionState();
    updateInboxBadge();
    refreshProfileButtons();

    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'scr-inbox') {
        renderInbox();
    }

    // Celebratory instant alert when interest is accepted
    if (isMeSender && dbInterest.status === 'accepted') {
        showToast(`🎉 ${resolvedName} accepted your interest request! Safe text chat & family contact are now unlocked.`);
        if (typeof window.refreshProfileContactState === 'function') {
            window.refreshProfileContactState(peerId);
        }
        if (typeof addUserRealtimeNotification === 'function') {
            addUserRealtimeNotification({
                id: `interest_acc_${peerId}_${Date.now()}`,
                icon: 'fa-heart',
                title: `🎉 ${resolvedName} accepted your interest request!`,
                desc: 'Match accepted! Safe text chat & family contact are now unlocked.',
                time: 'Just now',
                unread: true,
                actionType: 'chat',
                actionTarget: String(peerId)
            });
        }
    } else if (isMeSender && dbInterest.status === 'declined') {
        if (typeof addUserRealtimeNotification === 'function') {
            addUserRealtimeNotification({
                id: `interest_dec_${peerId}_${Date.now()}`,
                icon: 'fa-user-xmark',
                title: `${resolvedName} was unable to accept`,
                desc: 'Explore more verified community profiles in Browse.',
                time: 'Just now',
                unread: false,
                actionType: 'screen',
                actionTarget: 'scr-browse'
            });
        }
    }
}

function handleRealtimeInterestInsert(dbInterest) {
    if (!dbInterest || !state.currentUser) return;
    const myId = Number(state.currentUser.id);
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    const recId = Number(dbInterest.receiver_id);
    const recEmail = (dbInterest.receiver_email || '').trim().toLowerCase();

    if (recId === myId || (myEmail && recEmail === myEmail)) {
        const pid = Number(dbInterest.sender_id);
        if (!INCOMING_REQUESTS.some(r => Number(r.profileId) === pid)) {
            INCOMING_REQUESTS.unshift({
                id: dbInterest.id,
                profileId: pid,
                senderEmail: dbInterest.sender_email,
                senderName: dbInterest.sender_name,
                senderPhoto: dbInterest.sender_photo,
                senderCaste: dbInterest.sender_caste,
                senderCity: dbInterest.sender_city,
                status: 'pending',
                date: 'Just now'
            });
            saveSessionState();
            updateInboxBadge();
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id === 'scr-inbox') {
                renderInbox();
            }
            if (typeof addUserRealtimeNotification === 'function') {
                addUserRealtimeNotification({
                    id: `interest_in_${pid}_${Date.now()}`,
                    icon: 'fa-heart-circle-check',
                    title: `${dbInterest.sender_name || 'A member'} sent you an interest request`,
                    desc: 'Wants to connect with you. Visit your inbox to respond.',
                    time: 'Just now',
                    unread: true,
                    actionType: 'screen',
                    actionTarget: 'scr-inbox'
                });
            }
            showToast(`💍 Interest request received from ${dbInterest.sender_name || 'a member'}!`);
        }
    }
}

// Global Window Exports
if (typeof updateInboxBadge !== 'undefined') window.updateInboxBadge = updateInboxBadge;
if (typeof getInboxBadgeCount !== 'undefined') window.getInboxBadgeCount = getInboxBadgeCount;
if (typeof renderInbox !== 'undefined') window.renderInbox = renderInbox;
if (typeof openChatFor !== 'undefined') window.openChatFor = openChatFor;
if (typeof sendChatMessage !== 'undefined') window.sendChatMessage = sendChatMessage;
if (typeof setInboxTab !== 'undefined') window.setInboxTab = setInboxTab;
if (typeof syncUserInterests !== 'undefined') window.syncUserInterests = syncUserInterests;
if (typeof syncUserChatAndInterests !== 'undefined') window.syncUserChatAndInterests = syncUserChatAndInterests;
if (typeof initChatRealtimeListener !== 'undefined') window.initChatRealtimeListener = initChatRealtimeListener;
if (typeof showChatToast !== 'undefined') window.showChatToast = showChatToast;
if (typeof openChatFromToast !== 'undefined') window.openChatFromToast = openChatFromToast;
if (typeof closeChatToast !== 'undefined') window.closeChatToast = closeChatToast;
if (typeof interestStatusFor !== 'undefined') window.interestStatusFor = interestStatusFor;
if (typeof confirmSendInterest !== 'undefined') window.confirmSendInterest = confirmSendInterest;
if (typeof acceptRequest !== 'undefined') window.acceptRequest = acceptRequest;
if (typeof declineRequest !== 'undefined') window.declineRequest = declineRequest;
if (typeof promptDeleteChatMessage !== 'undefined') window.promptDeleteChatMessage = promptDeleteChatMessage;
if (typeof confirmDeleteChatMessage !== 'undefined') window.confirmDeleteChatMessage = confirmDeleteChatMessage;
if (typeof promptClearChatHistory !== 'undefined') window.promptClearChatHistory = promptClearChatHistory;
if (typeof confirmClearChatHistory !== 'undefined') window.confirmClearChatHistory = confirmClearChatHistory;
if (typeof CHAT_THREADS !== 'undefined') window.CHAT_THREADS = CHAT_THREADS;
if (typeof OUTGOING_REQUESTS !== 'undefined') window.OUTGOING_REQUESTS = OUTGOING_REQUESTS;
if (typeof INCOMING_REQUESTS !== 'undefined') window.INCOMING_REQUESTS = INCOMING_REQUESTS;

/**
 * ==============================================================================
 * REALTIME CHAT ONLINE / OFFLINE STATUS INDICATOR
 * ==============================================================================
 */
function updateChatOnlineStatus(targetPid) {
    const pid = targetPid !== undefined ? targetPid : (typeof state !== 'undefined' ? state.activeChatId : null);
    if (!pid) return;
    const p = (typeof findProfile === 'function') ? findProfile(pid) : null;
    const sEl = document.getElementById('chatStatusText');
    const dotEl = document.querySelector('.chat-online-dot');
    if (!sEl && !dotEl) return;

    let isOnline = false;
    const checkFn = (typeof isUserOnline === 'function') ? isUserOnline : (typeof window !== 'undefined' ? window.isUserOnline : null);
    if (typeof checkFn === 'function') {
        isOnline = checkFn(p ? p.id : pid, p ? p.email : null);
    } else if (p && p.online !== undefined) {
        isOnline = Boolean(p.online);
    }

    if (sEl) {
        sEl.textContent = isOnline ? 'Online' : 'Offline';
        sEl.className = `chat-active-indicator ${isOnline ? 'online' : 'offline'}`;
    }
    if (dotEl) {
        dotEl.className = `chat-online-dot ${isOnline ? 'online' : 'offline'}`;
    }
}
window.updateChatOnlineStatus = updateChatOnlineStatus;

// Register presence updates to instantly refresh chat header status when active
const regFn = (typeof registerPresenceListener === 'function') ? registerPresenceListener : (typeof window !== 'undefined' ? window.registerPresenceListener : null);
if (typeof regFn === 'function') {
    regFn(() => {
        if (typeof state !== 'undefined' && state.activeChatId) {
            const chatScreen = document.getElementById('scr-chat');
            if (chatScreen && chatScreen.classList.contains('active')) {
                updateChatOnlineStatus(state.activeChatId);
            }
        }
    });
}

