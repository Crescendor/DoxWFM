# DoxWFM - Premium Call Center Work Force Manager

Bu proje, çağrı merkezleri için özel olarak optimize edilmiş, modern, şık ve gerçek zamanlı bir **İş Gücü Yönetim (Work Force Manager - WFM)** uygulamasıdır. 
Uygulama, **Node.js/Express** backend ve **React (Vite)** frontend mimarisi üzerine kurulmuş olup, **Railway** platformunda tek tıkla çalıştırılmaya tamamen hazır ve optimize edilmiştir.

---

## 🌟 Öne Çıkan Özellikler

1. **Canlı Durum Monitörü (Dashboard)**:
   - Gerçek zamanlı çağrı merkezi SLA oranları (%85 hedefli alarm sistemi).
   - Canlı kuyruktaki bekleyen çağrı sayısı ve en uzun bekleme süresi (ASA) sayaçları.
   - Temsilcilerin anlık durum kartları (Müsait, Çağrıda, ACW, Mola, Yemek, Eğitim, Toplantı, Çevrimdışı).
   - Temsilcilerin günlük çağrı sayısı, AHT (Ortalama Konuşma Süresi) ve kişisel SLA oranları.
   - **Canlı Simülatör**: Arkada çalışan arka plan görevi sayesinde çağrılar kuyruğa girer, temsilciler çağrıları yanıtlar, konuşma süreleri hesaplanır ve veri tabanı canlı olarak akar.

2. **Haftalık Vardiya Planlayıcı (Scheduler)**:
   - Görsel ve etkileşimli haftalık planlama çizelgesi.
   - Temsilcilerin Gündüz (Morning), Akşam (Evening), Gece (Night) ve İzinli (Off) vardiyalarının planlanması.
   - Vardiya detaylarında planlı Öğle Yemeği ve Kısa Mola saatlerinin tek bir tıkla düzenlenmesi.
   - Dosya tabanlı veri tabanına anında kaydetme.

3. **Müşteri Temsilcisi Yönetimi (Roster CRUD)**:
   - Sisteme yeni müşteri temsilcisi veya süpervizör kaydı ekleme.
   - Temsilci yetkinliklerini (Destek, Satış, Teknik, Şikayet, Fatura vb.) düzenleme.
   - Temsilcilerin profil renklerini ve rollerini özelleştirme, personel çıkarma.

4. **Kişisel Temsilci Portalı (Agent Self-Service)**:
   - Temsilcilerin bugünkü performans karnelerini (çağrı, AHT, SLA) takip edebileceği panel.
   - Günlük planlı mola ve yemek saatlerini izleme.
   - Süpervizör onayına düşen dinamik **Mola ve Yemek onay istekleri** gönderebilme.

5. **Göz Alıcı Tasarım (Glassmorphism Dark Mode)**:
   - Canlı neon HSL renk paletleri ve cam efekti tabanlı modern panel tasarımı.
   - Yumuşak geçişler, puls (nabız) animasyonları ve premium Google Fonts (`Outfit` ve `Inter`).

---

## 🛠️ Yerel Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda test etmek veya çalıştırmak için aşağıdaki adımları izleyin:

1. **Bağımlılıkları Yükleyin**:
   ```bash
   npm install
   ```

2. **Uygulamayı Çalıştırın**:
   Uygulamayı hem frontend hem backend entegre şekilde tek bir komutla ayağa kaldırabilirsiniz:
   ```bash
   npm start
   ```
   Bu komut, React projesini Vite ile derleyecek (`dist/` klasörünü oluşturacak) ve Express sunucusunu `http://localhost:5000` portunda başlatacaktır. Tarayıcınızda bu adrese giderek uygulamayı canlı olarak kullanabilirsiniz!

3. **Geliştirici Modu (Opsiyonel)**:
   Arayüz üzerinde değişiklik yaparken anlık hot-reload avantajı için:
   - Bir terminalde backend sunucusunu başlatın: `npm run server` (Port 5000)
   - Diğer bir terminalde Vite geliştirme sunucusunu başlatın: `npm run dev` (Port 5173)

---

## 🚀 Railway Üzerinden Canlıya Alma (Push)

Proje, Railway entegrasyonu için tamamen hazır hale getirilmiştir. Railway, root düzeyindeki `package.json` dosyasını tarayarak uygulamayı otomatik olarak tanır:

1. Projeyi kendi **GitHub** hesabınızda yeni bir depoya (repository) yükleyin.
2. [Railway.app](https://railway.app/) adresine gidin ve yeni bir proje oluşturun.
3. **"Deploy from GitHub repo"** seçeneğini tıklayarak GitHub deponuzu projeye bağlayın.
4. Railway otomatik olarak `npm start` scriptini tetikleyecek, React uygulamasını derleyecek ve Node sunucusunu canlıya alacaktır.
5. Railway üzerinde **Settings** sekmesinden bir **Public Domain** üreterek WFM sisteminizi internette canlıya açabilirsiniz!
