/* ============================================================ BROWSE & COMMUNITY FEED ============================================================ */
/* ============================================================ STEP 1: CASTE SELECTION ============================================================ */
function filterRegCaste(query) {
    const input = document.getElementById('regCasteInput');
    if (input) clearFieldError(input);
    const dd = document.getElementById('regCasteDropdown');
    if (!dd) return;
    const q = (query || '').trim().toLowerCase();

    const activeList = getActiveCastes();
    // If query is empty, show the first 35 major communities so user can browse immediately
    const matches = q === ''
        ? activeList.slice(0, 35)
        : activeList.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.guj && c.guj.toLowerCase().includes(q)) ||
            c.group.toLowerCase().includes(q) ||
            (c.keywords && c.keywords.toLowerCase().includes(q))
        );

    if (matches.length === 0) {
        dd.innerHTML = `
            <div class="caste-empty-helpline">
                <i class="fa-solid fa-headset" style="font-size:26px;color:var(--primary);margin-bottom:8px;"></i>
                <div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:4px;">No matching community found in Gujarat directory</div>
                <div style="font-size:12px;color:var(--muted);line-height:1.45;margin-bottom:12px;">
                    Can't find your community in the list? Contact our community helpline to get it added:
                </div>
                <a href="tel:+919726362863" class="caste-helpline-link">
                    <i class="fa-solid fa-phone"></i> +91 97263 62863 (Community Helpline)
                </a>
            </div>`;
    } else {
        const headerText = q === ''
            ? `<div class="caste-dropdown-header"><span>All Hindu Communities (Gujarat)</span><span>${activeList.length} Total</span></div>`
            : `<div class="caste-dropdown-header"><span>Matching Communities</span><span>${matches.length} Found</span></div>`;

        dd.innerHTML = headerText + matches.map(c => {
            const safeName = c.name.replace(/'/g, "\\'");
            const safeGuj = (c.guj || '').replace(/'/g, "\\'");
            return `
                <div class="caste-option" onclick="selectRegCaste('${safeName}', '${safeGuj}')">
                    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
                        <span class="caste-opt-badge"><i class="fa-solid fa-layer-group" style="font-size:9.5px;"></i> ${c.group}</span>
                        <div style="font-weight:700;font-size:13.5px;color:var(--text);">
                            ${c.name} <span style="font-size:12.5px;color:var(--muted);font-weight:500;">(${c.guj})</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:13.5px;opacity:0.35;"></i>
                </div>`;
        }).join('');
    }
    dd.classList.add('open');
}

function selectRegCaste(casteName, gujName) {
    state.regData.caste = casteName;
    const input = document.getElementById('regCasteInput');
    const chip = document.getElementById('regCasteChip');
    const chipTxt = document.getElementById('regCasteChipText');
    const searchWrap = document.getElementById('regCasteSearchWrap');
    const dd = document.getElementById('regCasteDropdown');

    if (input) {
        input.value = casteName;
        clearFieldError(input);
    }
    if (chip && chipTxt) {
        const displayGuj = gujName ? ` <span style="font-size:12.5px;opacity:0.85;font-weight:500;">(${gujName})</span>` : '';
        chipTxt.innerHTML = `<i class="fa-solid fa-users" style="margin-right:8px;color:var(--primary);"></i><b>${casteName}</b>${displayGuj}`;
        chip.style.display = 'flex';
        chip.classList.add('active');
    }
    if (searchWrap) searchWrap.style.display = 'block';
    if (dd) dd.classList.remove('open');
    showToast(`Selected Community: ${casteName}`);
}

function removeRegCaste() {
    state.regData.caste = '';
    const chip = document.getElementById('regCasteChip');
    const searchWrap = document.getElementById('regCasteSearchWrap');
    const input = document.getElementById('regCasteInput');
    if (chip) {
        chip.classList.remove('active');
        chip.style.display = 'none';
    }
    if (searchWrap) searchWrap.style.display = 'block';
    if (input) {
        input.value = '';
        clearFieldError(input);
        input.focus();
        filterRegCaste('');
    }
    showToast('Community cleared. Search and select another.');
}

function goToRegStep2() {
    if (!state.regData.caste) {
        const input = document.getElementById('regCasteInput');
        highlightFieldError(input, 'Please search and select your caste/community to continue');
        return;
    }
    go('scr-reg2');
}


/* ============================================================ HOBBIES ============================================================ */
var hobbyUid = 0;
function initHobbies() {
    const wrap = document.getElementById('hobbyList');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!state.hobbies || state.hobbies.length === 0) {
        hobbyUid++;
        const row = document.createElement('div');
        row.className = 'hobby-card';
        row.id = 'hobby-' + hobbyUid;
        row.innerHTML = `<input class="input" placeholder="Enter hobby (e.g. Cricket)" value="" oninput="this.classList.remove('input-error');this.style.borderColor='';">
      <button class="hobby-remove" onclick="document.getElementById('hobby-${hobbyUid}').remove()"><i class="fa-solid fa-xmark"></i></button>`;
        wrap.appendChild(row);
        return;
    }
    state.hobbies.forEach(h => {
        hobbyUid++;
        const row = document.createElement('div');
        row.className = 'hobby-card';
        row.id = 'hobby-' + hobbyUid;
        row.innerHTML = `<input class="input" value="${h}" placeholder="Enter hobby" oninput="this.classList.remove('input-error');this.style.borderColor='';">
      <button class="hobby-remove" onclick="document.getElementById('hobby-${hobbyUid}').remove()"><i class="fa-solid fa-xmark"></i></button>`;
        wrap.appendChild(row);
    });
}
function addHobby() {
    hobbyUid++;
    const wrap = document.getElementById('hobbyList');
    const row = document.createElement('div');
    row.className = 'hobby-card';
    row.id = 'hobby-' + hobbyUid;
    row.innerHTML = `<input class="input" placeholder="Enter hobby (e.g. Cricket)" oninput="this.classList.remove('input-error');this.style.borderColor='';">
    <button class="hobby-remove" onclick="document.getElementById('hobby-${hobbyUid}').remove()"><i class="fa-solid fa-xmark"></i></button>`;
    wrap.appendChild(row);
    row.querySelector('input').focus();
}
function addEditHobby() {
    const wrap = document.getElementById('editHobbyList');
    const row = document.createElement('div');
    row.className = 'hobby-card';
    row.innerHTML = `<input class="input" placeholder="Enter hobby" oninput="this.classList.remove('input-error');this.style.borderColor='';">
    <button class="hobby-remove" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
    wrap.appendChild(row);
    row.querySelector('input').focus();
}

/* ============================================================ HOBBIES FORMATTING & DISPLAY ============================================================ */
function renderHobbiesHtml(hobbies) {
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
        return list.map(h => `<span class="chip"><i class="fa-solid fa-tag" style="font-size:10px;opacity:0.6;margin-right:4px;"></i>${h}</span>`).join('');
    }

    return '';
}

function getCurrentUserProfile() {
    if (!state.currentUser) return null;
    const curId = state.currentUser.id;
    const curEmail = (state.currentUser.email || '').toLowerCase().trim();
    const curName = (state.currentUser.name || '').toLowerCase().trim();

    let myProfile = (window.PROFILES || []).find(p => {
        if (!p) return false;
        if (curId && (p.id === curId || String(p.id) === String(curId) || p.userId === curId || String(p.userId) === String(curId))) return true;
        if (curEmail && p.email && p.email.toLowerCase().trim() === curEmail) return true;
        if (curName && p.name && p.name.toLowerCase().trim() === curName) return true;
        return false;
    });

    if (!myProfile) {
        const isGirl = (state.currentUser.gender || state.regData?.gender) === 'Girl' || (state.currentUser.gender || state.regData?.gender) === 'girls';
        myProfile = {
            id: curId || Date.now(),
            name: state.currentUser.name || state.regData?.name || '',
            gender: isGirl ? 'girls' : 'boys',
            community: state.currentUser.caste || state.regData?.caste || 'Luhar Suthar',
            dob: state.currentUser.dob || state.regData?.dob || '',
            age: state.currentUser.age || state.regData?.age || 24,
            height: state.currentUser.height || state.regData?.height || "5'6\"",
            weight: state.currentUser.weight || state.regData?.weight || '60 kg',
            marital: state.currentUser.marital || state.regData?.marital || 'Unmarried',
            physical: state.currentUser.physical || state.regData?.physical || 'Normal',
            occ: state.currentUser.occupation || state.currentUser.occ || state.regData?.occupation || 'Professional',
            income: state.currentUser.income || state.regData?.income || '₹40K – ₹75K',
            education: state.currentUser.education || state.regData?.education || 'Graduate',
            father: state.currentUser.father || state.regData?.fatherName || '',
            fatherOcc: state.currentUser.fatherOcc || state.regData?.fatherOcc || 'Business',
            fatherMobile: state.currentUser.fatherMobile || state.regData?.fatherMobile || '',
            mother: state.currentUser.mother || state.regData?.motherName || '',
            motherOcc: state.currentUser.motherOcc || state.regData?.motherOcc || 'Homemaker',
            sister: state.currentUser.sister || state.regData?.sister || 'None',
            brother: state.currentUser.brother || state.regData?.brother || 'None',
            village: state.currentUser.village || state.currentUser.city || state.regData?.city || '',
            city: state.currentUser.city || state.currentUser.village || state.regData?.city || '',
            taluka: state.currentUser.taluka || state.regData?.taluka || '',
            district: state.currentUser.district || state.regData?.district || '',
            address: state.currentUser.address || state.regData?.address || '',
            fullAddress: state.currentUser.fullAddress || state.currentUser.full_address || state.currentUser.address || state.regData?.address || '',
            hobbies: state.currentUser.hobbies || state.regData?.hobbies || [],
            ownMobile: state.currentUser.mobile || state.regData?.ownMobile || '',
            img: state.currentUser.img || state.regData?.photo || '',
            photos: (state.currentUser.photos && state.currentUser.photos.length) ? state.currentUser.photos : (state.regData?.photos || [])
        };
        window.PROFILES = window.PROFILES || [];
        window.PROFILES.unshift(myProfile);
    }
    return myProfile;
}

function populateEditProfile() {
    if (!state.currentUser || !state.currentUser.email) {
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    const myProfile = getCurrentUserProfile();
    if (!myProfile) return;

    // Photos (3 Slots)
    const photos = (myProfile.photos && myProfile.photos.length > 0) ? myProfile.photos : (myProfile.img ? [myProfile.img] : []);
    for (let slot = 1; slot <= 3; slot++) {
        const imgEl = document.getElementById(`editSlotImg${slot}`);
        const emptyEl = document.getElementById(`editSlotEmpty${slot}`);
        const pUrl = photos[slot - 1];
        if (pUrl && imgEl) {
            imgEl.src = pUrl;
            imgEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
        } else {
            if (imgEl) {
                imgEl.src = '';
                imgEl.style.display = 'none';
            }
            if (emptyEl) emptyEl.style.display = (slot === 1 ? 'none' : 'flex');
        }
    }

    // Personal details
    const fullNameEl = document.getElementById('editFullName');
    if (fullNameEl) fullNameEl.value = myProfile.name || state.currentUser?.name || '';

    const dobEl = document.getElementById('editDobInput');
    if (dobEl) dobEl.value = myProfile.dob || state.currentUser?.dob || '';

    const heightEl = document.getElementById('editHeight');
    if (heightEl) {
        const hVal = parseInt(myProfile.height) || parseInt(state.currentUser?.height) || 170;
        heightEl.value = String(hVal);
    }

    const weightEl = document.getElementById('editWeight');
    if (weightEl) {
        const wVal = parseInt(myProfile.weight) || parseInt(state.currentUser?.weight) || 65;
        weightEl.value = String(wVal);
    }

    const maritalSpan = document.querySelector('#ddMaritalEdit .dd-trigger span');
    if (maritalSpan) maritalSpan.textContent = myProfile.marital || state.currentUser?.marital || 'Unmarried';

    const physicalSpan = document.querySelector('#ddPhysicalEdit .dd-trigger span');
    if (physicalSpan) physicalSpan.textContent = myProfile.physical || state.currentUser?.physical || 'Normal';

    const occEl = document.getElementById('editOccupation');
    if (occEl) occEl.value = myProfile.occ || state.currentUser?.occupation || state.currentUser?.occ || '';

    const incomeSpan = document.querySelector('#ddIncomeEdit .dd-trigger span');
    if (incomeSpan) incomeSpan.textContent = myProfile.income || state.currentUser?.income || '₹40K – ₹75K';

    const eduEl = document.getElementById('editEducation');
    if (eduEl) eduEl.value = myProfile.education || state.currentUser?.education || '';

    // Family details
    const fNameEl = document.getElementById('editFatherName');
    if (fNameEl) fNameEl.value = myProfile.father || state.currentUser?.father || '';

    const fOccEl = document.getElementById('editFatherOcc');
    if (fOccEl) fOccEl.value = myProfile.fatherOcc || state.currentUser?.fatherOcc || '';

    const fMobileEl = document.getElementById('editFatherMobile');
    if (fMobileEl) fMobileEl.value = myProfile.fatherMobile || state.currentUser?.fatherMobile || '';

    const mNameEl = document.getElementById('editMotherName');
    if (mNameEl) mNameEl.value = myProfile.mother || state.currentUser?.mother || '';

    const mOccEl = document.getElementById('editMotherOcc');
    if (mOccEl) mOccEl.value = myProfile.motherOcc || state.currentUser?.motherOcc || '';

    const sisterEl = document.getElementById('editSister');
    if (sisterEl) sisterEl.value = (myProfile.sister && myProfile.sister !== '—') ? myProfile.sister : (state.currentUser?.sister || '');

    const brotherEl = document.getElementById('editBrother');
    if (brotherEl) brotherEl.value = (myProfile.brother && myProfile.brother !== '—') ? myProfile.brother : (state.currentUser?.brother || '');

    // Address (Properly restored from registration and profile)
    const cityEl = document.getElementById('editCity');
    if (cityEl) cityEl.value = myProfile.village || myProfile.city || state.currentUser?.village || state.currentUser?.city || state.regData?.city || '';

    const talukaEl = document.getElementById('editTaluka');
    if (talukaEl) talukaEl.value = myProfile.taluka || state.currentUser?.taluka || state.regData?.taluka || '';

    const distEl = document.getElementById('editDistrict');
    if (distEl) distEl.value = myProfile.district || state.currentUser?.district || state.regData?.district || '';

    const addrEl = document.getElementById('editAddress');
    if (addrEl) addrEl.value = myProfile.fullAddress || myProfile.full_address || myProfile.address || state.currentUser?.fullAddress || state.currentUser?.full_address || state.currentUser?.address || state.regData?.address || '';

    // Hobbies
    const hobbyWrap = document.getElementById('editHobbyList');
    if (hobbyWrap) {
        hobbyWrap.innerHTML = '';
        const hList = Array.isArray(myProfile.hobbies) && myProfile.hobbies.length > 0
            ? myProfile.hobbies
            : (Array.isArray(state.currentUser?.hobbies) && state.currentUser.hobbies.length > 0 ? state.currentUser.hobbies : []);
        if (hList.length > 0) {
            hList.forEach(h => {
                const row = document.createElement('div');
                row.className = 'hobby-card';
                row.innerHTML = `<input class="input" value="${escapeHtml(h)}" placeholder="Enter hobby" oninput="this.classList.remove('input-error');this.style.borderColor='';">
                <button class="hobby-remove" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
                hobbyWrap.appendChild(row);
            });
        }
    }

    // Contact number (private admin only)
    const ownMobileEl = document.getElementById('editOwnMobile');
    if (ownMobileEl) ownMobileEl.value = myProfile.ownMobile || state.currentUser?.mobile || state.regData?.ownMobile || '';

    // Visibility toggle
    const visibleToggle = document.getElementById('editVisibleToggle');
    if (visibleToggle) {
        if (myProfile.visible !== false) {
            visibleToggle.classList.add('on');
        } else {
            visibleToggle.classList.remove('on');
        }
    }
}

