import json,math,re,collections,sys,os
S=os.path.dirname(os.path.abspath(__file__))
ct=json.load(open(os.path.expanduser('~/.claude/skills/trad-simp-toggle/assets/convtable.json')))
T2S=dict(zip(ct['tk'],ct['tv']))
# old glyph / variant normalisation applied to BOTH sides after t2s
VAR={'靑':'青','淸':'清','鷄':'鸡','雞':'鸡','鎭':'镇','眞':'真','敎':'教','卽':'即','內':'内','兪':'俞','溫':'温','硏':'研','吳':'吴','爲':'为','冨':'富','郞':'郎','頼':'赖','氷':'冰','臺':'台','庄':'庄','莊':'庄','舖':'铺','廐':'厩','窰':'窑','舘':'馆','幇':'帮','幫':'帮','鄕':'乡','岡':'冈','崗':'岗','蔴':'麻','橫':'横','棱':'棱','稜':'棱','裡':'里','裏':'里','遼':'辽','啓':'启','壺':'葫','蘆':'芦','嶺':'岭','綫':'线','綠':'绿','緑':'绿','來':'来','萬':'万','壩':'坝','峯':'峰','谿':'溪','驛':'驿','傑':'杰','琿':'珲','蔔':'卜','蔭':'荫','蘇':'苏','鑛':'矿','礦':'矿','衞':'卫','爾':'尔','彌':'弥','餘':'余','沖':'冲','衝':'冲','圈':'圈','圏':'圈','戶':'户','户':'户','嶽':'岳','嶽':'岳','蘭':'兰','麵':'面','麪':'面','靈':'灵','鬥':'斗','鬭':'斗','歷':'历','曆':'历','鍾':'钟','鐘':'钟','舍':'舍','捨':'舍','榆':'榆','恒':'恒','恆':'恒','呉':'吴','楡':'榆','戸':'户','図':'图','満':'满','浜':'滨','斉':'齐','黒':'黑','関':'关','鉄':'铁','豊':'丰','県':'县','昻':'昂','飮':'饮','們':'们','鬪':'斗','鬥':'斗'}
import unicodedata
def norm(s):
    s=unicodedata.normalize('NFKC',s)
    s=re.sub(r'[\s·・()（）]','',s)
    s=''.join(T2S.get(c,c) for c in s)
    s=''.join(VAR.get(c,c) for c in s)
    return s
# ---- geofabrik stations
gf=[]
for prov in ['heilongjiang','jilin','liaoning','neimenggu','hebei']:
    for f in json.load(open(f'add_stations/{prov}-stations.geojson'))['features']:
        p=f['properties']
        if p['fclass'] not in ('railway_station','railway_halt'): continue
        n=p.get('name') or ''
        if not n: continue
        base=re.sub(r'(火车站|客运站|车站|站)$','',n)
        g=dict(name=n,key=norm(base),keys=sorted({norm(n),norm(base)}),lon=f['geometry']['coordinates'][0],lat=f['geometry']['coordinates'][1],osm_id=p['osm_id'],fclass=p['fclass'],prov=prov)
        gf.append(g)
byname=collections.defaultdict(list)
for g in gf:
    for k in g['keys']: byname[k].append(g)
print('geofabrik stations:',len(gf),'distinct keys:',len(byname),file=sys.stderr)
# ---- lines
lines={}
for f in json.load(open('add_stations/manchuria-1942-lines.geojson'))['features']:
    coords=[]
    for part in f['geometry']['coordinates']: coords+=part
    lines[f['properties']['name-zh']]=coords
def proj(lon,lat,lat0):
    k=111320.0; return ((lon)*k*math.cos(math.radians(lat0)), lat*k)
def dist_to_line(lon,lat,coords):
    """min distance (m) to polyline and chainage (m) at nearest point"""
    lat0=lat; px,py=proj(lon,lat,lat0)
    best=(1e18,0); ch=0.0
    prev=None
    for c in coords:
        x,y=proj(c[0],c[1],lat0)
        if prev is not None:
            x1,y1=prev; dx,dy=x-x1,y-y1; L2=dx*dx+dy*dy
            t=0 if L2==0 else max(0,min(1,((px-x1)*dx+(py-y1)*dy)/L2))
            qx,qy=x1+t*dx,y1+t*dy; d=math.hypot(px-qx,py-qy)
            seg=math.sqrt(L2)
            if d<best[0]: best=(d,ch+t*seg)
            ch+=seg
        prev=(x,y)
    return best
