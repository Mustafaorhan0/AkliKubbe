const memory = new Map();
const MAX_ENTRIES = 12;
export const normalize = text => text.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export function includesTerm(text, term, lang) {
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
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  const params = { action:'query', format:'json', origin:'*', titles:`File:${word.image}`, prop:'imageinfo', iiprop:'url|extmetadata', iiurlwidth:'720' };
  url.search = new URLSearchParams(params).toString();
  const json = await getJSON(url, signal);
  const info = Object.values(json.query?.pages || {})[0]?.imageinfo?.[0];
  if (!info) throw new Error('Bu kelime için görsel bulunamadı.');
  const meta = info.extmetadata || {};
  const license = textOnly(meta.LicenseShortName?.value);
  if (!license || !/^(CC|Public domain|PD|PDM)/i.test(license)) throw new Error('Görselin kullanım koşulları doğrulanamadı.');
  const src = safeURL(info.thumburl, ['wikimedia.org']);
  const source = safeURL(info.descriptionurl, ['commons.wikimedia.org']);
  if (!src || !source) throw new Error('Görsel bağlantısı doğrulanamadı.');
  return { src, source, artist: textOnly(meta.Artist?.value), license, licenseURL: safeURL(meta.LicenseUrl?.value, ['creativecommons.org']) };
}
const cleanSentence = s => ({ id:s.id, text:s.text, lang:s.lang, owner:s.owner || '', license:s.license });
export function selectGroups(data, word) {
  const result = [];
  for (const s of data) {
    if (!s || s.is_unapproved || !Number.isSafeInteger(s.id) || !['CC BY 2.0 FR', 'CC0 1.0'].includes(s.license) || !includesTerm(s.text, word.en, 'eng')) continue;
    const group = [cleanSentence(s)];
    for (const [lang, term] of [['tur', word.tr], ['deu', word.deSearch]]) {
      const match = (s.translations || []).find(t => t.lang === lang && t.is_direct === true && !t.is_unapproved && ['CC BY 2.0 FR', 'CC0 1.0'].includes(t.license) && includesTerm(t.text, term, lang));
      if (match) group.push(cleanSentence(match));
    }
    // En az bir eşleşen çeviri: çok anlamlı kelimelerde ilgisiz örnek riskini azaltır.
    if (group.length > 1) result.push(group);
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
