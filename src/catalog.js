import { words as legacyWords } from './legacy-data.js';
const packs = new Map();
const legacyIds=new Set(legacyWords.map(w=>w.id));
export const BANDS = [['all','Tüm sıralar'],['1','İlk 500'],['2','501–1000'],['3','1001–1500'],['4','1501–2000'],['5','2001–2500'],['6','2501–3000']];
export async function loadCatalog(fetcher = fetch) {
  const response = await fetcher(new URL('../data/catalog-index.json', import.meta.url), { cache:'no-cache' });
  if (!response.ok) throw new Error('3000 kelimelik katalog yüklenemedi.');
  const data = await response.json();
  if (data.version !== 1 || !Array.isArray(data.words) || data.words.length !== 3000) throw new Error('Katalog sürümü veya kelime sayısı geçersiz.');
  const idSet=new Set(), enSet=new Set();
  for (const [position,word] of data.words.entries()) {
    if (!word || typeof word.id !== 'string' || idSet.has(word.id) || typeof word.en !== 'string' || enSet.has(word.en.toLowerCase()) || !Number.isInteger(word.rank) || word.rank!==position+1 || typeof word.pack !== 'string' || !/^en-\d{2}$/.test(word.pack)) throw new Error('Katalog kaydı geçersiz.');
    idSet.add(word.id);enSet.add(word.en.toLowerCase());
  }
  const originals=new Map(legacyWords.map(w=>[w.en.toLowerCase(),w]));
  const words=data.words.map(word=>({...word,deck:'common',...(originals.has(word.en.toLowerCase())?originals.get(word.en.toLowerCase()):{}),category:word.category,legacyCategory:originals.get(word.en.toLowerCase())?.category}));
  for (const word of legacyWords) if(!idSet.has(word.id))words.push({...word,deck:'legacy'});
  return { words, info:data.info };
}
export function deckWords(words,deck) { if(deck==='legacy'){const byId=new Map(words.map(w=>[w.id,w]));return legacyWords.map(w=>byId.get(w.id)).filter(Boolean);}return words.filter(w=>!!w.rank); }
export function inBand(word,band) { return band==='all'||Math.ceil(word.rank/500)===Number(band); }
export function primaryLabel(word, language) {
  if (language==='en')return word.en;
  if (language==='de')return word.de||word.en;
  return word.tr||word.en;
}
export async function getDetails(word,signal,fetcher=fetch) {
  if (word.definition) return word;
  if (!word.pack) return word;
  let data=packs.get(word.pack);
  if (!data) {
    const response=await fetcher(new URL(`../data/packs/${word.pack}.json`,import.meta.url),{signal});
    if (!response.ok)throw new Error('Sözlük anlamları yüklenemedi.');
    data=await response.json();
    if (data.version!==1 || !data.entries || typeof data.entries!=='object')throw new Error('Sözlük paketi geçersiz.');
    packs.set(word.pack,data);if(packs.size>6)packs.delete(packs.keys().next().value);
  }else {packs.delete(word.pack);packs.set(word.pack,data);}
  const detail=data.entries[word.id];
  if (!detail || detail.en!==word.en)throw new Error('Kelimenin sözlük kaydı bulunamadı.');
  return {...word,...detail};
}
export function pageSlice(items,page,size=50) { const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(Math.max(1,page),pages);return {items:items.slice((current-1)*size,current*size),page:current,pages,total:items.length}; }
