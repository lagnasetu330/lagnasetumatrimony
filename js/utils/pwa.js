/* ============================================================
   LAGNA SETU — PWA (PROGRESSIVE WEB APP) MANAGER
   Features:
   - Service worker registration with instant update check
   - Auto-install prompt ONLY for newly registered accounts
   - Never repeatedly prompt on login/logout
   - Manual install trigger from Menu/Settings for existing users
   - iOS Safari "Add to Home Screen" guidance modal
   - Standalone app detection
   ============================================================ */

(function () {
    'use strict';

    window.deferredPwaPrompt = null;

    // Detect if running in standalone mode (already installed & opened from home screen)
    function isRunningStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
    }

    // Detect iOS devices
    function isIosDevice() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    // 1. REGISTER SERVICE WORKER
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js?v=1.2')
                .then((reg) => {
                    console.log('[PWA] Service Worker registered with scope:', reg.scope);

                    // Check for updates
                    reg.onupdatefound = () => {
                        const installingWorker = reg.installing;
                        if (!installingWorker) return;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] New version available. Refresh to view latest updates.');
                            }
                        };
                    };
                })
                .catch((err) => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
        });
    }

    // 2. CAPTURE INSTALL PROMPT
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar on mobile Chrome
        e.preventDefault();
        window.deferredPwaPrompt = e;
        console.log('[PWA] Captured beforeinstallprompt event.');

        // Update menu item visibility or state
        updatePwaMenuUI();

        // Check if a newly registered user is ready for auto prompt
        checkNewUserAutoPrompt();
    });

    // 3. LISTEN FOR SUCCESSFUL INSTALLATION
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App successfully installed to Home Screen / App Drawer.');
        window.deferredPwaPrompt = null;
        try {
            localStorage.setItem('lagnaSetu_pwa_dismissed', 'true');
            localStorage.setItem('lagnaSetu_pwa_installed', 'true');
        } catch (_) {}

        if (typeof closeModal === 'function') {
            closeModal('modalPwaInstall');
            closeModal('modalIosInstallGuide');
        }

        if (typeof showToast === 'function') {
            showToast('✓ Lagna Setu app successfully added to your home screen!');
        }

        updatePwaMenuUI();
    });

    // 4. CHECK IF NEW USER SHOULD SEE AUTO PROMPT
    // RULE: Only triggers if user JUST created an account and hasn't dismissed yet.
    // NEVER triggers on normal login or logout!
    function checkNewUserAutoPrompt() {
        if (isRunningStandalone()) return;

        let dismissed = false;
        let isJustRegistered = false;

        try {
            dismissed = localStorage.getItem('lagnaSetu_pwa_dismissed') === 'true';
            isJustRegistered = sessionStorage.getItem('lagnaSetu_just_registered') === 'true';
        } catch (_) {}

        // Strictly verify this is a new registration
        if (isJustRegistered && !dismissed) {
            // Give the user 1.5 seconds to settle into the screen before showing the prompt
            setTimeout(() => {
                if (!isRunningStandalone() && typeof openModal === 'function') {
                    openModal('modalPwaInstall');
                    try {
                        sessionStorage.removeItem('lagnaSetu_just_registered');
                    } catch (_) {}
                }
            }, 1500);
        }
    }

    // 5. MANUAL TRIGGER FROM MENU / SETTINGS (FOR OLD & EXISTING USERS)
    window.triggerPwaInstall = function () {
        if (isRunningStandalone()) {
            if (typeof showToast === 'function') {
                showToast('✓ Lagna Setu app is already installed on your device.');
            }
            return;
        }

        // Close user menu first
        if (typeof closeModal === 'function') {
            closeModal('modalMenu');
        }

        // If native beforeinstallprompt is ready
        if (window.deferredPwaPrompt) {
            window.deferredPwaPrompt.prompt();
            window.deferredPwaPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] User accepted the install prompt.');
                    try {
                        localStorage.setItem('lagnaSetu_pwa_dismissed', 'true');
                        localStorage.setItem('lagnaSetu_pwa_installed', 'true');
                    } catch (_) {}
                } else {
                    console.log('[PWA] User dismissed the install prompt.');
                }
                window.deferredPwaPrompt = null;
                updatePwaMenuUI();
            });
            return;
        }

        // If iOS device (Safari doesn't support beforeinstallprompt)
        if (isIosDevice()) {
            if (typeof openModal === 'function') {
                openModal('modalIosInstallGuide');
            }
            return;
        }

        // Otherwise open the custom Lagna Setu Install modal with instructions
        if (typeof openModal === 'function') {
            openModal('modalPwaInstall');
        }
    };

    // 6. DISMISS INSTALL PROMPT
    window.dismissPwaInstall = function () {
        try {
            localStorage.setItem('lagnaSetu_pwa_dismissed', 'true');
            sessionStorage.removeItem('lagnaSetu_just_registered');
        } catch (_) {}
        if (typeof closeModal === 'function') {
            closeModal('modalPwaInstall');
        }
    };

    // 7. SYNC MENU UI (UPDATE TEXT IF INSTALLED)
    function updatePwaMenuUI() {
        const isInstalled = isRunningStandalone() || localStorage.getItem('lagnaSetu_pwa_installed') === 'true';

        // Mobile menu item
        const menuItem = document.getElementById('menuItemInstallApp');
        if (menuItem && isInstalled) {
            const badge = menuItem.querySelector('.badge-new-install');
            if (badge) {
                badge.textContent = 'INSTALLED';
                badge.style.background = 'var(--success, #2a9d8f)';
            }
            const subtext = menuItem.querySelector('.pwa-menu-subtext');
            if (subtext) {
                subtext.textContent = 'App Active';
            }
        }

        // Desktop sidebar button
        const dsBtn = document.getElementById('dsInstallAppBtn');
        if (dsBtn && isInstalled) {
            dsBtn.style.opacity = '0.7';
            dsBtn.title = 'App Installed';
            const span = dsBtn.querySelector('span');
            if (span) span.textContent = 'Installed';
        }
    }

    // Expose functions globally
    window.checkNewUserAutoPrompt = checkNewUserAutoPrompt;
    window.updatePwaMenuUI = updatePwaMenuUI;
    window.isRunningStandalone = isRunningStandalone;

    // Run UI check on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updatePwaMenuUI);
    } else {
        updatePwaMenuUI();
    }
})();
