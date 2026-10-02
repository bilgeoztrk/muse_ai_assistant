/**
 * Muse Puzzle - Wix Velo Chatbot (Site Geneli)
 *
 * Wix'te konumu: Page Code > Main Pages > masterPage.js
 * Bu dosyadaki kod tüm sayfalarda çalışır.
 *
 * Gerekli elementler (hepsi "Show on all pages" olmalı):
 *   #chatToggle  → Sohbeti açıp kapatan buton
 *   #chatBox     → Sohbet penceresi (aşağıdaki 3 elementi içeren kutu, "Hidden on load" işaretli)
 *   #msgText     → Mesajların göründüğü Text
 *   #msgGiris    → Mesaj yazma kutusu (Text Input)
 *   #msgButton   → Gönder butonu
 */

import { session } from 'wix-storage-frontend';
import { sendChatMessage, wakeUpServer } from 'backend/museApi.web';

const WELCOME_MESSAGE =
    'Muse Puzzle dünyasına hoş geldiniz. Size ilham verecek bir koleksiyon keşfetmeniz, ' +
    'sevdikleriniz için kusursuz bir hediye bulmanız veya tamamlayıcı çerçevelerimiz ' +
    'hakkında bilgi almanız için buradayım. Size nasıl yardımcı olabilirim?';

const STORAGE_KEY = 'museChatHistory';
const MAX_HISTORY = 10;      // API'ye gönderilen geçmiş mesaj sayısı
const MAX_VISIBLE = 6;       // Ekranda gösterilen son mesaj sayısı
const MAX_STORED = 30;       // Sayfa geçişlerinde saklanan mesaj sayısı

// [{ role: 'user' | 'assistant', content: '...', isError?: true }]
let messages = loadMessages();
let isSending = false;
let typingTimer = null;


$w.onReady(function () {
    // Sunucuyu ziyaretçi sohbeti açmadan önce uyandır (sonucu beklenmez)
    wakeUpServer();

    renderMessages();

    $w('#chatToggle').onClick(toggleChat);
    $w('#msgButton').onClick(handleSend);
    $w('#msgGiris').onKeyPress((event) => {
        if (event.key === 'Enter') {
            handleSend();
        }
    });
});


// ─────────────────────────────────────────────
// Aç / Kapat
// ─────────────────────────────────────────────

function toggleChat() {
    const chatBox = $w('#chatBox');

    if (chatBox.hidden) {
        chatBox.show('fade', { duration: 200 }).then(() => $w('#msgGiris').focus());
    } else {
        chatBox.hide('fade', { duration: 200 });
    }
}


// ─────────────────────────────────────────────
// Mesaj Gönderme
// ─────────────────────────────────────────────

async function handleSend() {
    if (isSending) return;

    const message = ($w('#msgGiris').value || '').trim();
    if (!message) return;

    isSending = true;
    $w('#msgGiris').value = '';
    $w('#msgButton').disable();

    // Hata mesajları yapay zekaya geçmiş olarak gönderilmez
    const history = messages
        .filter((m) => !m.isError)
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

    messages.push({ role: 'user', content: message });
    startTyping();

    try {
        const result = await sendChatMessage(message, history);
        if (result.ok) {
            messages.push({ role: 'assistant', content: result.response });
        } else {
            messages.push({ role: 'assistant', content: result.error, isError: true });
        }
    } catch (err) {
        console.error('Chat error:', err);
        messages.push({
            role: 'assistant',
            content: 'Bağlantı hatası. Lütfen tekrar deneyin.',
            isError: true,
        });
    }

    stopTyping();
    saveMessages();
    renderMessages();

    isSending = false;
    $w('#msgButton').enable();
    $w('#msgGiris').focus();
}


// ─────────────────────────────────────────────
// Ekrana Yazdırma
// ─────────────────────────────────────────────

function renderMessages(typingLine) {
    const lines = [{ role: 'assistant', content: WELCOME_MESSAGE }, ...messages]
        .slice(-MAX_VISIBLE)
        .map((m) => `${m.role === 'user' ? 'Siz' : 'Muse'}: ${m.content}`);

    if (typingLine) {
        lines.push(typingLine);
    }

    $w('#msgText').text = lines.join('\n\n');
}

// "Muse yazıyor." → "Muse yazıyor.." → "Muse yazıyor..." döngüsü
function startTyping() {
    let dots = 1;
    renderMessages('Muse yazıyor.');
    typingTimer = setInterval(() => {
        dots = (dots % 3) + 1;
        renderMessages(`Muse yazıyor${'.'.repeat(dots)}`);
    }, 400);
}

function stopTyping() {
    clearInterval(typingTimer);
    typingTimer = null;
}


// ─────────────────────────────────────────────
// Sayfalar Arası Sohbet Geçmişi
// ─────────────────────────────────────────────

function loadMessages() {
    try {
        const saved = JSON.parse(session.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (err) {
        return [];
    }
}

function saveMessages() {
    messages = messages.slice(-MAX_STORED);
    try {
        session.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
        // Depolama dolu veya kapalıysa sohbet yine çalışır, sadece sayfa geçişinde sıfırlanır
    }
}
