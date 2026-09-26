/* ============================================================ UTILITY HELPERS ============================================================ */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* ============================================================ TOAST ============================================================ */
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}


/* ============================================================ MODALS ============================================================ */
function openModal(id) {
    if (id === 'modalPaywall' || id === 'modalBoyComplete') {
        const u = (typeof state !== 'undefined') ? (state.currentUser || state.regData) : null;
        if (u && (typeof isGirlGender === 'function' ? isGirlGender(u.gender) : (u.gender === 'Girl' || u.gender === 'girls' || u.gender === 'girl' || u.gender === 'Female'))) {
            console.warn('[Security Guard] Paywall/Membership modal strictly blocked for Girl account');
            return;
        }
    }
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}
function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
}
function openGuide() {
    renderHowItWorks();
    openModal('modalGuide');
}
function openMenu() {
    if (!state.currentUser || !state.currentUser.email) {
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) {
        openModal('modalCompleteProfile');
        return;
    }
    openModal('modalMenu');
}
function closeIfOverlay() { go(state.currentUser ? 'scr-home' : 'scr-welcome'); }

/* ============================================================ SPLASH & SPA PAGE RELOAD RESTORATION ============================================================ */
/* ============================================================ MAINTENANCE MODE ============================================================ */
const LS_COMMUNITY_MAINTENANCE = 'LS_COMMUNITY_MAINTENANCE';

async function checkMaintenanceMode() {
    const modal = document.getElementById('modalMaintenance');
    // 1. Instant check from localStorage cache (eliminates UI flicker)
    const cachedMaint = localStorage.getItem(LS_COMMUNITY_MAINTENANCE) === 'true';
    if (modal) {
        if (cachedMaint) modal.classList.add('open');
        else modal.classList.remove('open');
    }

    // 2. Fetch live status from Supabase Cloud
    if (typeof supabaseGetMaintenanceMode === 'function') {
        try {
            const isMaint = await supabaseGetMaintenanceMode();
            localStorage.setItem(LS_COMMUNITY_MAINTENANCE, isMaint ? 'true' : 'false');
            if (modal) {
                if (isMaint) modal.classList.add('open');
                else modal.classList.remove('open');
            }
            return isMaint;
        } catch (e) {
            console.warn('[Maintenance] Live check error:', e);
        }
    }
    return cachedMaint;
}

async function checkMaintenanceStatusManual() {
    // Spin the refresh icon while checking
    const icon = document.getElementById('maintCheckIcon');
    const btn = document.getElementById('maintCheckBtn');
    const msgDiv = document.getElementById('maintStatusMsg');
    if (icon) icon.classList.add('fa-spin');
    if (btn) btn.disabled = true;

    try {
        let isMaint = false;
        if (typeof supabaseGetMaintenanceMode === 'function') {
            isMaint = await supabaseGetMaintenanceMode();
        } else {
            isMaint = localStorage.getItem(LS_COMMUNITY_MAINTENANCE) === 'true';
        }
        localStorage.setItem(LS_COMMUNITY_MAINTENANCE, isMaint ? 'true' : 'false');

        if (icon) icon.classList.remove('fa-spin');
        if (btn) btn.disabled = false;

        const modal = document.getElementById('modalMaintenance');

        if (!isMaint) {
            // Platform is back — show green success banner inside modal, then close
            if (msgDiv) {
                msgDiv.style.display = 'block';
                msgDiv.style.background = 'rgba(40,167,69,0.12)';
                msgDiv.style.color = '#1D7A44';
                msgDiv.style.border = '1px solid rgba(40,167,69,0.25)';
                msgDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> &nbsp;Platform is back online! Redirecting you now…';
            }
            setTimeout(() => {
                if (modal) modal.classList.remove('open');
                if (msgDiv) msgDiv.style.display = 'none';
            }, 1300);
        } else {
            // Still in maintenance — show orange warning banner inside modal
            if (msgDiv) {
                msgDiv.style.display = 'block';
                msgDiv.style.background = 'rgba(230,81,0,0.10)';
                msgDiv.style.color = '#E65100';
                msgDiv.style.border = '1px solid rgba(230,81,0,0.22)';
                msgDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> &nbsp;Maintenance still in progress. Our team is working hard — please try again in a few minutes.';
            }
            // Auto-hide the inline message after 5 seconds
            setTimeout(() => {
                if (msgDiv) msgDiv.style.display = 'none';
            }, 5000);
        }
    } catch (err) {
        if (icon) icon.classList.remove('fa-spin');
        if (btn) btn.disabled = false;
    }
}

