import json,math,os,sys,collections
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- timetable')[0])
tables=json.load(open(S+'/tables.json'))
results=json.load(open(S+'/results.json'))
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
online={}
for gname,coords in lines.items():
    lst=[]
    lons=[c[0] for c in coords]; lats=[c[1] for c in coords]
    for g in gf:
        if not (min(lons)-0.05<g['lon']<max(lons)+0.05 and min(lats)-0.05<g['lat']<max(lats)+0.05): continue
        d,ch=dist_to_line(g['lon'],g['lat'],coords)
        if d<=1500: lst.append((ch,round(d),g['name']))
    lst.sort(); online[gname]=lst
json.dump(online,open(S+'/online.json','w'),ensure_ascii=False)
used=set(v['osm']['name'] for v in results.values())
seen=set()
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln); coords=lines.get(gname)
    if not coords: continue
    sts=[s for s,k in t['stations']]
    matched=[(i,results[ln+'|'+s]['chain']) for i,s in enumerate(sts) if ln+'|'+s in results]
    if not matched: continue
    for i,s in enumerate(sts):
        if ln+'|'+s in results or (ln,s) in seen: continue
        seen.add((ln,s))
        prev=[m for m in matched if m[0]<i]; nxt=[m for m in matched if m[0]>i]
        if prev and nxt: lo,hi=sorted((prev[-1][1],nxt[0][1])); how=f"between {sts[prev[-1][0]]}..{sts[nxt[0][0]]}"
        elif prev: lo,hi=prev[-1][1]-40000,prev[-1][1]+40000; how=f"±40km of {sts[prev[-1][0]]}"
        else: lo,hi=nxt[0][1]-40000,nxt[0][1]+40000; how=f"±40km of {sts[nxt[0][0]]}"
        cands=[(round(ch/1000,1),n,d) for ch,d,n in online[gname] if lo-500<=ch<=hi+500 and n not in used]
        print(f"{ln} | {s} | {how} -> {cands}")
