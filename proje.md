# AkliKubbe — PC ve Telefon İçin Kelime Kartları

İlk tanım: 8 Ekim 2026  
Son güncelleme: 12 Ekim 2026  
Durum: GitHub Pages üzerinde yayımlanmış, çalışan web başlangıç sürümü. Google Play paketi henüz yayımlanmadı.  
Platform: PC ve telefon tarayıcıları; destekleyen tarayıcılarda kurulabilir PWA.  
Arayüz: Türkçe  
İçerik: Türkçe, İngilizce ve Almanca

## 1. Amaç ve güncel karar

Türkçe kelimelerin görsellerle desteklendiği, kart çevrilince üç dilde karşılıklarının, açıklamalarının ve örnek cümlelerinin görüldüğü bir öğrenme uygulaması. Kullanıcı bildiği ve bilmediği kelimeleri ayırır, bilmediklerini tekrar eder ve istediği cümleleri saklar.

Son kullanıcı isteğiyle ilk sürüm Kotlin/Android uygulaması yerine **PC ve telefonda çalışan tek bir statik web uygulaması** olarak geliştirildi. Önceki Python/FastAPI sunucusu zorunlu olmaktan çıkarıldı. Google Play hedefi sonraki paketleme ve mağaza aşaması olarak korunuyor.

Çalışan ürünün içerik alma ve çeviri akışında yapay zekâ veya makine çevirisi kullanılmaz. JavaScript betikleri mevcut kaynakları sorgular ve açık kurallarla sonuçları süzer.

## 2. GitHub Pages mi, Vercel mi?

**Mevcut sürüm GitHub Pages üzerinde çalışacak şekilde hazırlanmıştır.** GitHub Pages statik HTML, CSS ve JavaScript barındırır. Uygulamanın arayüzü ve öğrenme işlemleri tarayıcıda çalışır; sunucu kodu veya gizli anahtar gerekmez. Wikimedia Commons ve Tatoeba API yanıtlarında tarayıcı erişimi için `Access-Control-Allow-Origin: *` doğrulanmıştır. Canlı bağlantılar yerel tarayıcıda da denendi.

Bu sonuç mevcut kaynaklara ve bugünkü erişim koşullarına dayanır. Kaynaklar izinlerini değiştirebilir, istek sınırı uygulayabilir veya erişilemeyebilir. Hata durumları arayüzde gösterilir.

Vercel için statik yayın ayarları da hazırdır. CORS izni olmayan başka bir kaynak, gizli API anahtarı, merkezi kalite kontrolü veya hesap/eşitleme gerektiğinde Vercel üzerinde sunucu işlevleri eklenebilir. **Sadece siteyi Vercel'e taşımak CORS sorununu çözmez; gerektiğinde sunucu üzerinden bir erişim katmanı yazılır.** Mevcut sürümde böyle bir sunucu işlevi yoktur.