/* ============================================================ PASSWORD TOGGLE ============================================================ */
function togglePw(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const isPassword = el.type === 'password';
    el.type = isPassword ? 'text' : 'password';

    if (btn) {
        let icon = null;
        if (btn.tagName === 'I' || btn.tagName === 'SPAN') {
            icon = btn;
        } else {
            icon = btn.querySelector('i') || btn.querySelector('.fa-solid') || btn;
        }
        if (icon) {
            if (isPassword) {
                icon.className = 'fa-solid fa-eye-slash';
            } else {
                icon.className = 'fa-solid fa-eye';
            }
        }
    }
}
window.togglePw = togglePw;

/* ============================================================ OTP ============================================================ */
function otpMove(el, event) {
    if (event && event.key === 'Backspace') {
        if (el.value.length === 0) {
            const prev = el.previousElementSibling;
            if (prev && prev.tagName === 'INPUT') {
                prev.focus();
                prev.select();
            }
        }
        return;
    }
    if (el.value.length >= 1) {
        el.value = el.value.slice(0, 1);
        const next = el.nextElementSibling;
        if (next && next.tagName === 'INPUT') {
            next.focus();
            next.select();
        }
    }
}

function handleOtpPaste(e, prefix) {
    e.preventDefault();
    const clip = (e.clipboardData || window.clipboardData).getData('text');
    if (!clip) return;
    const digits = clip.replace(/\D/g, '').slice(0, 4);
    for (let i = 0; i < digits.length; i++) {
        const inp = document.getElementById(`${prefix}${i + 1}`);
        if (inp) inp.value = digits[i];
    }
    const targetIdx = Math.min(digits.length + 1, 4);
    const targetInp = document.getElementById(`${prefix}${targetIdx}`);
    if (targetInp) targetInp.focus();
}