function saveEditProfile() {
    const myProfile = getCurrentUserProfile();

    const fullNameEl = document.getElementById('editFullName');
    const fNameEl = document.getElementById('editFatherName');
    const fMobileEl = document.getElementById('editFatherMobile');
    const ownMobileEl = document.getElementById('editOwnMobile');
    const cityEl = document.getElementById('editCity');

    const fullName = fullNameEl ? fullNameEl.value.trim() : '';
    if (!fullName) {
        highlightFieldError(fullNameEl, 'Full name is required');
        showToast('Please enter your full name');
        return;
    }

    const rawFatherMobile = fMobileEl ? fMobileEl.value.trim() : '';
    const cleanFatherMobile = extract10DigitMobile(rawFatherMobile);
    if (!cleanFatherMobile) {
        highlightFieldError(fMobileEl, "Please enter a valid 10-digit father's mobile number");
        showToast("Please enter a valid 10-digit father's mobile number");
        return;
    }

    const rawOwnMobile = ownMobileEl ? ownMobileEl.value.trim() : '';
    const cleanOwnMobile = extract10DigitMobile(rawOwnMobile);
    if (!cleanOwnMobile) {
        highlightFieldError(ownMobileEl, "Please enter your valid 10-digit personal mobile number");
        showToast("Please enter your valid 10-digit personal mobile number");
        return;
    }

    const city = cityEl ? cityEl.value.trim() : '';
    if (!city) {
        highlightFieldError(cityEl, 'City / Village is required');
        showToast('Please enter your City / Village');
        return;
    }

    // Read photo slots
    const photos = [];
    for (let slot = 1; slot <= 3; slot++) {
        const imgEl = document.getElementById(`editSlotImg${slot}`);
        if (imgEl && imgEl.style.display !== 'none' && imgEl.src && !imgEl.src.endsWith('/')) {
            photos.push(imgEl.src);
        }
    }

    // Read hobbies
    const editHobbyInputs = document.querySelectorAll('#editHobbyList input');
    const updatedHobbies = Array.from(editHobbyInputs)
        .map(i => i.value.trim())
        .filter(h => h.length > 0 && h.toLowerCase() !== 'none' && h !== '—');

    // Read Date of Birth & calculate age
    const dobVal = document.getElementById('editDobInput')?.value.trim() || '';
    let calculatedAge = myProfile ? myProfile.age : 27;
    if (dobVal) {
        const parts = dobVal.split('/').map(s => parseInt(s.trim(), 10));
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            calculatedAge = calculateAge(parts[2], parts[1] - 1, parts[0]);
        }
    }

    const rawEditHeight = String(document.getElementById('editHeight')?.value || '').trim();
    const rawEditWeight = String(document.getElementById('editWeight')?.value || '').trim();
    const numEditHeight = parseFloat(rawEditHeight);
    const numEditWeight = parseFloat(rawEditWeight);
    const heightEl = document.getElementById('editHeight');
    const weightEl = document.getElementById('editWeight');
    if (rawEditHeight && (isNaN(numEditHeight) || numEditHeight < 90 || numEditHeight > 250)) {
        highlightFieldError(heightEl, 'Please enter a valid height between 90 cm and 250 cm');
        showToast('Please enter a valid height between 90 cm and 250 cm');
        return;
    }
    if (rawEditWeight && (isNaN(numEditWeight) || numEditWeight < 30 || numEditWeight > 200)) {
        highlightFieldError(weightEl, 'Please enter a valid weight between 30 kg and 200 kg');
        showToast('Please enter a valid weight between 30 kg and 200 kg');
        return;
    }
    const heightVal = rawEditHeight ? String(Math.round(numEditHeight)) : '';
    const weightVal = rawEditWeight ? String(Math.round(numEditWeight)) : '';
    const maritalVal = document.querySelector('#ddMaritalEdit .dd-trigger span')?.textContent.trim() || 'Unmarried';
    const physicalVal = document.querySelector('#ddPhysicalEdit .dd-trigger span')?.textContent.trim() || 'Normal';
    const occVal = document.getElementById('editOccupation')?.value.trim() || '';
    const incomeVal = document.querySelector('#ddIncomeEdit .dd-trigger span')?.textContent.trim() || '₹40K – ₹75K';
    const eduVal = document.getElementById('editEducation')?.value.trim() || '';

    const fatherNameVal = fNameEl ? fNameEl.value.trim() : '';
    const fatherOccVal = document.getElementById('editFatherOcc')?.value.trim() || '';
    const motherNameVal = document.getElementById('editMotherName')?.value.trim() || '';
    const motherOccVal = document.getElementById('editMotherOcc')?.value.trim() || '';
    const sisterVal = document.getElementById('editSister')?.value.trim() || '—';
    const brotherVal = document.getElementById('editBrother')?.value.trim() || '—';

    const talukaVal = document.getElementById('editTaluka')?.value.trim() || '';
    const distVal = document.getElementById('editDistrict')?.value.trim() || '';
    const addrVal = document.getElementById('editAddress')?.value.trim() || '';

    const visibleToggle = document.getElementById('editVisibleToggle');
    const isVisible = visibleToggle ? visibleToggle.classList.contains('on') : true;

    if (myProfile) {
        myProfile.visible = isVisible;
        myProfile.name = fullName;
        myProfile.dob = dobVal;
        myProfile.age = calculatedAge;
        if (heightVal) myProfile.height = `${heightVal} cm`;
        if (weightVal) myProfile.weight = `${weightVal} kg`;
        myProfile.marital = maritalVal;
        myProfile.physical = physicalVal;
        myProfile.occ = occVal;
        myProfile.income = incomeVal;
        myProfile.education = eduVal;

        myProfile.father = fatherNameVal;
        myProfile.fatherOcc = fatherOccVal;
        myProfile.fatherMobile = formatPhoneNumber(cleanFatherMobile);
        myProfile.mother = motherNameVal;
        myProfile.motherOcc = motherOccVal;
        myProfile.sister = sisterVal;
        myProfile.brother = brotherVal;

        myProfile.village = city;
        myProfile.city = city;
        myProfile.taluka = talukaVal;
        myProfile.district = distVal;
        myProfile.address = addrVal;
        myProfile.fullAddress = addrVal;
        myProfile.full_address = addrVal;

        myProfile.hobbies = updatedHobbies;
        myProfile.ownMobile = formatPhoneNumber(cleanOwnMobile);

        if (photos.length > 0) {
            myProfile.photos = photos;
            myProfile.img = photos[0];
        }
    }

    if (state.currentUser) {
        state.currentUser.name = fullName;
        state.currentUser.mobile = formatPhoneNumber(cleanOwnMobile);
        state.currentUser.dob = dobVal;
        state.currentUser.age = calculatedAge;
        state.currentUser.village = city;
        state.currentUser.city = city;
        state.currentUser.taluka = talukaVal;
        state.currentUser.district = distVal;
        state.currentUser.address = addrVal;
        state.currentUser.fullAddress = addrVal;
        state.currentUser.full_address = addrVal;
        state.currentUser.hobbies = updatedHobbies;
    }

    if (state.regData) {
        state.regData.name = fullName;
        state.regData.city = city;
        state.regData.taluka = talukaVal;
        state.regData.district = distVal;
        state.regData.address = addrVal;
        state.regData.hobbies = updatedHobbies;
    }

    // Persist to stored accounts
    try {
        if (typeof getStoredAccounts === 'function' && typeof saveStoredAccounts === 'function') {
            const accounts = getStoredAccounts();
            const uIdx = accounts.findIndex(u => (u.email && state.currentUser?.email && u.email.toLowerCase() === state.currentUser.email.toLowerCase()) || (state.currentUser && u.id === state.currentUser.id));
            if (uIdx !== -1) {
                accounts[uIdx].name = fullName;
                accounts[uIdx].mobile = formatPhoneNumber(cleanOwnMobile);
                accounts[uIdx].city = city;
                accounts[uIdx].village = city;
                accounts[uIdx].taluka = talukaVal;
                accounts[uIdx].district = distVal;
                accounts[uIdx].address = addrVal;
                accounts[uIdx].fullAddress = addrVal;
                accounts[uIdx].full_address = addrVal;
                saveStoredAccounts(accounts);
            }
        }
    } catch(e) { console.warn(e); }

    // Sync to Supabase PostgreSQL live
    if (typeof supabaseUpsertProfile === 'function' && myProfile) {
        supabaseUpsertProfile(myProfile).catch(err => console.warn('[Supabase] Edit sync notice:', err));
    }
    if (typeof supabaseUpsertUser === 'function' && state.currentUser) {
        supabaseUpsertUser({
            id: String(state.currentUser.id || state.currentUser.userId || myProfile?.id),
            email: state.currentUser.email || myProfile?.email,
            name: fullName,
            gender: state.currentUser.gender,
            caste: myProfile?.community || state.currentUser.caste,
            mobile: formatPhoneNumber(cleanOwnMobile),
            status: state.currentUser.status || 'Active',
            profileComplete: true,
            paymentStatus: state.currentUser.paymentStatus || 'Unpaid'
        }).catch(err => console.warn('[Supabase] User edit sync notice:', err));
    }

    saveCommunityProfiles();
    saveSessionState();
    updateHeaderUserDisplay();
    showToast('Profile updated successfully! ✨');
    go('scr-home');
}


