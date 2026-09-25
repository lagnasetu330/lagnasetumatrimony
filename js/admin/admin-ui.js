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
            if (document.body) document.body.classList.toggle('sidebar-active', APP_SCREENS.has(id));
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

        let adminGlobalLoaderTimer = null;
        function showGlobalLoader(text = 'Loading Admin Console...', minDuration = 280) {
            const loader = document.getElementById('globalPageLoader');
            const txtEl = document.getElementById('globalLoaderText');
            if (txtEl) txtEl.textContent = text;
            if (loader) loader.classList.add('active');
            if (minDuration > 0) {
                clearTimeout(adminGlobalLoaderTimer);
                adminGlobalLoaderTimer = setTimeout(() => {
                    hideGlobalLoader();
                }, minDuration);
            }
        }

        function hideGlobalLoader() {
            clearTimeout(adminGlobalLoaderTimer);
            const loader = document.getElementById('globalPageLoader');
            if (loader) loader.classList.remove('active');
            const preloadStyle = document.getElementById('spa-preload-css');
            if (preloadStyle) preloadStyle.remove();
            document.documentElement.classList.remove('bypassing-splash');
        }

        function go(id, replace) {
            // Strict Auth Guard: Protect all administrative screens from unauthorized console access
            const publicScreens = new Set(['scr-splash', 'scr-login', 'scr-forgot', 'scr-forgot-otp', 'scr-newpass']);
            const isAuth = (typeof isSessionValidSync === 'function')
                ? isSessionValidSync()
                : (sessionStorage.getItem('admin_isLoggedIn') === 'true' && !!sessionStorage.getItem('admin_session_token'));

            if (!isAuth && !publicScreens.has(id)) {
                id = 'scr-login';
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
                        if (Array.isArray(remoteProfiles) && remoteProfiles.length > 0) {
                            USERS = remoteProfiles;
                            window.USERS = USERS;
                            localStorage.setItem(LS_USERS_KEY, JSON.stringify(USERS));
                            renderUsers();
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
            if (id === 'scr-notifs') renderNotifs();
            if (id === 'scr-help') renderHelp();
            if (id === 'scr-settings') syncSettingsUI();
            if (typeof updateAdminNotifBadge === 'function') updateAdminNotifBadge();
            updateDesktopNav(id);
            window.scrollTo(0, 0);
        }

        function goBack() {
            state.history.pop();
            const prev = state.history[state.history.length - 1] || 'scr-dashboard';
            go(prev, true);
        }

        /* ============================================================ TOAST / MODALS ============================================================ */
        let toastTimer;

        function showToast(msg) {
            const t = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            t.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
        }

        function openModal(id) { document.getElementById(id).classList.add('open'); }

        function closeModal(id) { document.getElementById(id).classList.remove('open'); }

        function openMenu() { openModal('modalMenu'); }

        /* ============================================================ SPA PAGE RELOAD & RESTORATION ============================================================ */
        let adminAppInitialized = false;
        function initAdminApp() {
            if (adminAppInitialized) return;
            adminAppInitialized = true;

            loadAdminData();
            if (typeof initializeMockDataIfNeeded === 'function') initializeMockDataIfNeeded();
            syncSettingsUI();
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
                if (savedUserId) state.activeUserId = parseInt(savedUserId);
                const savedReportId = sessionStorage.getItem('admin_activeReportId');
                if (savedReportId) state.activeReportId = parseInt(savedReportId);
                const savedPayId = sessionStorage.getItem('admin_activePayId');
                if (savedPayId) state.activePayId = savedPayId;
                const savedInterestId = sessionStorage.getItem('admin_activeInterestId');
                if (savedInterestId) state.activeInterestId = parseInt(savedInterestId);

                // Switch screen
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const targetEl = document.getElementById(targetScreen);
                if (targetEl) targetEl.classList.add('active');

                state.history = [targetScreen];
                updateDesktopNav(targetScreen);

                // Render current screen
                if (targetScreen === 'scr-dashboard') renderDashboard();
                else if (targetScreen === 'scr-users') renderUsers();
                else if (targetScreen === 'scr-userdetail' && state.activeUserId) {
                    if (typeof openUserDetail === 'function') openUserDetail(state.activeUserId);
                }
                else if (targetScreen === 'scr-interests') renderInterests();
                else if (targetScreen === 'scr-interestdetail' && state.activeInterestId) {
                    if (typeof openInterestDetail === 'function') openInterestDetail(state.activeInterestId);
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
                    syncSettingsUI();
                }

                // Keep global loader visible smoothly, then dismiss without any blank flash
                showGlobalLoader('Restoring Admin Console...', 280);
            } else {
                // First fresh visit or not logged in: display splash briefly, then transition to login
                setTimeout(() => {
                    go('scr-login', true);
                    syncSettingsUI();
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
            const strId = String(id).trim();
            const numId = Number(id);
            return USERS.find(u => {
                if (!u) return false;
                if (String(u.id).trim() === strId) return true;
                if (!isNaN(numId) && !isNaN(Number(u.id)) && Number(u.id) === numId) return true;
                if (u.email && typeof id === 'string' && u.email.toLowerCase().trim() === id.toLowerCase().trim()) return true;
                return false;
            });
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
            const total = USERS.length;
            const boys = USERS.filter(u => isBoyGender(u.gender) && u.accountStatus !== 'suspended').length;
            const girls = USERS.filter(u => isGirlGender(u.gender) && u.accountStatus !== 'suspended').length;
            const suspended = USERS.filter(u => u.accountStatus === 'suspended').length;
            const activeCount = USERS.filter(u => u.accountStatus === 'active' || !u.accountStatus).length;
            const revenue = PAYMENTS.filter(p => p.status === 'success').reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const matches = INTERESTS.filter(i => i.status === 'accepted').length;

            const grid = document.getElementById('dashStatsGrid');
            grid.innerHTML = `
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary-dark);"><i class="fa-solid fa-users"></i></div><div class="sc-delta up"><i class="fa-solid fa-arrow-up"></i> Total</div></div><div class="sc-num">${total}</div><div class="sc-label">Total members</div></div>
    <div class="stat-card"><div class="sc-top"><div class="sc-icon" style="background:#EBF3FF;color:#2B6CB0;"><i class="fa-solid fa-mars"></i></div><div class="sc-delta up">Boys</div></div><div class="sc-num">${boys}</div><div class="sc-label">Boys (₹49 Pass)</div></div>
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
            const recentUsers = USERS.slice(0, 4);
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

            document.getElementById('adminEditOwnMobile').value = u.ownMobile || u.mobile || '';
            document.getElementById('adminEditEmail').value = u.email || '';
            document.getElementById('adminEditFatherMobile').value = u.fatherMobile || '';
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

        function saveAdminUserEdit() {
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

            // Update user properties in USERS array
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
            u.mobile = ownMobile;
            u.email = email;
            u.fatherMobile = fatherMobile;

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

            // 1. Save to admin local storage
            saveAdminData();

            // 2. Synchronize to member app localStorage cache (LS_COMMUNITY_PROFILES & LS_COMMUNITY_USERS)
            try {
                const normEmail = (u.email || '').toLowerCase().trim();
                const normId = String(u.id);
                const pList = JSON.parse(localStorage.getItem('LS_COMMUNITY_PROFILES') || '[]');
                const pIdx = pList.findIndex(p => String(p.id) === normId || (p.email && normEmail && String(p.email).toLowerCase().trim() === normEmail));
                if (pIdx !== -1) {
                    Object.assign(pList[pIdx], {
                        name: u.name,
                        gender: u.gender,
                        age: u.age,
                        dob: u.dob,
                        community: u.community,
                        caste: u.community,
                        education: u.education,
                        occupation: u.occupation,
                        occ: u.occ,
                        income: u.income,
                        height: u.height,
                        weight: u.weight,
                        marital: u.marital,
                        physical: u.physical,
                        ownMobile: u.ownMobile,
                        mobile: u.ownMobile,
                        email: u.email,
                        fatherMobile: u.fatherMobile,
                        father: u.father,
                        fatherName: u.father,
                        fatherOcc: u.fatherOcc,
                        mother: u.mother,
                        motherName: u.mother,
                        motherOcc: u.motherOcc,
                        sister: u.sister,
                        brother: u.brother,
                        village: u.village,
                        city: u.village,
                        taluka: u.taluka,
                        district: u.district,
                        fullAddress: u.fullAddress,
                        address: u.fullAddress
                    });
                    localStorage.setItem('LS_COMMUNITY_PROFILES', JSON.stringify(pList));
                }

                // Also update LS_COMMUNITY_USERS
                const uList = JSON.parse(localStorage.getItem('LS_COMMUNITY_USERS') || '[]');
                const uIdx = uList.findIndex(x => String(x.id) === normId || (x.email && normEmail && String(x.email).toLowerCase().trim() === normEmail));
                if (uIdx !== -1) {
                    Object.assign(uList[uIdx], {
                        name: u.name,
                        gender: (u.gender === 'girls' || u.gender === 'Girl') ? 'Girl' : 'Boy',
                        caste: u.community,
                        mobile: u.ownMobile || u.mobile,
                        email: u.email
                    });
                    localStorage.setItem('LS_COMMUNITY_USERS', JSON.stringify(uList));
                }
            } catch (e) {
                console.warn('[Admin Edit] Cache sync notice:', e);
            }

            // 3. Persist live changes directly to Supabase PostgreSQL database
            if (typeof supabaseAdminUpdateMember === 'function') {
                supabaseAdminUpdateMember(u.id, u).catch(err => {
                    console.warn('[Supabase] Member edit update notice:', err);
                });
            } else if (typeof supabaseUpsertProfile === 'function') {
                supabaseUpsertProfile(u).catch(err => {
                    console.warn('[Supabase] Member upsert notice:', err);
                });
            }

            closeModal('modalAdminEditUser');
            showToast('Member profile updated successfully');
            openUserDetail(u.id);
            renderUsers();
            if (typeof renderDashboard === 'function') renderDashboard();
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
                const other = findUser(i.fromUserId === userId ? i.toUserId : i.fromUserId);
                const direction = i.fromUserId === userId ? 'Sent to' : 'Received from';
                const row = document.createElement('div');
                row.className = 'row-item';
                row.style.marginBottom = '8px';
                row.innerHTML = `
      <img class="ravatar" src="${other.img}" alt="${other.name}">
      <div class="rbody"><div class="rtitle" style="font-size:13px;">${direction} ${other.name}</div><div class="rsub">${i.date}</div></div>
      <span class="status-badge ${i.status}">${fmtStatus(i.status)}</span>`;
                row.addEventListener('click', () => openInterestDetail(i.id));
                wrap.appendChild(row);
            });
        }

        function toggleVisible(id, btn) {
            const u = findUser(id);
            if (!u) return;
            u.visible = !u.visible;
            if (btn) {
                if (u.visible) {
                    btn.classList.add('on');
                } else {
                    btn.classList.remove('on');
                }
            }
            saveAdminData();

            // 1. Sync to Supabase PostgreSQL database
            if (typeof supabaseUpdateProfileStatus === 'function') {
                supabaseUpdateProfileStatus(u.id, {
                    visible: u.visible,
                    email: u.email
                }).catch(err => console.warn('[Supabase] Visibility sync notice:', err));
            }

            // 2. Sync to member app cache
            try {
                const normEmail = (u.email || '').toLowerCase().trim();
                const normId = String(u.id);
                const pList = JSON.parse(localStorage.getItem('LS_COMMUNITY_PROFILES') || '[]');
                const pIdx = pList.findIndex(p => String(p.id) === normId || (p.email && normEmail && String(p.email).toLowerCase().trim() === normEmail));
                if (pIdx !== -1) {
                    pList[pIdx].visible = u.visible;
                    localStorage.setItem('LS_COMMUNITY_PROFILES', JSON.stringify(pList));
                }
            } catch (e) {}

            showToast(u.visible ? 'Profile is now visible in search' : 'Profile hidden from search');
        }

        function refreshCurrentScreen() {
            const active = document.querySelector('.screen.active');
            if (!active) return;
            if (active.id === 'scr-users') renderUsers();
            if (active.id === 'scr-dashboard') renderDashboard();
            if (active.id === 'scr-userdetail') openUserDetail(state.activeUserId);
            if (active.id === 'scr-interests') renderInterests();
            if (active.id === 'scr-interestdetail') openInterestDetail(state.activeInterestId);
        }

        /* Suspend / delete */
        function openSuspendModal(id) {
            state.activeUserId = id;
            const u = findUser(id);
            const suspending = u.accountStatus === 'active';
            document.getElementById('suspendTitle').textContent = suspending ? 'Suspend account?' : 'Reactivate account?';
            document.getElementById('suspendText').textContent = suspending ?
                `${u.name} will no longer be able to log in or appear in search.` :
                `${u.name} will be able to log in and appear in search again.`;
            openModal('modalSuspend');
        }

        function doSuspendToggle() {
            const u = findUser(state.activeUserId);
            if (!u) return;
            u.accountStatus = u.accountStatus === 'active' ? 'suspended' : 'active';
            if (u.accountStatus === 'suspended') u.visible = false;
            else u.visible = true;
            closeModal('modalSuspend');
            saveAdminData();

            // Sync to live Supabase PostgreSQL
            if (typeof supabaseUpdateProfileStatus === 'function') {
                supabaseUpdateProfileStatus(u.id, {
                    accountStatus: u.accountStatus,
                    visible: u.visible,
                    suspensionReason: u.accountStatus === 'suspended' ? 'Suspended by admin review.' : null
                }).catch(err => console.warn('[Supabase] Suspend sync note:', err));
            }

            // Sync to member app cache
            try {
                const pList = JSON.parse(localStorage.getItem('LS_COMMUNITY_PROFILES') || '[]');
                const pIdx = pList.findIndex(p => p.id === u.id);
                if (pIdx !== -1) {
                    pList[pIdx].accountStatus = u.accountStatus;
                    pList[pIdx].visible = u.visible;
                    localStorage.setItem('LS_COMMUNITY_PROFILES', JSON.stringify(pList));
                }
            } catch(e) {}

            showToast(`${u.name} ${u.accountStatus === 'active' ? 'reactivated' : 'suspended'}`);
            refreshCurrentScreen();
        }

        function openDeleteModal(id) {
            state.activeUserId = id;
            openModal('modalDelete');
        }

        async function doDeleteUser() {
            const u = findUser(state.activeUserId);
            if (!u) return;
            const idx = USERS.findIndex(x => x.id === u.id || (u.userId && (x.userId === u.userId || x.id === u.userId)));
            if (idx > -1) USERS.splice(idx, 1);
            closeModal('modalDelete');

            // 1. Permanently delete from live Supabase PostgreSQL (profiles, users, payments, messages, interests, and Cloudinary)
            if (typeof supabaseDeleteUserCompletely === 'function') {
                await supabaseDeleteUserCompletely(u, u.email, u.userId || u.user_id);
            } else if (typeof supabaseDeleteProfile === 'function') {
                await supabaseDeleteProfile(u.id);
            }

            // 2. Completely purge from all member app caches, admin stores, and auth storage
            try {
                const normEmail = (u.email || '').toLowerCase().trim();
                const normId = String(u.id || '').trim();
                const normUid = String(u.userId || u.user_id || '').trim();
                const ids = [normId, normUid].filter(Boolean);

                // Purge USERS array for any residual matches
                USERS = USERS.filter(x => {
                    if (!x) return false;
                    const xId = String(x.id || '');
                    const xUid = String(x.userId || x.user_id || '');
                    const xEml = (x.email || '').toLowerCase().trim();
                    if (ids.includes(xId) || ids.includes(xUid)) return false;
                    if (normEmail && xEml === normEmail) return false;
                    return true;
                });

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
                }

                saveAdminData();

                // Purge LS_COMMUNITY_PROFILES
                const pList = JSON.parse(localStorage.getItem('LS_COMMUNITY_PROFILES') || '[]');
                const filteredP = pList.filter(p => !ids.includes(String(p.id)) && !ids.includes(String(p.userId)) && (p.email || '').toLowerCase() !== normEmail);
                localStorage.setItem('LS_COMMUNITY_PROFILES', JSON.stringify(filteredP));

                // Purge LS_AUTH_ACCOUNTS
                const aList = JSON.parse(localStorage.getItem('LS_AUTH_ACCOUNTS') || '[]');
                const filteredA = aList.filter(p => !ids.includes(String(p.id)) && !ids.includes(String(p.userId)) && (p.email || '').toLowerCase() !== normEmail);
                localStorage.setItem('LS_AUTH_ACCOUNTS', JSON.stringify(filteredA));

                // Purge LS_COMMUNITY_USERS
                const uList = JSON.parse(localStorage.getItem('LS_COMMUNITY_USERS') || '[]');
                const filteredU = uList.filter(p => !ids.includes(String(p.id)) && !ids.includes(String(p.userId)) && (p.email || '').toLowerCase() !== normEmail);
                localStorage.setItem('LS_COMMUNITY_USERS', JSON.stringify(filteredU));

                // Purge LS_ADMIN_PAYMENTS
                const payList = JSON.parse(localStorage.getItem('LS_ADMIN_PAYMENTS') || '[]');
                const filteredPay = payList.filter(p => !ids.includes(String(p.userId)) && (p.userEmail || '').toLowerCase() !== normEmail);
                localStorage.setItem('LS_ADMIN_PAYMENTS', JSON.stringify(filteredPay));

                // Purge all related local interests and chats
                if (typeof purgeUserAccountLocally === 'function') {
                    purgeUserAccountLocally(normEmail, normId);
                }
            } catch(e) {
                console.warn('[Admin Delete] Local cleanse notice:', e);
            }

            showToast(`${u.name}'s account and all records permanently wiped from database`);
            goBack();
            refreshCurrentScreen();
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