/* ============================================================ CUSTOM DROPDOWNS ============================================================ */
function ddOpen(id) {
    document.querySelectorAll('.dd.open').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
    const target = document.getElementById(id);
    if (target) target.classList.toggle('open');
}
function ddPick(id, li, label) {
    const dd = document.getElementById(id);
    if (!dd) return;
    const span = dd.querySelector('.dd-trigger span');
    if (span) span.textContent = label;
    const trigger = dd.querySelector('.dd-trigger');
    if (trigger) {
        trigger.classList.remove('placeholder');
        trigger.classList.remove('input-error');
        trigger.style.borderColor = '';
    }
    dd.querySelectorAll('li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    dd.classList.remove('open');
}
document.addEventListener('click', (e) => {
    document.querySelectorAll('.dd.open').forEach(d => { if (!d.contains(e.target)) d.classList.remove('open'); });
    const casteDD = document.getElementById('regCasteDropdown');
    const casteWrap = document.getElementById('regCasteSearchWrap');
    if (casteDD && casteWrap && !casteWrap.contains(e.target)) {
        casteDD.classList.remove('open');
    }
});


/* ============================================================ GMAIL VALIDATION ============================================================ */
function validateGmail(value) {
    const v = (value || '').trim().toLowerCase();
    if (!v) return { ok: false, msg: 'Please enter your Gmail address' };

    // Must have @ and . after @
    const atIdx = v.indexOf('@');
    if (atIdx < 1) return { ok: false, msg: 'Please enter a valid Gmail address (e.g. yourname@gmail.com)' };

    const domain = v.slice(atIdx + 1);
    const local = v.slice(0, atIdx);

    // Local part: no spaces, must be at least 1 char, no consecutive dots
    if (!local || local.includes(' ') || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
        return { ok: false, msg: 'Invalid Gmail format — please check before the @' };
    }

    // Domain must have a dot and valid extension
    if (!domain.includes('.')) return { ok: false, msg: 'Please enter a valid email (e.g. yourname@gmail.com)' };
    const domainParts = domain.split('.');
    if (domainParts.some(p => p.length < 1)) {
        return { ok: false, msg: 'Please enter a valid email domain (e.g. yourname@gmail.com)' };
    }

    // Must be @gmail.com specifically (this app is Gmail-based)
    if (domain !== 'gmail.com') {
        return { ok: false, msg: 'Only Gmail addresses (@gmail.com) are accepted on Lagna Setu' };
    }

    // Min 3 chars before @
    if (local.length < 3) {
        return { ok: false, msg: 'Gmail username must be at least 3 characters before @gmail.com' };
    }

    // No random-looking patterns: must have at least one letter
    const hasLetter = /[a-z]/.test(local);
    if (!hasLetter) {
        return { ok: false, msg: 'Please enter a valid Gmail address' };
    }

    return { ok: true, msg: '' };
}

function liveGmailValidate(inputEl) {
    if (!inputEl) return;
    const val = inputEl.value.trim();
    if (!val) { clearFieldError(inputEl); return; }
    const result = validateGmail(val);
    if (!result.ok) {
        inputEl.style.borderColor = 'var(--error)';
        inputEl.classList.add('input-error');
    } else {
        inputEl.style.borderColor = 'var(--success)';
        inputEl.classList.remove('input-error');
    }
}

/* ============================================================ 2026 PHONE NUMBER FORMATTER (+91 XXXXX XXXXX) ============================================================ */
function extract10DigitMobile(val) {
    if (!val) return '';
    let clean = String(val).trim();
    let digits = '';
    if (clean.startsWith('+91')) {
        clean = clean.slice(3).trim();
        digits = clean.replace(/\D/g, '');
    } else {
        let d = clean.replace(/\D/g, '');
        if (d.length === 12 && d.startsWith('91')) {
            d = d.slice(2);
        } else if (d.length === 11 && d.startsWith('0')) {
            d = d.slice(1);
        } else if (d.length > 10 && d.startsWith('91')) {
            d = d.slice(2);
        }
        digits = d;
    }
    return digits.slice(0, 10);
}

function formatPhoneNumber(val) {
    const d = extract10DigitMobile(val);
    if (!d || d.length === 0) return '+91 ';
    if (d.length <= 5) return '+91 ' + d;
    return '+91 ' + d.slice(0, 5) + ' ' + d.slice(5);
}

function attachPhoneFormatter(inputEl) {
    if (!inputEl || !inputEl.addEventListener || inputEl._phoneFormatterAttached) return;
    inputEl._phoneFormatterAttached = true;

    if (!inputEl.value || inputEl.value.trim() === '' || inputEl.value.trim() === '+91') {
        inputEl.value = '+91 ';
    } else {
        inputEl.value = formatPhoneNumber(inputEl.value);
    }

    inputEl.addEventListener('focus', function () {
        if (!this.value || this.value.trim() === '' || this.value.trim() === '+91') {
            this.value = '+91 ';
        }
        setTimeout(() => {
            if (this.selectionStart < 4) {
                this.setSelectionRange(this.value.length, this.value.length);
            }
        }, 10);
    });

    inputEl.addEventListener('click', function () {
        if (this.selectionStart < 4) {
            this.setSelectionRange(this.value.length, this.value.length);
        }
    });

    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
            if (this.selectionStart <= 4 && this.selectionEnd <= 4) {
                e.preventDefault();
            }
        }
    });

    inputEl.addEventListener('input', function () {
        clearFieldError(this);
        const formatted = formatPhoneNumber(this.value);
        if (this.value !== formatted) {
            this.value = formatted;
        }
    });

    inputEl.addEventListener('blur', function () {
        if (this.value.trim() === '+91' || this.value.trim() === '') {
            this.value = '+91 ';
        }
    });
}

function initPhoneInputs() {
    ['regOwnMobile', 'regFatherMobile', 'editOwnMobile', 'editFatherMobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) attachPhoneFormatter(el);
    });
}

