/**
 * Muse Puzzle - Wix Velo İletişim Formu
 *
 * Wix'te konumu: Page Code > (formun bulunduğu sayfa)
 * Bu kod yalnızca formun bulunduğu sayfada çalışır.
 *
 * Gerekli elementler:
 *   #input4      → Adınız ve Soyadınız (zorunlu)
 *   #input5      → E-posta (isteğe bağlı)
 *   #input6      → Telefon Numarası (zorunlu)
 *   #formButton  → Gönder butonu
 *   #formStatus  → Başarı/hata mesajının göründüğü Text ("Hidden on load" işaretli)
 */

import { submitLead } from 'backend/museApi.web';

const SUCCESS_MESSAGE = 'Bilgileriniz bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.';

let isSubmitting = false;


$w.onReady(function () {
    $w('#formButton').onClick(handleSubmit);
});


async function handleSubmit() {
    if (isSubmitting) return;

    const lead = {
        name: ($w('#input4').value || '').trim(),
        email: ($w('#input5').value || '').trim(),
        phone: ($w('#input6').value || '').trim(),
    };

    // Backend de kontrol ediyor; burada kontrol etmek ziyaretçiye anında geri bildirim verir
    if (!lead.name || !lead.phone) {
        showStatus('Lütfen adınızı ve telefon numaranızı girin.');
        return;
    }

    isSubmitting = true;
    const button = $w('#formButton');
    const originalLabel = button.label;
    button.label = 'Gönderiliyor...';
    button.disable();
    $w('#formStatus').hide();

    try {
        const result = await submitLead(lead);
        if (result.ok) {
            clearForm();
            showStatus(SUCCESS_MESSAGE);
        } else {
            showStatus(result.error);
        }
    } catch (err) {
        console.error('Lead submit error:', err);
        showStatus('Bağlantı hatası. Lütfen tekrar deneyin.');
    }

    button.label = originalLabel;
    button.enable();
    isSubmitting = false;
}


function showStatus(message) {
    $w('#formStatus').text = message;
    $w('#formStatus').show('fade', { duration: 200 });
}

function clearForm() {
    ['#input4', '#input5', '#input6'].forEach((id) => {
        $w(id).value = '';
        $w(id).resetValidityIndication();
    });
}
