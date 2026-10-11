import test from 'node:test';
import assert from 'node:assert/strict';
import { words } from '../src/data.js';
import { STORAGE_KEY, emptyState, readState, writeState, validateState, classify, saveGroup } from '../src/storage.js';
import { includesTerm, selectGroups, safeURL } from '../src/content.js';
const ids = new Set(words.map(w => w.id));
const sentence = (id, lang, text, extra={}) => ({id,lang,text,owner:'tester',license:'CC BY 2.0 FR',is_unapproved:false,...extra});
const apple=words[0];
test('classification and backup survive persistence without duplicated boxes',()=>{
 const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 let state=classify(emptyState(),apple.id,'unknown',100);
 state=classify(state,apple.id,'known',101);
 writeState(storage,state,ids);
 assert.deepEqual(readState(storage,ids),state);
 assert.equal(Object.keys(state.learning).length,1);
 assert.equal(state.learning[apple.id].status,'known');
});
test('saved examples are independent snapshots and duplicate saves are ignored',()=>{
 const group=[sentence(1,'eng','An apple.'),sentence(2,'tur','Bir elma.')];
 const next=saveGroup(emptyState(),apple.id,group,100);
 group[0].text='Changed remotely';
 assert.equal(next.saved[0].sentences[0].text,'An apple.');
 assert.equal(saveGroup(next,apple.id,group).saved.length,1);
 assert.deepEqual(validateState(next,ids).saved,next.saved);
});
test('invalid backups and unsafe metadata are rejected',()=>{
 assert.throws(()=>validateState({version:2,learning:{},saved:[]},ids));
 assert.throws(()=>validateState({version:1,learning:{[apple.id]:{status:'anything',updatedAt:1}},saved:[]},ids));
 const state=saveGroup(emptyState(),apple.id,[sentence(1,'eng','Example',{license:'PROBLEM'})]);
 assert.throws(()=>validateState(state,ids));
 state.saved[0].sentences[0].license='CC BY 2.0 FR';state.saved[0].sentences[0].id=-1;
 assert.throws(()=>validateState(state,ids));
});
test('storage failures propagate so UI does not falsely claim a save',()=>{
 const storage={setItem(){throw new Error('QuotaExceededError');}};
 assert.throws(()=>writeState(storage,classify(emptyState(),apple.id,'known'),ids));
});
test('only direct, licensed translations with the target word are selected',()=>{
 const base=sentence(1,'eng','I eat apples.',{translations:[
 sentence(2,'tur','Elma yiyorum.',{is_direct:true}),
 sentence(3,'deu','Ich esse Äpfel.',{is_direct:true}),
 sentence(4,'deu','Anderes Wort.',{is_direct:true}),
 sentence(5,'deu','Apfel.',{is_direct:false})
 ]});
 const result=selectGroups([base],apple);
 assert.equal(result[0].length,3);
 assert.deepEqual(result[0].map(x=>x.id),[1,2,3]);
 const unrelated=sentence(6,'eng','Apple makes computers.',{translations:[sentence(7,'tur','Apple bilgisayar üretir.',{is_direct:true})]});
 assert.equal(selectGroups([unrelated],apple).length,0);
 base.translations[0].license='PROBLEM';base.translations[1].is_direct=false;
 assert.equal(selectGroups([base],apple).length,0);
});
test('word matching handles Turkish and German forms without arbitrary prefixes',()=>{
 assert.equal(includesTerm('Elmalar aldım.','elma','tur'),true);
 assert.equal(includesTerm('Das sind Äpfel.','Apfel','deu'),true);
 assert.equal(includesTerm('Sunday.','sun','eng'),false);
 assert.equal(includesTerm('Sunucu hazır.','su','tur'),false);
});
test('remote URLs must be HTTPS and belong to the expected provider',()=>{
 assert.equal(safeURL('javascript:alert(1)',['wikimedia.org']),'');
 assert.equal(safeURL('https://wikimedia.org.evil.test/x',['wikimedia.org']),'');
 assert.equal(safeURL('https://upload.wikimedia.org/x',['wikimedia.org']),'https://upload.wikimedia.org/x');
});
test('catalogue has unique identities and every word has three languages',()=>{
 assert.equal(ids.size,words.length);
 for(const word of words)for(const key of ['id','tr','en','de','deSearch','image','definition','enDefinition','deDefinition'])assert.ok(word[key]);
});
