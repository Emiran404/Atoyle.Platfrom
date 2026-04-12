<div align="center">

<!-- HEADER BANNER -->
![Atolye.Platform Banner](https://camo.githubusercontent.com/383b91998d6c9664260e17c337980f97bcfc164ae9809c20bd5c16b0ee2ca809/68747470733a2f2f62616e6e65722d6170692d616e642d776562736974652d70726f64756374696f6e2d366463642e75702e7261696c7761792e6170702f62616e6e65723f6865616465723d2532312535426e6f6465646f746a732535442b41742543332542366c79652e506c6174666f726d267375626865616465723d25323125354276697465253544412543332541372543342542316b2b6b61796e616b6c2543342542312b6269722b732543342542316e61762b672543332542366e6465726d652b76652b652543342539466974696d2b792543332542366e6574696d2b706c6174666f726d752662673d303030303030303026636f6c6f723d46464646464626737562686561646572636f6c6f723d46464646464626686561646572666f6e743d526f626f746f26737562686561646572666f6e743d4f70656e2b53616e7326737570706f72743d66616c7365)

# 🎓 Atölye.Platform

### Eğitim kurumları için modern, güvenli ve dinamik sınav yönetim ekosistemi.

<br/>

<!-- CORE BADGES -->
[![Version](https://img.shields.io/badge/Versiyon-3.5.0-6366f1?style=for-the-badge)](https://github.com/Emiran404/Atolye.Platform/releases)
[![License](https://img.shields.io/badge/Lisans-MIT-10b981?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Pardus_%7C_Windows-ef4444?style=for-the-badge)](https://github.com/Emiran404/Atolye.Platform)

<!-- TECH STACK BADGES -->
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)](https://zustand-demo.pmnd.rs/)

<!-- FEATURE BADGES -->
[![WebAuthn](https://img.shields.io/badge/🔐_Passkey-WebAuthn-yellow?style=for-the-badge)](https://webauthn.io/)
[![LDAP](https://img.shields.io/badge/📂_LDAP-LiderAhenk-blue?style=for-the-badge)](https://liderahenk.org/)
[![I18n](https://img.shields.io/badge/🌍_Dil-TR_|_EN_|_DE_|_RU-red?style=for-the-badge)](src/utils/i18n.js)
[![mDNS](https://img.shields.io/badge/📡_mDNS-Auto_Discovery-purple?style=for-the-badge)](https://www.npmjs.com/package/bonjour-service)

<br/>

<!-- REPO STATS -->
![Stars](https://img.shields.io/github/stars/Emiran404/Atolye.Platform?style=flat-square&color=ffd700) ![Forks](https://img.shields.io/github/forks/Emiran404/Atolye.Platform?style=flat-square&color=60a5fa) ![Issues](https://img.shields.io/github/issues/Emiran404/Atolye.Platform?style=flat-square&color=f87171) ![Pull Requests](https://img.shields.io/github/issues-pr/Emiran404/Atolye.Platform?style=flat-square&color=34d399) ![Repo Size](https://img.shields.io/github/repo-size/Emiran404/Atolye.Platform?style=flat-square&color=818cf8) ![Last Commit](https://img.shields.io/github/last-commit/Emiran404/Atolye.Platform?style=flat-square&color=a78bfa)

<br/>

[Özellikler](#-temel-özellikler) • [Ekran Görüntüleri](#-ekran-görüntüleri) • [Kurulum](#-kurulum) • [Mimari](#-sistem-mimarisi) • [Yol Haritası](#-yol-haritası)

---

</div>

## 🌟 Nedir?

**Atölye.Platform**, Alanya Mesleki ve Teknik Anadolu Lisesi için geliştirilen, **Pardus** ve **Debian** tabanlı sistemlerde yerel ağ üzerinden çalışan açık kaynaklı bir sınav ve ödev yönetim ekosistemidir. Öğretmenlere uçtan uca sınav oluşturma, dağıtma, toplama ve değerlendirme; öğrencilere ise şık ve odaklanmış bir portal sunar.

> [!NOTE]
> **Atölye.Platform** bir [PolyOS](https://github.com/Emiran404) ürünüdür — *Pardus Okul Laboratuvar Yönetim ve Ödev Sistemi.*

---

## 📥 Hazır Paketler

Derleme yapmadan, aşağıdaki hazır paketlerle saniyeler içinde kurulum yapın:

<div align="center">

| | Paket | İşletim Sistemi | İndir |
| :---: | :--- | :--- | :---: |
| 🖥️ | **Öğretmen Sunucusu** | Pardus / Debian | [📥 `.deb` Sunucu](https://github.com/Emiran404/Atolye.Platform/releases/latest) |
| 🪟 | **Masaüstü İstemci** | Windows 10/11 | [📥 `.exe` Kurulum](https://github.com/Emiran404/Atolye.Platform/releases/latest) |
| 🐧 | **Masaüstü İstemci** | Linux / Pardus | [📥 `.deb` İstemci](https://github.com/Emiran404/Atolye.Platform/releases/latest) |

</div>

> [!TIP]
> **Pardus kullanıcıları:** `.deb` paketlerini çift tıklayarak veya `sudo dpkg -i paket.deb` komutuyla yükleyebilirsiniz.

---

## ✨ Temel Özellikler

<table>
<tr>
<td width="50%">

### 👨‍🏫 Öğretmen Paneli
- 📊 **Canlı Dashboard** — İstatistik kartları ve anlık aktivite akışı
- 📝 **Sınav Oluşturma** — Esnek süre, sınıf hedefleme ve çoklu format desteği
- 🔍 **Akıllı Değerlendirme** — Split-view dosya inceleme ve anlık notlandırma
- 📈 **İstatistik & Raporlama** — Sınıf bazlı başarı analizi ve PDF rapor
- 🗂️ **Dinamik Arşiv** — Geçmiş sınavları filtreleme ve toplu dışa aktarma
- 📅 **Sınav Takvimi** — Haftalık/aylık planlama görünümü
- 🏫 **Sınıf Yönetimi** — Dinamik sınıf ekleme/silme (API-driven)
- 👥 **Öğrenci Listesi** — Kayıt durumu takibi ve toplu yönetim

</td>
<td width="50%">

### 👨‍🎓 Öğrenci Paneli
- 🎯 **Odaklanmış Arayüz** — Sadece aktif sınavlara odaklanan sade tasarım
- 📤 **Sürükle-Bırak Yükleme** — Gelişmiş dosya yükleme ile hızlı teslim
- 📋 **Sınav Geçmişi** — Geçmiş notlar ve geri bildirimleri görüntüleme
- 🔔 **Anlık Bildirimler** — Socket.io ile gerçek zamanlı uyarılar
- 🌍 **4 Dil Desteği** — Türkçe, İngilizce, Almanca ve Rusça

</td>
</tr>
</table>

### 🛡️ Güvenlik & Entegrasyon

| Özellik | Açıklama |
| :--- | :--- |
| **🔐 WebAuthn / Passkey** | Windows Hello ve Pardus biyometrik sistemleriyle şifresiz giriş |
| **📂 LiderAhenk / LDAP** | Kurumsal kullanıcı dizinleriyle otomatik senkronizasyon *(Beta)* |
| **📡 mDNS Auto-Discovery** | İstemciler sunucuyu ağda otomatik keşfeder — IP girmeye gerek yok |
| **🛡️ Kod Karıştırma** | Production build'de JavaScript Obfuscation ile kaynak kodu koruması |
| **🔒 JWT Authentication** | Her API çağrısında token bazlı yetkilendirme |

---

## 📸 Ekran Görüntüleri

<div align="center">

### Öğretmen Paneli

| Dashboard | Sınav Oluşturma |
| :---: | :---: |
| ![Dashboard](screenshots/Teacher/Dashboard.png) | ![CreateExam](screenshots/Teacher/CreateExam.png) |
| *Canlı istatistikler ve sistem takibi* | *Esnek sınav hazırlama ekranı* |

| Değerlendirme | Kullanıcı Yönetimi |
| :---: | :---: |
| ![Evaluation](screenshots/Teacher/Evaluation.png) | ![UserManagement](screenshots/Teacher/UserManagement.png) |
| *Split-view notlandırma ve geri bildirim* | *Öğrenci ve öğretmen hesap yönetimi* |

| Güvenlik Ayarları | |
| :---: | :---: |
| ![Settings](screenshots/Teacher/Settings.png) | |
| *Passkey, güvenlik ve platform ayarları* | |

### Öğrenci Paneli

| Öğrenci Dashboard | Sınav Ekranı |
| :---: | :---: |
| ![StudentDashboard](screenshots/Student/Dashboard.png) | ![StudentExam](screenshots/Student/Exam.png) |
| *Sade ve odaklanmış öğrenci portalı* | *Dosya yükleme ve sınav teslim arayüzü* |

### Ana Sayfa

![LandingPage](screenshots/Atolye.Platform-Anasayfa.png)
*Cinematic tasarımlı ana sayfa*

</div>

---

## 🚀 Kurulum

### Sistem Gereksinimleri

| Gereksinim | Minimum |
| :--- | :--- |
| **Node.js** | v18.0.0+ |
| **npm** | v9.0.0+ |
| **İşletim Sistemi** | Pardus 21+ / Debian 11+ / Windows 10+ |
| **RAM** | 2+ GB (Sunucu) |
| **Disk** | 500+ MB boş alan |

### Hızlı Başlangıç (Linux / Pardus)

```bash
# 1. Projeyi klonlayın
git clone https://github.com/Emiran404/Atolye.Platform.git
cd Atolye.Platform

# 2. Otomatik kurulum sihirbazını çalıştırın
chmod +x kurulum.sh
./kurulum.sh

# 3. Platformu başlatın
chmod +x baslat.sh
./baslat.sh
```

### Manuel Kurulum

```bash
# 1. Projeyi klonlayın
git clone https://github.com/Emiran404/Atolye.Platform.git
cd Atolye.Platform

# 2. Bağımlılıkları yükleyin (frontend + backend)
npm run install:all

# 4. Production build
npm run build

# 5. Çalıştır
npm run preview:full 
```

> [!WARNING]
> **Windows kullanıcıları:** `kurulum.sh` yerine doğrudan `npm run install:all` ve `npm run build` komutlarını kullanın.

---

## 🏗️ Sistem Mimarisi

```
Atölye.Platform/
├── 📂 src/                    # React Frontend (Vite)
│   ├── components/            # Yeniden kullanılabilir UI bileşenleri
│   ├── pages/
│   │   ├── teacher/           # 20+ öğretmen modülü
│   │   ├── student/           # Öğrenci portalı
│   │   └── auth/              # Kimlik doğrulama sayfaları
│   ├── store/                 # Zustand state yönetimi
│   ├── services/              # API istemci katmanı
│   └── utils/                 # i18n, tarih ve yardımcı fonksiyonlar
├── 📂 server/                 # Node.js / Express Backend
│   ├── routes/                # REST API endpoint'leri
│   ├── middleware/             # Auth, rate-limit, CORS
│   ├── data/                  # JSON veri dosyaları (DB gerektirmez)
│   └── utils/                 # LDAP, dosya işlemleri
├── 📂 client-electron/        # Electron masaüstü istemcisi
├── 📂 scripts/                # .deb paketleme scriptleri
├── 📂 deploy/                 # Systemd servis yapılandırmaları
└── 📂 screenshots/            # Ekran görüntüleri
```

### Teknoloji Yığını

<div align="center">

| Katman | Teknoloji | Versiyon |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + Zustand | 19.x / 5.x / 5.x |
| **Arayüz** | Tailwind CSS + Vanilla CSS | 4.x |
| **İkonlar** | Lucide React | 0.5x |
| **Backend** | Node.js + Express.js | 18+ / 4.x |
| **Gerçek Zamanlı** | Socket.io | 4.x |
| **Masaüstü** | Electron + Electron-Builder | 30.x |
| **Keşif** | Bonjour (mDNS) | 1.x |
| **Auth** | JSON Web Token + WebAuthn | — |
| **Veri** | JSON tabanlı (DB gerektirmez) | — |
| **Grafikler** | Recharts | 3.x |

</div>

---

## 🗺️ Yol Haritası

- [x] ~~Dinamik sınıf yönetimi (API-driven)~~
- [x] ~~Passkey / WebAuthn desteği~~
- [x] ~~4 dilli arayüz (TR/EN/DE/RU)~~
- [x] ~~mDNS otomatik sunucu keşfi~~
- [x] ~~Windows (.exe) ve Linux (.deb) paketleri~~
- [x] ~~Cinematic UI ve Glassmorphism tasarım~~
- [X] ~~Çoklu öğretmen desteği ve rol yönetimi~~
- [ ] LiderAhenk tam entegrasyon (LDAP kullanıcı senkronizasyonu)
- [ ] Docker konteyner desteği
- [ ] Progressive Web App (PWA) desteği

---

## 🧹 Bakım

Sistem sıfırlama gerektiğinde:

| Platform | Komut |
| :--- | :--- |
| **Linux / Pardus** | `./cleanup_linux.sh` |
| **Windows** | `cleanup_windows.bat` |

> Bu araçlar kilitli süreçleri otomatik sonlandırır ve sistemi fabrika ayarlarına döndürür.

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Detaylı bilgi için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına göz atın.

1. 🍴 Projeyi **Fork** edin
2. 🌿 Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. 💾 Commit yapın (`git commit -m "feat: yeni özellik eklendi"`)
4. 🚀 Push edin (`git push origin feature/yeni-ozellik`)
5. 📬 **Pull Request** açın

---

## 📄 Lisans

Bu proje [MIT](LICENSE) lisansı altında lisanslanmıştır. Eğitim amaçlı özgürce kullanılabilir.

---

<div align="center">

### 💙 Atölye.Platform

**Alanya Mesleki ve Teknik Anadolu Lisesi**

Geliştiren: [Emirhan Gök](https://github.com/Emiran404) • PolyOS Ekosistemi

<br/>

*Coded with ❤️ for the future of education.*

<br/>

[⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!](https://github.com/Emiran404/Atolye.Platform)

</div>