function goToRegStep3() {
    // 1. Profile Photo Validation (Slot 1 Main photo is required)
    const hasPhoto = state.regData.photo || (state.regData.photos && state.regData.photos[0]);
    if (!hasPhoto) {
        showToast('Profile photo is required. Please upload your Slot 1 photo.');
        const box = document.getElementById('regSlotCard1') || document.getElementById('regAvatarBox');
        if (box) {
            highlightFieldError(box, 'Profile photo is required. Please upload your Slot 1 photo.');
        }
        return;
    }

    // 2. Gender Selection
    if (!state.regData.gender) {
        const dd = document.getElementById('ddGender');
        const trigger = dd ? dd.querySelector('.dd-trigger') : null;
        highlightFieldError(trigger, 'Please select your gender (Boy or Girl)');
        return;
    }

    // 3. Full Name
    const nameInput = document.getElementById('regFullName');
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (!nameVal || nameVal.length < 3) {
        highlightFieldError(nameInput, 'Please enter your full name (minimum 3 characters)');
        return;
    }

    // 4. Date of Birth & 18+ Age Validation (2026 System Standard)
    const dobInput = document.getElementById('regDobInput');
    if (!state.regData.dob || !state.regData.dob.trim()) {
        const wrap = (dobInput && typeof dobInput.closest === 'function') ? dobInput.closest('.input-icon-wrap') : dobInput;
        highlightFieldError(wrap, 'Please select your Date of Birth');
        openDobModal('reg');
        return;
    }
    if (!state.regData.age || state.regData.age < 18) {
        const wrap = (dobInput && typeof dobInput.closest === 'function') ? dobInput.closest('.input-icon-wrap') : dobInput;
        highlightFieldError(wrap, 'You must be at least 18 years old to register on Lagna Setu');
        return;
    }

    // 5. User's Personal Mobile Number (100% Private & Confidential - Admin Only)
    const ownMobileInput = document.getElementById('regOwnMobile');
    const rawOwnMobile = ownMobileInput ? ownMobileInput.value.trim() : '';
    const cleanOwnMobile = extract10DigitMobile(rawOwnMobile);
    if (!cleanOwnMobile) {
        highlightFieldError(ownMobileInput, "Please enter your personal mobile number");
        return;
    }
    if (cleanOwnMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanOwnMobile)) {
        highlightFieldError(ownMobileInput, "Please enter a valid 10-digit personal mobile number starting with 6, 7, 8, or 9 (e.g. 98765 43210)");
        return;
    }
    state.regData.ownMobile = '+91 ' + cleanOwnMobile.slice(0, 5) + ' ' + cleanOwnMobile.slice(5);
    if (ownMobileInput) ownMobileInput.value = state.regData.ownMobile;

    // 6. Height (cm) Validation
    const heightInput = document.getElementById('regHeight');
    const rawHeight = heightInput ? heightInput.value.trim() : '';
    const numHeight = parseFloat(rawHeight);
    if (!rawHeight) {
        highlightFieldError(heightInput, "Please enter your height in cm (e.g. 165)");
        return;
    }
    if (isNaN(numHeight) || numHeight < 90 || numHeight > 250) {
        highlightFieldError(heightInput, "Please enter a valid height between 90 cm and 250 cm");
        return;
    }
    state.regData.height = String(Math.round(numHeight));

    // 7. Weight (kg) Validation
    const weightInput = document.getElementById('regWeight');
    const rawWeight = weightInput ? weightInput.value.trim() : '';
    const numWeight = parseFloat(rawWeight);
    if (!rawWeight) {
        highlightFieldError(weightInput, "Please enter your weight in kg (e.g. 65)");
        return;
    }
    if (isNaN(numWeight) || numWeight < 30 || numWeight > 200) {
        highlightFieldError(weightInput, "Please enter a valid weight between 30 kg and 200 kg");
        return;
    }
    state.regData.weight = String(Math.round(numWeight));

    // 8. Education Degree Validation
    const eduInput = document.getElementById('regEducation');
    const eduVal = eduInput ? eduInput.value.trim() : '';
    if (!eduVal || eduVal.length < 2) {
        highlightFieldError(eduInput, "Please enter your education degree (e.g. B.Tech / B.Com / MBA)");
        return;
    }
    state.regData.education = eduVal;

    // 9. Marital Status Validation
    if (!state.regData.marital) {
        const ddMarital = document.getElementById('ddMarital');
        const trigger = ddMarital ? ddMarital.querySelector('.dd-trigger') : null;
        highlightFieldError(trigger, "Please select your marital status");
        return;
    }

    // 10. Physical Status Validation
    if (!state.regData.physical) {
        const ddPhysical = document.getElementById('ddPhysical');
        const trigger = ddPhysical ? ddPhysical.querySelector('.dd-trigger') : null;
        highlightFieldError(trigger, "Please select your physical status (e.g. Normal)");
        return;
    }

    // 11. Occupation Validation
    const occInput = document.getElementById('regOccupation');
    const occVal = occInput ? occInput.value.trim() : '';
    if (!occVal || occVal.length < 2) {
        highlightFieldError(occInput, "Please enter your occupation (e.g. Software Engineer / Business)");
        return;
    }
    state.regData.occupation = occVal;

    // 12. Monthly Income Validation
    if (!state.regData.income) {
        const ddIncome = document.getElementById('ddIncome');
        const trigger = ddIncome ? ddIncome.querySelector('.dd-trigger') : null;
        highlightFieldError(trigger, "Please select your monthly income range");
        return;
    }

    // 13. Hobbies Collection (Preserve entered hobbies or default to empty array)
    const hobbyInputs = document.querySelectorAll('#hobbyList input');
    const collectedHobbies = [];
    hobbyInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val && !collectedHobbies.includes(val) && val.toLowerCase() !== 'none' && val !== '—') {
            collectedHobbies.push(val);
        }
    });
    state.regData.hobbies = collectedHobbies;

    // 14. Father's Name Validation
    const fNameInput = document.getElementById('regFatherName');
    const fNameVal = fNameInput ? fNameInput.value.trim() : '';
    if (!fNameVal || fNameVal.length < 2) {
        highlightFieldError(fNameInput, "Please enter father's full name");
        return;
    }
    state.regData.fatherName = fNameVal;
    state.regData.fatherOcc = document.getElementById('regFatherOcc') ? document.getElementById('regFatherOcc').value.trim() : '';

    // 15. Father's Mobile Number (10-Digit Indian Mobile Validation)
    const fMobileInput = document.getElementById('regFatherMobile');
    const rawMobile = fMobileInput ? fMobileInput.value.trim() : '';
    const cleanMobile = extract10DigitMobile(rawMobile);
    if (!cleanMobile) {
        highlightFieldError(fMobileInput, "Please enter father's mobile number (Public Contact)");
        return;
    }
    if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
        highlightFieldError(fMobileInput, "Please enter a valid 10-digit mobile number for father starting with 6, 7, 8, or 9 (e.g. 98765 43210)");
        return;
    }
    state.regData.fatherMobile = '+91 ' + cleanMobile.slice(0, 5) + ' ' + cleanMobile.slice(5);
    if (fMobileInput) fMobileInput.value = state.regData.fatherMobile;
    const fWhatsapp = document.getElementById('regFatherWhatsapp');
    state.regData.fatherWhatsapp = fWhatsapp ? fWhatsapp.classList.contains('on') : true;

    // 16. Mother's Name Validation
    const mNameInput = document.getElementById('regMotherName');
    const mNameVal = mNameInput ? mNameInput.value.trim() : '';
    if (!mNameVal || mNameVal.length < 2) {
        highlightFieldError(mNameInput, "Please enter mother's full name");
        return;
    }
    state.regData.motherName = mNameVal;
    state.regData.motherOcc = document.getElementById('regMotherOcc') ? document.getElementById('regMotherOcc').value.trim() : '';

    // 17. Sister Validation (Strict Toggle Check)
    if (state.siblingEnabled.sister) {
        const sisterList = document.getElementById('sisterList');
        const sisterInputs = sisterList ? Array.from(sisterList.querySelectorAll('input')) : [];
        if (sisterInputs.length === 0) {
            addSibling('sister');
            const newInputs = sisterList.querySelectorAll('input');
            const target = newInputs[newInputs.length - 1];
            highlightFieldError(target, "Please enter sister's name or turn on 'I don't have a sister'");
            return;
        }
        for (let i = 0; i < sisterInputs.length; i++) {
            const inp = sisterInputs[i];
            if (!inp.value.trim()) {
                highlightFieldError(inp, "Please enter sister's name or turn on 'I don't have a sister'");
                return;
            }
        }
        const sisterNames = sisterInputs.map(inp => inp.value.trim()).filter(Boolean);
        state.regData.sister = sisterNames.join(', ');
        state.regData.sisterCount = sisterNames.length;
    } else {
        state.regData.sister = 'None';
        state.regData.sisterCount = 0;
    }

    // 18. Brother Validation (Strict Toggle Check)
    if (state.siblingEnabled.brother) {
        const brotherList = document.getElementById('brotherList');
        const brotherInputs = brotherList ? Array.from(brotherList.querySelectorAll('input')) : [];
        if (brotherInputs.length === 0) {
            addSibling('brother');
            const newInputs = brotherList.querySelectorAll('input');
            const target = newInputs[newInputs.length - 1];
            highlightFieldError(target, "Please enter brother's name or turn on 'I don't have a brother'");
            return;
        }
        for (let i = 0; i < brotherInputs.length; i++) {
            const inp = brotherInputs[i];
            if (!inp.value.trim()) {
                highlightFieldError(inp, "Please enter brother's name or turn on 'I don't have a brother'");
                return;
            }
        }
        const brotherNames = brotherInputs.map(inp => inp.value.trim()).filter(Boolean);
        state.regData.brother = brotherNames.join(', ');
        state.regData.brotherCount = brotherNames.length;
    } else {
        state.regData.brother = 'None';
        state.regData.brotherCount = 0;
    }

    // 19. Save remaining details & proceed
    state.regData.name = nameVal;

    go('scr-reg3');
}


