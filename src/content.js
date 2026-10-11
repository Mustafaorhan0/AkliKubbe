const memory = new Map();
const MAX_ENTRIES = 12;
export const normalize = text => text.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export function includesTerm(text, term, lang) {
  if(typeof term!=='string'||!term.trim()||typeof text!=='string')return false;
  const tokens = normalize(text).match(/[\p{L}]+/gu) || [];
  const root = normalize(term);
  const phrase = root.match(/[\p{L}]+/gu) || [];
  if (phrase.length > 1) return tokens.some((_, i) => phrase.every((part, j) => tokens[i+j] === part));
  if (tokens.includes(root)) return true;
  if (lang === 'eng') return tokens.includes(root + 's') || tokens.includes(root + 'es');
  if (lang === 'deu') return tokens.some(t => t === root + 'e' || t === root + 'en' || t === root + 'n' || t === root + 'er');
  if (lang === 'tur') return tokens.some(t => t.startsWith(root) && /^(lar|ler|yi|yu|yü|ya|ye|da|de|dan|den|nin|nun|in|un|i|u|a|e|im|um|imiz|umuz|lari|leri)$/.test(t.slice(root.length)));
  return false;
}
async function getJSON(url, signal) {
  const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(response.status === 429 ? 'Kaynağın istek sınırına ulaşıldı. Biraz sonra yeniden dene.' : `Kaynak yanıt veremedi (${response.status}).`);
  return response.json();
}
export function textOnly(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return (doc.body.textContent || '').trim();
}
export function safeURL(value, hosts) {
  try { const url = new URL(value); return url.protocol === 'https:' && hosts.some(h => url.hostname === h || url.hostname.endsWith('.' + h)) ? url.href : ''; } catch { return ''; }
}
export async function getImage(word, signal) {
  let titles=word.image?[`File:${word.image}`]:[];
  if(!titles.length){
    if(!word.visual)throw new Error('Dil bilgisi ve soyut kelimeler görselsiz çalışılır.');
    const searchURL=new URL('https://commons.wikimedia.org/w/api.php');
    searchURL.search=new URLSearchParams({action:'query',format:'json',origin:'*',list:'search',srnamespace:'6',srsearch:`intitle:"${word.en}" filetype:bitmap`,srlimit:'5'}).toString();
    const results=await getJSON(searchURL,signal);
    titles=(results.query?.search||[]).map(item=>item.title).filter(title=>/\.(jpe?g|png|webp)$/i.test(title));
    if(!titles.length)throw new Error('Bu kelime için uygun arama görseli bulunamadı.');
  }
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action:'query', format:'json', origin:'*', titles:titles.join('|'), prop:'imageinfo', iiprop:'url|extmetadata', iiurlwidth:'720' }).toString();
  const json = await getJSON(url, signal);
  const pages=Object.values(json.query?.pages||{});
  const ordered=titles.map(title=>pages.find(p=>p.title===title||p.title===title.replaceAll('_',' '))).filter(Boolean);
  for(const page of ordered){
    const info=page.imageinfo?.[0];if(!info)continue;
    const meta=info.extmetadata||{};const license=textOnly(meta.LicenseShortName?.value);
    if(!word.image&&/\b(pornography|pornographic|genitalia|sexual intercourse|nude people|naked people)\b/i.test(textOnly(meta.Categories?.value)+' '+textOnly(meta.ImageDescription?.value)))continue;
    if(!license||!/^(CC|Public domain|PD|PDM)/i.test(license))continue;
    const src=safeURL(info.thumburl,['wikimedia.org']), source=safeURL(info.descriptionurl,['commons.wikimedia.org']);
    if(!src||!source)continue;
    return {src,source,artist:textOnly(meta.Artist?.value),license,licenseURL:safeURL(meta.LicenseUrl?.value,['creativecommons.org'])};
  }
  throw new Error('Görselin kullanım koşulları doğrulanamadı.');
}

const cleanSentence = s => ({ id:s.id, text:s.text, lang:s.lang, owner:s.owner || '', license:s.license });
export function selectGroups(data, word) {
  const result = [];
  for (const s of data) {
    if (!s || s.is_unapproved || !Number.isSafeInteger(s.id) || !['CC BY 2.0 FR', 'CC0 1.0'].includes(s.license) || !includesTerm(s.text, word.en, 'eng')) continue;
    const group = [cleanSentence(s)];
    for (const [lang, term] of [['tur', word.tr], ['deu', word.deSearch]]) {
      const match = (s.translations || []).find(t => t.lang === lang && t.is_direct === true && !t.is_unapproved && ['CC BY 2.0 FR', 'CC0 1.0'].includes(t.license) && (word.rank&&!word.image||includesTerm(t.text, term, lang)));
      if (match) group.push(cleanSentence(match));
    }
    // En az bir eşleşen çeviri: çok anlamlı kelimelerde ilgisiz örnek riskini azaltır.
    if (group.length > 1 || word.rank&&!word.image) result.push(group);
  }
  return result.sort((a,b) => b.length - a.length);
}
export async function getSentences(word, signal, refresh = false) {
  const old = memory.get(word.id);
  if (!refresh && old && Date.now() - old.time < 15 * 60 * 1000) return old.groups;
  const url = new URL('https://api.tatoeba.org/v1/sentences');
  url.search = new URLSearchParams({ lang:'eng', q:`"${word.en}"`, sort:'relevance', limit:'30', is_unapproved:'no', is_orphan:'no', 'trans:lang':'tur,deu', 'trans:is_direct':'yes', 'trans:is_unapproved':'no', 'showtrans:lang':'tur,deu', 'showtrans:is_direct':'yes', 'showtrans:is_unapproved':'no' }).toString();
  const json = await getJSON(url, signal);
  const groups = selectGroups(json.data || [], word);
  memory.delete(word.id);
  memory.set(word.id, { groups, time:Date.now() });
  if (memory.size > MAX_ENTRIES) memory.delete(memory.keys().next().value);
  return groups;
}
