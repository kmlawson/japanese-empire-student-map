import json,os,sys,re,collections,difflib,statistics
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- timetable')[0])
tables=json.load(open(S+'/tables.json')); results=json.load(open(S+'/results.json'))
placed={tuple(x) for x in json.load(open(S+'/matched_pairs.json'))}
sugg=json.load(open(S+'/ocr_suggestions.json'))
ref=json.load(open(S+'/ekimei.json'))
exec(open(S+'/ocrcheck.py').read().split('# all reference names')[0].split("ref=json.load")[0].split('JP={')[0])  # nothing
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
MAP=json.loads(re.search(r"MAP=(\{.*?\})\n# all",open(S+'/ocrcheck.py').read(),re.S).group(1).replace("'",'"'))
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
def refkm(ln,name):
    for rk in MAP.get(ln,[]):
        for s in refby[rk]:
            if norm(s['old'] or s['name'])==norm(name): return s['km'],rk
    return None,None
rows=[]; seen=set()
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln); coords=lines.get(gname)
    if not coords: continue
    order=[s for s,_ in t['stations']]
    chain={s:results[ln+'|'+s]['chain'] for s in order if ln+'|'+s in results and (ln,s) in placed}
    for i,u in enumerate(order):
        if (ln,u) in placed or (ln,u) in seen: continue
        seen.add((ln,u))
        corr=sugg.get(ln+'|'+u,u)
        key=norm(corr)
        # expected chainage from reference km
        km,rk=refkm(ln,corr)
        exp=None
        if km is not None:
            nb=[(s,chain[s],refkm(ln,sugg.get(ln+'|'+s,s))[0]) for s in order if s in chain]
            nb=[x for x in nb if x[2] is not None and refkm(ln,sugg.get(ln+'|'+x[0],x[0]))[1]==rk]
            prev=[x for x in nb if order.index(x[0])<i]; nxt=[x for x in nb if order.index(x[0])>i]
            if prev and nxt:
                a,b=prev[-1],nxt[0]
                if b[2]!=a[2]: exp=a[1]+(km-a[2])/(b[2]-a[2])*(b[1]-a[1])
            elif prev and len(prev)>=2:
                a,b=prev[-2],prev[-1]
                if b[2]!=a[2]: exp=b[1]+(km-b[2])*(b[1]-a[1])/(b[2]-a[2])
            elif nxt and len(nxt)>=2:
                a,b=nxt[0],nxt[1]
                if b[2]!=a[2]: exp=a[1]-(a[2]-km)*(b[1]-a[1])/(b[2]-a[2])
        for ch,d,g in online[gname]:
            gk=g['key']
            sim=difflib.SequenceMatcher(None,key,gk).ratio()
            if key==gk or (len(key)>=2 and (key in gk or gk in key)) or sim>=0.67:
                err=abs(ch-exp) if exp is not None else None
                if exp is not None and err>15000: continue
                rows.append(dict(line=ln,printed=u,corrected=corr if corr!=u else '',osm=g['name'],osm_id=g['osm_id'],name_rel='exact' if key==gk else 'partial',d_line=round(d),exp_err_km=(round(err/1000,1) if err is not None else ''),ref_km=km,already_used='yes' if g['osm_id'] in used else '',score=(0 if key==gk else 1)+(0 if err is not None and err<3000 else (1 if err is not None else 2))))
rows.sort(key=lambda r:(r['score'],r['line'],r['exp_err_km'] if r['exp_err_km']!='' else 99))
import csv
with open('add_stations/high-confidence-candidates.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
for r in rows: print(f"{r['score']} | {r['line']} | {r['printed']}{(' → '+r['corrected']) if r['corrected'] else ''} | OSM {r['osm']} ({r['name_rel']}) | d_line {r['d_line']} m | pos err {r['exp_err_km']} km | {'USED' if r['already_used'] else ''}")
