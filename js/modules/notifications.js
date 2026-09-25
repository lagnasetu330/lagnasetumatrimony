/* ============================================================
   LAGNA SETU — REAL-TIME USER NOTIFICATION SYSTEM
   Dynamic, persistent, and live Supabase connected notifications
   ============================================================ */

/**
 * Storage key for active user's notifications
 */
function getUserNotifsStorageKey() {
    let uid = 'guest';
    if (typeof state !== 'undefined' && state && state.currentUser) {
        uid = state.currentUser.id || state.currentUser.email || 'guest';
    } else {
        try {
            const raw = sessionStorage.getItem('lagnaSetu_currentUser') || localStorage.getItem('lagnaSetu_activeUser');
            if (raw) {
                const u = JSON.parse(raw);
                if (u && (u.id || u.email)) uid = u.id || u.email;
            }
        } catch (_) {}
    }
    return `LS_USER_NOTIFS_${String(uid).toLowerCase().trim()}`;
}

/**
 * Get cached notifications for current user
 */
function getUserNotifications() {
    try {
        const key = getUserNotifsStorageKey();
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

/**
 * Save notifications for current user
 */
function saveUserNotifications(notifs) {
    try {
        const key = getUserNotifsStorageKey();
        localStorage.setItem(key, JSON.stringify(notifs || []));
    } catch (e) {}
}

/**
 * Add a new real-time notification
 */
function addUserRealtimeNotification(notif) {
    if (!notif || !notif.title) return;
    const list = getUserNotifications();

    const newEntry = {
        id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        icon: notif.icon || 'fa-bell',
        title: notif.title,
        desc: notif.desc || '',
        time: notif.time || 'Just now',
        timestamp: notif.timestamp || Date.now(),
        unread: notif.unread !== undefined ? notif.unread : true,
        actionType: notif.actionType || '',
        actionTarget: notif.actionTarget || ''
    };

    // Avoid exact duplicate within 5 seconds
    const isDup = list.some(x => x.title === newEntry.title && Math.abs((x.timestamp || 0) - newEntry.timestamp) < 5000);
    if (!isDup) {
        list.unshift(newEntry);
        saveUserNotifications(list);
    }

    updateUserNotifBadge();
    const activeScr = document.querySelector('.screen.active');
    if (activeScr && activeScr.id === 'scr-notifs') {
        renderUserNotifs();
    }
}

/**
 * Sync real notifications based on actual user activity (Interests, Profile, Membership)
 */
function syncUserNotificationsFromData() {
    if (!state.currentUser) return;
    const existing = getUserNotifications();
    const existingIds = new Set(existing.map(n => n.id));
    const newItems = [];

    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl');
    const isBoy = !isGirl;

    // 1. Incoming Interests (Real received requests)
    if (Array.isArray(window.INCOMING_REQUESTS)) {
        window.INCOMING_REQUESTS.forEach(req => {
            const idPending = `interest_in_${req.profileId || req.id}_pending`;
            const idAccepted = `interest_in_${req.profileId || req.id}_accepted`;
            const name = req.senderName || 'A member';

            if (req.status === 'pending' && !existingIds.has(idPending)) {
                newItems.push({
                    id: idPending,
                    icon: 'fa-heart-circle-check',
                    title: `${name} sent you an interest request`,
                    desc: 'Wants to connect with you. Open Inbox to accept or decline.',
                    time: req.date || 'Recent',
                    timestamp: Date.now() - 300000,
                    unread: true,
                    actionType: 'screen',
                    actionTarget: 'scr-inbox'
                });
                existingIds.add(idPending);
            } else if (req.status === 'accepted' && !existingIds.has(idAccepted)) {
                newItems.push({
                    id: idAccepted,
                    icon: 'fa-comments',
                    title: `You accepted ${name}'s interest request`,
                    desc: 'Chat is now unlocked! Start a conversation anytime.',
                    time: req.date || 'Recent',
                    timestamp: Date.now() - 600000,
                    unread: false,
                    actionType: 'chat',
                    actionTarget: String(req.profileId)
                });
                existingIds.add(idAccepted);
            }
        });
    }

    // 2. Outgoing Interests (Responses from other members)
    if (Array.isArray(window.OUTGOING_REQUESTS)) {
        window.OUTGOING_REQUESTS.forEach(req => {
            const idAccepted = `interest_out_${req.profileId || req.id}_accepted`;
            const idDeclined = `interest_out_${req.profileId || req.id}_declined`;
            const name = req.receiverName || 'Your match';

            if (req.status === 'accepted' && !existingIds.has(idAccepted)) {
                newItems.push({
                    id: idAccepted,
                    icon: 'fa-heart',
                    title: `🎉 ${name} accepted your interest request!`,
                    desc: 'Match made! Safe direct chat is now unlocked.',
                    time: req.date || 'Recent',
                    timestamp: Date.now() - 200000,
                    unread: true,
                    actionType: 'chat',
                    actionTarget: String(req.profileId)
                });
                existingIds.add(idAccepted);
            } else if (req.status === 'declined' && !existingIds.has(idDeclined)) {
                newItems.push({
                    id: idDeclined,
                    icon: 'fa-user-xmark',
                    title: `${name} was unable to accept`,
                    desc: 'Explore more verified community profiles in Browse.',
                    time: req.date || 'Recent',
                    timestamp: Date.now() - 500000,
                    unread: false,
                    actionType: 'screen',
                    actionTarget: 'scr-browse'
                });
                existingIds.add(idDeclined);
            }
        });
    }

    // 3. Account Verification Status
    const accNotifId = `acc_verified_${state.currentUser.id || 'me'}`;
    if (!existingIds.has(accNotifId) && state.profileComplete) {
        newItems.push({
            id: accNotifId,
            icon: 'fa-shield-check',
            title: 'Profile verified & published',
            desc: `Your profile is live in the ${state.currentUser.community || 'Community'} directory.`,
            time: 'Active',
            timestamp: Date.now() - 86400000,
            unread: false,
            actionType: 'screen',
            actionTarget: 'scr-profile'
        });
        existingIds.add(accNotifId);
    }

    // 4. Membership Pass Status
    const memNotifId = `mem_status_${state.currentUser.id || 'me'}`;
    if (!existingIds.has(memNotifId)) {
        if (isGirl) {
            newItems.push({
                id: memNotifId,
                icon: 'fa-crown',
                title: 'Lifetime 100% Free Pass Active',
                desc: 'Community daughters have guaranteed free access for life.',
                time: 'Lifetime',
                timestamp: Date.now() - 172800000,
                unread: false,
                actionType: 'screen',
                actionTarget: 'scr-home'
            });
            existingIds.add(memNotifId);
        } else {
            const isPaid = state.currentUser.paymentStatus === 'Paid' || state.currentUser.paymentStatus === 'Active' || state.membershipPaid;
            if (isPaid) {
                newItems.push({
                    id: memNotifId,
                    icon: 'fa-crown',
                    title: '30-Day Pass Active (₹49)',
                    desc: 'Full access unlocked: direct family contact & unlimited chat.',
                    time: 'Active',
                    timestamp: Date.now() - 172800000,
                    unread: false,
                    actionType: 'screen',
                    actionTarget: 'scr-membership'
                });
                existingIds.add(memNotifId);
            } else {
                newItems.push({
                    id: memNotifId,
                    icon: 'fa-bolt',
                    title: 'Activate Boys 30-Day Pass (₹49)',
                    desc: 'Unlock direct mobile numbers of verified bride families & live chat.',
                    time: 'Action required',
                    timestamp: Date.now() - 3600000,
                    unread: true,
                    actionType: 'screen',
                    actionTarget: 'scr-membership'
                });
                existingIds.add(memNotifId);
            }
        }
    }

    // Merge and save
    if (newItems.length > 0) {
        const merged = [...newItems, ...existing];
        saveUserNotifications(merged);
    }
}

/**
 * Render the User Notification screen (scr-notifs)
 */
function renderUserNotifs() {
    const wrap = document.getElementById('notifListWrap');
    if (!wrap) return;

    syncUserNotificationsFromData();
    const notifs = getUserNotifications();

    if (!notifs || notifs.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state" style="padding:60px 20px;text-align:center;">
                <div style="width:72px;height:72px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">
                    <i class="fa-solid fa-bell-slash"></i>
                </div>
                <h3 style="font-weight:800;font-size:17px;color:var(--text);margin-bottom:6px;">No notifications yet</h3>
                <p class="p-muted" style="font-size:13px;max-width:280px;margin:0 auto;">
                    Incoming interest requests, match acceptances, and account updates will appear here.
                </p>
            </div>`;
        updateUserNotifBadge();
        return;
    }

    const esc = (typeof escapeHtml === 'function') ? escapeHtml : (s => String(s || ''));

    let html = '';
    notifs.forEach(n => {
        const unreadCls = n.unread ? ' unread' : '';
        const icon = (n.icon || 'fa-bell').replace(/[^a-zA-Z0-9_-]/g, '');
        html += `
            <div class="notif-item${unreadCls}" onclick="handleUserNotifClick('${n.id}')" style="cursor:pointer;">
                <div class="nicon"><i class="fa-solid ${icon}"></i></div>
                <div style="flex:1;min-width:0;">
                    <div class="ntxt">${esc(n.title)}</div>
                    <div class="nsub" style="word-break:break-word;">${esc(n.desc)}</div>
                    <div class="ntime">${esc(n.time)}</div>
                </div>
                ${n.unread ? '<div class="notif-dot"></div>' : ''}
            </div>`;
    });

    wrap.innerHTML = html;
    updateUserNotifBadge();
}

/**
 * Handle notification click action
 */
function handleUserNotifClick(notifId) {
    const notifs = getUserNotifications();
    const target = notifs.find(n => n.id === notifId);
    if (!target) return;

    // Mark as read
    target.unread = false;
    saveUserNotifications(notifs);
    updateUserNotifBadge();

    // Re-render list
    const activeScr = document.querySelector('.screen.active');
    if (activeScr && activeScr.id === 'scr-notifs') {
        renderUserNotifs();
    }

    // Trigger target action
    if (target.actionType === 'chat' && target.actionTarget) {
        if (typeof openChatWithProfile === 'function') {
            openChatWithProfile(target.actionTarget);
        } else if (typeof openChat === 'function') {
            openChat(target.actionTarget);
        } else {
            go('scr-inbox');
        }
    } else if (target.actionType === 'screen' && target.actionTarget) {
        go(target.actionTarget);
    }
}

/**
 * Mark all notifications as read
 * @param {boolean} [silent=false] If true, skip toast
 */
function markAllUserNotifsAsRead(silent) {
    const notifs = getUserNotifications();
    if (!notifs || notifs.length === 0) return;
    let changed = false;
    notifs.forEach(n => {
        if (n.unread) {
            n.unread = false;
            changed = true;
        }
    });
    if (changed) {
        saveUserNotifications(notifs);
        updateUserNotifBadge();
    }
    renderUserNotifs();
    if (!silent && typeof showToast === 'function') {
        showToast('All notifications marked as read');
    }
}

/**
 * Update the notification badge on home screen and menus (matches Admin count display)
 */
function updateUserNotifBadge() {
    const notifs = getUserNotifications();
    const unreadCount = Array.isArray(notifs) ? notifs.filter(n => n.unread).length : 0;
    const countText = unreadCount > 9 ? '9+' : String(unreadCount);

    // 1. Header bell button badge on scr-home (#userNotifBadge)
    const badge = document.getElementById('userNotifBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'block';
            badge.textContent = countText;
        } else {
            badge.style.display = 'none';
            badge.textContent = '0';
        }
    }

    // Safety: Remove any legacy static spans from the bell button
    const bellBtn = document.getElementById('userNotifBellBtn') || document.querySelector("#scr-home button[onclick*='scr-notifs']");
    if (bellBtn) {
        const legacySpans = bellBtn.querySelectorAll("span:not(#userNotifBadge)");
        legacySpans.forEach(s => s.remove());
    }

    // 2. Desktop sidebar badge (#dsNotifBadge)
    const dsBadge = document.getElementById('dsNotifBadge');
    if (dsBadge) {
        if (unreadCount > 0) {
            dsBadge.style.display = 'block';
            dsBadge.textContent = countText;
        } else {
            dsBadge.style.display = 'none';
            dsBadge.textContent = '0';
        }
    }

    // 3. Side menu notification badge (#userMenuNotifBadge)
    const menuBadge = document.getElementById('userMenuNotifBadge');
    if (menuBadge) {
        if (unreadCount > 0) {
            menuBadge.style.display = 'inline-block';
            menuBadge.textContent = countText;
        } else {
            menuBadge.style.display = 'none';
            menuBadge.textContent = '0';
        }
    }
}

// Global Window Exports
window.getUserNotifications = getUserNotifications;
window.saveUserNotifications = saveUserNotifications;
window.addUserRealtimeNotification = addUserRealtimeNotification;
window.syncUserNotificationsFromData = syncUserNotificationsFromData;
window.renderUserNotifs = renderUserNotifs;
window.handleUserNotifClick = handleUserNotifClick;
window.markAllUserNotifsAsRead = markAllUserNotifsAsRead;
window.updateUserNotifBadge = updateUserNotifBadge;
