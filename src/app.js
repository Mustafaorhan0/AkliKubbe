import { loadCatalog, getDetails, deckWords, inBand, primaryLabel, pageSlice, BANDS } from './catalog.js';
import { words as legacyWords } from './legacy-data.js';
import { STORAGE_KEY, emptyState, readState, writeState, validateState, classify, saveGroup } from './storage.js';
import { getImage, getSentences, normalize } from './content.js';

const root = document.querySelector('#app');
root.innerHTML='<div class="boot-screen"><span class="spinner"></span><h1>Kelime dünyan hazırlanıyor.</h1><p>3000 kelimelik katalog yükleniyor…</p></div>';
let catalogue;
try { catalogue=await loadCatalog(); }
catch(error){root.innerHTML='<div class="boot-screen"><h1>Katalog yüklenemedi.</h1><p>İnternet bağlantını kontrol et. Öğrenme kayıtların değiştirilmedi.</p><button id="reload-catalog">Yeniden dene</button></div>';document.querySelector('#reload-catalog').onclick=()=>location.reload();throw error;}
const words=catalogue.words;
const catalogueInfo=catalogue.info;

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
let view='study', deck='common', cardLanguage='en', coverage='all', band='all', sessionSize=25, listPage=1, category='Tümü', search='', session=[], cursor=0, sessionLabel='Yeni kelimeler', flipped=false, lastAction=null;
let detailWord=null, detailsBusy=false, detailMessage='';
let image=null, imageMessage='', groups=[], exampleIndex=0, exampleMessage='', imageBusy=false, sentencesBusy=false;
let activeController=null, requestVersion=0, installPrompt=null, toastTimer, pointer=null;
const current = () => detailWord?.id===session[cursor]?detailWord:byId.get(session[cursor]);
const activeWords=()=>deckWords(words,deck);
const categoryLabel=word=>deck==='legacy'?(word.legacyCategory||word.category):word.category;
const wordLabel=word=>primaryLabel(word,cardLanguage);
const deckCount=()=>activeWords().length;
const count = status => activeWords().filter(w=>state.learning[w.id]?.status===status).length;
const matches = word => (category === 'Tümü' || categoryLabel(word) === category) && (deck==='legacy'||inBand(word,band)) && (coverage==='all'||!!word.tr&&!!word.de) && (!search || normalize(`${word.tr||''} ${word.en} ${word.de||''} ${word.aliases||''}`).includes(normalize(search)));
function commit(next) {
  if (storageIssue) { toast('Kayıt alanı kullanılamıyor. Ayarlardaki açıklamayı kontrol et.'); return false; }
  try { state = writeState(localStorage, next, ids); return true; }
  catch { toast('Kayıt cihazına yazılamadı. Depolama iznini ve boş alanı kontrol et; işlem uygulanmadı.'); return false; }
}
function toast(text) { const node=document.querySelector('#toast'); node.textContent=text; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('visible'),4500); }
function cancelLoads() { activeController?.abort(); requestVersion++; }
function startSession(list, label) {
  view='study'; session=list.slice(0,sessionSize).map(w=>w.id); cursor=0; sessionLabel=label; flipped=false; loadCard(); render();
}
function newSession() { startSession(activeWords().filter(w=>matches(w) && !state.learning[w.id]), 'Yeni kelimeler'); }
function render() {
  const focused=document.activeElement?.id;
  const selection=focused==='search'?document.activeElement.selectionStart:null;
  const known=count('known'), unknown=count('unknown');
  const nav=[['study','cards','Kelime kartları',deckCount()-known-unknown],['catalog','book','Kelime kataloğu',deckCount()],['known','check','Bilinenler',known],['unknown','repeat','Bilinmeyenler',unknown],['saved','bookmark','Cümle defterim',state.saved.length]];
  root.innerHTML=`<aside class="sidebar"><a class="brand" href="./" aria-label="AkliKubbe ana sayfa"><span class="brand-icon">${icon('book')}</span><span>Akli<span class="brand-light">Kubbe</span><small>KELİMELERLE BÜYÜ</small></span></a><div class="nav-label">ÖĞRENME ALANIN</div><nav aria-label="Ana gezinme">${nav.map(([id,i,label,n])=>`<button class="nav-item ${view===id?'active':''}" data-nav="${id}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span><span class="nav-count">${n}</span></button>`).join('')}</nav><div class="sidebar-note">${icon('leaf')}<p>Küçük adımlar,<br><strong>yeni dünyalar.</strong></p><span>Her kart yeni bir başlangıç.</span></div><button class="nav-item settings-link ${view==='settings'?'active':''}" data-nav="settings">${icon('settings')}<span>Ayarlar ve kaynaklar</span></button><div class="local-note">${icon('shield')} Kayıtların bu cihazda</div></aside>
  <div class="workspace"><header class="topbar"><span class="breadcrumb">Öğrenme alanın <span>/</span> <strong>${esc(view==='settings'?'Ayarlar':nav.find(n=>n[0]===view)?.[2])}</strong></span><span class="connection ${navigator.onLine?'':'offline'}"><span></span>${navigator.onLine?'Çevrimiçi':'Çevrimdışı'}</span><button class="avatar" data-nav="settings" aria-label="Cihaz ayarlarını aç">AK</button></header><main id="main">${view==='study'?studyView():view==='saved'?savedView():view==='settings'?settingsView():collectionView()}</main><footer class="page-footer"><span>Bir kelime öğren. Bir dünya keşfet.</span><span>Türkçe · English · Deutsch</span></footer></div>
  <nav class="mobile-nav" aria-label="Mobil gezinme">${nav.map(([id,i,label])=>`<button data-nav="${id}" class="${view===id?'active':''}" ${view===id?'aria-current="page"':''}>${icon(i)}<span>${id==='study'?'Kartlar':id==='catalog'?'Katalog':id==='unknown'?'Tekrar':id==='saved'?'Defterim':label}</span></button>`).join('')}<button data-nav="settings" class="${view==='settings'?'active':''}">${icon('settings')}<span>Ayarlar</span></button></nav>`;
  if(focused){const node=document.getElementById(focused);node?.focus({preventScroll:true});if(selection!==null)try{node?.setSelectionRange(selection,selection);}catch{}}
}
function heading(eyebrow,title,description) { return `<div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>`; }
function filters() {
 if(view==='saved')return `<div class="filters saved-filters"><label class="search">${icon('search')}<input id="search" type="search" placeholder="Cümle veya kelime ara…" value="${esc(search)}" aria-label="Kelime ara"></label></div>`;
 const cats=deck==='legacy'?['Tümü','Yiyecek','Doğa','Hayvanlar','Günlük yaşam']:['Tümü','İsimler','Fiiller','Sıfatlar','Zarflar','Dil bilgisi','Diğer'];
 return `<div class="deck-controls"><label>Kelime paketi<select id="deck"><option value="common" ${deck==='common'?'selected':''}>Günlük İngilizce · 3000</option><option value="legacy" ${deck==='legacy'?'selected':''}>Görsel başlangıç · 30</option></select></label><label>Kart dili<select id="card-language">${[['en','İngilizce'],['tr','Türkçe'],['de','Almanca']].map(([id,name])=>`<option value="${id}" ${cardLanguage===id?'selected':''}>${name}</option>`).join('')}</select></label>${deck==='common'?`<label>Sıklık grubu<select id="band">${BANDS.map(([id,name])=>`<option value="${id}" ${band===id?'selected':''}>${name}</option>`).join('')}</select></label>`:''}<label>Oturum<select id="session-size">${[25,50,100].map(n=>`<option value="${n}" ${sessionSize===n?'selected':''}>${n} kelime</option>`).join('')}</select></label><label>Karşılıklar<select id="coverage"><option value="all" ${coverage==='all'?'selected':''}>Tüm kelimeler</option><option value="complete" ${coverage==='complete'?'selected':''}>TR + DE mevcut</option></select></label></div><div class="filters"><div class="categories" aria-label="Sözcük türü">${cats.map(c=>`<button class="chip ${category===c?'selected':''}" data-category="${c}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" type="search" placeholder="Üç dilde kelime ara…" value="${esc(search)}" aria-label="Kelime ara"></label></div>`;
}
function sourceLink(word,edition,label) {return `<a href="https://${edition}.wiktionary.org/wiki/${encodeURIComponent(word.en)}" target="_blank" rel="noopener noreferrer">${label}</a>`;}
function pagination(info) {return info.pages>1?`<div class="pagination"><button class="secondary-button" data-page="${info.page-1}" ${info.page===1?'disabled':''}>${icon('back')} Önceki</button><span>${info.page} / ${info.pages} · ${info.total} kayıt</span><button class="secondary-button" data-page="${info.page+1}" ${info.page===info.pages?'disabled':''}>Sonraki ${icon('arrow')}</button></div>`:'';}

function studyView() {
 const w=current(), known=count('known'), unknown=count('unknown');
 return `${heading('BUGÜN YENİ BİR ŞEY ÖĞREN','Her kelime, yeni bir dünya.',deck==='common'?'Sık kullanılan 3000 İngilizce kelimeyi kendi hızında öğren.':'Görsel başlangıç kartlarıyla üç dilde kelimeleri keşfet.')}${filters()}<div class="study-layout"><section class="study-area" aria-label="Kelime çalışma alanı"><div class="session-heading"><span>${icon('cards')} ${esc(sessionLabel)}</span><span>${w?`${cursor+1} / ${session.length}`:'Tamamlandı'}</span></div><div class="progress"><span style="width:${session.length?Math.round(cursor/session.length*100):0}%"></span></div>${w?`<article id="word-card" class="word-card ${flipped?'flipped':''}" aria-label="${esc(wordLabel(w))} kelime kartı"><div class="card-topline"><span class="word-category">${icon(w.category==='Doğa'?'leaf':'book')} ${esc(categoryLabel(w))}</span><span class="language-pill">TR <span>↔</span> EN <span>↔</span> DE</span></div>${flipped?backView(w):frontView(w)}</article><div class="decisions"><button id="unknown" class="decision unknown">${icon('close')}<span>Bilmiyorum<small>Sola kaydır</small></span>${icon('back')}</button><button id="known" class="decision known">${icon('check')}<span>Biliyorum<small>Sağa kaydır</small></span>${icon('arrow')}</button></div><div class="study-controls"><button id="undo" class="text-button" ${!lastAction?'disabled':''}>${icon('undo')} Geri al</button><span class="keyboard-hint"><kbd>←</kbd> <kbd>→</kbd> seç · <kbd>Boşluk</kbd> çevir</span><button id="skip" class="text-button">Atla ${icon('arrow')}</button></div>`:empty('Bir adım daha ileri.',session.length?'Bu oturumdaki kartları tamamladın. Bilinmeyenlere dönüp bilgini pekiştirebilirsin.':'Bu filtrede yeni kelime kalmadı. Başka kategori seçebilir veya bildiklerini tekrar edebilirsin.',`<button class="primary-button" data-nav="unknown">${icon('repeat')} Bilinmeyenleri tekrar et</button><button class="secondary-button" id="next-session">Sıradaki oturuma geç</button><button class="secondary-button" id="review-all">Bu paketi çalış</button>${lastAction?'<button id="undo" class="text-button">Son işlemi geri al</button>':''}`)}</section><aside class="insights"><section class="insight-card"><div class="insight-title">${icon('leaf')} Öğrenme yolculuğun</div><div class="big-number">${known}<span>/ ${deckCount()}</span></div><p>kelimeyi biliyorsun</p><div class="journey-bar"><span style="width:${known/deckCount()*100}%"></span></div><div class="stat-row"><span><i class="dot green"></i> Bilinenler</span><strong>${known}</strong></div><div class="stat-row"><span><i class="dot orange"></i> Bilinmeyenler</span><strong>${unknown}</strong></div><div class="stat-row"><span><i class="dot gray"></i> Keşfedilecek</span><strong>${deckCount()-known-unknown}</strong></div></section><section class="tip-card"><span class="tip-tag">KÜÇÜK BİR İPUCU</span><h3>Kelimeyi değil,<br>hikâyesini hatırla.</h3><p>Kartı çevir, kelimeyi bir cümle içinde gör. Beğendiğin cümleyi defterine ekle.</p>${icon('bookmark')}</section><div class="privacy-mini">${icon('shield')}<p>İlerlemen sana ait.<br><span>Hesap yok. Kayıtların bu cihazda.</span></p></div></aside></div>`;
}
function frontView(w) {
 const missing=cardLanguage!=='en'&&!w[cardLanguage];
 const imagePossible=!!w.image||w.visual;
 return `<div class="word-title"><h2>${esc(wordLabel(w))}</h2><p>${w.rank?`Paket sırası ${w.rank} / 3000 · ${esc(w.posLabel||categoryLabel(w))}`:'Bir kelime. Üç dil. Yeni bir bağlantı.'}${missing?' · seçilen dilde kısa karşılık yok':''}</p></div><button id="flip-front" class="image-stage ${imagePossible?'':'text-stage'}" aria-label="${esc(wordLabel(w))} kartını çevir">${image?`<img id="word-image" src="${esc(image.src)}" alt="${esc(wordLabel(w))} — Wikimedia Commons görseli" referrerpolicy="no-referrer">`:`<div class="image-placeholder">${imageBusy?'<span class="spinner"></span>':icon(imagePossible?'globe':'book')}<span>${esc(imageBusy?'Görsel internetten getiriliyor…':imageMessage || (imagePossible?'Görsel bulunamadı.':'Bu kelimeyi bir cümle içinde keşfet.'))}</span>${!imagePossible?`<span class="text-card-languages">${esc(w.en)}${w.tr?' · '+esc(w.tr):''}${w.de?' · '+esc(w.de):''}</span>`:''}</div>`}<span class="flip-overlay">${icon('flip')} Kartı çevirmek için dokun</span></button><div class="image-credit">${image?`<a href="${esc(image.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons · ${esc(image.artist || 'Katkıda bulunan')} · ${esc(image.license)}</a>${image.licenseURL?` · <a href="${esc(image.licenseURL)}" target="_blank" rel="noopener noreferrer">Lisans</a>`:''}${!w.image?' · arama görseli, anlamı kontrol et':''}`:`<span>${imagePossible?'Görseller uygulamada arşivlenmez.':'Dil bilgisi ve soyut kelimeler görselsiz çalışılır.'}</span>${imagePossible?`<button id="retry-image" class="text-button" ${imageBusy?'disabled':''}>Yeniden dene</button>`:''}`}</div><button class="flip-button" id="flip">${icon('flip')} Anlamını ve örneklerini keşfet</button>`;
}

function backView(w) {
 const group=groups[exampleIndex];
 return `<div class="back-title"><div><h2>${esc(wordLabel(w))}</h2><span>Üç dilde keşfet</span></div><button class="icon-button" id="flip" aria-label="Kartın ön yüzüne dön">${icon('flip')}</button></div><div class="language-grid">${[['TR','Türkçe',w.tr||'Kısa karşılık bulunamadı',w.definition],['EN','İngilizce',w.en,w.enDefinition],['DE','Almanca',w.de||'Kısa karşılık bulunamadı',w.deDefinition]].map(([code,l,word,def])=>`<div class="language-block"><span>${code} <small>${l}</small></span><h3>${esc(word)}</h3><p>${esc(def||(detailsBusy?'Sözlük anlamları yükleniyor…':detailMessage||'Bu dilde sözlük açıklaması bulunamadı.'))}</p></div>`).join('')}</div>${w.rank?`<div class="dictionary-credit">${sourceLink(w,"en","English Wiktionary")} · ${sourceLink(w,"tr","Vikisözlük")} · ${sourceLink(w,"de","Wiktionary DE")} · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>${detailMessage?'<button id="retry-details" class="text-button">Anlamları yeniden yükle</button>':''}</div>`:''}<section class="examples"><div class="examples-heading"><span>${icon('globe')} Canlı örnek cümleler</span><button class="text-button" id="next-example" ${sentencesBusy?'disabled':''}>${icon('repeat')} Başka örnek</button></div>${sentencesBusy?'<div class="example-loading"><span class="spinner"></span> Tatoeba’dan örnekler getiriliyor…</div>':group?`${sentenceMarkup(group)}<div class="example-footer"><span>${exampleIndex+1} / ${groups.length} örnek · doğrudan kaynak çevirileri</span><button class="save-button" id="save-sentence" ${state.saved.some(s=>s.id===`${w.id}:${group[0].id}`)?'disabled':''}>${icon('bookmark')} ${state.saved.some(s=>s.id===`${w.id}:${group[0].id}`)?'Kaydedildi':'Cümleyi kaydet'}</button></div>`:`<div class="empty-example">${esc(exampleMessage || 'Bu anlamla eşleşen örnek bulunamadı.')}<button id="retry-sentences" class="text-button">Yeniden dene</button></div>`}</section><p class="content-note">Sözlükte birden fazla anlam olabilir. Cümleler doğrudan kaynak çevirileridir; bu karttaki ilk anlamı kullanmaları garanti edilmez.</p>`;
}
function sentenceMarkup(group) {
 return ['tur','eng','deu'].map(lang=>{
  const s=group.find(s=>s.lang===lang);
  return `<div class="sentence-row"><span class="lang-badge">${lang==='tur'?'TR':lang==='eng'?'EN':'DE'}</span><div>${s?`<p lang="${lang==='tur'?'tr':lang==='eng'?'en':'de'}">${esc(s.text)}</p><small><a href="https://tatoeba.org/tr/sentences/show/${s.id}" target="_blank" rel="noopener noreferrer">Tatoeba #${s.id} · ${esc(s.owner || 'Katkıda bulunan')}</a> · <a href="${licenseURL(s.license)}" target="_blank" rel="noopener noreferrer">${esc(s.license)}</a></small>`:`<p class="missing">${labels[lang]} eşleşen çeviri bulunamadı.</p>`}</div></div>`;
 }).join('');
}
function empty(title,description,actions='') { return `<div class="empty-state">${icon('leaf')}<h2>${title}</h2><p>${description}</p><div class="empty-actions">${actions}</div></div>`; }
function collectionView() {
 const catalog=view==='catalog', isKnown=view==='known', status=isKnown?'known':'unknown';
 const list=activeWords().filter(w=>matches(w)&&(catalog||state.learning[w.id]?.status===status));
 const info=pageSlice(list,listPage);listPage=info.page;
 return `${heading('KENDİ HIZINDA İLERLE',catalog?`${deckCount()} kelime, adım adım.`:isKnown?'Bildiklerin burada.':'Tekrarla, kalıcı olsun.',catalog?'Liste sıklık sırasındadır. Bir kelime seç, anlamlarını ve örneklerini keşfet.':isKnown?'Öğrendiğin kelimeleri yeniden keşfet. İstersen tekrar kutusuna taşı.':'Henüz öğrenmediğin kelimeler seni bekliyor. Her tekrar bir adım ileri.')}${filters()}<div class="collection-header"><span>${list.length} kelime · ${catalog?'sıklık sırası':'bu cihazda'}</span><button class="primary-button" id="review-collection" ${!list.length?'disabled':''}>${icon('repeat')} ${catalog?'Bu listeyi çalış':isKnown?'Bu kelimeleri çalış':'Tekrarı başlat'}</button></div>${list.length?`<div class="word-list">${info.items.map(w=>`<article class="list-word"><span class="list-word-icon">${w.rank?'<small>'+w.rank+'</small>':icon(isKnown?'check':'repeat')}</span><button class="word-open" data-open="${w.id}"><strong>${esc(wordLabel(w))}</strong><span>${esc(w.en)} <i>·</i> ${esc(w.tr||'TR karşılık yok')} <i>·</i> ${esc(w.de||'DE karşılık yok')}</span></button><span class="list-category">${esc(categoryLabel(w))}</span><button class="text-button move-word" data-move="${w.id}" data-status="${state.learning[w.id]?.status==='known'?'unknown':'known'}">${icon(state.learning[w.id]?.status==='known'?'repeat':'check')} ${state.learning[w.id]?.status==='known'?'Tekrara taşı':'Biliyorum'}</button></article>`).join('')}</div>${pagination(info)}`:empty(catalog?'Bu aramada kelime yok.':isKnown?'İlk öğrendiğin kelimeyi ekle.':'Tekrar kutun boş.',(search||category!=='Tümü'||band!=='all'||coverage!=='all')?'Filtrelerini değiştirebilirsin.':'Kartları biliyorum veya bilmiyorum diye ayırdıkça burada göreceksin.','<button class="primary-button" data-nav="study">Kartlara git</button>')}`;
}

function savedView() {
 const filtered=state.saved.filter(item=>{const w=byId.get(item.wordId);return !search||normalize(`${w.en} ${w.tr||''} ${w.de||''}`).includes(normalize(search))||item.sentences.some(s=>normalize(s.text).includes(normalize(search)));});
 const info=pageSlice(filtered,listPage);listPage=info.page;const list=info.items;
 return `${heading('HATIRLAMAYA DEĞER CÜMLELER','Kendi cümle defterin.','Beğendiğin örnekleri biriktir. Kaydettiğin metinler kaynak değişse de aynı kalır.')}${filters()}<div class="collection-header"><span>${filtered.length} kayıt · tüm paketler</span><button class="secondary-button" id="export">${icon('download')} Yedek indir</button></div>${list.length?`<div class="saved-list">${list.map(item=>`<article class="saved-card"><div class="saved-heading"><div><span class="eyebrow">${esc(byId.get(item.wordId).category)}</span><h2>${esc(wordLabel(byId.get(item.wordId)))}</h2></div><span>${new Date(item.savedAt).toLocaleDateString('tr-TR')}</span><button class="icon-button" data-delete="${esc(item.id)}" aria-label="${esc(wordLabel(byId.get(item.wordId)))} cümlesini sil">${icon('trash')}</button></div>${sentenceMarkup(item.sentences)}</article>`).join('')}</div>${pagination(info)}`:empty('Bir cümleyle başla.','Kartın arkasındaki “Cümleyi kaydet” düğmesine dokun. Cümle ve mevcut çevirileri çevrimdışı okumak için burada kalır.','<button class="primary-button" data-nav="study">Kelimeleri keşfet</button>')}`;
}
function settingsView() {
 const bytes=new TextEncoder().encode(JSON.stringify(state)).length;
 return `${heading('SADE, HAFİF, SANA AİT','Cihazın, senin defterin.','Öğrenme kayıtlarını yönet ve içerik kaynaklarını tanı.')}${storageIssue?`<div class="storage-warning" role="alert">${esc(storageIssue)}</div>`:''}<div class="settings-grid"><section class="settings-card"><h2>${icon('shield')} Yerel kayıtlar</h2><p>Bilinenler, bilinmeyenler ve kaydettiğin cümleler bu tarayıcıda saklanır. PC ve telefondaki kayıtlar ayrı tutulur. Tarayıcı verilerini silmek kayıtları da siler.</p><div class="storage-meter"><strong>${(bytes/1024).toFixed(1)} KB</strong><span>${Object.keys(state.learning).length} kelime kaydı · ${state.saved.length} cümle grubu</span></div><div class="settings-actions"><button class="primary-button" id="export">${icon('download')} Yedek indir</button><label class="secondary-button upload-label">${icon('plus')} Yedek yükle<input id="import" type="file" accept="application/json,.json"></label></div><p class="small-note">Yüklenen yedek mevcut öğrenme kayıtlarının yerini alır. Önce mevcut yedeğini indir. Hesap veya otomatik cihaz eşitleme yok. Katalog genişlediğinde önceki 30 kelimenin öğrenme kayıtları korunur.</p><button class="text-button danger" id="reset">${icon('trash')} Bu cihazdaki öğrenme kayıtlarını sıfırla</button></section><section class="settings-card"><h2>${icon('download')} Uygulama olarak kullan</h2><p>PC ve telefonda tarayıcıdan açabilirsin. Destekleyen tarayıcılarda ana ekrana ekleyerek ayrı bir uygulama penceresinde kullanabilirsin.</p><button class="primary-button" id="install">${icon('plus')} ${installPrompt?'Uygulamayı yükle':'Ana ekrana ekleme bilgisi'}</button><p class="small-note">Yeni görsel ve örnekler internet gerektirir. İlk çevrimiçi açılıştan sonra uygulama kabuğu ve kaydedilmiş cümleler çevrimdışı kullanılabilir. Google Play yayını ayrı bir paketleme ve mağaza aşamasıdır.</p></section><section class="settings-card"><h2>${icon('globe')} Kaynaklar ve lisanslar</h2><p>Görseller <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> üzerinden alınır. Her görselin eser sahibi ve lisansı kartın ön yüzünde gösterilir.</p><p>Cümleler <a href="https://tatoeba.org" target="_blank" rel="noopener noreferrer">Tatoeba</a> API’sinden alınır. Yalnızca doğrudan bağlı çeviriler gösterilir. Cümle kimlikleri, katkıda bulunanlar ve CC BY 2.0 FR / CC0 lisansları kayıtta korunur.</p><p>Günlük İngilizce paketi, <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener noreferrer">FrequencyWords / OpenSubtitles 2018</a> sıklık verisinden seçilen 3000 kelimedir. Sözcük parçaları ve belirgin kişi adları elendi; bu, evrensel veya 2026 yılına ait bir konuşma sıralaması değildir. Açıklamalar ve karşılıklar <a href="https://kaikki.org/" target="_blank" rel="noopener noreferrer">Kaikki / Wiktionary katkıda bulunanlarından</a> alınmıştır. Veri uyarlaması <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> lisansındadır. <a href="./data/README.md" target="_blank" rel="noopener noreferrer">Kaynaklar ve yapılan değişiklikler</a>. Eski 30 görsel kartın özgün açıklamaları korunur. İngilizce açıklamalar 3000 kelimede vardır; Türkçe ve Almanca kapsamı eksiksiz değildir. “TR + DE mevcut” filtresiyle kısa karşılığı bulunanları çalışabilirsin. Otomatik eşleşme anlam doğruluğunu garanti etmez; hatalı bir örneği geçip kaynakta kontrol edebilirsin.</p></section><section class="settings-card"><h2>${icon('leaf')} Hafif kalmak için</h2><p>Görseller uygulama paketinde, localStorage’da veya uygulamanın çevrimdışı deposunda tutulmaz. Tarayıcı kendi HTTP önbelleğini yönetebilir; web uygulaması bu önbelleğin tamamını kontrol edemez.</p><p>3000 kelimelik küçük arama dizini yüklenir; sözlük açıklamaları ihtiyaç oldukça 100 kelimelik paketlerden alınır. En fazla 6 metin paketi çevrimdışı önbellekte ve bellekte tutulur. Güncel örnekler en fazla 12 kelime için, 15 dakika boyunca çalışma belleğinde tutulur. Sekmeyi kapattığında silinir. Sadece senin kaydettiğin metinler kalıcıdır.</p><p>İçerik üretimi ve çeviri için yapay zekâ kullanılmaz. Canlı kaynaklara bağlanıldığında IP adresin ve istek bilgileri ilgili sağlayıcıya iletilir. Uygulamada analiz, reklam veya hesap servisi yoktur.</p></section></div>`;
}
async function loadCard() {
 cancelLoads(); detailWord=null;detailsBusy=false;detailMessage='';image=null; groups=[]; imageMessage=''; exampleMessage=''; exampleIndex=0; flipped=false;
 const w=current(); if (!w) {imageBusy=false;sentencesBusy=false;return;}
 activeController=new AbortController();
 const cardSignal=activeController.signal, imageController=new AbortController();
 const abortImage=()=>imageController.abort();cardSignal.addEventListener('abort',abortImage,{once:true});
 const signal=imageController.signal, version=requestVersion;
 imageBusy=!!w.image||w.visual; sentencesBusy=false;
 loadDetails();
 if(!imageBusy)return;
 const timeout=setTimeout(abortImage,18000);
 try { const result=await getImage(w,signal); if(version===requestVersion)image=result; }
 catch(e) { if(version===requestVersion)imageMessage=navigator.onLine?(e.name==='AbortError'?'Görsel isteği zaman aşımına uğradı.':e.message):'Görseller için internet bağlantısı gerekiyor.'; }
 finally { clearTimeout(timeout);cardSignal.removeEventListener('abort',abortImage); if(version===requestVersion){imageBusy=false;if(view==='study')render();} }
}
async function loadDetails() {
 const word=byId.get(session[cursor]);if(!word||detailsBusy)return;
 const version=requestVersion;detailsBusy=true;detailMessage='';
 try{const value=await getDetails(word,activeController?.signal);if(version===requestVersion)detailWord=value;}
 catch(error){if(version===requestVersion&&error.name!=='AbortError')detailMessage=navigator.onLine?error.message:'Bu kelimenin anlam paketi çevrimdışı kayıtlı değil.';}
 finally{if(version===requestVersion){detailsBusy=false;if(view==='study')render();}}
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
 lastAction={id:w.id,previous,session:[...session],cursor,label:sessionLabel,config:{deck,band,cardLanguage,coverage,category,search,sessionSize}};
 cursor++; loadCard();render();toast(`${wordLabel(w)} ${status==='known'?'bilinenlere':'bilinmeyenlere'} eklendi.`);
}
function undo() {
 if(!lastAction)return;
 const learning={...state.learning};if(lastAction.previous)learning[lastAction.id]=lastAction.previous;else delete learning[lastAction.id];
 if(!commit({...state,learning}))return;
 ({deck,band,cardLanguage,coverage,category,search,sessionSize}=lastAction.config);session=lastAction.session;cursor=lastAction.cursor;sessionLabel=lastAction.label;lastAction=null;view='study';loadCard();render();toast('Son sınıflandırma geri alındı.');
}
function navigate(next) {cancelLoads();view=next;search='';category='Tümü';listPage=1;if(next==='study')newSession();else render();window.scrollTo({top:0,behavior:'instant'});}
function exportBackup() {
 let content=JSON.stringify(state,null,2);
 if(storageIssue){try{content=localStorage.getItem(STORAGE_KEY)||content;}catch{toast('Kayıt alanına erişilemiyor.');return;}}
 const blob=new Blob([content],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`aklikubbe-yedek-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Yedek dosyası indirildi.');
}
root.addEventListener('click', async event=>{
 if (!flipped && event.target.closest('#word-card') && !event.target.closest('button,a')) { flipCard(); return; }
 const b=event.target.closest('button,label');if(!b||b.disabled)return;
 if(b.dataset.nav){navigate(b.dataset.nav);return;}
 if(b.dataset.page){listPage=Number(b.dataset.page);render();document.querySelector('.collection-header')?.scrollIntoView({block:'start'});return;}
 if(b.dataset.category){category=b.dataset.category;listPage=1;if(view==='study')newSession();else render();return;}
 if(b.dataset.open){startSession([byId.get(b.dataset.open)],'Seçtiğin kelime');return;}
 if(b.dataset.move){const w=byId.get(b.dataset.move);if(commit(classify(state,w.id,b.dataset.status))){lastAction=null;render();toast(`${wordLabel(w)} kutusu değiştirildi.`);}return;}
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
  case 'next-session':newSession();break;
  case 'retry-details':loadDetails();break;
  case 'review-all':startSession(activeWords().filter(matches),'Bu paketi çalış');break;
  case 'review-collection':startSession(activeWords().filter(w=>matches(w)&&(view==='catalog'||state.learning[w.id]?.status===(view==='known'?'known':'unknown'))),view==='catalog'?'Katalogdan çalış':view==='known'?'Bilinenleri çalış':'Bilinmeyenleri tekrar et');break;
  case 'export':exportBackup();break;
  case 'reset':if(confirm('Bu cihazdaki tüm kelime durumları ve kaydedilmiş cümleler silinecek. Önce yedeğini indir. Devam edilsin mi?')){try{localStorage.removeItem(STORAGE_KEY);state=emptyState();storageIssue='';lastAction=null;render();toast('Öğrenme kayıtları sıfırlandı.');}catch{toast('Cihaz depolamasına erişilemiyor.');}}break;
  case 'install':if(installPrompt){await installPrompt.prompt();installPrompt=null;render();}else toast('Android/PC: tarayıcı menüsünden “Uygulamayı yükle”. iPhone: Safari → Paylaş → Ana Ekrana Ekle.');break;
 }
});
root.addEventListener('input',event=>{
 if(event.target.id!=='search')return;
 const pos=event.target.selectionStart;search=event.target.value;listPage=1;if(view==='study')newSession();else render();const input=document.querySelector('#search');input?.focus();try{input?.setSelectionRange(pos,pos);}catch{}
});
root.addEventListener('change',async event=>{
 const id=event.target.id;
 if(['deck','card-language','band','session-size','coverage'].includes(id)){
  const value=event.target.value;
  if(id==='deck'){deck=value;category='Tümü';band='all';coverage='all';search='';cardLanguage=deck==='legacy'?'tr':'en';lastAction=null;}
  if(id==='card-language')cardLanguage=value;
  if(id==='band')band=value;
  if(id==='session-size')sessionSize=Number(value);
  if(id==='coverage')coverage=value;
  listPage=1;if(view==='study'&&id!=='card-language')newSession();else render();return;
 }
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
 if(view!=='study'||!current()||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select'))return;
 if(event.key==='ArrowRight'){event.preventDefault();decide('known');}if(event.key==='ArrowLeft'){event.preventDefault();decide('unknown');}if(event.code==='Space'&&!event.target.closest('button,a')){event.preventDefault();flipCard();}
});
window.addEventListener('online',()=>{render();toast('İnternet bağlantısı geri geldi.');});
window.addEventListener('offline',()=>{render();toast('Çevrimdışısın. Kayıtların ve cümle defterin kullanılabilir.');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(view==='settings')render();});
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY)return;try{state=readState(localStorage,ids);storageIssue='';lastAction=null;render();toast('Diğer sekmedeki kayıtlar güncellendi.');}catch{storageIssue='Diğer sekmede geçersiz kayıt oluştu. Kayıtlar üzerine yazılmayacak.';render();}});
newSession();
if('serviceWorker' in navigator){
 const warmCurrentPack=()=>{const word=current();if(word?.pack&&!word.definition)fetch(new URL(`../data/packs/${word.pack}.json`,import.meta.url)).catch(()=>{});};
 navigator.serviceWorker.addEventListener('controllerchange',warmCurrentPack);
 navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{if(navigator.serviceWorker.controller)warmCurrentPack();}).catch(()=>toast('Çevrimdışı açılış hazırlanamadı; çevrimiçi kullanım devam ediyor.'));
}
