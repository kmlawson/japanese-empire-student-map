import json,os,sys,re,collections
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- timetable')[0])
tables=json.load(open(S+'/tables.json')); results=json.load(open(S+'/results.json'))
placed={tuple(x) for x in json.load(open(S+'/matched_pairs.json'))}
sugg=json.load(open(S+'/ocr_suggestions.json')); ref=json.load(open(S+'/ekimei.json'))
MAP=json.loads(re.search(r"MAP=(\{.*?\})\n# all",open(S+'/ocrcheck.py').read(),re.S).group(1).replace("'",'"'))
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
refby={k.split('　')[0].split(' [')[0]:v for k,v in ref.items()}
used={v['osm']['osm_id'] for v in results.values()}
online={}
for gname,coords in lines.items():
    lst=[]; lons=[c[0] for c in coords]; lats=[c[1] for c in coords]
    for g in gf:
        if not (min(lons)-0.05<g['lon']<max(lons)+0.05 and min(lats)-0.05<g['lat']<max(lats)+0.05): continue
        d,ch=dist_to_line(g['lon'],g['lat'],coords)
        if d<=2500: lst.append((ch,d,g))
    online[gname]=lst
def refent(ln,name):
    for rk in MAP.get(ln,[]):
        for s in refby[rk]:
            if norm(s['old'] or s['name'])==norm(name): return s,rk
    return None,None
placed_any={s for l,s in placed}
seen=set(); out=[]
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln); coords=lines.get(gname)
    order=[s for s,_ in t['stations']]
    chain={s:results[ln+'|'+s]['chain'] for s in order if ln+'|'+s in results and (ln,s) in placed} if coords else {}
    for i,u in enumerate(order):
        if (ln,u) in placed or (ln,u) in seen or u in placed_any: continue
        seen.add((ln,u))
        corr=sugg.get(ln+'|'+u,u); r,rk=refent(ln,corr)
        km=r['km'] if r else None; note=r['note'] if r else ''
        exp=None; cands=''
        if coords and km is not None:
            nb=[]
            for s in order:
                if s in chain:
                    rs,rrk=refent(ln,sugg.get(ln+'|'+s,s))
                    if rs and rrk==rk: nb.append((order.index(s),chain[s],rs['km']))
            prev=[x for x in nb if x[0]<i]; nxt=[x for x in nb if x[0]>i]
            if prev and nxt:
                a,b=prev[-1],nxt[0]
                if b[2]!=a[2]: exp=a[1]+(km-a[2])/(b[2]-a[2])*(b[1]-a[1])
            elif len(prev)>=2:
                a,b=prev[-2],prev[-1]
                if b[2]!=a[2]: exp=b[1]+(km-b[2])*(b[1]-a[1])/(b[2]-a[2])
            elif len(nxt)>=2:
                a,b=nxt[0],nxt[1]
                if b[2]!=a[2]: exp=a[1]-(a[2]-km)*(b[1]-a[1])/(b[2]-a[2])
            if exp is not None:
                cc=sorted(((abs(ch-exp),g['name'],round(d),g['osm_id'] in used) for ch,d,g in online[gname] if abs(ch-exp)<=3000))
                cands=' ; '.join(f"{n}@{round(e/1000,1)}km{'(used)' if u_ else ''}" for e,n,d,u_ in cc[:4])
        out.append((ln,u,corr if corr!=u else '',km,note,'' if coords else 'NOGEOM',cands))
json.dump(out,open(S+'/unplaced_table.json','w'),ensure_ascii=False)
for o in out: print(' | '.join(str(x) for x in o))
print(len(out),file=sys.stderr)
