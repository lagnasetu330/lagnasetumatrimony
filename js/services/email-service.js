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
function renderEmailAvatar(photoUrl, name, size = 88, borderColor = '#7B2CBF') {
    const initials = (name || 'LS')
        .trim()
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'LS';

    const cleanPhoto = (photoUrl && typeof photoUrl === 'string') ? photoUrl.trim() : '';

    // Check if valid image URL is available
    if (cleanPhoto && (cleanPhoto.startsWith('http://') || cleanPhoto.startsWith('https://'))) {
        let finalUrl = cleanPhoto;
        // Apply face-center cropping if Cloudinary URL
        if (finalUrl.includes('res.cloudinary.com') && !finalUrl.includes('c_fill')) {
            finalUrl = finalUrl.replace('/upload/', `/upload/c_fill,g_face,w_${size * 2},h_${size * 2},q_auto,f_auto/`);
        }
        return `
          <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" valign="middle">
                <img src="${finalUrl}" alt="${safeEmailText(name)}" width="${size}" height="${size}" align="center" style="width:${size}px;height:${size}px;border-radius:20px;object-fit:cover;display:block;margin:0 auto;border:2.5px solid ${borderColor};box-shadow:0 6px 18px rgba(123,44,191,0.18);" />
              </td>
            </tr>
          </table>
        `;
    }

    // High-Class Royal Purple Monogram (Perfect Center Alignment on All Clients)
    return `
      <table border="0" cellpadding="0" cellspacing="0" align="center" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:20px;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);margin:0 auto;box-shadow:0 6px 18px rgba(123,44,191,0.22);text-align:center;">
        <tr>
          <td align="center" valign="middle" width="${size}" height="${size}" style="width:${size}px;height:${size}px;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${Math.round(size * 0.36)}px;font-weight:800;letter-spacing:1px;line-height:${size}px;text-align:center;vertical-align:middle;">
            ${initials}
          </td>
        </tr>
      </table>
    `;
}

/**
 * Generate Branded Lagna Setu Email HTML Wrapper (100% Uniform with App UI)
 */
