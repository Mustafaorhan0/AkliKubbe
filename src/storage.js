export const STORAGE_KEY = 'aklikubbe.v1';
export const emptyState = () => ({ version: 1, learning: {}, saved: [] });
const licenses = new Set(['CC BY 2.0 FR', 'CC0 1.0']);
export function validateState(input, validIds) {
  if (!input || input.version !== 1 || !input.learning || Array.isArray(input.learning) || typeof input.learning !== 'object' || !Array.isArray(input.saved)) throw new Error('Geçerli bir AkliKubbe yedeği değil.');
  const result = emptyState();
  for (const [id, record] of Object.entries(input.learning)) {
    if (!validIds.has(id)) continue;
    if (!record || !['known', 'unknown'].includes(record.status) || !Number.isFinite(record.updatedAt)) throw new Error('Öğrenme kaydı geçersiz.');
    result.learning[id] = { status: record.status, updatedAt: record.updatedAt };
  }
  if (input.saved.length > 2000) throw new Error('Bir yedekte en fazla 2.000 cümle grubu olabilir.');
  const seen = new Set();
  for (const item of input.saved) {
    if (!item || !validIds.has(item.wordId) || typeof item.id !== 'string' || item.id.length > 100 || !Number.isFinite(item.savedAt) || !Array.isArray(item.sentences) || item.sentences.length < 1 || item.sentences.length > 3 || seen.has(item.id)) throw new Error('Kaydedilen cümle geçersiz.');
    const langs = new Set();
    const sentences = item.sentences.map(s => {
      if (!s || !Number.isSafeInteger(s.id) || s.id <= 0 || !['tur', 'eng', 'deu'].includes(s.lang) || langs.has(s.lang) || typeof s.text !== 'string' || !s.text.trim() || s.text.length > 2000 || typeof s.owner !== 'string' || s.owner.length > 200 || !licenses.has(s.license)) throw new Error('Cümle metni veya kaynak bilgisi geçersiz.');
      langs.add(s.lang);
      return { id: s.id, text: s.text, lang: s.lang, owner: s.owner, license: s.license };
    });
    seen.add(item.id);
    result.saved.push({ id: item.id, wordId: item.wordId, savedAt: item.savedAt, sentences });
  }
  return result;
}
export function readState(storage, validIds) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw ? validateState(JSON.parse(raw), validIds) : emptyState();
}
export function writeState(storage, next, validIds) {
  const clean = validateState(next, validIds);
  storage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}
export function classify(state, id, status, updatedAt = Date.now()) {
  return { ...state, learning: { ...state.learning, [id]: { status, updatedAt } } };
}
export function saveGroup(state, wordId, group, savedAt = Date.now()) {
  const id = `${wordId}:${group[0].id}`;
  if (state.saved.some(item => item.id === id)) return state;
  return { ...state, saved: [{ id, wordId, savedAt, sentences: group.map(s => ({ id: s.id, text: s.text, lang: s.lang, owner: s.owner || '', license: s.license })) }, ...state.saved] };
}
