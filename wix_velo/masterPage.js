/**
 * Muse Puzzle - Wix Velo Site Geneli Kod (Chatbot + Footer İletişim Formu)
 *
 * Wix'te konumu: Page Code > Main Pages > masterPage.js
 * Bu dosyadaki kod tüm sayfalarda çalışır. Header/Footer'daki elementlere
 * yalnızca buradan erişilebilir.
 *
 * Chatbot elementleri (Header'da, sabitlenmiş):
 *   #chatToggle   → Sohbeti açıp kapatan buton
 *   #chatBox      → Sohbet penceresi (aşağıdaki 3 elementi içeren kutu, "Hidden on load" işaretli)
 *   #msgText      → Mesajların göründüğü Text
 *   #msgGiris     → Mesaj yazma kutusu (Text Input)
 *   #msgButton    → Gönder butonu
 *
 * İletişim formu elementleri (Footer'da):
 *   #input4       → Adınız ve Soyadınız (zorunlu)
 *   #input5       → E-posta (isteğe bağlı)
 *   #input6       → Telefon Numarası (zorunlu)
 *   #formMessage  → Mesajınız (isteğe bağlı)
 *   #formButton   → Gönder butonu (ikon buton; yazısı değiştirilmez)
 */

import { session } from 'wix-storage-frontend';
import { sendChatMessage, submitLead, wakeUpServer } from 'backend/museApi.web';

const WELCOME_MESSAGE =
    'Muse Puzzle dünyasına hoş geldiniz. Size ilham verecek bir koleksiyon keşfetmeniz, ' +
    'sevdikleriniz için kusursuz bir hediye bulmanız veya tamamlayıcı çerçevelerimiz ' +
    'hakkında bilgi almanız için buradayım. Size nasıl yardımcı olabilirim?';

const STORAGE_KEY = 'museChatHistory';
const MAX_HISTORY = 10;      // API'ye gönderilen geçmiş mesaj sayısı
const MAX_VISIBLE = 6;       // Ekranda gösterilen son mesaj sayısı
const MAX_STORED = 30;       // Sayfa geçişlerinde saklanan mesaj sayısı

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FORM_FIELD_IDS = ['#input4', '#input5', '#input6', '#formMessage'];

// [{ role: 'user' | 'assistant', content: '...', isError?: true }]
let messages = loadMessages();
let isSending = false;
let typingTimer = null;
let isSubmittingLead = false;


$w.onReady(function () {
    // Sunucuyu ziyaretçi sohbeti açmadan önce uyandır (sonucu beklenmez)
    wakeUpServer();

    setupChat();
    setupLeadForm();
});


// ─────────────────────────────────────────────
// Chatbot
// ─────────────────────────────────────────────

function setupChat() {
    renderMessages();

    $w('#chatToggle').onClick(toggleChat);
    $w('#msgButton').onClick(handleSend);
    $w('#msgGiris').onKeyPress((event) => {
        if (event.key === 'Enter') {
            handleSend();
        }
    });
}


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


// ─────────────────────────────────────────────
// Footer İletişim Formu
// Geri bildirim: hatalı alanlar kırmızı çerçeveyle işaretlenir,
// başarılı gönderimde form temizlenir.
// ─────────────────────────────────────────────

function setupLeadForm() {
    // Boş bırakılırsa Wix bu alanları kırmızı çerçeveyle işaretler
    $w('#input4').required = true;
    $w('#input6').required = true;

    $w('#input5').onCustomValidation((value, reject) => {
        const email = (value || '').trim();
        if (email && !EMAIL_PATTERN.test(email)) {
            reject('Geçerli bir e-posta adresi girin.');
        }
    });

    $w('#formButton').onClick(handleLeadSubmit);
}

async function handleLeadSubmit() {
    if (isSubmittingLead) return;

    const fields = ['#input4', '#input5', '#input6'].map((id) => $w(id));
    if (!fields.every((field) => field.valid)) {
        fields.forEach((field) => field.updateValidityIndication());
        return;
    }

    isSubmittingLead = true;
    $w('#formButton').disable();

    const lead = {
        name: $w('#input4').value.trim(),
        email: ($w('#input5').value || '').trim(),
        phone: $w('#input6').value.trim(),
        message: ($w('#formMessage').value || '').trim(),
    };

    try {
        const result = await submitLead(lead);
        if (result.ok) {
            clearLeadForm();
        } else {
            // Girilen bilgiler silinmez, ziyaretçi tekrar deneyebilir
            console.error('Lead submit failed:', result.error);
        }
    } catch (err) {
        console.error('Lead submit error:', err);
    }

    $w('#formButton').enable();
    isSubmittingLead = false;
}

function clearLeadForm() {
    FORM_FIELD_IDS.forEach((id) => {
        $w(id).value = '';
        $w(id).resetValidityIndication();
    });
}