/* ============================================================ QUICK ACTIONS (CALL / WHATSAPP / REPORT) ============================================================ */
function quickInterest(id) {
    openInterestModal(id);
}
function quickCall(phone) {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
}
function quickWhatsApp(phone, name) {
    const clean = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Namaste, we saw ${name}'s profile on Lagna Setu Matrimony and would like to connect.`);
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
}
function openQuickReport(id) {
    state.activeReportId = id;
    openModal('modalQuickReport');
}
function pickReportReason(reason, li) {
    document.getElementById('reportReasonText').textContent = reason;
    document.querySelectorAll('#ddReportReason li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    document.getElementById('ddReportReason').classList.remove('open');
}
async function submitQuickReport() {
    const reasonEl = document.getElementById('reportReasonText');
    const reason = reasonEl ? reasonEl.textContent.trim() : 'Inappropriate profile';
    const notesEl = document.getElementById('reportNotes');
    const notes = notesEl ? notesEl.value.trim() : '';
    const targetId = state.activeReportId || state.activeProfileId || 4;

    let targetProfile = null;
    if (typeof findProfile === 'function') {
        targetProfile = findProfile(targetId);
    }
    if (!targetProfile && typeof PROFILES !== 'undefined' && Array.isArray(PROFILES)) {
        targetProfile = PROFILES.find(p => p && (String(p.id) === String(targetId) || String(p.user_id) === String(targetId)));
    }

    const reporter = state.currentUser || state.regData || null;
    const reportData = {
        reporterId: reporter ? (reporter.id || reporter.userId || 1) : 1,
        reporterName: reporter ? (reporter.name || 'Member') : 'Member',
        reporterEmail: reporter ? (reporter.email || '') : '',
        targetUserId: targetId,
        targetUserName: targetProfile ? (targetProfile.name || 'Reported Member') : 'Member',
        targetUserEmail: targetProfile ? (targetProfile.email || '') : '',
        targetUserPhoto: targetProfile ? (targetProfile.img || targetProfile.avatar_url || '') : '',
        reason: reason,
        details: notes || 'Submitted via in-app quick report from profile card.',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    if (typeof supabaseSubmitReport === 'function') {
        supabaseSubmitReport(reportData).catch(err => console.warn('[Report] Cloud submit note:', err));
    } else {
        try {
            const raw = localStorage.getItem(LS_REPORTS_KEY);
            const rList = raw ? JSON.parse(raw) : [];
            rList.unshift({
                id: Date.now(),
                userId: targetId,
                reporterId: reportData.reporterId,
                reason: reason,
                details: reportData.details,
                date: reportData.date,
                status: 'open'
            });
            localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(rList));
        } catch(e) {}
    }

    if (notesEl) notesEl.value = '';
    closeModal('modalQuickReport');
    showToast('Report submitted to admin team. Thank you.');
}

/* ============================================================ TOGGLES & SIBLINGS ============================================================ */
function toggleCheck(id, rowEl) {
    document.getElementById(id).classList.toggle('on');
}
function toggleSibling(kind, btn) {
    btn.classList.toggle('on');
    const disabled = btn.classList.contains('on');
    state.siblingEnabled[kind] = !disabled;
    const block = document.getElementById(kind + 'Block');
    if (block) {
        block.style.display = disabled ? 'none' : 'block';
        if (disabled) {
            block.querySelectorAll('input').forEach(inp => {
                inp.classList.remove('input-error');
                inp.style.borderColor = '';
            });
        } else {
            const list = document.getElementById(kind + 'List');
            if (list && list.children.length === 0) {
                addSibling(kind);
            }
        }
    }
}
let sibUid = 0;
function addSibling(kind) {
    const wrap = document.getElementById(kind + 'List');
    if (!wrap) return;
    sibUid++;
    const row = document.createElement('div');
    row.className = 'sib-card';
    row.id = 'sib-' + sibUid;
    row.innerHTML = `<input class="input" placeholder="${kind === 'sister' ? 'Sister' : 'Brother'} full name" oninput="this.classList.remove('input-error');this.style.borderColor='';">
    <button type="button" class="sib-remove" onclick="removeSibling('${kind}', 'sib-${sibUid}')" title="Remove"><i class="fa-solid fa-xmark"></i></button>`;
    wrap.appendChild(row);
    const inp = row.querySelector('input');
    if (inp) {
        inp.focus();
    }
}
function removeSibling(kind, elementId) {
    const el = document.getElementById(elementId);
    if (el) el.remove();
}
addSibling('sister'); addSibling('brother');


/* ============================================================ 2026 LIVE INPUT VALIDATION CLEANUP ============================================================ */
document.addEventListener('input', (e) => {
    if (e.target && e.target.tagName === 'INPUT') {
        e.target.classList.remove('input-error');
        e.target.style.borderColor = '';
        const wrap = e.target.closest('.input-icon-wrap') || e.target.closest('.field');
        if (wrap) {
            wrap.classList.remove('input-error');
            wrap.style.borderColor = '';
        }
    }
});

function initAppHelpers() {
    if (typeof initPhoneInputs === 'function') initPhoneInputs();
    if (typeof setupChatMobileHandlers === 'function') setupChatMobileHandlers();
    if (typeof renderFilterCasteOptions === 'function') renderFilterCasteOptions();
    if (typeof renderFilterCityOptions === 'function') renderFilterCityOptions();
    if (typeof updateAgeSliderView === 'function') updateAgeSliderView();
}

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

// Global Window Exports
if (typeof isBoyGender !== 'undefined') window.isBoyGender = isBoyGender;
if (typeof isGirlGender !== 'undefined') window.isGirlGender = isGirlGender;
if (typeof checkMaintenanceMode !== 'undefined') window.checkMaintenanceMode = checkMaintenanceMode;
if (typeof checkMaintenanceStatusManual !== 'undefined') window.checkMaintenanceStatusManual = checkMaintenanceStatusManual;
if (typeof showToast !== 'undefined') window.showToast = showToast;
if (typeof openModal !== 'undefined') window.openModal = openModal;
if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
if (typeof closeAllModals !== 'undefined') window.closeAllModals = closeAllModals;
if (typeof initAppHelpers !== 'undefined') window.initAppHelpers = initAppHelpers;
if (typeof escapeHtml !== 'undefined') window.escapeHtml = escapeHtml;
if (typeof initPhoneInputs !== 'undefined') window.initPhoneInputs = initPhoneInputs;
if (typeof togglePw !== 'undefined') window.togglePw = togglePw;
if (typeof otpMove !== 'undefined') window.otpMove = otpMove;
if (typeof handleOtpPaste !== 'undefined') window.handleOtpPaste = handleOtpPaste;

/* ============================================================ 10-MINUTE INACTIVITY AUTO-LOGOUT ============================================================ */
let inactivityTimerInterval = null;
let lastUserActivityTimestamp = Date.now();
let isActivityListenersAttached = false;
let INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel', 'pointerdown'];

function recordUserActivity(force = false) {
    const now = Date.now();
    if (force || (now - lastUserActivityTimestamp >= 2000)) {
        lastUserActivityTimestamp = now;
        if (typeof state !== 'undefined' && state.currentUser && state.currentUser.email) {
            try {
                localStorage.setItem('lagnaSetu_lastActiveTimestamp', String(now));
            } catch (_) {}
        }
    }
}

function onUserMovementOrActivity() {
    recordUserActivity(false);
}

function onVisibilityOrFocusChange() {
    if (typeof state === 'undefined' || !state.currentUser || !state.currentUser.email) return;
    const now = Date.now();

    if (document.hidden) {
        // App / tab sent to background: record exact departure time
        recordUserActivity(true);
    } else {
        // App / tab resumed / foregrounded: check if > 10 minutes passed while away
        const storedActive = Number(localStorage.getItem('lagnaSetu_lastActiveTimestamp') || lastUserActivityTimestamp || 0);
        const idleTime = now - storedActive;
        if (idleTime >= INACTIVITY_LIMIT_MS) {
            console.warn(`[AutoLogout] User resumed after ${Math.round(idleTime / 1000)}s (>10 minutes). Logging out.`);
            clearInactivityTimer();
            if (typeof doLogout === 'function') {
                doLogout(true);
            }
        } else {
            // User resumed within 10 minutes: refresh session timestamp
            recordUserActivity(true);
        }
    }
}

function initInactivityTimer(customTimeoutMs) {
    if (typeof customTimeoutMs === 'number' && customTimeoutMs > 0) {
        INACTIVITY_LIMIT_MS = customTimeoutMs;
    }
    lastUserActivityTimestamp = Date.now();
    recordUserActivity(true);

    if (!isActivityListenersAttached && typeof window !== 'undefined') {
        ACTIVITY_EVENTS.forEach(evt => {
            window.addEventListener(evt, onUserMovementOrActivity, { passive: true });
        });
        document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
        window.addEventListener('focus', onVisibilityOrFocusChange);
        window.addEventListener('blur', () => recordUserActivity(true), { passive: true });
        window.addEventListener('beforeunload', () => recordUserActivity(true), { passive: true });
        isActivityListenersAttached = true;
    }

    if (inactivityTimerInterval) {
        clearInterval(inactivityTimerInterval);
    }

    // Check inactivity every 10 seconds
    inactivityTimerInterval = setInterval(() => {
        // Only run inactivity logout if an active user session exists
        if (typeof state === 'undefined' || !state.currentUser || !state.currentUser.email) {
            return;
        }

        const now = Date.now();
        const storedActive = Number(localStorage.getItem('lagnaSetu_lastActiveTimestamp') || 0);
        const effectiveLast = Math.max(lastUserActivityTimestamp, storedActive);
        const idleTime = now - effectiveLast;

        if (idleTime >= INACTIVITY_LIMIT_MS) {
            console.warn(`[AutoLogout] 10 minutes inactivity limit reached (${idleTime}ms). Performing safe logout.`);
            clearInactivityTimer();
            if (typeof doLogout === 'function') {
                doLogout(true);
            } else {
                sessionStorage.clear();
                try {
                    localStorage.removeItem('lagnaSetu_activeUser');
                    localStorage.removeItem('lagnaSetu_lastActiveTimestamp');
                } catch (_) {}
                if (typeof go === 'function') go('scr-welcome', true);
                if (typeof showToast === 'function') {
                    showToast('Logged out due to 10 minutes of inactivity.');
                }
            }
        }
    }, 10000);
}

function resetInactivityTimer() {
    lastUserActivityTimestamp = Date.now();
    recordUserActivity(true);
}

function clearInactivityTimer() {
    if (inactivityTimerInterval) {
        clearInterval(inactivityTimerInterval);
        inactivityTimerInterval = null;
    }
    if (isActivityListenersAttached && typeof window !== 'undefined') {
        ACTIVITY_EVENTS.forEach(evt => {
            window.removeEventListener(evt, onUserMovementOrActivity);
        });
        document.removeEventListener('visibilitychange', onVisibilityOrFocusChange);
        window.removeEventListener('focus', onVisibilityOrFocusChange);
        isActivityListenersAttached = false;
    }
    lastUserActivityTimestamp = Date.now();
}

function setInactivityTimeoutForTesting(ms) {
    if (typeof ms === 'number' && ms > 0) {
        INACTIVITY_LIMIT_MS = ms;
    }
}

window.recordUserActivity = recordUserActivity;
window.initInactivityTimer = initInactivityTimer;
window.resetInactivityTimer = resetInactivityTimer;
window.clearInactivityTimer = clearInactivityTimer;
window.setInactivityTimeoutForTesting = setInactivityTimeoutForTesting;

