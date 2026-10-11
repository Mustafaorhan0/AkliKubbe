# AkliKubbe — 3000 İngilizce kelime verisi

Bu veri uyarlaması **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)** lisansı altında paylaşılır. Lisans metni: `CC-BY-SA-4.0.txt` ve https://creativecommons.org/licenses/by-sa/4.0/ . Özgün kaynakların atıfları ve lisansları korunmalıdır.

## Sıklık kaynağı

- **FrequencyWords**, Hermit Dave ve katkıda bulunanlar: https://github.com/hermitdave/FrequencyWords
- Girdi: https://github.com/hermitdave/FrequencyWords/blob/master/content/2018/en/en_50k.txt
- Korpus: **OpenSubtitles 2018**, film ve dizi altyazıları: https://opus.nlpl.eu/OpenSubtitles
- İçerik lisansı: CC BY-SA 4.0; üretici kodun MIT lisansından ayrıdır.

Bu bir altyazı sıklık listesidir. Bütün dünyada, bütün bağlamlarda veya 2026 yılında konuşulan İngilizcenin kesin sıralaması değildir. Kaynaktaki yüzey biçimleri sayılır; aynı fiilin farklı çekimleri ayrı kayıtlar olabilir.

## Sözlük kaynakları

Wiktionary katkıda bulunanlarının verileri, **Tatu Ylonen / Kaikki.org / Wiktextract** üzerinden alınmıştır:

- İngilizce açıklamalar ve bazı çeviri grupları: https://kaikki.org/dictionary/English/ — https://en.wiktionary.org/
- Türkçe açıklamalar: https://kaikki.org/trwiktionary/%C4%B0ngilizce/ — https://tr.wiktionary.org/
- Almanca açıklamalar: https://kaikki.org/dewiktionary/Englisch/ — https://de.wiktionary.org/
- Kaikki lisans açıklaması: https://kaikki.org/ ve her Wiktionary edisyonunun ana sayfasındaki copyright/license bölümü. Wiktionary verileri CC BY-SA ve GFDL altında sunulur; bu uyarlama CC BY-SA seçeneğini kullanır.

Her kelime kartı ilgili en/tr/de Wiktionary sayfalarına bağlanır. Bu bağlantılardan katkıda bulunanlar ve değişiklik geçmişine ulaşılabilir. JSON dosyalarının tam kaynak URL'leri ve kullanılan girdilerin SHA-256 değerleri `docs/catalog-build.json` içinde kayıtlıdır. İngilizce/Türkçe verisi 3 Ekim 2026; Almanca verisi 2 Ekim 2026 Kaikki çıkarmalarına dayanır; temel Wiktionary dump tarihleri ilgili kaynak sayfalarındadır.

## Yapılan değişiklikler ve sınırlar

- Kaynak sıklık sırası korunarak ilk 3000 uygun İngilizce sözlük kaydı seçildi. Belirgin kişi adları, tek harf artıkları ve `don`, `didn` gibi tokenleştirme parçaları elendi.
- `rank` bu paketteki 1–3000 sırasıdır; `sourceRank` kaynak korpustaki özgün sıradır. Son seçilen kayıt kaynakta 3228. sıradadır.
- İlk sürümdeki 30 görsel kartla örtüşen kelimeler aynı kimliği korur; önceki öğrenme kayıtları silinmez. Sıklık paketinde bulunmayan eski kartlar ayrı başlangıç paketinde kalır.
- Çok anlamlı girdilerin yalnızca sınırlı sayıda açıklaması ve karşılığı alındı. Sözlük açıklamaları kısaltıldı, boşluklar normalleştirildi, bazı eski/seyrek kullanımlar elendi. Girdi seçimi ve sadeleştirme `scripts/build-catalog.py` içindedir.
- Aynı İngilizce çeviri grubunda bulunan Türkçe/Almanca karşılıklar mümkün olduğunda birlikte kullanıldı. Diğer dillerin bağımsız sözlük açıklamaları her zaman aynı anlamla birebir eşleşmeyebilir. Otomatik kaynak çıkarımı, insan tarafından 3000 kelimenin tamamının doğrulandığı anlamına gelmez.
- Yaygın dil bilgisi kelimelerinin kısa karşılıkları `editorial-core.json` içinde açık editoryal uyarlamalar olarak tutulur. Bunlar çekim ve kullanımın bağlama göre değiştiğini belirten yardımcı etiketlerdir; özgün kaynak sözlük açıklamaları ayrıca korunur.
- Bazı kelimelerde kısa Türkçe/Almanca karşılık veya açıklama bulunamadı. Eksik bölümler uygulamada açıkça belirtilir; makine çevirisi veya üretken yapay zekâ ile tamamlanmaz.
- 3000 kelimenin tamamı için İngilizce kaynak açıklaması vardır. Ayrıntılı kapsam sayıları `docs/catalog-build.json` içindedir.

Bu lisans bildirimi veri dosyaları içindir. Uygulama kodu, Wikimedia görselleri ve Tatoeba cümlelerinin lisansları kendi kaynaklarıyla ayrı değerlendirilir. Kelime görselleri bu pakete dahil değildir.

## Yeniden üretme

Python 3.9 veya üzeri, ek paket gerekmez:

```sh
python3 scripts/build-catalog.py --source-dir /tmp/aklikubbe-data --download
```

İndirilen büyük sözlükler yalnızca geliştirme girdileridir; siteye, `dist/` içine veya kullanıcı cihazına kopyalanmaz. Üretici `catalog-index.json` ve 100 kelimelik 30 anlam paketi oluşturur. Kaynaklar zamanla değişebileceğinden yeni indirmelerin hash ve çıkarma tarihleri yeniden kontrol edilmelidir. Yerel `*-slim.json` ara dosyaları yeniden üretimde kullanılabilir; kaynak değiştiyse bu ara dosyaları kaldır.
