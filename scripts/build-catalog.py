#!/usr/bin/env python3
"""Build a small, attributed catalogue from public frequency/Wiktionary data.
Raw dictionaries are developer inputs only; never copied into the web build.
Python 3.9+, no third-party packages. See data/README.md for source licences.
"""
import argparse, collections, gzip, hashlib, json, pathlib, re, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
URLS = {
    'en_50k.txt': 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
    'en.jsonl.gz': 'https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz',
    'tr.jsonl': 'https://kaikki.org/trwiktionary/%C4%B0ngilizce/kaikki.org-dictionary-%C4%B0ngilizce.jsonl',
    'de.jsonl': 'https://kaikki.org/dewiktionary/Englisch/kaikki.org-dictionary-Englisch.jsonl',
}
BAD_TAGS = {'obsolete', 'archaic', 'rare', 'no-gloss', 'historical', 'dated'}
POS_LABELS = {'noun':'İsimler', 'verb':'Fiiller', 'adj':'Sıfatlar', 'adv':'Zarflar', 'pron':'Dil bilgisi', 'prep':'Dil bilgisi', 'det':'Dil bilgisi', 'article':'Dil bilgisi', 'conj':'Dil bilgisi', 'contraction':'Dil bilgisi', 'particle':'Dil bilgisi', 'num':'Diğer', 'intj':'Diğer', 'phrase':'Diğer'}
POS_NAMES = {'noun':'isim','verb':'fiil','adj':'sıfat','adv':'zarf','pron':'zamir','prep':'edat','det':'belirleyici','article':'artikel','conj':'bağlaç','contraction':'kısaltılmış biçim','particle':'parçacık','num':'sayı','intj':'ünlem','phrase':'ifade'}
FRAGMENTS = {'don','didn','doesn','isn','aren','wasn','weren','won','wouldn','couldn','shouldn','hasn','haven','mustn','ain','ve','ll','re','ma','na','em'}
NAMES = {'john','tom','james','david','michael','paul','peter','george','jane','anna','sarah','robert','richard','henry','charlie','jim','bob','kate','jenny','mary','jake','mike','jason','sam','susan','lisa','tony','harry','daniel','steve','danny','alex','ben','eddie','jerry','joe','lucy','josh','chris','kevin','jimmy','jack','rachel','nicky','nina','sally','maggie','nick','adam','julia','laura','fred','linda','eric','ron','simon','ted'}
PREFERRED = {'i':'pron','you':'pron','the':'article','a':'article','an':'article','to':'prep','can':'verb','may':'verb','be':'verb','do':'verb','have':'verb','will':'verb','would':'verb','hello':'intj','that':'det','my':'det','your':'det'}

def clean(value, limit=400):
    value = re.sub(r'\s+', ' ', str(value)).strip()
    return value if len(value) <= limit else value[:limit-1].rstrip() + '…'

def terms(values):
    out=[]
    for value in values:
        value=clean(value,2000).strip('"“”')
        for part in re.split(r'[,;]',value):
            if '…' in part or re.match(r'^(I|You|We|They|He|She)\s',part):continue
            part=re.sub(r'\([^)]*\)', '', part).strip(' .:')
            if part and len(part)<=38 and len(part.split())<=5 and part not in out and not re.search(r'\b(kavramının|çoğulu|singular|Plural|Infinitiv|Person|Pronomen|belirtir|kullanılır|şeyin|herkesçe|önce|bahsi|bahsedildiği)\b',part):out.append(part)
    return out[:6]

def slim(x):
    senses=[]
    for s in x.get('senses',[]):
        if not s.get('glosses') or BAD_TAGS.intersection(s.get('tags',[])):continue
        senses.append({k:s[k] for k in ['glosses','id','tags','form_of','sense_index','topics'] if k in s})
    if not senses:return None
    return {'word':x['word'],'pos':x.get('pos'),'senses':senses,
            'translations':[{k:t[k] for k in ['word','sense','sense_index','tags','lang_code'] if k in t} for t in x.get('translations',[]) if t.get('lang_code') in ['tr','de'] and not BAD_TAGS.intersection(t.get('tags',[]))],
            'ipa':next((s['ipa'] for s in x.get('sounds',[]) if s.get('ipa')),None)}

def extract(path,wanted):
    records=collections.defaultdict(list)
    opener=gzip.open if path.suffix=='.gz' else open
    with opener(path,'rt',encoding='utf-8') as f:
        for line in f:
            x=json.loads(line)
            word=x.get('word','').lower()
            if word not in wanted or x.get('pos') not in POS_LABELS:continue
            if x.get('word')!=word and x.get('word')!='I':continue
            record=slim(x)
            if record:records[word].append(record)
    return dict(records)

