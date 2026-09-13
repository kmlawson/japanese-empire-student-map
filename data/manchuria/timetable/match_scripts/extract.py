import glob,re,collections,json
# build per-line ordered station lists (pages 12-53), merging directions
tables=[]
for f in sorted(glob.glob('transcription/p*.tt')):
    txt=open(f).read()
    m=re.search(r'^page:\s*(\d+)',txt,re.M); pg=int(m.group(1)) if m else 0
    if not (12<=pg<=53): continue
    if re.search(r'^kind:\s*bus',txt,re.M): continue
    ln=re.search(r'^line:\s*(.*)',txt,re.M).group(1).strip()
    ti=re.search(r'^title:\s*(.*)',txt,re.M).group(1).strip()
    st=re.search(r'^stations:\s*(.*)',txt,re.M)
    if not st: continue
    sts=[]
    for s in st.group(1).split('|'):
        s=s.strip(); mm=re.match(r'^(\S+)\s+([\d.]+)$',s)
        if mm: sts.append((mm.group(1),float(mm.group(2))))
        else: sts.append((s,None))
    tables.append(dict(file=f.split('/')[-1],page=pg,line=ln,title=ti,stations=sts))
json.dump(tables,open('/private/tmp/claude-501/-Users-kml-Desktop-manchuria/b37ca7eb-33a8-4b7c-a14b-86cfd06f5716/scratchpad/tables.json','w'),ensure_ascii=False,indent=1)
# merge per line: take the longest table as reference order; note stations in other tables not in it
lines=collections.OrderedDict()
for t in tables: lines.setdefault(t['line'],[]).append(t)
out=collections.OrderedDict()
for ln,ts in lines.items():
    ref=max(ts,key=lambda t:len(t['stations']))
    names=[s for s,_ in ref['stations']]
    km={s:k for s,k in ref['stations'] if k is not None}
    extra=set()
    for t in ts:
        for s,k in t['stations']:
            if s not in names: extra.add(s)
            if k is not None and s not in km: km[s]=k
    out[ln]=dict(ref=ref['file'],title=ref['title'],stations=names,km=km,extra=sorted(extra),tables=[t['file'] for t in ts])
    print('==',ln,'|',ref['title'],'|',len(names),'stations; extra in other tables:',sorted(extra))
    print('   ',' '.join(names))
json.dump(out,open('/private/tmp/claude-501/-Users-kml-Desktop-manchuria/b37ca7eb-33a8-4b7c-a14b-86cfd06f5716/scratchpad/lines_stations.json','w'),ensure_ascii=False,indent=1)