/* ============================================================ HOME & BROWSE FEED ============================================================ */

/**
 * Synchronize all UI elements (Browse screen tabs, Home hero tiles, menu, filters)
 * based strictly on the current user's gender for matrimonial privacy.
 */
function syncGenderUI() {
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');

    // 1. Browse screen toggle & titles
    const browseTitle = document.getElementById('browseScreenTitle');
    const browseToggle = document.getElementById('browseSegToggle');
    const btnGirls = document.getElementById('segGirls');
    const btnBoys = document.getElementById('segBoys');

    if (isBoy) {
        state.tab = 'girls';
        state.filters.gender = 'girls';
        if (browseTitle) browseTitle.textContent = 'Browse Brides';
        if (browseToggle) browseToggle.style.display = 'none'; // Uncluttered: only opposite gender
        if (btnGirls && btnBoys) {
            btnGirls.classList.add('active');
            btnBoys.classList.remove('active');
        }
    } else if (isGirl) {
        state.tab = 'boys';
        state.filters.gender = 'boys';
        if (browseTitle) browseTitle.textContent = 'Browse Grooms';
        if (browseToggle) browseToggle.style.display = 'none'; // Uncluttered: only opposite gender
        if (btnGirls && btnBoys) {
            btnBoys.classList.add('active');
            btnGirls.classList.remove('active');
        }
    } else {
        if (browseTitle) browseTitle.textContent = 'Browse profiles';
        if (browseToggle) browseToggle.style.display = 'flex';
    }

    // 2. Home screen hero tiles
    const heroTileGirls = document.getElementById('heroTileGirls');
    const heroTileBoys = document.getElementById('heroTileBoys');
    const heroTitleGirls = document.getElementById('heroTitleGirls');
    const heroTitleBoys = document.getElementById('heroTitleBoys');
    const homeGirlsCount = document.getElementById('homeGirlsCount');
    const homeBoysCount = document.getElementById('homeBoysCount');

    // Calculate live counts
    const allList = (typeof window !== 'undefined' && Array.isArray(window.PROFILES)) ? window.PROFILES : [];
    const activeList = allList.filter(p => p && p.accountStatus !== 'suspended' && p.visible !== false);
    const checkBoy = typeof isBoyGender === 'function' ? isBoyGender : g => (g === 'boys' || g === 'Boy' || g === 'boy');
    const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');

    const totalGirls = activeList.filter(p => checkGirl(p.gender)).length;
    const totalBoys = activeList.filter(p => checkBoy(p.gender)).length;

    const userCaste = getUserCaste();
    const myCasteGirls = activeList.filter(p => checkGirl(p.gender) && userCaste && p.community && p.community.toLowerCase() === userCaste.toLowerCase()).length;
    const myCasteBoys = activeList.filter(p => checkBoy(p.gender) && userCaste && p.community && p.community.toLowerCase() === userCaste.toLowerCase()).length;

    if (isBoy) {
        // Boy: Tile 1 is All Brides, Tile 2 is My Community Brides!
        if (heroTitleGirls) heroTitleGirls.textContent = 'All Brides';
        if (homeGirlsCount) homeGirlsCount.textContent = `${totalGirls} verified profile${totalGirls === 1 ? '' : 's'}`;

        if (heroTileBoys) {
            heroTileBoys.className = 'hero-tile girls';
            if (heroTitleBoys) heroTitleBoys.textContent = userCaste ? `${userCaste}` : 'My Community';
            if (homeBoysCount) homeBoysCount.textContent = `${myCasteGirls} community bride${myCasteGirls === 1 ? '' : 's'}`;
        }
    } else if (isGirl) {
        // Girl: Tile 1 is All Grooms, Tile 2 is My Community Grooms!
        if (heroTileGirls) {
            heroTileGirls.className = 'hero-tile boys';
            if (heroTitleGirls) heroTitleGirls.textContent = 'All Grooms';
            if (homeGirlsCount) homeGirlsCount.textContent = `${totalBoys} verified profile${totalBoys === 1 ? '' : 's'}`;
        }
        if (heroTileBoys) {
            if (heroTitleBoys) heroTitleBoys.textContent = userCaste ? `${userCaste}` : 'My Community';
            if (homeBoysCount) homeBoysCount.textContent = `${myCasteBoys} community groom${myCasteBoys === 1 ? '' : 's'}`;
        }
    } else {
        if (heroTileGirls) heroTileGirls.className = 'hero-tile girls';
        if (heroTileBoys) heroTileBoys.className = 'hero-tile boys';
        if (heroTitleGirls) heroTitleGirls.textContent = 'Girls';
        if (heroTitleBoys) heroTitleBoys.textContent = 'Boys';
        if (homeGirlsCount) homeGirlsCount.textContent = `${totalGirls} verified profile${totalGirls === 1 ? '' : 's'}`;
        if (homeBoysCount) homeBoysCount.textContent = `${totalBoys} verified profile${totalBoys === 1 ? '' : 's'}`;
    }

    // 3. Side menu items
    const menuGirls = document.getElementById('menuItemGirls');
    const menuBoys = document.getElementById('menuItemBoys');
    const menuTxtGirls = document.getElementById('menuTextGirls');
    const menuTxtBoys = document.getElementById('menuTextBoys');

    if (isBoy) {
        if (menuGirls) {
            menuGirls.style.display = 'flex';
            if (menuTxtGirls) menuTxtGirls.textContent = 'Browse Brides (Girls)';
        }
        if (menuBoys) menuBoys.style.display = 'none'; // Completely hidden for boys!
    } else if (isGirl) {
        if (menuBoys) {
            menuBoys.style.display = 'flex';
            if (menuTxtBoys) menuTxtBoys.textContent = 'Browse Grooms (Boys)';
        }
        if (menuGirls) menuGirls.style.display = 'none'; // Completely hidden for girls!
    } else {
        if (menuGirls) {
            menuGirls.style.display = 'flex';
            if (menuTxtGirls) menuTxtGirls.textContent = 'Girls';
        }
        if (menuBoys) {
            menuBoys.style.display = 'flex';
            if (menuTxtBoys) menuTxtBoys.textContent = 'Boys';
        }
    }

    // 4. Filter Modal Looking For section
    const fltToggle = document.getElementById('fltGenderToggle');
    const fltLocked = document.getElementById('fltGenderLockedBadge');
    const fltLockedText = document.getElementById('fltGenderLockedText');

    if (isBoy) {
        state.filters.gender = 'girls';
        if (fltToggle) fltToggle.style.display = 'none';
        if (fltLocked) {
            fltLocked.style.display = 'inline-flex';
            if (fltLockedText) fltLockedText.textContent = 'Showing Eligible Brides (Girls) Only';
        }
    } else if (isGirl) {
        state.filters.gender = 'boys';
        if (fltToggle) fltToggle.style.display = 'none';
        if (fltLocked) {
            fltLocked.style.display = 'inline-flex';
            if (fltLockedText) fltLockedText.textContent = 'Showing Eligible Grooms (Boys) Only';
        }
    } else {
        if (fltToggle) fltToggle.style.display = 'flex';
        if (fltLocked) fltLocked.style.display = 'none';
    }
}
window.syncGenderUI = syncGenderUI;

