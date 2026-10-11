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

## 3. Mevcut sürüm — 3000 kelimelik katalog

12 Ekim 2026 güncellemesiyle varsayılan paket **Günlük İngilizce · 3000** oldu. Liste [FrequencyWords / OpenSubtitles 2018](https://github.com/hermitdave/FrequencyWords) altyazı sıklık verisinden hazırlanır. Sözlük açıklamaları [Kaikki / Wiktionary](https://kaikki.org/) verilerinden alınır; çalışma sırasında yapay zekâ veya makine çevirisi çağrısı yoktur.

Bu, evrensel ya da 2026 yılına ait kesin konuşma sıralaması değildir. Sözcük parçaları, belirgin kişi adları ve uygun İngilizce sözlük kaydı bulunmayan girdiler çıkarıldıktan sonra ilk 3000 kayıt seçildi. Son kayıt kaynak korpusta **3228. sıradadır**. `rank` paket sırası, `sourceRank` kaynak sırasıdır. Çekimli yüzey biçimleri ayrı kayıtlar olabilir; liste 3000 ayrı kök sözcük olarak sunulmaz.

- 3000 benzersiz İngilizce kayıt; 1–500, 501–1000, …, 2501–3000 sıklık grupları.
- İngilizce, Türkçe veya Almanca ön yüz seçimi; varsayılan İngilizce.
- Sözcük türü ve üç dilde arama; katalog/liste ekranlarında 50 satırlık sayfalama.
- 25, 50 veya 100 kelimelik çalışma oturumları.
- Bilinenler, bilinmeyenler, tekrar, geri alma ve cümle defteri.
- “TR + DE mevcut” filtresi; kısa karşılıkları olmayan kelimeleri filtreleme.
- Kaynak açıklamaları: İngilizce **3000**, Türkçe **2111**, Almanca **2164** kayıtta mevcut. Kısa karşılık kapsamı açıklama kapsamından farklıdır; eksikler açıkça gösterilir.
- Önceki 30 kart, görselleri ve kimlikleriyle **Görsel başlangıç · 30** paketinde korunur. İki pakette ortak kelimeler aynı öğrenme kimliğini kullanır.

Türkçe/Almanca kapsamı eksiksiz değildir. Bu sürüm 3000 kelimenin tamamının insan tarafından anlam ve görsel açısından doğrulandığı iddiasında bulunmaz. Ortak çeviri grupları mümkün olduğunda korunur; bağımsız dil sözlüklerinden alınan anlamlar birebir aynı kullanım olmayabilir. Eksik karşılıklar uydurulmaz.

Veri uyarlaması ve atıflar: `data/README.md`, `data/CC-BY-SA-4.0.txt`. Kaynak dosyaların SHA-256 değerleri, kapsam raporu ve yapılan eleme `docs/catalog-build.json` içindedir. Yeniden üretme betiği `scripts/build-catalog.py`.

## 4. Kartlar ve öğrenme durumu

Kartın önünde Türkçe kelime, kategori ve görsel bulunur. Görselin eser sahibi, kaynağı ve lisansı gösterilir. Kaynak yanıt vermezse kart görselsiz kullanılabilir.

Kartın arkasında her dilin kelime karşılığı ve kısa açıklaması yer alır. Almanca isimlerde artikel bulunur. Yeni pakette açıklamalar kaynak sözlüklerden çıkarılmış, gerektiğinde indirilen küçük metin paketlerinden gelir. Önceki 30 kartın özgün açıklamaları korunur. Her kart açılışında büyük bir sözlük indirilmez veya canlı sözlük taraması yapıldığı iddia edilmez. Kaynaklarda bulunan bazı yaygın dil bilgisi/çekim sorunları açık editoryal kısa etiketlerle düzenlendi; bu etiketler `data/editorial-core.json` içinde tutulur.

Örnek cümleler Tatoeba'dan internet üzerinden gelir. Üç dilin tamamı bulunamazsa eksik dil açıkça belirtilir. Aynı cümlenin kaynakta doğrudan bağlı olmayan çevirileri veya birbirinden bağımsız örnekler eşdeğer çeviriler gibi gösterilmez. Yeni pakette Türkçe gibi öznenin düşebildiği dillerin geçerli çevirileri sadece hedef kelime açıkça geçmiyor diye elenmez.

Bir kelime/anlam kimliğinin durumu `yeni`, `bilinen` veya `bilinmeyen`dir. Aynı kimlik iki kutuda birden yer almaz. Oturumdaki kartlar başlangıçta belirlenir; sınıflandırma değiştiğinde sıradaki kart atlanmaz.

## 5. İnternetten görsel alma

İlk 30 kartta kelimeye bağlı seçilmiş Commons dosya adı bulunur; görselin kendisi bulunmaz. Kart açılınca MediaWiki API'ye istek gider, küçük boyutlu görsel URL'si ve atıf/lisans verileri alınır.

Yeni pakette uygun isimler için Commons'ta başlık/kelime araması yapılır. En fazla beş arama sonucu değerlendirilir; izin verilen görsel türü ve lisans bilgileriyle bir uzak görsel gösterilir. Arama sonucunun kartın anlamını kesin olarak temsil ettiği garanti edilmez ve görsel “arama görseli” olarak belirtilir. Google HTML kazıması kullanılmaz.

Dil bilgisi sözcükleri, fiiller, sıfatlar ve belirgin soyut kelimeler genellikle görselsiz metin kartlarıyla çalışılır. “the”, “would” gibi sözcüklere rastgele fotoğraf bağlanmaz. Her kelimenin doğru bir fotoğrafla temsil edilebileceği varsayılmaz.

Commons dosyalarının lisansları ayrı ayrı değerlendirilir. Kullanım koşulları doğrulanamayan görsel gösterilmez. Atıf bilgisi HTML olarak çalıştırılmaz; düz metin olarak gösterilir. Görsel URL'leri HTTPS ve beklenen sağlayıcı alan adıyla sınırlandırılır.

Kaynaklar: [Commons teknik yeniden kullanım rehberi](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical), [dosya lisansları](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [MediaWiki Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo/en).

## 6. Canlı örnekler ve anlam eşleştirme

Tatoeba API v1 üzerinden İngilizce kelime aranır; Türkçe ve Almanca doğrudan bağlı çevirileri istenir. Onaylanmamış cümleler elenir. CC BY 2.0 FR ve CC0 1.0 dışındaki lisanslar alınmaz.

İlk 30 anlam kartında gelen sonuçlarda hedef kelimelerin ilgili dillerde geçmesi kontrol edilir. Yeni sıklık paketinde İngilizce hedef sözcük kontrol edilir; lisanslı, onaylanmış ve doğrudan bağlı Türkçe/Almanca çeviriler alınır. Basit Türkçe ekleri ve Almanca/İngilizce çoğul biçimleri için sınırlı normalleştirme uygulanır. Yeni pakette bir hedef dil çevirisi yoksa mevcut İngilizce örnek gösterilebilir; eksik diller açıkça belirtilir. Bağlı çeviri olmayan ayrı cümleler otomatik olarak birleştirilmez. Üç dilde mevcut örnekler öne alınır.

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

Uygulama görselleri kendi `localStorage`, IndexedDB veya Cache Storage alanına yazmaz. Service worker arayüzü, ikonları ve yaklaşık 638 KB boyutundaki 3000 kelimelik arama dizinini çevrimdışı erişim için saklar. Sözlük açıklamaları 100 kelimelik 30 dosyaya ayrılır; bu dosyalar ihtiyaç oldukça yüklenir, bellekte ve çevrimdışı depoda en fazla altı paket tutulur. API yanıtları ve uzak kelime görselleri bu listeye dahil edilmez. İlk açılışta 30 anlam paketinin tamamı indirilmez; geliştirirken kullanılan büyük kaynak sözlükleri kullanıcıya veya GitHub deposuna taşınmaz.

Buna karşın **web uygulaması tarayıcının kendi HTTP/disk önbelleğinin tamamını kontrol edemez**. Uzak sunucunun başlıklarına göre tarayıcı geçici görsel önbelleği oluşturabilir. “Cihazda hiçbir koşulda görsel baytı kalmaz” garantisi web için verilemez. Önceki Android planındaki disk önbelleğini tam kapatma koşulu bu nedenle web sürümünde revize edilmiştir.

Görsel arşivinin uygulamayla birlikte indirilmemesi ve uygulama tarafından sürekli biriktirilmemesi korunur. İnternet kullanımı ve tarayıcı belleği yine gereklidir. İndirme boyutu, kayıt alanı ve çalışma belleği ayrı ölçülür.

## 9. Teknik yapı ve dosyalar

| Katman | Uygulanan çözüm |
| --- | --- |
| Arayüz | HTML, CSS ve ES module JavaScript; çalışma zamanı bağımlılığı yok |
| Katalog | `data/catalog-index.json`; 3000 kayıt ve arama alanları; `src/legacy-data.js` eski 30 kart |
| Anlam paketleri | `data/packs/en-01.json` … `en-30.json`; 100 kayıttan oluşan, gerektiğinde yüklenen açıklamalar |
| Katalog erişimi | `src/catalog.js`; kaynak doğrulama, dil seçimi, eski kimlikler ve sınırlı paket belleği |
| İçerik erişimi | `src/content.js`; Commons ve Tatoeba için HTTPS/CORS istekleri |
| Kullanıcı verisi | `src/storage.js`; sürümlü ve doğrulanan yerel JSON kayıtları |
| Etkileşim | `src/app.js`; kartlar, kutular, kaydırma, tekrar, defter, yedekler |
| Çevrimdışı | `sw.js`; uygulama kabuğu/dizin ve en fazla altı anlam paketi; dış görseller ve API cevapları hariç |
| Yerel önizleme | `npm run dev`; varsayılan port 4173 |
| Yayın paketi | `npm run build`; `dist/` klasörü |
| GitHub Pages | `main` dalı, kök dizin `/`; `.nojekyll` ile doğrudan statik yayın |
| Vercel | `vercel.json`; statik `dist/` yayını |

Dosya bağlantıları göreli oluşturuldu; GitHub Pages'in `/depo-adi/` alt dizininde çalışması amaçlanır. Harici font, görsel paketi, analiz veya reklam bağımlılığı yoktur. Sunucu ve gizli API anahtarı kullanılmaz. İçerik sağlayıcıları bağlantı sırasında kullanıcının IP adresini ve istek bilgilerini alır.

## 10. Çevrimdışı ve hata davranışı

İlk çevrimiçi açılışta uygulama kabuğu hazırlandıktan sonra 3000 kelimelik arama dizini, öğrenme kutuları ve kaydedilmiş cümleler çevrimdışı kullanılabilir. Eski 30 kartın açıklamaları da kullanılabilir. Yeni sözlük açıklamaları ancak ilgili anlam paketi hâlâ sınırlı önbellekteyse çevrimdışı açılır. Önbelleğe alınmamış anlamlar için açık hata mesajı gösterilir; kullanıcı kayıtları silinmez. Yeni görseller ve canlı örnekler için internet gerekir.

Görsel/cümle hataları diğer öğrenme işlemlerini engellemez. Zaman aşımı, bulunamayan içerik, HTTP hataları ve internet kesintisi mesajla gösterilir. Kart değiştirilince eski isteklerin yeni karta yazması engellenir. Kaynaklara tüm katalog için otomatik toplu indirme yapılmaz.

## 11. Doğrulama ve mevcut sınırlar

- Yerel kayıt, cümle kopyası, yedek doğrulama, kaynak filtreleri, 3000 benzersiz kayıt, sıklık sırası, eski kimliklerin korunması, sayfalama, eksik çeviri davranışı ve altı paketlik bellek sınırı için 16 otomatik test geçti.
- 30 görsel referansının tamamı API üzerinden bulundu; uygulamanın kabul ettiği lisanslar doğrulandı. Altı kelimelik cümle örnekleminde canlı çeviri grupları bulundu; sonuçlar `docs/source-check.json` içindedir.
- GitHub Pages benzeri `/AkliKubbe/` alt dizininden statik paket, canlı içerik, manifest ve service worker kapsamı yerelde doğrulandı.
- Canlı elma görseli ve üç dilli Tatoeba cümlesi tarayıcıda doğrulandı.
- PC ve 390 px telefon görünümünde ilk akışın 20 tarayıcı kontrolü geçti: sınıflandırma, geri alma, kalıcılık, taşıma, tekrar, arama, kaydırma, defter, yedek işlemleri, bozuk yedek, çevrimdışı yeniden açılış ve uzak görsellerin uygulama önbelleğine alınmaması.
- 12 Ekim 2026: `https://mustafaorhan0.github.io/AkliKubbe/` HTTPS adresi HTTP 200 ile açıldı. Canlı görsel, üç dilli Tatoeba örneği, 390 px görünümde taşma olmaması ve service worker kapsamı yayın üzerinde doğrulandı.
- Yeni katalog için ek 25 tarayıcı kontrolü geçti: dil seçimi, 3000 kayıt, 500 kelimelik gruplar, 50 satırlık sayfalama, 100 kelimelik oturum, kaynak arama görseli, eski kayıtların korunması, altı paketlik çevrimdışı sınır, çevrimdışı dizin/defter ve katalog hatasında kayıtların değişmemesi.
- Gerçek Android/iPhone cihazları, tüm tarayıcılar ve mağaza paketi henüz test edilmedi. Mobil kontroller tarayıcıda boyut benzetimiyle yapıldı.
- Sıklık kataloğu 3000 kayda ulaştı. İngilizce sözlük açıklamaları tamdır; Türkçe/Almanca açıklamalar ve tüm kelimelerin görsel/anlam açısından insan incelemesi tamamlanmış değildir.
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
