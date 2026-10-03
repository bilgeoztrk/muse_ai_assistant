/**
 * Muse Puzzle - Wix Velo Yönetim Paneli
 *
 * Wix'te konumu: Page Code > Main Pages > YÖNETİM PANELİ
 * Bu kod yalnızca Yönetim Paneli sayfasında çalışır.
 *
 * Gerekli elementler:
 *   #repeater1     → Kayıt listesi (Repeater)
 *   Repeater'ın her satırındaki Text'ler:
 *   #leadNo        → Sıra numarası (1, 2, 3...)
 *   #leadName      → Ad - Soyad
 *   #leadEmail     → E-mail
 *   #leadPhone     → Telefon Numarası
 *   #leadMessage   → Mesaj
 *
 * Kayıtlar en yeniden eskiye sıralanır; en yeni kayıt 1 numaradır.
 */

import { getLeads } from 'backend/museApi.web';

const EMPTY_VALUE = '-';


$w.onReady(async function () {
    $w('#repeater1').onItemReady(($item, lead, index) => {
        $item('#leadNo').text = String(index + 1);
        $item('#leadName').text = lead.name || EMPTY_VALUE;
        $item('#leadEmail').text = lead.email || EMPTY_VALUE;
        $item('#leadPhone').text = lead.phone || EMPTY_VALUE;
        $item('#leadMessage').text = lead.message || EMPTY_VALUE;
    });

    // Editörde eklenen örnek satırlar kayıtlar gelene kadar görünmesin
    $w('#repeater1').data = [];

    const result = await getLeads();
    if (!result.ok) {
        console.error('Yönetim paneli:', result.error);
        return;
    }

    // Repeater her satır için metin türünde benzersiz bir _id ister
    $w('#repeater1').data = result.leads.map((lead) => ({ ...lead, _id: String(lead.id) }));
});
