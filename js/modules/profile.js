/* ============================================================ MEMBER PROFILE & ACTIONS ============================================================ */
/* ============================================================ STEP 3: SUBMIT PROFILE & GENDER PAYWALL ============================================================ */
async function submitProfileCompletion() {
    const cityInput = document.getElementById('regCity');
    const talukaInput = document.getElementById('regTaluka');
    const districtInput = document.getElementById('regDistrict');
    const addressInput = document.getElementById('regAddress');

    const city = cityInput ? cityInput.value.trim() : '';
    const taluka = talukaInput ? talukaInput.value.trim() : '';
    const district = districtInput ? districtInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    if (!city) {
        highlightFieldError(cityInput, 'Please enter your City / Village');
        return;
    }
    if (!district) {
        highlightFieldError(districtInput, 'Please enter your District');
        return;
    }
    if (!address) {
        highlightFieldError(addressInput, 'Please enter your Full Address');
        return;
    }

    state.regData.city = city;
    state.regData.taluka = taluka;
    state.regData.district = district;
    state.regData.address = address;
    state.profileComplete = true;

    // Accurately determine gender (Girl vs Boy) before creating profile
    const userGender = state.regData.gender || state.currentUser?.gender;
    if (!userGender || (userGender !== 'Boy' && userGender !== 'Girl')) {
        showToast('Gender is mandatory. Please select Boy or Girl.');
        navTo('scr-reg');
        const grid = document.getElementById('genderCardGrid');
        const err = document.getElementById('genderErrorMsg');
        if (err) err.style.display = 'block';
        if (grid) {
            grid.style.outline = '2px solid var(--error)';
            grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    const isGirl = userGender === 'Girl';

    // Synchronize ID and Email across users and profiles tables
    // Synchronize ID and Email across users and profiles tables (Guaranteed 64-bit BIGINT numeric ID)
    let cleanProfileId = null;
    const rawId = (state.currentUser && state.currentUser.id) ? state.currentUser.id : (state.regData.userId || Date.now());
    if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId > 0) {
        cleanProfileId = Math.floor(rawId);
    } else if (typeof rawId === 'string' && rawId.trim()) {
        const digits = rawId.replace(/\D/g, '');
        if (digits.length > 0) {
            cleanProfileId = parseInt(digits.slice(-15), 10);
        }
    }
    if (!cleanProfileId || isNaN(cleanProfileId)) {
        cleanProfileId = Date.now();
    }
    const userEmail = (state.currentUser && state.currentUser.email) ? state.currentUser.email : (state.regData.email || '');

    // Photos list
    const photosList = (Array.isArray(state.regData.photos) && state.regData.photos.filter(Boolean).length > 0)
        ? state.regData.photos.filter(Boolean)
        : (state.regData.photo ? [state.regData.photo] : (state.currentUser?.photos || (state.currentUser?.img ? [state.currentUser.img] : [])));
    const mainImg = photosList[0] || (isGirl ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop');

    // Create newly registered profile in PROFILES with complete field set
    const newProfile = {
        id: cleanProfileId,
        user_id: String(rawId || cleanProfileId),
        gender: isGirl ? 'girls' : 'boys',
        name: state.regData.name || state.currentUser?.name || '',
        age: parseInt(state.regData.age) || parseInt(state.currentUser?.age) || 24,
        dob: state.regData.dob || state.currentUser?.dob || '',
        height: state.regData.height ? (String(state.regData.height).includes('cm') ? state.regData.height : `${state.regData.height} cm`) : (state.currentUser?.height || "5'6\""),
        weight: state.regData.weight ? (String(state.regData.weight).includes('kg') ? state.regData.weight : `${state.regData.weight} kg`) : (state.currentUser?.weight || '60 kg'),
        education: state.regData.education || state.currentUser?.education || 'Graduate',
        occ: state.regData.occupation || state.currentUser?.occupation || state.currentUser?.occ || 'Professional',
        occupation: state.regData.occupation || state.currentUser?.occupation || state.currentUser?.occ || 'Professional',
        income: state.regData.income || state.currentUser?.income || '₹40K – ₹75K',
        marital: state.regData.marital || state.currentUser?.marital || 'Unmarried',
        physical: state.regData.physical || state.currentUser?.physical || 'Normal',
        community: state.regData.caste || state.currentUser?.caste || '',
        hobbies: (Array.isArray(state.regData.hobbies) && state.regData.hobbies.length > 0) ? state.regData.hobbies : (state.currentUser?.hobbies || []),
        father: state.regData.fatherName || state.currentUser?.father || 'Father',
        father_name: state.regData.fatherName || state.currentUser?.father || 'Father',
        fatherOcc: state.regData.fatherOcc || state.currentUser?.fatherOcc || 'Business',
        father_occ: state.regData.fatherOcc || state.currentUser?.fatherOcc || 'Business',
        fatherMobile: state.regData.fatherMobile || state.currentUser?.fatherMobile || '',
        father_mobile: state.regData.fatherMobile || state.currentUser?.fatherMobile || '',
        fatherWhatsapp: state.regData.fatherWhatsapp !== false,
        ownMobile: state.regData.ownMobile || state.currentUser?.mobile || '',
        own_mobile: state.regData.ownMobile || state.currentUser?.mobile || '',
        mother: state.regData.motherName || state.currentUser?.mother || 'Mother',
        mother_name: state.regData.motherName || state.currentUser?.mother || 'Mother',
        motherOcc: state.regData.motherOcc || state.currentUser?.motherOcc || 'Homemaker',
        mother_occ: state.regData.motherOcc || state.currentUser?.motherOcc || 'Homemaker',
        sister: state.regData.sister || state.currentUser?.sister || 'None',
        brother: state.regData.brother || state.currentUser?.brother || 'None',
        city: state.regData.city || state.currentUser?.city || '',
        village: state.regData.city || state.currentUser?.village || state.currentUser?.city || '',
        taluka: state.regData.taluka || state.currentUser?.taluka || state.regData.city || '',
        district: state.regData.district || state.currentUser?.district || '',
        address: state.regData.address || state.currentUser?.address || '',
        fullAddress: state.regData.address || state.currentUser?.fullAddress || state.currentUser?.address || '',
        full_address: state.regData.address || state.currentUser?.full_address || state.currentUser?.address || '',
        img: mainImg,
        photos: photosList.length > 0 ? photosList : [mainImg]
    };

    // Check Auto-Approve setting (configured from Admin Control Center)
    let isAutoApproved = true;
    try {
        if (typeof supabaseGetAppSetting === 'function') {
            const remoteAuto = await Promise.race([
                supabaseGetAppSetting('auto_approve'),
                new Promise(resolve => setTimeout(() => resolve(null), 1200))
            ]);
            if (remoteAuto && typeof remoteAuto.enabled === 'boolean') {
                isAutoApproved = remoteAuto.enabled;
                try { localStorage.setItem('LS_COMMUNITY_AUTO_APPROVE', JSON.stringify(remoteAuto)); } catch (_) {}
            } else {
                const cachedAuto = localStorage.getItem('LS_COMMUNITY_AUTO_APPROVE');
                if (cachedAuto) {
                    const p = JSON.parse(cachedAuto);
                    if (p && typeof p.enabled === 'boolean') isAutoApproved = p.enabled;
                }
            }
        } else {
            const cachedAuto = localStorage.getItem('LS_COMMUNITY_AUTO_APPROVE');
            if (cachedAuto) {
                const p = JSON.parse(cachedAuto);
                if (p && typeof p.enabled === 'boolean') isAutoApproved = p.enabled;
            }
        }
    } catch (_) {
        try {
            const cachedAuto = localStorage.getItem('LS_COMMUNITY_AUTO_APPROVE');
            if (cachedAuto) {
                const p = JSON.parse(cachedAuto);
                if (p && typeof p.enabled === 'boolean') isAutoApproved = p.enabled;
            }
        } catch (_) {}
    }

    newProfile.accountStatus = isAutoApproved ? 'active' : 'pending';
    newProfile.verifyStatus = isAutoApproved ? 'approved' : 'pending';
    newProfile.paymentStatus = isGirl ? 'free' : 'unpaid';
    newProfile.visible = isAutoApproved ? true : false;
    newProfile.registered = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    newProfile.agreedTerms = true;
    newProfile.agreedTermsAt = (state.currentUser && state.currentUser.agreedTermsAt) || new Date().toISOString();
    newProfile.email = userEmail ? userEmail.toLowerCase().trim() : ((state.regData.name || 'member').toLowerCase().replace(/\s+/g, '.') + '@gmail.com');
    newProfile.mobile = state.regData.ownMobile || state.regData.fatherMobile || '';

    // Persist newly registered member profile to Supabase PostgreSQL synchronously
    if (typeof supabaseUpsertProfile === 'function') {
        try {
            const upRes = await supabaseUpsertProfile(newProfile);
            if (upRes && upRes.id) {
                newProfile.id = upRes.id;
            }
            console.info('[Supabase] Profile registration synced live:', upRes);
        } catch (err) {
            console.warn('[Supabase] Profile registration sync notice:', err);
        }
    }

    // Keep PROFILES strictly updated
    window.PROFILES = window.PROFILES || [];
    const existPIdx = window.PROFILES.findIndex(p => p && (
        (newProfile.id && p.id == newProfile.id) ||
        (newProfile.email && p.email && p.email.toLowerCase().trim() === newProfile.email.toLowerCase().trim())
    ));
    if (existPIdx !== -1) {
        window.PROFILES[existPIdx] = { ...window.PROFILES[existPIdx], ...newProfile };
    } else {
        window.PROFILES.unshift(newProfile);
    }
    saveCommunityProfiles();

    // Sync current active user session with all 25+ fields
    state.currentUser = state.currentUser || {};
    state.currentUser.id = newProfile.id;
    state.currentUser.userId = String(newProfile.id);
    state.currentUser.profileId = newProfile.id;
    state.currentUser.profileComplete = true;
    state.currentUser.accountStatus = newProfile.accountStatus;
    state.currentUser.verifyStatus = newProfile.verifyStatus;
    state.currentUser.visible = newProfile.visible;
    state.currentUser.email = newProfile.email;
    state.currentUser.name = newProfile.name;
    state.currentUser.gender = isGirl ? 'Girl' : 'Boy';
    state.currentUser.caste = newProfile.community;
    state.currentUser.community = newProfile.community;
    state.currentUser.dob = newProfile.dob;
    state.currentUser.age = newProfile.age;
    state.currentUser.height = newProfile.height;
    state.currentUser.weight = newProfile.weight;
    state.currentUser.education = newProfile.education;
    state.currentUser.occupation = newProfile.occ;
    state.currentUser.occ = newProfile.occ;
    state.currentUser.income = newProfile.income;
    state.currentUser.marital = newProfile.marital;
    state.currentUser.physical = newProfile.physical;
    state.currentUser.hobbies = newProfile.hobbies;
    state.currentUser.father = newProfile.father;
    state.currentUser.fatherName = newProfile.father;
    state.currentUser.fatherOcc = newProfile.fatherOcc;
    state.currentUser.fatherMobile = newProfile.fatherMobile;
    state.currentUser.fatherWhatsapp = newProfile.fatherWhatsapp;
    state.currentUser.mother = newProfile.mother;
    state.currentUser.motherName = newProfile.mother;
    state.currentUser.motherOcc = newProfile.motherOcc;
    state.currentUser.sister = newProfile.sister;
    state.currentUser.brother = newProfile.brother;
    state.currentUser.city = newProfile.city;
    state.currentUser.village = newProfile.village;
    state.currentUser.taluka = newProfile.taluka;
    state.currentUser.district = newProfile.district;
    state.currentUser.address = newProfile.address;
    state.currentUser.fullAddress = newProfile.fullAddress;
    state.currentUser.full_address = newProfile.full_address;
    state.currentUser.mobile = newProfile.ownMobile || newProfile.mobile;
    state.currentUser.ownMobile = newProfile.ownMobile || newProfile.mobile;
    state.currentUser.img = newProfile.img;
    state.currentUser.photo = newProfile.img;
    state.currentUser.photos = newProfile.photos;
    state.currentUser.avatar_url = newProfile.img;
    state.currentUser.paymentStatus = isGirl ? 'Free' : (state.currentUser.paymentStatus || 'Unpaid');
    state.membershipPaid = isGirl || (state.currentUser.paymentStatus === 'Active' || state.currentUser.paymentStatus === 'paid');
    state.profileComplete = true;
    state.filters.caste = 'All'; // Default view shows all communities

    // Anti-Tamper: Seal cryptographic gender & payment signature immediately
    if (typeof computeSecureToken === 'function') {
        state.currentUser.genderToken = computeSecureToken('gender', state.currentUser.id, state.currentUser.email, state.currentUser.gender);
        if (state.currentUser.paymentStatus === 'Active' && state.currentUser.planExpiry) {
            state.currentUser.paymentToken = computeSecureToken('payment', state.currentUser.id, state.currentUser.email, state.currentUser.planExpiry);
        }
    }

    // Update users table in Supabase so profile_complete = true is recorded live
    if (typeof supabaseUpsertUser === 'function') {
        try {
            await supabaseUpsertUser({
                id: String(newProfile.id),
                email: newProfile.email,
                name: newProfile.name,
                gender: isGirl ? 'Girl' : 'Boy',
                caste: newProfile.community,
                mobile: newProfile.mobile,
                profileComplete: true,
                status: isAutoApproved ? 'Active' : 'Pending',
                paymentStatus: isGirl ? 'Free' : (state.currentUser.paymentStatus || 'Unpaid')
            });
        } catch (err) {
            console.warn('[Supabase] User profile completion sync notice:', err);
        }
    }

    // Persist completed profile status and all fields to stored accounts
    try {
        if (typeof getStoredAccounts === 'function' && typeof saveStoredAccounts === 'function') {
            const accounts = getStoredAccounts();
            const normEmail = (newProfile.email || state.currentUser?.email || state.regData?.email || '').toLowerCase().trim();
            const uIdx = accounts.findIndex(u => (normEmail && u.email && u.email.toLowerCase().trim() === normEmail) || (state.currentUser?.id && u.id === state.currentUser.id));
            if (uIdx !== -1) {
                accounts[uIdx].name = newProfile.name;
                accounts[uIdx].gender = isGirl ? 'Girl' : 'Boy';
                accounts[uIdx].caste = newProfile.community;
                accounts[uIdx].community = newProfile.community;
                accounts[uIdx].dob = newProfile.dob;
                accounts[uIdx].age = newProfile.age;
                accounts[uIdx].height = newProfile.height;
                accounts[uIdx].weight = newProfile.weight;
                accounts[uIdx].education = newProfile.education;
                accounts[uIdx].occupation = newProfile.occ;
                accounts[uIdx].occ = newProfile.occ;
                accounts[uIdx].income = newProfile.income;
                accounts[uIdx].marital = newProfile.marital;
                accounts[uIdx].physical = newProfile.physical;
                accounts[uIdx].hobbies = newProfile.hobbies;
                accounts[uIdx].father = newProfile.father;
                accounts[uIdx].fatherName = newProfile.father;
                accounts[uIdx].fatherOcc = newProfile.fatherOcc;
                accounts[uIdx].fatherMobile = newProfile.fatherMobile;
                accounts[uIdx].mother = newProfile.mother;
                accounts[uIdx].motherName = newProfile.mother;
                accounts[uIdx].motherOcc = newProfile.motherOcc;
                accounts[uIdx].sister = newProfile.sister;
                accounts[uIdx].brother = newProfile.brother;
                accounts[uIdx].mobile = newProfile.ownMobile || newProfile.mobile;
                accounts[uIdx].ownMobile = newProfile.ownMobile || newProfile.mobile;
                accounts[uIdx].city = newProfile.city;
                accounts[uIdx].village = newProfile.village;
                accounts[uIdx].taluka = newProfile.taluka;
                accounts[uIdx].district = newProfile.district;
                accounts[uIdx].address = newProfile.address;
                accounts[uIdx].fullAddress = newProfile.fullAddress;
                accounts[uIdx].img = newProfile.img;
                accounts[uIdx].photo = newProfile.img;
                accounts[uIdx].photos = newProfile.photos;
                accounts[uIdx].profileId = newProfile.id;
                accounts[uIdx].profileComplete = true;
                accounts[uIdx].genderToken = state.currentUser.genderToken;
                if (state.currentUser.paymentToken) accounts[uIdx].paymentToken = state.currentUser.paymentToken;
                if (isGirl) accounts[uIdx].paymentStatus = 'Free';
                saveStoredAccounts(accounts);
            }
        }
    } catch(e) {
        console.error('Failed to sync profileComplete to accounts store:', e);
    }

    saveCommunityProfiles();
    try {
        localStorage.setItem('mangalSetu_profileComplete', 'true');
        localStorage.setItem('mangalSetu_membershipPaid', JSON.stringify(isGirl));
        localStorage.setItem('mangalSetu_activeScreen', isGirl ? 'scr-home' : 'scr-membership');
        sessionStorage.setItem('mangalSetu_profileComplete', 'true');
        sessionStorage.setItem('mangalSetu_just_registered', 'true');
    } catch (_) {}
    if (typeof clearRegDraft === 'function') {
        clearRegDraft(newProfile.email);
    }
    saveSessionState();
    renderFilterCasteOptions();
    updateHeaderUserDisplay();

    if (isGirl) {
        state.history = ['scr-home'];
        renderHome();
        if (!isAutoApproved) {
            showToast('Profile registered! Admin review pending before public search activation.');
        }
        openModal('modalGirlComplete');
    } else {
        // Boy MUST pay ₹99 to see any girl profiles — redirect directly to scr-membership
        state.history = ['scr-membership'];
        go('scr-membership', true);
        if (!isAutoApproved) {
            showToast('Profile submitted! Admin review pending before public search activation.');
        }
        openModal('modalBoyComplete');
    }
}

var selectedUpiApp = 'Google Pay';
window.RAZORPAY_KEY_ID = window.RAZORPAY_KEY_ID || '';

function selectUpiApp(appName, el) {
    selectedUpiApp = appName;
    window.selectedUpiApp = appName;
    document.querySelectorAll('.upi-option').forEach(opt => {
        opt.style.borderColor = 'var(--border)';
        opt.style.background = '#fff';
        const ic = opt.querySelector('.upi-check');
        if (ic) {
            ic.className = 'fa-regular fa-circle upi-check';
            ic.style.color = 'var(--text-faint)';
        }
    });
    if (el) {
        el.style.borderColor = 'var(--primary)';
        el.style.background = 'var(--primary-light)';
        const ic = el.querySelector('.upi-check');
        if (ic) {
            ic.className = 'fa-solid fa-circle-check upi-check';
            ic.style.color = 'var(--primary)';
        }
    }
}
window.selectUpiApp = selectUpiApp;

function openRazorpayCheckout() {
    closeModal('modalPaywall');
    closeModal('modalBoyComplete');

    // If official Razorpay JS SDK is loaded and real Key is present
    if (typeof window.Razorpay === 'function' && window.RAZORPAY_KEY_ID && !window.RAZORPAY_KEY_ID.includes('demo')) {
        try {
            const user = (typeof state !== 'undefined' && state.currentUser) || {};
            const boyName = user.name || 'Community Member';
            const boyEmail = user.email || 'mangalsetu.in@gmail.com';
            const boyPhone = user.mobile ? user.mobile.replace(/[^0-9]/g, '').slice(-10) : '9726362863';

            const options = {
                key: window.RAZORPAY_KEY_ID,
                amount: 9900, // ₹99 in paise
                currency: 'INR',
                name: 'Mangal Setu',
                description: 'Boys 30-Day Membership Pass (₹99)',
                image: 'images/mangal_setu_logo.png',
                notes: {
                    service: '30-Day Matrimonial Directory Access Pass',
                    nature: 'Instant Digital Service (Non-refundable)',
                    disclaimer: 'Directory access only. Match/response not guaranteed.'
                },
                prefill: {
                    name: boyName,
                    email: boyEmail,
                    contact: boyPhone
                },
                theme: {
                    color: '#7B2CBF'
                },
                // CRITICAL: Strictly UPI ONLY - NO Card, NO Net Banking, NO Wallets
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: 'Pay via UPI',
                                instruments: [
                                    { method: 'upi' }
                                ]
                            }
                        },
                        sequence: ['block.upi'],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                method: {
                    netbanking: false,
                    card: false,
                    wallet: false,
                    emi: false,
                    paylater: false,
                    upi: true
                },
                handler: function(response) {
                    const txnId = response.razorpay_payment_id || ('RZP_UPI_' + Math.floor(10000 + Math.random() * 90000));
                    processSuccessfulPayment(txnId, 'UPI (Razorpay)');
                },
                modal: {
                    ondismiss: function() {
                        showToast('UPI Payment cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function(resp) {
                showToast('Payment failed: ' + (resp.error ? resp.error.description : 'Please try again with UPI'));
            });
            rzp.open();
            return;
        } catch (err) {
            console.warn('Razorpay SDK init failed, falling back to instant UPI modal:', err);
        }
    }

    // Default / Offline / Demo: Open the instant UPI modal
    openModal('modalRazorpayCheckout');
}

function processSuccessfulPayment(txnId, upiMethod) {
    if (typeof state === 'undefined' || !state.currentUser) return;

    state.currentUser.paymentStatus = 'Active';
    state.membershipPaid = true;
    state.profileComplete = true;
    state.currentUser.profileComplete = true;

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 30);
    state.currentUser.planStart = today.toISOString().split('T')[0];
    state.currentUser.planExpiry = expiry.toISOString().split('T')[0];

    // Cryptographic anti-tamper signature generation
    if (typeof computeSecureToken === 'function') {
        state.currentUser.paymentToken = computeSecureToken('payment', state.currentUser.id, state.currentUser.email, state.currentUser.planExpiry);
        state.currentUser.genderToken = computeSecureToken('gender', state.currentUser.id, state.currentUser.email, state.currentUser.gender || 'Boy');
    }
    state.currentUser.lastTxnId = txnId;

    // Auto-heal currentUser from window.PROFILES or state.regData if missing details
    if (typeof PROFILES !== 'undefined' && Array.isArray(PROFILES)) {
        const uEmail = (state.currentUser.email || '').trim().toLowerCase();
        const curId = state.currentUser.id || state.currentUser.profileId;
        const myProf = PROFILES.find(p => p && ((uEmail && p.email && p.email.trim().toLowerCase() === uEmail) || (curId && (p.id == curId || p.userId == curId))));
        if (myProf) {
            myProf.paymentStatus = 'paid';
            myProf.planStart = state.currentUser.planStart;
            myProf.planExpiry = state.currentUser.planExpiry;
            if (!state.currentUser.name || state.currentUser.name === 'Member') state.currentUser.name = myProf.name;
            if (!state.currentUser.gender) state.currentUser.gender = (myProf.gender === 'girls' || myProf.gender === 'Girl') ? 'Girl' : 'Boy';
            if (!state.currentUser.caste) state.currentUser.caste = myProf.community || myProf.caste;
            if (!state.currentUser.city) state.currentUser.city = myProf.city || myProf.village || '';
            if (!state.currentUser.district) state.currentUser.district = myProf.district || '';
            if (!state.currentUser.profileId) state.currentUser.profileId = myProf.id;
            if (typeof saveCommunityProfiles === 'function') saveCommunityProfiles();
        }
    }

    if (typeof state.regData !== 'undefined' && state.regData && state.regData.name) {
        if (!state.currentUser.name || state.currentUser.name === 'Member') state.currentUser.name = state.regData.name;
        if (!state.currentUser.gender) state.currentUser.gender = state.regData.gender || 'Boy';
        if (!state.currentUser.caste) state.currentUser.caste = state.regData.caste || '';
        if (!state.currentUser.city) state.currentUser.city = state.regData.city || '';
        if (!state.currentUser.district) state.currentUser.district = state.regData.district || '';
    }

    // Persist to stored accounts in localStorage
    if (typeof getStoredAccounts === 'function' && typeof saveStoredAccounts === 'function') {
        try {
            const accounts = getStoredAccounts();
            const normEmail = (state.currentUser.email || '').toLowerCase().trim();
            const idx = accounts.findIndex(u => (normEmail && u.email && u.email.toLowerCase().trim() === normEmail) || (state.currentUser.id && u.id == state.currentUser.id));
            if (idx !== -1) {
                accounts[idx].paymentStatus = 'Active';
                accounts[idx].planStart = state.currentUser.planStart;
                accounts[idx].planExpiry = state.currentUser.planExpiry;
                accounts[idx].paymentToken = state.currentUser.paymentToken;
                accounts[idx].genderToken = state.currentUser.genderToken;
                accounts[idx].profileComplete = true;
                if (state.currentUser.name && state.currentUser.name !== 'Member') accounts[idx].name = state.currentUser.name;
                if (state.currentUser.gender) accounts[idx].gender = state.currentUser.gender;
                if (state.currentUser.caste) accounts[idx].caste = state.currentUser.caste;
                saveStoredAccounts(accounts);
            }
        } catch (_) {}
    }

    if (typeof saveSessionState === 'function') saveSessionState();

    // 1. Record in LS_ADMIN_PAYMENTS for admin sync (100% UPI via Razorpay)
    try {
        const newTxn = {
            id: txnId || ('RZP_UPI_' + Math.floor(10000 + Math.random() * 90000)),
            userId: state.currentUser.id,
            userName: state.currentUser.name || 'Registered Member',
            plan: 'Boys 30 Days Pass (₹99)',
            amount: 99,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            method: upiMethod || ('UPI (' + (selectedUpiApp || 'UPI') + ')'),
            status: 'success'
        };

        // Record payment in Supabase PostgreSQL live
        if (typeof supabaseRecordPayment === 'function') {
            supabaseRecordPayment({
                id: newTxn.id,
                userId: state.currentUser.id,
                userName: state.currentUser.name,
                method: newTxn.method,
                amount: 99
            }).catch(err => console.warn('[Supabase] Payment record notice:', err));
        }

        // Sync active payment status to Supabase public.users & public.profiles
        if (typeof supabaseUpsertUser === 'function') {
            supabaseUpsertUser({
                id: String(state.currentUser.id),
                email: state.currentUser.email,
                name: state.currentUser.name,
                gender: state.currentUser.gender || 'Boy',
                caste: state.currentUser.caste,
                paymentStatus: 'Active',
                planStart: state.currentUser.planStart,
                planExpiry: state.currentUser.planExpiry,
                profileComplete: true
            }).catch(err => console.warn('[Supabase] Payment user status sync note:', err));
        }

        if (typeof supabaseUpsertProfile === 'function') {
            const curProfiles = (Array.isArray(window.PROFILES) ? window.PROFILES : (typeof PROFILES !== 'undefined' && Array.isArray(PROFILES) ? PROFILES : []));
            const myExistingProf = curProfiles.find(p => p && (p.id == state.currentUser.id || (p.email && p.email.toLowerCase() === (state.currentUser.email || '').toLowerCase())));
            const fullProfilePayload = {
                ...(myExistingProf || {}),
                id: state.currentUser.id,
                user_id: String(state.currentUser.id),
                email: state.currentUser.email,
                name: state.currentUser.name || (myExistingProf && myExistingProf.name) || '',
                gender: state.currentUser.gender || (myExistingProf && myExistingProf.gender) || 'boys',
                community: state.currentUser.caste || (myExistingProf && myExistingProf.community) || '',
                mobile: state.currentUser.mobile || (myExistingProf && myExistingProf.mobile) || '',
                img: state.currentUser.img || state.currentUser.photo || (myExistingProf && (myExistingProf.img || myExistingProf.photo)) || '',
                paymentStatus: 'paid',
                accountStatus: 'active',
                verifyStatus: 'approved',
                visible: true
            };
            if (myExistingProf) {
                myExistingProf.paymentStatus = 'paid';
                myExistingProf.accountStatus = 'active';
                myExistingProf.visible = true;
            }
            if (typeof saveCommunityProfiles === 'function') saveCommunityProfiles();
            if (typeof updateHomeStats === 'function') updateHomeStats();

            supabaseUpsertProfile(fullProfilePayload).then(() => {
                if (typeof triggerSilentProfilesSync === 'function') triggerSilentProfilesSync(0);
            }).catch(err => console.warn('[Supabase] Payment profile status sync note:', err));
        }
    } catch (e) {
        console.error('Payment sync error:', e);
    }

    // Close any blocking completion or paywall dialogs
    if (typeof closeModal === 'function') {
        closeModal('modalPaywall');
        closeModal('modalBoyComplete');
        closeModal('modalCompleteProfile');
        closeModal('modalRazorpayCheckout');
    }

    if (typeof updateMembershipScreen === 'function') updateMembershipScreen();
    openModal('modalPaySuccess');
    showToast('₹99 Paid Successfully via UPI! Account Activated 🎉');
}

function processMockPayment() {
    closeModal('modalRazorpayCheckout');

    // Only route to official Razorpay if a real live merchant key is configured
    if (window.RAZORPAY_KEY_ID && !window.RAZORPAY_KEY_ID.includes('demo') && window.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
        showToast('Connecting to Razorpay gateway...');
        if (typeof openRazorpayCheckout === 'function') {
            openRazorpayCheckout();
        }
        return;
    }

    const upiInput = document.getElementById('upiCustomVpaInput');
    const customVpa = upiInput ? upiInput.value.trim() : '';
    const methodStr = customVpa ? `UPI (${customVpa})` : `UPI (${selectedUpiApp || 'Google Pay'})`;

    showToast('Processing test payment via ' + methodStr + '...');
    setTimeout(() => {
        const txnId = 'DEMO_UPI_' + Math.floor(10000 + Math.random() * 90000);
        processSuccessfulPayment(txnId, methodStr);
    }, 600);
}

function activateDemoTestPass() {
    closeModal('modalPaywall');
    closeModal('modalBoyComplete');
    closeModal('modalRazorpayCheckout');

    if (typeof state === 'undefined' || !state.currentUser) {
        showToast('Please log in or register first');
        return;
    }

    const testTxnId = 'DEMO_TEST_' + Math.floor(10000 + Math.random() * 90000);
    processSuccessfulPayment(testTxnId, 'Testing Demo Pass (Free)');
    showToast('🧪 30-Day Testing Pass Activated! Full access unlocked 🎉');

    setTimeout(() => {
        if (typeof enterHome === 'function') {
            enterHome();
        } else if (typeof go === 'function') {
            go('scr-home');
        }
    }, 450);
}
window.activateDemoTestPass = activateDemoTestPass;

function resetDemoTestPass() {
    if (typeof state === 'undefined' || !state.currentUser) return;
    state.currentUser.paymentStatus = 'Unpaid';
    state.currentUser.planStart = null;
    state.currentUser.planExpiry = null;
    state.membershipPaid = false;
    delete state.currentUser.paymentToken;
    try {
        localStorage.setItem('mangalSetu_membershipPaid', 'false');
    } catch (_) {}
    if (typeof saveSessionState === 'function') saveSessionState();
    if (typeof updateMembershipScreen === 'function') updateMembershipScreen();
    showToast('Pass reset to Unpaid for testing.');
    if (typeof go === 'function') go('scr-membership');
}
window.resetDemoTestPass = resetDemoTestPass;

/* ============================================================ MEMBERSHIP SCREEN UPDATE ============================================================ */
function updateMembershipScreen() {
    const memWrap = document.querySelector('#scr-membership .membership-wrap');
    if (!memWrap || !state.currentUser) return;
    const isGirl = typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl');
    const passStatus = typeof checkBoyPassStatus === 'function'
        ? checkBoyPassStatus(state.currentUser)
        : { active: state.currentUser.paymentStatus === 'Active' || isGirl, reason: isGirl ? 'free_lifetime' : 'active' };

    const badgeEl = memWrap.querySelector('.badge-plan');
    const titleEl = memWrap.querySelector('.h-display');
    const subEl = memWrap.querySelector('.card div[style*="font-size:12px"]');
    const payBtn = document.getElementById('btnMembershipPayAction');
    const demoBtn = document.getElementById('btnDemoPassAction');

    if (isGirl) {
        if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-crown"></i> 100% LIFETIME FREE';
        if (titleEl) titleEl.textContent = 'Free Girl Membership';
        if (subEl) subEl.textContent = '100% Lifetime Free for all verified community girls — no payment required forever';
        if (payBtn) payBtn.style.display = 'none';
        if (demoBtn) demoBtn.style.display = 'none';
    } else if (passStatus.active) {
        if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-crown"></i> 30 DAYS PASS';
        if (titleEl) titleEl.textContent = 'Active 30-Day Pass';
        if (subEl) {
            subEl.textContent = `${passStatus.daysLeft} Days Remaining (Valid until ${state.currentUser.planExpiry || 'Active'}) · Unlimited Full Access`;
        }
        if (payBtn) payBtn.style.display = 'none';
        if (demoBtn) demoBtn.style.display = 'none';
    } else if (passStatus.reason === 'expired') {
        if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> PASS EXPIRED';
        if (titleEl) titleEl.textContent = 'Membership Expired';
        if (subEl) {
            subEl.textContent = `Your 30-Day Pass expired on ${state.currentUser.planExpiry || 'recently'}. Pay ₹99 via UPI to renew full access.`;
        }
        if (payBtn) {
            payBtn.style.display = 'flex';
            payBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Renew 30-Day Pass (₹99 via UPI)';
        }
        if (demoBtn) demoBtn.style.display = 'flex';
    } else {
        if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-lock"></i> ₹99 PASS REQUIRED';
        if (titleEl) titleEl.textContent = 'Payment Required';
        if (subEl) {
            subEl.textContent = '₹99 access pass required to unlock full profile details and father contact';
        }
        if (payBtn) {
            payBtn.style.display = 'flex';
            payBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Pay ₹99 via UPI (30 Days Pass)';
        }
        if (demoBtn) demoBtn.style.display = 'flex';
    }
}

/* ============================================================ PHOTO CAROUSEL MODAL (2-3 PHOTOS) ============================================================ */
let currentCarouselPhotos = [];
let currentCarouselIdx = 0;

function openPhotoCarousel(profileId, event) {
    if (event) event.stopPropagation();
    const p = (typeof findProfile === 'function') ? findProfile(profileId) : (window.PROFILES || []).find(x => x.id === profileId || String(x.id) === String(profileId));
    if (!p) return;
    const isProfileGirl = typeof isGirlGender === 'function' ? isGirlGender(p.gender) : (p.gender === 'girls' || p.gender === 'Girl');
    const fallbackImg = isProfileGirl ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';

    let photos = (p.photos && p.photos.length > 0) ? p.photos.filter(Boolean) : [p.img || p.photo].filter(Boolean);
    if (!photos || photos.length === 0) {
        photos = [fallbackImg];
    }

    currentCarouselPhotos = photos;
    currentCarouselIdx = 0;

    const imgEl = document.getElementById('carouselImg') || document.getElementById('photoCarouselImg');
    const countEl = document.getElementById('carouselCounter') || document.getElementById('photoCarouselCount');
    const dotsWrap = document.getElementById('carouselDots') || document.getElementById('photoCarouselDots');

    if (imgEl) {
        imgEl.src = photos[0];
        imgEl.onerror = function() {
            this.onerror = null;
            this.src = fallbackImg;
        };
    }
    if (countEl) countEl.textContent = `1 / ${photos.length}`;
    if (dotsWrap) {
        dotsWrap.innerHTML = photos.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="selectCarouselPhoto(${i})"></span>`).join('');
    }

    const prevBtn = document.querySelector('.carousel-btn.prev') || document.getElementById('photoCarouselPrev');
    const nextBtn = document.querySelector('.carousel-btn.next') || document.getElementById('photoCarouselNext');
    if (prevBtn) prevBtn.style.display = photos.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = photos.length > 1 ? 'flex' : 'none';

    openModal('modalPhotoCarousel');
}

function nextCarouselPhoto(e) {
    if (e) e.stopPropagation();
    if (!currentCarouselPhotos.length) return;
    currentCarouselIdx = (currentCarouselIdx + 1) % currentCarouselPhotos.length;
    updateCarouselView();
}

function prevCarouselPhoto(e) {
    if (e) e.stopPropagation();
    if (!currentCarouselPhotos.length) return;
    currentCarouselIdx = (currentCarouselIdx - 1 + currentCarouselPhotos.length) % currentCarouselPhotos.length;
    updateCarouselView();
}

function updateCarouselView() {
    const imgEl = document.getElementById('carouselImg') || document.getElementById('photoCarouselImg');
    const countEl = document.getElementById('carouselCounter') || document.getElementById('photoCarouselCount');
    const dotsWrap = document.getElementById('carouselDots') || document.getElementById('photoCarouselDots');

    if (imgEl && currentCarouselPhotos[currentCarouselIdx]) {
        imgEl.src = currentCarouselPhotos[currentCarouselIdx];
    }
    if (countEl) countEl.textContent = `${currentCarouselIdx + 1} / ${currentCarouselPhotos.length}`;
    if (dotsWrap) {
        const dots = dotsWrap.querySelectorAll('.carousel-dot, .pdot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentCarouselIdx));
    }
}

function selectCarouselPhoto(idx) {
    if (idx >= 0 && idx < currentCarouselPhotos.length) {
        currentCarouselIdx = idx;
        updateCarouselView();
    }
}

function closePhotoCarousel() {
    const el = document.getElementById('modalPhotoCarousel');
    if (el) el.classList.remove('open');
    document.body.style.overflow = '';
}

function closeCarouselOnBackdrop(e) {
    if (e.target.id === 'modalPhotoCarousel') {
        closePhotoCarousel();
    }
}

window.addEventListener('keydown', (e) => {
    const carousel = document.getElementById('modalPhotoCarousel');
    if (carousel && carousel.classList.contains('open')) {
        if (e.key === 'ArrowLeft') prevCarouselPhoto();
        else if (e.key === 'ArrowRight') nextCarouselPhoto();
        else if (e.key === 'Escape') closePhotoCarousel();
    }
});


/* ============================================================ FULL PROFILE ACTIONS ============================================================ */
function setInterestBtnState(btn, pid) {
    if (!btn) return;
    const profileId = Number(pid);
    btn.dataset.pid = profileId;

    const status = (typeof interestStatusFor === 'function') 
        ? interestStatusFor(profileId) 
        : (typeof getEffectiveInterestStatus === 'function' ? getEffectiveInterestStatus(profileId) : null);

    btn.classList.remove('btn-sent', 'btn-accepted');
    btn.removeAttribute('disabled');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';

    if (status === 'accepted') {
        btn.classList.add('btn-accepted');
        btn.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Message (Text Only)';
        btn.className = 'btn btn-primary btn-grow';
        btn.onclick = () => openChatFor(profileId);
        return;
    }
    if (status === 'pending') {
        btn.classList.add('btn-sent');
        btn.innerHTML = '<i class="fa-solid fa-clock"></i> Request sent';
        btn.className = 'btn btn-outline btn-grow';
        btn.onclick = () => showToast('Interest request already sent. Waiting for acceptance.');
        btn.disabled = true;
        return;
    }
    if (status === 'declined') {
        btn.innerHTML = '<i class="fa-solid fa-ban"></i> Request declined';
        btn.className = 'btn btn-outline btn-grow';
        btn.onclick = () => showToast('This request was declined.');
        btn.disabled = true;
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> I\'m interested';
    btn.className = 'btn btn-gold btn-grow';
    btn.disabled = false;
    btn.onclick = () => openInterestModal(profileId);
}

function sendInterest(id) {
    if (typeof isSelfProfile === 'function' && isSelfProfile(id)) {
        if (typeof showToast === 'function') showToast('You cannot send interest to your own profile');
        return;
    }
    if (typeof getDailyInterestUsage === 'function') {
        const usage = getDailyInterestUsage();
        if (usage && usage.isLimitReached) {
            if (typeof showToast === 'function') {
                showToast('Daily limit reached! Your daily credit of 5 interest requests is finished for today. You can send 5 more interest requests after 24 hours (tomorrow).');
            }
            return;
        }
    }
    if (typeof openInterestModal === 'function') {
        openInterestModal(id);
    }
}
window.sendInterest = sendInterest;

function renderFatherContactSection(p) {
    if (!p) return '';
    const curUser = state.currentUser;
    const isSelf = curUser && (
        (curUser.id && (curUser.id === p.id || curUser.id === p.userId)) ||
        (curUser.email && p.email && curUser.email.trim().toLowerCase() === p.email.trim().toLowerCase())
    );
    const isAdmin = (typeof isSessionValidSync === 'function' && isSessionValidSync()) || 
                    (typeof window !== 'undefined' && window.location.pathname.includes('admin'));

    const interestStatus = typeof interestStatusFor === 'function' ? interestStatusFor(p.id) : null;
    const isAccepted = interestStatus === 'accepted';
    const isContactUnlocked = isSelf || isAdmin || isAccepted;

    if (isSelf) {
        return `
        <div id="profileFatherContactWrap">
            <div class="section-label"><i class="fa-solid fa-user-shield" style="color:var(--primary);"></i> Father's Contact (Your Profile)</div>
            <div class="contact-unlocked-banner" style="background:var(--primary-light);border:1.5px solid rgba(123,44,191,0.2);border-radius:14px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
                <i class="fa-solid fa-eye" style="font-size:16px;color:var(--primary);"></i>
                <div style="font-size:12.5px;color:var(--primary-dark);line-height:1.45;">
                    <b>Your Verified Family Contact:</b> ${escapeHtml(p.fatherMobile || p.father_mobile || 'Configured')} (Protected — visible to others only upon accepted interest).
                </div>
            </div>
        </div>`;
    }

    if (isContactUnlocked) {
        const phone = p.fatherMobile || p.father_mobile || '';
        return `
        <div id="profileFatherContactWrap">
            <div class="section-label" style="display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-circle-check" style="color:var(--success);"></i>
                <span>Father's Contact (Unlocked)</span>
            </div>
            <div class="contact-unlocked-banner">
                <i class="fa-solid fa-shield-heart" style="font-size:18px;color:#1D7A44;flex-shrink:0;"></i>
                <div style="font-size:12.5px;color:#065F46;line-height:1.45;">
                    <b>Interest Accepted!</b> Matrimonial connection with ${escapeHtml(p.name)}'s family is verified. Direct WhatsApp &amp; Call options are unlocked below.
                </div>
            </div>
            <div class="contact-btn-row">
                <button class="contact-btn wa" onclick="quickWhatsApp('${phone}','${escapeHtml(p.name)}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp Father</button>
                <button class="contact-btn call" onclick="quickCall('${phone}')"><i class="fa-solid fa-phone"></i> Call Father</button>
            </div>
        </div>`;
    }

    // LOCKED STATE (Interest not sent or pending or declined)
    return `
    <div id="profileFatherContactWrap">
        <div class="section-label" style="display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-lock" style="color:var(--accent-deep);"></i>
            <span>Father's Contact (Protected)</span>
        </div>
        <div class="contact-locked-box">
            <div style="display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:800;color:#78350F;margin-bottom:6px;">
                <i class="fa-solid fa-user-shield" style="font-size:16px;color:var(--accent-deep);"></i>
                <span>Direct Family Contact Protected</span>
            </div>
            <p style="font-size:12.5px;color:#78350F;line-height:1.55;margin:0 0 10px 0;">
                To safeguard family privacy and prevent unsolicited calls, direct WhatsApp &amp; Call buttons <b>unlock automatically only after ${escapeHtml(p.name)} accepts your Interest Request</b>.
            </p>
            <div style="background:#F8F5FD;border:1px dashed var(--primary);border-radius:10px;padding:10px 12px;font-size:12px;color:#3E384C;line-height:1.5;">
                <i class="fa-solid fa-language" style="color:var(--primary);margin-right:4px;"></i> <b>સુરક્ષા સ્પષ્ટતા:</b> પરિવાર અને દીકરીઓની સુરક્ષા માટે પિતાનો નંબર ગુપ્ત રાખવામાં આવ્યો છે. સામેવાળી વ્યક્તિ તમારી <b>"I'm interested"</b> રિક્વેસ્ટ સ્વીકારશે (Accept કરશે) ત્યારે જ વોટ્સએપ અને કોલ બટન આપમેળે અનલોક થશે.
            </div>
        </div>
    </div>`;
}
window.renderFatherContactSection = renderFatherContactSection;

function openProfile(id) {
    if (!state.currentUser || !state.currentUser.email) {
        showToast('Please log in or register to view profiles');
        if (typeof go === 'function') go('scr-welcome', true);
        return;
    }
    if (!state.profileComplete) { openModal('modalCompleteProfile'); return; }

    const p = (typeof findProfile === 'function') ? findProfile(id) : (PROFILES || []).find(x => x.id === id || String(x.id) === String(id) || Number(x.id) === Number(id));
    if (!p) {
        showToast('Profile not found');
        return;
    }

    if (typeof isSelfProfile === 'function' && isSelfProfile(p)) {
        if (typeof go === 'function') go('scr-profile');
        return;
    }

    if (p.visible === false || p.visible === 'false') {
        showToast('This profile is currently hidden from search.');
        return;
    }

    // Strict Gender Isolation Rule:
    // A boy can NEVER open/view another boy's profile!
    // A girl can NEVER open/view another girl's profile!
    const isProfileGirl = typeof isGirlGender === 'function' ? isGirlGender(p.gender) : (p.gender === 'girls' || p.gender === 'Girl');
    const isProfileBoy = typeof isBoyGender === 'function' ? isBoyGender(p.gender) : (p.gender === 'boys' || p.gender === 'Boy');

    const isUserBoy = state.currentUser && (typeof isBoyGender === 'function' ? isBoyGender(state.currentUser.gender) : (state.currentUser.gender === 'Boy' || state.currentUser.gender === 'boy'));
    const isUserGirl = state.currentUser && (typeof isGirlGender === 'function' ? isGirlGender(state.currentUser.gender) : (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl'));

    if (isUserBoy && isProfileBoy) {
        showToast('You can only view profiles of eligible brides (girls).');
        if (typeof go === 'function') go('scr-home');
        return;
    }
    if (isUserGirl && isProfileGirl) {
        showToast('You can only view profiles of eligible grooms (boys).');
        if (typeof go === 'function') go('scr-home');
        return;
    }
    
    // Strict Boy Paywall Protection: NEVER open girl profile for an unpaid boy
    let passCheck = null;
    const isBoy = isUserBoy;
    if (isBoy) {
        passCheck = typeof checkBoyPassStatus === 'function' 
            ? checkBoyPassStatus(state.currentUser) 
            : { active: state.currentUser.paymentStatus === 'Active' };
        if (!passCheck.active) {
            go('scr-membership', true);
            openModal('modalPaywall');
            showToast('Boys ₹99 Pass required: Pay via UPI to view full profile details.');
            return;
        }
    }

    state.activeProfileId = p.id;
    window.currentViewingProfileId = p.id;
    saveSessionState();
    const isFav = state.favorites.has(p.id);
    const photos = (p.photos && p.photos.length > 0) ? p.photos.filter(Boolean) : [p.img || p.photo].filter(Boolean);
    const fallbackImg = isProfileGirl ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
    const mainImg = photos[0] || p.img || p.photo || fallbackImg;
    const hasMultiple = photos.length > 1;

    const el = document.getElementById('profileContent');
    if (!el) return;

    el.innerHTML = `
        <div class="full-hero" style="cursor:pointer;" onclick="openPhotoCarousel(${p.id}, event)">
            <img src="${mainImg}" alt="${escapeHtml(p.name || 'Profile')}" onerror="this.onerror=null;this.src='${fallbackImg}';">
            <div class="grad"></div>
            <div class="fh-top">
                <button class="icon-btn" onclick="event.stopPropagation();goBack()"><i class="fa-solid fa-arrow-left"></i></button>
                <button class="icon-btn" id="fullFavBtn" onclick="event.stopPropagation();toggleFullFav(${p.id})" style="color:${isFav ? '#D64545' : 'var(--primary)'};"><i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
            </div>
            <div class="fh-bottom">
                <div class="fname">${escapeHtml(p.name || '')}, ${p.age}</div>
                <div class="floc"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.city || p.village || '')}</div>
                <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
                    <div class="verified-tag"><i class="fa-solid fa-shield-check"></i> Verified profile</div>
                    ${hasMultiple ? `<span class="pcount-chip" style="position:static;cursor:pointer;" onclick="event.stopPropagation();openPhotoCarousel(${p.id}, event)"><i class="fa-solid fa-camera"></i> ${photos.length} Photos</span>` : ''}
                </div>
            </div>
        </div>
        <div class="screen-pad no-tab">
            <div class="section-label" style="margin-top:6px;">Personal details</div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-cake-candles"></i> Age</div><div class="dval">${p.age} Years</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-ruler-vertical"></i> Height</div><div class="dval">${escapeHtml(p.height || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-weight-scale"></i> Weight</div><div class="dval">${escapeHtml(p.weight || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-ring"></i> Marital status</div><div class="dval">${escapeHtml(p.marital || 'Unmarried')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person"></i> Physical status</div><div class="dval">${escapeHtml(p.physical || 'Normal')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Occupation</div><div class="dval">${escapeHtml(p.occ || p.occupation || 'Professional')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-graduation-cap"></i> Education</div><div class="dval">${escapeHtml(p.education || 'Graduate')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-sack-dollar"></i> Monthly income</div><div class="dval">${escapeHtml(p.income || 'Confidential')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-users"></i> Community</div><div class="dval">${escapeHtml(p.community || p.caste || '')}</div></div>
            ${(function() {
                let list = [];
                if (Array.isArray(p.hobbies)) {
                    list = p.hobbies.map(h => String(h || '').trim()).filter(h => h.length > 0 && h.toLowerCase() !== 'none' && h !== '—');
                } else if (typeof p.hobbies === 'string' && p.hobbies.trim()) {
                    const trimmed = p.hobbies.trim();
                    if (trimmed.toLowerCase() !== 'none' && trimmed !== '—') {
                        list = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (!list || list.length === 0) {
                    return `
                    <div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:6px;padding:10px 0;">
                        <div class="dlabel"><i class="fa-solid fa-icons" style="color:var(--primary);"></i> Hobbies</div>
                        <div style="font-size:13px;color:var(--text-muted);font-style:italic;margin-top:2px;">No hobbies listed</div>
                    </div>`;
                }
                const chipsHtml = typeof renderHobbiesHtml === 'function' ? renderHobbiesHtml(list) : list.map(h => `<span class="chip">${escapeHtml(h)}</span>`).join('');
                if (!chipsHtml) {
                    return `
                    <div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:6px;padding:10px 0;">
                        <div class="dlabel"><i class="fa-solid fa-icons" style="color:var(--primary);"></i> Hobbies</div>
                        <div style="font-size:13px;color:var(--text-muted);font-style:italic;margin-top:2px;">No hobbies listed</div>
                    </div>`;
                }
                return `
                <div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:12px 0;">
                    <div class="dlabel"><i class="fa-solid fa-icons" style="color:var(--primary);"></i> Hobbies</div>
                    <div class="chip-row" style="margin-top:2px;">${chipsHtml}</div>
                </div>`;
            })()}

            <div class="section-label">Family details</div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-user-tie"></i> Father</div><div class="dval">${escapeHtml(p.father || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Occupation</div><div class="dval">${escapeHtml(p.fatherOcc || p.father_occ || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person-dress"></i> Mother</div><div class="dval">${escapeHtml(p.mother || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-briefcase"></i> Occupation</div><div class="dval">${escapeHtml(p.motherOcc || p.mother_occ || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person"></i> Sister</div><div class="dval">${escapeHtml(p.sister || '—')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-person"></i> Brother</div><div class="dval">${escapeHtml(p.brother || '—')}</div></div>

            <div class="section-label">Location</div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-location-dot"></i> Village / City</div><div class="dval">${escapeHtml(p.village || p.city || '')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-map"></i> Taluka</div><div class="dval">${escapeHtml(p.taluka || '')}</div></div>
            <div class="detail-row"><div class="dlabel"><i class="fa-solid fa-map-location-dot"></i> District</div><div class="dval">${escapeHtml(p.district || '')}</div></div>
            <div class="detail-row" style="align-items:flex-start;"><div class="dlabel"><i class="fa-solid fa-house"></i> Full address</div><div class="dval" style="text-align:right;max-width:60%;">${escapeHtml(p.fullAddress || p.address || `${p.village || p.city}, Taluka ${p.taluka}, Dist. ${p.district}`)}</div></div>

            ${renderFatherContactSection(p)}

            <div class="section-label">Interested?</div>
            <p class="p-muted" style="margin-top:-8px;margin-bottom:12px;">Send an interest request — if accepted, chat unlocks directly.</p>
            <button class="btn btn-gold" id="fullInterestBtn" data-pid="${p.id}"><i class="fa-solid fa-heart-circle-check"></i> I'm interested</button>

            <button class="btn btn-ghost" style="margin-top:22px;color:var(--error);" onclick="openQuickReport(${p.id})"><i class="fa-solid fa-flag"></i> Report this profile</button>
        </div>`;

    go('scr-profile');
    const interestBtn = document.getElementById('fullInterestBtn');
    setInterestBtnState(interestBtn, p.id);

    // Authorized On-Demand Contact Reveal:
    // Only fetch real unmasked contact if Interest is ACCEPTED, or viewer is self/admin!
    const interestStatus = typeof interestStatusFor === 'function' ? interestStatusFor(p.id) : null;
    const isContactUnlocked = isSelf || (interestStatus === 'accepted') || ((typeof isSessionValidSync === 'function' && isSessionValidSync()));
    if (isContactUnlocked && typeof supabaseFetchAuthorizedContact === 'function') {
        supabaseFetchAuthorizedContact(p.id).then(contact => {
            if (contact && contact.fatherMobile && !contact.fatherMobile.includes('•••')) {
                p.fatherMobile = contact.fatherMobile;
                p.father_mobile = contact.fatherMobile;
                if (contact.ownMobile) p.ownMobile = contact.ownMobile;
                if (contact.email) p.email = contact.email;
                if (contact.fullAddress) {
                    p.fullAddress = contact.fullAddress;
                    const addrEl = document.querySelector('#scr-profile .detail-row [style*="max-width:60%"]');
                    if (addrEl) addrEl.textContent = contact.fullAddress;
                }
                const wrap = document.getElementById('profileFatherContactWrap');
                if (wrap && typeof renderFatherContactSection === 'function') {
                    wrap.outerHTML = renderFatherContactSection(p);
                }
            }
        }).catch(err => console.warn('[Security Guard] Authorized contact note:', err));
    }
}

function toggleFullFav(id) {
    const btn = document.getElementById('fullFavBtn');
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
        if (btn) {
            btn.style.color = 'var(--primary)';
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-regular fa-heart';
        }
        showToast('Removed from favorites');
    } else {
        state.favorites.add(id);
        if (btn) {
            btn.style.color = '#D64545';
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-heart';
        }
        showToast('Added to favorites');
    }
    if (typeof syncFavoritesToDatabase === 'function') {
        syncFavoritesToDatabase();
    }
}
function openContact() { openModal('modalContact'); }

/* ============================================================ REPORT ============================================================ */
function pickReport(el) {
    document.querySelectorAll('#reportOpts .report-opt').forEach(r => r.classList.remove('active'));
    el.classList.add('active');
    state.reportPicked = true;
}
async function submitReport() {
    if (!state.reportPicked) { showToast('Please select a reason'); return; }
    const activeOpt = document.querySelector('#reportOpts .report-opt.active span');
    const reason = activeOpt ? activeOpt.textContent.trim() : 'Inappropriate content';
    const detailsEl = document.getElementById('reportScreenDetails');
    const details = detailsEl ? detailsEl.value.trim() : '';

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
        details: details || 'Submitted via in-app report screen.',
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

    if (detailsEl) detailsEl.value = '';
    document.querySelectorAll('#reportOpts .report-opt').forEach(r => r.classList.remove('active'));
    state.reportPicked = false;

    showToast('Report submitted to admin team — thank you');
    setTimeout(() => goBack(), 500);
}


/* ============================================================ DELETE ACCOUNT ============================================================ */
function openDeleteAccountModal() {
    const emailInput = document.getElementById('deleteAccountEmail');
    if (emailInput) {
        const userEmail = (state.currentUser && state.currentUser.email) ||
            (state.regData && state.regData.email) || '';
        emailInput.value = userEmail;
    }
    const pwInput = document.getElementById('deleteAccountPassword');
    if (pwInput) {
        pwInput.value = '';
        pwInput.type = 'password';
    }
    const eyeIcon = document.querySelector('#modalDeleteAccount .pw-eye i');
    if (eyeIcon) {
        eyeIcon.className = 'fa-solid fa-eye';
    }
    openModal('modalDeleteAccount');
}

async function confirmDeleteAccount() {
    const pwInput = document.getElementById('deleteAccountPassword');
    const pw = pwInput ? pwInput.value.trim() : '';
    if (!pw) {
        showToast('Please enter your password to confirm account deletion');
        if (pwInput) pwInput.focus();
        return;
    }
    if (pw.length < 4) {
        showToast('Password is incorrect or too short');
        if (pwInput) pwInput.focus();
        return;
    }

    const currentUser = state.currentUser;
    if (!currentUser || !currentUser.email) {
        closeModal('modalDeleteAccount');
        go('scr-welcome', true);
        return;
    }

    // Verify entered password against account hash
    if (typeof hashPass === 'function' && typeof getStoredAccounts === 'function') {
        const passHash = await hashPass(pw);
        const legacyHash = (typeof hashPassLegacy === 'function') ? await hashPassLegacy(pw) : '';
        const accounts = getStoredAccounts();
        const acc = accounts.find(a => a.email && a.email.toLowerCase() === currentUser.email.toLowerCase());

        if (acc && acc.passwordHash) {
            const isValid = (acc.passwordHash === passHash) || (acc.passwordHash === legacyHash);
            if (!isValid) {
                showToast('Incorrect password! Please enter your valid password.');
                if (pwInput) {
                    pwInput.value = '';
                    pwInput.focus();
                }
                return;
            }
        }
    }

    closeModal('modalDeleteAccount');
    if (pwInput) pwInput.value = '';
    showGlobalLoader('Deleting account permanently from Supabase, Cloudinary & Cloud...');

    const emailToDelete = currentUser.email || state.regData?.email || '';
    const idToDelete = currentUser.id || '';
    const userIdToDelete = currentUser.userId || state.regData?.userId || state.regData?.id || '';

    // 1. Delete permanently from Supabase & Cloudinary CDN
    if (typeof supabaseDeleteUserCompletely === 'function') {
        try {
            await supabaseDeleteUserCompletely(currentUser, emailToDelete, userIdToDelete || idToDelete, { isSelfDelete: true });
        } catch(e) {
            console.warn('[Delete] Supabase delete note:', e);
        }
    }

    // 2. Completely purge all local storage caches, chats, and active state
    if (typeof purgeUserAccountLocally === 'function') {
        purgeUserAccountLocally(emailToDelete, idToDelete || userIdToDelete);
    }
    if (typeof updateHomeStats === 'function') {
        updateHomeStats();
    }
    state.currentUser = null;
    state.profileComplete = false;
    state.membershipPaid = false;
    state.regData = {};
    if (state.favorites) state.favorites.clear();
    sessionStorage.clear();
    localStorage.removeItem('LS_ACTIVE_USER');
    localStorage.removeItem('mangalSetu_user');
    state.history = ['scr-welcome'];

    if (typeof resetRegistrationStateAndInputs === 'function') {
        resetRegistrationStateAndInputs();
    }
    if (typeof closeAllModals === 'function') {
        closeAllModals();
    }

    if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    showToast('Your account, chat, and profile details have been permanently deleted.');
    go('scr-welcome', true);
}

function openPaymentHistoryModal() {
    const listEl = document.getElementById('paymentHistoryList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const isGirl = state.currentUser && (state.currentUser.gender === 'Girl' || state.currentUser.gender === 'girl');

    if (isGirl) {
        listEl.innerHTML = `
            <div style="background:var(--success-bg,#ECFDF5);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:24px;margin-bottom:6px;">🎉</div>
                <div style="font-weight:700;font-size:15px;color:var(--success,#059669);margin-bottom:4px;">100% Lifetime Free Membership</div>
                <p style="font-size:12px;color:var(--text-muted,#666);margin:0;line-height:1.5;">
                    Community brides enjoy lifetime complimentary access to search, browse, and connect. No payment required.
                </p>
            </div>
        `;
    } else {
        const userEmail = state.currentUser?.email?.toLowerCase().trim();
        const userId = state.currentUser?.id;
        let payments = [];
        try {
            const allPayments = JSON.parse(localStorage.getItem('LS_ADMIN_PAYMENTS') || '[]');
            payments = allPayments.filter(p => 
                (userId && p.userId === userId) ||
                (userEmail && p.userEmail && p.userEmail.toLowerCase().trim() === userEmail) ||
                (state.currentUser?.name && p.userName && p.userName.toLowerCase() === state.currentUser.name.toLowerCase())
            );
        } catch(e) {}

        if (payments.length === 0) {
            const passCheck = (typeof checkBoyPassStatus === 'function' && state.currentUser) 
                ? checkBoyPassStatus(state.currentUser) 
                : { active: false };

            listEl.innerHTML = `
                <div style="background:var(--surface-sunken,#f9fafb);border:1px dashed var(--border,#e5e7eb);border-radius:12px;padding:20px 16px;text-align:center;">
                    <i class="fa-solid fa-receipt" style="font-size:28px;color:var(--text-faint,#9ca3af);margin-bottom:8px;"></i>
                    <div style="font-weight:700;font-size:14px;color:var(--text,#333);margin-bottom:4px;">No Transactions Yet</div>
                    <p style="font-size:12px;color:var(--text-muted,#666);margin:0;line-height:1.5;">
                        ${passCheck.active ? 'Your pass is currently active.' : 'Pay ₹99 via UPI to activate your 30-Day Full Access Pass.'}
                    </p>
                </div>
            `;
        } else {
            payments.forEach(p => {
                const item = document.createElement('div');
                item.style.cssText = 'background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);border-radius:12px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.04);';
                item.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:rgba(16,185,129,0.12);color:var(--success,#059669);display:flex;align-items:center;justify-content:center;font-size:16px;">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:13.5px;color:var(--text,#111);">${escapeHtml(p.plan || 'Boys 30 Days Pass')}</div>
                            <div style="font-size:11px;color:var(--text-muted,#777);margin-top:2px;">${escapeHtml(p.date || '')} ${escapeHtml(p.time || '')} · <span style="color:var(--primary);">${escapeHtml(p.method || 'UPI')}</span></div>
                            <div style="font-size:10.5px;color:var(--text-faint,#999);margin-top:1px;">ID: ${escapeHtml(p.id || '')}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800;font-size:15px;color:var(--text,#111);">₹${p.amount || 99}</div>
                        <span style="font-size:10.5px;font-weight:700;color:#059669;background:#ECFDF5;padding:2px 7px;border-radius:6px;display:inline-block;margin-top:2px;">PAID</span>
                    </div>
                `;
                listEl.appendChild(item);
            });
        }
    }

    if (typeof openModal === 'function') openModal('modalPaymentHistory');
}

// Global Window Exports
if (typeof openProfile !== 'undefined') window.openProfile = openProfile;
if (typeof populateEditProfile !== 'undefined') window.populateEditProfile = populateEditProfile;
if (typeof updateMembershipScreen !== 'undefined') window.updateMembershipScreen = updateMembershipScreen;
if (typeof submitProfileCompletion !== 'undefined') window.submitProfileCompletion = submitProfileCompletion;
if (typeof openRazorpayCheckout !== 'undefined') window.openRazorpayCheckout = openRazorpayCheckout;
if (typeof openPaymentHistoryModal !== 'undefined') window.openPaymentHistoryModal = openPaymentHistoryModal;
if (typeof openPhotoCarousel !== 'undefined') window.openPhotoCarousel = openPhotoCarousel;
if (typeof closePhotoCarousel !== 'undefined') window.closePhotoCarousel = closePhotoCarousel;
if (typeof nextCarouselPhoto !== 'undefined') window.nextCarouselPhoto = nextCarouselPhoto;
if (typeof prevCarouselPhoto !== 'undefined') window.prevCarouselPhoto = prevCarouselPhoto;
if (typeof selectCarouselPhoto !== 'undefined') window.selectCarouselPhoto = selectCarouselPhoto;
if (typeof setInterestBtnState !== 'undefined') window.setInterestBtnState = setInterestBtnState;
if (typeof sendInterest !== 'undefined') window.sendInterest = sendInterest;

function refreshProfileContactState(profileId) {
    const pid = Number(profileId);
    if (state.activeProfileId && Number(state.activeProfileId) === pid) {
        const p = (typeof findProfile === 'function') ? findProfile(pid) : null;
        if (p) {
            const wrap = document.getElementById('profileFatherContactWrap');
            if (wrap && typeof renderFatherContactSection === 'function') {
                wrap.outerHTML = renderFatherContactSection(p);
            }
            if (typeof supabaseFetchAuthorizedContact === 'function') {
                supabaseFetchAuthorizedContact(p.id).then(contact => {
                    if (contact && contact.fatherMobile && !contact.fatherMobile.includes('•••')) {
                        p.fatherMobile = contact.fatherMobile;
                        p.father_mobile = contact.fatherMobile;
                        const updatedWrap = document.getElementById('profileFatherContactWrap');
                        if (updatedWrap && typeof renderFatherContactSection === 'function') {
                            updatedWrap.outerHTML = renderFatherContactSection(p);
                        }
                    }
                }).catch(() => {});
            }
        }
    }
}
window.refreshProfileContactState = refreshProfileContactState;