def pick_record(records,word,pos=None):
    if pos:
        equivalents={'article':{'article','det','particle','adj'},'det':{'det','article','pron','adj'},'intj':{'intj','phrase'}}.get(pos,{pos})
        records=[r for r in records if r['pos'] in equivalents]
    if not records:return None
    return max(records,key=lambda r: (r['pos']==(pos or PREFERRED.get(word)), any(t.get('lang_code')=='tr' for t in r['translations'])+any(t.get('lang_code')=='de' for t in r['translations']), -records.index(r)))

def resolve(records,word,pos=None):
    r=pick_record(records.get(word,[]),word,pos)
    if r:
        direct=[s for s in r['senses'] if not s.get('form_of')]
        if direct:return {**r,'senses':direct}
        parents=[p.get('word','').lower() for s in r['senses'] for p in s.get('form_of',[])]
        if pos in ['pron','det','article']:return r
        for parent in parents:
            parent_record=pick_record(records.get(parent,[]),parent,pos)
            if parent_record:return parent_record
    return r

def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(4*1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser();p.add_argument('--source-dir',required=True);p.add_argument('--download',action='store_true');a=p.parse_args()
    source=pathlib.Path(a.source_dir);source.mkdir(parents=True,exist_ok=True)
    for name,url in URLS.items():
        if not (source/name).exists():
            if not a.download:raise SystemExit('Missing '+str(source/name))
            print('Downloading '+name,flush=True);urllib.request.urlretrieve(url,source/name)
    freq=[]
    for rank,line in enumerate((source/'en_50k.txt').read_text().splitlines(),1):
        word,count=line.split()
        if re.fullmatch(r"[a-z]+(?:'[a-z]+)?",word) and (len(word)>1 or word in ['i','a']) and word not in FRAGMENTS and word not in NAMES:freq.append((rank,word,int(count)))
        if len(freq)>=10000:break
    wanted={w for _,w,_ in freq}
    parsed={}
    for lang in ['en','tr','de']:
        name='en.jsonl.gz' if lang=='en' else lang+'.jsonl'
        cache=source/(lang+'-slim.json')
        if cache.exists():parsed[lang]=json.loads(cache.read_text())
        else:
            print('Extracting '+lang,flush=True);parsed[lang]=extract(source/name,wanted);cache.write_text(json.dumps(parsed[lang],ensure_ascii=False))
        print(lang,len(parsed[lang]),'matched headwords',flush=True)
    old=json.loads((ROOT/'src/legacy-data.js').read_text().split('export const words = ')[1].rstrip().removesuffix(';'))
    originals={w['en'].lower():w for w in old}
    core=json.loads((ROOT/'data/editorial-core.json').read_text())
    index=[];details=[];missing={'tr':[],'de':[]};skipped=[]
    for source_rank,word,count in freq:
        en=resolve(parsed['en'],word,'noun' if word in originals else None)
        if not en:skipped.append(word);continue
        # Existing image cards keep their identity and manually selected meanings.
        record_id=originals[word]['id'] if word in originals else 'en:'+word
        pos=en['pos'];tr_rec=resolve(parsed['tr'],word,pos);de_rec=resolve(parsed['de'],word,pos)
        grouped=collections.defaultdict(lambda:{'tr':[],'de':[]})
        for t in en['translations']:
            if t.get('word'):grouped[t.get('sense','')][t['lang_code']].append(t['word'])
        paired=[(sense,values) for sense,values in grouped.items() if values['tr'] and values['de']]
        selected=paired[0] if paired else None
        tr_terms=terms(selected[1]['tr'] if selected else [t['word'] for t in en['translations'] if t['lang_code']=='tr' and t.get('word')])
        de_terms=terms(selected[1]['de'] if selected else [t['word'] for t in en['translations'] if t['lang_code']=='de' and t.get('word')])
        tr_glosses=[clean(s['glosses'][-1]) for s in tr_rec['senses'][:4]] if tr_rec else []
        de_glosses=[clean(s['glosses'][-1]) for s in de_rec['senses'][:4]] if de_rec else []
        if not tr_terms:tr_terms=terms(tr_glosses)
        if not de_terms and de_rec:de_terms=terms([t['word'] for t in de_rec['translations'] if t['lang_code']=='de' and t.get('word')]) or terms(de_glosses)
        if word in core:
            tr_terms=[core[word][0]];de_terms=[core[word][1]]
        if word in originals:
            tr_terms=[originals[word]['tr']];de_terms=[originals[word]['deSearch']]
        if not tr_terms:missing['tr'].append(word)
        if not de_terms:missing['de'].append(word)
        primary_tr=tr_terms[0] if tr_terms and len(tr_terms[0])<=38 else ''
        primary_de=de_terms[0] if de_terms and len(de_terms[0])<=38 else ''
        rank=len(index)+1;pack='en-'+str((rank-1)//100+1).zfill(2)
        glosses=[clean(s['glosses'][-1]) for s in en['senses'][:4]]
        # Images are searched only for nouns; grammatical/abstract words are text cards.
        abstract=any(re.search(r'\b(quality|state|condition|concept|feeling|belief|ability|act of|process of)\b',g,re.I) for g in glosses[:1])
        item={'id':record_id,'en':en['word'] if en['word'].lower()==word else ('I' if word=='i' else word),'tr':primary_tr,'de':primary_de,'deSearch':primary_de,'rank':rank,'sourceRank':source_rank,'pos':pos,'category':POS_LABELS[pos],'pack':pack,'visual':pos=='noun' and not abstract and word not in {'sex','fuck','fucking','shit','bitch','ass','dick','cock','penis','vagina','porn','pornography','naked','nude','breast','breasts'} and not any({'vulgar','offensive','derogatory'}.intersection(s.get('tags',[])) for s in en['senses'][:2]),'aliases':' '.join(tr_terms+de_terms)}
        index.append(item)
        detail={'id':record_id,'en':item['en'],'trTerms':tr_terms,'deTerms':de_terms,'definition':(' · '.join(tr_terms) if selected else ' · '.join(tr_glosses) or ' · '.join(tr_terms)),'enDefinition':clean(selected[0]) if selected and selected[0] else ' · '.join(dict.fromkeys(glosses)),'deDefinition':(' · '.join(de_terms) if selected else ' · '.join(de_glosses) or ' · '.join(de_terms)),'pairedSense':clean(selected[0]) if selected else None,'ipa':en.get('ipa'),'posLabel':POS_NAMES.get(pos,pos),'editorialCore':word in core}
        if word in core:
            detail['definition']=core[word][0]+' · Kullanım ve çekim bağlama göre değişir.'
            detail['deDefinition']=core[word][1]+' · Die Form hängt vom Satzkontext ab.'
            detail['enDefinition']=' · '.join(dict.fromkeys(glosses))
            detail['pairedSense']=None
        details.append(detail)
        if len(index)==3000:break
    if len(index)!=3000:raise SystemExit('Fewer than 3000 usable words')
    data=ROOT/'data';(data/'packs').mkdir(parents=True,exist_ok=True)
    info={'count':3000,'source':'OpenSubtitles 2018 / FrequencyWords','license':'CC BY-SA 4.0','highestSourceRank':index[-1]['sourceRank'],'missingTranslations':{k:len(v) for k,v in missing.items()},'editorialCoreCount':len(core),'method':'Frequency order; token fragments and obvious personal names excluded; English dictionary entry required. Inflected forms remain separate frequency tokens. Definitions and translations automatically extracted; no AI translation.','sources':URLS}
    (data/'catalog-index.json').write_text(json.dumps({'version':1,'info':info,'words':index},ensure_ascii=False,separators=(',',':'))+'\n')
    for n in range(30):
        chunk=details[n*100:(n+1)*100];(data/'packs'/('en-'+str(n+1).zfill(2)+'.json')).write_text(json.dumps({'version':1,'license':'CC BY-SA 4.0','entries':{d['id']:d for d in chunk}},ensure_ascii=False,separators=(',',':'))+'\n')
    report={**info,'sourceSHA256':{name:sha256(source/name) for name in URLS},'missingWords':missing,'skippedWithoutEnglishEntry':skipped,'definitionCoverage':{lang:sum(bool(d[key]) for d in details) for lang,key in [('en','enDefinition'),('tr','definition'),('de','deDefinition')]},'bytes':{'index':(data/'catalog-index.json').stat().st_size,'details':sum(p.stat().st_size for p in (data/'packs').glob('*.json'))}}
    (ROOT/'docs/catalog-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['count','highestSourceRank','missingTranslations','bytes']},ensure_ascii=False),flush=True)
    print('First 15:',[(w['en'],w['tr'],w['de']) for w in index[:15]],flush=True)
if __name__=='__main__':main()
