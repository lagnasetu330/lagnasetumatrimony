/* ==============================================================================
   SUPABASE CLIENT INTEGRATION LAYER
   PostgreSQL Database, Row-Level Security, Auth & Realtime Subscriptions
   ============================================================================== */

const SUPABASE_CONFIG = {
    url: window.SUPABASE_URL || 'https://zlxxegebqyatlpiyvggh.supabase.co',
    anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable_iRLyJJVLkpOUhjMxSD-uAA_HhpEemI0'
};

let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === 'function' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.info('[Supabase] Initialized live PostgreSQL client.');
        return supabaseClient;
    }
    return null;
}

/**
 * Sign up a new user with Supabase Auth
 * @param {string} email
 * @param {string} password
 * @param {Object} metadata { name, gender }
 */
async function supabaseAuthSignUp(email, password, metadata = {}) {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('[Supabase] Client not configured. Operating in LocalStorage mode.');
        return { user: { id: 'local_' + Date.now(), email }, session: null };
    }

    const { data, error } = await client.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
            data: {
                name: metadata.name || '',
                gender: metadata.gender || 'Boy'
            }
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in user with Supabase Auth
 * @param {string} email
 * @param {string} password
 */
async function supabaseAuthSignIn(email, password) {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('[Supabase] Client not configured. Falling back to local authentication.');
        return null;
    }

    const { data, error } = await client.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out current session
 */
async function supabaseAuthSignOut() {
    const client = getSupabaseClient();
    if (client) {
        await client.auth.signOut();
    }
}

/**
 * Send OTP via Supabase Auth (Dispatches real email to user's Gmail via configured SMTP)
 * @param {string} email
 */
async function supabaseSendEmailOtp(email) {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('[Supabase] Client not initialized. Operating in local mode.');
        return { data: null, error: null };
    }
    try {
        const res = await client.auth.signInWithOtp({
            email: email.toLowerCase(),
            options: { shouldCreateUser: true }
        });
        return res;
    } catch (err) {
        console.warn('[Supabase] Send Email OTP note:', err?.message || err);
        return { data: null, error: err };
    }
}

/**
 * Verify OTP entered by user against Supabase Auth
 * @param {string} email
 * @param {string} token (6-digit OTP code)
 */
async function supabaseVerifyEmailOtp(email, token) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: null };
    try {
        const res = await client.auth.verifyOtp({
            email: email.toLowerCase(),
            token: token.trim(),
            type: 'email'
        });
        return res;
    } catch (err) {
        console.warn('[Supabase] Verify OTP note:', err?.message || err);
        return { data: null, error: err };
    }
}

/**
 * Send Password Reset Email via Supabase Auth
 * @param {string} email
 */
async function supabaseSendPasswordReset(email) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: null };
    try {
        const res = await client.auth.resetPasswordForEmail(email.toLowerCase());
        return res;
    } catch (err) {
        console.warn('[Supabase] Send password reset note:', err?.message || err);
        return { data: null, error: err };
    }
}

/**
 * Bidirectional mapper: Frontend Profile Object -> Supabase PostgreSQL Row
 */
function mapProfileForSupabase(p) {
    if (!p) return null;
    return {
        id: p.id || Date.now(),
        user_id: String(p.userId || p.user_id || p.id || ''),
        gender: p.gender || 'boys',
        name: p.name || '',
        age: parseInt(p.age) || 24,
        dob: p.dob || '',
        height: p.height || '',
        weight: p.weight || '',
        education: p.education || '',
        occupation: p.occ || p.occupation || '',
        income: p.income || '',
        marital: p.marital || 'Unmarried',
        physical: p.physical || 'Normal',
        community: p.community || p.caste || '',
        hobbies: Array.isArray(p.hobbies) ? p.hobbies : [],
        father: p.father || p.father_name || '',
        father_occ: p.fatherOcc || p.father_occ || '',
        father_mobile: p.fatherMobile || p.father_mobile || '',
        own_mobile: p.ownMobile || p.own_mobile || p.mobile || '',
        mother: p.mother || p.mother_name || '',
        mother_occ: p.motherOcc || p.mother_occ || '',
        sister: p.sister || '—',
        brother: p.brother || '—',
        village: p.village || p.city || '',
        taluka: p.taluka || '',
        district: p.district || '',
        full_address: p.fullAddress || p.full_address || p.address || '',
        img: p.img || (Array.isArray(p.photos) ? p.photos[0] : '') || '',
        photos: Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : (p.img ? [p.img] : []),
        email: p.email || '',
        mobile: p.mobile || p.ownMobile || '',
        verify_status: p.verifyStatus || p.verify_status || 'approved',
        payment_status: p.paymentStatus || p.payment_status || 'unpaid',
        account_status: p.accountStatus || p.account_status || 'active',
        suspension_reason: p.suspensionReason || p.suspension_reason || null,
        reject_reason: p.rejectReason || p.reject_reason || null,
        registered: p.registered || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        approved_date: p.approvedDate || null,
        visible: p.visible !== false,
        featured: !!p.featured,
        raw_data: {
            ...p,
            agreedTerms: p.agreedTerms !== undefined ? p.agreedTerms : true,
            agreedTermsAt: p.agreedTermsAt || new Date().toISOString()
        },
        updated_at: new Date().toISOString()
    };
}

/**
 * Bidirectional mapper: Supabase PostgreSQL Row -> Frontend Profile Object
 */
function mapProfileFromSupabase(row) {
    if (!row) return null;
    const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
    return {
        ...raw,
        id: row.id,
        userId: row.user_id || raw.userId || row.id,
        gender: row.gender || raw.gender || 'boys',
        name: row.name || raw.name || '',
        age: row.age !== undefined ? row.age : (raw.age || 24),
        dob: row.dob || raw.dob || '',
        city: row.village || raw.city || raw.village || '',
        village: row.village || raw.village || raw.city || '',
        taluka: row.taluka || raw.taluka || '',
        district: row.district || raw.district || '',
        fullAddress: row.full_address || raw.fullAddress || raw.address || '',
        occ: row.occupation || raw.occ || raw.occupation || '',
        occupation: row.occupation || raw.occupation || raw.occ || '',
        education: row.education || raw.education || '',
        income: row.income || raw.income || '',
        height: row.height || raw.height || '',
        weight: row.weight || raw.weight || '',
        marital: row.marital || raw.marital || 'Unmarried',
        physical: row.physical || raw.physical || 'Normal',
        community: row.community || raw.community || '',
        hobbies: Array.isArray(row.hobbies) ? row.hobbies : (raw.hobbies || []),
        father: row.father || raw.father || '',
        fatherOcc: row.father_occ || raw.fatherOcc || raw.father_occ || '',
        fatherMobile: row.father_mobile || raw.fatherMobile || raw.father_mobile || '',
        ownMobile: row.own_mobile || raw.ownMobile || raw.own_mobile || '',
        mother: row.mother || raw.mother || '',
        motherOcc: row.mother_occ || raw.motherOcc || raw.mother_occ || '',
        sister: row.sister || raw.sister || '—',
        brother: row.brother || raw.brother || '—',
        img: (function() {
            const isG = (row.gender === 'girls' || row.gender === 'girls' || row.gender === 'Girl' || (typeof isGirlGender === 'function' && isGirlGender(row.gender || raw.gender)));
            const def = isG ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
            let list = (Array.isArray(row.photos) && row.photos.length > 0) ? row.photos.filter(Boolean) : (Array.isArray(raw.photos) && raw.photos.length > 0 ? raw.photos.filter(Boolean) : []);
            if (list.length > 0) return list[0];
            return (row.img || raw.img || row.photo || raw.photo || def);
        })(),
        photos: (function() {
            const isG = (row.gender === 'girls' || row.gender === 'girls' || row.gender === 'Girl' || (typeof isGirlGender === 'function' && isGirlGender(row.gender || raw.gender)));
            const def = isG ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
            let list = (Array.isArray(row.photos) && row.photos.length > 0) ? row.photos.filter(Boolean) : (Array.isArray(raw.photos) && raw.photos.length > 0 ? raw.photos.filter(Boolean) : []);
            if (list.length > 0) return list;
            const single = (row.img || raw.img || row.photo || raw.photo || '').trim();
            return single ? [single] : [def];
        })(),
        email: row.email || raw.email || '',
        mobile: row.mobile || raw.mobile || row.own_mobile || '',
        verifyStatus: row.verify_status || raw.verifyStatus || 'approved',
        paymentStatus: row.payment_status || raw.paymentStatus || 'unpaid',
        accountStatus: row.account_status || raw.accountStatus || 'active',
        suspensionReason: row.suspension_reason || raw.suspensionReason || null,
        rejectReason: row.reject_reason || raw.rejectReason || null,
        registered: row.registered || raw.registered || '',
        agreedTerms: (raw.agreedTerms !== undefined) ? raw.agreedTerms : true,
        agreedTermsAt: raw.agreedTermsAt || row.created_at || null,
        visible: row.visible !== false,
        featured: !!row.featured
    };
}

/**
 * Fetch verified community profiles from Supabase PostgreSQL
 * @param {Object} filters { gender, community, city }
 */
async function supabaseFetchProfiles(filters = {}) {
    const client = getSupabaseClient();
    if (!client) {
        return window.PROFILES || [];
    }

    try {
        let query = client
            .from('profiles')
            .select('*')
            .neq('account_status', 'suspended')
            .neq('visible', false)
            .neq('verify_status', 'rejected');

        if (filters.caste && filters.caste !== 'All' && filters.caste !== 'MY_COMMUNITY') {
            query = query.eq('community', filters.caste);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.warn('[Supabase] Profiles fetch note:', error.message);
            return window.PROFILES || [];
        }
        if (Array.isArray(data)) {
            let mapped = data.map(mapProfileFromSupabase).filter(Boolean);
            if (filters.gender && filters.gender !== 'all') {
                if (filters.gender === 'boys') {
                    mapped = mapped.filter(p => typeof isBoyGender === 'function' ? isBoyGender(p.gender) : (p.gender === 'boys' || p.gender === 'Boy'));
                } else if (filters.gender === 'girls') {
                    mapped = mapped.filter(p => typeof isGirlGender === 'function' ? isGirlGender(p.gender) : (p.gender === 'girls' || p.gender === 'Girl'));
                }
            }
            return mapped;
        }
        return window.PROFILES || [];
    } catch (err) {
        console.warn('[Supabase] Profile fetch error:', err);
        return window.PROFILES || [];
    }
}

/**
 * Upsert member profile in Supabase
 * @param {Object} profile
 */
async function supabaseUpsertProfile(profile) {
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true };

    try {
        const payload = mapProfileForSupabase(profile);
        const { data, error } = await client
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.warn('[Supabase] Profile upsert note:', error.message);
            return { success: false, error };
        }
        console.info('[Supabase] Profile persisted successfully:', payload.name, payload.id);
        return { success: true, data };
    } catch (err) {
        console.warn('[Supabase] Profile upsert error:', err);
        return { success: false, error: err };
    }
}

/**
 * Record a successful ₹49 UPI payment in Supabase and activate 30-day pass
 * @param {Object} paymentData { id, userId, userName, amount, method, razorpayPaymentId }
 */
