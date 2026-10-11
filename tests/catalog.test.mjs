import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog, deckWords, inBand, pageSlice, primaryLabel, getDetails } from '../src/catalog.js';
import { words as oldWords } from '../src/legacy-data.js';
import { emptyState, classify, validateState } from '../src/storage.js';
import { selectGroups, includesTerm } from '../src/content.js';
const fileFetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
const catalog=await loadCatalog(fileFetch);
const common=deckWords(catalog.words,'common');
test('exactly 3000 distinct English entries retain frequency order and six bands',()=>{
 assert.equal(common.length,3000);
 assert.equal(new Set(common.map(w=>w.en.toLowerCase())).size,3000);
 assert.equal(new Set(catalog.words.map(w=>w.id)).size,catalog.words.length);
 common.forEach((w,i)=>{assert.equal(w.rank,i+1);assert.ok(i===0||w.sourceRank>common[i-1].sourceRank);});
 for(let i=1;i<=6;i++)assert.equal(common.filter(w=>inBand(w,String(i))).length,500);
});
test('all legacy identities, meanings and v1 learning records survive catalogue expansion',()=>{
 assert.equal(deckWords(catalog.words,'legacy').length,30);
 const identities=new Set(catalog.words.map(w=>w.id));
 let state=emptyState();
 for(const old of oldWords){const entry=catalog.words.find(w=>w.id===old.id);assert.equal(entry.tr,old.tr);assert.equal(entry.definition,old.definition);state=classify(state,old.id,'known',100);}
 state=classify(state,'en:you','unknown',101);
 assert.deepEqual(validateState(state,identities),state);
});
test('3000 records do not produce 3000 DOM rows: pagination bounds and end pages',()=>{
 assert.equal(pageSlice(common,1).items.length,50);
 assert.equal(pageSlice(common,2).items[0].rank,51);
 assert.equal(pageSlice(common,60).items.at(-1).rank,3000);
 assert.equal(pageSlice(common,999).page,60);
 assert.equal(pageSlice([],0).page,1);
});
test('every dictionary entry has source-backed English content and no local word image binary',async()=>{
 let total=0;
 for(let i=1;i<=30;i++){
  const data=await fileFetch(new URL(`../data/packs/en-${String(i).padStart(2,'0')}.json`,import.meta.url)).then(r=>r.json());
  assert.equal(Object.keys(data.entries).length,100);
  for(const detail of Object.values(data.entries)){assert.ok(detail.enDefinition.trim());assert.ok(!('imageData' in detail));total++;}
 }
 assert.equal(total,3000);
});
test('missing translations are disclosed via source language fallback rather than invented',()=>{
 const word={en:'example',tr:'',de:''};
 assert.equal(primaryLabel(word,'tr'),'example');
 assert.equal(primaryLabel(word,'de'),'example');
 assert.equal(includesTerm('Anything',null,'tur'),false);
});
test('dictionary detail packs are fetched on demand and limited to six in memory',async()=>{
 const fresh=await import('../src/catalog.js?bounded-cache-test');let calls=0;
 const fetcher=async url=>{calls++;return fileFetch(url);};
 const chosen=Array.from({length:8},(_,i)=>common.find(w=>w.pack===`en-${String(i+1).padStart(2,'0')}`&&!w.definition));
 for(const word of chosen)await fresh.getDetails(word,undefined,fetcher);
 assert.equal(calls,8);await fresh.getDetails(chosen[7],undefined,fetcher);assert.equal(calls,8);
 await fresh.getDetails(chosen[0],undefined,fetcher);assert.equal(calls,9);
});
test('a grammatical example can use an implicit Turkish pronoun, but must be a direct licensed source translation',()=>{
 const word={id:'en:you',en:'you',rank:1,tr:'sen / siz',deSearch:'du'};
 const base={id:1,lang:'eng',text:'You write.',owner:'A',license:'CC BY 2.0 FR',translations:[{id:2,lang:'tur',text:'Yazıyorsun.',owner:'B',license:'CC BY 2.0 FR',is_direct:true}]};
 assert.equal(selectGroups([base],word)[0].length,2);
 base.translations[0].is_direct=false;assert.equal(selectGroups([base],word)[0].length,1);
});
test('catalogue download failures and malformed manifests fail before reading/writing user data',async()=>{
 await assert.rejects(loadCatalog(async()=>({ok:false})),/yüklenemedi/);
 await assert.rejects(loadCatalog(async()=>({ok:true,json:async()=>({version:1,words:[]})})),/geçersiz/);
});
