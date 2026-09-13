import json,math,os,sys,collections,csv,statistics
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- timetable')[0])
tables=json.load(open(S+'/tables.json'))
results=json.load(open(S+'/results.json'))
placed={tuple(x) for x in json.load(open(S+'/matched_pairs.json'))}
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
used_ids={v['osm']['osm_id'] for v in results.values()}
def point_at(coords,ch):
    lat0=coords[0][1]; acc=0; prev=None
    for c in coords:
        x,y=proj(c[0],c[1],lat0)
        if prev is not None:
            seg=math.hypot(x-prev[0],y-prev[1])
            if acc+seg>=ch:
                t=(ch-acc)/seg if seg else 0
                return (prevc[0]+t*(c[0]-prevc[0]), prevc[1]+t*(c[1]-prevc[1]))
            acc+=seg
        prev=(x,y); prevc=c
    return tuple(coords[-1])
def hav(lon1,lat1,lon2,lat2):
    R=6371000; p1,p2=math.radians(lat1),math.radians(lat2); dl=math.radians(lon2-lon1)
    a=math.sin((p2-p1)/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))
# OSM stations along each line within 4 km
online={}
for gname,coords in lines.items():
    lst=[]; lons=[c[0] for c in coords]; lats=[c[1] for c in coords]
    for g in gf:
        if not (min(lons)-0.06<g['lon']<max(lons)+0.06 and min(lats)-0.06<g['lat']<max(lats)+0.06): continue
        d,ch=dist_to_line(g['lon'],g['lat'],coords)
        if d<=4000: lst.append((ch,d,g))
    online[gname]=lst
def tmin(s):
    t=s.get('t')
    if not t: return None
    h,m=t.split(':'); return int(h)*60+int(m)
rows=[]; summary=collections.OrderedDict()
seen=set()
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln); coords=lines.get(gname)
    if coords is None: continue
    order=[s for s,_ in t['stations']]
    chain={s:results[ln+'|'+s]['chain'] for s in order if ln+'|'+s in results and (ln,s) in placed}
    js=json.load(open('transcription/json/'+t['file'].replace('.tt','.json')))
    # per train: station -> minutes (dep preferred), with rollover
    trains=[]
    for tr in js['trains']:
        seq=[]; last=None; add=0
        for s in tr['stops']:
            m=tmin(s)
            if m is None: continue
            m+=add
            if last is not None and m<last-360: add+=1440; m+=1440
            seq.append((s['st'],s['ev'],m)); last=m
        tt={}
        for st,ev,m in seq:
            if st not in tt or ev=='dep': tt[st]=m
        trains.append(tt)
    for i,u in enumerate(order):
        if (ln,u) in placed or (ln,u) in seen: continue
        seen.add((ln,u))
        est=[]; meth=[]
        for tt in trains:
            if u not in tt: continue
            prev=[(j,order[j]) for j in range(i-1,-1,-1) if order[j] in chain and order[j] in tt]
            nxt=[(j,order[j]) for j in range(i+1,len(order)) if order[j] in chain and order[j] in tt]
            if prev and nxt:
                a,b=prev[0][1],nxt[0][1]
                dt=tt[b]-tt[a]
                if dt<=0: continue
                fr=(tt[u]-tt[a])/dt
                if not (0<=fr<=1): continue
                est.append(chain[a]+fr*(chain[b]-chain[a])); meth.append(f'{a}~{b}')
            elif len(prev)>=2 or len(nxt)>=2:
                # extrapolate with speed from the two nearest placed stations on this train
                (j1,a),(j2,b)=(prev[0],prev[1]) if len(prev)>=2 else (nxt[0],nxt[1])
                dt=abs(tt[b]-tt[a]); dd=abs(chain[b]-chain[a])
                if dt<=0 or dd<=0: continue
                v=dd/dt
                if len(prev)>=2:
                    dtu=tt[u]-tt[a]; sign=1 if chain[a]>chain[b] else -1
                else:
                    dtu=tt[a]-tt[u]; sign=-1 if chain[b]>chain[a] else 1
                if dtu<0: continue
                est.append(chain[a]+sign*v*dtu); meth.append(f'extrap {a}')
        if not est:
            rows.append(dict(line=ln,station=u,table=t['file'],n_trains=0,method='no usable times',exp_km='',exp_lon='',exp_lat='',candidate='',cand_osm_id='',cand_dist_to_exp_m='',cand_dist_to_line_m='',cand_already_placed='',n_cands_3km='',other_unplaced_in_gap=''))
            summary[(ln,u)]=('notime',0); continue
        ch=statistics.median(est); spread=(max(est)-min(est))
        lon,lat=point_at(coords,max(0,ch))
        lo,hi=ch-3000,ch+3000
        cands=sorted(((abs(c-ch),c,d,g) for c,d,g in online[gname] if lo<=c<=hi),key=lambda x:x[0])
        # other unplaced stations in same gap
        m0=meth[0]
        gap=[o for o in order if (ln,o) not in placed and o!=u]  # rough
        base=dict(line=ln,station=u,table=t['file'],n_trains=len(est),method=collections.Counter(meth).most_common(1)[0][0],spread_m=round(spread),exp_km=round(ch/1000,1),exp_lon=round(lon,5),exp_lat=round(lat,5),n_cands_3km=len(cands))
        summary[(ln,u)]=('est',len(cands),min((x[0] for x in cands),default=None))
        if not cands: rows.append(dict(base,candidate='',cand_osm_id='',cand_dist_to_exp_m='',cand_dist_to_line_m='',cand_already_placed=''))
        for dexp,c,d,g in cands:
            rows.append(dict(base,candidate=g['name'],cand_osm_id=g['osm_id'],cand_dist_to_exp_m=round(dexp),cand_dist_to_line_m=round(d),cand_already_placed='yes' if g['osm_id'] in used_ids else ''))
cols=['line','station','table','n_trains','method','spread_m','exp_km','exp_lon','exp_lat','n_cands_3km','candidate','cand_osm_id','cand_dist_to_exp_m','cand_dist_to_line_m','cand_already_placed']
with open('add_stations/time-interpolated-candidates.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore'); w.writeheader(); w.writerows(rows)
n=len(summary); est=[v for v in summary.values() if v[0]=='est']
print('unplaced stations on traced lines:',n)
print('with a time-based estimate:',len(est),' no usable times:',n-len(est))
print('estimate with >=1 OSM station within 3 km along line:',sum(1 for v in est if v[1]>=1))
print('  exactly one candidate:',sum(1 for v in est if v[1]==1))
print('  nearest candidate within 1 km:',sum(1 for v in est if v[2] is not None and v[2]<=1000))
print('  nearest candidate within 2 km:',sum(1 for v in est if v[2] is not None and v[2]<=2000))
print('estimate but no candidate within 3 km:',sum(1 for v in est if v[1]==0))
print('rows in csv:',len(rows))
