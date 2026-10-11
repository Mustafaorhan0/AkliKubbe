import { words } from './data.js';
import { STORAGE_KEY, emptyState, readState, writeState, validateState, classify, saveGroup } from './storage.js';
import { getImage, getSentences, normalize } from './content.js';

const root = document.querySelector('#app');
const ids = new Set(words.map(w => w.id));
const byId = new Map(words.map(w => [w.id, w]));
const icons = {
 book:'<path d="M3 4h6a3 3 0 0 1 3 3v14a5 5 0 0 0-5-2H3zM21 4h-6a3 3 0 0 0-3 3v14a5 5 0 0 1 5-2h4z"/>',
 cards:'<rect x="6" y="3" width="14" height="18" rx="3"/><path d="M3 6v12a3 3 0 0 0 3 3m4-12h6m-6 4h4"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 repeat:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 2M4 16l2 2a7 7 0 0 0 12-1"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
 flip:'<path d="M5 6h11l-3-3m3 3-3 3M19 18H8l3-3m-3 3 3 3"/><rect x="8" y="9" width="8" height="6" rx="1"/>',
 leaf:'<path d="M20 3c-11-1-17 4-16 10a7 7 0 0 0 7 7c6-1 8-8 9-17ZM5 18 15 8"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
 undo:'<path d="M4 4v6h6M4 10a8 8 0 1 1 1 8"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = { tur:'Türkçe', eng:'İngilizce', deu:'Almanca' };
const licenseURL = license => license === 'CC0 1.0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : 'https://creativecommons.org/licenses/by/2.0/fr/';
let storageIssue = '';
let state;
try { state = readState(localStorage, ids); } catch { state = emptyState(); storageIssue = 'Cihazdaki kayıtlar okunamadı. Mevcut veriler üzerine yazılmayacak. Ayarlardan yedeği indirip kurtarabilir veya yeni bir yedek yükleyebilirsin.'; }
let view='study', category='Tümü', search='', session=[], cursor=0, sessionLabel='Yeni kelimeler', flipped=false, lastAction=null;
let image=null, imageMessage='', groups=[], exampleIndex=0, exampleMessage='', imageBusy=false, sentencesBusy=false;
let activeController=null, requestVersion=0, installPrompt=null, toastTimer, pointer=null;
const current = () => byId.get(session[cursor]);
const count = status => Object.values(state.learning).filter(x => x.status === status).length;
const matches = word => (category === 'Tümü' || word.category === category) && (!search || normalize(`${word.tr} ${word.en} ${word.de}`).includes(normalize(search)));
function commit(next) {
  if (storageIssue) { toast('Kayıt alanı kullanılamıyor. Ayarlardaki açıklamayı kontrol et.'); return false; }
  try { state = writeState(localStorage, next, ids); return true; }
  catch { toast('Kayıt cihazına yazılamadı. Depolama iznini ve boş alanı kontrol et; işlem uygulanmadı.'); return false; }
}
function toast(text) { const node=document.querySelector('#toast'); node.textContent=text; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('visible'),4500); }
function cancelLoads() { activeController?.abort(); requestVersion++; }
function startSession(list, label) {
  view='study'; session=list.map(w=>w.id); cursor=0; sessionLabel=label; flipped=false; loadCard(); render();
}
function newSession() { startSession(words.filter(w=>matches(w) && !state.learning[w.id]), 'Yeni kelimeler'); }
function render() {
  const known=count('known'), unknown=count('unknown');
  const nav=[['study','cards','Kelime kartları',words.length-known-unknown],['known','check','Bilinenler',known],['unknown','repeat','Bilinmeyenler',unknown],['saved','bookmark','Cümle defterim',state.saved.length]];
  root.innerHTML=`<aside class="sidebar"><a class="brand" href="./" aria-label="AkliKubbe ana sayfa"><span class="brand-icon">${icon('book')}</span><span>Akli<span class="brand-light">Kubbe</span><small>KELİMELERLE BÜYÜ</small></span></a><div class="nav-label">ÖĞRENME ALANIN</div><nav aria-label="Ana gezinme">${nav.map(([id,i,label,n])=>`<button class="nav-item ${view===id?'active':''}" data-nav="${id}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span><span class="nav-count">${n}</span></button>`).join('')}</nav><div class="sidebar-note">${icon('leaf')}<p>Küçük adımlar,<br><strong>yeni dünyalar.</strong></p><span>Her kart yeni bir başlangıç.</span></div><button class="nav-item settings-link ${view==='settings'?'active':''}" data-nav="settings">${icon('settings')}<span>Ayarlar ve kaynaklar</span></button><div class="local-note">${icon('shield')} Kayıtların bu cihazda</div></aside>
  <div class="workspace"><header class="topbar"><span class="breadcrumb">Öğrenme alanın <span>/</span> <strong>${esc(view==='settings'?'Ayarlar':nav.find(n=>n[0]===view)?.[2])}</strong></span><span class="connection ${navigator.onLine?'':'offline'}"><span></span>${navigator.onLine?'Çevrimiçi':'Çevrimdışı'}</span><button class="avatar" data-nav="settings" aria-label="Cihaz ayarlarını aç">AK</button></header><main id="main">${view==='study'?studyView():view==='saved'?savedView():view==='settings'?settingsView():collectionView()}</main><footer class="page-footer"><span>Bir kelime öğren. Bir dünya keşfet.</span><span>Türkçe · English · Deutsch</span></footer></div>
  <nav class="mobile-nav" aria-label="Mobil gezinme">${nav.map(([id,i,label])=>`<button data-nav="${id}" class="${view===id?'active':''}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${id==='study'?'Kartlar':id==='saved'?'Defterim':label}</span></button>`).join('')}<button data-nav="settings" class="${view==='settings'?'active':''}">${icon('settings')}<span>Ayarlar</span></button></nav>`;
}
function heading(eyebrow,title,description) { return `<div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>`; }
function filters() { return `<div class="filters"><div class="categories" aria-label="Kategori">${['Tümü','Yiyecek','Doğa','Hayvanlar','Günlük yaşam'].map(c=>`<button class="chip ${category===c?'selected':''}" data-category="${c}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" type="search" placeholder="Kelime ara…" value="${esc(search)}" aria-label="Kelime ara"></label></div>`; }
function studyView() {
 const w=current(), known=count('known'), unknown=count('unknown');
 return `${heading('BUGÜN YENİ BİR ŞEY ÖĞREN','Her kelime, yeni bir dünya.','Keşfet, çevir, kendini dene. Öğrenmek bir kartla başlar.')}${filters()}<div class="study-layout"><section class="study-area" aria-label="Kelime çalışma alanı"><div class="session-heading"><span>${icon('cards')} ${esc(sessionLabel)}</span><span>${w?`${cursor+1} / ${session.length}`:'Tamamlandı'}</span></div><div class="progress"><span style="width:${session.length?Math.round(cursor/session.length*100):0}%"></span></div>${w?`<article id="word-card" class="word-card ${flipped?'flipped':''}" aria-label="${esc(w.tr)} kelime kartı"><div class="card-topline"><span class="word-category">${icon(w.category==='Doğa'?'leaf':'book')} ${esc(w.category)}</span><span class="language-pill">TR <span>↔</span> EN <span>↔</span> DE</span></div>${flipped?backView(w):frontView(w)}</article><div class="decisions"><button id="unknown" class="decision unknown">${icon('close')}<span>Bilmiyorum<small>Sola kaydır</small></span>${icon('back')}</button><button id="known" class="decision known">${icon('check')}<span>Biliyorum<small>Sağa kaydır</small></span>${icon('arrow')}</button></div><div class="study-controls"><button id="undo" class="text-button" ${!lastAction?'disabled':''}>${icon('undo')} Geri al</button><span class="keyboard-hint"><kbd>←</kbd> <kbd>→</kbd> seç · <kbd>Boşluk</kbd> çevir</span><button id="skip" class="text-button">Atla ${icon('arrow')}</button></div>`:empty('Bir adım daha ileri.',session.length?'Bu oturumdaki kartları tamamladın. Bilinmeyenlere dönüp bilgini pekiştirebilirsin.':'Bu filtrede yeni kelime kalmadı. Başka kategori seçebilir veya bildiklerini tekrar edebilirsin.',`<button class="primary-button" data-nav="unknown">${icon('repeat')} Bilinmeyenleri tekrar et</button><button class="secondary-button" id="review-all">Tüm kelimeleri çalış</button>${lastAction?'<button id="undo" class="text-button">Son işlemi geri al</button>':''}`)}</section><aside class="insights"><section class="insight-card"><div class="insight-title">${icon('leaf')} Öğrenme yolculuğun</div><div class="big-number">${known}<span>/ ${words.length}</span></div><p>kelimeyi biliyorsun</p><div class="journey-bar"><span style="width:${known/words.length*100}%"></span></div><div class="stat-row"><span><i class="dot green"></i> Bilinenler</span><strong>${known}</strong></div><div class="stat-row"><span><i class="dot orange"></i> Bilinmeyenler</span><strong>${unknown}</strong></div><div class="stat-row"><span><i class="dot gray"></i> Keşfedilecek</span><strong>${words.length-known-unknown}</strong></div></section><section class="tip-card"><span class="tip-tag">KÜÇÜK BİR İPUCU</span><h3>Kelimeyi değil,<br>hikâyesini hatırla.</h3><p>Kartı çevir, kelimeyi bir cümle içinde gör. Beğendiğin cümleyi defterine ekle.</p>${icon('bookmark')}</section><div class="privacy-mini">${icon('shield')}<p>İlerlemen sana ait.<br><span>Hesap yok. Kayıtların bu cihazda.</span></p></div></aside></div>`;
}
function frontView(w) {
 return `<div class="word-title"><h2>${esc(w.tr)}</h2><p>Bir kelime. Üç dil. Yeni bir bağlantı.</p></div><button id="flip-front" class="image-stage" aria-label="${esc(w.tr)} kartını çevir">${image?`<img id="word-image" src="${esc(image.src)}" alt="${esc(w.tr)} — Wikimedia Commons görseli" referrerpolicy="no-referrer">`:`<div class="image-placeholder">${imageBusy?'<span class="spinner"></span>':icon('globe')}<span>${esc(imageBusy?'Görsel internetten getiriliyor…':imageMessage || 'Görsel bulunamadı.')}</span></div>`}<span class="flip-overlay">${icon('flip')} Kartı çevirmek için dokun</span></button><div class="image-credit">${image?`<a href="${esc(image.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons · ${esc(image.artist || 'Katkıda bulunan')} · ${esc(image.license)}</a>${image.licenseURL?` · <a href="${esc(image.licenseURL)}" target="_blank" rel="noopener noreferrer">Lisans</a>`:''}`:`<span>Görseller uygulamada arşivlenmez.</span><button id="retry-image" class="text-button" ${imageBusy?'disabled':''}>Yeniden dene</button>`}</div><button class="flip-button" id="flip">${icon('flip')} Anlamını ve örneklerini keşfet</button>`;
}
function backView(w) {
 const group=groups[exampleIndex];
 return `<div class="back-title"><div><h2>${esc(w.tr)}</h2><span>Üç dilde keşfet</span></div><button class="icon-button" id="flip" aria-label="Kartın ön yüzüne dön">${icon('flip')}</button></div><div class="language-grid">${[['TR','Türkçe',w.tr,w.definition],['EN','İngilizce',w.en,w.enDefinition],['DE','Almanca',w.de,w.deDefinition]].map(([code,l,word,def])=>`<div class="language-block"><span>${code} <small>${l}</small></span><h3>${esc(word)}</h3><p>${esc(def)}</p></div>`).join('')}</div><section class="examples"><div class="examples-heading"><span>${icon('globe')} Canlı örnek cümleler</span><button class="text-button" id="next-example" ${sentencesBusy?'disabled':''}>${icon('repeat')} Başka örnek</button></div>${sentencesBusy?'<div class="example-loading"><span class="spinner"></span> Tatoeba’dan örnekler getiriliyor…</div>':group?`${sentenceMarkup(group)}<div class="example-footer"><span>${exampleIndex+1} / ${groups.length} örnek · doğrudan kaynak çevirileri</span><button class="save-button" id="save-sentence" ${state.saved.some(s=>s.id===`${w.id}:${group[0].id}`)?'disabled':''}>${icon('bookmark')} ${state.saved.some(s=>s.id===`${w.id}:${group[0].id}`)?'Kaydedildi':'Cümleyi kaydet'}</button></div>`:`<div class="empty-example">${esc(exampleMessage || 'Bu anlamla eşleşen örnek bulunamadı.')}<button id="retry-sentences" class="text-button">Yeniden dene</button></div>`}</section><p class="content-note">Anlamlar başlangıç kataloğundan; örnekler internetten. Kaynak eşleşmeleri otomatik süzülür, anlam doğruluğu garanti edilmez.</p>`;
}
function sentenceMarkup(group) {
 return ['tur','eng','deu'].map(lang=>{
  const s=group.find(s=>s.lang===lang);
  return `<div class="sentence-row"><span class="lang-badge">${lang==='tur'?'TR':lang==='eng'?'EN':'DE'}</span><div>${s?`<p lang="${lang==='tur'?'tr':lang==='eng'?'en':'de'}">${esc(s.text)}</p><small><a href="https://tatoeba.org/tr/sentences/show/${s.id}" target="_blank" rel="noopener noreferrer">Tatoeba #${s.id} · ${esc(s.owner || 'Katkıda bulunan')}</a> · <a href="${licenseURL(s.license)}" target="_blank" rel="noopener noreferrer">${esc(s.license)}</a></small>`:`<p class="missing">${labels[lang]} eşleşen çeviri bulunamadı.</p>`}</div></div>`;
 }).join('');
}
function empty(title,description,actions='') { return `<div class="empty-state">${icon('leaf')}<h2>${title}</h2><p>${description}</p><div class="empty-actions">${actions}</div></div>`; }
function collectionView() {
 const isKnown=view==='known', status=isKnown?'known':'unknown';
 const list=words.filter(w=>matches(w)&&state.learning[w.id]?.status===status);
 return `${heading('KENDİ HIZINDA İLERLE',isKnown?'Bildiklerin burada.':'Tekrarla, kalıcı olsun.',isKnown?'Öğrendiğin kelimeleri yeniden keşfet. İstersen tekrar kutusuna taşı.':'Henüz öğrenmediğin kelimeler seni bekliyor. Her tekrar bir adım ileri.')}${filters()}<div class="collection-header"><span>${list.length} kelime</span><button class="primary-button" id="review-collection" ${!list.length?'disabled':''}>${icon('repeat')} ${isKnown?'Bu kelimeleri çalış':'Tekrarı başlat'}</button></div>${list.length?`<div class="word-list">${list.map(w=>`<article class="list-word"><span class="list-word-icon">${icon(isKnown?'check':'repeat')}</span><button class="word-open" data-open="${w.id}"><strong>${esc(w.tr)}</strong><span>${esc(w.en)} <i>·</i> ${esc(w.de)}</span></button><span class="list-category">${esc(w.category)}</span><button class="text-button move-word" data-move="${w.id}" data-status="${isKnown?'unknown':'known'}">${icon(isKnown?'repeat':'check')} ${isKnown?'Tekrara taşı':'Biliyorum'}</button></article>`).join('')}</div>`:empty(isKnown?'İlk öğrendiğin kelimeyi ekle.':'Tekrar kutun boş.',search||category!=='Tümü'?'Bu filtrede kelime bulunamadı.':'Kartları biliyorum veya bilmiyorum diye ayırdıkça burada göreceksin.','<button class="primary-button" data-nav="study">Kartlara git</button>')}`;
}
function savedView() {
 const list=state.saved.filter(item=>{const w=byId.get(item.wordId);return matches(w)||(!category||category==='Tümü')&&search&&item.sentences.some(s=>normalize(s.text).includes(normalize(search)));});
 return `${heading('HATIRLAMAYA DEĞER CÜMLELER','Kendi cümle defterin.','Beğendiğin örnekleri biriktir. Kaydettiğin metinler kaynak değişse de aynı kalır.')}${filters()}<div class="collection-header"><span>${list.length} kayıt · bu cihazda</span><button class="secondary-button" id="export">${icon('download')} Yedek indir</button></div>${list.length?`<div class="saved-list">${list.map(item=>`<article class="saved-card"><div class="saved-heading"><div><span class="eyebrow">${esc(byId.get(item.wordId).category)}</span><h2>${esc(byId.get(item.wordId).tr)}</h2></div><span>${new Date(item.savedAt).toLocaleDateString('tr-TR')}</span><button class="icon-button" data-delete="${esc(item.id)}" aria-label="${esc(byId.get(item.wordId).tr)} cümlesini sil">${icon('trash')}</button></div>${sentenceMarkup(item.sentences)}</article>`).join('')}</div>`:empty('Bir cümleyle başla.','Kartın arkasındaki “Cümleyi kaydet” düğmesine dokun. Cümle ve mevcut çevirileri çevrimdışı okumak için burada kalır.','<button class="primary-button" data-nav="study">Kelimeleri keşfet</button>')}`;
}
function settingsView() {
 const bytes=new TextEncoder().encode(JSON.stringify(state)).length;
 return `${heading('SADE, HAFİF, SANA AİT','Cihazın, senin defterin.','Öğrenme kayıtlarını yönet ve içerik kaynaklarını tanı.')}${storageIssue?`<div class="storage-warning" role="alert">${esc(storageIssue)}</div>`:''}<div class="settings-grid"><section class="settings-card"><h2>${icon('shield')} Yerel kayıtlar</h2><p>Bilinenler, bilinmeyenler ve kaydettiğin cümleler bu tarayıcıda saklanır. PC ve telefondaki kayıtlar ayrı tutulur. Tarayıcı verilerini silmek kayıtları da siler.</p><div class="storage-meter"><strong>${(bytes/1024).toFixed(1)} KB</strong><span>${Object.keys(state.learning).length} kelime kaydı · ${state.saved.length} cümle grubu</span></div><div class="settings-actions"><button class="primary-button" id="export">${icon('download')} Yedek indir</button><label class="secondary-button upload-label">${icon('plus')} Yedek yükle<input id="import" type="file" accept="application/json,.json"></label></div><p class="small-note">Yüklenen yedek mevcut öğrenme kayıtlarının yerini alır. Önce mevcut yedeğini indir. Hesap veya otomatik cihaz eşitleme yok.</p><button class="text-button danger" id="reset">${icon('trash')} Bu cihazdaki öğrenme kayıtlarını sıfırla</button></section><section class="settings-card"><h2>${icon('download')} Uygulama olarak kullan</h2><p>PC ve telefonda tarayıcıdan açabilirsin. Destekleyen tarayıcılarda ana ekrana ekleyerek ayrı bir uygulama penceresinde kullanabilirsin.</p><button class="primary-button" id="install">${icon('plus')} ${installPrompt?'Uygulamayı yükle':'Ana ekrana ekleme bilgisi'}</button><p class="small-note">Yeni görsel ve örnekler internet gerektirir. İlk çevrimiçi açılıştan sonra uygulama kabuğu ve kaydedilmiş cümleler çevrimdışı kullanılabilir. Google Play yayını ayrı bir paketleme ve mağaza aşamasıdır.</p></section><section class="settings-card"><h2>${icon('globe')} Kaynaklar ve lisanslar</h2><p>Görseller <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> üzerinden alınır. Her görselin eser sahibi ve lisansı kartın ön yüzünde gösterilir.</p><p>Cümleler <a href="https://tatoeba.org" target="_blank" rel="noopener noreferrer">Tatoeba</a> API’sinden alınır. Yalnızca doğrudan bağlı çeviriler gösterilir. Cümle kimlikleri, katkıda bulunanlar ve CC BY 2.0 FR / CC0 lisansları kayıtta korunur.</p><p>Katalogdaki ${words.length} kelimenin kısa açıklamaları bu uygulama için hazırlanmıştır. Bu katalog eksiksiz bir sözlük değildir. Otomatik eşleşme anlam doğruluğunu garanti etmez; hatalı bir örneği geçip kaynakta kontrol edebilirsin.</p></section><section class="settings-card"><h2>${icon('leaf')} Hafif kalmak için</h2><p>Görseller uygulama paketinde, localStorage’da veya uygulamanın çevrimdışı deposunda tutulmaz. Tarayıcı kendi HTTP önbelleğini yönetebilir; web uygulaması bu önbelleğin tamamını kontrol edemez.</p><p>Güncel örnekler en fazla 12 kelime için, 15 dakika boyunca çalışma belleğinde tutulur. Sekmeyi kapattığında silinir. Sadece senin kaydettiğin metinler kalıcıdır.</p><p>İçerik üretimi ve çeviri için yapay zekâ kullanılmaz. Canlı kaynaklara bağlanıldığında IP adresin ve istek bilgileri ilgili sağlayıcıya iletilir. Uygulamada analiz, reklam veya hesap servisi yoktur.</p></section></div>`;
}
async function loadCard() {
 cancelLoads(); image=null; groups=[]; imageMessage=''; exampleMessage=''; exampleIndex=0; flipped=false;
 const w=current(); if (!w) {imageBusy=false;sentencesBusy=false;return;}
 activeController=new AbortController();
 const cardSignal=activeController.signal, imageController=new AbortController();
 const abortImage=()=>imageController.abort();cardSignal.addEventListener('abort',abortImage,{once:true});
 const signal=imageController.signal, version=requestVersion;
 imageBusy=true; sentencesBusy=false;
 const timeout=setTimeout(abortImage,18000);
 try { const result=await getImage(w,signal); if(version===requestVersion)image=result; }
 catch(e) { if(version===requestVersion)imageMessage=navigator.onLine?(e.name==='AbortError'?'Görsel isteği zaman aşımına uğradı.':e.message):'Görseller için internet bağlantısı gerekiyor.'; }
 finally { clearTimeout(timeout);cardSignal.removeEventListener('abort',abortImage); if(version===requestVersion){imageBusy=false;if(view==='study')render();} }
}
async function loadExamples(refresh=false) {
 const w=current(); if(!w||sentencesBusy)return;
 const wordId=w.id, version=requestVersion;
 const controller=new AbortController(); const signal=controller.signal;
 const parent=activeController?.signal;
 const abort=()=>controller.abort(); parent?.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(abort,18000);
 sentencesBusy=true; exampleMessage=''; if(view==='study')render();
 try { const result=await getSentences(w,signal,refresh); if(version===requestVersion&&current()?.id===wordId){groups=result;exampleIndex=0;if(!groups.length)exampleMessage='Bu kelime için eşleşen doğrudan çevirili örnek bulunamadı.';} }
 catch(e) { if(version===requestVersion){groups=[];exampleMessage=navigator.onLine?(e.name==='AbortError'?'Cümle isteği zaman aşımına uğradı.':e.message):'Yeni örnekler için internet gerekiyor. Kaydettiklerini defterinden okuyabilirsin.';} }
 finally {clearTimeout(timeout);parent?.removeEventListener('abort',abort);if(version===requestVersion){sentencesBusy=false;if(view==='study')render();}}
}
function flipCard() { if(!current())return;flipped=!flipped;render();if(flipped&&!groups.length&&!exampleMessage&&!sentencesBusy)loadExamples(); }
function decide(status) {
 const w=current(); if(!w)return;
 const previous=state.learning[w.id];
 if(!commit(classify(state,w.id,status)))return;
 lastAction={id:w.id,previous,session:[...session],cursor,label:sessionLabel};
 cursor++; loadCard();render();toast(`${w.tr} ${status==='known'?'bilinenlere':'bilinmeyenlere'} eklendi.`);
}
function undo() {
 if(!lastAction)return;
 const learning={...state.learning};if(lastAction.previous)learning[lastAction.id]=lastAction.previous;else delete learning[lastAction.id];
 if(!commit({...state,learning}))return;
 session=lastAction.session;cursor=lastAction.cursor;sessionLabel=lastAction.label;lastAction=null;view='study';loadCard();render();toast('Son sınıflandırma geri alındı.');
}
function navigate(next) {cancelLoads();view=next;search='';category='Tümü';if(next==='study')newSession();else render();window.scrollTo({top:0,behavior:'instant'});}
function exportBackup() {
 let content=JSON.stringify(state,null,2);
 if(storageIssue){try{content=localStorage.getItem(STORAGE_KEY)||content;}catch{toast('Kayıt alanına erişilemiyor.');return;}}
 const blob=new Blob([content],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`aklikubbe-yedek-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Yedek dosyası indirildi.');
}
root.addEventListener('click', async event=>{
 if (!flipped && event.target.closest('#word-card') && !event.target.closest('button,a')) { flipCard(); return; }
 const b=event.target.closest('button,label');if(!b||b.disabled)return;
 if(b.dataset.nav){navigate(b.dataset.nav);return;}
 if(b.dataset.category){category=b.dataset.category;if(view==='study')newSession();else render();return;}
 if(b.dataset.open){startSession([byId.get(b.dataset.open)],'Seçtiğin kelime');return;}
 if(b.dataset.move){const w=byId.get(b.dataset.move);if(commit(classify(state,w.id,b.dataset.status))){lastAction=null;render();toast(`${w.tr} kutusu değiştirildi.`);}return;}
 if(b.dataset.delete){if(commit({...state,saved:state.saved.filter(s=>s.id!==b.dataset.delete)})){render();toast('Cümle defterinden silindi.');}return;}
 switch(b.id){
  case 'flip':case 'flip-front':flipCard();break;
  case 'known':decide('known');break;
  case 'unknown':decide('unknown');break;
  case 'undo':undo();break;
  case 'skip':cursor++;loadCard();render();break;
  case 'retry-image':loadCard();render();break;
  case 'retry-sentences':loadExamples(true);break;
  case 'next-example':if(groups.length>1){exampleIndex=(exampleIndex+1)%groups.length;render();}else loadExamples(true);break;
  case 'save-sentence':if(current()&&groups[exampleIndex]&&commit(saveGroup(state,current().id,groups[exampleIndex]))){render();toast('Cümle ve mevcut çevirileri cihazına kaydedildi.');}break;
  case 'review-all':startSession(words.filter(matches),'Tüm kelimeler');break;
  case 'review-collection':startSession(words.filter(w=>matches(w)&&state.learning[w.id]?.status===(view==='known'?'known':'unknown')),view==='known'?'Bilinenleri çalış':'Bilinmeyenleri tekrar et');break;
  case 'export':exportBackup();break;
  case 'reset':if(confirm('Bu cihazdaki tüm kelime durumları ve kaydedilmiş cümleler silinecek. Önce yedeğini indir. Devam edilsin mi?')){try{localStorage.removeItem(STORAGE_KEY);state=emptyState();storageIssue='';lastAction=null;render();toast('Öğrenme kayıtları sıfırlandı.');}catch{toast('Cihaz depolamasına erişilemiyor.');}}break;
  case 'install':if(installPrompt){await installPrompt.prompt();installPrompt=null;render();}else toast('Android/PC: tarayıcı menüsünden “Uygulamayı yükle”. iPhone: Safari → Paylaş → Ana Ekrana Ekle.');break;
 }
});
root.addEventListener('input',event=>{
 if(event.target.id!=='search')return;
 const pos=event.target.selectionStart;search=event.target.value;if(view==='study')newSession();else render();const input=document.querySelector('#search');input?.focus();try{input?.setSelectionRange(pos,pos);}catch{}
});
root.addEventListener('change',async event=>{
 if(event.target.id!=='import')return;
 const file=event.target.files[0];if(!file)return;
 try{
  if(file.size>2*1024*1024)throw new Error('Yedek en fazla 2 MB olabilir.');
  const clean=validateState(JSON.parse(await file.text()),ids);
  if(!confirm(`Yedekte ${Object.keys(clean.learning).length} kelime kaydı ve ${clean.saved.length} cümle grubu var. Mevcut kayıtların yerine yüklensin mi?`))return;
  const previousIssue=storageIssue;storageIssue='';if(commit(clean)){lastAction=null;render();toast('Yedek bu cihaza yüklendi.');}else storageIssue=previousIssue;
 }catch(e){toast(`Yedek yüklenemedi: ${e.message}`);}
});
root.addEventListener('error',event=>{if(event.target.id==='word-image'){image=null;imageMessage='Görsel dosyası yüklenemedi.';render();}},true);
root.addEventListener('pointerdown',event=>{if(view==='study'&&!flipped&&event.target.closest('#word-card')&&!event.target.closest('a'))pointer={x:event.clientX,y:event.clientY,id:event.pointerId};});
root.addEventListener('pointerup',event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.5){event.preventDefault();decide(dx>0?'known':'unknown');}});
root.addEventListener('pointercancel',()=>pointer=null);
document.addEventListener('keydown',event=>{
 if(view!=='study'||!current()||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,button,a'))return;
 if(event.key==='ArrowRight'){event.preventDefault();decide('known');}if(event.key==='ArrowLeft'){event.preventDefault();decide('unknown');}if(event.code==='Space'){event.preventDefault();flipCard();}
});
window.addEventListener('online',()=>{render();toast('İnternet bağlantısı geri geldi.');});
window.addEventListener('offline',()=>{render();toast('Çevrimdışısın. Kayıtların ve cümle defterin kullanılabilir.');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(view==='settings')render();});
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY)return;try{state=readState(localStorage,ids);storageIssue='';lastAction=null;render();toast('Diğer sekmedeki kayıtlar güncellendi.');}catch{storageIssue='Diğer sekmede geçersiz kayıt oluştu. Kayıtlar üzerine yazılmayacak.';render();}});
newSession();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('Çevrimdışı açılış hazırlanamadı; çevrimiçi kullanım devam ediyor.'));
