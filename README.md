# AkliKubbe

PC ve telefonda çalışan, Türkçe / İngilizce / Almanca kelime kartları. Görseller Wikimedia Commons'tan, örnek cümleler Tatoeba'dan alınır. Öğrenme kayıtları ve kaydedilen metinler cihazdaki tarayıcıda kalır. Çalışan ürün yapay zekâ kullanmaz.

## Çalıştırma

Node.js 22 veya üzeri:

```sh
npm run dev
```

Tarayıcıda `http://localhost:4173` açılır. Aynı Wi-Fi ağındaki telefondan PC'nin yerel IP adresini `http://PC-IP:4173` olarak kullanabilirsin. Ağ güvenlik duvarı erişime izin vermelidir. LAN üzerinden düz HTTP, PWA kurulumu ve service worker için güvenli bağlam sayılmaz; telefondaki tam PWA/çevrimdışı deneyimi HTTPS yayınında dene.

```sh
npm run check
npm test
npm run build
```

Çıktı `dist/` klasörüdür. Çalışma zamanı bağımlılığı ve kurulum gerektiren npm paketi yoktur.

## GitHub Pages

Depo: [Mustafaorhan0/AkliKubbe](https://github.com/Mustafaorhan0/AkliKubbe)  
Yayın adresi: [AkliKubbe](https://mustafaorhan0.github.io/AkliKubbe/)

Yayın kaynağı: **main dalı, kök dizin (`/`)**. Uygulama buildless olduğundan kökteki HTML/CSS/JS dosyaları doğrudan yayınlanır. `.nojekyll` Jekyll işleme adımını kapatır. Güncellemeler `main` dalına gönderildiğinde Pages yayını yenilenir.

Göndermeden önce `npm run check`, `npm test` ve `npm run build` çalıştır. GitHub Actions ile ayrı build/yayın tercih edilirse şablon `deployment/github-actions-pages.yml` içindedir. Bu dosya aktif bir workflow değildir. Actions'a geçerken dosya `.github/workflows/pages.yml` konumuna taşınmalı, hesabın workflow yazma yetkisi bulunmalı ve Pages kaynağı GitHub Actions olarak değiştirilmelidir.

## Vercel

Depoyu Vercel'e bağla. Framework preset: **Other**, build: `npm run build`, output: `dist`. Ayarlar `vercel.json` içinde de bulunur. Aynı statik uygulama çalışır; mevcut sürümde sunucu işlevi yoktur.

## Depolama ve kaynaklar

- `localStorage`: kelime durumları ve kullanıcının kaydettiği cümleler. PC/telefon otomatik eşitlenmez; Ayarlar'daki JSON yedeğiyle taşınır.
- Service worker: yalnızca arayüz dosyaları ve uygulama ikonları. Uzak kelime görselleri veya API cevapları burada saklanmaz.
- Tarayıcı kendi HTTP önbelleğinde geçici görseller tutabilir; web uygulaması bunu tamamen engelleyemez.
- 30 kelimelik başlangıç kataloğu ve kısa açıklamalar yereldir. Görsel dosya adları seçilmiş referanslardır; uygulama bu dosyaları paketlemez.
- Görseller: [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical). Her dosyanın atıf/lisansı gösterilir.
- Örnekler: [Tatoeba API](https://api.tatoeba.org/openapi). Doğrudan çeviriler ve cümle katkıda bulunanları korunur. Otomatik kelime filtresi tam anlam doğrulaması sağlamaz.

## Doğrulama

`npm test`: 8 temel veri ve kaynak süzme testi. `tests/browser-checks.js`: yerel uygulamaya karşı Playwright araçlarıyla çalıştırılan 20 canlı tarayıcı kontrolü; PC/mobil görünüm, kaydırma, kayıt, tekrar, yedek ve çevrimdışı açılış. Bu dosya bağımsız bir Playwright CLI paketi değildir; test tarayıcısındaki yerel kayıtları sıfırlar. Kullanıcı tarayıcısında çalıştırma.

İsteğe bağlı kaynak kontrolü: `node scripts/check-sources.mjs`. Görsellerin API'de bulunmasını ve örnek bir kelime kümesinin canlı cümle kapsamını kontrol eder; görselleri indirmez.

Google Play paketi bu sürüme dahil değildir. Tam kapsam ve sınırlar [proje.md](./proje.md) içindedir.