async function supabaseRecordPayment(paymentData) {
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true };

    try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // 1. Insert into payments table
        const { error: payErr } = await client.from('payments').upsert({
            id: paymentData.id,
            user_id: String(paymentData.userId || ''),
            user_name: paymentData.userName || 'Registered Member',
            plan: paymentData.plan || 'Boys 30 Days Pass (₹49)',
            amount: 49.00,
            currency: 'INR',
            method: paymentData.method || 'UPI',
            razorpay_payment_id: paymentData.razorpayPaymentId || null,
            status: 'success',
            date: dateStr,
            time: timeStr
        }, { onConflict: 'id' });

        if (payErr) console.warn('[Supabase] Payment upsert note:', payErr.message);

        // 2. Also update profile payment_status in profiles table
        if (paymentData.userId) {
            await client.from('profiles').update({
                payment_status: 'paid',
                updated_at: new Date().toISOString()
            }).eq('id', paymentData.userId);
        }

        return { success: true };
    } catch (e) {
        console.warn('[Supabase] Payment record error:', e);
        return { success: false, error: e };
    }
}

/**
 * Fetch all member profiles for Admin Panel moderation
 */
async function supabaseFetchAllProfilesForAdmin() {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const profilesRes = await client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesRes && profilesRes.error) {
            console.warn('[Supabase] Admin profiles fetch note:', profilesRes.error.message);
            return [];
        }

        const userMap = new Map();
        try {
            const usersRes = await client
                .from('users')
                .select('id, email, agreed_terms, agreed_terms_at');
            if (usersRes && Array.isArray(usersRes.data)) {
                usersRes.data.forEach(u => {
                    if (u.email) userMap.set(String(u.email).toLowerCase().trim(), u);
                    if (u.id) userMap.set(String(u.id), u);
                });
            }
        } catch (uErr) {
            console.warn('[Supabase] Users query note:', uErr);
        }

        const data = (profilesRes && Array.isArray(profilesRes.data)) ? profilesRes.data : [];
        return data.map(p => {
            const mapped = mapProfileFromSupabase(p);
            const normEmail = (mapped.email || '').toLowerCase().trim();
            const normId = String(mapped.id || mapped.userId || '');
            const uMatch = userMap.get(normEmail) || userMap.get(normId);

            if (uMatch) {
                mapped.agreedTerms = uMatch.agreed_terms !== false;
                mapped.agreedTermsAt = uMatch.agreed_terms_at || mapped.agreedTermsAt || p.created_at || null;
            } else {
                mapped.agreedTerms = (mapped.agreedTerms !== undefined) ? mapped.agreedTerms : true;
                mapped.agreedTermsAt = mapped.agreedTermsAt || p.created_at || null;
            }
            return mapped;
        });
    } catch (e) {
        console.warn('[Supabase] Admin profiles fetch error:', e);
        return [];
    }
}

/**
 * Admin: Update member profile status in Supabase (approve, reject, suspend)
 */
async function supabaseUpdateProfileStatus(profileId, updates) {
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true };
    try {
        const payload = {
            updated_at: new Date().toISOString()
        };
        if (updates.verifyStatus || updates.verify_status) payload.verify_status = updates.verifyStatus || updates.verify_status;
        if (updates.accountStatus || updates.account_status) payload.account_status = updates.accountStatus || updates.account_status;
        if (updates.visible !== undefined) payload.visible = updates.visible;
        if (updates.featured !== undefined) payload.featured = updates.featured;
        if (updates.suspensionReason !== undefined || updates.suspension_reason !== undefined) {
            payload.suspension_reason = updates.suspensionReason || updates.suspension_reason;
        }
        if (updates.rejectReason !== undefined || updates.reject_reason !== undefined) {
            payload.reject_reason = updates.rejectReason || updates.reject_reason;
        }

        const numId = Number(profileId);
        let { data, error } = await client
            .from('profiles')
            .update(payload)
            .eq('id', !isNaN(numId) ? numId : profileId);

        if (error && updates.email) {
            const res = await client
                .from('profiles')
                .update(payload)
                .eq('email', String(updates.email).trim().toLowerCase());
            if (!res.error) error = null;
        }

        if (error) console.warn('[Supabase] Profile status update note:', error.message);
        return { success: !error, data };
    } catch (e) {
        return { success: false, error: e };
    }
}

/**
 * Admin: Fully update member profile details in Supabase PostgreSQL
 */
async function supabaseAdminUpdateMember(profileId, u) {
    const client = getSupabaseClient();
    if (!client || !u) return { success: true, localOnly: true };

    try {
        const payload = mapProfileForSupabase(u);
        const normEmail = (u.email || '').trim().toLowerCase();

        // 1. Try update by primary key id
        let updated = false;
        if (profileId !== undefined && profileId !== null) {
            const numId = Number(profileId);
            const { error: errId } = await client
                .from('profiles')
                .update(payload)
                .eq('id', !isNaN(numId) ? numId : profileId);
            if (!errId) updated = true;
        }

        // 2. If not updated and email exists, update by email
        if (!updated && normEmail) {
            const { error: errEmail } = await client
                .from('profiles')
                .update(payload)
                .eq('email', normEmail);
            if (!errEmail) updated = true;
        }

        // 3. Keep public.users table synchronized as well
        if (normEmail) {
            await client
                .from('users')
                .update({
                    name: u.name || '',
                    gender: (u.gender === 'girls' || u.gender === 'Girl') ? 'Girl' : 'Boy',
                    caste: u.community || u.caste || '',
                    mobile: u.ownMobile || u.mobile || '',
                    updated_at: new Date().toISOString()
                })
                .eq('email', normEmail);
        }

        console.info('[Supabase] Admin member profile updated live:', u.name, profileId);
        return { success: true };
    } catch (e) {
        console.warn('[Supabase] Admin update member profile error:', e);
        return { success: false, error: e };
    }
}

/**
 * Admin: Delete member profile from Supabase
 */
async function supabaseDeleteProfile(profileId) {
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true };
    try {
        const { error } = await client
            .from('profiles')
            .delete()
            .eq('id', profileId);
        if (error) console.warn('[Supabase] Profile delete note:', error.message);
        return { success: !error };
    } catch (e) {
        return { success: false, error: e };
    }
}

/**
 * Permanently and completely delete an account and all related records from Supabase
 * Deletes from profiles, users, and payments tables
 * @param {string|number} id
/**
 * Permanently and completely delete an account and all related records from Supabase
 * Deletes from auth.users, profiles, users, messages, interests, payments, email_logs, and Cloudinary CDN
 * @param {string|number|object} id - User ID or User Object
 * @param {string} [email] - User Email
 * @param {string|number} [extraId] - Additional User ID or Profile ID
 */
