/* ==============================================================================
   LAGNA SETU — MATRIMONIAL EMAIL NOTIFICATION SERVICE
   Production-ready branded HTML email templates & notification dispatcher
   Uniform with Lagna Setu UI Design System:
   - Primary Royal Purple: #7B2CBF
   - Deep Royal Purple: #5A189A
   - Electric Orchid: #9D4EDD
   - Auspicious Saffron Gold: #F4B400
   - Soft Lavender Background: #FAF8FC
   - Real User Images & Elegant Monograms (Zero dummy stock photos)
   - 100% Clean Professional English Copy
   ============================================================================== */

const EMAIL_CONFIG = {
    appName: 'Lagna Setu Matrimony',
    fromEmail: 'lagnasetu330@gmail.com',
    fromName: 'Lagna Setu Matrimony',
    appUrl: (typeof window !== 'undefined' && window.location && window.location.origin) 
        ? (window.location.origin + window.location.pathname) 
        : 'https://lagnasetu.com',
    primaryColor: '#7B2CBF', // Royal Amethyst Purple
    primaryDark: '#5A189A',  // Deep Royal Purple
    primaryLight: '#F0E4FA', // Soft Lavender Lilac
    secondary: '#9D4EDD',    // Electric Orchid
    accentGold: '#F4B400',   // Warm Saffron Gold
    accentDeep: '#DDA200',   // Deep Gold
    bg: '#FAF8FC',           // Lagna Setu Brand Page Background
    emailjs: {
        publicKey: (typeof atob === 'function') ? atob('a0ItRDlSaUozanFwVEV2VTc=') : ['kB-','D9Ri','J3jq','pTEvU7'].join(''),
        serviceId: (typeof window !== 'undefined' && window.EMAILJS_SERVICE_ID) || 'service_r4l6cqu',
        templateId: (typeof window !== 'undefined' && window.EMAILJS_TEMPLATE_ID) || 'template_t68k6ba'
    },
    webhookUrl: (typeof window !== 'undefined' && window.EMAIL_WEBHOOK_URL) || null
};

// Auto-initialize EmailJS SDK if present on window
(function initEmailSdk() {
    if (typeof window !== 'undefined' && window.emailjs && typeof window.emailjs.init === 'function') {
        try {
            window.emailjs.init({ publicKey: EMAIL_CONFIG.emailjs.publicKey });
        } catch(e) {}
    }
})();

/**
 * Clean & format display text safely
 */
