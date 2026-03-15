# 🎓 PolyOS Sınav Gönderme Platformu

![PolyOS Banner](https://img.shields.io/badge/PolyOS-Exam_Platform-6366f1?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

PolyOS, eğitim kurumları için tasarlanmış, modern, hızlı ve güvenli bir sınav yönetim ve dosya gönderim platformudur. Öğretmenlerin sınav oluşturmasına, öğrencilerin dosyalarını yüklemesine ve sonuçların anlık olarak değerlendirilmesine olanak tanır.

---

## ✨ Özellikler

### 👨‍🏫 Öğretman Paneli
- **Gelişmiş Dashboard:** Son aktiviteler, istatistikler ve hızlı işlem menüleri.
- **Sınav Yönetimi:** Klasik (Dosya yüklemeli) veya Quiz (Çoktan seçmeli) sınavlar oluşturma.
- **Canlı Takip:** Sınav süresince öğrenci katılımlarını anlık izleme (+30 dk ek süre verme, sınavı erken bitirme).
- **Notlandırma & Değerlendirme:** Öğrenci yüklemelerini inceleme, geri bildirim verme ve notlandırma.
- **Not Çıktıları:** Tüm notları sınıflara göre filtreleyip **CSV/Excel** formatında dışa aktarma.

### 👨‍🎓 Öğrenci Paneli
- **Kişiselleştirilmiş Ana Sayfa:** Aktif ve yaklaşan sınavları görüntüleme.
- **Güvenli Dosya Yükleme:** Sürükle-bırak desteği ve dosya boyutu kontrolleri.
- **Anlık Bildirimler:** Notlar açıklandığında veya yeni sınav duyurulduğunda bildirim alma.
- **Not Takibi:** Geçmiş sınav sonuçlarını ve hoca geri bildirimlerini inceleme.

### 🛡️ Güvenlik & Teknoloji
- **Passkey Desteği:** Şifresiz, biyometrik giriş imkanı.
- **Modern UI/UX:** Tailwind CSS ve Lucide simgeleriyle premium tasarım (Glassmorphism & animations).
- **Zustand State Management:** Hızlı ve ölçeklenebilir durum yönetimi.
- **Node.js Backend:** Hafif ve hızlı veri işleme.

---

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16+)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/Emiran404/Atoyle.Platfrom.git
   cd sinav-gonderme-platformu
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   # Frontend ve Backend'i aynı anda başlatır
   npm run dev
   ```

4. **Tarayıcıda açın:**
   `http://localhost:5173`
   (Önerimiz: ip adresinizden açın.)

---

## 🛠️ Kullanılan Teknolojiler

| Alan | Teknoloji |
| :--- | :--- |
| **Frontend** | React, Vite, Zustand |
| **Styling** | Tailwind CSS, Framer Motion |
| **Icons** | Lucide React |
| **Backend** | Express.js, Node.js |
| **Auth** | WebAuthn (Passkeys), JWT |
| **Data** | JSON tabanlı hafif veritabanı |

---

## 📸 Ekran Görüntüleri

> [!NOTE]
> Proje içerisindeki `src/assets/screenshots` klasörüne kendi ekran görüntülerinizi ekleyip yolları buraya güncelleyebilirsiniz.

- **Öğretmen Dashboard:** Premium görünümlü istatistik kartları ve aktivite akışı.
- **Değerlendirme Ekranı:** Split-view (yan yana) dosya inceleme ve notlandırma paneli.
- **Öğrenci Sınav Girişi:** Sade ve odaklanmış sınav arayüzü.

---

## 📄 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına göz atın.

---

## 🤝 Katkıda Bulunma

1. Bu depoyu çatallayın (Fork).
2. Özellik dalınızı oluşturun (`git checkout -b feature/yeniozellik`).
3. Değişikliklerinizi kaydedin (`git commit -m 'Yeni özellik eklendi'`).
4. Dalınıza gönderin (`git push origin feature/yeniozellik`).
5. Bir Çekme İsteği (Pull Request) açın.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