function handleHeroTileClick(type) {
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');

    if (isBoy) {
        setTab('girls');
        if (type === 'boys') {
            // Clicked 2nd tile (My Community Brides)
            if (state.filters) state.filters.caste = 'MY_COMMUNITY';
        } else {
            if (state.filters) state.filters.caste = 'All';
        }
        go('scr-browse');
    } else if (isGirl) {
        setTab('boys');
        if (type === 'boys') {
            // Clicked 2nd tile (My Community Grooms)
            if (state.filters) state.filters.caste = 'MY_COMMUNITY';
        } else {
            if (state.filters) state.filters.caste = 'All';
        }
        go('scr-browse');
    } else {
        setTab(type);
        go('scr-browse');
    }
}
window.handleHeroTileClick = handleHeroTileClick;

function setTab(t) {
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');

    // Strict gender constraint
    if (isBoy) t = 'girls';
    else if (isGirl) t = 'boys';

    state.tab = t;
    const gS = document.getElementById('segGirls'), bS = document.getElementById('segBoys');
    if (gS && bS) {
        gS.classList.toggle('active', t === 'girls');
        bS.classList.toggle('active', t === 'boys');
    }
    renderBrowse();
}

function updateHomeStats() {
    syncGenderUI();
    const list = (typeof window !== 'undefined' && Array.isArray(window.PROFILES)) ? window.PROFILES : [];
    // Count active, non-suspended, visible profiles
    const activeProfiles = list.filter(p => p && p.accountStatus !== 'suspended' && p.visible !== false);
    
    let girlsCount = 0;
    let boysCount = 0;
    activeProfiles.forEach(p => {
        const isG = typeof isGirlGender === 'function' ? isGirlGender(p.gender) : (p.gender === 'girls' || p.gender === 'Girl' || p.gender === 'girl');
        if (isG) {
            girlsCount++;
        } else {
            boysCount++;
        }
    });
    const totalMembers = girlsCount + boysCount;

    const totalEl = document.getElementById('homeTotalMembers');
    if (totalEl) {
        totalEl.textContent = totalMembers;
    }

    const favEl = document.getElementById('favCountHome');
    if (favEl && state.favorites) {
        favEl.textContent = state.favorites.size;
    }

    const planEl = document.getElementById('homePlanStatus');
    if (planEl) {
        if (state.currentUser) {
            const isGirl = (typeof isGirlGender === 'function') ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl');
            if (isGirl) {
                planEl.textContent = 'Free';
            } else {
                const pass = (typeof checkBoyPassStatus === 'function') ? checkBoyPassStatus(state.currentUser) : { active: state.currentUser.paymentStatus === 'Active' };
                planEl.textContent = pass.active ? '₹49 Pass' : 'Unpaid';
            }
        } else {
            planEl.textContent = 'Free';
        }
    }
}
window.updateHomeStats = updateHomeStats;

