/* ============================================================ HELP & FAQS CONTENT ============================================================ */
const DEFAULT_HOW_IT_WORKS = [
    { title: 'Create account', desc: 'Sign up using your Gmail and a secure password.' },
    { title: 'Personal & family details', desc: 'Add your profile info, plus your family background and hobbies.' },
    { title: 'Address & location', desc: 'Tell us where you\'re based so we can find nearby community matches.' },
    { title: 'Select community', desc: 'Choose your specific caste & community from the verified directory.' },
    { title: 'Upload photos', desc: 'Upload up to 3 high-resolution photos to complete your trusted profile.' },
    { title: 'Mobile OTP verification', desc: 'Confirm your mobile number with a fast, secure 6-digit OTP code.' },
    { title: 'Instant profile activation', desc: 'Your profile goes live immediately for community members to see.' },
    { title: 'Membership pass', desc: 'Community girls: 100% Lifetime Free · Boys: ₹99 for 30 Days Pass.' },
    { title: 'Explore profiles', desc: 'Browse verified eligible brides and grooms from your community.' },
    { title: 'Send interest (5 daily limit)', desc: 'Send up to 5 interest requests per day to profiles you like to keep interactions genuine, safe, and spam-free.' },
    { title: 'Connect & chat', desc: 'Once accepted, connect directly via phone call, WhatsApp, or in-app chat.' }
];

const DEFAULT_FAQS = [
    ['How do I register?', 'Members create an account, verify their phone/email by OTP, select community, and complete personal, family, and address details.'],
    ['Is membership free for girls?', 'Yes! 100% Lifetime Free access is guaranteed for all community girls.'],
    ['How much is the membership pass for boys?', 'Boys get 30 Days Full Access for just ₹99, giving direct contact to verified community brides\' families.'],
    ['How many interest requests can I send per day?', 'To maintain privacy, prevent mass spamming, and ensure serious matrimonial connections, every member (both girls and boys) can send a maximum of 5 interest requests in a 24-hour period.'],
    ['What happens after 30 days of membership?', 'After 30 days, your account remains active, but browsing candidate profiles is locked until you renew the ₹99 pass.'],
    ['How do members contact each other?', 'A member can direct Call or WhatsApp the girl\'s father using the verified contact buttons, or send an in-app interest request to unlock chat.'],
    ['Is a member\'s phone number public?', 'No. A member\'s own mobile number is kept strictly private for Admin review only. Only the father\'s contact number is shown on the public profile.'],
    ['How do multi-photo profiles work?', 'Members can upload up to 3 high-resolution photos. Admin and verified members can view all photos in the photo gallery carousel.'],
    ['How can I contact official Admin support?', 'You can reach our Jasdan administrative cell via WhatsApp or Phone at +91 97263 62863 or email lagnasetu330@gmail.com.']
];

let REMOTE_GUIDE_STEPS = null;
let REMOTE_FAQS = null;
let REMOTE_CONTACT = null;

function getHowItWorksSteps() {
    if (Array.isArray(REMOTE_GUIDE_STEPS) && REMOTE_GUIDE_STEPS.length > 0) {
        return REMOTE_GUIDE_STEPS;
    }
    if (Array.isArray(window.REMOTE_GUIDE_STEPS) && window.REMOTE_GUIDE_STEPS.length > 0) {
        return window.REMOTE_GUIDE_STEPS;
    }
    return DEFAULT_HOW_IT_WORKS;
}

function getFaqs() {
    if (Array.isArray(REMOTE_FAQS) && REMOTE_FAQS.length > 0) {
        return REMOTE_FAQS;
    }
    if (Array.isArray(window.REMOTE_FAQS) && window.REMOTE_FAQS.length > 0) {
        return window.REMOTE_FAQS;
    }
    return DEFAULT_FAQS;
}

/**
 * Fetch FAQs, Guide Steps and Contact Details directly from Supabase app_settings table
 */
async function syncHelpContentFromSupabase() {
    if (typeof supabaseGetAppSetting !== 'function') return;
    try {
        const [faqs, guide, contact] = await Promise.all([
            supabaseGetAppSetting('faqs'),
            supabaseGetAppSetting('guide_steps'),
            supabaseGetAppSetting('contact_details')
        ]);
        if (Array.isArray(faqs) && faqs.length > 0) {
            REMOTE_FAQS = faqs;
            window.REMOTE_FAQS = faqs;
            if (typeof renderFaqs === 'function' && document.getElementById('faqList')) {
                renderFaqs();
            }
        }
        if (Array.isArray(guide) && guide.length > 0) {
            REMOTE_GUIDE_STEPS = guide.map(s => typeof s === 'string' ? { title: s, desc: '' } : s);
            window.REMOTE_GUIDE_STEPS = REMOTE_GUIDE_STEPS;
            if (typeof renderHowItWorks === 'function') {
                renderHowItWorks();
            }
        }
        if (contact && typeof contact === 'object') {
            REMOTE_CONTACT = contact;
            window.REMOTE_CONTACT = contact;
            try {
                localStorage.setItem(LS_CONTACT_KEY, JSON.stringify(contact));
            } catch(e) {}
        }
    } catch(e) {
        console.warn('[Help] syncHelpContentFromSupabase notice:', e);
    }
}


