/* ============================================================ ADMIN UI & NAVIGATION ============================================================ */
        /* ============================================================ NAVIGATION ============================================================ */
        const APP_SCREENS = new Set(['scr-dashboard', 'scr-users', 'scr-userdetail',
            'scr-interests', 'scr-interestdetail', 'scr-chatmonitor',
            'scr-payments', 'scr-analytics', 'scr-profiles', 'scr-castes', 'scr-reports', 'scr-notifs', 'scr-help', 'scr-settings'
        ]);

        function navKeyFor(id) {
            if (id === 'scr-userdetail') return 'scr-users';
            if (id === 'scr-interestdetail' || id === 'scr-chatmonitor') return 'scr-interests';
            return id;
        }

        function updateDesktopNav(id) {
            if (document.body && document.body.classList && typeof document.body.classList.toggle === 'function') {
                document.body.classList.toggle('sidebar-active', APP_SCREENS.has(id));
            }
            const key = navKeyFor(id);
            document.querySelectorAll('.desktop-sidebar .ds-item[data-nav]').forEach(btn => {
                if (btn && btn.classList) {
                    btn.classList.toggle('active', !!key && btn.dataset && btn.dataset.nav === key);
                }
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        var _adminLoaderStartTime = 0;
        var _adminLoaderAutoHideTimer = null;
        var _adminLoaderSafetyTimer = null;

        function showGlobalLoader(text = 'Loading Admin Console...', minDuration = 0) {
            if (typeof document === 'undefined') return;

            const loader = document.getElementById('globalPageLoader');
            const txtEl = document.getElementById('globalLoaderText');
            if (txtEl) txtEl.textContent = text;
            if (loader) {
                loader.classList.add('active');
                loader.style.display = 'flex';
                loader.style.opacity = '1';
                loader.style.visibility = 'visible';
                loader.style.pointerEvents = 'all';
            }

            const routeLoader = document.getElementById('adminGlobalLoader') || document.getElementById('pageRouteLoader');
            const routeTxt = document.getElementById('adminGlobalLoaderText') || document.getElementById('pageRouteLoaderText');
            if (routeTxt) routeTxt.textContent = text;
            if (routeLoader) {
                routeLoader.classList.add('open');
                routeLoader.style.display = 'flex';
            }

            _adminLoaderStartTime = Date.now();

            if (_adminLoaderAutoHideTimer) {
                clearTimeout(_adminLoaderAutoHideTimer);
                _adminLoaderAutoHideTimer = null;
            }
            if (_adminLoaderSafetyTimer) {
                clearTimeout(_adminLoaderSafetyTimer);
                _adminLoaderSafetyTimer = null;
            }

            if (minDuration > 0) {
                _adminLoaderAutoHideTimer = setTimeout(() => {
                    hideGlobalLoader();
                }, minDuration);
            }

            _adminLoaderSafetyTimer = setTimeout(() => {
                hideGlobalLoader(true);
            }, 2000);
        }

        function hideGlobalLoader(force = false) {
            if (_adminLoaderAutoHideTimer) {
                clearTimeout(_adminLoaderAutoHideTimer);
                _adminLoaderAutoHideTimer = null;
            }
            if (_adminLoaderSafetyTimer) {
                clearTimeout(_adminLoaderSafetyTimer);
                _adminLoaderSafetyTimer = null;
            }

            const doHide = () => {
                if (typeof document === 'undefined') return;

                const loader = document.getElementById('globalPageLoader');
                if (loader) {
                    loader.classList.remove('active');
                    loader.style.opacity = '0';
                    loader.style.visibility = 'hidden';
                    loader.style.pointerEvents = 'none';
                    loader.style.display = 'none';
                }
                const routeLoader = document.getElementById('adminGlobalLoader');
                if (routeLoader) {
                    routeLoader.classList.remove('open');
                    routeLoader.style.display = 'none';
                }
                const pageLoader = document.getElementById('pageRouteLoader');
                if (pageLoader) {
                    pageLoader.classList.remove('open');
                    pageLoader.style.display = 'none';
                }
                const preloadStyle = document.getElementById('spa-preload-css');
                if (preloadStyle) preloadStyle.remove();
                if (document.documentElement) {
                    document.documentElement.classList.remove('bypassing-splash');
                }
            };

            if (force) {
                doHide();
                return;
            }

            const elapsed = Date.now() - _adminLoaderStartTime;
            const minWait = 100;
            if (elapsed < minWait && _adminLoaderStartTime > 0) {
                setTimeout(doHide, minWait - elapsed);
            } else {
                doHide();
            }
        }

        window.showGlobalLoader = showGlobalLoader;
        window.hideGlobalLoader = hideGlobalLoader;

        function go(id, replace) {
            // Strict Auth Guard: Protect all administrative screens from unauthorized console access
            const publicScreens = new Set(['scr-splash', 'scr-login', 'scr-forgot', 'scr-forgot-otp', 'scr-newpass']);
            const isAuth = (typeof isSessionValidSync === 'function')
                ? isSessionValidSync()
                : (sessionStorage.getItem('admin_isLoggedIn') === 'true' && !!sessionStorage.getItem('admin_session_token'));

            if (!isAuth && !publicScreens.has(id)) {
                id = 'scr-login';
            }
            if (id === 'scr-login') {
                hideGlobalLoader(true);
            }

            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const targetEl = document.getElementById(id);
            if (targetEl) {
                targetEl.classList.add('active');
                targetEl.scrollTop = 0;
            }
            if (!replace) state.history.push(id);
            if (isAuth && !publicScreens.has(id)) {
                sessionStorage.setItem('admin_activeScreen', id);
            }
            if (id === 'scr-dashboard') {
                renderDashboard();
                if (typeof syncAdminDataFromSupabase === 'function') syncAdminDataFromSupabase();
            }
            if (id === 'scr-users') {
                renderUsers();
                if (typeof supabaseFetchAllProfilesForAdmin === 'function') {
                    supabaseFetchAllProfilesForAdmin().then(remoteProfiles => {
                        if (Array.isArray(remoteProfiles)) {
                            USERS = remoteProfiles.filter(u => u && u.accountStatus !== 'deleted' && (typeof isUserPurged !== 'function' || !isUserPurged(u)));
                            window.USERS = USERS;
                            renderUsers();
                            if (typeof renderDashboard === 'function') renderDashboard();
                        }
                    }).catch(() => {});
                }
            }
            if (id === 'scr-interests') renderInterests();
            if (id === 'scr-payments') renderPayments();
            if (id === 'scr-analytics') { if (typeof renderAnalyticsPage === 'function') renderAnalyticsPage(); }
            if (id === 'scr-profiles') renderProfileMgmt();
            if (id === 'scr-castes') renderCastes();
            if (id === 'scr-reports') {
                renderReports();
                if (typeof supabaseFetchReportsForAdmin === 'function') {
                    supabaseFetchReportsForAdmin().then(reps => {
                        REPORTS = reps;
                        window.REPORTS = REPORTS;
                        renderReports();
                    }).catch(() => {});
                }
            }
            if (id === 'scr-notifs' && typeof renderNotifs === 'function') renderNotifs();
            if (id === 'scr-help' && typeof renderHelp === 'function') renderHelp();
            if (id === 'scr-settings' && typeof syncSettingsUI === 'function') syncSettingsUI();
            else if (id === 'scr-settings' && typeof window !== 'undefined' && typeof window.syncSettingsUI === 'function') window.syncSettingsUI();
            if (typeof updateAdminNotifBadge === 'function') updateAdminNotifBadge();
            updateDesktopNav(id);
            window.scrollTo(0, 0);
        }

        function goBack() {
            const current = state.history.pop();
            let prev = state.history[state.history.length - 1];
            if (!prev || prev === 'scr-splash' || prev === 'scr-login' || prev === current) {
                if (current === 'scr-userdetail') prev = 'scr-users';
                else if (current === 'scr-interestdetail' || current === 'scr-chatmonitor') prev = 'scr-interests';
                else prev = 'scr-dashboard';
            }
            go(prev, true);
        }

        /* ============================================================ TOAST / MODALS ============================================================ */
        var toastTimer;

        function showToast(msg) {
            const t = document.getElementById('toast');
            if (!t) return;
            const msgEl = document.getElementById('toastMsg');
            if (msgEl) msgEl.textContent = msg || '';
            t.classList.add('show');
            clearTimeout(toastTimer);
            // Adaptive duration: 2.8s base, extending up to 5.5s for longer messages
            const textLen = String(msg || '').length;
            const duration = Math.min(5500, Math.max(2800, textLen * 50));
            toastTimer = setTimeout(() => t.classList.remove('show'), duration);
        }

        function openModal(id) { document.getElementById(id).classList.add('open'); }

        function closeModal(id) { document.getElementById(id).classList.remove('open'); }

        function openMenu() { openModal('modalMenu'); }

        /* ============================================================ SPA PAGE RELOAD & RESTORATION ============================================================ */
        let adminAppInitialized = false;
        function initAdminApp() {
            if (adminAppInitialized) return;
            adminAppInitialized = true;

            if (typeof loadAdminData === 'function') loadAdminData();
            else if (typeof window !== 'undefined' && typeof window.loadAdminData === 'function') window.loadAdminData();
            // Clear stale purge cache — prevents old deleted-user IDs from hiding current active users
            try { sessionStorage.removeItem('LS_PURGED_USER_CACHE'); } catch(_) {}
            if (typeof initializeMockDataIfNeeded === 'function') initializeMockDataIfNeeded();
            if (typeof syncSettingsUI === 'function') syncSettingsUI();
            else if (typeof window !== 'undefined' && typeof window.syncSettingsUI === 'function') window.syncSettingsUI();
            if (typeof updateAdminNotifBadge === 'function') updateAdminNotifBadge();

            const loggedIn = (typeof isSessionValidSync === 'function')
                ? isSessionValidSync()
                : (sessionStorage.getItem('admin_isLoggedIn') === 'true' && !!sessionStorage.getItem('admin_session_token'));
            const savedScreen = sessionStorage.getItem('admin_activeScreen');
            const hash = window.location.hash.replace('#/', '');

            if (loggedIn) {
                // Background cryptographic session verification to guard against manual console tampering
                if (typeof verifyAdminSession === 'function') {
                    verifyAdminSession().then(isValid => {
                        if (!isValid) {
                            if (typeof doLogout === 'function') doLogout();
                            else {
                                sessionStorage.removeItem('admin_isLoggedIn');
                                sessionStorage.removeItem('admin_session_token');
                                go('scr-login', true);
                            }
                        }
                    }).catch(() => {});
                }

                let targetScreen = savedScreen;
                if (hash) {
                    const hashScr = 'scr-' + hash;
                    if (document.getElementById(hashScr)) targetScreen = hashScr;
                }
                if (!targetScreen || !document.getElementById(targetScreen) || targetScreen === 'scr-splash' || targetScreen === 'scr-login') {
                    targetScreen = 'scr-dashboard';
                }

                // Restore sub-states
                const savedHelpTab = sessionStorage.getItem('admin_helpTab');
                if (savedHelpTab) state.helpTab = savedHelpTab;
                const savedUserId = sessionStorage.getItem('admin_activeUserId');
                if (savedUserId) {
                    state.activeUserId = !isNaN(Number(savedUserId)) && Number(savedUserId) > 0 ? Number(savedUserId) : savedUserId;
                }
                const savedReportId = sessionStorage.getItem('admin_activeReportId');
                if (savedReportId) {
                    state.activeReportId = !isNaN(Number(savedReportId)) && Number(savedReportId) > 0 ? Number(savedReportId) : savedReportId;
                }
                const savedPayId = sessionStorage.getItem('admin_activePayId');
                if (savedPayId) state.activePayId = savedPayId;
                const savedInterestId = sessionStorage.getItem('admin_activeInterestId');
                if (savedInterestId) {
                    state.activeInterestId = !isNaN(Number(savedInterestId)) && Number(savedInterestId) > 0 ? Number(savedInterestId) : savedInterestId;
                }

                // If target screen is userdetail or interestdetail, verify we have the required ID; if not, fallback to parent screen
                if (targetScreen === 'scr-userdetail' && !state.activeUserId) {
                    targetScreen = 'scr-users';
                } else if (targetScreen === 'scr-interestdetail' && !state.activeInterestId) {
                    targetScreen = 'scr-interests';
                }

                // Switch screen
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const targetEl = document.getElementById(targetScreen);
                if (targetEl) targetEl.classList.add('active');

                state.history = [targetScreen];
                updateDesktopNav(targetScreen);

                // Render current screen
                if (targetScreen === 'scr-dashboard') renderDashboard();
                else if (targetScreen === 'scr-users') renderUsers();
                else if (targetScreen === 'scr-userdetail') {
                    if (typeof openUserDetail === 'function' && state.activeUserId) {
                        openUserDetail(state.activeUserId);
                    } else if (typeof renderUsers === 'function') {
                        renderUsers();
                    }
                }
                else if (targetScreen === 'scr-interests') renderInterests();
                else if (targetScreen === 'scr-interestdetail') {
                    if (typeof openInterestDetail === 'function' && state.activeInterestId) {
                        openInterestDetail(state.activeInterestId);
                    } else if (typeof renderInterests === 'function') {
                        renderInterests();
                    }
                }
                else if (targetScreen === 'scr-chatmonitor') {
                    const savedUserA = sessionStorage.getItem('admin_chatUserA') || (state.activeInterestId || 1);
                    const savedUserB = sessionStorage.getItem('admin_chatUserB') || 2;
                    if (typeof openChatMonitor === 'function') openChatMonitor(savedUserA, savedUserB);
                }
                else if (targetScreen === 'scr-payments') renderPayments();
                else if (targetScreen === 'scr-analytics') { if (typeof renderAnalyticsPage === 'function') renderAnalyticsPage(); }
                else if (targetScreen === 'scr-profiles') renderProfileMgmt();
                else if (targetScreen === 'scr-castes') renderCastes();
                else if (targetScreen === 'scr-reports') renderReports();
                else if (targetScreen === 'scr-notifs') renderNotifs();
                else if (targetScreen === 'scr-help') {
                    setHelpTab(state.helpTab || 'faq');
                }
                else if (targetScreen === 'scr-settings') {
                    if (typeof syncSettingsUI === 'function') syncSettingsUI();
                    else if (typeof window !== 'undefined' && typeof window.syncSettingsUI === 'function') window.syncSettingsUI();
                }

                // Keep global loader visible smoothly, then dismiss without any blank flash
                showGlobalLoader('Restoring Admin Console...', 280);
            } else {
                // First fresh visit or not logged in: display splash briefly, then transition to login
                setTimeout(() => {
                    go('scr-login', true);
                    if (typeof syncSettingsUI === 'function') syncSettingsUI();
                    else if (typeof window !== 'undefined' && typeof window.syncSettingsUI === 'function') window.syncSettingsUI();
                }, 800);
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAdminApp);
            window.addEventListener('load', initAdminApp);
        } else {
            initAdminApp();
        }

        function togglePw(id, btn) {
            const el = document.getElementById(id);
            const icon = btn.querySelector('i');
            if (el.type === 'password') {
                el.type = 'text';
                icon.className = 'fa-solid fa-eye-slash';
            } else {
                el.type = 'password';
                icon.className = 'fa-solid fa-eye';
            }
        }

        function otpMove(el) {
            if (el.value.length === 1) { const next = el.nextElementSibling; if (next && next.tagName === 'INPUT') next.focus(); } else
                if (el.value.length === 0) {
                    const prev = el.previousElementSibling; if (prev && prev.tagName === 'INPUT')
                        prev.focus();
                }
        }

        function ddOpen(id) {
            document.querySelectorAll('.dd.open').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
            document.getElementById(id).classList.toggle('open');
        }

        function ddPick(id, li, label) {
            const dd = document.getElementById(id);
            dd.querySelector('.dd-trigger span').textContent = label;
            dd.querySelector('.dd-trigger').classList.remove('placeholder');
            dd.querySelectorAll('li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            dd.classList.remove('open');
        }
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.dd.open').forEach(d => { if (!d.contains(e.target)) d.classList.remove('open'); });
            const casteWrap = document.getElementById('adminEditCasteSearchWrap');
            if (casteWrap && !casteWrap.contains(e.target)) {
                const dd = document.getElementById('adminEditCasteDropdown');
                if (dd) dd.classList.remove('open');
            }
        });


        /* ============================================================ HELPERS ============================================================ */
        function findUser(id) {
            if (id === null || id === undefined) return null;
            if (typeof id === 'object' && id !== null) {
                if (id.id || id.userId || id.user_id || id.email) return id;
            }
            const strId = String(id).trim();
            const numId = Number(id);
            const lowerId = strId.toLowerCase();

            // 1. Search in USERS array
            let found = Array.isArray(USERS) ? USERS.find(u => {
                if (!u) return false;
                if (String(u.id).trim() === strId) return true;
                if (!isNaN(numId) && !isNaN(Number(u.id)) && Number(u.id) === numId) return true;
                if (u.userId && String(u.userId).trim() === strId) return true;
                if (u.user_id && String(u.user_id).trim() === strId) return true;
                if (u.profileId && String(u.profileId).trim() === strId) return true;
                if (u.profile_id && String(u.profile_id).trim() === strId) return true;
                if (u.email && u.email.toLowerCase().trim() === lowerId) return true;
                return false;
            }) : null;
            if (found) return found;

            // 2. Search in window.PROFILES
            if (typeof window !== 'undefined' && Array.isArray(window.PROFILES)) {
                found = window.PROFILES.find(p => {
                    if (!p) return false;
                    if (String(p.id).trim() === strId) return true;
                    if (!isNaN(numId) && !isNaN(Number(p.id)) && Number(p.id) === numId) return true;
                    if (p.userId && String(p.userId).trim() === strId) return true;
                    if (p.user_id && String(p.user_id).trim() === strId) return true;
                    if (p.email && p.email.toLowerCase().trim() === lowerId) return true;
                    return false;
                });
                if (found) return found;
            }

            // 3. Search in LS_COMMUNITY_PROFILES
            try {
                const rawP = localStorage.getItem('LS_COMMUNITY_PROFILES');
                if (rawP) {
                    const list = JSON.parse(rawP);
                    if (Array.isArray(list)) {
                        found = list.find(p => {
                            if (!p) return false;
                            if (String(p.id).trim() === strId) return true;
                            if (p.userId && String(p.userId).trim() === strId) return true;
                            if (p.email && p.email.toLowerCase().trim() === lowerId) return true;
                            return false;
                        });
                        if (found) return found;
                    }
                }
            } catch (_) {}

            // 4. Search in stored accounts / LS_AUTH_ACCOUNTS
            try {
                const rawAcc = localStorage.getItem('LS_AUTH_ACCOUNTS') || localStorage.getItem('LS_COMMUNITY_USERS');
                if (rawAcc) {
                    const accList = JSON.parse(rawAcc);
                    if (Array.isArray(accList)) {
                        found = accList.find(a => {
                            if (!a) return false;
                            if (String(a.id).trim() === strId) return true;
                            if (a.profileId && String(a.profileId).trim() === strId) return true;
                            if (a.userId && String(a.userId).trim() === strId) return true;
                            if (a.email && a.email.toLowerCase().trim() === lowerId) return true;
                            return false;
                        });
                        if (found) return found;
                    }
                }
            } catch (_) {}

            return null;
        }

        function fmtStatus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

        function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

        function isBoyGender(g) {
            if (!g) return false;
            const s = String(g).trim().toLowerCase();
            return s === 'boys' || s === 'boy' || s === 'male' || s === 'm';
        }

        function isGirlGender(g) {
            if (!g) return false;
            const s = String(g).trim().toLowerCase();
            return s === 'girls' || s === 'girl' || s === 'female' || s === 'f';
        }
        window.isBoyGender = isBoyGender;
        window.isGirlGender = isGirlGender;

        /* ============================================================ DASHBOARD ============================================================ */
        function renderDashboard() {
            buildTabbar('tabbarDash', 'dashboard');
            // Only count real/active users — exclude deleted or purged accounts
            const activeUsers = USERS.filter(u => u && u.accountStatus !== 'deleted' && (typeof isUserPurged !== 'function' || !isUserPurged(u)));
            const total = activeUsers.length;
            const boys = activeUsers.filter(u => isBoyGender(u.gender) && u.accountStatus !== 'suspended').length;
            const girls = activeUsers.filter(u => isGirlGender(u.gender) && u.accountStatus !== 'suspended').length;
            const suspended = activeUsers.filter(u => u.accountStatus === 'suspended').length;
            const activeCount = activeUsers.filter(u => u.accountStatus === 'active' || !u.accountStatus).length;
            const revenue = PAYMENTS.filter(p => p.status === 'success').reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const matches = INTERESTS.filter(i => i.status === 'accepted').length;

            const grid = document.getElementById('dashStatsGrid');
            grid.innerHTML = `
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary-dark);"><i class="fa-solid fa-users"></i></div><div class="sc-delta up"><i class="fa-solid fa-arrow-up"></i> Total</div></div><div class="sc-num">${total}</div><div class="sc-label">Total members</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:#EBF3FF;color:#2B6CB0;"><i class="fa-solid fa-mars"></i></div><div class="sc-delta up">Boys</div></div><div class="sc-num">${boys}</div><div class="sc-label">Boys (₹99 Pass)</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:#FFF0F6;color:#D53F8C;"><i class="fa-solid fa-venus"></i></div><div class="sc-delta up">Girls</div></div><div class="sc-num">${girls}</div><div class="sc-label">Girls (Free Lifetime)</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:var(--success-bg);color:var(--success);"><i class="fa-solid fa-user-check"></i></div><div class="sc-delta up">Active</div></div><div class="sc-num">${activeCount}</div><div class="sc-label">Active Profiles</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:var(--grad-gold);color:#3B2A00;"><i class="fa-solid fa-sack-dollar"></i></div><div class="sc-delta up"><i class="fa-solid fa-arrow-up"></i> ₹</div></div><div class="sc-num">₹${revenue}</div><div class="sc-label">Total revenue</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:var(--info-bg);color:var(--info);"><i class="fa-solid fa-heart-circle-check"></i></div><div class="sc-delta up"><i class="fa-solid fa-arrow-up"></i> Match</div></div><div class="sc-num">${matches}</div><div class="sc-label">Matches made</div></div>`;

            const act = document.getElementById('dashActivity');
            act.innerHTML = '';
            if (!NOTIFS || NOTIFS.length === 0) {
                act.innerHTML = `<div class="empty-state" style="padding:24px 16px;text-align:center;"><p class="p-muted" style="font-size:12.5px;margin:0;"><i class="fa-solid fa-bell-slash" style="margin-right:6px;"></i>No recent activity yet. Live events will appear here.</p></div>`;
            } else {
                NOTIFS.slice(0, 4).forEach((n, idx) => {
                    const row = document.createElement('div');
                    row.className = 'notif-item' + (n.unread ? ' unread' : '');
                    row.style.cursor = 'pointer';
                    const notifRef = n.id || String(idx);
                    row.onclick = () => {
                        if (typeof handleAdminNotifClick === 'function') handleAdminNotifClick(notifRef);
                    };
                    const safeTxt = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.txt) : escapeHtml(n.txt);
                    const safeSub = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.sub) : escapeHtml(n.sub);
                    const safeTime = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.time) : escapeHtml(n.time);
                    const safeIcon = (n.icon || 'fa-bell').replace(/[^a-zA-Z0-9_-]/g, '');
                    row.innerHTML =
                        `<div class="nicon"><i class="fa-solid ${safeIcon}"></i></div><div style="flex:1;"><div class="ntxt">${safeTxt}</div><div class="nsub">${safeSub}</div><div class="ntime">${safeTime}</div></div>${n.unread ? '<div class="notif-dot"></div>' : ''}`;
                    act.appendChild(row);
                });
            }

            const pend = document.getElementById('dashPending');
            pend.innerHTML = '';
            const recentUsers = USERS.filter(u => u && u.accountStatus !== 'deleted' && (typeof isUserPurged !== 'function' || !isUserPurged(u))).slice(0, 4);
            if (recentUsers.length === 0) {
                pend.innerHTML =
                    `<div class="empty-state"><i class="fa-solid fa-users"></i><h3>No members yet</h3><p>Registered members will appear here.</p></div>`;
            } else {
                recentUsers.forEach(u => pend.appendChild(userRow(u)));
            }

            if (typeof updateAdminNotifBadge === 'function') updateAdminNotifBadge();
        }


        /* ============================================================ ADMIN EDIT USER & CUSTOM CONTROLS ============================================================ */
        const ADMIN_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let adminDobTempState = { d: 15, m: 6, y: 1999 };

        function calculateAdminAge(birthYear, birthMonth, birthDay) {
            const today = new Date();
            let age = today.getFullYear() - birthYear;
            const m = today.getMonth() - birthMonth;
            if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
                age--;
            }
            return Math.max(18, age);
        }

        function updateAdminDobLivePreview() {
            const dd = String(adminDobTempState.d).padStart(2, '0');
            const mShort = ADMIN_MONTH_SHORT[adminDobTempState.m];
            const y = adminDobTempState.y;
            const age = calculateAdminAge(y, adminDobTempState.m, adminDobTempState.d);

            const previewEl = document.getElementById('adminDobLivePreview');
            const ageEl = document.getElementById('adminDobLiveAge');
            if (previewEl) previewEl.textContent = `${dd} ${mShort} ${y}`;
            if (ageEl) ageEl.textContent = age;
        }

        function initAdminDobPickerLists() {
            const dayWrap = document.getElementById('adminDobDayList');
            const monthWrap = document.getElementById('adminDobMonthList');
            const yearWrap = document.getElementById('adminDobYearList');
            if (!dayWrap || !monthWrap || !yearWrap) return;

            // Days 1..31
            dayWrap.innerHTML = '';
            for (let d = 1; d <= 31; d++) {
                const item = document.createElement('div');
                item.className = `dob-item ${d === adminDobTempState.d ? 'active' : ''}`;
                item.textContent = d;
                item.onclick = () => {
                    adminDobTempState.d = d;
                    document.querySelectorAll('#adminDobDayList .dob-item').forEach(x => x.classList.remove('active'));
                    item.classList.add('active');
                    updateAdminDobLivePreview();
                };
                dayWrap.appendChild(item);
            }

            // Months Jan..Dec
            monthWrap.innerHTML = '';
            ADMIN_MONTH_SHORT.forEach((mName, idx) => {
                const item = document.createElement('div');
                item.className = `dob-item ${idx === adminDobTempState.m ? 'active' : ''}`;
                item.textContent = mName;
                item.onclick = () => {
                    adminDobTempState.m = idx;
                    document.querySelectorAll('#adminDobMonthList .dob-item').forEach(x => x.classList.remove('active'));
                    item.classList.add('active');
                    updateAdminDobLivePreview();
                };
                monthWrap.appendChild(item);
            });

            // Years 1965..2008
            yearWrap.innerHTML = '';
            for (let y = 2008; y >= 1965; y--) {
                const item = document.createElement('div');
                item.className = `dob-item ${y === adminDobTempState.y ? 'active' : ''}`;
                item.textContent = y;
                item.onclick = () => {
                    adminDobTempState.y = y;
                    document.querySelectorAll('#adminDobYearList .dob-item').forEach(x => x.classList.remove('active'));
                    item.classList.add('active');
                    updateAdminDobLivePreview();
                };
                yearWrap.appendChild(item);
            }

            setTimeout(() => {
                [dayWrap, monthWrap, yearWrap].forEach(wrap => {
                    const active = wrap.querySelector('.dob-item.active');
                    if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
                });
            }, 70);
        }

        function openAdminDobModal() {
            const curVal = document.getElementById('adminEditDob')?.value || '';
            const parts = curVal.split('/').map(s => parseInt(s.trim(), 10));
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                adminDobTempState.d = Math.max(1, Math.min(31, parts[0]));
                adminDobTempState.m = Math.max(0, Math.min(11, parts[1] - 1));
                adminDobTempState.y = Math.max(1965, Math.min(2008, parts[2]));
            }
            initAdminDobPickerLists();
            updateAdminDobLivePreview();
            openModal('modalAdminDobPicker');
        }

        function confirmAdminDobPicker() {
            const dd = String(adminDobTempState.d).padStart(2, '0');
            const mm = String(adminDobTempState.m + 1).padStart(2, '0');
            const y = adminDobTempState.y;
            const age = calculateAdminAge(y, adminDobTempState.m, adminDobTempState.d);

            const dobInput = document.getElementById('adminEditDob');
            const ageInput = document.getElementById('adminEditAge');
            const ageNum = document.getElementById('adminEditAgeNum');
            if (dobInput) dobInput.value = `${dd} / ${mm} / ${y}`;
            if (ageInput) ageInput.value = age;
            if (ageNum) ageNum.textContent = age;

            closeModal('modalAdminDobPicker');
            showToast(`Date of birth set: ${dd}/${mm}/${y} (Age: ${age} Years)`);
        }

        function pickAdminEditDropdown(ddId, inputId, val, labelHtml, liEl) {
            const input = document.getElementById(inputId);
            if (input) input.value = val;
            const dd = document.getElementById(ddId);
            if (dd) {
                const span = dd.querySelector('.dd-trigger span');
                if (span) span.innerHTML = labelHtml || val;
                dd.querySelectorAll('.dd-menu li').forEach(el => el.classList.remove('active'));
                if (liEl) {
                    liEl.classList.add('active');
                } else {
                    dd.querySelectorAll('.dd-menu li').forEach(el => {
                        if (el.textContent.trim().toLowerCase().includes(String(val).toLowerCase())) {
                            el.classList.add('active');
                        }
                    });
                }
                dd.classList.remove('open');
            }
        }

        /* ============ CASTE SELECTION FOR ADMIN EDIT PROFILE ============ */
        function filterAdminEditCaste(query) {
            const dd = document.getElementById('adminEditCasteDropdown');
            if (!dd) return;
            const q = (query || '').trim().toLowerCase();
            const activeList = (Array.isArray(CASTES_DATA) && CASTES_DATA.length > 0) ? CASTES_DATA : DEFAULT_COMMUNITIES;

            const matches = q === ''
                ? activeList.slice(0, 35)
                : activeList.filter(c =>
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.guj && c.guj.toLowerCase().includes(q)) ||
                    (c.group && c.group.toLowerCase().includes(q)) ||
                    (c.keywords && c.keywords.toLowerCase().includes(q))
                );

            if (matches.length === 0) {
                dd.innerHTML = `
                    <div class="caste-empty-helpline" style="padding:14px;">
                        <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:4px;">No matching community found</div>
                        <div style="font-size:11.5px;color:var(--text-muted);line-height:1.4;">
                            You can add new communities from the <b>Caste Management</b> screen anytime.
                        </div>
                    </div>`;
            } else {
                const headerText = q === ''
                    ? `<div class="caste-dropdown-header"><span>All Hindu Communities</span><span>${activeList.length} Total</span></div>`
                    : `<div class="caste-dropdown-header"><span>Matching Communities</span><span>${matches.length} Found</span></div>`;

                dd.innerHTML = headerText + matches.map(c => {
                    const safeName = c.name.replace(/'/g, "\\'");
                    const safeGuj = (c.guj || '').replace(/'/g, "\\'");
                    return `
                        <div class="caste-option" onclick="selectAdminEditCaste('${safeName}', '${safeGuj}')">
                            <div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
                                <span class="caste-opt-badge"><i class="fa-solid fa-layer-group" style="font-size:9.5px;"></i> ${escapeHtmlAdmin(c.group || 'Community')}</span>
                                <div style="font-weight:700;font-size:13px;color:var(--text);">
                                    ${escapeHtmlAdmin(c.name)} <span style="font-size:12px;color:var(--text-muted);font-weight:500;">(${escapeHtmlAdmin(c.guj || '')})</span>
                                </div>
                            </div>
                            <i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:13px;opacity:0.35;"></i>
                        </div>`;
                }).join('');
            }
            dd.classList.add('open');
        }

        function selectAdminEditCaste(casteName, gujName) {
            const input = document.getElementById('adminEditCommunity');
            const chip = document.getElementById('adminEditCasteChip');
            const chipTxt = document.getElementById('adminEditCasteChipText');
            const dd = document.getElementById('adminEditCasteDropdown');

            if (input) input.value = casteName;

            // Find Gujarati name if not passed
            if (!gujName && Array.isArray(CASTES_DATA)) {
                const match = CASTES_DATA.find(c => c.name.toLowerCase() === casteName.toLowerCase());
                if (match && match.guj) gujName = match.guj;
            }

            if (chip && chipTxt) {
                const displayGuj = gujName ? ` <span style="font-size:12px;opacity:0.85;font-weight:500;">(${gujName})</span>` : '';
                chipTxt.innerHTML = `<i class="fa-solid fa-users" style="margin-right:8px;color:var(--primary);"></i><b>${casteName}</b>${displayGuj}`;
                chip.style.display = 'flex';
                chip.classList.add('active');
            }
            if (dd) dd.classList.remove('open');
        }

        function removeAdminEditCaste() {
            const chip = document.getElementById('adminEditCasteChip');
            const input = document.getElementById('adminEditCommunity');
            if (chip) {
                chip.classList.remove('active');
                chip.style.display = 'none';
            }
            if (input) {
                input.value = '';
                input.focus();
                filterAdminEditCaste('');
            }
        }

        function openAdminEditUserModal(id) {
            const u = findUser(id);
            if (!u) return;
            document.getElementById('adminEditUserId').value = u.id;
            document.getElementById('adminEditName').value = u.name || '';

            // Gender custom dropdown
            const isGirl = (u.gender === 'girls' || u.gender === 'Girl');
            pickAdminEditDropdown(
                'adminEditDdGender',
                'adminEditGender',
                isGirl ? 'girls' : 'boys',
                isGirl ? '<i class="fa-solid fa-venus" style="color:#E91E63;font-size:14px;"></i> Girl (100% Free)' : '<i class="fa-solid fa-mars" style="color:var(--primary);font-size:14px;"></i> Boy'
            );

            // DOB & Age
            const dobVal = u.dob || '';
            document.getElementById('adminEditDob').value = dobVal;
            const userAge = u.age || 24;
            document.getElementById('adminEditAge').value = userAge;
            document.getElementById('adminEditAgeNum').textContent = userAge;

            // Caste / Community selection with tag chip
            const currentCaste = u.community || u.caste || '';
            if (currentCaste) {
                selectAdminEditCaste(currentCaste);
            } else {
                removeAdminEditCaste();
            }

            document.getElementById('adminEditEducation').value = u.education || '';
            document.getElementById('adminEditOccupation').value = u.occ || u.occupation || '';

            // Monthly Income custom dropdown
            const incomeVal = u.income || '₹40K – ₹75K';
            pickAdminEditDropdown('adminEditDdIncome', 'adminEditIncome', incomeVal, incomeVal);

            document.getElementById('adminEditHeight').value = u.height || '';
            document.getElementById('adminEditWeight').value = u.weight || '';

            // Marital Status custom dropdown
            const maritalVal = u.marital || 'Unmarried';
            pickAdminEditDropdown('adminEditDdMarital', 'adminEditMarital', maritalVal, maritalVal);

            // Physical Status custom dropdown
            const physicalVal = u.physical || 'Normal';
            pickAdminEditDropdown('adminEditDdPhysical', 'adminEditPhysical', physicalVal, physicalVal);

            const isValidPhoneField = (str) => {
                if (!str || typeof str !== 'string') return false;
                if (str.includes('•') || str.includes('*') || str.includes('—')) return false;
                return str.replace(/\D/g, '').length >= 10;
            };
            const unmaskedOwn = (typeof getAdminUnmaskedPhone === 'function') ? getAdminUnmaskedPhone(u, 'own') : (u.rawOwnMobile || u.ownMobile || u.mobile || '');
            const unmaskedFather = (typeof getAdminUnmaskedPhone === 'function') ? getAdminUnmaskedPhone(u, 'father') : (u.rawFatherMobile || u.fatherMobile || '');
            document.getElementById('adminEditOwnMobile').value = isValidPhoneField(unmaskedOwn) ? unmaskedOwn : (isValidPhoneField(u.mobile) ? u.mobile : '');
            document.getElementById('adminEditEmail').value = (u.rawEmail && !u.rawEmail.includes('•')) ? u.rawEmail : (u.email && !u.email.includes('•') ? u.email : (u.raw_data && u.raw_data.email && !u.raw_data.email.includes('•') ? u.raw_data.email : ''));
            document.getElementById('adminEditFatherMobile').value = isValidPhoneField(unmaskedFather) ? unmaskedFather : '';
            document.getElementById('adminEditFather').value = u.father || u.fatherName || '';
            document.getElementById('adminEditFatherOcc').value = u.fatherOcc || '';
            document.getElementById('adminEditMother').value = u.mother || u.motherName || '';
            document.getElementById('adminEditMotherOcc').value = u.motherOcc || '';
            document.getElementById('adminEditSister').value = u.sister || '';
            document.getElementById('adminEditBrother').value = u.brother || '';
            document.getElementById('adminEditVillage').value = u.village || u.city || '';
            document.getElementById('adminEditTaluka').value = u.taluka || '';
            document.getElementById('adminEditDistrict').value = u.district || '';
            document.getElementById('adminEditAddress').value = u.fullAddress || u.address || '';

            openModal('modalAdminEditUser');
        }

        async function saveAdminUserEdit() {
            const id = document.getElementById('adminEditUserId').value;
            const u = findUser(id);
            if (!u) {
                showToast('Member not found');
                return;
            }

            const name = document.getElementById('adminEditName').value.trim();
            if (!name) {
                showToast('Please enter member name');
                return;
            }

            const gender = document.getElementById('adminEditGender').value;
            const age = Number(document.getElementById('adminEditAge').value) || u.age || 24;
            const dob = document.getElementById('adminEditDob').value.trim();
            const community = document.getElementById('adminEditCommunity').value.trim();
            const education = document.getElementById('adminEditEducation').value.trim();
            const occupation = document.getElementById('adminEditOccupation').value.trim();
            const income = document.getElementById('adminEditIncome').value.trim();
            const height = document.getElementById('adminEditHeight').value.trim();
            const weight = document.getElementById('adminEditWeight').value.trim();
            const marital = document.getElementById('adminEditMarital').value;
            const physical = document.getElementById('adminEditPhysical').value;

            const ownMobile = document.getElementById('adminEditOwnMobile').value.trim();
            const email = document.getElementById('adminEditEmail').value.trim();
            const fatherMobile = document.getElementById('adminEditFatherMobile').value.trim();

            const father = document.getElementById('adminEditFather').value.trim();
            const fatherOcc = document.getElementById('adminEditFatherOcc').value.trim();
            const mother = document.getElementById('adminEditMother').value.trim();
            const motherOcc = document.getElementById('adminEditMotherOcc').value.trim();
            const sister = document.getElementById('adminEditSister').value.trim();
            const brother = document.getElementById('adminEditBrother').value.trim();

            const village = document.getElementById('adminEditVillage').value.trim();
            const taluka = document.getElementById('adminEditTaluka').value.trim();
            const district = document.getElementById('adminEditDistrict').value.trim();
            const address = document.getElementById('adminEditAddress').value.trim();

            // Update user in-memory model
            u.name = name;
            u.gender = gender;
            u.age = age;
            u.dob = dob;
            u.community = community;
            u.caste = community;
            u.education = education;
            u.occ = occupation;
            u.occupation = occupation;
            u.income = income;
            u.height = height;
            u.weight = weight;
            u.marital = marital;
            u.physical = physical;

            u.ownMobile = ownMobile;
            u.rawOwnMobile = ownMobile;
            u.mobile = ownMobile;
            u.email = email;
            u.rawEmail = email;
            u.fatherMobile = fatherMobile;
            u.rawFatherMobile = fatherMobile;

            u.father = father;
            u.fatherName = father;
            u.fatherOcc = fatherOcc;
            u.mother = mother;
            u.motherName = mother;
            u.motherOcc = motherOcc;
            u.sister = sister || '—';
            u.brother = brother || '—';

            u.village = village;
            u.city = village;
            u.taluka = taluka;
            u.district = district;
            u.fullAddress = address;
            u.address = address;

            // Also synchronize in window.PROFILES and localStorage
            if (Array.isArray(window.PROFILES)) {
                const pIdx = window.PROFILES.findIndex(p => p && String(p.id) === String(u.id));
                if (pIdx !== -1) {
                    window.PROFILES[pIdx] = { ...window.PROFILES[pIdx], ...u };
                }
            }
            if (typeof saveCommunityProfiles === 'function') saveCommunityProfiles();

            closeModal('modalAdminEditUser');
            showGlobalLoader('Saving member updates to Supabase...');

            try {
                // Persist live changes directly to Supabase PostgreSQL database
                if (typeof supabaseAdminUpdateMember === 'function') {
                    await supabaseAdminUpdateMember(u.id, u);
                } else if (typeof supabaseUpsertProfile === 'function') {
                    await supabaseUpsertProfile(u);
                }
            } catch (err) {
                console.warn('[Supabase] Member edit update note:', err);
            } finally {
                hideGlobalLoader();
                showToast('Member profile updated successfully');
                openUserDetail(u.id);
                renderUsers();
                if (typeof renderDashboard === 'function') renderDashboard();
            }
        }

        function openAdminPhotoPreview(url, title, meta) {
            const img = document.getElementById('adminPhotoPreviewImg');
            const titleEl = document.getElementById('adminPhotoPreviewTitle');
            const metaEl = document.getElementById('adminPhotoPreviewMeta');
            if (img) img.src = url;
            if (titleEl) titleEl.textContent = title || 'Member Photo';
            if (metaEl) metaEl.textContent = meta || 'Uploaded Member Picture';
            openModal('modalPhotoPreview');
        }

        function renderUserInterestsMini(userId) {
            const wrap = document.getElementById('userInterestsWrap');
            if (!wrap) return;
            const related = INTERESTS.filter(i => i.fromUserId === userId || i.toUserId === userId);
            if (related.length === 0) {
                wrap.innerHTML = `<p class="p-muted" style="font-size:12.5px;">No interest requests sent or received yet.</p>`;
                return;
            }
            wrap.innerHTML = '';
            related.forEach(i => {
                const other = findUser(i.fromUserId === userId ? i.toUserId : i.fromUserId) || {
                    name: 'Member',
                    img: 'images/default-avatar.png'
                };
                const direction = i.fromUserId === userId ? 'Sent to' : 'Received from';
                const row = document.createElement('div');
                row.className = 'row-item';
                row.style.marginBottom = '8px';
                row.innerHTML = `
      <img class="ravatar" src="${other.img || 'images/default-avatar.png'}" alt="${other.name || 'Member'}" onerror="this.src='images/default-avatar.png'">
      <div class="rbody"><div class="rtitle" style="font-size:13px;">${direction} ${other.name || 'Member'}</div><div class="rsub">${i.date}</div></div>
      <span class="status-badge ${i.status}">${fmtStatus(i.status)}</span>`;
                row.addEventListener('click', () => openInterestDetail(i.id));
                wrap.appendChild(row);
            });
        }

        function toggleVisible(id, btn) {
            const u = findUser(id);
            if (!u) return;
            const currentVis = (u.visible !== false && u.visible !== 'false' && u.visible !== 0);
            u.visible = !currentVis;
            if (u.visible) {
                if (u.accountStatus === 'pending') u.accountStatus = 'active';
                if (u.verifyStatus === 'pending') u.verifyStatus = 'approved';
            }
            if (btn) {
                if (u.visible) {
                    btn.classList.add('on');
                } else {
                    btn.classList.remove('on');
                }
            }
            saveAdminData();

            // Synchronize local caches for any active tab or storage
            try {
                if (Array.isArray(window.PROFILES)) {
                    const pIdx = window.PROFILES.findIndex(p => p && (String(p.id) === String(u.id) || (p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase())));
                    if (pIdx !== -1) {
                        window.PROFILES[pIdx].visible = u.visible;
                        if (u.visible) {
                            window.PROFILES[pIdx].accountStatus = u.accountStatus;
                            window.PROFILES[pIdx].verifyStatus = u.verifyStatus;
                        }
                    }
                }
                const cachedProfiles = JSON.parse(sessionStorage.getItem('mangalSetu_profiles') || '[]');
                if (Array.isArray(cachedProfiles) && cachedProfiles.length > 0) {
                    const cpIdx = cachedProfiles.findIndex(p => p && (String(p.id) === String(u.id) || (p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase())));
                    if (cpIdx !== -1) {
                        cachedProfiles[cpIdx].visible = u.visible;
                        if (u.visible) {
                            cachedProfiles[cpIdx].accountStatus = u.accountStatus;
                            cachedProfiles[cpIdx].verifyStatus = u.verifyStatus;
                        }
                        sessionStorage.setItem('mangalSetu_profiles', JSON.stringify(cachedProfiles));
                    }
                }
            } catch (_) {}

            // 1. Sync to Supabase PostgreSQL database
            if (typeof supabaseUpdateProfileStatus === 'function') {
                supabaseUpdateProfileStatus(u.id, {
                    visible: u.visible,
                    accountStatus: u.accountStatus,
                    verifyStatus: u.verifyStatus,
                    email: u.email
                }).catch(err => console.warn('[Supabase] Visibility sync notice:', err));
            }

            showToast(u.visible ? 'Profile is now approved & visible in search' : 'Profile hidden from search');
        }

        function refreshCurrentScreen() {
            const active = document.querySelector('.screen.active');
            if (!active) return;
            if (active.id === 'scr-users' && typeof renderUsers === 'function') renderUsers();
            if (active.id === 'scr-dashboard' && typeof renderDashboard === 'function') renderDashboard();
            if (active.id === 'scr-userdetail' && typeof openUserDetail === 'function') {
                const uid = state.activeUserId || sessionStorage.getItem('admin_activeUserId');
                if (uid) openUserDetail(uid);
            }
            if (active.id === 'scr-profiles' && typeof renderProfileMgmt === 'function') renderProfileMgmt();
            if (active.id === 'scr-interests' && typeof renderInterests === 'function') renderInterests();
            if (active.id === 'scr-interestdetail' && typeof openInterestDetail === 'function') {
                const iid = state.activeInterestId || sessionStorage.getItem('admin_activeInterestId');
                if (iid) openInterestDetail(iid);
            }
            if (active.id === 'scr-payments' && typeof renderPayments === 'function') renderPayments();
            if (active.id === 'scr-reports' && typeof renderReports === 'function') renderReports();
            if (active.id === 'scr-castes' && typeof renderCastes === 'function') renderCastes();
        }
        window.refreshCurrentScreen = refreshCurrentScreen;

        /* Suspend / delete */
        function openSuspendModal(id) {
            state.activeUserId = id;
            const u = findUser(id);
            if (!u) return;
            const isSuspended = (u.accountStatus || u.account_status || '').toLowerCase() === 'suspended';
            const willSuspend = !isSuspended;
            document.getElementById('suspendTitle').textContent = willSuspend ? 'Suspend account?' : 'Reactivate account?';
            document.getElementById('suspendText').textContent = willSuspend ?
                `${u.name} will no longer be able to log in or appear in search.` :
                `${u.name} will be able to log in and appear in search again.`;
            openModal('modalSuspend');
        }

        async function doSuspendToggle() {
            const u = findUser(state.activeUserId);
            if (!u) return;
            const isSuspended = (u.accountStatus || u.account_status || '').toLowerCase() === 'suspended';
            const willSuspend = !isSuspended;
            const newStatus = willSuspend ? 'suspended' : 'active';
            u.accountStatus = newStatus;
            u.account_status = newStatus;
            u.status = willSuspend ? 'Suspended' : 'Active';
            if (willSuspend) u.visible = false;
            else u.visible = true;

            // Keep window.PROFILES and localStorage in sync
            if (Array.isArray(window.PROFILES)) {
                const p = window.PROFILES.find(p => p && String(p.id) === String(u.id));
                if (p) {
                    p.accountStatus = newStatus;
                    p.account_status = newStatus;
                    p.status = u.status;
                    p.visible = u.visible;
                }
            }
            if (typeof saveCommunityProfiles === 'function') saveCommunityProfiles();

            closeModal('modalSuspend');
            showGlobalLoader(willSuspend ? 'Suspending member in Supabase...' : 'Reactivating member in Supabase...');

            // Resolve clean unmasked email
            let cleanEmail = '';
            if (typeof resolveUnmaskedUserEmail === 'function') {
                cleanEmail = await resolveUnmaskedUserEmail(u, u.id, u.userUid || u.userId);
            }
            if (!cleanEmail && u.rawEmail && !u.rawEmail.includes('•')) cleanEmail = u.rawEmail;
            if (!cleanEmail && u.email && !u.email.includes('•')) cleanEmail = u.email;

            // Sync to live Supabase PostgreSQL
            if (typeof supabaseUpdateProfileStatus === 'function') {
                try {
                    await supabaseUpdateProfileStatus(u.id, {
                        email: cleanEmail || u.email,
                        accountStatus: newStatus,
                        visible: u.visible,
                        suspensionReason: willSuspend ? 'Suspended by admin review.' : null
                    });
                    console.info('[Admin] Member status successfully updated in Supabase:', u.id, newStatus);
                } catch(err) {
                    console.warn('[Supabase] Suspend sync note:', err);
                } finally {
                    hideGlobalLoader();
                    refreshCurrentScreen();
                    showToast(`${u.name} ${newStatus === 'active' ? 'reactivated' : 'suspended'}`);
                }
            } else {
                hideGlobalLoader();
                refreshCurrentScreen();
                showToast(`${u.name} ${newStatus === 'active' ? 'reactivated' : 'suspended'}`);
            }
        }

        /* ========== UNMASKED EMAIL RESOLVER (FOR ADMIN DELETION) ========== */
        async function resolveUnmaskedUserEmail(userObj, userId, userUid) {
            const isCleanEmail = (str) => Boolean(
                str && 
                typeof str === 'string' && 
                str.includes('@') && 
                !str.includes('•') && 
                !str.includes('*') && 
                !str.endsWith('@deleted.local')
            );

            // 1. Direct inspection on provided userObj
            if (userObj && typeof userObj === 'object') {
                if (isCleanEmail(userObj.rawEmail)) return userObj.rawEmail.trim().toLowerCase();
                if (isCleanEmail(userObj.userEmail)) return userObj.userEmail.trim().toLowerCase();
                if (isCleanEmail(userObj.email)) return userObj.email.trim().toLowerCase();
                if (userObj.raw_data && typeof userObj.raw_data === 'object') {
                    if (isCleanEmail(userObj.raw_data.rawEmail)) return userObj.raw_data.rawEmail.trim().toLowerCase();
                    if (isCleanEmail(userObj.raw_data.email)) return userObj.raw_data.email.trim().toLowerCase();
                }
            }

            const tid = (userObj && userObj.id) ? String(userObj.id) : (userId ? String(userId) : '');
            const tuid = (userObj && (userObj.userId || userObj.user_id)) ? String(userObj.userId || userObj.user_id) : (userUid ? String(userUid) : '');

            // 2. Search in global USERS array
            if (typeof USERS !== 'undefined' && Array.isArray(USERS)) {
                const found = USERS.find(x => x && (
                    (tid && String(x.id) === tid) ||
                    (tuid && (String(x.userId) === tuid || String(x.user_id) === tuid))
                ));
                if (found) {
                    if (isCleanEmail(found.rawEmail)) return found.rawEmail.trim().toLowerCase();
                    if (isCleanEmail(found.email)) return found.email.trim().toLowerCase();
                    if (isCleanEmail(found.userEmail)) return found.userEmail.trim().toLowerCase();
                }
            }

            // 3. Search in local storage accounts
            try {
                const rawAuth = localStorage.getItem('LS_AUTH_ACCOUNTS');
                if (rawAuth) {
                    const list = JSON.parse(rawAuth);
                    if (Array.isArray(list)) {
                        const m = list.find(a => a && ((tid && String(a.id) === tid) || (tuid && String(a.id) === tuid) || (a.phone && userObj?.mobile && a.phone === userObj.mobile)));
                        if (m && isCleanEmail(m.email)) return m.email.trim().toLowerCase();
                    }
                }
            } catch(e) {}

            // 4. Fetch directly from Supabase tables (profiles and users) before deletion
            try {
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
                if (client) {
                    // Try profiles table by numeric ID
                    const numId = Number(tid);
                    if (!isNaN(numId) && numId > 0) {
                        const { data: p } = await client.from('profiles').select('email, raw_data').eq('id', numId).maybeSingle();
                        if (p) {
                            if (isCleanEmail(p.email)) return p.email.trim().toLowerCase();
                            if (p.raw_data && isCleanEmail(p.raw_data.rawEmail)) return p.raw_data.rawEmail.trim().toLowerCase();
                            if (p.raw_data && isCleanEmail(p.raw_data.email)) return p.raw_data.email.trim().toLowerCase();
                        }
                    }

                    // Try profiles table by user_id
                    if (tuid) {
                        const { data: p2 } = await client.from('profiles').select('email, raw_data').eq('user_id', tuid).maybeSingle();
                        if (p2) {
                            if (isCleanEmail(p2.email)) return p2.email.trim().toLowerCase();
                            if (p2.raw_data && isCleanEmail(p2.raw_data.rawEmail)) return p2.raw_data.rawEmail.trim().toLowerCase();
                            if (p2.raw_data && isCleanEmail(p2.raw_data.email)) return p2.raw_data.email.trim().toLowerCase();
                        }
                    }

                    // Try public.users table
                    const searchId = tuid || tid;
                    if (searchId) {
                        const { data: u } = await client.from('users').select('email').eq('id', searchId).maybeSingle();
                        if (u && isCleanEmail(u.email)) {
                            return u.email.trim().toLowerCase();
                        }
                    }
                }
            } catch(supErr) {
                console.warn('[Admin Delete] Supabase email resolution note:', supErr);
            }

            return '';
        }
        window.resolveUnmaskedUserEmail = resolveUnmaskedUserEmail;

        function openDeleteModal(id) {
            state.activeUserId = id;
            state.deleteTargetUser = findUser(id);

            // Populate name & email labels in modal
            const u = findUser(id) || {};
            const nameLabel = document.getElementById('deleteUserNameLabel');
            const emailLabel = document.getElementById('deleteUserEmailLabel');
            if (nameLabel) nameLabel.textContent = u.name || 'this member';

            // Show initial best known email or placeholder
            const initialEmail = (u.rawEmail && !u.rawEmail.includes('•')) 
                ? u.rawEmail 
                : ((u.email && !u.email.includes('•')) ? u.email : '');
            if (emailLabel) {
                emailLabel.textContent = initialEmail || 'this member';
            }

            // Asynchronously resolve true unmasked email and update label
            (async () => {
                try {
                    const resolved = await resolveUnmaskedUserEmail(u, id, u.userId || u.user_id);
                    if (resolved && state.activeUserId === id) {
                        if (emailLabel) emailLabel.textContent = resolved;
                        if (state.deleteTargetUser) {
                            state.deleteTargetUser.rawEmail = resolved;
                            state.deleteTargetUser.email = resolved;
                        }
                    }
                } catch(e) {}
            })();

            // Reset .dd dropdown state
            const ddDel = document.getElementById('ddDeleteReason');
            if (ddDel) {
                ddDel.classList.remove('open');
                const trigger = ddDel.querySelector('.dd-trigger');
                const labelSpan = ddDel.querySelector('#deleteReasonText_label');
                if (trigger) trigger.classList.add('placeholder');
                if (labelSpan) labelSpan.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color:var(--text-faint);font-size:13px;"></i> Select a reason';
                ddDel.querySelectorAll('li').forEach(l => l.classList.remove('active'));
            }
            const hiddenInput = document.getElementById('deleteReasonSelect');
            const txt = document.getElementById('deleteReasonText');
            const err = document.getElementById('deleteReasonError');
            if (hiddenInput) hiddenInput.value = '';
            if (txt) { txt.value = ''; txt.style.display = 'none'; }
            if (err) err.style.display = 'none';

            openModal('modalDelete');
        }

        function pickDeleteReason(reason, icon, li) {
            const dd = document.getElementById('ddDeleteReason');
            const hiddenInput = document.getElementById('deleteReasonSelect');
            const txt = document.getElementById('deleteReasonText');
            const err = document.getElementById('deleteReasonError');
            const labelSpan = document.getElementById('deleteReasonText_label');
            const trigger = dd ? dd.querySelector('.dd-trigger') : null;

            // Mark the selected li
            if (dd) dd.querySelectorAll('li').forEach(l => l.classList.remove('active'));
            if (li) li.classList.add('active');

            // Update trigger label with icon + text
            const labelText = reason === 'other' ? 'Other — write below' : li.querySelector('span').textContent.trim();
            const iconColor = reason === 'other' ? '#D97706' : 'var(--primary)';
            if (labelSpan) labelSpan.innerHTML = `<i class="fa-solid ${icon}" style="color:${iconColor};font-size:13px;"></i> ${labelText}`;
            if (trigger) trigger.classList.remove('placeholder');

            // Store value
            if (hiddenInput) hiddenInput.value = reason;

            // Close dropdown
            if (dd) dd.classList.remove('open');

            // Clear error
            if (err) err.style.display = 'none';

            // Show/hide textarea
            if (txt) {
                if (reason === 'other') {
                    txt.style.display = 'block';
                    setTimeout(() => txt.focus(), 80);
                } else {
                    txt.style.display = 'none';
                    txt.value = '';
                }
            }
        }
        window.pickDeleteReason = pickDeleteReason;
        // Keep old refs as no-op for safety
        window.selectDeleteReason = function() {};
        window.onDeleteReasonSelectChange = function() {};


        async function doDeleteUser() {
            // --- Validate reason input (from hidden input + pill system) ---
            const sel = document.getElementById('deleteReasonSelect'); // hidden input
            const txt = document.getElementById('deleteReasonText');
            const err = document.getElementById('deleteReasonError');
            let deleteReason = sel ? sel.value.trim() : '';
            // If "other" was selected, use the custom textarea text
            if (deleteReason === 'other') {
                deleteReason = (txt ? txt.value.trim() : '');
            }
            if (!deleteReason) {
                if (err) err.style.display = 'block';
                // Scroll to the pills so user can see what's needed
                const pills = document.getElementById('deleteReasonPills');
                if (pills) pills.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return; // Stop — reason is required
            }

            const u = findUser(state.activeUserId) || state.deleteTargetUser || { id: state.activeUserId };
            const targetId = u.id || state.activeUserId;
            const targetUid = u.userId || u.user_id || '';
            const userName = u.name || 'Member';

            closeModal('modalDelete');

            // 1. CRITICAL: Resolve real unmasked recipient email BEFORE local purge or database wipe!
            showGlobalLoader(`Preparing account deletion notice for ${userName}...`);
            let targetEmail = '';
            try {
                targetEmail = await resolveUnmaskedUserEmail(u, targetId, targetUid);
                console.info(`[Admin Delete] Resolved unmasked email for deletion: "${targetEmail}" (ID: ${targetId})`);
            } catch(resolveErr) {
                console.warn('[Admin Delete] Email resolution exception:', resolveErr);
            }

            const normEmail = (targetEmail || u.rawEmail || u.email || '').toLowerCase().trim();
            const normId = String(targetId || '').trim();
            const normUid = String(targetUid || '').trim();
            const ids = [normId, normUid].filter(Boolean);

            // Register purged identifiers immediately with cache so background fetches ignore them
            if (typeof registerPurgedUserId === 'function') {
                registerPurgedUserId(normId, normUid, normEmail);
            }

            // 2. Send branded account deletion email notification FIRST (BEFORE database purge)
            let emailSent = false;
            if (targetEmail && typeof sendAccountDeletionEmail === 'function') {
                try {
                    showGlobalLoader(`Sending deletion notice to ${targetEmail}...`);
                    const emailRes = await sendAccountDeletionEmail(targetEmail, userName, deleteReason, targetId);
                    if (emailRes && emailRes.success) {
                        emailSent = true;
                        console.info(`[Admin Delete] ✅ Deletion email dispatched successfully to ${emailRes.email || targetEmail}`);
                    } else {
                        console.warn('[Admin Delete] ⚠️ Deletion email delivery warning:', emailRes);
                    }
                } catch(emailErr) {
                    console.warn('[Admin Delete] Email dispatch exception:', emailErr);
                }
            } else if (!targetEmail) {
                console.warn(`[Admin Delete] No unmasked email found for ${userName} (${targetId}). Deletion email skipped.`);
            }

            // 3. Immediately remove from local memory & storage so UI is updated cleanly
            USERS = USERS.filter(x => {
                if (!x) return false;
                const xId = String(x.id || '');
                const xUid = String(x.userId || x.user_id || '');
                const xEml = (x.rawEmail || x.email || '').toLowerCase().trim();
                if (ids.includes(xId) || ids.includes(xUid)) return false;
                if (normEmail && xEml === normEmail) return false;
                return true;
            });
            window.USERS = USERS;

            // Purge PAYMENTS in admin
            if (typeof PAYMENTS !== 'undefined' && Array.isArray(PAYMENTS)) {
                PAYMENTS = PAYMENTS.filter(p => {
                    if (!p) return false;
                    const pUid = String(p.userId || p.user_id || '');
                    const pEml = (p.userEmail || p.email || '').toLowerCase().trim();
                    if (ids.includes(pUid)) return false;
                    if (normEmail && pEml === normEmail) return false;
                    return true;
                });
                window.PAYMENTS = PAYMENTS;
            }

            // Purge INTERESTS in admin
            if (typeof INTERESTS !== 'undefined' && Array.isArray(INTERESTS)) {
                INTERESTS = INTERESTS.filter(i => {
                    if (!i) return false;
                    const sId = String(i.sender_id || i.fromUserId || '');
                    const rId = String(i.receiver_id || i.toUserId || '');
                    const sEml = (i.sender_email || i.fromEmail || '').toLowerCase().trim();
                    const rEml = (i.receiver_email || i.toEmail || '').toLowerCase().trim();
                    if (ids.includes(sId) || ids.includes(rId)) return false;
                    if (normEmail && (sEml === normEmail || rEml === normEmail)) return false;
                    return true;
                });
                window.INTERESTS = INTERESTS;
            }

            // Purge REPORTS in admin
            if (typeof REPORTS !== 'undefined' && Array.isArray(REPORTS)) {
                REPORTS = REPORTS.filter(r => {
                    if (!r) return false;
                    const repId = String(r.reporter_id || r.userId || '');
                    const tgtId = String(r.target_user_id || r.reported_id || '');
                    const repEml = (r.reporter_email || r.userEmail || '').toLowerCase().trim();
                    const tgtEml = (r.target_user_email || r.reported_email || '').toLowerCase().trim();
                    if (ids.includes(repId) || ids.includes(tgtId)) return false;
                    if (normEmail && (repEml === normEmail || tgtEml === normEmail)) return false;
                    return true;
                });
                window.REPORTS = REPORTS;
            }

            saveAdminData();

            // Purge all member app caches and local auth storage
            try {
                const purgeKeyList = (key, isObjWithUserEmail = false) => {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const list = JSON.parse(raw);
                        if (Array.isArray(list)) {
                            const filtered = list.filter(item => {
                                if (!item) return false;
                                const iId = String(item.id || '');
                                const iUid = String(item.userId || item.user_id || '');
                                const iEml = String(item.rawEmail || item.email || (isObjWithUserEmail ? item.userEmail : '') || '').toLowerCase().trim();
                                if (ids.includes(iId) || ids.includes(iUid)) return false;
                                if (normEmail && iEml === normEmail) return false;
                                return true;
                            });
                            localStorage.setItem(key, JSON.stringify(filtered));
                        }
                    }
                };

                purgeKeyList('LS_COMMUNITY_PROFILES');
                purgeKeyList('LS_AUTH_ACCOUNTS');
                purgeKeyList('LS_COMMUNITY_USERS');
                purgeKeyList('LS_ADMIN_PAYMENTS', true);
                sessionStorage.removeItem('mangalSetu_profiles');
            } catch(e) {
                console.warn('[Admin Delete] Local storage purge note:', e);
            }

            // Navigate cleanly to Users table screen (NEVER splash) and refresh UI
            go('scr-users', true);
            renderUsers();

            // 4. Perform live Supabase purge (Cloudinary photos, RPC, DB wipe, direct delete)
            showGlobalLoader(`Permanently deleting ${userName} from Supabase...`);
            try {
                if (typeof supabaseDeleteUserCompletely === 'function') {
                    await supabaseDeleteUserCompletely(u, targetEmail, targetUid || targetId, { isSelfDelete: false });
                } else if (typeof supabaseDeleteProfile === 'function') {
                    await supabaseDeleteProfile(targetId);
                }
            } catch(delErr) {
                console.warn('[Admin Delete] Supabase delete note:', delErr);
            } finally {
                hideGlobalLoader();
            }

            // Sync fresh data from Supabase to verify complete purge
            if (typeof supabaseFetchAllProfilesForAdmin === 'function') {
                try {
                    const fresh = await supabaseFetchAllProfilesForAdmin();
                    if (Array.isArray(fresh)) {
                        USERS = fresh.filter(x => !ids.includes(String(x.id)) && (!normEmail || (x.email || '').toLowerCase().trim() !== normEmail));
                        window.USERS = USERS;
                        saveAdminData();
                    }
                } catch(_) {}
            }

            renderUsers();
            if (emailSent) {
                showToast(`✅ ${userName}'s account removed & notice emailed to ${targetEmail}`);
            } else if (targetEmail) {
                showToast(`✅ ${userName}'s account removed (Notice attempted)`);
            } else {
                showToast(`✅ ${userName}'s account permanently removed`);
            }
        }


// Global Window Exports
if (typeof go !== 'undefined') window.go = go;
if (typeof goBack !== 'undefined') window.goBack = goBack;
if (typeof showToast !== 'undefined') window.showToast = showToast;
if (typeof openModal !== 'undefined') window.openModal = openModal;
if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
if (typeof renderDashboard !== 'undefined') window.renderDashboard = renderDashboard;
if (typeof openUserDetail !== 'undefined') {
    window.openUserDetail = openUserDetail;
    window.openUser = openUserDetail;
}
if (typeof openInterestDetail !== 'undefined') {
    window.openInterestDetail = openInterestDetail;
    window.openInterest = openInterestDetail;
}
if (typeof initAdminApp !== 'undefined') window.initAdminApp = initAdminApp;
if (typeof findUser !== 'undefined') window.findUser = findUser;
