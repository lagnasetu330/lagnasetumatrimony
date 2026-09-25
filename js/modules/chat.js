/* ============================================================ CHAT & INTEREST DATA (PRODUCTION) ============================================================ */
let INCOMING_REQUESTS = [];
let OUTGOING_REQUESTS = [];
let CHAT_THREADS = [];

function findProfile(id) { 
    if (!id) return null;
    const pid = Number(id);
    const strId = String(id).trim();

    // 1. Direct match in window.PROFILES (number or string)
    let p = (window.PROFILES || []).find(x => x && (x.id === id || String(x.id) === strId || (!isNaN(pid) && Number(x.id) === pid)));
    if (p) return p;

    // 2. Match by email if strId contains @
    if (strId.includes('@')) {
        p = (window.PROFILES || []).find(x => x && x.email && x.email.trim().toLowerCase() === strId.toLowerCase());
        if (p) return p;
    }

    // 3. Fallback: Lookup in INCOMING_REQUESTS and OUTGOING_REQUESTS
    const allReqs = [...(typeof INCOMING_REQUESTS !== 'undefined' ? INCOMING_REQUESTS : []), ...(typeof OUTGOING_REQUESTS !== 'undefined' ? OUTGOING_REQUESTS : [])];
    const matchedReq = allReqs.find(r => r && (Number(r.profileId) === pid || Number(r.senderId) === pid || Number(r.receiverId) === pid));
    if (matchedReq) {
        const isSender = Number(matchedReq.senderId) === pid;
        const reqEmail = (isSender ? matchedReq.senderEmail : matchedReq.receiverEmail) || '';
        if (reqEmail) {
            p = (window.PROFILES || []).find(x => x && x.email && x.email.trim().toLowerCase() === reqEmail.trim().toLowerCase());
            if (p) return p;
        }
        const name = (isSender ? matchedReq.senderName : matchedReq.receiverName) || 'Community Member';
        const img = (isSender ? matchedReq.senderPhoto : matchedReq.receiverPhoto) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
        return {
            id: pid,
            name: name,
            img: img,
            email: reqEmail,
            age: (isSender ? matchedReq.senderAge : matchedReq.receiverAge) || 24,
            city: (isSender ? matchedReq.senderCity : matchedReq.receiverCity) || 'Gujarat',
            community: (isSender ? matchedReq.senderCaste : matchedReq.receiverCaste) || 'Community Member'
        };
    }

    return null;
}

/* ============================================================ INTEREST REQUESTS ============================================================ */
function interestStatusFor(profileId) {
    const pid = Number(profileId);
    // 1. Check outgoing requests sent by me
    const out = OUTGOING_REQUESTS.find(r => Number(r.profileId) === pid);
    if (out) return out.status;

    // 2. Check incoming requests received by me
    const inc = INCOMING_REQUESTS.find(r => Number(r.profileId) === pid);
    if (inc) return inc.status;

    // 3. Check unlocked threads
    const thread = CHAT_THREADS.find(t => Number(t.profileId) === pid);
    if (thread && thread.messages && thread.messages.length > 0) return 'accepted';

    return null;
}

