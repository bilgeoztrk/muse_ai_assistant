/**
 * Muse Puzzle - Wix Velo Backend Module
 *
 * Wix'te konumu: Backend > museApi.web.js
 *
 * Render'daki Flask API'si ile konuşan tek yer burasıdır. Sayfa kodu API'ye
 * doğrudan istek atmaz; bu fonksiyonları çağırır. Böylece API adresi tarayıcıda
 * görünmez ve CORS sorunu yaşanmaz.
 */

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';

const API_BASE = 'https://muse-ai-assistant-wjam.onrender.com';
const MAX_HISTORY = 10;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const CHAT_ERROR = 'Şu anda yanıt veremiyorum. Lütfen birkaç saniye sonra tekrar deneyin.';
const LEAD_ERROR = 'Talebiniz şu anda iletilemedi. Lütfen daha sonra tekrar deneyin.';


async function postJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    let data = {};
    try {
        data = await res.json();
    } catch (err) {
        // Yanıt JSON değilse (ör. Render hata sayfası) boş nesneyle devam et
    }

    return { ok: res.ok, data };
}


/**
 * Render ücretsiz planda uyuyan sunucuyu uyandırır.
 * Ziyaretçi mesaj yazana kadar sunucunun hazır olması için sayfa açılışında çağrılır.
 */
export const wakeUpServer = webMethod(Permissions.Anyone, async () => {
    try {
        const res = await fetch(`${API_BASE}/health`, { method: 'get' });
        return res.ok;
    } catch (err) {
        return false;
    }
});


/**
 * Mesajı yapay zekaya iletir.
 * history: [{ role: 'user' | 'assistant', content: '...' }]
 * Dönüş: { ok: true, response } veya { ok: false, error }
 */
export const sendChatMessage = webMethod(Permissions.Anyone, async (message, history) => {
    const text = String(message || '').trim();
    if (!text) {
        return { ok: false, error: 'Lütfen bir mesaj yazın.' };
    }

    const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];

    try {
        const { ok, data } = await postJson('/api/chat', { message: text, history: safeHistory });
        if (ok && data.response) {
            return { ok: true, response: data.response };
        }
        console.error('sendChatMessage API error:', data.error);
        return { ok: false, error: CHAT_ERROR };
    } catch (err) {
        console.error('sendChatMessage failed:', err);
        return { ok: false, error: CHAT_ERROR };
    }
});


/**
 * İletişim talebini (lead) kaydeder.
 * lead: { name, phone, email?, message? } — ad ve telefon zorunlu
 * Dönüş: { ok: true, leadId } veya { ok: false, error }
 */
export const submitLead = webMethod(Permissions.Anyone, async (lead) => {
    const cleanName = String(lead?.name || '').trim();
    const cleanPhone = String(lead?.phone || '').trim();
    const cleanEmail = String(lead?.email || '').trim();
    const cleanMessage = String(lead?.message || '').trim();

    if (!cleanName || !cleanPhone) {
        return { ok: false, error: 'Lütfen adınızı ve telefon numaranızı girin.' };
    }

    if (cleanEmail && !EMAIL_PATTERN.test(cleanEmail)) {
        return { ok: false, error: 'Lütfen geçerli bir e-posta adresi girin.' };
    }

    try {
        const { ok, data } = await postJson('/api/leads', {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            message: cleanMessage,
        });
        if (ok && data.success) {
            return { ok: true, leadId: data.lead_id };
        }
        console.error('submitLead API error:', data.error);
        return { ok: false, error: LEAD_ERROR };
    } catch (err) {
        console.error('submitLead failed:', err);
        return { ok: false, error: LEAD_ERROR };
    }
});
