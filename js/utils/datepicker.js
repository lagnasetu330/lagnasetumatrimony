/* ============================================================ CUSTOM DOB MODAL PICKER ============================================================ */
/* ============================================================ CUSTOM DOB MODAL PICKER ============================================================ */
let tempDobState = { d: 14, m: 7, y: 1997 }; // month 0-indexed (7 = August)
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let dobPickerContext = 'reg';
function openDobModal(context = 'reg') {
    dobPickerContext = context;
    if (context === 'edit') {
        const editDobVal = document.getElementById('editDobInput')?.value || '';
        const parts = editDobVal.split('/').map(s => parseInt(s.trim(), 10));
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            tempDobState.d = parts[0];
            tempDobState.m = Math.max(0, Math.min(11, parts[1] - 1));
            tempDobState.y = parts[2];
        }
    }
    initDobPickerLists();
    updateDobLivePreview();
    openModal('modalDobPicker');
}

function initDobPickerLists() {
    const dayWrap = document.getElementById('dobDayList');
    const monthWrap = document.getElementById('dobMonthList');
    const yearWrap = document.getElementById('dobYearList');
    if (!dayWrap || !monthWrap || !yearWrap) return;

    // Days 1..31
    dayWrap.innerHTML = '';
    for (let d = 1; d <= 31; d++) {
        const item = document.createElement('div');
        item.className = `dob-item ${d === tempDobState.d ? 'active' : ''}`;
        item.textContent = d;
        item.onclick = () => {
            tempDobState.d = d;
            document.querySelectorAll('#dobDayList .dob-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            updateDobLivePreview();
        };
        dayWrap.appendChild(item);
    }

    // Months Jan..Dec
    monthWrap.innerHTML = '';
    MONTH_SHORT.forEach((mName, idx) => {
        const item = document.createElement('div');
        item.className = `dob-item ${idx === tempDobState.m ? 'active' : ''}`;
        item.textContent = mName;
        item.onclick = () => {
            tempDobState.m = idx;
            document.querySelectorAll('#dobMonthList .dob-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            updateDobLivePreview();
        };
        monthWrap.appendChild(item);
    });

    // Years 1965..2008
    yearWrap.innerHTML = '';
    for (let y = 2008; y >= 1965; y--) {
        const item = document.createElement('div');
        item.className = `dob-item ${y === tempDobState.y ? 'active' : ''}`;
        item.textContent = y;
        item.onclick = () => {
            tempDobState.y = y;
            document.querySelectorAll('#dobYearList .dob-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            updateDobLivePreview();
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

function calculateAge(birthYear, birthMonth, birthDay) {
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
        age--;
    }
    return Math.max(18, age);
}

function updateDobLivePreview() {
    const dd = String(tempDobState.d).padStart(2, '0');
    const mShort = MONTH_SHORT[tempDobState.m];
    const y = tempDobState.y;
    const age = calculateAge(y, tempDobState.m, tempDobState.d);

    const previewEl = document.getElementById('dobModalLivePreview');
    const ageEl = document.getElementById('dobModalLiveAge');
    if (previewEl) previewEl.textContent = `${dd} ${mShort} ${y}`;
    if (ageEl) ageEl.textContent = age;
}

function confirmDobPicker() {
    const dd = String(tempDobState.d).padStart(2, '0');
    const mm = String(tempDobState.m + 1).padStart(2, '0');
    const y = tempDobState.y;
    const age = calculateAge(y, tempDobState.m, tempDobState.d);

    if (dobPickerContext === 'edit') {
        const editDob = document.getElementById('editDobInput');
        if (editDob) editDob.value = `${dd} / ${mm} / ${y}`;
    } else {
        state.regData.dob = `${dd} / ${mm} / ${y}`;
        state.regData.age = age;

        const regInput = document.getElementById('regDobInput');
        const regAge = document.getElementById('regAgeNum');
        const regAgeBadge = document.getElementById('regAgeBadge');
        if (regInput) regInput.value = `${dd} / ${mm} / ${y}`;
        if (regAge) regAge.textContent = age;
        if (regAgeBadge) regAgeBadge.style.display = 'inline-flex';
    }

    closeModal('modalDobPicker');
    showToast(`DOB set: ${dd}/${mm}/${y} (Age: ${age} Years)`);
}