function wrapEmailTemplate(title, preheader, bodyContent) {
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
      .header-pad { padding: 24px 18px 20px !important; }
      .content-pad { padding: 24px 18px !important; }
      .btn-action { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:28px 12px;background-color:#FAF8FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader Text (Hidden Preview) -->
  <span style="display:none;font-size:1px;color:#FAF8FC;max-height:0px;overflow:hidden;mso-hide:all;">${safeEmailText(preheader)}</span>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="520" style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(123,44,191,0.08);border:1px solid #ECE5F5;">
          
          <!-- BRAND HEADER (Clean, Elegant & Simple) -->
          <tr>
            <td class="header-pad" align="center" style="padding:32px 24px 22px;text-align:center;border-bottom:1px solid #F3EDF8;background:#ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center">
                    <div style="width:46px;height:46px;line-height:46px;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);border-radius:12px;color:#ffffff;font-size:18px;font-weight:800;text-align:center;margin:0 auto 10px;box-shadow:0 4px 14px rgba(123,44,191,0.22);letter-spacing:0.5px;">
                      LS
                    </div>
                    <div style="font-size:21px;font-weight:800;color:#202124;letter-spacing:-0.2px;line-height:1.2;">
                      Lagna Setu
                    </div>
                    <div style="font-size:12.5px;font-weight:500;color:#726E7A;margin-top:3px;">
                      Gujarati Matrimony Community
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td class="content-pad" style="padding:32px 36px 28px;background-color:#ffffff;color:#202124;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#FAF8FC;padding:20px 24px;text-align:center;font-size:12px;color:#726E7A;border-top:1px solid #ECE5F5;line-height:1.6;">
              <p style="margin:0 0 4px 0;font-weight:700;color:#202124;">Lagna Setu Help &amp; Support</p>
              <p style="margin:0 0 6px 0;">Need assistance? Email: <a href="mailto:lagnasetu330@gmail.com" style="color:#7B2CBF;text-decoration:none;font-weight:700;">lagnasetu330@gmail.com</a></p>
              <p style="margin:0;font-size:11px;color:#A29DAF;">© ${new Date().getFullYear()} Lagna Setu Matrimony Community. All rights reserved.</p>
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
    const preheader = `${sender.name} (${sender.community || sender.caste || 'Member'}) has expressed interest in your profile on Lagna Setu!`;
    const appLink = EMAIL_CONFIG.appUrl;

    const avatarHtml = renderEmailAvatar(sender.photo || sender.img, sender.name, 88, '#7B2CBF');

    const body = `
      <div style="font-size:18px;font-weight:700;color:#202124;margin-bottom:8px;">
        Hello ${safeEmailText(receiver.name)},
      </div>
      
      <p style="font-size:14.5px;line-height:1.6;color:#5F5B67;margin:0 0 22px 0;">
        Great news! A verified member on Lagna Setu has expressed interest in your profile by sending an <b style="color:#7B2CBF;">"I'm Interested"</b> request.
      </p>

      <!-- Member Profile Card (Centered, Balanced & Mobile-Optimized) -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FAF8FC;border:1px solid #ECE5F5;border-radius:18px;margin-bottom:24px;">
        <tr>
          <td align="center" style="padding:26px 20px;text-align:center;">
            
            <!-- 1. Centered Avatar -->
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px auto;">
              <tr>
                <td align="center">
                  ${avatarHtml}
                </td>
              </tr>
            </table>

            <!-- 2. Verified Badge -->
            <div style="margin-bottom:10px;text-align:center;">
              <span style="display:inline-block;background:#E7F5EC;color:#2E9D62;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.3px;">
                ✓ Verified Profile
              </span>
            </div>
            
            <!-- 3. Member Name & Age -->
            <h3 style="font-size:19px;font-weight:700;color:#202124;margin:0 0 14px 0;text-align:center;">
              ${safeEmailText(sender.name)}${sender.age ? ', ' + safeEmailText(sender.age) + ' Yrs' : ''}
            </h3>
            
            <!-- 4. Member Details Box -->
            <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width:400px;background:#ffffff;border:1px solid #ECE5F5;border-radius:12px;margin:0 auto;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#5F5B67;line-height:1.7;text-align:left;">
                  <div><b style="color:#202124;">Community:</b> ${safeEmailText(sender.caste || sender.community || 'Community Member')}</div>
                  <div><b style="color:#202124;">Education &amp; Work:</b> ${safeEmailText(sender.education || 'Graduate')} · ${safeEmailText(sender.occ || sender.occupation || 'Professional')}</div>
                  <div><b style="color:#202124;">Location:</b> ${safeEmailText(sender.city || sender.village || 'Gujarat')}${sender.district ? ', ' + safeEmailText(sender.district) : ''}</div>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);color:#FFFFFF !important;text-decoration:none;padding:13px 34px;border-radius:12px;font-size:14.5px;font-weight:700;box-shadow:0 4px 14px rgba(123,44,191,0.25);">
          View Profile &amp; Respond
        </a>
      </div>

      <!-- Family Guidance / Safety Tip -->
      <div style="background:#FAF8FC;border-left:3px solid #7B2CBF;border-radius:8px;padding:12px 16px;font-size:12.5px;color:#726E7A;line-height:1.55;">
        💡 <b>Next Steps:</b> Log in to Lagna Setu to view their full family background and photo gallery. If you find the match suitable, simply accept to unlock safe text chat immediately.
      </div>
    `;

    return {
        subject: `💍 [Lagna Setu] ${sender.name} has expressed interest in your profile`,
        html: wrapEmailTemplate(title, preheader, body)
    };
}

/**
 * 2. Template: Interest Accepted (Sent to Sender when Receiver clicks "Accept")
 */
function getInterestAcceptedEmailHtml(sender, receiver) {
    const title = `🎉 Good News! Your Interest was Accepted!`;
    const preheader = `Congratulations! ${receiver.name} has accepted your interest request on Lagna Setu. Safe Chat is now unlocked!`;
    const appLink = EMAIL_CONFIG.appUrl + (EMAIL_CONFIG.appUrl.includes('?') ? '&' : '?') + 'tab=chat';

    const avatarHtml = renderEmailAvatar(receiver.photo || receiver.img, receiver.name, 88, '#2E9D62');

    const body = `
      <div style="font-size:18px;font-weight:700;color:#202124;margin-bottom:8px;">
        Congratulations ${safeEmailText(sender.name)}! 🎉
      </div>
      
      <p style="font-size:14.5px;line-height:1.6;color:#5F5B67;margin:0 0 22px 0;">
        We are delighted to let you know that <b style="color:#7B2CBF;">${safeEmailText(receiver.name)}</b> has accepted your <b>"I'm Interested"</b> request!
      </p>

      <!-- Matched Profile Card (Centered, Balanced & Mobile-Optimized) -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FAF8FC;border:1px solid #D1F2D9;border-radius:18px;margin-bottom:24px;">
        <tr>
          <td align="center" style="padding:26px 20px;text-align:center;">
            
            <!-- 1. Centered Avatar -->
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px auto;">
              <tr>
                <td align="center">
                  ${avatarHtml}
                </td>
              </tr>
            </table>

            <!-- 2. Accepted Badge -->
            <div style="margin-bottom:10px;text-align:center;">
              <span style="display:inline-block;background:#E7F5EC;color:#2E9D62;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.3px;">
                ✓ Match Accepted · Chat Unlocked
              </span>
            </div>
            
            <!-- 3. Member Name -->
            <h3 style="font-size:19px;font-weight:700;color:#202124;margin:0 0 10px 0;text-align:center;">
              ${safeEmailText(receiver.name)}${receiver.age ? ', ' + safeEmailText(receiver.age) + ' Yrs' : ''}
            </h3>
            
            <!-- 4. Member Details Box -->
            ${(receiver.caste || receiver.city || receiver.occupation) ? `
            <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width:400px;background:#ffffff;border:1px solid #ECE5F5;border-radius:12px;margin:0 auto 14px auto;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#5F5B67;line-height:1.7;text-align:left;">
                  ${receiver.caste ? `<div><b style="color:#202124;">Community:</b> ${safeEmailText(receiver.caste)}</div>` : ''}
                  ${receiver.education || receiver.occupation ? `<div><b style="color:#202124;">Education &amp; Work:</b> ${safeEmailText(receiver.education || 'Graduate')}${receiver.occupation ? ' · ' + safeEmailText(receiver.occupation) : ''}</div>` : ''}
                  ${receiver.city ? `<div><b style="color:#202124;">Location:</b> ${safeEmailText(receiver.city)}${receiver.district ? ', ' + safeEmailText(receiver.district) : ''}</div>` : ''}
                </td>
              </tr>
            </table>` : ''}

            <div style="font-size:13.5px;color:#2E9D62;font-weight:700;margin-bottom:6px;text-align:center;">
              🎉 Safe text messaging is now unlocked!
            </div>
            
            <p style="margin:0;font-size:13px;color:#5F5B67;line-height:1.6;text-align:center;max-width:380px;">
              You can now visit Lagna Setu to start a direct, respectful conversation with this member.
            </p>

          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #2E9D62 0%, #1E7E48 100%);color:#FFFFFF !important;text-decoration:none;padding:13px 34px;border-radius:12px;font-size:14.5px;font-weight:700;box-shadow:0 4px 14px rgba(46,157,98,0.28);">
          💬 Start Chatting on Lagna Setu
        </a>
      </div>

      <!-- Etiquette Tip -->
      <div style="background:#FAF8FC;border-left:3px solid #2E9D62;border-radius:8px;padding:12px 16px;font-size:12.5px;color:#726E7A;line-height:1.55;">
        💬 <b>Conversation Etiquette:</b> Please maintain a polite, clear, and respectful conversation to build positive mutual understanding between both families.
      </div>
    `;

    return {
        subject: `🎉 [Lagna Setu] Good news! ${receiver.name} accepted your interest (Chat Unlocked)`,
        html: wrapEmailTemplate(title, preheader, body)
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
      <div style="font-size:18px;font-weight:700;color:#202124;margin-bottom:8px;">
        Hello ${safeEmailText(sender.name)},
      </div>
      
      <p style="font-size:14.5px;line-height:1.6;color:#5F5B67;margin:0 0 20px 0;">
        Thank you for being an active member of Lagna Setu. We are writing to update you that <b>${safeEmailText(receiver.name)}</b>'s family has reviewed your profile and has politely chosen not to move forward at this time.
      </p>

      <!-- Respectful Reassurance Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FAF8FC;border:1px solid #ECE5F5;border-radius:16px;margin-bottom:24px;">
        <tr>
          <td style="padding:22px 20px;text-align:center;">
            <div style="font-size:26px;margin-bottom:8px;">🕊️</div>
            <h4 style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:#202124;">A Gentle Note on Matchmaking</h4>
            <p style="margin:0;font-size:13.5px;color:#5F5B67;line-height:1.65;max-width:420px;margin:0 auto;">
              In matrimonial partner search, every family considers specific preferences such as horoscope compatibility, sub-caste traditions, or location. A decline is purely a matter of mutual preferences — please do not be discouraged!
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${appLink}" target="_blank" class="btn-action" style="display:inline-block;background:linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%);color:#FFFFFF !important;text-decoration:none;padding:13px 34px;border-radius:12px;font-size:14.5px;font-weight:700;box-shadow:0 4px 14px rgba(123,44,191,0.25);">
          Browse Other Compatible Profiles
        </a>
      </div>

      <!-- Encouragement Box -->
      <div style="background:#FAF8FC;border-left:3px solid #7B2CBF;border-radius:8px;padding:12px 16px;font-size:12.5px;color:#726E7A;line-height:1.55;">
        ✨ <b>Keep Searching:</b> New verified profiles join Lagna Setu every single day. Your ideal life partner is just a step away!
      </div>
    `;

    return {
        subject: `ℹ️ [Lagna Setu] Update on your interest request (${receiver.name})`,
        html: wrapEmailTemplate(title, preheader, body)
    };
}

/**
 * Account Deletion Notification Email
 * Sent by Admin to the member when their account is permanently deleted.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} reason - Admin-entered reason for deletion
 */
async function sendAccountDeletionEmail(toEmail, toName, reason) {
    if (!toEmail) {
        console.warn('[EmailService] sendAccountDeletionEmail: recipient email missing.');
        return { success: false, reason: 'missing_email' };
    }
    const cleanEmail = String(toEmail).trim().toLowerCase();
    const safeName = safeEmailText(toName || 'Member');
    const safeReason = safeEmailText(reason || 'Violation of community guidelines');
    const subject = `Lagna Setu — Important Notice: Your Account Has Been Removed`;

    const bodyContent = `
      <div style="font-size:18px;font-weight:700;color:#202124;margin-bottom:10px;">
        Dear ${safeName},
      </div>
      <p style="font-size:14.5px;line-height:1.65;color:#5F5B67;margin:0 0 20px 0;">
        We regret to inform you that your <b>Lagna Setu</b> matrimony account associated with
        <b style="color:#5A189A;">${cleanEmail}</b> has been <b style="color:#E63946;">permanently removed</b>
        from the Lagna Setu community platform by the administrative team.
      </p>

      <!-- Reason Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%"
        style="background:#FBEAEA;border:1.5px solid #E63946;border-radius:14px;margin-bottom:22px;">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-size:11px;font-weight:700;color:#E63946;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
              📋 Reason for Account Removal
            </div>
            <div style="font-size:14.5px;font-weight:700;color:#202124;line-height:1.55;">
              ${safeReason}
            </div>
          </td>
        </tr>
      </table>

      <p style="font-size:13.5px;line-height:1.65;color:#5F5B67;margin:0 0 20px 0;">
        All your profile information, photos, and activity records have been permanently erased
        from our database as per our community guidelines and data protection policy.
      </p>

      <!-- Contact Support Box -->
      <div style="background:#FAF8FC;border-left:3.5px solid #7B2CBF;border-radius:8px;padding:14px 18px;font-size:13px;color:#5F5B67;line-height:1.6;margin-bottom:20px;">
        <b style="color:#202124;">If you believe this action was taken in error,</b> please write to us and we will review your case:<br>
        <a href="mailto:lagnasetu330@gmail.com?subject=Account%20Removal%20Appeal%20-%20${encodeURIComponent(cleanEmail)}"
          style="color:#7B2CBF;font-weight:700;text-decoration:none;">
          📧 lagnasetu330@gmail.com
        </a>
        &nbsp;·&nbsp;
        <a href="https://wa.me/919726362863?text=Hello%20Lagna%20Setu%20Admin%2C%20I%20want%20to%20appeal%20my%20account%20removal%20for%20${encodeURIComponent(cleanEmail)}"
          target="_blank"
          style="color:#25D366;font-weight:700;text-decoration:none;">
          💬 WhatsApp Support
        </a>
      </div>

      <p style="font-size:12.5px;color:#A29DAF;margin:0;">
        This notification was sent automatically by the Lagna Setu admin team.
        Please do not reply to this email directly — use the contact details above for any queries.
      </p>
    `;

    const html = wrapEmailTemplate('Account Removal Notice — Lagna Setu', `Your Lagna Setu account has been removed. Reason: ${safeReason}`, bodyContent);

    console.info(`[EmailService] 🗑️ Sending account deletion notice to: ${cleanEmail} | Reason: ${safeReason}`);

    // Log to Supabase
    try {
        const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (client) {
            await client.from('email_logs').insert({
                id: 'del_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                recipient_email: cleanEmail,
                recipient_name: toName || '',
                subject: subject,
                notification_type: 'ACCOUNT_DELETED',
                payload: { reason: safeReason, deleted_at: new Date().toISOString() },
                status: 'sent'
            });
        }
    } catch(e) {
        console.warn('[EmailService] email_logs note (deletion):', e);
    }

    // Dispatch via EmailJS
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
            console.info(`[EmailService] ✅ Account deletion email sent to ${cleanEmail}`);
            return { success: true };
        } catch(e) {
            console.warn('[EmailService] Deletion email dispatch note:', e);
            return { success: false, error: e };
        }
    }
    return { success: false, reason: 'emailjs_unconfigured' };
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

    const otpBody = `
      <h2 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #202124;">
        ${titleText}
      </h2>
      <p style="margin: 0 0 22px; font-size: 14.5px; line-height: 1.6; color: #5F5B67;">
        ${bodyIntro}
      </p>

      <!-- OTP CARD -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF8FC; border: 1px solid #ECE5F5; border-radius: 14px; margin: 0 0 22px;">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #7B2CBF; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
              ONE-TIME PASSWORD (OTP)
            </div>
            <div class="otp-code" style="font-size: 38px; font-weight: 800; color: #5A189A; letter-spacing: 7px; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
              ${otpCode}
            </div>
            <div style="font-size: 12px; color: #726E7A; margin-top: 6px;">
              ⏱ Valid for <b>10 minutes</b> · Please do not share this code
            </div>
          </td>
        </tr>
      </table>

      <!-- Security Notice -->
      <div style="background-color: #FAF8FC; border-left: 3px solid #7B2CBF; border-radius: 8px; padding: 12px 16px; font-size: 12.5px; color: #726E7A; line-height: 1.55;">
        🔒 <b>Security Note:</b> If you did not request this verification code, please ignore this email. Your Lagna Setu account remains safe and secure.
      </div>
    `;

    const html = wrapEmailTemplate(titleText, `Your verification code is ${otpCode}`, otpBody);

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
            return { success: false, error: ejsErr };
        }
    }
    return { success: false, reason: 'emailjs_unconfigured' };
}

// Global Window Exports
window.EMAIL_CONFIG = EMAIL_CONFIG;
window.renderEmailAvatar = renderEmailAvatar;
window.getInterestReceivedEmailHtml = getInterestReceivedEmailHtml;
window.getInterestAcceptedEmailHtml = getInterestAcceptedEmailHtml;
window.getInterestDeclinedEmailHtml = getInterestDeclinedEmailHtml;
window.sendMatrimonialEmailNotification = sendMatrimonialEmailNotification;
window.sendOtpEmail = sendOtpEmail;
window.sendAccountDeletionEmail = sendAccountDeletionEmail;