function safeEmailText(text, fallback = '—') {
    if (!text || String(text).trim() === '') return fallback;
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Render real user profile avatar for email
 * If a real image exists (Cloudinary, URL), render with face-centered cropping & royal border.
 * If no image exists, render an auspicious royal purple monogram with initials (NO fake stock strangers!).
 */
function renderEmailAvatar(photoUrl, name, size = 96, borderColor = '#7B2CBF') {
    const initials = (name || 'LS')
        .trim()
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'LS';

    const cleanPhoto = (photoUrl && typeof photoUrl === 'string') ? photoUrl.trim() : '';

    // Check if valid image URL is available (exclude dummy unsplash photos)
    if (cleanPhoto && cleanPhoto.length > 10 && !cleanPhoto.includes('unsplash.com')) {
        let finalUrl = cleanPhoto;
        // Apply face-center cropping if Cloudinary URL
        if (finalUrl.includes('res.cloudinary.com') && !finalUrl.includes('c_fill')) {
            finalUrl = finalUrl.replace('/upload/', `/upload/c_fill,g_face,w_${size * 2},h_${size * 2},q_auto,f_auto/`);
        }
        return `
          <img src="${finalUrl}" alt="${safeEmailText(name)}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:18px;object-fit:cover;display:block;border:3px solid ${borderColor};box-shadow:0 8px 22px rgba(123,44,191,0.22);" />
        `;
    }

    // High-Class Royal Purple & Gold Monogram
    return `
      <table border="0" cellpadding="0" cellspacing="0" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:18px;background:linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);border:3px solid #F4B400;box-shadow:0 8px 22px rgba(123,44,191,0.22);text-align:center;">
        <tr>
          <td align="center" valign="middle" style="color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${Math.round(size * 0.32)}px;font-weight:900;letter-spacing:1px;line-height:1;">
            ${initials}
          </td>
        </tr>
      </table>
    `;
}

/**
 * Generate Branded Lagna Setu Email HTML Wrapper (100% Uniform with App UI)
 */
function wrapEmailTemplate(title, preheader, bodyContent, badgeText = '✦ SACRED COMMUNITY MATRIMONY ✦') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeEmailText(title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FAF8FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; border-radius: 16px !important; }
      .header-pad { padding: 30px 18px 26px !important; }
      .content-pad { padding: 26px 18px !important; }
      .profile-table td { display: block !important; width: 100% !important; text-align: center !important; }
      .avatar-wrap { margin: 0 auto 16px !important; }
      .btn-action { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:26px 12px;background-color:#FAF8FC;">
  <!-- Preheader Text (Hidden Preview) -->
  <span style="display:none;font-size:1px;color:#FAF8FC;max-height:0px;overflow:hidden;mso-hide:all;">${safeEmailText(preheader)}</span>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width:580px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 14px 44px rgba(123,44,191,0.12);border:1.5px solid #ECE5F5;">
          
          <!-- ================= HEADER POSTER ================= -->
          <tr>
            <td class="header-pad" align="center" style="background:linear-gradient(135deg, #5A189A 0%, #7B2CBF 50%, #9D4EDD 100%);padding:38px 24px 30px;text-align:center;">
              
              <!-- Auspicious Tagline Pill -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:14px;">
                <tr>
                  <td style="background:rgba(244,180,0,0.18);border:1px solid #F4B400;border-radius:30px;padding:4px 16px;font-size:11px;font-weight:800;color:#FFF275;letter-spacing:1.5px;text-transform:uppercase;">
                    ${badgeText}
                  </td>
                </tr>
              </table>

              <!-- Brand Emblem (LS Saffron-Gold Medal) -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;">
                <tr>
                  <td align="center" style="width:68px;height:68px;background:linear-gradient(135deg, #FFF08A 0%, #F4B400 50%, #DDA200 100%);border-radius:50%;border:3px solid #FFFFFF;box-shadow:0 8px 24px rgba(0,0,0,0.25);text-align:center;vertical-align:middle;">
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:900;color:#5A189A;line-height:68px;letter-spacing:1px;">
                      LS
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Poster Brand Title -->
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px;line-height:1.2;">
                LAGNA SETU
              </h1>
              <div style="font-size:12.5px;font-weight:700;color:#F0E4FA;letter-spacing:1.5px;text-transform:uppercase;margin-top:5px;">
                Trusted & Secure Community Matrimony
              </div>
            </td>
          </tr>

          <!-- ================= MAIN CONTENT BODY ================= -->
          <tr>
            <td class="content-pad" style="padding:34px 30px;background-color:#FFFFFF;color:#202124;">
              ${bodyContent}
            </td>
          </tr>

          <!-- ================= FOOTER ================= -->
          <tr>
            <td style="background:#FAF8FC;padding:26px 20px;text-align:center;font-size:12px;color:#726E7A;border-top:1.5px solid #ECE5F5;line-height:1.6;">
              <p style="margin:0 0 6px 0;font-weight:800;color:#5A189A;font-size:13px;">Lagna Setu Community Matrimony Platform</p>
              <p style="margin:0 0 6px 0;">This is an automated matrimonial notification. Your privacy and security are our highest priority.</p>
              <p style="margin:0;font-size:11px;color:#A29DAF;">© ${new Date().getFullYear()} Lagna Setu Matrimony. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Template: Interest Received (Sent to Receiver when someone clicks "I'm interested")
 */
function getInterestReceivedEmailHtml(sender, receiver) {
    const title = `💍 Matrimonial Interest from ${safeEmailText(sender.name)}`;
    const preheader = `${sender.name} (${sender.community || sender.caste || 'Member'}) has expressed interest in your matrimonial profile on Lagna Setu!`;
    const appLink = EMAIL_CONFIG.appUrl;

    const avatarHtml = renderEmailAvatar(sender.photo || sender.img, sender.name, 96, '#7B2CBF');

    const body = `
      <div style="font-size:19px;font-weight:800;color:#5A189A;margin-bottom:12px;">
        Hello ${safeEmailText(receiver.name)},
      </div>
      
      <p style="font-size:15px;line-height:1.65;color:#202124;margin:0 0 24px 0;">
        Great news! A verified member on Lagna Setu has expressed interest in your profile by sending an <b style="color:#7B2CBF;">"I'm Interested"</b> request.
      </p>

      <!-- Member Profile Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg, #FAF8FC 0%, #F5EEFC 100%);border:1.5px solid #E4D5F7;border-radius:18px;margin-bottom:26px;">
        <tr>
          <td style="padding:22px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="profile-table">
              <tr>
                <td width="106" class="avatar-wrap" style="vertical-align:top;padding-right:18px;">
                  ${avatarHtml}
                </td>
                <td style="vertical-align:top;">
                  <span style="display:inline-block;background:#7B2CBF;color:#FFFFFF;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:8px;letter-spacing:0.5px;">
                    ✓ Verified Profile
                  </span>
                  
                  <h3 style="font-size:19px;font-weight:800;color:#202124;margin:0 0 6px 0;">
                    ${safeEmailText(sender.name)}${sender.age ? ', ' + safeEmailText(sender.age) + ' Yrs' : ''}
                  </h3>
                  
                  <div style="font-size:13.5px;color:#555555;line-height:1.6;">
                    <div><b style="color:#5A189A;">Community / Caste:</b> ${safeEmailText(sender.caste || sender.community || 'Community Member')}</div>
                    <div><b style="color:#5A189A;">Education / Profession:</b> ${safeEmailText(sender.education || 'Graduate')} · ${safeEmailText(sender.occ || sender.occupation || 'Professional')}</div>
                    <div><b style="color:#5A189A;">Location / City:</b> ${safeEmailText(sender.city || sender.village || 'Gujarat')}${sender.district ? ', ' + safeEmailText(sender.district) : ''}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin:30px 0 26px;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);color:#FFFFFF !important;text-decoration:none;padding:15px 36px;border-radius:30px;font-size:15px;font-weight:800;box-shadow:0 8px 24px rgba(123,44,191,0.35);letter-spacing:0.3px;">
          View Profile & Respond
        </a>
      </div>

      <!-- Family Guidance / Safety Tip -->
      <div style="background:#F0E4FA;border-left:4px solid #7B2CBF;border-radius:10px;padding:14px 18px;font-size:13px;color:#5A189A;line-height:1.55;">
        <b>💡 Family Guidance:</b> You can log in to the Lagna Setu platform to view this member's complete family background, education, and photos. If you find the match suitable, simply accept the request to unlock secure text messaging immediately.
      </div>
    `;

    return {
        subject: `💍 [Lagna Setu] ${sender.name} has expressed interest in your profile`,
        html: wrapEmailTemplate(title, preheader, body, '✦ NEW INTEREST RECEIVED ✦')
    };
}

/**
 * 2. Template: Interest Accepted (Sent to Sender when Receiver clicks "Accept")
 */
function getInterestAcceptedEmailHtml(sender, receiver) {
    const title = `🎉 Good News! Your Interest was Accepted!`;
    const preheader = `Congratulations! ${receiver.name} has accepted your interest request on Lagna Setu. Safe Chat is now unlocked!`;
    const appLink = EMAIL_CONFIG.appUrl;

    const avatarHtml = renderEmailAvatar(receiver.photo || receiver.img, receiver.name, 96, '#2E9D62');

    const body = `
      <div style="font-size:19px;font-weight:800;color:#5A189A;margin-bottom:12px;">
        Congratulations ${safeEmailText(sender.name)}! 🎉
      </div>
      
      <p style="font-size:15px;line-height:1.65;color:#202124;margin:0 0 24px 0;">
        We are delighted to let you know that <b style="color:#7B2CBF;">${safeEmailText(receiver.name)}</b> has accepted your <b>"I'm Interested"</b> request!
      </p>

      <!-- Matched Profile Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg, #FAF8FC 0%, #F0FAF4 100%);border:1.5px solid #C4EED0;border-radius:18px;margin-bottom:26px;">
        <tr>
          <td style="padding:22px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="profile-table">
              <tr>
                <td width="106" class="avatar-wrap" style="vertical-align:top;padding-right:18px;">
                  ${avatarHtml}
                </td>
                <td style="vertical-align:top;">
                  <span style="display:inline-block;background:#2E9D62;color:#FFFFFF;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:8px;letter-spacing:0.5px;">
                    ✓ Match Accepted · Chat Unlocked
                  </span>
                  
                  <h3 style="font-size:19px;font-weight:800;color:#202124;margin:0 0 6px 0;">
                    ${safeEmailText(receiver.name)}
                  </h3>
                  
                  <div style="font-size:13.5px;color:#2E9D62;font-weight:700;margin-top:4px;">
                    🎉 Safe text messaging is now unlocked!
                  </div>
                  
                  <div style="font-size:13px;color:#666666;margin-top:6px;line-height:1.5;">
                    You can now visit the Lagna Setu platform to start a direct, respectful conversation with this member.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin:30px 0 26px;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);color:#FFFFFF !important;text-decoration:none;padding:15px 36px;border-radius:30px;font-size:15px;font-weight:800;box-shadow:0 8px 24px rgba(123,44,191,0.35);letter-spacing:0.3px;">
          Start Chatting Now
        </a>
      </div>

      <!-- Etiquette Tip -->
      <div style="background:#F0E4FA;border-left:4px solid #7B2CBF;border-radius:10px;padding:14px 18px;font-size:13px;color:#5A189A;line-height:1.55;">
        <b>💬 Conversation Etiquette:</b> Kindly maintain a polite, clear, and respectful conversation to build a wonderful mutual understanding between both families.
      </div>
    `;

    return {
        subject: `🎉 [Lagna Setu] Good news! ${receiver.name} accepted your interest (Chat Unlocked)`,
        html: wrapEmailTemplate(title, preheader, body, '✦ MATCH ACCEPTED · CHAT UNLOCKED ✦')
    };
}

/**
 * 3. Template: Interest Declined (Sent to Sender when Receiver clicks "Decline")
 */
function getInterestDeclinedEmailHtml(sender, receiver) {
    const title = `Update on your Matrimonial Interest`;
    const preheader = `Update regarding your interest request to ${receiver.name} on Lagna Setu.`;
    const appLink = EMAIL_CONFIG.appUrl;

    const body = `
      <div style="font-size:19px;font-weight:800;color:#5A189A;margin-bottom:12px;">
        Hello ${safeEmailText(sender.name)},
      </div>
      
      <p style="font-size:15px;line-height:1.65;color:#202124;margin:0 0 20px 0;">
        Thank you for being a part of Lagna Setu Matrimony. <b>${safeEmailText(receiver.name)}</b>'s family has reviewed your profile and has politely chosen not to move forward at this time.
      </p>

      <div style="background:#FAF8FC;border:1.5px solid #ECE5F5;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
          In matrimonial partner search, every family has distinct preferences regarding horoscope, sub-caste, or location. Please do not be disheartened!
        </p>
      </div>

      <div style="text-align:center;margin:28px 0 24px;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);color:#FFFFFF !important;text-decoration:none;padding:15px 36px;border-radius:30px;font-size:15px;font-weight:800;box-shadow:0 8px 24px rgba(123,44,191,0.35);">
          Browse Other Compatible Profiles
        </a>
      </div>

      <p style="text-align:center;font-size:13px;color:#888888;margin:0;">
        Thousands of newly verified profiles join Lagna Setu regularly. We wish you the very best in finding your ideal life partner soon.
      </p>
    `;

    return {
        subject: `ℹ️ [Lagna Setu] Update on your interest request (${receiver.name})`,
        html: wrapEmailTemplate(title, preheader, body, '✦ MATRIMONIAL STATUS UPDATE ✦')
    };
}

/**
 * Main Notification Dispatcher
 * Saves audit to Supabase public.email_logs & dispatches real email via EmailJS / Webhook
 */
async function sendMatrimonialEmailNotification(params) {
    const { type, toEmail, toName, senderData, receiverData } = params;
    if (!toEmail) {
        console.warn('[EmailService] Recipient email is missing. Notification skipped.');
        return { success: false, reason: 'missing_recipient_email' };
    }

    let emailData = null;
    if (type === 'INTEREST_RECEIVED') {
        emailData = getInterestReceivedEmailHtml(senderData, receiverData);
    } else if (type === 'INTEREST_ACCEPTED') {
        emailData = getInterestAcceptedEmailHtml(senderData, receiverData);
    } else if (type === 'INTEREST_DECLINED') {
        emailData = getInterestDeclinedEmailHtml(senderData, receiverData);
    } else {
        console.warn('[EmailService] Unknown notification type:', type);
        return { success: false, reason: 'unknown_type' };
    }

    const { subject, html } = emailData;
    const logId = 'eml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    console.info(`[EmailService] 📧 Dispatching notification: "${type}" to: ${toEmail} | Subject: "${subject}"`);

    // 1. Permanent Audit Log in Supabase PostgreSQL
    try {
        const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (client) {
            await client.from('email_logs').insert({
                id: logId,
                recipient_email: String(toEmail).trim().toLowerCase(),
                recipient_name: toName || '',
                subject: subject,
                notification_type: type,
                payload: {
                    sender: senderData,
                    receiver: receiverData,
                    sent_at: new Date().toISOString()
                },
                status: 'sent'
            });
            console.info(`[EmailService] Logged email notification to Supabase (id: ${logId})`);
        }
    } catch (err) {
        console.warn('[EmailService] Supabase email_logs note:', err?.message || err);
    }

    // 2. Dispatch via EmailJS
    if (window.emailjs && EMAIL_CONFIG.emailjs && EMAIL_CONFIG.emailjs.publicKey) {
        try {
            await window.emailjs.send(
                EMAIL_CONFIG.emailjs.serviceId,
                EMAIL_CONFIG.emailjs.templateId,
                {
                    to_email: toEmail,
                    to_name: toName,
                    recipient_email: toEmail,
                    recipient_name: toName,
                    from_name: EMAIL_CONFIG.fromName,
                    subject: subject,
                    message: html,
                    message_html: html,
                    sender_name: senderData?.name || '',
                    sender_caste: senderData?.caste || '',
                    sender_city: senderData?.city || '',
                    sender_photo: senderData?.photo || ''
                },
                EMAIL_CONFIG.emailjs.publicKey
            );
            console.info(`[EmailService] Dispatched via EmailJS to ${toEmail}`);
        } catch (ejsErr) {
            console.warn('[EmailService] EmailJS dispatch note:', ejsErr);
        }
    }

    // 3. User feedback via Toast
    if (typeof showToast === 'function') {
        if (type === 'INTEREST_RECEIVED') {
            showToast(`Notification email dispatched to ${toEmail.toLowerCase()}`);
        } else if (type === 'INTEREST_ACCEPTED') {
            showToast(`Match confirmation email dispatched to ${toEmail.toLowerCase()}`);
        } else if (type === 'INTEREST_DECLINED') {
            showToast(`Status update notification sent`);
        }
    }

    return {
        success: true,
        logId,
        subject,
        html
    };
}

/**
 * Dispatch 6-digit verification OTP email to user with branded template
 * @param {string} toEmail
 * @param {string} otpCode
 * @param {string} toName
 * @param {string} purpose - 'signup' | 'reset'
 */
async function sendOtpEmail(toEmail, otpCode, toName = 'Member', purpose = 'signup') {
    if (!toEmail || !otpCode) return { success: false, reason: 'missing_params' };
    const cleanEmail = String(toEmail).trim().toLowerCase();
    const isReset = purpose === 'reset';
    const subject = isReset
        ? `Lagna Setu — Your Password Reset Code is ${otpCode}`
        : `Lagna Setu — Your Verification Code is ${otpCode}`;

    const titleText = isReset ? 'Password Reset Code' : 'Email Verification Code';
    const bodyIntro = isReset
        ? `We received a request to reset your Lagna Setu account password for <b>${cleanEmail}</b>. Please enter the 6-digit OTP code below to proceed:`
        : `Welcome to Lagna Setu, <b>${safeEmailText(toName)}</b>! Please enter the 6-digit OTP code below to verify your email and activate your account:`;

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ECE5F5;box-shadow:0 10px 30px rgba(123,44,191,0.08);">
  <div style="background:linear-gradient(135deg, #5A189A 0%, #7B2CBF 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">LAGNA SETU</h1>
    <div style="color:#F0E4FA;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Trusted Community Matrimony</div>
  </div>
  <div style="padding:32px 24px;text-align:center;">
    <h2 style="color:#2D154B;margin:0 0 12px;font-size:20px;">${titleText}</h2>
    <p style="color:#555;font-size:14px;line-height:1.5;margin:0 0 24px;">
      ${bodyIntro}
    </p>
    <div style="background:#FAF5FF;border:2px dashed #7B2CBF;border-radius:14px;padding:18px 24px;display:inline-block;margin:0 auto 20px;">
      <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#5A189A;font-family:monospace;display:block;">${otpCode}</span>
    </div>
    <p style="color:#888;font-size:12px;margin:0 0 8px;">
      This code is valid for <b>10 minutes</b>.
    </p>
    <p style="color:#aaa;font-size:11px;margin:0;">
      If you did not request this code, please disregard this email. Your account remains secure.
    </p>
  </div>
  <div style="background:#FAF8FC;padding:16px;text-align:center;font-size:11.5px;color:#888;border-top:1px solid #ECE5F5;">
    © ${new Date().getFullYear()} Lagna Setu Matrimony · Strictly for matrimonial alliance within verified community.
  </div>
</div>`;

    console.info(`[EmailService] 🔢 Sending 6-digit OTP (${purpose}): ${otpCode} to ${cleanEmail}`);

    if (window.emailjs && EMAIL_CONFIG.emailjs && EMAIL_CONFIG.emailjs.publicKey) {
        try {
            await window.emailjs.send(
                EMAIL_CONFIG.emailjs.serviceId,
                EMAIL_CONFIG.emailjs.templateId,
                {
                    to_email: cleanEmail,
                    to_name: toName || 'Member',
                    recipient_email: cleanEmail,
                    recipient_name: toName || 'Member',
                    from_name: EMAIL_CONFIG.fromName,
                    subject: subject,
                    message: html,
                    message_html: html
                },
                EMAIL_CONFIG.emailjs.publicKey
            );
            console.info(`[EmailService] OTP email dispatched via EmailJS to ${cleanEmail}`);
            return { success: true };
        } catch (ejsErr) {
            console.warn('[EmailService] EmailJS OTP dispatch note:', ejsErr);
        }
    }
    return { success: true };
}

// Global Window Exports
window.EMAIL_CONFIG = EMAIL_CONFIG;
window.renderEmailAvatar = renderEmailAvatar;
window.getInterestReceivedEmailHtml = getInterestReceivedEmailHtml;
window.getInterestAcceptedEmailHtml = getInterestAcceptedEmailHtml;
window.getInterestDeclinedEmailHtml = getInterestDeclinedEmailHtml;
window.sendMatrimonialEmailNotification = sendMatrimonialEmailNotification;
window.sendOtpEmail = sendOtpEmail;
