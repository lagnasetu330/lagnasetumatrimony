/* ============================================================
   MANGAL SETU MATRIMONY — CLIENT SECURITY & ANTI-INSPECT SHIELD
   Comprehensive Frontend Protection:
   1. Blocks Right-Click (contextmenu)
   2. Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
   3. Detects Browser Menu -> More Tools -> Developer Tools
   4. Instantly blurs/hides confidential member data with Security Shield
   5. Wipes console with console.clear() & displays Red Anti-Phishing Warning
   6. Prevents dragging/stealing profile photos
   ============================================================ */

(function () {
    'use strict';

    // 1. Block Context Menu (Right Click) on non-input elements
    document.addEventListener('contextmenu', function (e) {
        var target = e.target;
        var tag = target ? target.tagName : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    }, { capture: true });

    // 2. Block Developer Key Shortcuts
    document.addEventListener('keydown', function (e) {
        // F12 key
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        var isCtrl = e.ctrlKey || e.metaKey; // Windows Ctrl or Mac Cmd

        // Ctrl + Shift + I (Inspect Element)
        // Ctrl + Shift + J (Developer Console)
        // Ctrl + Shift + C (Element Selector)
        if (isCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + U (View Page Source)
        if (isCtrl && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + S (Save Complete Webpage)
        if (isCtrl && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { capture: true });

    // 3. Block Drag-and-Drop photo theft
    document.addEventListener('dragstart', function (e) {
        if (e.target && (e.target.tagName === 'IMG' || e.target.classList.contains('photo-img') || e.target.classList.contains('ravatar'))) {
            e.preventDefault();
            return false;
        }
    }, { capture: true });

    // 4. Console Hacker / Self-XSS Warning Banner
    function showConsoleBanner() {
        try {
            console.log('%c⛔ સાવધાન / STOP!', 'color:#e63946;font-size:38px;font-weight:900;-webkit-text-stroke:1px black;');
            console.log(
                '%cઆ બ્રાઉઝર ફીચર માત્ર ડેવલપર્સ માટે છે. જો કોઈએ તમને અહીં કોઈ કોડ પેસ્ટ કરવાનું કહ્યું હોય, તો તે તમારી પ્રોફાઇલ અને ડેટા ચોરવાનો પ્રયાસ કરી રહ્યો છે.\n\n' +
                'This is a browser feature intended for developers. Pasting code here can compromise your account.',
                'color:#ffffff;background:#1e1b4b;font-size:13.5px;padding:10px 14px;border-radius:8px;line-height:1.6;font-family:sans-serif;'
            );
        } catch (_) {}
    }

    // 5. DevTools Open Detection & Security Shield
    var isShieldVisible = false;

    function getShieldEl() {
        var shield = document.getElementById('devtoolsSecurityShield');
        if (!shield) {
            shield = document.createElement('div');
            shield.id = 'devtoolsSecurityShield';
            shield.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(18,10,32,0.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:2147483647;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;';
            shield.innerHTML =
                '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);padding:32px 28px;border-radius:24px;max-width:480px;box-shadow:0 25px 60px rgba(0,0,0,0.6);">' +
                  '<div style="width:72px;height:72px;border-radius:50%;background:rgba(230,57,70,0.15);border:2px solid #e63946;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">' +
                    '<i class="fa-solid fa-shield-halved" style="font-size:32px;color:#e63946;"></i>' +
                  '</div>' +
                  '<h2 style="font-size:20px;font-weight:800;margin:0 0 10px;color:#fff;">સુરક્ષા કવચ / Privacy Shield</h2>' +
                  '<p style="font-size:13.5px;color:#e2e8f0;line-height:1.6;margin:0 0 14px;">' +
                    'સભ્યોની ગોપનીયતા, દીકરીઓના ફોટોગ્રાફ્સ અને પારિવારિક વિગતોની સુરક્ષા માટે Mangal Setu પર Developer Mode / Inspect પ્રતિબંધિત છે.' +
                  '</p>' +
                  '<p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 22px;">' +
                    'Developer tools are restricted to safeguard member photos and family contact privacy. Please close Developer Tools to continue using the application.' +
                  '</p>' +
                  '<button onclick="window.location.reload()" style="background:#e63946;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(230,57,70,0.4);">' +
                    'Close DevTools &amp; Refresh' +
                  '</button>' +
                '</div>';
            document.body.appendChild(shield);
        }
        return shield;
    }

    function toggleSecurityShield(show) {
        // Allow logged-in admin on admin.html to bypass shield
        var isAdminPage = window.location.pathname.includes('admin') || window.location.href.includes('admin.html');
        var isAdminLoggedIn = sessionStorage.getItem('admin_isLoggedIn') === 'true';
        if (isAdminPage && isAdminLoggedIn) {
            return;
        }

        if (show && !isShieldVisible) {
            isShieldVisible = true;
            var shield = getShieldEl();
            shield.style.display = 'flex';
            try { console.clear(); } catch (_) {}
            showConsoleBanner();
        } else if (!show && isShieldVisible) {
            isShieldVisible = false;
            var shieldEl = document.getElementById('devtoolsSecurityShield');
            if (shieldEl) shieldEl.style.display = 'none';
        }
    }

    // Measure window dimension delta (Detects Docked DevTools at bottom or side)
    function checkDevToolsDimensions() {
        var threshold = 160;
        var widthDiff = (window.outerWidth - window.innerWidth) > threshold;
        var heightDiff = (window.outerHeight - window.innerHeight) > threshold;
        if (widthDiff || heightDiff) {
            toggleSecurityShield(true);
        } else {
            toggleSecurityShield(false);
        }
    }

    // Listen to resize and check periodically
    window.addEventListener('resize', checkDevToolsDimensions, { passive: true });
    setInterval(checkDevToolsDimensions, 1000);

    // Initial console banner display
    setTimeout(showConsoleBanner, 1000);

    console.info('[Security] Mangal Setu Anti-Inspect & Privacy Shield initialized.');
})();
