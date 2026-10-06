/* ============================================================
   MANGAL SETU MATRIMONY — CLIENT SECURITY GUARD (TESTING MODE)
   Note: Right-click, F12, and Developer Tools are KEPT ENABLED
   for active development & testing so console errors can be inspected and fixed.
   Production Lockdown will be activated when the app is completely finalized.
   ============================================================ */

(function () {
    'use strict';

    // Development & Testing Mode is ACTIVE:
    // Right-Click, F12, and Developer Tools are fully allowed for testing.
    var IS_DEV_TESTING_MODE = true;

    if (IS_DEV_TESTING_MODE) {
        // Clean notification in console
        setTimeout(function () {
            try {
                console.info('%c Mangal Setu Matrimony %c Testing Mode Active — Inspect & Console enabled',
                    'color:#fff;background:#e63946;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
                    'color:#1e1b4b;background:#e2e8f0;padding:4px 8px;border-radius:0 4px 4px 0;font-weight:600;'
                );
            } catch (_) {}
        }, 800);
        return;
    }

    // --- Production Lockdown (disabled during testing) ---
    document.addEventListener('contextmenu', function (e) {
        var tag = e.target ? e.target.tagName : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
})();
