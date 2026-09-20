# SmartLead AI - Kod Geliştirme Planı

Bu belge, **SmartLead AI** projesi için hazırlanan 10 günlük MVP (Minimum Viable Product) geliştirme yol haritasıdır. Projenin ana felsefesi **Sorumlulukların Ayrılığı (Separation of Concerns)** ilkesine sıkı sıkıya bağlı kalmaktır.

---

## 🏗️ 0. Aşama: Oturum Öncesi Hazırlık (Geliştirme Öncesi)
**Hedef:** Gerekli araçların ve çalışma ortamının kurulması.

- [ ] **Araç Kurulumları:** Python 3.9+ (PATH'e ekli), VS Code ve Git kurulumlarının yapılması.
- [ ] **Hesap Açılışları:** GitHub, Render, Wix ve Groq (console.groq.com) hesaplarının oluşturulması.
- [ ] **API Anahtarı:** Groq üzerinden API anahtarının alınıp güvenli bir yere kaydedilmesi.
- [ ] **Klasör İskeleti:** Aşağıdaki dosya yapısının (içleri boş olacak şekilde) oluşturulması:
  ```text
  smartlead_ai/
  ├── run.py
  ├── config.py
  ├── requirements.txt
  ├── .env
  ├── .gitignore
  └── app/
      ├── __init__.py
      ├── database.py
      ├── routes.py
      ├── templates/
      │   ├── index.html
      │   └── dashboard.html
      └── services/
          ├── __init__.py
          └── ai_service.py
  ```
- [ ] **Sanal Ortam (venv):** `python -m venv venv` komutu ile oluşturulup aktif edilmesi.
- [ ] **Bağımlılıklar:** `requirements.txt` dosyasının hazırlanıp `pip install -r requirements.txt` ile kütüphanelerin kurulması (Flask, requests, python-dotenv, flask-cors vb.).
- [ ] **Duman Testi (Smoke Test):** Basit bir `hello.py` ile Flask ortamının test edilmesi.

---

## 🛠️ 1. Aşama: Backend İnşası (Gün 1 - Gün 6)

### Modül A: Yapılandırma (`config.py`) - Gün 1
**Hedef:** Ayarların ve gizli anahtarların tek merkezden yönetilmesi.
- [ ] `python-dotenv` ile `.env` dosyasının okunması.
- [ ] `Config` sınıfının oluşturulması (`SECRET_KEY`, `DATABASE_URL`, `GROQ_API_KEY`, vb.).
- [ ] Geliştirme ve Üretim için ayrı sınıflar (örn: `DevelopmentConfig`, `ProductionConfig`).
- [ ] `BUSINESS_CONTEXT` sabitinin işletme mantığına göre tanımlanması (AI'ın kişiliği).

### Modül B: Veritabanı (`app/database.py`) - Gün 2
**Hedef:** SQLite veritabanı işlemlerinin izole edilmesi. (SQL KODU SADECE BURADA OLACAK!)
- [ ] `get_db()`: Veritabanı bağlantı fonksiyonunun yazılması.
- [ ] `init_db(app)`: Eğer yoksa `leads` tablosunu oluşturan fonksiyon. *(Şema: id, isim, telefon, mesaj, tarih)*
- [ ] `lead_ekle(isim, telefon, mesaj)`: Yeni kayıt ekleme fonksiyonu (**Önemli:** SQL Injection'ı önlemek için `?` yer tutucusu kullanılacak).
- [ ] `tum_leadler()`: Tüm kayıtları sondan başa (en yeni en üstte) getiren fonksiyon.

### Modül C: Yapay Zekâ Servisi (`app/services/ai_service.py`) - Gün 3-4
**Hedef:** AI çağrılarının izole edilmesi.
- [ ] `AIService` sınıfının oluşturulması.
- [ ] Hata yönetimi için özel `AIServiceError` exception sınıfının tanımlanması.
- [ ] `yanit_uret(mesaj, gecmis)` metodunun yazılması (Groq API'ye `requests.post` ile istek atılması, model: `llama-3.1-8b-instant`).
- [ ] API anahtarı yoksa çökmek yerine güvenli bir "demo modu" mesajı döndürülmesi.

### Modül D: Rotalar (`app/routes.py`) - Gün 5
**Hedef:** HTTP isteklerini karşılayıp ilgili katmanlara yönlendirmek (BURADA SQL VEYA AI KODU OLMAYACAK!).
- [ ] `API` ve `Sayfalar` için iki ayrı Flask Blueprint oluşturulması.
- [ ] **Uç Noktalar (Endpoints):**
  - `GET /` -> Karşılama sayfası (Wix dışı test için)
  - `GET /dashboard` -> Yönetim paneli (Wix dışı test için)
  - `POST /api/sohbet` -> Mesajı alır, `ai_service.yanit_uret()` çağırır.
  - `POST /api/leads` -> İletişim bilgisini alır, `database.lead_ekle()` çağırır.
  - `GET /api/leads` -> Tüm lead'leri JSON olarak döner.
- [ ] `try-except` bloklarıyla hataların yakalanıp güvenli JSON formatında 400, 503, 201 vb. HTTP durum kodlarıyla döndürülmesi.

### Modül E: Fabrika ve Giriş (`app/__init__.py` & `run.py`) - Gün 6
**Hedef:** Uygulama bileşenlerinin birleştirilmesi ve ayağa kaldırılması.
- [ ] `__init__.py`: `create_app()` fonksiyonunun yazılması. Konfigürasyon yükleme, CORS aktivasyonu, `init_db()` çağrısı (app_context içinde) ve Blueprint kayıt işlemleri.
- [ ] `__init__.py`: `/health` (canlılık/ping) uç noktasının eklenmesi.
- [ ] `run.py`: `app = create_app()` ataması yapılarak uygulamanın başlatılması.

---

## 🧪 2. Aşama: Test ve Entegrasyon (Gün 7 - Gün 8)

### Modül F: Çalıştırma ve Test - Gün 7
**Hedef:** Uçtan uca Backend testinin yapılması.
- [ ] Sunucunun `python run.py` ile başlatılması.
- [ ] Tarayıcıda `http://localhost:5000/health` adresinin kontrol edilmesi.
- [ ] Postman veya cURL ile `/api/sohbet` rotasına POST isteği atılarak AI yanıtının test edilmesi.
- [ ] `/api/leads` rotasına POST isteği ile veri kaydedilmesi ve ardından GET isteği ile verinin listelendiğinin teyit edilmesi.

### Modül G: Frontend ve Wix Bağlantısı - Gün 8
**Hedef:** Wix Velo üzerinde arayüzlerin oluşturulması ve Backend API ile konuşturulması.
- [ ] **B2C (Karşılama Sayfası):** Wix üzerinde Z-Pattern ile tasarım. `wix-fetch` kullanarak `/api/sohbet` ve `/api/leads` uç noktalarına istek atacak JavaScript/Velo kodlarının yazılması.
- [ ] **B2B (Yönetim Paneli):** F-Pattern ile tasarım. Wix Repeater bileşeni kullanılarak `/api/leads` uç noktasından gelen verilerin tablo/liste halinde gösterilmesi.
- [ ] *Kritik Kontrol:* Frontend'den gönderilen JSON anahtarları ile Backend'in beklediği parametre adlarının (örn: `isim`, `telefon`) birebir aynı olduğunun kontrolü.

---

## 🚀 3. Aşama: Yayınlama ve Teslim (Gün 9 - Gün 10)

### Modül H: Yayınlama (GitHub + Render) - Gün 9
**Hedef:** Projenin canlı ortama taşınması.
- [ ] Projenin GitHub'a yüklenmesi (**DİKKAT:** `.env` dosyası KESİNLİKLE yüklenmemeli, `.gitignore` kontrol edilmeli).
- [ ] Render.com üzerinde yeni bir "Web Service" oluşturup GitHub reposunun bağlanması.
- [ ] Render Build Command: `pip install -r requirements.txt`
- [ ] Render Start Command: `gunicorn run:app`
- [ ] Çevre değişkenlerinin (`GROQ_API_KEY`, `SECRET_KEY`, vb.) Render paneline eklenmesi.
- [ ] Wix Velo kodlarındaki `localhost` URL'lerinin yeni Render URL'si ile değiştirilmesi.

### Teslimat ve Dokümantasyon - Gün 10
**Hedef:** Projenin bitirilip sunuma hazır hale getirilmesi.
- [ ] `README.md` dosyasının yazılması (Projenin amacı, kurulumu, kullanılan teknolojiler).
- [ ] Son testlerin canlı ortam (Render + Wix) üzerinden yapılması.
- [ ] Değerlendirme kriterlerine göre son kontroller:
  - Sorumlulukların ayrılığı ihlal edilmiş mi?
  - Güvenlik açığı (SQL injection, açık API key) var mı?
  - Hatalar çökme yerine JSON olarak ele alınıyor mu?
- [ ] Demo sunumu için hazırlık yapılması (Proje anlatımı, kod mimarisinin savunulması).