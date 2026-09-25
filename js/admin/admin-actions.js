/* ============================================================ ADMIN ACTIONS & MANAGEMENT ============================================================ */
var escapeHtmlAdmin = window.escapeHtmlAdmin || function(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};
var escapeHtml = escapeHtmlAdmin;
window.escapeHtmlAdmin = escapeHtmlAdmin;
window.escapeHtml = escapeHtmlAdmin;

        /* ============================================================ USERS ============================================================ */
                function setUserTab(t) {
            state.userTab = t;
            ['userTabAll', 'userTabBoys', 'userTabGirls', 'userTabSuspended'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('active', id.toLowerCase().includes(t));
            });
            renderUsers();
        }

                function renderUsers(query) {
            const wrap = document.getElementById('userList');
            if (!wrap) return;
            let list = USERS.slice();
            const checkBoy = typeof isBoyGender === 'function' ? isBoyGender : g => (g === 'boys' || g === 'Boy' || g === 'boy');
            const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');

            if (state.userTab === 'suspended') {
                list = list.filter(u => u.accountStatus === 'suspended');
            } else if (state.userTab === 'boys') {
                list = list.filter(u => checkBoy(u.gender) && u.accountStatus !== 'suspended');
            } else if (state.userTab === 'girls') {
                list = list.filter(u => checkGirl(u.gender) && u.accountStatus !== 'suspended');
            }
            if (query) {
                const q = query.toLowerCase();
                list = list.filter(u => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.city && u.city.toLowerCase().includes(q)));
            }
            const boysCount = USERS.filter(u => checkBoy(u.gender) && u.accountStatus !== 'suspended').length;
            const girlsCount = USERS.filter(u => checkGirl(u.gender) && u.accountStatus !== 'suspended').length;
            const suspendedCount = USERS.filter(u => u.accountStatus === 'suspended').length;

            if (document.getElementById('uCountAll')) document.getElementById('uCountAll').textContent = USERS.length;
            if (document.getElementById('uCountBoys')) document.getElementById('uCountBoys').textContent = boysCount;
            if (document.getElementById('uCountGirls')) document.getElementById('uCountGirls').textContent = girlsCount;
            if (document.getElementById('uCountSuspended')) document.getElementById('uCountSuspended').textContent = suspendedCount;

            wrap.innerHTML = '';
            if (list.length === 0) {
                wrap.innerHTML =
                    `<div class="empty-state"><i class="fa-solid fa-user-slash"></i><h3>No members found</h3><p>Try a different search term or switch tabs.</p></div>`;
                return;
            }
            list.forEach(u => wrap.appendChild(userRow(u)));
        }

        function formatConsentDate(val) {
            if (!val) return 'Verified at Registration';
            try {
                const d = new Date(val);
                if (isNaN(d.getTime())) return String(val);
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
                       d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            } catch (_) {
                return 'Verified at Registration';
            }
        }

        function userRow(u) {
            const row = document.createElement('div');
            row.className = 'row-item';
            const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');
            const isGirl = checkGirl(u.gender);
            const payBadge = isGirl ? '<span class="status-badge paid"><i class="fa-solid fa-heart"></i> Free</span>' : (u.paymentStatus === 'paid' ? '<span class="status-badge paid"><i class="fa-solid fa-crown"></i> Paid ₹49</span>' : '<span class="status-badge pending">Unpaid</span>');
            const statusBadge = u.accountStatus === 'active' ? '<span class="status-badge active"><i class="fa-solid fa-check"></i> Active</span>' : '<span class="status-badge rejected"><i class="fa-solid fa-ban"></i> Suspended</span>';
            const termsBadge = '<span class="status-badge" style="background:rgba(46,196,182,0.12);color:#2EC4B6;border:1px solid rgba(46,196,182,0.3);font-size:10px;padding:2px 7px;font-weight:700;" title="Terms & Privacy Policy Agreed"><i class="fa-solid fa-shield-halved"></i> Terms Agreed</span>';
            const photoCount = (Array.isArray(u.photos) && u.photos.length > 0) ? u.photos.length : 1;
            const photoBadge = photoCount > 1 ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;color:var(--primary);font-weight:700;"><i class="fa-solid fa-camera"></i> ${photoCount}</span> • ` : '';
            const occEdu = [u.occ || u.occupation, u.education].filter(Boolean).join(' · ');

            row.innerHTML = `
    <img class="ravatar" src="${u.img || ((u.photos && u.photos[0]) || '')}" alt="${escapeHtmlAdmin(u.name || '')}">
    <div class="rbody">
      <div class="rtitle">${escapeHtmlAdmin(u.name || '')}${u.accountStatus === 'suspended' ? ' <span style="color:var(--error);font-size:11px;font-weight:800;">(Suspended)</span>' : ''}</div>
      <div class="rsub">${photoBadge}<i class="fa-solid fa-location-dot"></i> ${escapeHtmlAdmin(u.village || u.city || '')} • ${isGirl ? 'Girl' : 'Boy'}${occEdu ? ` • ${escapeHtmlAdmin(occEdu)}` : ''}</div>
    </div>
    <div class="rmeta">
      ${statusBadge}
      ${payBadge}
      ${termsBadge}
    </div>
    <i class="fa-solid fa-chevron-right chev"></i>`;
            row.addEventListener('click', () => openUserDetail(u.id));
            return row;
        }

        /* ============================================================ USER DETAIL ============================================================ */
        function renderAdminHobbiesHtml(hobbies) {
            let list = [];
            if (Array.isArray(hobbies)) {
                list = hobbies.map(h => String(h || '').trim()).filter(h => h.length > 0 && h.toLowerCase() !== 'none' && h !== '—');
            } else if (typeof hobbies === 'string' && hobbies.trim()) {
                const trimmed = hobbies.trim();
                if (trimmed.toLowerCase() !== 'none' && trimmed !== '—') {
                    list = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            if (list.length > 0) {
                return list.map(h => `<span class="chip"><i class="fa-solid fa-tag" style="font-size:10px;opacity:0.6;margin-right:4px;"></i>${escapeHtmlAdmin(h)}</span>`).join('');
            }

            return `<span class="p-muted" style="font-size:12.5px;font-style:italic;display:inline-flex;align-items:center;gap:6px;padding:2px 0;"><i class="fa-solid fa-circle-info" style="color:var(--text-muted);font-size:13px;opacity:0.8;"></i> No hobbies listed</span>`;
        }

        function openUserDetail(id) {
            state.activeUserId = id;
            const u = findUser(id);
            if (!u) return;
            const el = document.getElementById('userDetailContent');
            const isGirl = u.gender === 'girls' || u.gender === 'Girl';
            const payText = isGirl ? '<span class="status-badge paid"><i class="fa-solid fa-heart"></i> 100% Free (Girls)</span>' : (u.paymentStatus === 'paid' ? '<span class="status-badge paid"><i class="fa-solid fa-crown"></i> Paid ₹49 / 30 Days</span>' : '<span class="status-badge pending">Unpaid</span>');
            const statusBadge = u.accountStatus === 'active' ? '<span class="status-badge active"><i class="fa-solid fa-check"></i> Active Account</span>' : '<span class="status-badge rejected"><i class="fa-solid fa-ban"></i> Suspended Account</span>';
            const termsBadgeDetail = '<span class="status-badge" style="background:rgba(46,196,182,0.12);color:#2EC4B6;border:1px solid rgba(46,196,182,0.35);font-weight:700;"><i class="fa-solid fa-shield-halved"></i> Terms Agreed</span>';

            // Photos: 1, 2, or 3 photos
            let photos = [];
            if (Array.isArray(u.photos) && u.photos.filter(Boolean).length > 0) {
                photos = u.photos.filter(Boolean);
            } else if (u.img) {
                photos = [u.img];
            }
            if (photos.length === 0 && u.img) photos = [u.img];

            el.innerHTML = `
    <div class="center-txt" style="margin:6px 0 6px;">
      <img src="${u.img || (photos[0] || '')}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;margin:0 auto 12px;box-shadow:var(--shadow-card);border:3px solid #fff;" alt="">
      <div class="h-display h-lg">${escapeHtmlAdmin(u.name || '')}, ${u.age || ''}</div>
      <div class="p-muted" style="font-size:12.5px;margin-top:2px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtmlAdmin(u.village || u.city || '')}${u.district ? ', ' + escapeHtmlAdmin(u.district) : ''}</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap;">
        <span class="status-badge ${isGirl ? 'female' : 'male'}">${isGirl ? 'Girl' : 'Boy'}</span>
        ${statusBadge}
        ${payText}
        ${termsBadgeDetail}
      </div>
    </div>

    ${u.accountStatus === 'suspended' ? `
    <div class="card" style="margin-top:14px;background:var(--error-bg);border:1px solid rgba(217,4,41,0.2);padding:12px 14px;">
      <div style="color:var(--error);font-weight:800;font-size:13px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-circle-exclamation"></i> This account is currently Suspended</div>
      <p style="font-size:12px;color:var(--text);margin-top:4px;">This profile is hidden from the community. You can reactivate it below anytime.</p>
    </div>` : ''}

    <div class="section-label">Admin Controls & Actions</div>
    <div class="card" style="padding:14px;margin-bottom:16px;">
      <div class="toggle-row" style="margin-bottom:12px;">
        <div><div class="tlabel" style="font-weight:700;">Live Search Visibility</div><div class="tsub">Toggle whether this profile appears in live searches</div></div>
        <button class="toggle ${u.visible ? 'on' : ''}" onclick="toggleVisible('${u.id}', this)"></button>
      </div>
      <div class="btn-row" style="margin-bottom:8px;">
        <button class="btn btn-primary" style="flex:1;" onclick="openAdminEditUserModal('${u.id}')">
          <i class="fa-solid fa-user-pen"></i> Edit Profile Details
        </button>
      </div>
      <div class="btn-row">
        <button class="btn btn-outline" style="flex:1;" onclick="openSuspendModal('${u.id}')">
          <i class="fa-solid fa-power-off"></i> ${u.accountStatus === 'active' ? 'Suspend Account' : 'Reactivate Account'}
        </button>
        <button class="btn btn-danger" style="flex:1;" onclick="openDeleteModal('${u.id}')">
          <i class="fa-solid fa-trash"></i> Delete Account
        </button>
      </div>
    </div>

    <!-- Legal Agreement & Consent Verification -->
    <div class="section-label">Legal Agreement & Consent Verification</div>
    <div class="card" style="padding:14px;margin-bottom:16px;background:linear-gradient(135deg, rgba(123,44,191,0.03), rgba(46,196,182,0.06));border:1.5px solid rgba(46,196,182,0.35);border-radius:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:12px;background:rgba(46,196,182,0.18);color:#2EC4B6;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid rgba(46,196,182,0.3);">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <div style="font-weight:800;font-size:13.5px;color:var(--text);">Terms &amp; Privacy Policy Agreed</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">User verified &amp; accepted Terms of Service, Privacy Policy &amp; Refund Policy</div>
          </div>
        </div>
        <span class="status-badge active" style="font-size:11px;padding:4px 10px;background:rgba(46,196,182,0.15);color:#2EC4B6;border:1px solid rgba(46,196,182,0.35);">
          <i class="fa-solid fa-check-double"></i> Verified
        </span>
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(0,0,0,0.08);font-size:12px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span><i class="fa-regular fa-calendar-check" style="margin-right:5px;color:#2EC4B6;"></i> Acceptance Timestamp:</span>
        <span style="font-weight:800;color:var(--text);">${formatConsentDate(u.agreedTermsAt || u.registered || u.created_at)}</span>
      </div>
    </div>

    <!-- Uploaded Photos (1, 2, or 3) Gallery -->
    <div class="section-label" style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
      <span>Uploaded Photos (${photos.length})</span>
      <span style="font-size:11.5px;color:var(--text-muted);font-weight:600;">
        ${photos.length === 1 ? '1 Photo uploaded' : `${photos.length} Photos uploaded`}
      </span>
    </div>
    <div class="admin-photo-grid count-${Math.min(photos.length, 3)}">
      ${photos.map((pUrl, idx) => {
          const isMain = idx === 0;
          const badgeTxt = isMain ? 'Slot 1 (Main Profile)' : `Photo ${idx + 1}`;
          const safeUrl = escapeHtmlAdmin(pUrl);
          const safeName = escapeHtmlAdmin(u.name || 'Member');
          return `
          <div class="admin-photo-card" onclick="openAdminPhotoPreview('${safeUrl}', '${safeName} - ${badgeTxt}', '${badgeTxt}')" title="Click to view full photo">
            <span class="photo-badge ${isMain ? 'main' : ''}">${badgeTxt}</span>
            <img src="${safeUrl}" alt="${safeName} photo ${idx + 1}">
            <div class="photo-zoom-hint"><i class="fa-solid fa-expand"></i></div>
          </div>`;
      }).join('')}
    </div>

    <div class="section-label">Personal Details</div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-graduation-cap"></i> Education</div><div class="dval">${escapeHtmlAdmin(u.education || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Occupation</div><div class="dval">${escapeHtmlAdmin(u.occ || u.occupation || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-calendar-days"></i> Date of Birth</div><div class="dval">${escapeHtmlAdmin(u.dob || (u.age ? u.age + ' Years' : '—'))}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-sack-dollar"></i> Monthly Income</div><div class="dval">${escapeHtmlAdmin(u.income || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-ruler-vertical"></i> Height</div><div class="dval">${escapeHtmlAdmin(u.height ? (String(u.height).includes('cm') || String(u.height).includes("'") ? u.height : u.height + ' cm') : '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-weight-scale"></i> Weight</div><div class="dval">${escapeHtmlAdmin(u.weight ? (String(u.weight).includes('kg') ? u.weight : u.weight + ' kg') : '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-ring"></i> Marital Status</div><div class="dval">${escapeHtmlAdmin(u.marital || 'Unmarried')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-heart-pulse"></i> Physical Status</div><div class="dval">${escapeHtmlAdmin(u.physical || 'Normal')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-users"></i> Caste / Community</div><div class="dval">${escapeHtmlAdmin(u.community || u.caste || '—')}</div></div>
    <div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:12px 0;">
      <div class="dlabel"><i class="fa-solid fa-icons" style="color:var(--primary);"></i> Hobbies</div>
      <div class="chip-row" style="margin-top:2px;">
        ${renderAdminHobbiesHtml(u.hobbies)}
      </div>
    </div>

    <div class="section-label">Family Details</div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-user-tie"></i> Father's Name</div><div class="dval">${escapeHtmlAdmin(u.father || u.fatherName || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Father's Occupation</div><div class="dval">${escapeHtmlAdmin(u.fatherOcc || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person-dress"></i> Mother's Name</div><div class="dval">${escapeHtmlAdmin(u.mother || u.motherName || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Mother's Occupation</div><div class="dval">${escapeHtmlAdmin(u.motherOcc || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person"></i> Sister</div><div class="dval">${escapeHtmlAdmin(u.sister || 'None')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person"></i> Brother</div><div class="dval">${escapeHtmlAdmin(u.brother || 'None')}</div></div>

    <div class="section-label">Residential Address</div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-location-dot"></i> Village / City</div><div class="dval">${escapeHtmlAdmin(u.village || u.city || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-map"></i> Taluka</div><div class="dval">${escapeHtmlAdmin(u.taluka || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-map-location-dot"></i> District</div><div class="dval">${escapeHtmlAdmin(u.district || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-house"></i> Full Address</div><div class="dval">${escapeHtmlAdmin(u.fullAddress || u.address || ((u.city || u.village || '') + (u.district ? ', ' + u.district : '')) || '—')}</div></div>

    <div class="section-label">Contact Information</div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-envelope"></i> Email</div><div class="dval">${escapeHtmlAdmin(u.email || '—')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-mobile-screen"></i> Own Mobile (Internal)</div><div class="dval">${escapeHtmlAdmin(u.ownMobile || u.mobile || '—')}<span class="privacy-tag"><i class="fa-solid fa-eye-slash"></i> Admin only</span></div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-phone"></i> Father's Mobile</div><div class="dval">${escapeHtmlAdmin(u.fatherMobile || '—')}<span class="privacy-tag" style="background:var(--success-bg);color:var(--success);"><i class="fa-solid fa-eye"></i> Public Contact</span></div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-calendar-days"></i> Registered Date</div><div class="dval">${escapeHtmlAdmin(u.registered || '—')}</div></div>

    <div class="section-label">Interests & Matches <span class="sl-action" onclick="setInterestTab('pending');go('scr-interests')">View all</span></div>
    <div id="userInterestsWrap"></div>
`;
            go('scr-userdetail');
            renderUserInterestsMini(u.id);
        }


        /* ============================================================ INTERESTS & MATCHES ============================================================ */
        function setInterestTab(t) {
            state.interestTab = t;
            document.querySelectorAll('#interestTabs button').forEach(b => b.classList.toggle('active', b.dataset.i === t));
            renderInterests();
        }

        function renderInterests() {
            buildTabbar('tabbarInterests', 'interests');
            const pCount = INTERESTS.filter(i => (i.status || '').toLowerCase() === 'pending').length;
            const aCount = INTERESTS.filter(i => (i.status || '').toLowerCase() === 'accepted').length;
            const dCount = INTERESTS.filter(i => (i.status || '').toLowerCase() === 'declined').length;

            const pEl = document.getElementById('intCountPending');
            const aEl = document.getElementById('intCountAccepted');
            const dEl = document.getElementById('intCountDeclined');
            if (pEl) pEl.textContent = pCount;
            if (aEl) aEl.textContent = aCount;
            if (dEl) dEl.textContent = dCount;

            const currentTab = (state.interestTab || 'pending').toLowerCase();
            const list = INTERESTS.filter(i => (i.status || '').toLowerCase() === currentTab);
            const wrap = document.getElementById('interestList');
            if (!wrap) return;
            wrap.innerHTML = '';

            if (list.length === 0) {
                const msg = {
                    pending: ['hourglass-half', 'No pending requests', 'Interest requests waiting on a response will show up here.'],
                    accepted: ['heart-circle-check', 'No matches yet', 'Accepted interest requests (matches) will show up here.'],
                    declined: ['circle-xmark', 'No declined requests', 'Declined interest requests will show up here.']
                }[currentTab] || ['hourglass-half', 'No requests', 'No data for this category.'];
                wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-${msg[0]}"></i><h3>${msg[1]}</h3><p>${msg[2]}</p></div>`;
                return;
            }

            list.forEach(i => {
                const from = findUser(i.fromUserId) || {
                    id: i.fromUserId,
                    name: i.senderName || ('Member #' + i.fromUserId),
                    img: i.senderPhoto || 'images/default_avatar.png'
                };
                const to = findUser(i.toUserId) || {
                    id: i.toUserId,
                    name: i.receiverName || ('Member #' + i.toUserId),
                    img: i.receiverPhoto || 'images/default_avatar.png'
                };

                const row = document.createElement('div');
                row.className = 'row-item';
                row.innerHTML = `
      <div class="pair-row"><img src="${escapeHtmlAdmin(from.img)}" alt="${escapeHtmlAdmin(from.name)}"><img src="${escapeHtmlAdmin(to.img)}" alt="${escapeHtmlAdmin(to.name)}"></div>
      <div class="rbody" style="margin-left:6px;">
        <div class="rtitle" style="font-size:13px;">${escapeHtmlAdmin(from.name)} <i class="fa-solid fa-arrow-right pair-arrow"></i> ${escapeHtmlAdmin(to.name)}</div>
        <div class="rsub">${escapeHtmlAdmin(i.date || '')}${i.senderCaste ? ' · ' + escapeHtmlAdmin(i.senderCaste) : ''}</div>
      </div>
      <span class="status-badge ${(i.status || 'pending').toLowerCase()}">${fmtStatus(i.status)}</span>
      <i class="fa-solid fa-chevron-right chev"></i>`;
                row.addEventListener('click', () => openInterestDetail(i.id));
                wrap.appendChild(row);
            });
        }

        function openInterestDetail(interestId) {
            state.activeInterestId = interestId;
            const i = INTERESTS.find(x => x.id === interestId);
            if (!i) return;
            const from = findUser(i.fromUserId) || {
                id: i.fromUserId,
                name: i.senderName || ('Member #' + i.fromUserId),
                img: i.senderPhoto || 'images/default_avatar.png'
            };
            const to = findUser(i.toUserId) || {
                id: i.toUserId,
                name: i.receiverName || ('Member #' + i.toUserId),
                img: i.receiverPhoto || 'images/default_avatar.png'
            };

            const el = document.getElementById('interestDetailContent');
            if (!el) return;
            el.innerHTML = `
    <div class="center-txt" style="margin-bottom:18px;">
      <span class="status-badge ${(i.status || 'pending').toLowerCase()}" style="font-size:12px;padding:7px 16px;">${fmtStatus(i.status)}</span>
      <div class="p-muted" style="margin-top:8px;font-size:12px;">${escapeHtmlAdmin(i.date || '')}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:22px;">
      <div class="center-txt" style="cursor:pointer;" onclick="openUserDetail('${from.id}')">
        <img src="${escapeHtmlAdmin(from.img)}" style="width:72px;height:72px;border-radius:20px;object-fit:cover;box-shadow:var(--shadow-card);" alt="${escapeHtmlAdmin(from.name)}">
        <div style="font-weight:800;font-size:13px;margin-top:8px;">${escapeHtmlAdmin(from.name)}</div>
        <div class="p-muted" style="font-size:11px;">Sender</div>
      </div>
      <i class="fa-solid fa-heart" style="color:var(--primary);font-size:20px;"></i>
      <div class="center-txt" style="cursor:pointer;" onclick="openUserDetail('${to.id}')">
        <img src="${escapeHtmlAdmin(to.img)}" style="width:72px;height:72px;border-radius:20px;object-fit:cover;box-shadow:var(--shadow-card);" alt="${escapeHtmlAdmin(to.name)}">
        <div style="font-weight:800;font-size:13px;margin-top:8px;">${escapeHtmlAdmin(to.name)}</div>
        <div class="p-muted" style="font-size:11px;">Receiver</div>
      </div>
    </div>

    <div class="section-label" style="margin-top:0;">Details</div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-paper-plane"></i> Sent by</div><div class="dval">${escapeHtmlAdmin(from.name)}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-inbox"></i> Sent to</div><div class="dval">${escapeHtmlAdmin(to.name)}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-clock"></i> Sent</div><div class="dval">${escapeHtmlAdmin(i.date || '')}</div></div>
    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-circle-info"></i> Status</div><div class="dval"><span class="status-badge ${(i.status || 'pending').toLowerCase()}">${fmtStatus(i.status)}</span></div></div>

    ${(i.status || '').toLowerCase() === 'accepted' ? `
    <div class="section-label">Conversation</div>
    <p class="p-muted" style="margin-top:-8px;margin-bottom:12px;">This request turned into a match — view live chat messages for safety and moderation.</p>
    <button class="btn btn-outline" onclick="openChatMonitor('${from.id}', '${to.id}')"><i class="fa-solid fa-comments"></i> View live conversation</button>
    ` : ''}

    <button class="btn btn-ghost" style="margin-top:18px;" onclick="goBack()"><i class="fa-solid fa-arrow-left"></i> Back to list</button>
    `;
            go('scr-interestdetail');
        }

        async function openChatMonitor(userIdA, userIdB, silentRefresh = false) {
            window.activeChatMonitorPair = { userA: userIdA, userB: userIdB };
            try {
                sessionStorage.setItem('admin_chatUserA', userIdA);
                sessionStorage.setItem('admin_chatUserB', userIdB);
            } catch(e) {}
            const a = findUser(userIdA) || { id: userIdA, name: 'User #' + userIdA, img: 'images/default_avatar.png' };
            const b = findUser(userIdB) || { id: userIdB, name: 'User #' + userIdB, img: 'images/default_avatar.png' };

            const header = document.getElementById('chatMonitorHeader');
            if (header) {
                header.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="pair-row"><img src="${escapeHtmlAdmin(a.img)}" alt="${escapeHtmlAdmin(a.name)}"><img src="${escapeHtmlAdmin(b.img)}" alt="${escapeHtmlAdmin(b.name)}"></div>
      <div style="margin-left:6px;">
        <div style="font-weight:800;font-size:14.5px;">${escapeHtmlAdmin(a.name)} &amp; ${escapeHtmlAdmin(b.name)}</div>
        <div class="p-muted" style="font-size:11.5px;"><i class="fa-solid fa-cloud" style="color:var(--success);margin-right:4px;"></i> Live Matched Conversation (Supabase DB)</div>
      </div>
    </div>`;
            }

            const wrap = document.getElementById('chatMonitorMessages');
            if (!wrap) return;
            if (!silentRefresh) {
                wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><h3>Loading conversation...</h3></div>`;
                go('scr-chatmonitor');
            }

            let messages = [];
            if (typeof supabaseFetchChatMessagesForAdmin === 'function') {
                messages = await supabaseFetchChatMessagesForAdmin(userIdA, userIdB);
            }
            if (!messages || messages.length === 0) {
                const key1 = `${userIdA}-${userIdB}`, key2 = `${userIdB}-${userIdA}`;
                messages = CHAT_LOGS[key1] || CHAT_LOGS[key2] || [];
            }

            wrap.innerHTML = '';
            if (messages.length === 0) {
                wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-comments"></i><h3>No messages yet</h3><p>This match hasn't exchanged any messages so far.</p></div>`;
            } else {
                messages.forEach(m => {
                    const senderId = m.from || m.senderId;
                    const isA = String(senderId) === String(userIdA);
                    const sender = isA ? a : b;
                    const isDeleted = !!(m.isDeleted || m.is_deleted);
                    const row = document.createElement('div');
                    row.className = 'chat-bubble-row';
                    row.style.justifyContent = isA ? 'flex-start' : 'flex-end';

                    let displayText = escapeHtmlAdmin(m.text || '');
                    if (isDeleted) {
                        displayText = `<i class="fa-solid fa-ban" style="opacity:0.75;margin-right:4px;"></i><span style="font-style:italic;opacity:0.85;">This message was deleted by author</span>`;
                    }
                    const editedBadge = m.edited ? `<span style="font-size:9.5px;opacity:0.85;margin-left:6px;"><i class="fa-solid fa-pen-nib"></i> Edited</span>` : '';

                    row.innerHTML = `<div class="chat-bubble" style="background:${isA ? 'var(--surface)' : 'var(--grad-primary)'};color:${isA ? 'var(--text)' : '#fff'};border:1px solid ${isA ? 'var(--border)' : 'transparent'};max-width:82%;border-radius:14px;padding:10px 14px;box-shadow:var(--shadow-card);">
                        <div style="font-size:10.5px;font-weight:800;opacity:.8;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>${escapeHtmlAdmin(sender ? sender.name : ('User #' + senderId))}</span>
                            ${editedBadge}
                        </div>
                        <div style="font-size:13px;line-height:1.4;">${displayText}</div>
                        <div class="ctime" style="font-size:10px;opacity:0.75;margin-top:4px;text-align:right;">${escapeHtmlAdmin(m.time || '')}</div>
                    </div>`;
                    wrap.appendChild(row);
                });
            }
        }

        function escapeHtmlAdmin(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        /* ============================================================ PAYMENTS ============================================================ */
        function setPayTab(t) {
            state.payTab = t;
            document.querySelectorAll('#payTabs button').forEach(b => b.classList.toggle('active', b.dataset.p === t));
            renderPayments();
        }

        function renderPayments() {
            buildTabbar('tabbarPay', 'pay');
            const revenue = PAYMENTS.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
            document.getElementById('payTotalRevenue').textContent = '₹' + revenue;
            document.getElementById('payTotalTxns').textContent = PAYMENTS.length;
            document.getElementById('payFailedCount').textContent = PAYMENTS.filter(p => p.status === 'failed').length;

            let list = PAYMENTS.slice();
            if (state.payTab !== 'all') list = list.filter(p => p.status === state.payTab);
            const wrap = document.getElementById('payList');
            wrap.innerHTML = '';
            if (list.length === 0) {
                wrap.innerHTML =
                    `<div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>No transactions</h3><p>Nothing to show for this filter yet.</p></div>`; return;
            }
            list.forEach(p => {
                const u = findUser(p.userId);
                const row = document.createElement('div');
                row.className = 'row-item';
                row.innerHTML = `
      <img class="ravatar" src="${u ? u.img : ''}" alt="">
      <div class="rbody">
        <div class="rtitle">${u ? u.name : 'Unknown member'}</div>
        <div class="rsub">${p.plan} · ${p.method} · ${p.id}</div>
      </div>
      <div class="rmeta"><span class="ramount">₹${p.amount}</span><span class="status-badge ${p.status}">${fmtStatus(p.status)}</span></div>`;
                row.addEventListener('click', () => openPayDetail(p.id));
                wrap.appendChild(row);
            });
        }

        function openPayDetail(txnId) {
            const p = PAYMENTS.find(x => x.id === txnId);
            if (!p) return;
            const u = findUser(p.userId);
            state.activePayId = txnId;

            const modalBody = document.getElementById('payDetailBody');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-receipt"></i> Transaction ID</div><div class="dval"><b style="color:var(--primary);">${escapeHtml(p.id)}</b></div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-user"></i> Member Name</div><div class="dval" style="font-weight:700;">${escapeHtml(u ? u.name : 'Unknown member')}</div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-layer-group"></i> Plan</div><div class="dval">${escapeHtml(p.plan)}</div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-indian-rupee-sign"></i> Amount Paid</div><div class="dval" style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--primary-dark);">₹${p.amount}</div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-mobile-screen-button"></i> Payment Method</div><div class="dval">${escapeHtml(p.method)}</div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-circle-info"></i> Status</div><div class="dval"><span class="status-badge ${p.status}">${fmtStatus(p.status)}</span></div></div>
                    <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-clock"></i> Date &amp; Time</div><div class="dval">${escapeHtml(p.date)} · ${escapeHtml(p.time || '')}</div></div>
                `;
                openModal('modalPayDetail');
            } else {
                showToast(`${p.id} · ${fmtStatus(p.status)} · ₹${p.amount}`);
            }
        }

        /* ============================================================ PROFILE VISIBILITY MANAGEMENT ============================================================ */
        function renderProfileMgmt(query) {
            let list = USERS.filter(u => u.accountStatus !== 'suspended');
            if (query) {
                const q = query.toLowerCase();
                list = list.filter(u => u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q));
            }
            const wrap = document.getElementById('profileMgmtList');
            wrap.innerHTML = '';
            if (list.length === 0) {
                wrap.innerHTML =
                    `<div class="empty-state"><i class="fa-solid fa-id-card-clip"></i><h3>No live profiles</h3><p>Active members will appear here.</p></div>`; return;
            }
            list.forEach(u => {
                const row = document.createElement('div');
                row.className = 'row-item';
                row.style.cursor = 'default';
                row.innerHTML = `
      <img class="ravatar" src="${u.img}" alt="${u.name}">
      <div class="rbody"><div class="rtitle">${u.name}${u.featured ? ' <i class="fa-solid fa-star" style="color:var(--accent);font-size:11px;"></i>' : ''}</div><div class="rsub">${u.city} · ${u.gender === 'girls' ? 'Girls' : 'Boys'}</div></div>
      <div class="rmeta" style="flex-direction:row;gap:14px;align-items:center;">
        <button class="icon-btn" style="width:34px;height:34px;font-size:12px;${u.featured ? 'color:var(--accent-deep);' : ''}" onclick="toggleFeatured('${u.id}', this)"><i class="${u.featured ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>
        <button class="toggle ${u.visible ? 'on' : ''}" onclick="toggleVisible('${u.id}', this)"></button>
      </div>`;
                wrap.appendChild(row);
            });
        }

        function toggleFeatured(id, btn) {
            const u = findUser(id);
            if (!u) return;
            u.featured = !u.featured;
            btn.classList.toggle('fa-regular', !u.featured);
            btn.classList.toggle('fa-solid', u.featured);
            btn.style.color = u.featured ? 'var(--accent-deep)' : '';
            const icon = btn.querySelector('i');
            if (icon) icon.className = u.featured ? 'fa-solid fa-star' : 'fa-regular fa-star';
            saveAdminData();
            if (typeof supabaseUpdateProfileStatus === 'function') {
                supabaseUpdateProfileStatus(u.id, { featured: u.featured, email: u.email }).catch(() => {});
            }
            showToast(u.featured ? `${u.name} is now featured` : `${u.name} removed from featured`);
        }

        /* ============================================================ REPORTS ============================================================ */
        function setReportTab(t) {
            state.reportTab = t;
            document.querySelectorAll('#reportTabs button').forEach(b => b.classList.toggle('active', b.dataset.r === t));
            renderReports();
        }

        function renderReports() {
            const list = REPORTS.filter(r => r.status === state.reportTab);
            const wrap = document.getElementById('reportList');
            if (!wrap) return;
            wrap.innerHTML = '';
            if (list.length === 0) {
                wrap.innerHTML =
                    `<div class="empty-state"><i class="fa-solid fa-flag"></i><h3>Nothing here</h3><p>No ${state.reportTab} reports right now.</p></div>`; return;
            }
            list.forEach(r => {
                const u = findUser(r.userId);
                const reporter = findUser(r.reporterId);
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '12px';
                const photo = (u && u.img) ? u.img : (r.targetUserPhoto || 'images/default-avatar.png');
                const targetName = u ? u.name : (r.targetUserName || 'Member');
                const reporterName = reporter ? reporter.name : (r.reporterName || 'a member');
                const safeReportId = String(r.id);
                const safeUserId = u ? String(u.id) : (r.userId ? String(r.userId) : '');

                card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${photo}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;" alt="" onerror="this.src='images/default-avatar.png'">
        <div style="flex:1;"><div style="font-weight:800;font-size:14px;">${targetName}</div><div class="p-muted" style="font-size:11.5px;">Reported by ${reporterName} · ${r.date}</div></div>
        <span class="status-badge ${r.status}">${fmtStatus(r.status)}</span>
      </div>
      <div class="chip-row" style="margin-top:10px;"><span class="chip" style="background:var(--error-bg);color:var(--error);">${r.reason}</span></div>
      <p class="p-muted" style="margin-top:10px;">${r.details}</p>
      <div class="btn-row" style="margin-top:12px;">
        ${safeUserId ? `<button class="btn btn-outline btn-sm" style="width:100%;" onclick="openUserDetail('${safeUserId}')"><i class="fa-solid fa-id-card"></i> View profile</button>` : ''}
        ${r.status === 'open' ? `<button class="btn btn-primary btn-sm" style="width:100%;" onclick="openResolveReportModal('${safeReportId}')"><i class="fa-solid fa-check"></i> Resolve</button>` : ''}
      </div>`;
                wrap.appendChild(card);
            });
        }

        function openResolveReportModal(id) {
            state.activeReportId = id;
            openModal('modalResolveReport');
        }

        async function doResolveReport() {
            const r = REPORTS.find(x => String(x.id) === String(state.activeReportId));
            if (r) {
                r.status = 'resolved';
                if (typeof supabaseUpdateReportStatus === 'function') {
                    await supabaseUpdateReportStatus(r.id, 'resolved');
                }
            }
            closeModal('modalResolveReport');
            saveAdminData();
            showToast('Report marked as resolved');
            renderReports();
        }

        /* ============================================================ NOTIFICATIONS ============================================================ */
        function renderNotifs() {
            const wrap = document.getElementById('notifList');
            if (!wrap) return;
            wrap.innerHTML = '';

            if (!NOTIFS || NOTIFS.length === 0) {
                wrap.innerHTML = `
                    <div class="empty-state" style="padding:60px 20px;text-align:center;">
                        <div style="width:72px;height:72px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">
                            <i class="fa-solid fa-bell-slash"></i>
                        </div>
                        <h3 style="font-weight:800;font-size:17px;color:var(--text);margin-bottom:6px;">No notifications</h3>
                        <p class="p-muted" style="font-size:13px;max-width:280px;margin:0 auto;">
                            Live member registrations, payment alerts, and community reports will appear here in real-time.
                        </p>
                    </div>`;
                updateAdminNotifBadge();
                return;
            }

            NOTIFS.forEach((n, idx) => {
                const row = document.createElement('div');
                row.className = 'notif-item' + (n.unread ? ' unread' : '');
                row.style.cursor = 'pointer';
                const notifRef = n.id || String(idx);
                row.onclick = () => handleAdminNotifClick(notifRef);

                const safeTxt = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.txt) : escapeHtml(n.txt);
                const safeSub = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.sub) : escapeHtml(n.sub);
                const safeTime = typeof escapeHtmlAdmin === 'function' ? escapeHtmlAdmin(n.time) : escapeHtml(n.time);
                const safeIcon = (n.icon || 'fa-bell').replace(/[^a-zA-Z0-9_-]/g, '');
                row.innerHTML =
                    `<div class="nicon"><i class="fa-solid ${safeIcon}"></i></div><div style="flex:1;min-width:0;"><div class="ntxt">${safeTxt}</div><div class="nsub" style="word-break:break-word;">${safeSub}</div><div class="ntime">${safeTime}</div></div>${n.unread ? '<div class="notif-dot"></div>' : ''}`;
                wrap.appendChild(row);
            });

            updateAdminNotifBadge();
        }

        function handleAdminNotifClick(notifRef) {
            const n = NOTIFS.find((item, idx) => item.id === notifRef || String(idx) === notifRef);
            if (!n) return;

            n.unread = false;
            localStorage.setItem(LS_NOTIFS_KEY, JSON.stringify(NOTIFS));
            updateAdminNotifBadge();

            const activeScr = document.querySelector('.screen.active');
            if (activeScr && activeScr.id === 'scr-notifs') {
                renderNotifs();
            }

            // Contextual navigation
            if (n.type === 'user' && n.targetId) {
                if (typeof openUserDetail === 'function') openUserDetail(n.targetId);
            } else if (n.type === 'payment') {
                if (typeof setPayTab === 'function') setPayTab('all');
                go('scr-payments');
            } else if (n.type === 'interest' && n.targetId) {
                if (typeof openInterestDetail === 'function') openInterestDetail(n.targetId);
                else go('scr-interests');
            } else if (n.type === 'report') {
                go('scr-reports');
            }
        }

        function markAllAdminNotifsAsRead() {
            if (!NOTIFS || NOTIFS.length === 0) return;
            NOTIFS.forEach(n => { n.unread = false; });
            localStorage.setItem(LS_NOTIFS_KEY, JSON.stringify(NOTIFS));
            updateAdminNotifBadge();
            renderNotifs();
            if (typeof renderDashboard === 'function') renderDashboard();
            showToast('All admin notifications marked as read');
        }

        function updateAdminNotifBadge() {
            const unreadCount = Array.isArray(NOTIFS) ? NOTIFS.filter(n => n.unread).length : 0;
            const badge = document.getElementById('adminNotifBadge');
            if (badge) {
                if (unreadCount > 0) {
                    badge.style.display = 'flex';
                    badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
                } else {
                    badge.style.display = 'none';
                }
            }
        }

        window.handleAdminNotifClick = handleAdminNotifClick;
        window.markAllAdminNotifsAsRead = markAllAdminNotifsAsRead;
        window.updateAdminNotifBadge = updateAdminNotifBadge;

        /* ============================================================ HELP & SUPPORT (ADMIN MANAGE) ============================================================ */
        function setHelpTab(t) {
            state.helpTab = t;
            sessionStorage.setItem('admin_helpTab', t);
            const fTab = document.getElementById('helpTabFaq');
            const gTab = document.getElementById('helpTabGuide');
            const cTab = document.getElementById('helpTabContact');
            if (fTab) fTab.classList.toggle('active', t === 'faq');
            if (gTab) gTab.classList.toggle('active', t === 'guide');
            if (cTab) cTab.classList.toggle('active', t === 'contact');
            renderHelp();
        }

        function renderHelp() {
            const wrap = document.getElementById('helpContent');
            if (!wrap) return;

            if (state.helpTab === 'faq') {
                wrap.innerHTML = `
        <div class="section-label" style="margin-top:0;display:flex;justify-content:space-between;align-items:center;">
          <span>Published FAQs (${FAQS.length})</span> 
          <span class="sl-action" onclick="openFaqForm()"><i class="fa-solid fa-plus"></i> Add FAQ</span>
        </div>` +
                    FAQS.map(([q, a], i) => `
        <div class="card" style="margin-bottom:10px;padding:14px 16px;border-radius:16px;box-shadow:var(--shadow-card);">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="flex:1;"><div style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(q)}</div><div class="p-muted" style="margin-top:6px;font-size:12.5px;line-height:1.5;">${escapeHtml(a)}</div></div>
            <div class="action-group" style="flex-shrink:0;display:flex;gap:6px;">
              <button class="icon-btn edit" title="Edit FAQ" onclick="editFaq(${i})"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete" title="Delete FAQ" onclick="confirmDelete('faq', ${i}, '${escapeHtml(q).replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>`).join('');
            } else if (state.helpTab === 'guide') {
                wrap.innerHTML = `
      <div class="section-label" style="margin-top:0;display:flex;justify-content:space-between;align-items:center;">
        <span>How it Works Steps (${GUIDE_STEPS.length})</span> 
        <span class="sl-action" onclick="openGuideForm()"><i class="fa-solid fa-plus"></i> Add Step</span>
      </div>
      <p class="p-muted" style="margin-top:4px;font-size:12.5px;">Step-by-step guide shown to members on Welcome screen popup modal and in-app Guide screen.</p>
      <div class="step-list" style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">
        ${GUIDE_STEPS.map((s, i) => {
            const step = typeof s === 'string' ? { title: s, desc: '' } : s;
            return `
        <div class="card" style="padding:14px 16px;border-radius:16px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;box-shadow:var(--shadow-card);">
          <div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0;">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--grad-primary);color:#fff;font-weight:800;font-size:12.5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
              ${i + 1}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(step.title || '')}</div>
              <div class="p-muted" style="margin-top:4px;font-size:12.5px;line-height:1.5;word-break:break-word;">${escapeHtml(step.desc || 'No description added.')}</div>
            </div>
          </div>
          <div class="action-group" style="flex-shrink:0;display:flex;gap:6px;">
            <button class="icon-btn edit" title="Edit Step" onclick="editGuideStep(${i})"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn delete" title="Delete Step" onclick="confirmDelete('guide', ${i}, '${escapeHtml(step.title || '').replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
        }).join('')}
      </div>`;
            } else {
                let contact = { whatsapp: '+91 97263 62863', phone: '+91 97263 62863', email: 'lagnasetu330@gmail.com' };
                try {
                    const stored = localStorage.getItem(LS_CONTACT_KEY);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed.whatsapp && !parsed.whatsapp.includes('98765')) contact.whatsapp = parsed.whatsapp;
                        if (parsed.phone && !parsed.phone.includes('4000')) contact.phone = parsed.phone;
                        if (parsed.email) contact.email = parsed.email;
                    }
                } catch(e) {}
                wrap.innerHTML = `
      <div class="field"><label>Support WhatsApp number</label><input class="input" id="supportWhatsapp" value="${escapeHtml(contact.whatsapp)}"></div>
      <div class="field"><label>Support phone number</label><input class="input" id="supportPhone" value="${escapeHtml(contact.phone)}"></div>
      <div class="field"><label>Support email</label><input class="input" id="supportEmail" value="${escapeHtml(contact.email)}"></div>
      <button class="btn btn-primary" onclick="saveContactDetails()"><i class="fa-solid fa-floppy-disk"></i> Save contact details</button>`;
            }
        }

        function saveContactDetails() {
            const wa = document.getElementById('supportWhatsapp')?.value.trim() || '+91 97263 62863';
            const phone = document.getElementById('supportPhone')?.value.trim() || '+91 97263 62863';
            const email = document.getElementById('supportEmail')?.value.trim() || 'lagnasetu330@gmail.com';
            const contact = { whatsapp: wa, phone: phone, email: email };
            localStorage.setItem(LS_CONTACT_KEY, JSON.stringify(contact));
            showToast('Contact details saved successfully');
        }

        /* ========== DELETE CONFIRMATION ========== */
        function confirmDelete(type, index, name) {
            state.deleteTarget = { type: type, index: index };
            const title = document.getElementById('deleteConfirmTitle');
            const text = document.getElementById('deleteConfirmText');
            const btn = document.getElementById('deleteConfirmBtn');

            if (type === 'caste') {
                title.textContent = 'Delete Caste / Community?';
                text.textContent = `Are you sure you want to remove "${name}" from the community directory?`;
                btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Caste';
            } else if (type === 'faq') {
                title.textContent = 'Delete FAQ?';
                text.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
                btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete FAQ';
            } else {
                title.textContent = 'Delete Step?';
                text.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
                btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Step';
            }

            openModal('modalDeleteConfirm');
        }

        function executeDelete() {
            const target = state.deleteTarget;
            if (!target) return;

            if (target.type === 'caste') {
                if (target.index >= 0 && target.index < CASTES_DATA.length) {
                    const removed = CASTES_DATA.splice(target.index, 1);
                    saveCastesData();
                    showToast(`Caste "${removed[0]?.name || ''}" deleted`);
                    renderCastes();
                }
            } else if (target.type === 'faq') {
                if (target.index >= 0 && target.index < FAQS.length) {
                    FAQS.splice(target.index, 1);
                    saveAdminData();
                    showToast('FAQ deleted successfully');
                }
            } else if (target.type === 'guide') {
                if (target.index >= 0 && target.index < GUIDE_STEPS.length) {
                    GUIDE_STEPS.splice(target.index, 1);
                    saveAdminData();
                    showToast('Step deleted successfully');
                }
            }

            closeModal('modalDeleteConfirm');
            state.deleteTarget = null;
            renderHelp();
        }

        /* ========== FAQ CRUD ========== */
        function openFaqForm(index) {
            if (index !== undefined && index >= 0 && index < FAQS.length) {
                document.getElementById('faqFormTitle').textContent = 'Edit FAQ';
                document.getElementById('faqQuestion').value = FAQS[index][0];
                document.getElementById('faqAnswer').value = FAQS[index][1];
                document.getElementById('faqEditIndex').value = index;
            } else {
                document.getElementById('faqFormTitle').textContent = 'Add FAQ';
                document.getElementById('faqQuestion').value = '';
                document.getElementById('faqAnswer').value = '';
                document.getElementById('faqEditIndex').value = '-1';
            }
            openModal('modalFaqForm');
        }

        function editFaq(index) {
            openFaqForm(index);
        }

        function saveFaq() {
            const q = document.getElementById('faqQuestion').value.trim();
            const a = document.getElementById('faqAnswer').value.trim();
            if (!q || !a) {
                showToast('Please fill in both question and answer');
                return;
            }
            const idx = parseInt(document.getElementById('faqEditIndex').value);
            if (idx >= 0 && idx < FAQS.length) {
                FAQS[idx] = [q, a];
                saveAdminData();
                showToast('FAQ updated successfully');
            } else {
                FAQS.push([q, a]);
                saveAdminData();
                showToast('FAQ added successfully');
            }
            closeModal('modalFaqForm');
            renderHelp();
        }

        /* ========== GUIDE STEPS CRUD ========== */
        function openGuideForm(index) {
            if (index !== undefined && index >= 0 && index < GUIDE_STEPS.length) {
                const step = typeof GUIDE_STEPS[index] === 'string' ? { title: GUIDE_STEPS[index], desc: '' } : GUIDE_STEPS[index];
                document.getElementById('guideFormTitle').textContent = 'Edit Step';
                document.getElementById('guideStep').value = step.title || '';
                document.getElementById('guideStepDesc').value = step.desc || '';
                document.getElementById('guideEditIndex').value = index;
            } else {
                document.getElementById('guideFormTitle').textContent = 'Add Step';
                document.getElementById('guideStep').value = '';
                document.getElementById('guideStepDesc').value = '';
                document.getElementById('guideEditIndex').value = '-1';
            }
            openModal('modalGuideForm');
        }

        function editGuideStep(index) {
            openGuideForm(index);
        }

        function saveGuideStep() {
            const stepTitle = document.getElementById('guideStep').value.trim();
            const stepDesc = document.getElementById('guideStepDesc').value.trim();
            if (!stepTitle) {
                showToast('Please enter a step title');
                return;
            }
            const idx = parseInt(document.getElementById('guideEditIndex').value);
            const stepObj = { title: stepTitle, desc: stepDesc };
            if (idx >= 0 && idx < GUIDE_STEPS.length) {
                GUIDE_STEPS[idx] = stepObj;
                saveAdminData();
                showToast('Step updated successfully');
            } else {
                GUIDE_STEPS.push(stepObj);
                saveAdminData();
                showToast('Step added successfully');
            }
            closeModal('modalGuideForm');
            renderHelp();
        }

        /* ============================================================ TAB BARS (mobile) ============================================================ */
        function buildTabbar(elId, active) {
            const el = document.getElementById(elId);
            if (!el) return;
            el.innerHTML = `
    <button class="tab ${active === 'dashboard' ? 'active' : ''}" onclick="go('scr-dashboard')"><i class="fa-solid fa-gauge-high"></i>Home</button>
    <button class="tab ${active === 'users' ? 'active' : ''}" onclick="go('scr-users')"><i class="fa-solid fa-users"></i>Users</button>
    <div class="tab fab" onclick="openMenu()"><div class="fabcircle"><i class="fa-solid fa-bars"></i></div></div>
    <button class="tab ${active === 'pay' ? 'active' : ''}" onclick="setPayTab('all');go('scr-payments')"><i class="fa-solid fa-credit-card"></i>Payments</button>
    <button class="tab ${active === 'analytics' ? 'active' : ''}" onclick="go('scr-analytics')"><i class="fa-solid fa-chart-line"></i>Analytics</button>`;
        }

        
/* ============================================================ CASTE & COMMUNITY MANAGEMENT ============================================================ */
function renderCastes(query) {
    const wrap = document.getElementById('casteAdminList');
    if (!wrap) return;

    // Stats
    const total = CASTES_DATA.length;
    const customCount = CASTES_DATA.filter(c => c.custom).length;
    const groupSet = new Set(CASTES_DATA.map(c => c.group || 'Other'));

    const totalEl = document.getElementById('casteStatTotal');
    const customEl = document.getElementById('casteStatCustom');
    const groupsEl = document.getElementById('casteStatGroups');
    if (totalEl) totalEl.textContent = total;
    if (customEl) customEl.textContent = customCount;
    if (groupsEl) groupsEl.textContent = groupSet.size;

    // Filter tabs
    const tabsWrap = document.getElementById('casteGroupTabs');
    if (tabsWrap) {
        const tabs = [
            { id: 'all', label: 'All (' + total + ')' },
            { id: 'custom', label: 'Added by Admin (' + customCount + ')' },
            { id: 'Patidar', label: 'Patidar' },
            { id: 'Brahmin', label: 'Brahmin' },
            { id: 'Kshatriya', label: 'Kshatriya' },
            { id: 'Vishwakarma', label: 'Vishwakarma' },
            { id: 'Prajapati', label: 'Prajapati' },
            { id: 'Vanik', label: 'Vanik / Vaishnav' },
            { id: 'Traditional', label: 'Traditional' },
            { id: 'Scheduled', label: 'Scheduled' }
        ];
        tabsWrap.innerHTML = tabs.map(t => {
            const isActive = state.casteFilterGroup === t.id;
            return `<button class="${isActive ? 'active' : ''}" onclick="setCasteGroupFilter('${t.id}')">${t.label}</button>`;
        }).join('');
    }

    const currentQuery = query !== undefined ? query : (document.getElementById('casteSearchInput')?.value || '');
    const q = currentQuery.trim().toLowerCase();

    let list = CASTES_DATA.map((c, idx) => ({ ...c, originalIndex: idx }));

    if (state.casteFilterGroup === 'custom') {
        list = list.filter(c => c.custom);
    } else if (state.casteFilterGroup !== 'all') {
        list = list.filter(c => c.group && c.group.toLowerCase().includes(state.casteFilterGroup.toLowerCase()));
    }

    if (q) {
        list = list.filter(c =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.guj && c.guj.toLowerCase().includes(q)) ||
            (c.group && c.group.toLowerCase().includes(q)) ||
            (c.keywords && c.keywords.toLowerCase().includes(q))
        );
    }

    wrap.innerHTML = '';
    if (list.length === 0) {
        const isCustomTab = state.casteFilterGroup === 'custom';
        const emptyTitle = isCustomTab ? 'No custom castes added yet' : 'No castes found';
        const emptyDesc = isCustomTab 
            ? 'You haven\'t added any custom castes yet. Click below to add a new community.' 
            : (q ? `No communities match "${escapeHtmlAdmin(q)}".` : 'No communities under this filter.');

        wrap.innerHTML = `
            <div class="empty-state" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:46px 20px;">
                <i class="fa-solid fa-layer-group" style="font-size:38px;color:var(--primary);opacity:0.6;margin-bottom:12px;"></i>
                <h3 style="margin:0 0 6px;">${emptyTitle}</h3>
                <p style="margin:0 auto 16px;max-width:320px;font-size:12.5px;color:var(--text-muted);">${emptyDesc}</p>
                <button class="btn btn-primary" style="margin:0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;" onclick="openCasteModal()">
                    <i class="fa-solid fa-plus"></i> Add New Caste
                </button>
            </div>`;
        return;
    }

    list.forEach(c => {
        const card = document.createElement('div');
        card.className = 'caste-admin-card';
        const safeName = escapeHtmlAdmin(c.name || '');
        const safeGuj = escapeHtmlAdmin(c.guj || '');
        const safeGroup = escapeHtmlAdmin(c.group || 'Community');
        const safeKeywords = escapeHtmlAdmin(c.keywords || '');

        card.innerHTML = `
            <div class="caste-meta">
                <div class="caste-title">
                    <span>${safeName}</span>
                    ${safeGuj ? `<span style="font-size:13.5px;color:var(--text-muted);font-weight:600;">(${safeGuj})</span>` : ''}
                    ${c.custom ? `<span class="privacy-tag" style="background:var(--success-bg);color:var(--success);font-size:10.5px;"><i class="fa-solid fa-shield-check"></i> Added by Admin</span>` : ''}
                </div>
                <div class="caste-sub">
                    <span class="caste-badge-admin"><i class="fa-solid fa-layer-group"></i> ${safeGroup}</span>
                    ${safeKeywords ? `<span><i class="fa-solid fa-tags" style="font-size:10.5px;opacity:0.7;"></i> ${safeKeywords}</span>` : ''}
                    ${c.dateAdded ? `<span style="font-size:11px;opacity:0.8;"><i class="fa-solid fa-calendar"></i> ${escapeHtmlAdmin(c.dateAdded)}</span>` : ''}
                </div>
            </div>
            <div class="action-group">
                <button class="icon-btn edit" onclick="openCasteModal(${c.originalIndex})" title="Edit caste"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn delete" onclick="confirmDelete('caste', ${c.originalIndex}, '${safeName.replace(/'/g, "\\'")}')" title="Delete caste"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        wrap.appendChild(card);
    });
}

