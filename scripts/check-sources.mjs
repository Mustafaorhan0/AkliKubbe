import { words } from '../src/data.js';
import { selectGroups } from '../src/content.js';
const report={checkedAt:new Date().toISOString(),images:[],sentences:[]};
for(let i=0;i<words.length;i+=5){
 const batch=words.slice(i,i+5);
 const params=new URLSearchParams({action:'query',format:'json',origin:'*',titles:batch.map(w=>'File:'+w.image).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'360'});
 try{
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(String(response.status));
  const json=await response.json();
  const pages=Object.values(json.query?.pages||{});
  for(const word of batch){const page=pages.find(p=>p.title==='File:'+word.image);const info=page?.imageinfo?.[0];report.images.push({word:word.tr,available:!!info?.thumburl,compatible:/^(CC|Public domain|PD|PDM)/i.test(info?.extmetadata?.LicenseShortName?.value||''),license:info?.extmetadata?.LicenseShortName?.value||null});}
 }catch(e){for(const word of batch)report.images.push({word:word.tr,available:false,error:e.message});}
}
for(const word of words.filter(w=>['Q89','Q146','Q10884','Q571','Q81727','Q2811'].includes(w.id))){
 const params=new URLSearchParams({lang:'eng',q:`"${word.en}"`,sort:'relevance',limit:'30',is_unapproved:'no',is_orphan:'no','trans:lang':'tur,deu','trans:is_direct':'yes','trans:is_unapproved':'no','showtrans:lang':'tur,deu','showtrans:is_direct':'yes','showtrans:is_unapproved':'no'});
 try{const response=await fetch('https://api.tatoeba.org/v1/sentences?'+params,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(String(response.status));const json=await response.json();const groups=selectGroups(json.data||[],word);report.sentences.push({word:word.tr,groups:groups.length,threeLanguages:groups.filter(g=>g.length===3).length,cors:response.headers.get('access-control-allow-origin')});}
 catch(e){report.sentences.push({word:word.tr,error:e.message});}
}
console.log(JSON.stringify(report,null,2));
if(report.images.some(i=>!i.available || !i.compatible))process.exitCode=1;
