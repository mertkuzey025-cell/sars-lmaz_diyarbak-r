# SARSILMAZ — ücretsiz test ve yayınlama rehberi

Bu paket, yerel bilgisayarda denenebilecek bir Node.js başlangıç projesidir.
Ücretsiz üyelik, ücretsiz ilan gönderme ve yönetici onay akışı içerir.

## Yerel test
1. Node.js 20 veya üzerini kur.
2. ZIP'i çıkar.
3. Klasörde terminal açıp `npm install` çalıştır.
4. `.env.example` dosyasını `.env` adıyla kopyala.
5. `.env` içindeki `SESSION_SECRET` değerini uzun, rastgele bir değerle değiştir.
6. Yönetici hesabı için `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ayarla; güçlü, benzersiz bir parola kullan.
7. `npm start` çalıştır ve tarayıcıda `http://localhost:3000` adresini aç.

## Ücretsiz deneme sunucusuna yükleme
Render gibi platformlarda uygulamayı yayımlamadan önce:
- Projeyi GitHub deposuna yükle.
- Node web service oluştur; build komutu `npm install`, start komutu `npm start`.
- `SESSION_SECRET`, `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerlerini platformun Environment ayarlarına gir.
- SQLite dosyasının ücretsiz sunucuda yeniden başlatma veya yeniden dağıtım sonrasında korunacağı varsayılmamalıdır. Kalıcı test verisi gerekiyorsa kalıcı disk veya desteklenen bir veritabanı gerekir.
- Ücretsiz hizmetlerin uyku, disk ve kullanım sınırları olabilir.

## Önemli güvenlik notları
Bu bir başlangıç/test projesidir; canlı kullanıma hazır olduğu garanti edilmez. Gerçek kullanıcı verilerini toplamadan önce güvenlik, gizlilik, moderasyon ve mevzuat incelemesi yaptır. Yalnızca yetişkinlere ait, açık rızayla paylaşılmış ve hukuka uygun içerikleri kabul et; şüpheli veya rıza dışı ilanları yayımlama. Gerçek yayına almadan önce CSRF koruması, hız sınırlama, güvenli kalıcı oturum deposu, yedekleme ve uygun veri saklama/silme süreçleri eklenmelidir.

Bu ZIP tek başına internette yayında değildir; hosting ve alan adı bağlantısı ayrıca yapılandırılmalıdır.