function setCasteGroupFilter(groupId) {
    state.casteFilterGroup = groupId;
    renderCastes();
}

function openCasteModal(index) {
    const isEdit = index !== undefined && index >= 0;
    const titleEl = document.getElementById('casteFormTitle');
    const nameEl = document.getElementById('casteNameInput');
    const gujEl = document.getElementById('casteGujInput');
    const groupEl = document.getElementById('casteGroupInput');
    const kwEl = document.getElementById('casteKeywordsInput');
    const idxEl = document.getElementById('casteEditIndex');

    if (isEdit && CASTES_DATA[index]) {
        const c = CASTES_DATA[index];
        if (titleEl) titleEl.textContent = 'Edit Community / Caste';
        if (nameEl) nameEl.value = c.name || '';
        if (gujEl) gujEl.value = c.guj || '';
        if (groupEl) groupEl.value = c.group || '';
        if (kwEl) kwEl.value = c.keywords || '';
        if (idxEl) idxEl.value = String(index);
    } else {
        if (titleEl) titleEl.textContent = 'Add New Community / Caste';
        if (nameEl) nameEl.value = '';
        if (gujEl) gujEl.value = '';
        if (groupEl) groupEl.value = '';
        if (kwEl) kwEl.value = '';
        if (idxEl) idxEl.value = '-1';
    }
    openModal('modalCasteForm');
    setTimeout(() => { if (nameEl) nameEl.focus(); }, 150);
}