/* ============================================================ HOW IT WORKS & FAQS DYNAMIC RENDER ============================================================ */
function renderHowItWorks() {
    const steps = getHowItWorksSteps();

    // 1. Render inside the Welcome Screen popup modal (#modalGuideSteps)
    const modalWrap = document.getElementById('modalGuideSteps');
    if (modalWrap) {
        modalWrap.innerHTML = steps.map((step, i) => `
            <div class="step-item">
                <div class="snum">${i + 1}</div>
                <div>
                    <div class="stitle">${escapeHtml(step.title || '')}</div>
                    <div class="sdesc">${escapeHtml(step.desc || '')}</div>
                </div>
            </div>
        `).join('');
    }

    // 2. Render inside the in-app How It Works panel screen (#scrHowItWorksContent)
    const screenWrap = document.getElementById('scrHowItWorksContent');
    if (screenWrap) {
        screenWrap.innerHTML = steps.map((step, i) => `
            <div class="step-item"${i === steps.length - 1 ? ' style="margin-bottom:0;"' : ''}>
                <div class="snum">${i + 1}</div>
                <div>
                    <div class="stitle">${escapeHtml(step.title || '')}</div>
                    <div class="sdesc">${escapeHtml(step.desc || '')}</div>
                </div>
            </div>
        `).join('');
    }
}

function renderFaqs(filterQuery = '') {
    const wrap = document.getElementById('faqList');
    if (!wrap) return;

    const allFaqs = getFaqs();
    const q = (filterQuery || '').trim().toLowerCase();
    const faqs = q
        ? allFaqs.filter(([quest, ans]) => quest.toLowerCase().includes(q) || ans.toLowerCase().includes(q))
        : allFaqs;

    if (faqs.length === 0) {
        wrap.innerHTML = `
            <div style="padding:24px 12px;text-align:center;color:var(--text-muted);font-size:13px;">
                <i class="fa-solid fa-magnifying-glass" style="font-size:24px;color:var(--text-faint);margin-bottom:8px;display:block;"></i>
                No matching help articles found.
            </div>
        `;
        return;
    }

    wrap.innerHTML = faqs.map(([quest, ans]) => `
        <div class="faq-item" onclick="this.classList.toggle('open')">
            <div class="faq-q">
                <span>${escapeHtml(quest)}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="faq-a">${escapeHtml(ans)}</div>
        </div>
    `).join('');
}

function filterFaqs(val) {
    renderFaqs(val);
}

function contactSupportAction(type) {
    let contact = { whatsapp: '+91 97263 62863', phone: '+91 97263 62863', email: 'lagnasetu330@gmail.com' };
    if (REMOTE_CONTACT && typeof REMOTE_CONTACT === 'object') {
        if (REMOTE_CONTACT.whatsapp) contact.whatsapp = REMOTE_CONTACT.whatsapp;
        if (REMOTE_CONTACT.phone) contact.phone = REMOTE_CONTACT.phone;
        if (REMOTE_CONTACT.email) contact.email = REMOTE_CONTACT.email;
    } else {
        try {
            const stored = localStorage.getItem(LS_CONTACT_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.whatsapp && !parsed.whatsapp.includes('98765')) contact.whatsapp = parsed.whatsapp;
                if (parsed.phone && !parsed.phone.includes('4000')) contact.phone = parsed.phone;
                if (parsed.email) contact.email = parsed.email;
            }
        } catch(e) {}
    }

    if (type === 'whatsapp') {
        const cleanNumber = contact.whatsapp.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent('Hello Lagna Setu Support, I need help with my account.')}`, '_blank');
    } else if (type === 'phone') {
        window.location.href = `tel:${contact.phone.replace(/[^0-9+]/g, '')}`;
    } else if (type === 'email') {
        window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Support Request — Lagna Setu')}`;
    }
}

// Global Window Exports
if (typeof renderHowItWorks !== 'undefined') window.renderHowItWorks = renderHowItWorks;
if (typeof renderFaqs !== 'undefined') window.renderFaqs = renderFaqs;
if (typeof filterFaqs !== 'undefined') window.filterFaqs = filterFaqs;
if (typeof getFaqs !== 'undefined') window.getFaqs = getFaqs;
if (typeof getHowItWorks !== 'undefined') window.getHowItWorks = getHowItWorks;
if (typeof syncHelpContentFromSupabase !== 'undefined') window.syncHelpContentFromSupabase = syncHelpContentFromSupabase;