function openInterestModal(id) {
    const p = findProfile(id);
    if (!p) return;
    state.activeInterestId = id;
    const txtEl = document.getElementById('interestText');
    if (txtEl) {
        txtEl.textContent =
            `You're about to send an interest request to ${p.name}. They will receive an instant email notification on their registered email with your profile details. If they accept, safe text chat will unlock immediately.`;
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

    const pid = Number(id);
    const existing = OUTGOING_REQUESTS.find(r => Number(r.profileId) === pid);
    if (existing) {
        existing.status = 'pending';
        existing.date = 'Just now';
    } else {
        OUTGOING_REQUESTS.push({
            id: `int_${currentUsr.id}_${pid}`,
            profileId: pid,
            receiverEmail: p.email || '',
            receiverName: p.name || 'Member',
            status: 'pending',
            date: 'Just now'
        });
    }

    closeModal('modalInterest');
    showToast(`Interest request sent to ${p.name}! Email notification dispatched 💍`);
    refreshProfileButtons();
    updateInboxBadge();
    saveSessionState();

    // Persist to Supabase PostgreSQL & Send Notification Email with real sender photo
    if (typeof supabaseSendInterest === 'function') {
        try {
            const senderObj = resolveFullUserProfile(currentUsr);
            await supabaseSendInterest(senderObj, p);
            console.info('[Interest] Successfully persisted to Supabase for:', p.name);
        } catch (err) {
            console.warn('[Interest] Supabase error:', err);
        }
    }
}

/**
 * Helper to ensure real uploaded photo is always linked to user session
 */
function resolveFullUserProfile(userObj) {
    if (!userObj) return {};
    const normEmail = (userObj.email || '').toLowerCase().trim();
    const normId = String(userObj.id || userObj.userId || '');
    
    let found = (window.PROFILES || []).find(p => 
        (normId && String(p.id) === normId) ||
        (normEmail && p.email && p.email.toLowerCase().trim() === normEmail)
    );
    if (!found) {
        try {
            const raw = localStorage.getItem('LS_COMMUNITY_PROFILES');
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    found = list.find(p => 
                        (normId && String(p.id) === normId) ||
                        (normEmail && p.email && p.email.toLowerCase().trim() === normEmail)
                    );
                }
            }
        } catch(e) {}
    }

    const resolvedPhoto = (found && (found.img || (Array.isArray(found.photos) ? found.photos[0] : ''))) ||
                          userObj.img || userObj.photo || (Array.isArray(userObj.photos) ? userObj.photos[0] : '') ||
                          (typeof state !== 'undefined' && state.regData && (state.regData.photo || (Array.isArray(state.regData.photos) ? state.regData.photos[0] : ''))) || '';

    return {
        ...userObj,
        ...(found || {}),
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

        // Canonical peer ID resolver by email
        function getCanonicalPeerId(rawPid, rawEmail) {
            if (rawEmail) {
                const norm = rawEmail.trim().toLowerCase();
                const matched = (window.PROFILES || []).find(prof => prof && prof.email && prof.email.trim().toLowerCase() === norm);
                if (matched && matched.id) return Number(matched.id);
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
                isRead: !!m.isRead,
                createdAt: m.createdAt
            });
        });

        // 3. Reconstruct CHAT_THREADS
        const updatedThreads = [];
        const processedPeers = new Set();

        // A. Add threads for accepted matches from interests
        [...INCOMING_REQUESTS, ...OUTGOING_REQUESTS].forEach(r => {
            if (r.status === 'accepted') {
                const pid = Number(r.profileId);
                if (pid === myId || (myProfId && pid === myProfId)) return;
                if (typeof isSelfProfile === 'function' && isSelfProfile(pid)) return;
                if (!processedPeers.has(pid)) {
                    processedPeers.add(pid);
                    const msgs = messagesByPeer.get(pid) || [];
                    const peerProf = findProfile(pid);
                    updatedThreads.push({
                        profileId: pid,
                        peerEmail: r.senderEmail === myEmail ? r.receiverEmail : r.senderEmail,
                        name: peerProf ? peerProf.name : (r.senderName === state.currentUser.name ? r.receiverName : r.senderName),
                        img: peerProf ? peerProf.img : (r.senderPhoto === (state.currentUser.photo || state.currentUser.img) ? r.receiverPhoto : r.senderPhoto),
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
                const peerProf = findProfile(pid);
                updatedThreads.push({
                    profileId: pid,
                    name: peerProf ? peerProf.name : 'Community Member',
                    img: peerProf ? peerProf.img : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
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
    const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    const p = (pid ? findProfile(pid) : null) || {
        id: pid || 0,
        name: r.senderName || r.receiverName || 'Community Member',
        img: r.senderPhoto || r.receiverPhoto || fallbackAvatar,
        age: r.senderAge || r.receiverAge || 24,
        city: r.senderCity || r.receiverCity || 'Gujarat',
        community: r.senderCaste || r.receiverCaste || 'Community Member'
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

    card.innerHTML = `
            <img src="${p.img || fallbackAvatar}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:52px;height:52px;border-radius:14px;object-fit:cover;flex-shrink:0;" alt="${escapeHtml(p.name || '')}">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:800;font-size:14px;">${escapeHtml(p.name || 'Community Member')}${p.age ? ', ' + p.age : ''}</div>
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
    let p = findProfile(pid);
    if (!p) {
        p = {
            id: pid,
            name: t.name || t.peerName || 'Community Member',
            img: t.img || t.peerAvatar || fallbackAvatar
        };
    }
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
                <img src="${p.img || fallbackAvatar}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:52px;height:52px;border-radius:14px;object-fit:cover;display:block;" alt="${escapeHtml(p.name || '')}">
                ${unreadCount > 0 ? '<span style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:linear-gradient(135deg,#e63946,#d90429);border:2px solid #fff;"></span>' : ''}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                <span style="font-weight:800;font-size:14px;color:var(--text);">${escapeHtml(p.name || t.name || 'Community Member')}</span>
                <span class="p-muted" style="font-size:11px;font-weight:600;">${last && last.time ? last.time : ''}</span>
              </div>
              <div class="p-muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${unreadCount > 0 ? 'font-weight:700;color:var(--primary);' : ''}">
                ${metaSnippet}
              </div>
            </div>
            ${unreadBadgeHtml}
            <i class="fa-solid fa-chevron-right chev" style="color:var(--text-faint);font-size:12px;margin-left:4px;"></i>`;
    card.addEventListener('click', () => openChatFor(p.id));
    return card;
}

async function acceptRequest(profileId) {
    const pid = Number(profileId);
    const r = INCOMING_REQUESTS.find(x => Number(x.profileId) === pid);
    if (r) r.status = 'accepted';
    if (!CHAT_THREADS.find(t => Number(t.profileId) === pid)) {
        CHAT_THREADS.push({ profileId: pid, messages: [] });
    }
    const p = findProfile(pid);
    const pName = p ? p.name : 'Member';
    showToast(`Matched with ${pName}! Safe text chat unlocked 🎉`);
    saveSessionState();
    renderInbox();
    updateInboxBadge();
    refreshProfileButtons();

    // Persist to Supabase and send congratulatory email to sender
    if (typeof supabaseUpdateInterestStatus === 'function') {
        const interestId = (r && r.id) || `int_${pid}_${state.currentUser.id}`;
        try {
            const receiverObj = resolveFullUserProfile(state.currentUser);
            await supabaseUpdateInterestStatus(interestId, 'accepted', p, receiverObj);
        } catch (e) {
            console.warn('[Interest] Update status error:', e);
        }
    }
}

async function declineRequest(profileId) {
    const pid = Number(profileId);
    const r = INCOMING_REQUESTS.find(x => Number(x.profileId) === pid);
    if (r) r.status = 'declined';
    const p = findProfile(pid);
    showToast('Request declined');
    saveSessionState();
    renderInbox();
    updateInboxBadge();
    refreshProfileButtons();

    // Persist to Supabase and send polite notification to sender
    if (typeof supabaseUpdateInterestStatus === 'function') {
        const interestId = (r && r.id) || `int_${pid}_${state.currentUser.id}`;
        try {
            const receiverObj = resolveFullUserProfile(state.currentUser);
            await supabaseUpdateInterestStatus(interestId, 'declined', p, receiverObj);
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
    const p = findProfile(pid);
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

    let thread = CHAT_THREADS.find(t => Number(t.profileId) === pid);
    if (!thread) { thread = { profileId: pid, messages: [] }; CHAT_THREADS.push(thread); }

    const peerEmail = (p && p.email) ? p.email.trim().toLowerCase() : ((thread && thread.peerEmail) ? thread.peerEmail.trim().toLowerCase() : '');
    const fallbackAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    const peerName = (p && p.name) || (thread && thread.name) || 'Community Member';
    const peerImg = (p && p.img) || (thread && thread.img) || fallbackAvatar;

    state.activeChatId = pid;
    cancelChatEdit();
    closeAllChatActions();

    // Mark all incoming messages in this thread as read immediately
    let hadUnread = false;
    if (thread && Array.isArray(thread.messages)) {
        thread.messages.forEach(m => {
            if (m.from === 'them' && (!m.isRead || !m.is_read)) {
                m.isRead = true;
                m.is_read = true;
                hadUnread = true;
            }
        });
    }
    if (hadUnread) {
        updateInboxBadge();
    }
    saveSessionState();

    if (typeof supabaseMarkMessagesAsRead === 'function' && state.currentUser && state.currentUser.id) {
        supabaseMarkMessagesAsRead(state.currentUser.id, pid, myEmail, peerEmail).catch(e => console.warn('[Chat] Mark read note:', e));
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
        supabaseFetchChatMessages(state.currentUser.id, pid, myEmail, peerEmail).then(dbMsgs => {
            if (Array.isArray(dbMsgs) && dbMsgs.length > 0) {
                // Ensure messages from peer are marked as read since chat is currently open
                dbMsgs.forEach(m => {
                    if (m.from === 'them') m.isRead = true;
                });

                // SMART MERGE: Never discard existing thread messages, deduplicate by id
                const msgMap = new Map();
                (thread.messages || []).forEach(m => {
                    if (m && m.id) msgMap.set(m.id, m);
                });
                dbMsgs.forEach(m => {
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
                    supabaseMarkMessagesAsRead(state.currentUser.id, pid, myEmail, peerEmail).catch(() => {});
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
            supabaseDeleteChatMessageForMe(pendingDeleteMsgId, state.currentUser.id).catch(e => console.warn('[Chat] Delete for me error:', e));
        }
    }

    pendingDeleteMsgId = null;
    closeModal('modalDeleteChatMsg');
}

function promptClearChatHistory() {
    const thread = CHAT_THREADS.find(t => t.profileId === state.activeChatId);
    if (!thread || !thread.messages || thread.messages.length === 0) {
        showToast('Chat is already empty');
        return;
    }
    openModal('modalClearChat');
}

function confirmClearChatHistory() {
    const thread = CHAT_THREADS.find(t => String(t.profileId) === String(state.activeChatId) || Number(t.profileId) === Number(state.activeChatId));
    if (thread) {
        if (editingMessageId) cancelChatEdit();
        thread.messages = [];
        saveSessionState();
        renderChatMessages();
        updateInboxBadge();
        showToast('Chat history cleared');

        if (typeof supabaseClearUserChat === 'function' && state.currentUser && state.currentUser.id && state.activeChatId) {
            const peer = findProfile(state.activeChatId);
            supabaseClearUserChat(state.currentUser.id, state.activeChatId, state.currentUser.email, peer ? peer.email : '').catch(e => console.warn('[Chat] Clear chat error:', e));
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
        supabaseSaveChatMessage({
            id: newMsg.id,
            senderId: state.currentUser.id,
            receiverId: state.activeChatId,
            senderEmail: state.currentUser.email,
            receiverEmail: peer ? peer.email : '',
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

    if (avatarEl) avatarEl.src = senderProfile?.img || senderProfile?.photo || 'images/default_avatar.png';
    if (senderEl) senderEl.textContent = senderProfile?.name || 'Community Match';
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

    const isMeSender = (myId && senderId === myId) || (myEmail && senderEmail === myEmail);
    const isMeReceiver = (myId && receiverId === myId) || (myEmail && receiverEmail === myEmail);

    if (!isMeSender && !isMeReceiver) return;

    const peerId = isMeSender ? receiverId : senderId;
    const peerEmail = isMeSender ? receiverEmail : senderEmail;

    // Find thread by peerId OR by peer profile found via email
    let thread = CHAT_THREADS.find(t => Number(t.profileId) === peerId);
    if (!thread && peerEmail) {
        const p = (window.PROFILES || []).find(prof => prof && prof.email && prof.email.toLowerCase().trim() === peerEmail);
        if (p) {
            thread = CHAT_THREADS.find(t => Number(t.profileId) === Number(p.id));
        }
    }
    if (!thread) {
        thread = { profileId: peerId, messages: [] };
        CHAT_THREADS.push(thread);
    }

    if (thread.messages.some(m => m.id === dbMsg.id)) return;

    const activeScreen = document.querySelector('.screen.active');
    const isInThisChat = activeScreen && activeScreen.id === 'scr-chat' && (Number(state.activeChatId) === peerId || (thread && Number(state.activeChatId) === Number(thread.profileId)));

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
        createdAt: dbMsg.created_at
    };

    thread.messages.push(incomingObj);
    // Move updated thread to the top of CHAT_THREADS so it pops up in Inbox
    const threadIdx = CHAT_THREADS.indexOf(thread);
    if (threadIdx > 0) {
        CHAT_THREADS.splice(threadIdx, 1);
        CHAT_THREADS.unshift(thread);
    }
    saveSessionState();

    if (isInThisChat) {
        renderChatMessages();
        setTimeout(() => scrollChatToBottom(true), 40);
        if (!isMeSender && typeof supabaseMarkMessagesAsRead === 'function') {
            supabaseMarkMessagesAsRead(myId, peerId, myEmail, peerEmail).catch(() => {});
        }
    } else {
        updateInboxBadge();
        if (activeScreen && activeScreen.id === 'scr-inbox') {
            renderInbox();
        }
        if (!isMeSender) {
            const peer = findProfile(peerId) || {
                name: dbMsg.sender_name || 'Community Match',
                img: dbMsg.sender_photo || 'images/default_avatar.png'
            };
            showChatToast(peer, dbMsg.text, peerId);
            if (typeof addUserRealtimeNotification === 'function') {
                const activeScr = document.querySelector('.screen.active');
                if (!activeScr || activeScr.id !== 'scr-chat') {
                    addUserRealtimeNotification({
                        id: `msg_${dbMsg.id || Date.now()}`,
                        icon: 'fa-comment-dots',
                        title: `New message from ${peer.name}`,
                        desc: String(dbMsg.text || 'Sent you a message').slice(0, 70),
                        time: 'Just now',
                        unread: true,
                        actionType: 'chat',
                        actionTarget: String(peerId)
                    });
                }
            }
        }
    }
}

function handleRealtimeMessageUpdate(dbMsg) {
    if (!dbMsg || !state.currentUser) return;
    const myId = state.currentUser.id;
    const myEmail = (state.currentUser.email || '').trim().toLowerCase();
    
    // Check if THIS user deleted or cleared this message
    const deletedForMe = typeof isUserInDeletedList === 'function'
        ? (isUserInDeletedList(dbMsg.deleted_for_users, myId) || (myEmail && isUserInDeletedList(dbMsg.deleted_for_users, myEmail)))
        : (Array.isArray(dbMsg.deleted_for_users) && (dbMsg.deleted_for_users.includes(myId) || dbMsg.deleted_for_users.includes(Number(myId)) || dbMsg.deleted_for_users.includes(String(myId)) || (myEmail && dbMsg.deleted_for_users.includes(myEmail))));

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
            m.isRead = !!dbMsg.is_read;
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

    if (dbInterest.status === 'accepted') {
        if (!CHAT_THREADS.find(t => Number(t.profileId) === peerId)) {
            CHAT_THREADS.push({ profileId: peerId, messages: [] });
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
        const peer = findProfile(peerId) || { name: dbInterest.receiver_name || 'Member' };
        showToast(`🎉 ${peer.name} accepted your interest request! Safe text chat is now unlocked.`);
        if (typeof addUserRealtimeNotification === 'function') {
            addUserRealtimeNotification({
                id: `interest_acc_${peerId}_${Date.now()}`,
                icon: 'fa-heart',
                title: `🎉 ${peer.name} accepted your interest request!`,
                desc: 'Match accepted! Safe text chat is now unlocked.',
                time: 'Just now',
                unread: true,
                actionType: 'chat',
                actionTarget: String(peerId)
            });
        }
    } else if (isMeSender && dbInterest.status === 'declined') {
        const peer = findProfile(peerId) || { name: dbInterest.receiver_name || 'Member' };
        if (typeof addUserRealtimeNotification === 'function') {
            addUserRealtimeNotification({
                id: `interest_dec_${peerId}_${Date.now()}`,
                icon: 'fa-user-xmark',
                title: `${peer.name} was unable to accept`,
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