# ---- timetable
tables=json.load(open(S+'/tables.json'))
ALIAS=json.load(open(S+'/alias.json')) if os.path.exists(S+'/alias.json') else {}
# line name in tt -> geometry name
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
THRESH=json.load(open(S+'/thresh.json')) if os.path.exists(S+'/thresh.json') else {}
DEFAULT_T=1500
OVERRIDE_D={'滿鐵社線 安奉線|火連寨':5500,'滿鐵社線 金城線|貔子窩':3000,'國線 京白線|前郭旗':2500,'國線 京白線|大賚城':3000,'滿洲國線 新義線|阜新':2500,'滿鐵社線 旅順線|牧城子':2000}
results={}  # (line, station) -> record
unmatched=collections.OrderedDict()
nogeom=collections.OrderedDict()
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln)
    coords=lines.get(gname)
    if coords is None:
        for s,k in t['stations']: nogeom.setdefault(ln,collections.OrderedDict())[s]=k
        continue
    thr=THRESH.get(gname,DEFAULT_T)
    recs=[]
    for s,k in t['stations']:
        keyname=ALIAS.get(ln+'|'+s, ALIAS.get(s,s))
        key=norm(keyname)
        cands=byname.get(key,[])
        scored=[]
        for g in cands:
            d,ch=dist_to_line(g['lon'],g['lat'],coords)
            scored.append((d,ch,g))
        scored.sort(key=lambda x:x[0])
        near=[x for x in scored if x[0]<=OVERRIDE_D.get(ln+'|'+s,thr)]
        recs.append(dict(name=s,km=k,alias=keyname if keyname!=s else None,key=key,cands=[(round(d),g['name'],g['prov']) for d,ch,g in scored],near=near))
    # order check on chainage
    chs=[(i,r['near'][0][1]) for i,r in enumerate(recs) if r['near']]
    inc=sum(1 for a,b in zip(chs,chs[1:]) if b[1]>a[1]); dec=sum(1 for a,b in zip(chs,chs[1:]) if b[1]<a[1])
    direction=1 if inc>=dec else -1
    for j,(i,ch) in enumerate(chs):
        r=recs[i]; ok=True
        if j>0 and (ch-chs[j-1][1])*direction<0: ok=False
        if j<len(chs)-1 and (chs[j+1][1]-ch)*direction<0: ok=False
        r['order_ok']=ok
    for r in recs:
        kk=(ln,r['name'])
        if r['near']:
            d,ch,g=r['near'][0]
            rec=results.get(kk)
            amb=len(r['near'])>1
            new=dict(line=ln,geom=gname,name=r['name'],alias=r['alias'],km=r['km'],osm=g,dist=round(d),chain=round(ch),order_ok=r['order_ok'],amb=[(round(x[0]),x[2]['name'],x[2]['osm_id']) for x in r['near'][1:]],table=t['file'])
            if rec is None or (not rec['order_ok'] and r['order_ok']): results[kk]=new
            elif rec and not r['order_ok']: rec['order_ok']=False
        else:
            unmatched.setdefault(ln,collections.OrderedDict())[r['name']]=r['cands']
json.dump({'|'.join(k):v for k,v in results.items()},open(S+'/results.json','w'),ensure_ascii=False,indent=1)
json.dump(unmatched,open(S+'/unmatched.json','w'),ensure_ascii=False,indent=1)
json.dump(nogeom,open(S+'/nogeom.json','w'),ensure_ascii=False,indent=1)
# report
bl=collections.defaultdict(list)
for (ln,s),v in results.items(): bl[ln].append(v)
tot=0
for ln in dict.fromkeys(t['line'] for t in tables):
    if ln not in bl: continue
    vs=sorted(bl[ln],key=lambda v:v['chain'])
    tot+=len(vs)
    print(f"== {ln}: {len(vs)} matched, {len(unmatched.get(ln,{}))} unmatched")
    for v in vs:
        flag=('' if v['order_ok'] else ' ORDER?')+(' AMB'+str(v['amb']) if v['amb'] else '')
        print(f"   {v['name']:8s} -> {v['osm']['name']:10s} d={v['dist']:5d}m ch={v['chain']/1000:7.1f}km{flag}")
    if ln in unmatched:
        print('   UNMATCHED:',' '.join(f"{s}{('['+','.join(str(c[0])+'m' for c in cs[:3])+']') if cs else ''}" for s,cs in unmatched[ln].items()))
print('TOTAL matched',tot,file=sys.stderr)
