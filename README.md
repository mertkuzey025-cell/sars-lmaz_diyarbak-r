# SARSILMAZ — ücretsiz ilan sitesi başlangıç paketi

Bu paket, yerel bilgisayarında çalıştırabileceğin bir başlangıç projesidir. Ücretsiz üyelik ve ücretsiz ilan ekleme akışını içerir.

## Gereksinimler
- Node.js 20 veya üzeri
- İnternet tarayıcısı

## Kurulum
1. ZIP dosyasını çıkar.
2. Bu klasörde terminal aç.
3. `npm install`
4. `.env.example` dosyasını `.env` olarak kopyala ve `SESSION_SECRET` değerini değiştir.
5. `npm start`
6. Tarayıcıda `http://localhost:3000` adresini aç.

## Özellikler
- Ücretsiz kayıt ve giriş
- İlan ekleme, düzenleme ve silme (ilan sahibi)
- İlanlar ilk olarak moderasyon bekler
- Yönetici moderasyon ekranı
- Basit 18+ onay ekranı
- SQLite veritabanı

## Yönetici hesabı
İlk yönetici hesabı için:
1. `.env` içinde `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerlerini belirle.
2. Sunucu ilk açıldığında bu e-posta ile yönetici hesabı oluşturulur.
3. Gerçek yayına almadan önce güçlü bir parola kullan ve `.env` dosyasını kimseyle paylaşma.

## Yayına alma öncesi önemli
- Bu bir başlangıç projesidir; canlı yayına alınmadan önce güvenlik, gizlilik, moderasyon ve mevzuat incelemesi gerekir.
- Gerçek kişilerin fotoğraflarını ve bilgilerini yalnızca açık izinle yayımla.
- Reşit olmayanlara ait veya rızasız içerikleri kabul etme; şüpheli ilanları yayımlama.
- İletişim bilgilerini ve kullanıcı verilerini koruyacak gizlilik metni, kullanım şartları, şikâyet/ihbar akışı ve veri silme süreçleri eklenmelidir.
- Alan adı ve hosting ayrıca alınmalıdır. Bu paket tek başına internette yayında değildir.