function saveCasteForm() {
    const nameEl = document.getElementById('casteNameInput');
    const gujEl = document.getElementById('casteGujInput');
    const groupEl = document.getElementById('casteGroupInput');
    const kwEl = document.getElementById('casteKeywordsInput');
    const idxEl = document.getElementById('casteEditIndex');

    const name = (nameEl ? nameEl.value : '').trim();
    const guj = (gujEl ? gujEl.value : '').trim();
    const group = (groupEl ? groupEl.value : '').trim() || 'Other Communities';
    const keywords = (kwEl ? kwEl.value : '').trim();
    const editIdx = idxEl ? parseInt(idxEl.value) : -1;

    if (!name) {
        showToast('Please enter caste name in English');
        if (nameEl) nameEl.focus();
        return;
    }
    if (!guj) {
        showToast('Please enter caste name in Gujarati');
        if (gujEl) gujEl.focus();
        return;
    }

    const autoKeywords = [
        name.toLowerCase(),
        guj,
        group.toLowerCase(),
        keywords
    ].filter(Boolean).join(' ');

    if (editIdx >= 0 && editIdx < CASTES_DATA.length) {
        CASTES_DATA[editIdx] = {
            ...CASTES_DATA[editIdx],
            name,
            guj,
            group,
            keywords: keywords || autoKeywords
        };
        saveCastesData();
        showToast(`Caste "${name}" updated successfully`);
    } else {
        const newCaste = {
            name,
            guj,
            group,
            keywords: keywords || autoKeywords,
            custom: true,
            dateAdded: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        CASTES_DATA.unshift(newCaste);
        saveCastesData();
        showToast(`New caste "${name} (${guj})" added to live directory`);
    }

    closeModal('modalCasteForm');
    renderCastes();
}


/* ============================================================ SETTINGS & PLATFORM CONTROLS ============================================================ */
function syncSettingsUI() {
    const dispEmail = document.getElementById('adminDisplayEmail');
    if (dispEmail && ADMIN_CREDS && ADMIN_CREDS.email) {
        dispEmail.textContent = ADMIN_CREDS.email;
    }
    const inputEmail = document.getElementById('settingsAdminEmail');
    if (inputEmail && ADMIN_CREDS && ADMIN_CREDS.email) {
        inputEmail.value = ADMIN_CREDS.email;
    }

    // Auto-approve toggle sync
    const autoToggle = document.getElementById('toggleAutoApprove');
    if (autoToggle) {
        const isAuto = localStorage.getItem(LS_COMMUNITY_AUTO_APPROVE) !== 'false'; // default ON
        autoToggle.classList.toggle('on', isAuto);
    }

    // Maintenance mode toggle sync
    const maintToggle = document.getElementById('toggleMaintenance');
    if (maintToggle) {
        const isMaint = localStorage.getItem(LS_COMMUNITY_MAINTENANCE) === 'true'; // default OFF
        maintToggle.classList.toggle('on', isMaint);
        if (typeof supabaseGetMaintenanceMode === 'function') {
            supabaseGetMaintenanceMode().then(liveMaint => {
                maintToggle.classList.toggle('on', !!liveMaint);
                localStorage.setItem(LS_COMMUNITY_MAINTENANCE, liveMaint ? 'true' : 'false');
            }).catch(() => {});
        }
    }
}

function updateAdminEmail() {
    const input = document.getElementById('settingsAdminEmail');
    if (!input) return;
    const newEmail = input.value.trim();
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
        showToast('Please enter a valid email address');
        if (input) input.focus();
        return;
    }
    ADMIN_CREDS.email = newEmail;
    localStorage.setItem(LS_ADMIN_CREDS_KEY, JSON.stringify(ADMIN_CREDS));
    syncSettingsUI();
    showToast('Admin email updated successfully!');
}