Kaynaklar: [GitHub Pages açıklaması](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [MediaWiki tarayıcılar arası erişim](https://www.mediawiki.org/wiki/API:Cross-site_requests/en), [Tatoeba API belgeleri](https://api.tatoeba.org/openapi).

## 3. Mevcut başlangıç sürümü

- 30 Türkçe kelime; yiyecek, doğa, hayvanlar ve günlük yaşam kategorileri.
- PC'de yan gezinme; telefonda alttaki gezinme çubuğu.
- Ön yüzde Türkçe kelime ve internetten yüklenen görsel.
- Kartı çevirmeyle TR/EN/DE karşılıkları ve kısa açıklamaları.
- Kartın arkasına geçildiğinde canlı örnek cümle sorgusu.
- Sağa kaydırma / “Biliyorum”; sola kaydırma / “Bilmiyorum”.
- Bilinenler ve bilinmeyenler listeleri, kutular arasında taşıma.
- Bilinmeyenleri veya bilinenleri çalışmak için tekrar oturumları.
- Son sınıflandırmayı geri alma, kart atlama, kategori ve kelime araması.
- Cümle ve mevcut çevirilerini kaydetme, başka örneğe geçme, kayıt silme.
- Yedeği JSON olarak dışa ve içe aktarma.
- Uygulama kabuğu ve kayıtlı metinler için çevrimdışı erişim.
- PWA manifesti, kurulum bilgisi ve uygulama ikonları.

Bu 30 kelime, bütün akışı denemek için başlangıç kataloğudur. İlk plandaki 500–1.000 kelime henüz eklenmedi. Canlı örnekleri tam olan, uygun görselleri kontrol edilmiş kelimelerle katalog genişletilecek.

## 4. Kartlar ve öğrenme durumu

Kartın önünde Türkçe kelime, kategori ve görsel bulunur. Görselin eser sahibi, kaynağı ve lisansı gösterilir. Kaynak yanıt vermezse kart görselsiz kullanılabilir.

Kartın arkasında her dilin kelime karşılığı ve kısa açıklaması yer alır. Almanca isimlerde artikel bulunur. Şimdiki kısa açıklamalar uygulama için hazırlanmış **küçük metin kataloğundan** gelir; canlı sözlükten çekildiği iddia edilmez. Sözlük kaynağını anlık ayrıştırma önceki plandaki bir araştırma konusudur ve bu sürümde uygulanmadı.

Örnek cümleler Tatoeba'dan internet üzerinden gelir. Üç dilin tamamı bulunamazsa eksik dil açıkça belirtilir. Aynı cümlenin kaynakta doğrudan bağlı olmayan çevirileri veya birbirinden bağımsız örnekler eşdeğer çeviriler gibi gösterilmez.

Bir kelime/anlam kimliğinin durumu `yeni`, `bilinen` veya `bilinmeyen`dir. Aynı kimlik iki kutuda birden yer almaz. Oturumdaki kartlar başlangıçta belirlenir; sınıflandırma değiştiğinde sıradaki kart atlanmaz.

## 5. İnternetten görsel alma

Başlangıç kataloğunda yalnızca kelimeye bağlı **Commons dosya adı** vardır; görselin kendisi yoktur. Kart açılınca MediaWiki API'ye istek gider, küçük boyutlu görsel URL'si ve atıf/lisans verileri alınır. Görsel uzak URL'den gösterilir.

Bu sürüm serbest Google araması veya ilk arama sonucunu seçme yöntemini kullanmaz. Anlamı daha iyi korumak için başlangıçta seçilmiş dosya adını canlı çözer. Yeni görsel seçeneklerini otomatik araştırma ayrı bir geliştirme olabilir; mevcut davranış bununla karıştırılmamalıdır.

Commons dosyalarının lisansları ayrı ayrı değerlendirilir. Kullanım koşulları doğrulanamayan görsel gösterilmez. Atıf bilgisi HTML olarak çalıştırılmaz; düz metin olarak gösterilir. Görsel URL'leri HTTPS ve beklenen sağlayıcı alan adıyla sınırlandırılır.

Kaynaklar: [Commons teknik yeniden kullanım rehberi](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical), [dosya lisansları](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [MediaWiki Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo/en).

## 6. Canlı örnekler ve anlam eşleştirme

Tatoeba API v1 üzerinden İngilizce kelime aranır; Türkçe ve Almanca doğrudan bağlı çevirileri istenir. Onaylanmamış cümleler elenir. CC BY 2.0 FR ve CC0 1.0 dışındaki lisanslar alınmaz.

Gelen sonuçlarda hedef kelimelerin ilgili dillerde geçmesi kontrol edilir. Basit Türkçe ekleri ve Almanca/İngilizce çoğul biçimleri için sınırlı normalleştirme uygulanır. En az bir hedef dil çevirisiyle eşleşmeyen örnek gösterilmez. Üç dilde mevcut örnekler öne alınır.

**Bu filtre tam anlam doğrulaması değildir.** Örneğin çok anlamlı bir kelimenin yanlış kullanımı hâlâ geçebilir. Dilsel kalite için insan incelemesi, daha dar anlam katalogları ve kaynak cümlelerinin doğrulanması gerekir. Eksik içerik üretilmez veya otomatik çevrilmez.

Kart başına en fazla 30 sonuç alınır. Kullanıcı “Başka örnek” ile internetten alınmış sonuçlar arasında ilerler. Bellekteki örnekler 15 dakika geçerlidir ve en fazla 12 kelime için tutulur. Aynı sorgunun her seferinde yeni bir cümle döndürmesi garanti edilmez.

Kaynaklar: [Tatoeba API](https://api.tatoeba.org/), [Tatoeba kullanım ve lisans açıklamaları](https://en.wiki.tatoeba.org/articles/show/faq).

## 7. Kullanıcı cihazında depolama

`localStorage` içinde yalnızca şu veriler tutulur:

- Kelime durumları ve son güncelleme zamanı.
- Kullanıcının kaydettiği cümlelerin metinleri ve mevcut çevirileri.
- Kaynak cümle kimlikleri, katkıda bulunanlar, lisanslar ve kaydetme tarihleri.

Cümle kaydetmek, o anda gösterilen metnin bir kopyasını oluşturur. Kaynak daha sonra değişirse bu kopya değişmez. Aynı kelime/cümle grubu ikinci kez kaydedilmez.

**Yerel depolama otomatik eşitleme değildir.** PC ve telefon kayıtları ayrı tutulur. Tarayıcı verilerinin silinmesi, başka tarayıcı kullanılması veya başka site adresine geçilmesi mevcut kayıtlara erişimi değiştirebilir. Yedek indirip diğer cihazda yüklemek bu sürümün taşıma yöntemidir. İçe aktarma mevcut kayıtların yerini alır; önce yedek önerilir. Bozuk veya uygun olmayan yedek mevcut veriyi değiştirmez.

Yedek dosyaları en fazla 2 MB ve 2.000 cümle grubuyla sınırlıdır. Şema, kimlikler, metin boyutları, diller ve lisanslar doğrulanır. Depolama hatasında uygulama kayıt başarılı olmuş gibi davranmaz. Bozuk mevcut veriler otomatik üzerine yazılmaz.

## 8. Görsel depolamama sınırı

Uygulama görselleri kendi `localStorage`, IndexedDB veya Cache Storage alanına yazmaz. Service worker yalnızca uygulamanın küçük HTML/CSS/JS kabuğunu ve ikonlarını çevrimdışı erişim için saklar. API yanıtları ve uzak kelime görselleri bu listeye dahil edilmez.

Buna karşın **web uygulaması tarayıcının kendi HTTP/disk önbelleğinin tamamını kontrol edemez**. Uzak sunucunun başlıklarına göre tarayıcı geçici görsel önbelleği oluşturabilir. “Cihazda hiçbir koşulda görsel baytı kalmaz” garantisi web için verilemez. Önceki Android planındaki disk önbelleğini tam kapatma koşulu bu nedenle web sürümünde revize edilmiştir.

Görsel arşivinin uygulamayla birlikte indirilmemesi ve uygulama tarafından sürekli biriktirilmemesi korunur. İnternet kullanımı ve tarayıcı belleği yine gereklidir. İndirme boyutu, kayıt alanı ve çalışma belleği ayrı ölçülür.

## 9. Teknik yapı ve dosyalar

| Katman | Uygulanan çözüm |
| --- | --- |
| Arayüz | HTML, CSS ve ES module JavaScript; çalışma zamanı bağımlılığı yok |
| Katalog | `src/data.js`; 30 kelime, karşılıklar, kısa açıklamalar, uzak dosya adları |
| İçerik erişimi | `src/content.js`; Commons ve Tatoeba için HTTPS/CORS istekleri |
| Kullanıcı verisi | `src/storage.js`; sürümlü ve doğrulanan yerel JSON kayıtları |
| Etkileşim | `src/app.js`; kartlar, kutular, kaydırma, tekrar, defter, yedekler |
| Çevrimdışı | `sw.js`; yalnızca uygulama kabuğu için sınırlı dosya listesi |
| Yerel önizleme | `npm run dev`; varsayılan port 4173 |
| Yayın paketi | `npm run build`; `dist/` klasörü |
| GitHub Pages | `main` dalı, kök dizin `/`; `.nojekyll` ile doğrudan statik yayın |
| Vercel | `vercel.json`; statik `dist/` yayını |

Dosya bağlantıları göreli oluşturuldu; GitHub Pages'in `/depo-adi/` alt dizininde çalışması amaçlanır. Harici font, görsel paketi, analiz veya reklam bağımlılığı yoktur. Sunucu ve gizli API anahtarı kullanılmaz. İçerik sağlayıcıları bağlantı sırasında kullanıcının IP adresini ve istek bilgilerini alır.

## 10. Çevrimdışı ve hata davranışı

İlk çevrimiçi açılışta uygulama kabuğu hazırlandıktan sonra kelime listesi, kısa açıklamalar, öğrenme kutuları ve kaydedilmiş cümleler çevrimdışı kullanılabilir. Yeni görseller ve canlı örnekler için internet gerekir.

Görsel/cümle hataları diğer öğrenme işlemlerini engellemez. Zaman aşımı, bulunamayan içerik, HTTP hataları ve internet kesintisi mesajla gösterilir. Kart değiştirilince eski isteklerin yeni karta yazması engellenir. Kaynaklara tüm katalog için otomatik toplu indirme yapılmaz.

## 11. Doğrulama ve mevcut sınırlar

- Yerel kayıt, cümle kopyası, yedek doğrulama, depolama hatası, doğrudan çeviri seçimi, kelime eşleştirme, URL güvenliği ve katalog kimlikleri için 8 otomatik test geçti.
- 30 görsel referansının tamamı API üzerinden bulundu; uygulamanın kabul ettiği lisanslar doğrulandı. Altı kelimelik cümle örnekleminde canlı çeviri grupları bulundu; sonuçlar `docs/source-check.json` içindedir.
- GitHub Pages benzeri `/AkliKubbe/` alt dizininden statik paket, canlı içerik, manifest ve service worker kapsamı yerelde doğrulandı.
- Canlı elma görseli ve üç dilli Tatoeba cümlesi tarayıcıda doğrulandı.
- PC ve 390 px telefon görünümünde 20 tarayıcı kontrolü geçti: sınıflandırma, geri alma, kalıcılık, taşıma, tekrar, arama, kaydırma, defter, yedek işlemleri, bozuk yedek, çevrimdışı yeniden açılış ve uzak görsellerin uygulama önbelleğine alınmaması.
- 12 Ekim 2026: `https://mustafaorhan0.github.io/AkliKubbe/` HTTPS adresi HTTP 200 ile açıldı. Canlı görsel, üç dilli Tatoeba örneği, 390 px görünümde taşma olmaması ve service worker kapsamı yayın üzerinde doğrulandı.
- Gerçek Android/iPhone cihazları, tüm tarayıcılar ve mağaza paketi henüz test edilmedi. Mobil kontroller tarayıcıda boyut benzetimiyle yapıldı.
- İlk planın 100 kelimelik kapsam araştırması ve 500–1.000 kelimelik katalog tamamlanmadı.
- Her kelimede üç dilde canlı cümle ve her eşleşmede doğru anlam garanti edilmez.
- Google Play paketi, hesap/eşitleme, bildirimler ve aralıklı tekrar henüz uygulanmadı.

## 12. Yayın ve sonraki adımlar

1. Kullanılacak GitHub deposu belirlenir; dosyalar eklenir.
2. Repository Settings → Pages → Source: Deploy from a branch; dal: `main`, klasör: `/` seçilir.
3. `main` dalına gönderim Pages yayınını başlatır; HTTPS adresinden PC ve telefonda açılır.
4. Vercel tercih edilirse aynı depo bağlanıp `vercel.json` ayarlarıyla statik yayın yapılır.
5. Gerçek cihaz kontrolü ve başlangıç kataloğunun dil/görsel incelemesi tamamlanır.
6. Uygun kelimelerle katalog genişletilir; ardından Google Play için Android paketleme ve güncel mağaza koşulları ele alınır.

PWA'nın çalışması, Google Play'de kendiliğinden yayımlandığı anlamına gelmez. Mağaza yayını ayrı bir teslimdir. GitHub hedefi: `Mustafaorhan0/AkliKubbe`. Yayın adresi: `https://mustafaorhan0.github.io/AkliKubbe/`. Aktif hesapta workflow yazma yetkisi olmadığından mevcut buildless sürüm doğrudan dal yayını kullanır; isteğe bağlı Actions şablonu `deployment/github-actions-pages.yml` içinde korunur.