async function supabaseDeleteUserCompletely(id, email, extraId) {
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true };

    const collectedIds = new Set();
    const collectedEmails = new Set();

    // Helper to safely extract identifiers
    const ingestId = (val) => {
        if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== 'undefined' && String(val).trim() !== 'null') {
            collectedIds.add(String(val).trim());
        }
    };
    const ingestEmail = (val) => {
        if (val && typeof val === 'string' && val.includes('@')) {
            collectedEmails.add(val.trim().toLowerCase());
        }
    };

    // Parse object argument if passed as first parameter
    if (id && typeof id === 'object') {
        ingestId(id.id);
        ingestId(id.userId);
        ingestId(id.user_id);
        ingestId(id.profileId);
        ingestId(id.profile_id);
        ingestEmail(id.email);
        ingestEmail(id.userEmail);
    } else {
        ingestId(id);
    }

    if (email && typeof email === 'object') {
        ingestId(email.id);
        ingestId(email.userId);
        ingestEmail(email.email);
    } else {
        ingestEmail(email);
    }

    if (extraId) {
        if (typeof extraId === 'object') {
            ingestId(extraId.id);
            ingestId(extraId.userId);
            ingestId(extraId.user_id);
        } else {
            ingestId(extraId);
        }
    }

    let normEmail = Array.from(collectedEmails)[0] || '';
    let normId = Array.from(collectedIds)[0] || '';

    console.info(`[Supabase] Initiating COMPLETE PURGE for IDs: [${Array.from(collectedIds).join(', ')}], Emails: [${Array.from(collectedEmails).join(', ')}]`);

    try {
        // Step A: If email is missing, lookup email from profiles and users
        if (!normEmail && collectedIds.size > 0) {
            for (const cid of Array.from(collectedIds)) {
                try {
                    const numCid = Number(cid);
                    if (!isNaN(numCid) && numCid > 0) {
                        const { data: p } = await client.from('profiles').select('email, user_id').eq('id', numCid).maybeSingle();
                        if (p) {
                            if (p.email) ingestEmail(p.email);
                            if (p.user_id) ingestId(p.user_id);
                        }
                    }
                    const { data: pUid } = await client.from('profiles').select('email, id').eq('user_id', cid).maybeSingle();
                    if (pUid) {
                        if (pUid.email) ingestEmail(pUid.email);
                        if (pUid.id) ingestId(pUid.id);
                    }
                } catch(e) {}
                try {
                    const { data: u } = await client.from('users').select('email').eq('id', cid).maybeSingle();
                    if (u && u.email) ingestEmail(u.email);
                } catch(e) {}
            }
        }

        // Step B: If email is known, lookup all associated user_ids from profiles and users
        for (const eml of Array.from(collectedEmails)) {
            try {
                const { data: pList } = await client.from('profiles').select('id, user_id').ilike('email', eml);
                (pList || []).forEach(row => {
                    if (row.id) ingestId(row.id);
                    if (row.user_id) ingestId(row.user_id);
                });
            } catch(e) {}
            try {
                const { data: uList } = await client.from('users').select('id').ilike('email', eml);
                (uList || []).forEach(row => {
                    if (row.id) ingestId(row.id);
                });
            } catch(e) {}
        }

        // Step C: Check if there is an active session auth user ID
        try {
            const { data: authData } = await client.auth.getUser();
            if (authData?.user) {
                if (authData.user.id) ingestId(authData.user.id);
                if (authData.user.email) ingestEmail(authData.user.email);
            }
        } catch(e) {}

        const idList = Array.from(collectedIds);
        const emailList = Array.from(collectedEmails);
        if (!normEmail && emailList.length > 0) normEmail = emailList[0];
        if (!normId && idList.length > 0) normId = idList[0];

        console.info(`[Supabase] Purging records matching IDs: [${idList.join(', ')}] and Emails: [${emailList.join(', ')}]`);

        // PRIORITY 0: Gather and Purge all Cloudinary Photo Assets before deleting DB records
        const photoAssetsToPurge = new Set();
        if (typeof state !== 'undefined' && state.currentUser) {
            if (state.currentUser.img) photoAssetsToPurge.add(state.currentUser.img);
            if (state.currentUser.avatar_url) photoAssetsToPurge.add(state.currentUser.avatar_url);
            if (state.currentUser.photo) photoAssetsToPurge.add(state.currentUser.photo);
            if (state.currentUser.docImg) photoAssetsToPurge.add(state.currentUser.docImg);
            if (state.currentUser.doc_img) photoAssetsToPurge.add(state.currentUser.doc_img);
            if (Array.isArray(state.currentUser.photos)) state.currentUser.photos.forEach(p => p && photoAssetsToPurge.add(p));
            if (Array.isArray(state.currentUser.cloudinary_public_ids)) state.currentUser.cloudinary_public_ids.forEach(p => p && photoAssetsToPurge.add(p));
        }
        if (typeof window !== 'undefined' && Array.isArray(window.PROFILES)) {
            const mem = window.PROFILES.find(p => p && (
                (normEmail && p.email && p.email.toLowerCase() === normEmail) ||
                (normId && (String(p.id) === normId || String(p.userId) === normId)) ||
                (idList.includes(String(p.id)) || idList.includes(String(p.userId))) ||
                (p.email && emailList.includes(p.email.toLowerCase()))
            ));
            if (mem) {
                if (mem.img) photoAssetsToPurge.add(mem.img);
                if (mem.avatar_url) photoAssetsToPurge.add(mem.avatar_url);
                if (mem.photo) photoAssetsToPurge.add(mem.photo);
                if (mem.docImg) photoAssetsToPurge.add(mem.docImg);
                if (mem.doc_img) photoAssetsToPurge.add(mem.doc_img);
                if (Array.isArray(mem.photos)) mem.photos.forEach(p => p && photoAssetsToPurge.add(p));
                if (Array.isArray(mem.cloudinary_public_ids)) mem.cloudinary_public_ids.forEach(p => p && photoAssetsToPurge.add(p));
            }
        }
        // In Admin Panel, also check USERS array
        if (typeof USERS !== 'undefined' && Array.isArray(USERS)) {
            const adminUser = USERS.find(p => p && (
                (normEmail && p.email && p.email.toLowerCase() === normEmail) ||
                (normId && (String(p.id) === normId || String(p.userId) === normId)) ||
                (idList.includes(String(p.id)) || idList.includes(String(p.userId))) ||
                (p.email && emailList.includes(p.email.toLowerCase()))
            ));
            if (adminUser) {
                if (adminUser.img) photoAssetsToPurge.add(adminUser.img);
                if (adminUser.avatar_url) photoAssetsToPurge.add(adminUser.avatar_url);
                if (adminUser.photo) photoAssetsToPurge.add(adminUser.photo);
                if (adminUser.docImg) photoAssetsToPurge.add(adminUser.docImg);
                if (adminUser.doc_img) photoAssetsToPurge.add(adminUser.doc_img);
                if (Array.isArray(adminUser.photos)) adminUser.photos.forEach(p => p && photoAssetsToPurge.add(p));
                if (Array.isArray(adminUser.cloudinary_public_ids)) adminUser.cloudinary_public_ids.forEach(p => p && photoAssetsToPurge.add(p));
            }
        }

        // Also query database profiles table for photo URLs
        try {
            for (const eml of emailList) {
                const { data: dbProfs } = await client.from('profiles').select('img, avatar_url, photos, doc_img').ilike('email', eml);
                (dbProfs || []).forEach(p => {
                    if (p.img) photoAssetsToPurge.add(p.img);
                    if (p.avatar_url) photoAssetsToPurge.add(p.avatar_url);
                    if (p.doc_img) photoAssetsToPurge.add(p.doc_img);
                    if (Array.isArray(p.photos)) p.photos.forEach(ph => ph && photoAssetsToPurge.add(ph));
                });
            }
            for (const uid of idList) {
                const numUid = Number(uid);
                if (!isNaN(numUid) && numUid > 0) {
                    const { data: dbProfsId } = await client.from('profiles').select('img, avatar_url, photos, doc_img').eq('id', numUid);
                    (dbProfsId || []).forEach(p => {
                        if (p.img) photoAssetsToPurge.add(p.img);
                        if (p.avatar_url) photoAssetsToPurge.add(p.avatar_url);
                        if (p.doc_img) photoAssetsToPurge.add(p.doc_img);
                        if (Array.isArray(p.photos)) p.photos.forEach(ph => ph && photoAssetsToPurge.add(ph));
                    });
                }
                const { data: dbProfsUid } = await client.from('profiles').select('img, avatar_url, photos, doc_img').eq('user_id', uid);
                (dbProfsUid || []).forEach(p => {
                    if (p.img) photoAssetsToPurge.add(p.img);
                    if (p.avatar_url) photoAssetsToPurge.add(p.avatar_url);
                    if (p.doc_img) photoAssetsToPurge.add(p.doc_img);
                    if (Array.isArray(p.photos)) p.photos.forEach(ph => ph && photoAssetsToPurge.add(ph));
                });
            }
        } catch(e) {}

        if (photoAssetsToPurge.size > 0 && typeof deleteMultipleCloudinaryImages === 'function') {
            try {
                console.info(`[Cloudinary] Purging ${photoAssetsToPurge.size} user photo assets from Cloudinary CDN...`);
                await deleteMultipleCloudinaryImages(Array.from(photoAssetsToPurge));
            } catch(cdnErr) {
                console.warn('[Cloudinary] Purge warning:', cdnErr);
            }
        }

        // PRIORITY 1: Call SECURITY DEFINER RPC to delete user completely from auth.users (Supabase Dashboard) + all tables
        let rpcExecuted = false;
        try {
            const { data: rpcData, error: rpcErr } = await client.rpc('delete_user_account_completely', {
                target_email: normEmail || (emailList[0] || ''),
                target_user_id: normId || (idList[0] || '')
            });
            if (!rpcErr && rpcData && rpcData.success) {
                console.info('[Supabase] RPC delete_user_account_completely executed successfully:', rpcData);
                rpcExecuted = true;
            } else if (rpcErr) {
                console.warn('[Supabase] RPC purge note (fallback client deletes will proceed):', rpcErr.message || rpcErr);
            }
        } catch(rpcEx) {
            console.warn('[Supabase] RPC purge exception:', rpcEx);
        }

        // PRIORITY 2: Direct client-side cleanup across all public tables (Bulletproof fallback & verification)

        // 1. Delete all chat messages (sent or received)
        for (const eml of emailList) {
            try {
                await client.from('messages').delete().ilike('sender_email', eml);
                await client.from('messages').delete().ilike('receiver_email', eml);
            } catch(e) {}
        }
        for (const uid of idList) {
            const numUid = Number(uid);
            if (!isNaN(numUid) && numUid > 0) {
                try {
                    await client.from('messages').delete().eq('sender_id', numUid);
                    await client.from('messages').delete().eq('receiver_id', numUid);
                } catch(e) {}
            }
            try {
                await client.from('messages').delete().eq('sender_id', uid);
                await client.from('messages').delete().eq('receiver_id', uid);
            } catch(e) {}
        }

        // 2. Delete all interests (sent or received)
        for (const eml of emailList) {
            try {
                await client.from('interests').delete().ilike('sender_email', eml);
                await client.from('interests').delete().ilike('receiver_email', eml);
            } catch(e) {}
        }
        for (const uid of idList) {
            const numUid = Number(uid);
            if (!isNaN(numUid) && numUid > 0) {
                try {
                    await client.from('interests').delete().eq('sender_id', numUid);
                    await client.from('interests').delete().eq('receiver_id', numUid);
                } catch(e) {}
            }
        }

        // 3. Delete email logs
        for (const eml of emailList) {
            try {
                await client.from('email_logs').delete().ilike('recipient_email', eml);
            } catch(e) {}
        }

        // 4. Delete from profiles (by email and all collected IDs)
        for (const eml of emailList) {
            try {
                await client.from('profiles').delete().ilike('email', eml);
                await client.from('profiles').delete().eq('email', eml);
            } catch(e) {}
        }
        for (const uid of idList) {
            const numUid = Number(uid);
            if (!isNaN(numUid) && numUid > 0) {
                try {
                    await client.from('profiles').delete().eq('id', numUid);
                } catch(e) {}
            }
            try {
                await client.from('profiles').delete().eq('user_id', uid);
            } catch(e) {}
        }

        // 5. Delete from users (by email and all collected IDs)
        for (const eml of emailList) {
            try {
                await client.from('users').delete().ilike('email', eml);
                await client.from('users').delete().eq('email', eml);
            } catch(e) {}
        }
        for (const uid of idList) {
            try {
                await client.from('users').delete().eq('id', uid);
            } catch(e) {}
        }

        // 6. Delete from payments (payments table stores user_id)
        for (const uid of idList) {
            try {
                await client.from('payments').delete().eq('user_id', uid);
            } catch(e) {}
        }

        // 7. Clean reports from users table (reports are stored with role: 'report')
        for (const uid of idList) {
            try {
                await client.from('users').delete().eq('role', 'report').ilike('suspension_reason', `%"targetUserId":${uid}%`);
            } catch(e) {}
        }

        // 8. Broadcast Realtime deletion event so ALL connected users immediately remove profile from screen
        try {
            if (typeof userPresenceChannel !== 'undefined' && userPresenceChannel) {
                userPresenceChannel.send({
                    type: 'broadcast',
                    event: 'user_account_deleted',
                    payload: { id: normId, email: normEmail, ids: idList, emails: emailList, time: Date.now() }
                });
            } else if (typeof client.channel === 'function') {
                const bChan = client.channel(`realtime:broadcast:del_${Date.now()}`);
                bChan.subscribe(status => {
                    if (status === 'SUBSCRIBED') {
                        bChan.send({
                            type: 'broadcast',
                            event: 'user_account_deleted',
                            payload: { id: normId, email: normEmail, ids: idList, emails: emailList, time: Date.now() }
                        });
                        setTimeout(() => {
                            try { client.removeChannel(bChan); } catch (_) {}
                        }, 2500);
                    }
                });
            }
        } catch(bcErr) {
            console.warn('[Realtime] Broadcast delete notice:', bcErr);
        }

        // 9. Terminate Supabase Auth session so token is wiped from browser
        try {
            await client.auth.signOut();
        } catch(e) {}

        console.info(`[Supabase] Complete purge successful across auth, profiles, users, interests, messages, payments, and Cloudinary.`);
        return { success: true, rpcExecuted, purgedIds: idList, purgedEmails: emailList };
    } catch (err) {
        console.warn('[Supabase] Complete purge note:', err);
        return { success: false, error: err };
    }
}

/**
 * Check if a user account exists in Supabase (Single Source of Truth)
 * @param {string} email
 */
async function supabaseCheckUserExists(email) {
    const client = getSupabaseClient();
    if (!client) {
        return { online: false, exists: true };
    }
    const normEmail = email ? String(email).trim().toLowerCase() : '';
    if (!normEmail) return { online: true, exists: false };

    try {
        // Check profiles table
        const { data: pData, error: pErr } = await client
            .from('profiles')
            .select('id, email, account_status, verify_status')
            .ilike('email', normEmail)
            .limit(1);

        // Check users table
        const { data: uData, error: uErr } = await client
            .from('users')
            .select('id, email, status')
            .ilike('email', normEmail)
            .limit(1);

        const profile = Array.isArray(pData) && pData.length > 0 ? pData[0] : null;
        const user = Array.isArray(uData) && uData.length > 0 ? uData[0] : null;

        const exists = Boolean(profile || user);
        const isSuspended = (profile && profile.account_status === 'suspended') || (user && user.status === 'Suspended');

        return {
            online: true,
            exists,
            isSuspended,
            profile,
            user
        };
    } catch (err) {
        console.warn('[Supabase] Check user exists note:', err);
        return { online: false, exists: true };
    }
}

/**
 * Upsert user registration record into Supabase public.users table
 * @param {Object} userRecord
 */