function toggleAutoApprove(btn) {
    const isCurrentlyOn = btn.classList.contains('on');
    const newState = !isCurrentlyOn;
    btn.classList.toggle('on', newState);
    localStorage.setItem(LS_COMMUNITY_AUTO_APPROVE, newState ? 'true' : 'false');
    if (newState) {
        showToast('Auto-approve ON: New registrations activate instantly');
    } else {
        showToast('Auto-approve OFF: New registrations require admin review');
    }
}

async function toggleMaintenanceMode(btn) {
    const isCurrentlyOn = btn.classList.contains('on');
    const newState = !isCurrentlyOn;
    btn.classList.toggle('on', newState);
    localStorage.setItem(LS_COMMUNITY_MAINTENANCE, newState ? 'true' : 'false');
    if (newState) {
        showToast('Maintenance mode ACTIVATED: Member app is now locked');
    } else {
        showToast('Maintenance mode DEACTIVATED: Member app restored');
    }

    if (typeof supabaseSetMaintenanceMode === 'function') {
        try {
            await supabaseSetMaintenanceMode(newState);
        } catch(e) {
            console.warn('[Admin] Maintenance mode cloud sync error:', e);
        }
    }
}

// Global Window Exports
if (typeof renderUsers !== 'undefined') window.renderUsers = renderUsers;
if (typeof renderInterests !== 'undefined') window.renderInterests = renderInterests;
if (typeof renderPayments !== 'undefined') window.renderPayments = renderPayments;
if (typeof renderProfileMgmt !== 'undefined') window.renderProfileMgmt = renderProfileMgmt;
if (typeof renderCastes !== 'undefined') window.renderCastes = renderCastes;
if (typeof renderReports !== 'undefined') window.renderReports = renderReports;
if (typeof renderNotifs !== 'undefined') window.renderNotifs = renderNotifs;
if (typeof renderHelp !== 'undefined') window.renderHelp = renderHelp;
if (typeof syncSettingsUI !== 'undefined') window.syncSettingsUI = syncSettingsUI;
if (typeof setUserTab !== 'undefined') window.setUserTab = setUserTab;
