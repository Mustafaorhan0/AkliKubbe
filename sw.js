const VERSION='v2';
const SCOPE=self.registration.scope;
const CACHE=`aklikubbe-shell-${VERSION}-${SCOPE}`;
const PACK_CACHE=`aklikubbe-packs-${VERSION}-${SCOPE}`;
const FILES=['./','./index.html','./src/app.js','./src/style.css','./src/data.js','./src/legacy-data.js','./src/catalog.js','./src/content.js','./src/storage.js','./data/catalog-index.json','./public/icon.svg','./public/icon-192.png','./public/icon-512.png','./manifest.webmanifest'];
const ALLOWED=new Set(FILES.map(file=>new URL(file,SCOPE).href));
const PACKS=new Set(Array.from({length:30},(_,i)=>new URL(`./data/packs/en-${String(i+1).padStart(2,'0')}.json`,SCOPE).href));
let writes=Promise.resolve();
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k==='aklikubbe-shell-v1'||k.startsWith('aklikubbe-')&&k.endsWith(SCOPE))&&k!==CACHE&&k!==PACK_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function savePack(request,response){
 writes=writes.catch(()=>{}).then(async()=>{
  const cache=await caches.open(PACK_CACHE);await cache.delete(request);await cache.put(request,response);
  const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-6)))await cache.delete(key);
 });
 return writes;
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const pack=PACKS.has(event.request.url);
 // No remote API, image or arbitrary file ever enters the app's cache.
 if(!pack&&!ALLOWED.has(event.request.url))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(pack?savePack(event.request,copy):caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(()=>caches.match(event.request).then(response=>response||new Response('Çevrimdışı dosya bulunamadı',{status:503}))));
});