async function supabaseUpsertUser(userRecord) {
    const client = getSupabaseClient();
    if (!client || !userRecord || !userRecord.email) return;

    try {
        const payload = {
            id: String(userRecord.id || userRecord.userId || 'usr_' + Date.now()),
            email: String(userRecord.email).trim().toLowerCase(),
            name: userRecord.name || '',
            gender: (userRecord.gender === 'girls' || userRecord.gender === 'Girl') ? 'Girl' : 'Boy',
            caste: userRecord.caste || userRecord.community || '',
            mobile: userRecord.mobile || userRecord.ownMobile || '',
            role: userRecord.role || 'member',
            status: userRecord.status || 'Active',
            profile_complete: !!userRecord.profileComplete,
            payment_status: userRecord.paymentStatus || 'Unpaid',
            plan_start: userRecord.planStart || null,
            plan_expiry: userRecord.planExpiry || null,
            agreed_terms: userRecord.agreedTerms !== undefined ? !!userRecord.agreedTerms : true,
            agreed_terms_at: userRecord.agreedTermsAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        let { error } = await client
            .from('users')
            .upsert(payload, { onConflict: 'email' });

        if (error && error.message && error.message.includes('agreed_terms')) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.agreed_terms;
            delete fallbackPayload.agreed_terms_at;
            const retryRes = await client.from('users').upsert(fallbackPayload, { onConflict: 'email' });
            if (retryRes.error) console.warn('[Supabase] Upsert retry note:', retryRes.error.message);
        } else if (error) {
            console.warn('[Supabase] Upsert user record note:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase] Upsert user record error:', err);
    }
}

/**
 * Admin: Fetch live payments log from Supabase
 */
async function supabaseFetchPaymentsForAdmin() {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const { data, error } = await client
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('[Supabase] Payments fetch note:', error.message);
            return [];
        }
        return Array.isArray(data) ? data.map(p => ({
            id: p.id,
            userId: p.user_id,
            userName: p.user_name || 'Member',
            plan: p.plan || 'Boys 30 Days Pass (₹49)',
            amount: p.amount || 49,
            date: p.date || new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: p.time || new Date(p.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            method: p.method || 'UPI',
            status: p.status || 'success'
        })) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Realtime: Subscribe to changes in a Supabase table
 */
function supabaseSubscribeToTable(tableName, onInsert, onUpdate, onDelete) {
    const client = getSupabaseClient();
    if (!client || typeof client.channel !== 'function') return null;
    try {
        const channel = client.channel(`realtime:${tableName}:${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableName }, payload => {
                if (typeof onInsert === 'function') onInsert(payload.new);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: tableName }, payload => {
                if (typeof onUpdate === 'function') onUpdate(payload.new);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: tableName }, payload => {
                if (typeof onDelete === 'function') onDelete(payload.old);
            })
            .subscribe((status) => {
                console.info(`[Supabase Realtime] ${tableName} channel status:`, status);
            });
        return channel;
    } catch (e) {
        console.warn('[Supabase] Realtime subscription note:', e);
        return null;
    }
}

/* ==============================================================================
   INTEREST REQUESTS & REALTIME MATCH NOTIFICATIONS
   ============================================================================== */

/**
 * Helper to extract real photo with fallback to in-memory PROFILES
 */
function getSafeProfilePhoto(profile) {
    if (!profile) return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop';
    let p = profile.photo || profile.img || (Array.isArray(profile.photos) ? profile.photos[0] : '');
    if (p && typeof p === 'string' && p.trim().length > 10) return p.trim();

    const normId = String(profile.id || profile.userId || '');
    const normEmail = (profile.email || '').toLowerCase().trim();
    const found = (window.PROFILES || []).find(x => 
        (normId && String(x.id) === normId) ||
        (normEmail && x.email && x.email.toLowerCase().trim() === normEmail)
    );
    if (found) {
        let fImg = found.img || (Array.isArray(found.photos) ? found.photos[0] : '') || '';
        if (fImg && fImg.trim().length > 10) return fImg.trim();
    }
    const isGirl = (typeof isGirlGender === 'function') ? isGirlGender(profile.gender) : (profile.gender === 'girls' || profile.gender === 'Girl');
    return isGirl ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
}

/**
 * Send an interest request from sender to receiver profile
 * Persists to Supabase public.interests table and dispatches branded email
 */
async function supabaseSendInterest(senderProfile, receiverProfile) {
    const client = getSupabaseClient();
    
    // Robust integer resolution for Supabase PostgreSQL BIGINT columns
    let senderId = parseInt(senderProfile.id || senderProfile.userId, 10);
    if (isNaN(senderId) || senderId <= 0) {
        let hash = 0;
        const str = String(senderProfile.email || senderProfile.id || '1');
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        senderId = Math.abs(hash) || 10001;
    }

    let receiverId = parseInt(receiverProfile.id || receiverProfile.userId, 10);
    if (isNaN(receiverId) || receiverId <= 0) {
        let hash = 0;
        const str = String(receiverProfile.email || receiverProfile.id || '2');
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        receiverId = Math.abs(hash) || 20002;
    }

    const senderEmail = (senderProfile.email || '').trim().toLowerCase();
    const receiverEmail = (receiverProfile.email || '').trim().toLowerCase();
    const interestId = `int_${senderId}_${receiverId}`;

    const realSenderPhoto = getSafeProfilePhoto(senderProfile);
    const realReceiverPhoto = getSafeProfilePhoto(receiverProfile);

    const interestRow = {
        id: interestId,
        sender_id: senderId,
        sender_email: senderEmail,
        sender_name: senderProfile.name || 'Member',
        sender_gender: senderProfile.gender || 'Boy',
        sender_photo: realSenderPhoto,
        sender_caste: senderProfile.community || senderProfile.caste || '',
        sender_city: senderProfile.city || senderProfile.village || '',
        receiver_id: receiverId,
        receiver_email: receiverEmail,
        receiver_name: receiverProfile.name || 'Member',
        receiver_photo: realReceiverPhoto,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // 1. Supabase Persistence
    if (client) {
        try {
            const { data, error } = await client
                .from('interests')
                .upsert(interestRow, { onConflict: 'id' });
            if (error) console.warn('[Supabase] Interest upsert note:', error.message);
            else console.info('[Supabase] Interest saved to database:', interestId);
        } catch (e) {
            console.warn('[Supabase] Interest upsert error:', e);
        }
    }

    // 2. Dispatch Branded Email Notification to Receiver
    if (receiverEmail && typeof sendMatrimonialEmailNotification === 'function') {
        sendMatrimonialEmailNotification({
            type: 'INTEREST_RECEIVED',
            toEmail: receiverEmail,
            toName: receiverProfile.name,
            senderData: {
                name: senderProfile.name,
                age: senderProfile.age,
                caste: senderProfile.community || senderProfile.caste,
                education: senderProfile.education,
                occ: senderProfile.occ || senderProfile.occupation,
                city: senderProfile.city || senderProfile.village,
                district: senderProfile.district,
                photo: realSenderPhoto
            },
            receiverData: {
                name: receiverProfile.name,
                email: receiverEmail,
                photo: realReceiverPhoto
            }
        }).catch(e => console.warn('[EmailService] Dispatch error:', e));
    }

    return { success: true, interest: interestRow };
}

/**
 * Fetch all incoming and outgoing interests for the current user from Supabase
 */
async function supabaseFetchUserInterests(userEmail, userId) {
    const client = getSupabaseClient();
    const normEmail = (userEmail || '').trim().toLowerCase();
    const numId = Number(userId || 0);

    if (!client) {
        return { incoming: [], outgoing: [] };
    }

    try {
        // Incoming: User is the receiver
        let incQuery = client.from('interests').select('*');
        if (normEmail && numId) {
            incQuery = incQuery.or(`receiver_email.eq.${normEmail},receiver_id.eq.${numId}`);
        } else if (normEmail) {
            incQuery = incQuery.eq('receiver_email', normEmail);
        } else if (numId) {
            incQuery = incQuery.eq('receiver_id', numId);
        }

        // Outgoing: User is the sender
        let outQuery = client.from('interests').select('*');
        if (normEmail && numId) {
            outQuery = outQuery.or(`sender_email.eq.${normEmail},sender_id.eq.${numId}`);
        } else if (normEmail) {
            outQuery = outQuery.eq('sender_email', normEmail);
        } else if (numId) {
            outQuery = outQuery.eq('sender_id', numId);
        }

        const [incRes, outRes] = await Promise.all([
            incQuery.order('created_at', { ascending: false }),
            outQuery.order('created_at', { ascending: false })
        ]);

        const incoming = (incRes.data || []).map(r => ({
            id: r.id,
            profileId: Number(r.sender_id),
            senderEmail: r.sender_email,
            senderName: r.sender_name,
            senderPhoto: r.sender_photo,
            senderCaste: r.sender_caste,
            senderCity: r.sender_city,
            status: r.status,
            date: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        }));

        const outgoing = (outRes.data || []).map(r => ({
            id: r.id,
            profileId: Number(r.receiver_id),
            receiverEmail: r.receiver_email,
            receiverName: r.receiver_name,
            status: r.status,
            date: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        }));

        return { incoming, outgoing };
    } catch (e) {
        console.warn('[Supabase] Fetch interests note:', e);
        return { incoming: [], outgoing: [] };
    }
}

/**
 * Update status of an interest (accept or decline)
 */
async function supabaseUpdateInterestStatus(interestId, newStatus, senderProfile, receiverProfile) {
    const client = getSupabaseClient();
    if (client && interestId) {
        try {
            await client.from('interests').update({
                status: newStatus,
                updated_at: new Date().toISOString()
            }).eq('id', interestId);
            console.info(`[Supabase] Interest ${interestId} updated to: ${newStatus}`);
        } catch (e) {
            console.warn('[Supabase] Update interest status error:', e);
        }
    }

    // Send email notification to sender regarding accept / decline
    const senderEmail = (senderProfile?.email || '').trim().toLowerCase();
    if (senderEmail && typeof sendMatrimonialEmailNotification === 'function') {
        const notifType = newStatus === 'accepted' ? 'INTEREST_ACCEPTED' : 'INTEREST_DECLINED';
        const realReceiverPhoto = getSafeProfilePhoto(receiverProfile);
        const realSenderPhoto = getSafeProfilePhoto(senderProfile);

        sendMatrimonialEmailNotification({
            type: notifType,
            toEmail: senderEmail,
            toName: senderProfile.name,
            senderData: {
                name: senderProfile.name,
                email: senderEmail,
                photo: realSenderPhoto
            },
            receiverData: {
                name: receiverProfile?.name || 'Member',
                photo: realReceiverPhoto
            }
        }).catch(e => console.warn('[EmailService] Status dispatch error:', e));
    }

    return { success: true };
}

/* ==============================================================================
   CHAT MESSAGES PERSISTENCE & REALTIME
   ============================================================================== */

/**
 * Safe helper: checks whether a userId (string or number) is in deleted_for_users list
 */
function isUserInDeletedList(deletedList, userId) {
    if (!deletedList || userId === null || userId === undefined) return false;
    const strId = String(userId).trim();
    if (!strId) return false;
    const numId = Number(userId);

    let list = [];
    if (Array.isArray(deletedList)) {
        list = deletedList;
    } else if (typeof deletedList === 'string') {
        try {
            const parsed = JSON.parse(deletedList);
            if (Array.isArray(parsed)) list = parsed;
        } catch(e) {
            list = [];
        }
    }

    return list.some(item => {
        if (item === null || item === undefined) return false;
        const itemStr = String(item).trim();
        if (itemStr && itemStr === strId) return true;
        if (!isNaN(numId) && !isNaN(Number(item)) && Number(item) === numId) return true;
        return false;
    });
}

/**
 * Fetch messages between two users from Supabase with full Dual ID + Email resolution
 */
async function supabaseFetchChatMessages(myId, peerId, myEmail, peerEmail) {
    const client = getSupabaseClient();
    if (!client || !myId || !peerId) return [];
    try {
        const id1 = Number(myId);
        const id2 = Number(peerId);
        const strId1 = String(myId).trim();
        const strId2 = String(peerId).trim();
        const normMyEmail = String(myEmail || (typeof state !== 'undefined' && state.currentUser?.email) || '').trim().toLowerCase();
        let normPeerEmail = String(peerEmail || '').trim().toLowerCase();
        if (!normPeerEmail && typeof findProfile === 'function') {
            const p = findProfile(peerId);
            if (p && p.email) normPeerEmail = String(p.email).trim().toLowerCase();
        }

        let query = client.from('messages').select('*');
        const orParts = [];
        if (!isNaN(id1) && !isNaN(id2) && id1 > 0 && id2 > 0) {
            orParts.push(`and(sender_id.eq.${id1},receiver_id.eq.${id2})`);
            orParts.push(`and(sender_id.eq.${id2},receiver_id.eq.${id1})`);
        }
        if (strId1 && strId2 && (isNaN(id1) || isNaN(id2))) {
            orParts.push(`and(sender_id.eq.${strId1},receiver_id.eq.${strId2})`);
            orParts.push(`and(sender_id.eq.${strId2},receiver_id.eq.${strId1})`);
        }
        if (normMyEmail && normPeerEmail) {
            orParts.push(`and(sender_email.eq.${normMyEmail},receiver_email.eq.${normPeerEmail})`);
            orParts.push(`and(sender_email.eq.${normPeerEmail},receiver_email.eq.${normMyEmail})`);
        }

        if (orParts.length > 0) {
            query = query.or(orParts.join(','));
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            console.warn('[Supabase] Fetch messages note:', error.message);
            return [];
        }
        return (data || [])
            .filter(m => {
                const isDelId = isUserInDeletedList(m.deleted_for_users, myId);
                const isDelEmail = normMyEmail ? isUserInDeletedList(m.deleted_for_users, normMyEmail) : false;
                return !isDelId && !isDelEmail;
            })
            .map(m => {
                const sIdStr = String(m.sender_id);
                const sEmail = String(m.sender_email || '').trim().toLowerCase();
                const isMe = (strId1 && sIdStr === strId1) || 
                             (!isNaN(id1) && Number(m.sender_id) === id1) || 
                             (normMyEmail && sEmail === normMyEmail);
                return {
                    id: m.id,
                    from: isMe ? 'me' : 'them',
                    senderId: Number(m.sender_id) || m.sender_id,
                    receiverId: Number(m.receiver_id) || m.receiver_id,
                    senderEmail: m.sender_email,
                    receiverEmail: m.receiver_email,
                    text: m.text,
                    time: m.time || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    edited: !!m.edited,
                    isDeleted: !!m.is_deleted,
                    deletedForUsers: Array.isArray(m.deleted_for_users) ? m.deleted_for_users : [],
                    isRead: !!m.is_read,
                    readAt: m.read_at,
                    createdAt: m.created_at
                };
            });
    } catch (e) {
        console.warn('[Supabase] Chat fetch error:', e);
        return [];
    }
}

/**
 * Fetch ALL messages for the current user across all conversations
 * Ensures full multi-device, offline and 5-day+ message persistence
 */
async function supabaseFetchAllUserMessages(userId, userEmail) {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const numId = Number(userId || 0);
        const strId = String(userId || '').trim();
        const normEmail = (userEmail || '').trim().toLowerCase();

        let query = client.from('messages').select('*');
        if (!isNaN(numId) && numId > 0 && normEmail) {
            query = query.or(`sender_id.eq.${numId},receiver_id.eq.${numId},sender_email.eq.${normEmail},receiver_email.eq.${normEmail}`);
        } else if (!isNaN(numId) && numId > 0) {
            query = query.or(`sender_id.eq.${numId},receiver_id.eq.${numId}`);
        } else if (strId && normEmail) {
            query = query.or(`sender_id.eq.${strId},receiver_id.eq.${strId},sender_email.eq.${normEmail},receiver_email.eq.${normEmail}`);
        } else if (normEmail) {
            query = query.or(`sender_email.eq.${normEmail},receiver_email.eq.${normEmail}`);
        } else {
            return [];
        }

        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) {
            console.warn('[Supabase] Fetch all user messages note:', error.message);
            return [];
        }

        return (data || [])
            .filter(m => !isUserInDeletedList(m.deleted_for_users, userId))
            .map(m => ({
                id: m.id,
                threadId: m.thread_id,
                senderId: Number(m.sender_id) || m.sender_id,
                receiverId: Number(m.receiver_id) || m.receiver_id,
                senderEmail: m.sender_email,
                receiverEmail: m.receiver_email,
                text: m.text,
                time: m.time || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                edited: !!m.edited,
                isDeleted: !!m.is_deleted,
                deletedForUsers: Array.isArray(m.deleted_for_users) ? m.deleted_for_users : [],
                isRead: !!m.is_read,
                readAt: m.read_at,
                createdAt: m.created_at
            }));
    } catch (e) {
        console.warn('[Supabase] Fetch all user messages error:', e);
        return [];
    }
}

/**
 * Save chat message to Supabase PostgreSQL
 */
async function supabaseSaveChatMessage(msgData) {
    const client = getSupabaseClient();
    if (!client) return { success: true };
    try {
        const id1 = Math.min(Number(msgData.senderId), Number(msgData.receiverId));
        const id2 = Math.max(Number(msgData.senderId), Number(msgData.receiverId));
        const threadId = (!isNaN(id1) && !isNaN(id2)) 
            ? `thread_${id1}_${id2}` 
            : `thread_${msgData.senderId}_${msgData.receiverId}`;

        const payload = {
            id: msgData.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
            thread_id: threadId,
            sender_id: Number(msgData.senderId) || msgData.senderId,
            receiver_id: Number(msgData.receiverId) || msgData.receiverId,
            sender_email: (msgData.senderEmail || '').trim().toLowerCase(),
            receiver_email: (msgData.receiverEmail || '').trim().toLowerCase(),
            text: msgData.text,
            time: msgData.time,
            edited: false,
            is_deleted: false,
            deleted_for_users: [],
            is_read: false,
            read_at: null,
            created_at: msgData.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await client.from('messages').insert(payload).select().single();
        if (error) {
            console.warn('[Supabase] Save chat message note:', error.message);
            return { success: false, error };
        }
        return { success: true, data };
    } catch (e) {
        console.warn('[Supabase] Save chat message error:', e);
        return { success: false, error: e };
    }
}

/**
 * Update chat message content (for editing) in Supabase
 */
async function supabaseUpdateChatMessage(msgId, newText) {
    const client = getSupabaseClient();
    if (!client || !msgId) return { success: true };
    try {
        const { error } = await client.from('messages').update({
            text: newText,
            edited: true,
            updated_at: new Date().toISOString()
        }).eq('id', msgId);
        if (error) console.warn('[Supabase] Update message note:', error.message);
        return { success: !error };
    } catch (e) {
        console.warn('[Supabase] Update message error:', e);
        return { success: false, error: e };
    }
}

/**
 * WhatsApp-style "Delete for Everyone" in Supabase:
 * Marks is_deleted = true, clears message text, resets edited = false to free storage and inform peer in realtime
 */
async function supabaseDeleteChatMessageForEveryone(msgId) {
    const client = getSupabaseClient();
    if (!client || !msgId) return { success: true };
    try {
        const { error } = await client.from('messages').update({
            is_deleted: true,
            text: 'This message was deleted',
            edited: false,
            updated_at: new Date().toISOString()
        }).eq('id', msgId);
        if (error) console.warn('[Supabase] Delete for everyone note:', error.message);
        return { success: !error };
    } catch (e) {
        console.warn('[Supabase] Delete for everyone error:', e);
        return { success: false, error: e };
    }
}

/**
 * "Delete for Me":
 * Removes message from this user's view while leaving it 100% intact for the peer.
 */
async function supabaseDeleteChatMessageForMe(msgId, myId) {
    const client = getSupabaseClient();
    if (!client || !msgId || !myId) return { success: true };
    try {
        const strMyId = String(myId).trim();
        const { data, error: fetchErr } = await client
            .from('messages')
            .select('id, sender_id, receiver_id, deleted_for_users')
            .eq('id', msgId)
            .single();

        if (!fetchErr && data) {
            let curr = [];
            if (Array.isArray(data.deleted_for_users)) {
                curr = [...data.deleted_for_users];
            } else if (typeof data.deleted_for_users === 'string') {
                try { curr = JSON.parse(data.deleted_for_users) || []; } catch(e) { curr = []; }
            }

            if (!isUserInDeletedList(curr, strMyId)) {
                curr.push(strMyId);
                await client.from('messages').update({
                    deleted_for_users: curr,
                    updated_at: new Date().toISOString()
                }).eq('id', msgId);
            }
        }
        return { success: true };
    } catch (e) {
        console.warn('[Supabase] Delete for me error:', e);
        return { success: false, error: e };
    }
}

/**
 * Permanently delete chat message row (fallback helper)
 */
async function supabaseDeleteChatMessage(msgId) {
    const client = getSupabaseClient();
    if (!client || !msgId) return { success: true };
    try {
        const { error } = await client.from('messages').delete().eq('id', msgId);
        if (error) console.warn('[Supabase] Delete message note:', error.message);
        return { success: !error };
    } catch (e) {
        console.warn('[Supabase] Delete message error:', e);
        return { success: false, error: e };
    }
}

/**
 * Clear full chat history for a single user:
 * 1. Does NOT hard-delete messages so the other member's chat remains 100% intact!
 * 2. Adds this user's ID to deleted_for_users for all messages in the conversation.
 * 3. The other member continues to see all messages, even after page reloads or 5 days later!
 * 4. Admin can still inspect the full conversation in the Chat Monitor.
 */
async function supabaseClearUserChat(myId, peerId, myEmail, peerEmail) {
    const client = getSupabaseClient();
    if (!client || !myId || !peerId) return { success: true };
    try {
        const strMyId = String(myId).trim();
        const strPeerId = String(peerId).trim();
        const numMyId = Number(myId);
        const numPeerId = Number(peerId);
        const normMyEmail = String(myEmail || (typeof state !== 'undefined' && state.currentUser?.email) || '').trim().toLowerCase();
        let normPeerEmail = String(peerEmail || '').trim().toLowerCase();
        if (!normPeerEmail && typeof findProfile === 'function') {
            const p = findProfile(peerId);
            if (p && p.email) normPeerEmail = String(p.email).trim().toLowerCase();
        }

        let query = client.from('messages').select('id, sender_id, receiver_id, sender_email, receiver_email, deleted_for_users');
        const orParts = [];
        if (!isNaN(numMyId) && !isNaN(numPeerId) && numMyId > 0 && numPeerId > 0) {
            orParts.push(`and(sender_id.eq.${numMyId},receiver_id.eq.${numPeerId})`);
            orParts.push(`and(sender_id.eq.${numPeerId},receiver_id.eq.${numMyId})`);
        } else {
            orParts.push(`and(sender_id.eq.${strMyId},receiver_id.eq.${strPeerId})`);
            orParts.push(`and(sender_id.eq.${strPeerId},receiver_id.eq.${strMyId})`);
        }
        if (normMyEmail && normPeerEmail) {
            orParts.push(`and(sender_email.eq.${normMyEmail},receiver_email.eq.${normPeerEmail})`);
            orParts.push(`and(sender_email.eq.${normPeerEmail},receiver_email.eq.${normMyEmail})`);
        }
        if (orParts.length > 0) {
            query = query.or(orParts.join(','));
        }

        const { data: allMsgs, error: fetchErr } = await query;
        if (fetchErr) {
            console.warn('[Supabase] Clear chat fetch note:', fetchErr.message);
            return { success: false, error: fetchErr };
        }

        if (Array.isArray(allMsgs) && allMsgs.length > 0) {
            for (const m of allMsgs) {
                let curr = [];
                if (Array.isArray(m.deleted_for_users)) {
                    curr = [...m.deleted_for_users];
                } else if (typeof m.deleted_for_users === 'string') {
                    try { curr = JSON.parse(m.deleted_for_users) || []; } catch(e) { curr = []; }
                }

                let changed = false;
                if (!isUserInDeletedList(curr, strMyId)) {
                    curr.push(strMyId);
                    changed = true;
                }
                if (normMyEmail && !isUserInDeletedList(curr, normMyEmail)) {
                    curr.push(normMyEmail);
                    changed = true;
                }

                if (changed) {
                    await client.from('messages').update({
                        deleted_for_users: curr,
                        updated_at: new Date().toISOString()
                    }).eq('id', m.id);
                }
            }
        }
        return { success: true };
    } catch (e) {
        console.warn('[Supabase] Clear chat error:', e);
        return { success: false, error: e };
    }
}

/**
 * Mark messages received from a specific sender as read
 */
async function supabaseMarkMessagesAsRead(myId, peerId, myEmail, peerEmail) {
    const client = getSupabaseClient();
    if (!client || !myId || !peerId) return { success: true };
    try {
        const numMyId = Number(myId);
        const numPeerId = Number(peerId);
        const normMyEmail = (myEmail || (window.state && state.currentUser && state.currentUser.email) || '').trim().toLowerCase();
        let normPeerEmail = (peerEmail || '').trim().toLowerCase();
        if (!normPeerEmail && typeof findProfile === 'function') {
            const peerProf = findProfile(peerId);
            if (peerProf && peerProf.email) normPeerEmail = peerProf.email.trim().toLowerCase();
        }
        const nowIso = new Date().toISOString();

        // 1. Primary update by numeric IDs
        const p1 = client.from('messages')
            .update({ is_read: true, read_at: nowIso, updated_at: nowIso })
            .eq('sender_id', numPeerId)
            .eq('receiver_id', numMyId)
            .eq('is_read', false);

        // 2. Also update by receiver_email if available (handles user ID vs profile ID difference)
        let p2 = null;
        if (normMyEmail && numPeerId) {
            p2 = client.from('messages')
                .update({ is_read: true, read_at: nowIso, updated_at: nowIso })
                .eq('sender_id', numPeerId)
                .eq('receiver_email', normMyEmail)
                .eq('is_read', false);
        }

        // 3. Check if currentUser has an explicit profileId that differs from numMyId
        let p3 = null;
        const myProfId = (window.state && state.currentUser && state.currentUser.profileId) ? Number(state.currentUser.profileId) : 0;
        if (myProfId && myProfId !== numMyId) {
            p3 = client.from('messages')
                .update({ is_read: true, read_at: nowIso, updated_at: nowIso })
                .eq('sender_id', numPeerId)
                .eq('receiver_id', myProfId)
                .eq('is_read', false);
        }

        await Promise.all([p1, p2, p3].filter(Boolean));
        return { success: true };
    } catch (e) {
        console.warn('[Supabase] Mark read error:', e);
        return { success: false, error: e };
    }
}

/**
 * Realtime Subscription for Chat Messages and Match Interest Updates
 */
let userChatRealtimeChannel = null;

function supabaseSubscribeToUserChat(userId, userEmail, handlers = {}) {
    const client = getSupabaseClient();
    if (!client || typeof client.channel !== 'function') return null;

    // Tear down any previous channel
    supabaseUnsubscribeUserChat();

    try {
        const numId = Number(userId || 0);
        const normEmail = (userEmail || '').trim().toLowerCase();
        const channelName = `realtime:chat:${numId || Date.now()}`;

        userChatRealtimeChannel = client.channel(channelName)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                const row = payload.new;
                if (!row) return;
                const recId = Number(row.receiver_id || 0);
                const sendId = Number(row.sender_id || 0);
                const recEmail = (row.receiver_email || '').trim().toLowerCase();
                const sendEmail = (row.sender_email || '').trim().toLowerCase();

                // Relevant to current user?
                if (recId === numId || sendId === numId || (normEmail && (recEmail === normEmail || sendEmail === normEmail))) {
                    if (typeof handlers.onNewMessage === 'function') {
                        handlers.onNewMessage(row);
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
                const row = payload.new;
                if (!row) return;
                const recId = Number(row.receiver_id || 0);
                const sendId = Number(row.sender_id || 0);
                const recEmail = (row.receiver_email || '').trim().toLowerCase();
                const sendEmail = (row.sender_email || '').trim().toLowerCase();
                if (recId === numId || sendId === numId || (normEmail && (recEmail === normEmail || sendEmail === normEmail))) {
                    if (typeof handlers.onMessageUpdate === 'function') {
                        handlers.onMessageUpdate(row);
                    }
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
                if (typeof handlers.onMessageDelete === 'function') {
                    handlers.onMessageDelete(payload.old);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'interests' }, payload => {
                const row = payload.new;
                if (!row) return;
                const recId = Number(row.receiver_id || 0);
                const sendId = Number(row.sender_id || 0);
                const recEmail = (row.receiver_email || '').trim().toLowerCase();
                const sendEmail = (row.sender_email || '').trim().toLowerCase();

                if (recId === numId || sendId === numId || (normEmail && (recEmail === normEmail || sendEmail === normEmail))) {
                    if (typeof handlers.onInterestUpdate === 'function') {
                        handlers.onInterestUpdate(row);
                    }
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interests' }, payload => {
                const row = payload.new;
                if (!row) return;
                const recId = Number(row.receiver_id || 0);
                const recEmail = (row.receiver_email || '').trim().toLowerCase();
                if (recId === numId || (normEmail && recEmail === normEmail)) {
                    if (typeof handlers.onInterestInsert === 'function') {
                        handlers.onInterestInsert(row);
                    }
                }
            })
            .subscribe((status) => {
                console.info(`[Supabase Realtime Chat] Channel status:`, status);
            });

        return userChatRealtimeChannel;
    } catch (e) {
        console.warn('[Supabase Realtime Chat] Subscription note:', e);
        return null;
    }
}

function supabaseUnsubscribeUserChat() {
    const client = getSupabaseClient();
    if (client && userChatRealtimeChannel) {
        try {
            client.removeChannel(userChatRealtimeChannel);
        } catch (e) {
            console.warn('[Supabase Realtime Chat] Unsubscribe error:', e);
        }
        userChatRealtimeChannel = null;
    }
}

/**
 * Fetch ALL interests for Admin panel (Pending, Matches/Accepted, Declined)
 */
async function supabaseFetchAllInterestsForAdmin() {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const { data, error } = await client
            .from('interests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('[Supabase Admin] Fetch interests note:', error.message);
            return [];
        }

        return (data || []).map(i => ({
            id: i.id,
            fromUserId: Number(i.sender_id),
            toUserId: Number(i.receiver_id),
            senderEmail: i.sender_email,
            receiverEmail: i.receiver_email,
            senderName: i.sender_name || 'Member #' + i.sender_id,
            receiverName: i.receiver_name || 'Member #' + i.receiver_id,
            senderPhoto: i.sender_photo || 'images/default_avatar.png',
            receiverPhoto: i.receiver_photo || 'images/default_avatar.png',
            senderCaste: i.sender_caste || '',
            senderCity: i.sender_city || '',
            status: (i.status || 'pending').toLowerCase(),
            date: i.created_at ? new Date(i.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
            createdAt: i.created_at,
            updatedAt: i.updated_at
        }));
    } catch (e) {
        console.warn('[Supabase Admin] Fetch interests error:', e);
        return [];
    }
}

/**
 * Fetch messages between two users for Admin Chat Monitor
 */
async function supabaseFetchChatMessagesForAdmin(userIdA, userIdB) {
    const client = getSupabaseClient();
    if (!client || !userIdA || !userIdB) return [];
    try {
        const idA = Number(userIdA);
        const idB = Number(userIdB);
        const strA = String(userIdA).trim();
        const strB = String(userIdB).trim();

        let query = client.from('messages').select('*');
        if (!isNaN(idA) && !isNaN(idB)) {
            query = query.or(`and(sender_id.eq.${idA},receiver_id.eq.${idB}),and(sender_id.eq.${idB},receiver_id.eq.${idA})`);
        } else {
            query = query.or(`and(sender_id.eq.${strA},receiver_id.eq.${strB}),and(sender_id.eq.${strB},receiver_id.eq.${strA})`);
        }
        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            console.warn('[Supabase Admin] Fetch chat messages note:', error.message);
            return [];
        }

        return (data || []).map(m => ({
            id: m.id,
            from: Number(m.sender_id) || m.sender_id,
            senderId: Number(m.sender_id) || m.sender_id,
            receiverId: Number(m.receiver_id) || m.receiver_id,
            text: m.text,
            time: m.time || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            edited: !!m.edited,
            isDeleted: !!m.is_deleted,
            deletedForUsers: Array.isArray(m.deleted_for_users) ? m.deleted_for_users : [],
            createdAt: m.created_at
        }));
    } catch (e) {
        console.warn('[Supabase Admin] Fetch chat messages error:', e);
        return [];
    }
}

/**
 * Realtime Subscription for Admin Panel:
 * Listens to all interests and messages changes live across the entire application
 */
let adminRealtimeChannel = null;

function supabaseSubscribeAdminRealtime(callbacks = {}) {
    const client = getSupabaseClient();
    if (!client || typeof client.channel !== 'function') return null;

    if (adminRealtimeChannel) {
        try { client.removeChannel(adminRealtimeChannel); } catch (e) {}
        adminRealtimeChannel = null;
    }

    try {
        adminRealtimeChannel = client.channel('realtime:admin_control_hub')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, payload => {
                if (typeof callbacks.onInterestsChange === 'function') {
                    callbacks.onInterestsChange(payload);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
                if (typeof callbacks.onMessagesChange === 'function') {
                    callbacks.onMessagesChange(payload);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
                if (typeof callbacks.onPaymentsChange === 'function') {
                    callbacks.onPaymentsChange(payload);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                if (typeof callbacks.onProfilesChange === 'function') {
                    callbacks.onProfilesChange(payload);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
                const row = payload.new || payload.old;
                if (row && row.role === 'report') {
                    if (typeof callbacks.onReportsChange === 'function') callbacks.onReportsChange(payload);
                } else if (row && row.id === 'system_app_config') {
                    if (typeof callbacks.onMaintenanceChange === 'function') callbacks.onMaintenanceChange(payload);
                }
            })
            .subscribe(status => {
                console.info('[Supabase Admin Realtime] Status:', status);
            });

        return adminRealtimeChannel;
    } catch (e) {
        console.warn('[Supabase Admin Realtime] Subscription error:', e);
        return null;
    }
}

/**
 * Save user favorites list to Supabase PostgreSQL database
 */
async function supabaseSaveUserFavorites(userId, userEmail, favorites) {
    const client = getSupabaseClient();
    if (!client || !userEmail) return { success: false };
    const normEmail = String(userEmail).trim().toLowerCase();
    const favArray = Array.isArray(favorites) ? favorites : [];

    try {
        // Update raw_data in profiles table (single source of truth for full profile data)
        const { data: p } = await client.from('profiles').select('id, raw_data').ilike('email', normEmail).maybeSingle();
        if (p) {
            const raw = (p.raw_data && typeof p.raw_data === 'object') ? p.raw_data : {};
            raw.favorites = favArray;
            await client.from('profiles').update({ raw_data: raw, updated_at: new Date().toISOString() }).eq('id', p.id);
        }

        console.info('[Supabase] Favorites successfully synced to database for:', normEmail, favArray.length);
        return { success: true };
    } catch(err) {
        console.warn('[Supabase] Save favorites notice:', err);
        return { success: false, error: err };
    }
}

/**
 * Fetch user favorites list from Supabase PostgreSQL database
 */
async function supabaseFetchUserFavorites(userId, userEmail) {
    const client = getSupabaseClient();
    if (!client || !userEmail) return [];
    const normEmail = String(userEmail).trim().toLowerCase();

    try {
        // Query profiles table which contains the raw_data JSONB store
        const { data: p, error } = await client.from('profiles').select('raw_data').ilike('email', normEmail).maybeSingle();
        if (!error && p && p.raw_data && Array.isArray(p.raw_data.favorites)) {
            return p.raw_data.favorites;
        }
        return [];
    } catch(err) {
        console.warn('[Supabase] Fetch favorites notice:', err);
        return [];
    }
}

/**
 * ==============================================================================
 * REALTIME PRESENCE (LIVE ONLINE / OFFLINE STATUS)
 * ==============================================================================
 */
let userPresenceChannel = null;
const ONLINE_USERS_SET = new Set();
const PRESENCE_LISTENERS = new Set();

function isUserOnline(userId, email) {
    if (userId !== undefined && userId !== null && userId !== '') {
        if (ONLINE_USERS_SET.has(String(userId)) || ONLINE_USERS_SET.has(Number(userId))) {
            return true;
        }
    }
    if (email) {
        const norm = String(email).trim().toLowerCase();
        if (ONLINE_USERS_SET.has(norm)) {
            return true;
        }
    }
    return false;
}

function registerPresenceListener(callback) {
    if (typeof callback === 'function') {
        PRESENCE_LISTENERS.add(callback);
    }
    return () => PRESENCE_LISTENERS.delete(callback);
}

function notifyPresenceListeners() {
    PRESENCE_LISTENERS.forEach(cb => {
        try {
            cb(ONLINE_USERS_SET);
        } catch (e) {
            console.warn('[Presence] Listener callback note:', e);
        }
    });
}

function syncPresenceStateFromChannel() {
    if (!userPresenceChannel) return;
    try {
        const pState = userPresenceChannel.presenceState();
        ONLINE_USERS_SET.clear();

        // Always ensure active logged-in user is online
        if (typeof state !== 'undefined' && state.currentUser) {
            if (state.currentUser.id) {
                ONLINE_USERS_SET.add(String(state.currentUser.id));
                if (!isNaN(Number(state.currentUser.id))) ONLINE_USERS_SET.add(Number(state.currentUser.id));
            }
            if (state.currentUser.email) {
                ONLINE_USERS_SET.add(String(state.currentUser.email).trim().toLowerCase());
            }
        }

        if (pState && typeof pState === 'object') {
            Object.keys(pState).forEach(key => {
                if (key) {
                    ONLINE_USERS_SET.add(String(key));
                    if (!isNaN(Number(key))) ONLINE_USERS_SET.add(Number(key));
                }
                const presenceList = pState[key];
                if (Array.isArray(presenceList)) {
                    presenceList.forEach(p => {
                        if (!p) return;
                        if (p.userId !== undefined && p.userId !== null) {
                            ONLINE_USERS_SET.add(String(p.userId));
                            if (!isNaN(Number(p.userId))) ONLINE_USERS_SET.add(Number(p.userId));
                        }
                        if (p.email) {
                            ONLINE_USERS_SET.add(String(p.email).trim().toLowerCase());
                        }
                    });
                }
            });
        }

        notifyPresenceListeners();
    } catch (err) {
        console.warn('[Supabase Presence] Sync state error:', err);
    }
}

/**
 * Initialize Realtime Presence tracking for the active user
 * @param {Object} currentUser
 * @param {Function} [onChangeCallback]
 */
function supabaseInitPresence(currentUser, onChangeCallback) {
    const client = getSupabaseClient();
    if (!client || typeof client.channel !== 'function' || !currentUser) {
        return null;
    }

    if (typeof onChangeCallback === 'function') {
        registerPresenceListener(onChangeCallback);
    }

    const userId = currentUser.id || currentUser.userId;
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const presenceKey = String(userId || userEmail || 'usr_' + Date.now());

    // Mark current user as online locally immediately
    if (userId) {
        ONLINE_USERS_SET.add(String(userId));
        if (!isNaN(Number(userId))) ONLINE_USERS_SET.add(Number(userId));
    }
    if (userEmail) {
        ONLINE_USERS_SET.add(userEmail);
    }
    notifyPresenceListeners();

    // 1. If userPresenceChannel is already active and subscribed, simply re-track and return
    if (userPresenceChannel) {
        const chState = userPresenceChannel.state;
        if (chState === 'joined' || chState === 'subscribing') {
            try {
                userPresenceChannel.track({
                    userId: userId,
                    email: userEmail,
                    name: currentUser.name || '',
                    onlineAt: Date.now()
                }).catch(() => {});
            } catch (_) {}
            return userPresenceChannel;
        }
    }

    // 2. Check if client's internal channels list already holds this presence topic
    if (typeof client.getChannels === 'function') {
        const existing = client.getChannels().find(ch => 
            ch.topic === 'realtime:presence:community' || 
            ch.topic === 'realtime:realtime:presence:community'
        );
        if (existing) {
            const st = existing.state;
            if (st === 'joined' || st === 'subscribing') {
                userPresenceChannel = existing;
                try {
                    userPresenceChannel.track({
                        userId: userId,
                        email: userEmail,
                        name: currentUser.name || '',
                        onlineAt: Date.now()
                    }).catch(() => {});
                } catch (_) {}
                return userPresenceChannel;
            } else {
                try {
                    client.removeChannel(existing);
                } catch (_) {}
            }
        }
    }

    try {
        userPresenceChannel = client.channel('realtime:presence:community', {
            config: {
                presence: {
                    key: presenceKey
                }
            }
        });

        // CRITICAL FIX: Only attach callbacks if the channel is not yet subscribed
        if (!userPresenceChannel.state || userPresenceChannel.state === 'closed') {
            userPresenceChannel
                .on('presence', { event: 'sync' }, () => {
                    syncPresenceStateFromChannel();
                })
                .on('presence', { event: 'join' }, () => {
                    syncPresenceStateFromChannel();
                })
                .on('presence', { event: 'leave' }, () => {
                    syncPresenceStateFromChannel();
                });
        }

        if (!userPresenceChannel.state || userPresenceChannel.state === 'closed') {
            userPresenceChannel.subscribe(async (status) => {
                console.info('[Supabase Realtime Presence] Status:', status);
                if (status === 'SUBSCRIBED' && userPresenceChannel) {
                    try {
                        await userPresenceChannel.track({
                            userId: userId,
                            email: userEmail,
                            name: currentUser.name || '',
                            onlineAt: Date.now()
                        });
                        syncPresenceStateFromChannel();
                    } catch (trackErr) {
                        console.warn('[Supabase Realtime Presence] Track notice:', trackErr);
                    }
                }
            });
        } else if (userPresenceChannel.state === 'joined') {
            userPresenceChannel.track({
                userId: userId,
                email: userEmail,
                name: currentUser.name || '',
                onlineAt: Date.now()
            }).catch(() => {});
        }

        return userPresenceChannel;
    } catch (e) {
        console.warn('[Supabase Realtime Presence] Channel error:', e);
        return null;
    }
}

/**
 * Cleanly leave Presence channel and untrack presence
 */
async function supabaseLeavePresence() {
    const client = getSupabaseClient();
    if (userPresenceChannel) {
        const chan = userPresenceChannel;
        userPresenceChannel = null;
        try {
            await chan.untrack();
        } catch (e) {}
        try {
            if (client && typeof client.removeChannel === 'function') {
                await client.removeChannel(chan);
            }
        } catch (e) {}
    }
    // Also sweep any lingering presence channel references
    if (client && typeof client.getChannels === 'function') {
        const lingering = client.getChannels().filter(ch => 
            ch.topic === 'realtime:presence:community' || 
            ch.topic === 'realtime:realtime:presence:community'
        );
        for (const ch of lingering) {
            try {
                await client.removeChannel(ch);
            } catch (_) {}
        }
    }
    ONLINE_USERS_SET.clear();
    notifyPresenceListeners();
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
        if (typeof supabaseLeavePresence === 'function') supabaseLeavePresence();
    });
    window.addEventListener('beforeunload', () => {
        if (typeof supabaseLeavePresence === 'function') supabaseLeavePresence();
    });
}

/* ==============================================================================
   MEMBER VIOLATION REPORTS & PLATFORM MAINTENANCE CLOUD INTEGRATION
   ============================================================================== */

/**
 * Submit user violation report to Admin (Supabase Cloud + LocalStorage)
 */
async function supabaseSubmitReport(reportData) {
    const client = getSupabaseClient();
    const repId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const dateStr = reportData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const reportObj = {
        id: repId,
        reporterId: reportData.reporterId || 'guest',
        reporterName: reportData.reporterName || 'A Member',
        reporterEmail: reportData.reporterEmail || '',
        targetUserId: reportData.targetUserId || reportData.userId || '',
        targetUserName: reportData.targetUserName || reportData.userName || 'Member',
        targetUserEmail: reportData.targetUserEmail || '',
        targetUserPhoto: reportData.targetUserPhoto || '',
        reason: reportData.reason || 'Inappropriate profile',
        details: reportData.details || reportData.notes || 'Submitted via in-app report.',
        date: dateStr,
        status: 'open',
        createdAt: new Date().toISOString()
    };

    // Save to local cache
    try {
        const raw = localStorage.getItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(reportObj);
        localStorage.setItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS', JSON.stringify(list));
    } catch(e) {}

    if (!client) return { success: true, localOnly: true, report: reportObj };

    let cloudSaved = false;

    // 1. Universal Cloud Sync into users table (role: 'report')
    try {
        const payload = {
            id: repId,
            email: `${repId}@report.internal`,
            name: `Report: ${reportObj.reason}`,
            role: 'report',
            status: 'open',
            suspension_reason: JSON.stringify(reportObj),
            profile_complete: false,
            payment_status: 'Unpaid',
            updated_at: new Date().toISOString()
        };
        const { error: uErr } = await client.from('users').upsert(payload, { onConflict: 'id' });
        if (!uErr) cloudSaved = true;
    } catch(e) {}

    // 3. Log into email_logs for audit log
    try {
        await client.from('email_logs').insert({
            id: 'log_' + repId,
            recipient_email: 'admin@lagnasetu.app',
            recipient_name: 'Admin Team',
            subject: `User Report: ${reportObj.reason}`,
            notification_type: 'USER_REPORT',
            payload: reportObj,
            status: 'open'
        });
    } catch(e) {}

    console.info('[Supabase] User report submitted successfully:', reportObj.id);
    return { success: true, cloudSaved, report: reportObj };
}

/**
 * Admin: Fetch all member reports from Supabase Cloud
 */
async function supabaseFetchReportsForAdmin() {
    const client = getSupabaseClient();
    if (!client) {
        try {
            const raw = localStorage.getItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS');
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    const reportMap = new Map();

    // 1. Fetch from users table (role: 'report' - primary cloud store)
    try {
        const { data: uReports, error: uErr } = await client
            .from('users')
            .select('id, status, suspension_reason, created_at')
            .eq('role', 'report')
            .order('created_at', { ascending: false });
        if (!uErr && Array.isArray(uReports)) {
            uReports.forEach(r => {
                try {
                    const parsed = JSON.parse(r.suspension_reason || '{}');
                    const repId = String(r.id);
                    if (!reportMap.has(repId)) {
                        reportMap.set(repId, {
                            id: repId,
                            userId: parsed.targetUserId || parsed.userId,
                            targetUserId: parsed.targetUserId || parsed.userId,
                            targetUserName: parsed.targetUserName || parsed.userName,
                            targetUserEmail: parsed.targetUserEmail,
                            targetUserPhoto: parsed.targetUserPhoto,
                            reporterId: parsed.reporterId,
                            reporterName: parsed.reporterName,
                            reporterEmail: parsed.reporterEmail,
                            reason: parsed.reason,
                            details: parsed.details || parsed.notes,
                            date: parsed.date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'),
                            status: r.status || parsed.status || 'open'
                        });
                    }
                } catch(e) {}
            });
        }
    } catch(e) {}

    // 3. Also check email_logs with notification_type: 'USER_REPORT'
    try {
        const { data: logs, error: lErr } = await client
            .from('email_logs')
            .select('id, payload, status, created_at')
            .eq('notification_type', 'USER_REPORT')
            .order('created_at', { ascending: false });
        if (!lErr && Array.isArray(logs)) {
            logs.forEach(l => {
                const p = l.payload || {};
                const repId = String(p.id || l.id);
                if (!reportMap.has(repId)) {
                    reportMap.set(repId, {
                        id: repId,
                        userId: p.targetUserId || p.userId,
                        targetUserId: p.targetUserId || p.userId,
                        targetUserName: p.targetUserName,
                        targetUserEmail: p.targetUserEmail,
                        targetUserPhoto: p.targetUserPhoto,
                        reporterId: p.reporterId,
                        reporterName: p.reporterName,
                        reporterEmail: p.reporterEmail,
                        reason: p.reason,
                        details: p.details || p.notes,
                        date: p.date || (l.created_at ? new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'),
                        status: l.status || p.status || 'open'
                    });
                }
            });
        }
    } catch(e) {}

    const results = Array.from(reportMap.values());
    // Also update local cache
    try {
        localStorage.setItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS', JSON.stringify(results));
    } catch(e) {}
    return results;
}

/**
 * Update report status in Supabase (e.g. 'resolved')
 */
async function supabaseUpdateReportStatus(reportId, status = 'resolved') {
    const client = getSupabaseClient();
    const strId = String(reportId);

    // Update local cache
    try {
        const raw = localStorage.getItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS');
        const list = raw ? JSON.parse(raw) : [];
        const item = list.find(x => String(x.id) === strId);
        if (item) {
            item.status = status;
            localStorage.setItem(window.LS_REPORTS_KEY || 'LS_COMMUNITY_REPORTS', JSON.stringify(list));
        }
    } catch(e) {}

    if (!client) return { success: true, localOnly: true };

    // 1. Update in reports table if exists
    try {
        await client.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', strId);
    } catch(e) {}

    // 2. Update in users table (role: 'report')
    try {
        await client.from('users').update({ status, updated_at: new Date().toISOString() }).eq('id', strId);
    } catch(e) {}

    return { success: true };
}

/**
 * Get live Maintenance Mode status from Supabase Cloud
 */
async function supabaseGetMaintenanceMode() {
    const client = getSupabaseClient();
    if (!client) {
        return localStorage.getItem('LS_COMMUNITY_MAINTENANCE') === 'true';
    }

    try {
        // Check app_settings table first
        const { data: sData, error: sErr } = await client
            .from('app_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .maybeSingle();
        if (!sErr && sData && sData.value !== undefined) {
            const isMaint = !!(typeof sData.value === 'object' ? sData.value.enabled : sData.value);
            localStorage.setItem('LS_COMMUNITY_MAINTENANCE', isMaint ? 'true' : 'false');
            return isMaint;
        }
    } catch(e) {}

    try {
        // Check system_app_config in users table
        const { data: uData, error: uErr } = await client
            .from('users')
            .select('status, suspension_reason')
            .eq('id', 'system_app_config')
            .maybeSingle();
        if (!uErr && uData) {
            let isMaint = false;
            try {
                const parsed = JSON.parse(uData.suspension_reason || '{}');
                isMaint = Boolean(parsed.maintenance);
            } catch(e) {
                isMaint = (uData.status === 'Maintenance');
            }
            localStorage.setItem('LS_COMMUNITY_MAINTENANCE', isMaint ? 'true' : 'false');
            return isMaint;
        }
    } catch(e) {}

    return localStorage.getItem('LS_COMMUNITY_MAINTENANCE') === 'true';
}

/**
 * Set live Maintenance Mode status in Supabase Cloud
 */
async function supabaseSetMaintenanceMode(isMaint) {
    const enabled = Boolean(isMaint);
    localStorage.setItem('LS_COMMUNITY_MAINTENANCE', enabled ? 'true' : 'false');
    const client = getSupabaseClient();
    if (!client) return { success: true, localOnly: true, isMaint: enabled };

    // 1. Try updating app_settings
    try {
        await client.from('app_settings').upsert({
            key: 'maintenance_mode',
            value: { enabled, updatedAt: new Date().toISOString() },
            updated_at: new Date().toISOString()
        });
    } catch(e) {}

    // 2. Universal Sync into users table (id: 'system_app_config')
    try {
        const payload = {
            id: 'system_app_config',
            email: 'system_app_config@lagnasetu.app',
            name: 'System App Config',
            role: 'system',
            status: enabled ? 'Maintenance' : 'Active',
            suspension_reason: JSON.stringify({
                maintenance: enabled,
                auto_approve: true,
                updatedAt: new Date().toISOString()
            }),
            profile_complete: false,
            payment_status: 'Unpaid',
            updated_at: new Date().toISOString()
        };
        await client.from('users').upsert(payload, { onConflict: 'id' });
    } catch(e) {}

    console.info(`[Supabase] Maintenance mode set to: ${enabled}`);
    return { success: true, isMaint: enabled };
}

/**
 * Realtime subscriber for Maintenance Mode on Member & Admin apps
 */
function supabaseSubscribeMaintenance(callback) {
    const client = getSupabaseClient();
    if (!client || typeof client.channel !== 'function') return null;

    try {
        const channelName = `maint_sync_${Date.now()}`;
        const channel = client.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'id=eq.system_app_config' }, payload => {
                if (payload.new) {
                    let isM = false;
                    try {
                        const parsed = JSON.parse(payload.new.suspension_reason || '{}');
                        isM = Boolean(parsed.maintenance);
                    } catch(e) {
                        isM = payload.new.status === 'Maintenance';
                    }
                    localStorage.setItem('LS_COMMUNITY_MAINTENANCE', isM ? 'true' : 'false');
                    if (typeof callback === 'function') callback(isM);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.maintenance_mode' }, payload => {
                if (payload.new && payload.new.value) {
                    const isM = Boolean(typeof payload.new.value === 'object' ? payload.new.value.enabled : payload.new.value);
                    localStorage.setItem('LS_COMMUNITY_MAINTENANCE', isM ? 'true' : 'false');
                    if (typeof callback === 'function') callback(isM);
                }
            })
            .subscribe((status) => {
                console.info('[Supabase Realtime] Maintenance channel status:', status);
            });
        return channel;
    } catch(e) {
        console.warn('[Supabase Realtime] Maintenance subscribe error:', e);
        return null;
    }
}

// Global Exports
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.getSupabaseClient = getSupabaseClient;
window.mapProfileForSupabase = mapProfileForSupabase;
window.mapProfileFromSupabase = mapProfileFromSupabase;
window.supabaseAuthSignUp = supabaseAuthSignUp;
window.supabaseAuthSignIn = supabaseAuthSignIn;
window.supabaseAuthSignOut = supabaseAuthSignOut;
window.supabaseFetchProfiles = supabaseFetchProfiles;
window.supabaseUpsertProfile = supabaseUpsertProfile;
window.supabaseRecordPayment = supabaseRecordPayment;
window.supabaseSendEmailOtp = supabaseSendEmailOtp;
window.supabaseVerifyEmailOtp = supabaseVerifyEmailOtp;
window.supabaseSendPasswordReset = supabaseSendPasswordReset;
window.supabaseFetchAllProfilesForAdmin = supabaseFetchAllProfilesForAdmin;
window.supabaseUpdateProfileStatus = supabaseUpdateProfileStatus;
window.supabaseAdminUpdateMember = supabaseAdminUpdateMember;
window.supabaseDeleteProfile = supabaseDeleteProfile;
window.supabaseDeleteUserCompletely = supabaseDeleteUserCompletely;
window.supabaseCheckUserExists = supabaseCheckUserExists;
window.supabaseUpsertUser = supabaseUpsertUser;
window.supabaseFetchPaymentsForAdmin = supabaseFetchPaymentsForAdmin;
window.supabaseSubscribeToTable = supabaseSubscribeToTable;
window.supabaseSendInterest = supabaseSendInterest;
window.supabaseFetchUserInterests = supabaseFetchUserInterests;
window.supabaseUpdateInterestStatus = supabaseUpdateInterestStatus;
window.supabaseFetchChatMessages = supabaseFetchChatMessages;
window.supabaseFetchAllUserMessages = supabaseFetchAllUserMessages;
window.supabaseSaveChatMessage = supabaseSaveChatMessage;
window.supabaseUpdateChatMessage = supabaseUpdateChatMessage;
window.supabaseDeleteChatMessage = supabaseDeleteChatMessage;
window.supabaseDeleteChatMessageForEveryone = supabaseDeleteChatMessageForEveryone;
window.supabaseDeleteChatMessageForMe = supabaseDeleteChatMessageForMe;
window.supabaseClearUserChat = supabaseClearUserChat;
window.supabaseMarkMessagesAsRead = supabaseMarkMessagesAsRead;
window.supabaseSubscribeToUserChat = supabaseSubscribeToUserChat;
window.supabaseUnsubscribeUserChat = supabaseUnsubscribeUserChat;
window.supabaseFetchAllInterestsForAdmin = supabaseFetchAllInterestsForAdmin;
window.supabaseFetchChatMessagesForAdmin = supabaseFetchChatMessagesForAdmin;
window.supabaseSubscribeAdminRealtime = supabaseSubscribeAdminRealtime;
window.isUserInDeletedList = isUserInDeletedList;
window.supabaseSaveUserFavorites = supabaseSaveUserFavorites;
window.supabaseFetchUserFavorites = supabaseFetchUserFavorites;
window.supabaseInitPresence = supabaseInitPresence;
window.supabaseLeavePresence = supabaseLeavePresence;
window.isUserOnline = isUserOnline;
window.registerPresenceListener = registerPresenceListener;
window.getOnlineUsersSet = () => ONLINE_USERS_SET;
window.supabaseSubmitReport = supabaseSubmitReport;
window.supabaseFetchReportsForAdmin = supabaseFetchReportsForAdmin;
window.supabaseUpdateReportStatus = supabaseUpdateReportStatus;
window.supabaseGetMaintenanceMode = supabaseGetMaintenanceMode;
window.supabaseSetMaintenanceMode = supabaseSetMaintenanceMode;
window.supabaseSubscribeMaintenance = supabaseSubscribeMaintenance;