function renderHome() {
    // 0. Refresh header greeting and avatar live
    if (typeof updateHeaderUserDisplay === 'function') {
        updateHeaderUserDisplay();
    }
    // Update dynamic counts (Boys, Girls, Total Members) live from window.PROFILES
    updateHomeStats();

    // 1. Strict Boy Paywall Protection: NEVER render girl profiles for an unpaid boy
    if (state.currentUser && (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy')) {
        const passCheck = typeof checkBoyPassStatus === 'function' 
            ? checkBoyPassStatus(state.currentUser) 
            : { active: state.currentUser.paymentStatus === 'Active' };
        if (!passCheck.active) {
            const wrap = document.getElementById('homeGirlsList') || document.getElementById('homeFeedWrap');
            if (wrap) wrap.innerHTML = '';
            go('scr-membership', true);
            return;
        }
    }

    const wrap = document.getElementById('homeGirlsList') || document.getElementById('homeFeedWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || 'Boy';
    const isGirl = (typeof isGirlGender === 'function') ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');
    const targetGender = isGirl ? 'boys' : 'girls';
    const userCaste = getUserCaste();

    const titleEl = document.getElementById('homeFeedSectionTitle') || document.getElementById('homeSectionTitle') || wrap.previousElementSibling?.querySelector?.('.h-display') || document.querySelector('#scr-home .h-display.h-md');
    if (titleEl) {
        titleEl.textContent = targetGender === 'girls' ? 'Brides near you' : 'Grooms near you';
    }
    const seeAllEl = document.getElementById('homeSeeAllLink') || document.getElementById('homeSeeAllBtn') || wrap.previousElementSibling?.querySelector?.('.link-txt');
    if (seeAllEl) {
        seeAllEl.setAttribute('onclick', `setTab('${targetGender}');go('scr-browse');`);
    }

    // Feed rule: Default view shows ALL verified opposite gender profiles (newest first) without filtering out by caste
    const checkBoy = typeof isBoyGender === 'function' ? isBoyGender : g => (g === 'boys' || g === 'Boy' || g === 'boy');
    const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');

    const feedProfiles = (window.PROFILES || []).filter(p => {
        if (!p || p.accountStatus === 'suspended' || p.visible === false) return false;
        if (typeof isSelfProfile === 'function' && isSelfProfile(p)) return false;
        if (state.currentUser) {
            const myId = Number(state.currentUser.id || 0);
            const myProfId = Number(state.currentUser.profileId || 0);
            const myEmail = (state.currentUser.email || '').trim().toLowerCase();
            if (p.id && (Number(p.id) === myId || Number(p.id) === myProfId)) return false;
            if (myEmail && p.email && p.email.trim().toLowerCase() === myEmail) return false;
        }

        // STRICT GENDER ISOLATION:
        // Logged-in Boy only sees Girls. Logged-in Girl only sees Boys.
        if (isGirl) {
            return checkBoy(p.gender);
        } else {
            return checkGirl(p.gender);
        }
    });
    feedProfiles.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    if (feedProfiles.length === 0) {
        wrap.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:36px 16px;background:var(--card-bg, #fff);border-radius:18px;border:1px dashed var(--border,#eee);margin:12px 0;">
                <div style="width:54px;height:54px;border-radius:50%;background:var(--primary-light, #f6f0ff);color:var(--primary,#7B2CBF);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px;">
                    <i class="fa-solid fa-users"></i>
                </div>
                <div style="font-weight:700;font-size:15px;color:var(--text,#222);margin-bottom:6px;">No Profiles Available Yet</div>
                <p style="font-size:12px;color:var(--text-muted,#777);margin:0 auto 14px;max-width:280px;line-height:1.5;">
                    New members from your community are currently registering. Verified profiles will appear here soon.
                </p>
                <button class="btn btn-sm btn-outline" onclick="openShareModal()" style="margin:0 auto;display:inline-flex;align-items:center;gap:6px;">
                    <i class="fa-brands fa-whatsapp" style="color:#25D366;font-size:14px;"></i> Invite Friends
                </button>
            </div>
        `;
    } else {
        feedProfiles.forEach(p => wrap.appendChild(profileCard(p)));
    }
    buildTabbar('tabbarHome', 'home');
    const favCountEl = document.getElementById('favCountHome');
    if (favCountEl) favCountEl.textContent = state.favorites.size;
    const banner = document.getElementById('profileIncompleteBanner');
    if (banner) {
        banner.style.display = (state.currentUser && !state.profileComplete) ? 'block' : 'none';
    }
}

/* ============ BROWSE FILTERS ============ */
function getUserCaste() {
    return (state.currentUser && state.currentUser.caste) ||
        (state.regData && state.regData.caste) ||
        '';
}

function getEffectiveFilterCaste() {
    if (!state.filters || !state.filters.caste || state.filters.caste === 'All') {
        return 'All';
    }
    if (state.filters.caste === 'MY_COMMUNITY') {
        return getUserCaste() || 'All';
    }
    return state.filters.caste; // specific custom caste name chosen by user
}

function openFilterModal() {
    // Close any open dropdowns first so modal opens cleanly
    document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));

    const searchInp = document.getElementById('fltCustomSearchInput');
    if (searchInp) searchInp.value = '';
    const cityInp = document.getElementById('fltCitySearchInput');
    if (cityInp) cityInp.value = '';

    renderFilterCasteOptions('');
    renderFilterCityOptions('');
    updateAgeSliderView();
    openModal('modalFilter');
}

/* ---------- 1. COMMUNITY / CASTE FILTER ---------- */
function renderFilterCasteOptions(searchQuery = '') {
    const userCaste = getUserCaste();
    const currentCaste = state.filters ? state.filters.caste : 'All';

    // 1. Update dropdown trigger label
    const textEl = document.getElementById('fltCasteText');
    if (textEl) {
        if (currentCaste === 'MY_COMMUNITY') {
            textEl.textContent = `My Community (${userCaste})`;
        } else if (currentCaste === 'All') {
            textEl.textContent = 'All Communities';
        } else {
            textEl.textContent = currentCaste;
        }
    }

    // 2. Preset "My Community" item
    const myCommItem = document.getElementById('fltItemMyCommunity');
    const myCommSub = document.getElementById('fltMyCommunitySub');
    if (myCommSub) {
        myCommSub.textContent = `${userCaste} (Only My Caste)`;
    }
    if (myCommItem) {
        const isMyCommActive = currentCaste === 'MY_COMMUNITY' || (currentCaste !== 'All' && currentCaste === userCaste);
        myCommItem.classList.toggle('active', isMyCommActive);
        const checkIcon = myCommItem.querySelector('.flt-check-icon');
        if (checkIcon) checkIcon.style.display = isMyCommActive ? 'block' : 'none';
    }

    // 3. Preset "All Communities" item
    const allCommItem = document.getElementById('fltItemAllCommunities');
    if (allCommItem) {
        const isAllActive = currentCaste === 'All';
        allCommItem.classList.toggle('active', isAllActive);
        const checkIcon = allCommItem.querySelector('.flt-check-icon');
        if (checkIcon) checkIcon.style.display = isAllActive ? 'block' : 'none';
    }

    // 4. Custom Caste Search List
    const listContainer = document.getElementById('fltCustomCasteList');
    if (!listContainer) return;

    const activeList = getActiveCastes();
    const q = (searchQuery || '').trim().toLowerCase();
    const matches = q === ''
        ? activeList
        : activeList.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.guj && c.guj.toLowerCase().includes(q)) ||
            c.group.toLowerCase().includes(q) ||
            (c.keywords && c.keywords.toLowerCase().includes(q))
        );

    if (matches.length === 0) {
        listContainer.innerHTML = `
            <div style="padding:14px 10px;text-align:center;background:#FAFAFC;border-radius:10px;margin-top:4px;">
                <i class="fa-solid fa-headset" style="font-size:20px;color:var(--primary);margin-bottom:6px;"></i>
                <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:2px;">No matching caste found</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Contact helpline if your caste is not listed:</div>
                <a href="tel:+919726362863" class="caste-helpline-link" style="padding:6px 12px;font-size:11px;">
                    <i class="fa-solid fa-phone"></i> +91 97263 62863
                </a>
            </div>`;
    } else {
        listContainer.innerHTML = matches.map(c => {
            const isSelected = currentCaste === c.name;
            const safeName = c.name.replace(/'/g, "\\'");
            return `
                <div class="flt-caste-sub-item ${isSelected ? 'active' : ''}" onclick="pickFilterCaste('${safeName}')">
                    <div style="display:flex;flex-direction:column;gap:2px;">
                        <div style="font-size:12px;font-weight:600;color:var(--text);">${c.name} ${c.guj ? `<span style="font-size:11px;color:var(--muted);font-weight:500;">(${c.guj})</span>` : ''}</div>
                        <div style="font-size:10px;color:var(--muted);"><i class="fa-solid fa-layer-group" style="font-size:8.5px;"></i> ${c.group}</div>
                    </div>
                    ${isSelected ? '<i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:13px;"></i>' : '<i class="fa-solid fa-chevron-right" style="color:var(--border);font-size:10px;"></i>'}
                </div>`;
        }).join('');
    }
}

function filterCustomCasteList(val) {
    renderFilterCasteOptions(val);
}

function pickFilterCaste(caste) {
    state.filters.caste = caste;
    renderFilterCasteOptions();
    const dd = document.getElementById('ddFilterCaste');
    if (dd) dd.classList.remove('open');
    if (caste === 'MY_COMMUNITY') {
        showToast(`Selected: My Community (${getUserCaste()})`);
    } else if (caste === 'All') {
        showToast('Selected: All Communities');
    } else {
        showToast(`Selected Community: ${caste}`);
    }
}

function quickShowAllCastes() {
    state.filters.caste = 'All';
    renderFilterCasteOptions();
    renderBrowse();
    showToast('Showing all Gujarat communities');
}

function quickShowMyCommunity() {
    state.filters.caste = 'MY_COMMUNITY';
    renderFilterCasteOptions();
    renderBrowse();
    showToast(`Showing your community: ${getUserCaste()}`);
}

/* ---------- 2. AGE RANGE FILTER (DUAL SLIDER + PRESETS) ---------- */
function handleAgeSliderInput(which) {
    const minSlider = document.getElementById('fltAgeMinSlider');
    const maxSlider = document.getElementById('fltAgeMaxSlider');
    if (!minSlider || !maxSlider) return;

    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);

    if (which === 'min') {
        if (minVal > maxVal - 1) {
            minVal = Math.max(18, maxVal - 1);
            minSlider.value = minVal;
        }
    } else if (which === 'max') {
        if (maxVal < minVal + 1) {
            maxVal = Math.min(50, minVal + 1);
            maxSlider.value = maxVal;
        }
    }

    state.filters.ageMin = minVal;
    state.filters.ageMax = maxVal;
    updateAgeSliderView();
    highlightMatchingAgePreset(minVal, maxVal);
}

function updateAgeSliderView() {
    const minSlider = document.getElementById('fltAgeMinSlider');
    const maxSlider = document.getElementById('fltAgeMaxSlider');
    const trackActive = document.getElementById('fltAgeTrackActive');
    const minDisplay = document.getElementById('fltAgeMinDisplay');
    const maxDisplay = document.getElementById('fltAgeMaxDisplay');
    const liveText = document.getElementById('fltAgeLiveText');

    const minVal = state.filters.ageMin !== undefined ? state.filters.ageMin : 18;
    const maxVal = state.filters.ageMax !== undefined ? state.filters.ageMax : 50;

    if (minSlider) minSlider.value = minVal;
    if (maxSlider) maxSlider.value = maxVal;

    if (minDisplay) minDisplay.textContent = `${minVal} Yrs`;
    if (maxDisplay) maxDisplay.textContent = `${maxVal} Yrs`;

    if (trackActive) {
        const leftPercent = Math.max(0, Math.min(100, ((minVal - 18) / (50 - 18)) * 100));
        const rightPercent = Math.max(0, Math.min(100, 100 - (((maxVal - 18) / (50 - 18)) * 100)));
        trackActive.style.left = `${leftPercent}%`;
        trackActive.style.right = `${rightPercent}%`;
    }

    if (liveText) {
        if (minVal <= 18 && maxVal >= 50) {
            liveText.textContent = '18 – 50 Years (All Ages)';
        } else {
            liveText.textContent = `${minVal} – ${maxVal} Years`;
        }
    }
}

function setFilterAgePreset(min, max) {
    if (min === 'all') {
        state.filters.ageMin = 18;
        state.filters.ageMax = 50;
    } else {
        state.filters.ageMin = parseInt(min, 10);
        state.filters.ageMax = parseInt(max, 10);
    }
    updateAgeSliderView();
    highlightMatchingAgePreset(state.filters.ageMin, state.filters.ageMax);
}

function highlightMatchingAgePreset(min, max) {
    document.querySelectorAll('.filter-age-chip').forEach(c => c.classList.remove('active'));
    if (min <= 18 && max >= 50) {
        document.getElementById('chipAgeAll')?.classList.add('active');
    } else if (min === 21 && max === 25) {
        document.getElementById('chipAge2125')?.classList.add('active');
    } else if (min === 24 && max === 28) {
        document.getElementById('chipAge2428')?.classList.add('active');
    } else if (min === 26 && max === 30) {
        document.getElementById('chipAge2630')?.classList.add('active');
    } else if (min === 28 && max === 35) {
        document.getElementById('chipAge2835')?.classList.add('active');
    }
}

/* ---------- 3. DYNAMIC & SEARCHABLE CITY / LOCATION FILTER ---------- */
function getAllAvailableCities() {
    const citySet = new Set();
    const defaultMajorCities = [
        'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
        'Junagadh', 'Gandhinagar', 'Anand', 'Morbi', 'Navsari', 'Bharuch',
        'Mehsana', 'Bhuj', 'Porbandar', 'Valsad', 'Vapi', 'Surendranagar',
        'Amreli', 'Patan', 'Palanpur', 'Godhra', 'Himatnagar', 'Veraval',
        'Botad', 'Dahod', 'Gondal', 'Jetpur', 'Bardoli', 'Keshod', 'Dhoraji',
        'Una', 'Visnagar', 'Unjha', 'Kadi', 'Kalol'
    ];
    defaultMajorCities.forEach(c => citySet.add(c.trim()));

    // Automatically harvest cities, villages, and districts from all registered profiles
    PROFILES.forEach(p => {
        if (p.city && p.city.trim()) citySet.add(p.city.trim());
        if (p.village && p.village.trim() && p.village !== '—') citySet.add(p.village.trim());
        if (p.district && p.district.trim() && p.district !== '—') citySet.add(p.district.trim());
    });

    return Array.from(citySet).sort((a, b) => a.localeCompare(b));
}

function getProfileCountForCity(cityName) {
    const q = cityName.toLowerCase();
    return PROFILES.filter(p => {
        const c = (p.city || '').toLowerCase();
        const v = (p.village || '').toLowerCase();
        const d = (p.district || '').toLowerCase();
        return c === q || v === q || d === q || c.includes(q) || v.includes(q);
    }).length;
}

function renderFilterCityOptions(searchQuery = '') {
    const currentCity = state.filters ? state.filters.city : 'All';

    // 1. Update dropdown trigger label
    const textEl = document.getElementById('fltCityText');
    if (textEl) {
        textEl.textContent = currentCity === 'All' ? 'All Cities' : currentCity;
    }

    // 2. Preset "All Cities" item
    const allItem = document.getElementById('fltItemAllCities');
    if (allItem) {
        const isAllActive = currentCity === 'All';
        allItem.classList.toggle('active', isAllActive);
        const checkIcon = allItem.querySelector('.flt-city-check-icon');
        if (checkIcon) checkIcon.style.display = isAllActive ? 'block' : 'none';
    }

    // 3. Populate scrollable list
    const listContainer = document.getElementById('fltCityScrollList');
    if (!listContainer) return;

    const q = (searchQuery || '').trim().toLowerCase();
    const allCities = getAllAvailableCities();
    const matches = q === ''
        ? allCities
        : allCities.filter(c => c.toLowerCase().includes(q));

    if (matches.length === 0 && q !== '') {
        const safeQ = searchQuery.replace(/'/g, "\\'");
        listContainer.innerHTML = `
            <div class="flt-city-sub-item" onclick="pickFilterCity('${safeQ}')">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-location-dot" style="color:var(--primary);font-size:12px;"></i>
                    <div style="font-size:12.5px;font-weight:700;color:var(--text);">Filter by "${searchQuery}"</div>
                </div>
                <i class="fa-solid fa-arrow-right" style="color:var(--primary);font-size:11px;"></i>
            </div>`;
    } else {
        listContainer.innerHTML = matches.map(c => {
            const isSelected = currentCity.toLowerCase() === c.toLowerCase();
            const safeName = c.replace(/'/g, "\\'");
            const count = getProfileCountForCity(c);
            const countBadge = count > 0
                ? `<span style="font-size:10px;font-weight:700;background:rgba(123,44,191,0.1);color:var(--primary);padding:2px 7px;border-radius:10px;">${count} ${count === 1 ? 'profile' : 'profiles'}</span>`
                : '';

            return `
                <div class="flt-city-sub-item ${isSelected ? 'active' : ''}" onclick="pickFilterCity('${safeName}')">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-location-dot" style="color:${isSelected ? 'var(--primary)' : 'var(--muted)'};font-size:12px;"></i>
                        <span style="font-size:12.5px;font-weight:${isSelected ? '700' : '500'};color:var(--text);">${c}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${countBadge}
                        ${isSelected ? '<i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:12.5px;"></i>' : ''}
                    </div>
                </div>`;
        }).join('');
    }
}

function filterCityDropdownList(val) {
    renderFilterCityOptions(val);
}

function pickFilterCity(city) {
    state.filters.city = city;
    renderFilterCityOptions();
    const dd = document.getElementById('ddFilterCity');
    if (dd) dd.classList.remove('open');
    showToast(city === 'All' ? 'Location: All Cities' : `Location: ${city}`);
}

/* ---------- 4. GENDER & MARITAL FILTERS ---------- */
function setFilterGender(g) {
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');

    if (isBoy) g = 'girls';
    else if (isGirl) g = 'boys';

    state.filters.gender = g;
    document.querySelectorAll('#fltGenderAll, #fltGenderGirls, #fltGenderBoys').forEach(b => b.classList.remove('active'));
    const activeBtn = g === 'girls' ? document.getElementById('fltGenderGirls') : (g === 'boys' ? document.getElementById('fltGenderBoys') : document.getElementById('fltGenderAll'));
    if (activeBtn) activeBtn.classList.add('active');
}

function pickFilterMarital(m, li) {
    state.filters.marital = m;
    const textEl = document.getElementById('fltMaritalText');
    if (textEl) textEl.textContent = m === 'All' ? 'All Statuses' : m;
    document.querySelectorAll('#ddFilterMarital li').forEach(x => x.classList.remove('active'));
    if (li) li.classList.add('active');
    const dd = document.getElementById('ddFilterMarital');
    if (dd) dd.classList.remove('open');
}

/* ---------- 5. RESET & APPLY FILTERS ---------- */
function resetFilters() {
    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');
    const defaultGender = isBoy ? 'girls' : (isGirl ? 'boys' : 'all');

    state.filters = {
        gender: defaultGender,
        caste: 'All', // Default view shows all profiles
        ageMin: 18,
        ageMax: 50,
        city: 'All',
        marital: 'All'
    };
    setFilterGender(defaultGender);
    setFilterAgePreset('all');
    pickFilterCity('All');
    pickFilterMarital('All');
    renderFilterCasteOptions();
    renderFilterCityOptions();
    applyFilters();
    showToast('Filters reset to show all community matches');
}

function applyFilters() {
    closeModal('modalFilter');
    const searchInput = document.getElementById('browseSearchInput');
    const searchVal = searchInput ? searchInput.value : '';
    renderBrowse(searchVal);
    showToast('Filters applied successfully');
}

/* ---------- 6. BROWSE FEED RENDERING ---------- */
function renderBrowse(query) {
    // Strict Boy Paywall Protection: NEVER render girl profiles for an unpaid boy
    if (state.currentUser && (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy')) {
        const passCheck = typeof checkBoyPassStatus === 'function' 
            ? checkBoyPassStatus(state.currentUser) 
            : { active: state.currentUser.paymentStatus === 'Active' };
        if (!passCheck.active) {
            const wrap = document.getElementById('browseList');
            if (wrap) wrap.innerHTML = '';
            go('scr-membership', true);
            return;
        }
    }

    const wrap = document.getElementById('browseList');
    if (!wrap) return;
    wrap.innerHTML = '';

    const userCaste = getUserCaste();
    const effectiveCaste = getEffectiveFilterCaste();

    const minAge = state.filters.ageMin !== undefined ? state.filters.ageMin : 18;
    const maxAge = state.filters.ageMax !== undefined ? state.filters.ageMax : 50;

    let list = PROFILES.filter(p => {
        // 0. Exclude self profile
        if (typeof isSelfProfile === 'function' && isSelfProfile(p)) return false;
        if (state.currentUser) {
            const myId = Number(state.currentUser.id || 0);
            const myProfId = Number(state.currentUser.profileId || 0);
            const myEmail = (state.currentUser.email || '').trim().toLowerCase();
            if (p.id && (Number(p.id) === myId || Number(p.id) === myProfId)) return false;
            if (myEmail && p.email && p.email.trim().toLowerCase() === myEmail) return false;
        }

        // 0. Account Status & Visibility (Admin Moderation)
        if (p.accountStatus === 'suspended') return false;
        if (p.visible === false) return false;

        // 1. Strict Matrimonial Gender Isolation Rule:
        // A logged-in boy can ONLY see girls. Never show any boy profiles to a boy.
        // A logged-in girl can ONLY see boys. Never show any girl profiles to a girl.
        const userGender = (state.currentUser && state.currentUser.gender) ||
            (state.regData && state.regData.gender) || '';
        const isUserBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
        const isUserGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');

        const checkBoy = typeof isBoyGender === 'function' ? isBoyGender : g => (g === 'boys' || g === 'Boy' || g === 'boy');
        const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');

        if (isUserBoy) {
            // Boy MUST ONLY see girls
            if (!checkGirl(p.gender)) return false;
        } else if (isUserGirl) {
            // Girl MUST ONLY see boys
            if (!checkBoy(p.gender)) return false;
        } else {
            // Unregistered / Guest visitor browsing
            if (state.filters.gender !== 'all') {
                if (state.filters.gender === 'boys' && !checkBoy(p.gender)) return false;
                if (state.filters.gender === 'girls' && !checkGirl(p.gender)) return false;
            } else {
                if (state.tab === 'boys' && !checkBoy(p.gender)) return false;
                if (state.tab === 'girls' && !checkGirl(p.gender)) return false;
            }
        }

        // 2. Community filter
        if (effectiveCaste !== 'All') {
            if (p.community.trim().toLowerCase() !== effectiveCaste.trim().toLowerCase()) return false;
        }

        // 3. Age Range filter
        if (p.age < minAge || p.age > maxAge) return false;

        // 4. City / Location filter
        if (state.filters.city !== 'All') {
            const cQ = state.filters.city.trim().toLowerCase();
            const pCity = (p.city || '').trim().toLowerCase();
            const pVillage = (p.village || '').trim().toLowerCase();
            const pDistrict = (p.district || '').trim().toLowerCase();
            const matchCity = pCity === cQ || pVillage === cQ || pDistrict === cQ ||
                              pCity.includes(cQ) || pVillage.includes(cQ) || pDistrict.includes(cQ) ||
                              cQ.includes(pCity);
            if (!matchCity) return false;
        }

        // 5. Marital status filter
        if (state.filters.marital !== 'All' && p.marital !== state.filters.marital) return false;

        return true;
    });

    if (query) {
        const q = query.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.occ.toLowerCase().includes(q) || p.community.toLowerCase().includes(q));
    }

    if (list.length === 0) {
        wrap.innerHTML = `<div class="empty-state">
            <i class="fa-solid fa-user-slash"></i>
            <h3>No profiles found</h3>
            <p style="max-width:320px;margin:6px auto 0;">No profiles match the selected filters. You can view all communities or reset your filters.</p>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="quickShowAllCastes()"><i class="fa-solid fa-globe"></i> View All Communities</button>
                <button class="btn btn-outline btn-sm" onclick="resetFilters()"><i class="fa-solid fa-rotate-left"></i> Reset filters</button>
            </div>
        </div>`;
    } else {
        list.forEach(p => wrap.appendChild(profileCard(p)));
    }
    buildTabbar('tabbarBrowse', 'browse');
}

function profileCard(p) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    const isFav = state.favorites.has(p.id);
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(p.gender) : (p.gender === 'girls' || p.gender === 'Girl');
    const fallbackImg = isGirl ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    const photos = (p.photos && p.photos.length > 0) ? p.photos.filter(Boolean) : [p.img || p.photo].filter(Boolean);
    const mainImg = photos[0] || p.img || p.photo || fallbackImg;
    const hasMultiple = photos.length > 1;

    card.innerHTML = `
            <div class="pimg-wrap" style="cursor:pointer;" onclick="openProfile(${p.id})">
              <img src="${mainImg}" alt="${escapeHtml(p.name || '')}" onerror="this.onerror=null;this.src='${fallbackImg}';">
              <div class="verified-chip"><i class="fa-solid fa-shield-check"></i> Verified</div>
              ${hasMultiple ? `<span class="pcount-chip" title="Click to view all photos" style="cursor:pointer;" onclick="event.stopPropagation();openPhotoCarousel(${p.id}, event)"><i class="fa-solid fa-camera"></i> ${photos.length} Photos</span>` : ''}
              <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav(${p.id},this)"><i class="fa-regular fa-heart"></i></button>
            </div>
            <div class="pbody">
              <div class="pname">${escapeHtml(p.name || '')}, ${p.age}</div>
              <div class="ploc"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.city || p.village || '')}</div>
              <div class="pmeta-grid">
                <div class="m"><i class="fa-solid fa-briefcase"></i> ${escapeHtml(p.occ || p.occupation || 'Professional')}</div>
                <div class="m"><i class="fa-solid fa-sack-dollar"></i> ${escapeHtml(p.income || 'Confidential')}</div>
                <div class="m"><i class="fa-solid fa-ruler-vertical"></i> ${escapeHtml(p.height || '—')}</div>
                <div class="m"><i class="fa-solid fa-users"></i> ${escapeHtml(p.community || p.caste || '')}</div>
              </div>
              <button class="vbtn" onclick="openProfile(${p.id})">View full profile <i class="fa-solid fa-arrow-right"></i></button>
            </div>`;
    return card;
}

function toggleFav(id, btn) {
    if (!state.currentUser || !state.currentUser.email) {
        showToast('Please log in or register to save favorites');
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) { openModal('modalCompleteProfile'); return; }
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
        if (btn) btn.classList.remove('active');
        showToast('Removed from favorites');
    } else {
        state.favorites.add(id);
        if (btn) btn.classList.add('active');
        showToast('Added to favorites');
    }
    if (document.getElementById('favCountHome')) {
        document.getElementById('favCountHome').textContent = state.favorites.size;
    }
    saveSessionState();
    if (typeof syncFavoritesToDatabase === 'function') {
        syncFavoritesToDatabase();
    }
}

async function syncFavoritesToDatabase() {
    if (!state.currentUser || !state.currentUser.email) return;
    const email = state.currentUser.email.toLowerCase().trim();
    const favArray = Array.from(state.favorites || []);
    
    // Persistent localStorage tied to user email
    try {
        localStorage.setItem('LS_USER_FAVORITES_' + email, JSON.stringify(favArray));
    } catch(e) {}

    // Cloud persistence via Supabase
    if (typeof supabaseSaveUserFavorites === 'function') {
        const uid = state.currentUser.id || state.currentUser.userId;
        supabaseSaveUserFavorites(uid, email, favArray).catch(e => console.warn('[Supabase] Fav save note:', e));
    }
}
window.syncFavoritesToDatabase = syncFavoritesToDatabase;

async function restoreUserFavorites(email, uid) {
    if (!email) return;
    const normEmail = email.toLowerCase().trim();
    
    // 1. Instant local restore from persistent storage
    try {
        const localFavs = localStorage.getItem('LS_USER_FAVORITES_' + normEmail) || localStorage.getItem('LS_FAVORITES_' + normEmail);
        if (localFavs) {
            const parsed = JSON.parse(localFavs);
            if (Array.isArray(parsed)) {
                parsed.forEach(id => state.favorites.add(id));
                saveSessionState();
                if (typeof updateHomeStats === 'function') updateHomeStats();
                const favEl = document.getElementById('favCountHome');
                if (favEl) favEl.textContent = state.favorites.size;
            }
        }
    } catch(e) {}

    // 2. Cloud restore from Supabase
    if (typeof supabaseFetchUserFavorites === 'function') {
        try {
            const cloudFavs = await supabaseFetchUserFavorites(uid, normEmail);
            if (Array.isArray(cloudFavs) && cloudFavs.length > 0) {
                cloudFavs.forEach(id => state.favorites.add(id));
                localStorage.setItem('LS_USER_FAVORITES_' + normEmail, JSON.stringify(Array.from(state.favorites)));
                saveSessionState();
                if (typeof updateHomeStats === 'function') updateHomeStats();
                const favEl = document.getElementById('favCountHome');
                if (favEl) favEl.textContent = state.favorites.size;
                if (document.getElementById('favContent') && document.querySelector('#scr-favorites.active')) {
                    if (typeof renderFavorites === 'function') renderFavorites();
                }
            }
        } catch(e) {
            console.warn('[Favorites] Cloud restore note:', e);
        }
    }
}
window.restoreUserFavorites = restoreUserFavorites;

function buildTabbar(elId, active) {
    const el = document.getElementById(elId);
    if (!el) return;
    const isGirl = state.currentUser && (typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl'));
    const targetTab = isGirl ? 'boys' : 'girls';
    const totalInboxBadge = typeof getInboxBadgeCount === 'function' ? getInboxBadgeCount() : 0;
    const badgeHtml = totalInboxBadge > 0 ? `<span class="tab-badge">${totalInboxBadge}</span>` : '';
    el.innerHTML = `
            <button class="tab ${active === 'home' ? 'active' : ''}" onclick="go('scr-home')"><i class="fa-solid fa-house"></i>Home</button>
            <button class="tab ${active === 'browse' ? 'active' : ''}" onclick="setTab('${targetTab}');go('scr-browse')"><i class="fa-solid fa-magnifying-glass"></i>Browse</button>
            <div class="tab fab" onclick="openMenu()"><div class="fabcircle"><i class="fa-solid fa-bars"></i></div></div>
            <button class="tab ${active === 'inbox' ? 'active' : ''}" onclick="setInboxTab('requests');go('scr-inbox')"><i class="fa-solid fa-heart-circle-check"></i>Inbox${badgeHtml}</button>
            <button class="tab" onclick="go('scr-editprofile')"><i class="fa-solid fa-user"></i>Profile</button>`;
}

function renderFavorites() {
    // Strict Boy Paywall Protection: ONLY for unpaid boys (NEVER for girls)
    const isBoy = state.currentUser && (typeof isBoyGender === 'function' ? isBoyGender(state.currentUser.gender) : (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy'));
    if (isBoy) {
        const passCheck = typeof checkBoyPassStatus === 'function' 
            ? checkBoyPassStatus(state.currentUser) 
            : { active: state.currentUser.paymentStatus === 'Active' };
        if (!passCheck.active) {
            const wrap = document.getElementById('favContent');
            if (wrap) wrap.innerHTML = '';
            go('scr-membership', true);
            return;
        }
    }

    const wrap = document.getElementById('favContent');
    buildTabbar('tabbarFav', 'fav');

    const userGender = (state.currentUser && state.currentUser.gender) ||
        (state.regData && state.regData.gender) || '';
    const isUserBoy = typeof isBoyGender === 'function' ? isBoyGender(userGender) : (userGender === 'Boy' || userGender === 'boy');
    const isUserGirl = typeof isGirlGender === 'function' ? isGirlGender(userGender) : (userGender === 'Girl' || userGender === 'girl');
    const checkBoy = typeof isBoyGender === 'function' ? isBoyGender : g => (g === 'boys' || g === 'Boy' || g === 'boy');
    const checkGirl = typeof isGirlGender === 'function' ? isGirlGender : g => (g === 'girls' || g === 'Girl' || g === 'girl');

    const list = PROFILES.filter(p => {
        if (!state.favorites.has(p.id)) return false;
        if (isUserBoy && !checkGirl(p.gender)) return false;
        if (isUserGirl && !checkBoy(p.gender)) return false;
        return true;
    });
    if (list.length === 0) {
        wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-heart-crack"></i><h3>No favorites yet</h3><p>Tap the heart icon on any profile to save it here.</p><button class="btn btn-primary btn-sm" style="width:auto;padding-left:22px;padding-right:22px;margin:26px auto 0px auto;" onclick="go('scr-browse')">Browse profiles</button></div>`;
    } else {
        wrap.innerHTML = '';
        list.forEach(p => wrap.appendChild(profileCard(p)));
    }
}

function openShareModal() {
    const shareText = "Find your ideal life partner from our community on Lagna Setu matrimonial app!";
    const shareUrl = window.location.origin + window.location.pathname;
    if (navigator.share) {
        navigator.share({
            title: 'Lagna Setu - Community Matrimonial',
            text: shareText,
            url: shareUrl
        }).catch(() => {});
    } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(waUrl, '_blank');
    }
}

// Global Window Exports
if (typeof renderHome !== 'undefined') window.renderHome = renderHome;
if (typeof renderBrowse !== 'undefined') window.renderBrowse = renderBrowse;
if (typeof renderFavorites !== 'undefined') window.renderFavorites = renderFavorites;
if (typeof initHobbies !== 'undefined') window.initHobbies = initHobbies;
if (typeof setTab !== 'undefined') window.setTab = setTab;
if (typeof toggleFav !== 'undefined') window.toggleFav = toggleFav;
if (typeof renderFilterCasteOptions !== 'undefined') window.renderFilterCasteOptions = renderFilterCasteOptions;
if (typeof renderFilterCityOptions !== 'undefined') window.renderFilterCityOptions = renderFilterCityOptions;
if (typeof updateAgeSliderView !== 'undefined') window.updateAgeSliderView = updateAgeSliderView;
if (typeof openShareModal !== 'undefined') window.openShareModal = openShareModal;

