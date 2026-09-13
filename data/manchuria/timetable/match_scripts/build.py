import json,math,os,sys,collections,re
from pypinyin import lazy_pinyin, Style
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- timetable')[0])
tables=json.load(open(S+'/tables.json'))
results=json.load(open(S+'/results.json'))
unmatched=json.load(open(S+'/unmatched.json'))
ALIAS=json.load(open(S+'/alias.json'))
def hav(lon1,lat1,lon2,lat2):
    R=6371000; p1,p2=math.radians(lat1),math.radians(lat2); dl=math.radians(lon2-lon1)
    a=math.sin((p2-p1)/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))
EXCLUDE={}
# notes keyed by trad name (any line) or line|name
NOTES={
 '奉天':'奉天 = 沈阳站 (renamed 1945)','新京':'新京 = 长春站','北奉天':'北奉天 (奉山線 terminus, ex‑遼寧總站) ≈ 沈阳北; the 1927 station building (老北站) is c. 0.8 km SW of the present 沈阳北站',
 '瀋陽':'奉吉線 瀋陽 (奉海鐵路 station) = today 沈阳东站, not 沈阳站','安東':'安東 = 丹东站','錦縣':'錦縣 = 锦州站','錦西':'錦西 = 葫芦岛站 (renamed)',
 '三棵樹':'三棵樹 = 哈尔滨东站','鷄寧':'鷄寧 = 鸡西站','雞寧':'雞寧 = 鸡西站','淼道':'','淸道':'淸道 = 滴道 (see notes.md)','團崗':'printed 團崗, probably 蘭崗 = 兰岗 station between 石头 and 宁安',
 '珠河':'珠河 = 尚志站 (county renamed 1946)','煙臺':'煙臺 = 灯塔站 (renamed)','蓋平':'蓋平 = 盖州站','白城子':'白城子 = 白城站','王爺廟':'王爺廟 = 乌兰浩特站',
 '鄭家屯':'鄭家屯 = 双辽站 (renamed); OSM point c. 1 km from traced line','東新京':'東新京 = 长春东站','輯安':'輯安 = 集安站','宮原':'宮原 = 本溪站 (renamed 工原 1945, 本溪 1949)',
 '本溪湖':'本溪湖 station (ex‑大東) 1.6 km from traced line, which follows the 1942 乙線 via 新岭隧道; station is on the older alignment','城子疃':'城子疃 = 城子坦; OSM point is the 2015 丹大快速铁路 station of that name',
 '四平街':'四平街 = 四平','寧年':'寧年 = 富裕站 (county seat renamed)','泰安':'齊北線 泰安 = 依安站 (only station between 富海 and 古城; town renamed)','薩爾圖':'薩爾圖 = 大庆站','泰康':'泰康 = 杜尔伯特站 (renamed)',
 '興安':'濱洲線 興安 = 兴安岭站','伊爾克得':'伊爾克得 = 伊列克得 (transliteration)','烏奴爾':'烏奴爾 = 乌奴耳','烏奴諾爾':'烏奴諾爾 ≈ 乌固诺尔 (transliteration variant; only station between 海拉尔 and 完工)','扎來諾爾':'扎來諾爾 = 扎赉诺尔',
 '柏根里':'柏根里 = 伯根里','二□':'illegible in transcription; 二龍 = 二龙 (notes.md)','河□溝':'illegible; = 河汤沟 (河湯溝), between 红石 and 凌源','黑山縣':'黑山縣 = 黑山站','玉府':'printed 玉府; = 王府站',
 '西安':'平梅線 西安 = 辽源站 (county renamed)','大興':'','三源浦':'','□柏':'illegible; = 黄柏 (黃柏), between 石湖 and 阳岔','田師付':'田師付 = 田师府','圈虎屯':'printed 圈虎屯; modern 斗虎屯 (likely misreading)',
 '東安':'東安 = 密山站 (Manchukuo 東安 city = 密山)','朝水':'朝水 = 潮水','北孫吳':'北孫吳 = 孙吴北','二龍山':'二龍山 = 二龙山屯站','南叉':'南叉 = 南岔','慶城':'慶城 = 庆安 (county renamed)','□山包':'illegible; 鐵山包 = 铁力 station (铁山包 town, later 铁力)',
 '鳥吉密':'printed 鳥吉密 = 乌吉密','亞布洛泥':'亞布洛泥 = 亚布力','穆稜':'1942 穆稜 = 老穆棱 (present 穆棱 station relocated)','磨刀石':'1942 磨刀石 = 老磨刀石 (present 磨刀石 station relocated)',
 '明月溝':'明月溝 = 安图站 (in 明月镇, opened 1933)','雅樹川':'printed 雅樹川, = 榆树川 (see notes.md)','下九臺':'下九臺 = 九台','土門嶺':'土門嶺 = 土们岭','〓子〓':'illegible; = 苇子沟 (葦子溝), between 磨盘山 and 图们',
 '五河林':'五河林 = 五林 (name contracted)','通天':'通天 = 通天屯','閣家':'printed 閣家; = 阎家 (閻家), probable misreading','廐寧寺':'printed 廐寧寺; = 广宁寺 (廣寧寺), probable misreading; OSM point c. 1 km from traced line','黃旗屯':'黃旗屯 = 吉林西站 (吉海鐵路總站, renamed 1985)',
 '饒陽河':'饒陽河 = 绕阳河','高橋':'高橋 = 高桥镇站','衙門□':'illegible; = 衙门营 (衙門營)','大平川':'大平川 = 太平川','開通':'開通 = 通榆站 (county renamed)','鎭東':'鎭東 = 镇赉站 (county renamed)',
 '園嶺':'printed 園嶺; = 兰岭 (蘭嶺), probable misreading','平陽':'平陽 = 鸡东站 (county seat)','永安':'永安 = 永安乡','三岔河':'三岔河 = 扶余站 (renamed)','杜魯爾':'杜魯爾 = 杜拉尔 (transliteration); at end of traced 阿杜線',
 '伊爾施':'OSM 伊尔施 1.9 km from the roughly traced 阿杜線','渾江':'渾江 = 白山市站 (renamed)','臨江縣':'臨江縣 = 临江站','東梁':'2.0 km from traced 新義線 (line relocated around 阜新 open‑cast mine after 1942)','淸河門':'1.7 km from traced 新義線 (line relocated near 阜新)',
 '渾河':'OSM point 浑河站 1.1 km from traced line; may mark the settlement 浑河站 rather than the platform','皇姑屯':'OSM point 0.5 km from traced 奉山線','革鎭堡':'OSM point 0.7 km from traced line','綏陽':'OSM point 0.6 km from traced line',
 '登沙河':'OSM point is the 2015 丹大快速铁路 station; 1942 金城線 station site may differ','杏樹屯':'OSM point is the 2015 丹大快速铁路 station; 1942 金城線 station site may differ',
 '孟家屯':'孟家屯 (later 长春南站?) – OSM also has 长春南 c. 0.2 km away','萬寶山':'',
}
NOTES.update({'沙河':'沙河 = 林盛堡站 (renamed; wiki)','千山':'千山 (ex‑鞍山驛, 千山驛 from 1918) = 旧堡站 (wiki)','白旗堡':'白旗堡 = 大红旗站 (renamed; wiki)','大凌河':'大凌河 = 凌海站 (wiki: 大凌河站 → 锦县站 → 凌海站)',
 '八洲':'八洲 = 九三站 (原名八洲站, 双山站; wiki)','江洞':'printed 江洞; reference 江灣 = 二道湾站 (原名江湾站; wiki)','新安':'新安 = 六合镇站 (ex‑六合, c. 66 km from 富裕 = reference km 66.3; name change not documented)',
 '千振':'千振 (Japanese settler village) = 桦南站 (wiki)','彌榮':'彌榮 (Japanese settler village 弥栄) = 孟家岗站 (wiki)','沼分':'printed 沼分; reference 追分 (Japanese settler name) = 申家店站 at the reference km; rename not documented',
 '前郭旗':'前郭旗 = 松原站 (原名前郭旗站, 前郭站; renamed 1994; wiki)','土爾池哈':'土爾池哈 = 龙江站 (曾用名 图尔赤哈, 朱家坎; wiki)',
 '通北':'1942 通北 = 赵光站 (赵光站原名通北站, renamed 1945; wiki); reference km 299.4 fits','通興':'1942 通興 (ex‑通康) = present 通北站 (reference km 270 fits; the name 通北 moved when the old 通北 became 赵光)','李家':'李家 = OSM 李家 (reference km 282.7 fits between 通興 and old 通北)',
 '高麗門':'高麗門 (old name of 邊門鎮) = 一面山站 in 边门镇 (built 1904); position matches reference km','朝陽':'朝陽 = 朝阳南站 (ex‑三座塔, 朝阳站 until 2017; wiki); 辽宁朝阳 is the newer station 3 km away',
 '西東安':'西東安 = 密山西 (東安 = 密山)','龍門':'龍門 = 龙门河站 (position matches reference km; name extended)','阜新':'1942 阜新 = 阜新南站 (原阜新站, 1937, renamed 2016; wiki); 1.7 km from traced line (line relocated)',
 '大賚城':'大賚城 = 大安站 (大赉 = 大安); station moved 1.8 km south in 2017, so 2.5 km from the reference position','牧城子':'牧城子 = 前牧站 (前牧城驛) at the reference km; rename not documented',
 '火連寨':'火連寨 = OSM 火连寨, 5 km from the traced line, which follows the 1942 乙線 (via 新岭/威宁); the station is on the older 甲線 alignment','貔子窩':'貔子窩 = 皮口站 (wiki: 原名貔子窝站; present 2015 丹大 station 2.5 km from traced line)',
 '五廟子':'五廟子 = 平洋站 (built 1926, at the reference km 480.6); rename not documented','田昇':'田昇 (Japanese‑era name) = 双丰站 (built 1938, at the reference km); rename not documented','岩手':'岩手 (Japanese settler name) = 桃山站 (built 1941, at the reference km); rename not documented',
 '湖北':'湖北 = 凯北站 (兴凯湖北) at the reference km; rename not documented','□家':'illegible; reference 華家 = OSM 华家 (on trace, at reference km)','南榮':'printed 南榮; reference 兩家 = OSM 两家 (misreading)','到樂':'printed 到樂; reference 到保 = OSM 到保 (misreading)',
 '賀林':'printed 賀林; reference 寶林 = OSM 宝林 (misreading)','通德':'printed 通德; reference 通溝 = OSM 通沟 (misreading)','代馬灣':'printed 代馬灣; reference 代馬溝 = OSM 代马沟 (misreading)',
 '索格營':'索格營 renamed 鎭西 on 1942-11-20; = OSM 镇西','興和':'printed 興和; reference 興福 = OSM 兴福 (misreading)','上圓':'printed 上圓; reference 上園 = OSM 上园 (misreading)',
 '南崗':'printed 南崗; reference 南溝 = OSM 南沟 (misreading)','園兒屯':'printed 園兒屯; reference 瓢兒屯 = OSM 瓢儿屯 (misreading)',
 '茂家屯':'misreading of 萬家屯','後羊店':'misreading of 雙羊店','萬橋':'misreading of 高嶺','雙□山':'illegible; printed 雙□山 = 雙塔山 (OSM 双塔山, user note); the jikokusouko list gives 雙頭山','北京':'1942 北京 (錦古線/奉山線 through trains) = 前門東站 (北京東站); OSM 北京站 is the 1959 station c. 1.2 km east','雙□山':'illegible; = 双塔山 (雙塔山, notes.md)','天津':'1942 天津 (東站) = today 天津站'})
# ---- reference (jikokusouko) lookup for kana / romaji
sys.path.insert(0,S); from kana import romaji
import unicodedata
REF=json.load(open(S+'/ekimei.json'))
SUGG=json.load(open(S+'/ocr_suggestions.json')) if os.path.exists(S+'/ocr_suggestions.json') else {}
refidx=collections.defaultdict(list)
for k,v in REF.items():
    for s in v: refidx[norm(s['old'] or s['name'])].append((k.split('　')[0],s))
def ref_lookup(trad_names,lines_):
    keys=[norm(n) for n in trad_names]
    hits=[h for k in keys for h in refidx.get(k,[])]
    if not hits: return None
    # prefer hits on the same reference line name (last two chars of the timetable line name)
    pref=[h for h in hits if any(h[0][:2]==l.split(' ')[-1][:2] for l in lines_)]
    return (pref or hits)[0][1]
NOGEOM_NOTE='line not in manchuria-1942-lines.geojson; matched by name inside the corridor of its anchor stations'
# ---------- corridor matching for lines without geometry
nogeom=json.load(open(S+'/nogeom.json'))
nogeom['國線 鶴岡線']={'蓮江口':None,'鶴立':None,'峻德':None,'鶴岡':None}
anchor_pos={}
for k,v in results.items():
    ln,s=k.split('|'); anchor_pos.setdefault(s,(v['osm']['lon'],v['osm']['lat']))
corridor={}
SKIP_LINES={'連絡船 河北・營口間','國線 東當線'}
for ln,sts in nogeom.items():
    if ln in SKIP_LINES: continue
    names=list(sts.keys())
    known0=[(s,anchor_pos[s]) for s in names if s in anchor_pos]
    known={}
    for s,p in known0:
        if not known or min(hav(p[0],p[1],q[0],q[1]) for q in known.values())<=80000: known[s]=p
    last=None; found={}
    for s in names:
        if s in known: last=known[s]; continue
        keyname=ALIAS.get(ln+'|'+s,ALIAS.get(s,s)); key=norm(keyname)
        cands=[]
        for g in byname.get(key,[]):
            if not any(hav(g['lon'],g['lat'],h['lon'],h['lat'])<300 for h in cands): cands.append(g)
        ref=[last] if last else list(known.values())
        if not ref:
            # fallback: unique in dataset and within 60 km of another station of this line found so far
            ok=[g for g in cands]
            if len(ok)==1: found[s]=(ok[0],'unique name in dataset; no anchor')
            continue
        ok=[g for g in cands if min(hav(g['lon'],g['lat'],r[0],r[1]) for r in ref)<=60000]
        if len(ok)==1:
            g=ok[0]; isanchor=any(hav(g['lon'],g['lat'],v['osm']['lon'],v['osm']['lat'])<300 for v in results.values())
            found[s]=(g,'anchor' if isanchor else None); last=(g['lon'],g['lat'])
    # second pass for fallback-without-anchor lines: verify mutual proximity
    if not known:
        pts=[(g['lon'],g['lat']) for g,_ in found.values()]
        if len(pts)>=2 and max(hav(a[0],a[1],b[0],b[1]) for a in pts for b in pts)>60000: found={}
    corridor[ln]=found
    for s in known:
        for k,v in results.items():
            if k.split('|')[1]==s: found[s]=(v['osm'],'anchor'); break
    print('corridor',ln,{s:g['name'] for s,(g,_) in found.items()},file=sys.stderr)
# ---------- Korean through stations from the Korea stations CSV
import csv as _csv
GEOMAP={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線','其他 東滿洲會社線':'東滿洲會社線'}
KCSV='/Users/kml/shell/interactive-japan-map/data/korea/stations.csv'
kby={}
for r in _csv.DictReader(open(KCSV,encoding='utf-8')):
    if r['hanja']: kby.setdefault(norm(r['hanja']),[]).append(r)
KOREA={'南陽','羅津','新義州','平壤','開城','京城','大田','大邱','三浪津','釜山','滿浦','上三峰'}
korea_recs=[]
for t in tables:
    ln=t['line']; gname=GEOMAP.get(ln,ln); coords=lines.get(gname)
    for s,_ in t['stations']:
        if s not in KOREA or ln+'|'+s in results: continue
        if any(r[0]==s and r[1]==ln for r in korea_recs): continue
        ks=kby.get(norm(s),[])
        if len(ks)!=1: print('korea csv ambiguous/missing',s,len(ks),file=sys.stderr); continue
        k=ks[0]; lon,lat=float(k['lon']),float(k['lat'])
        d=dist_to_line(lon,lat,coords)[0] if coords else None
        g=dict(name=k['hanja'],key=norm(k['hanja']),lon=lon,lat=lat,osm_id='korea-csv:'+k['id'],fclass='korea_csv',prov='korea',romaji=k['romaji'],mr=k['mr'],hangul=k['hangul'])
        korea_recs.append((s,ln,g,(round(d) if d is not None and d<5000 else None),'korea-csv'))
# ---------- assemble station records: merge by OSM point cluster
recs=[]  # (trad, line, osm, dist, note, method)
for k,v in results.items():
    ln,s=k.split('|')
    if (ln,s) in EXCLUDE: continue
    recs.append((s,ln,v['osm'],v['dist'],'alias' if v['alias'] else 'name'))
recs+=korea_recs
for ln,found in corridor.items():
    for s,(g,extra) in found.items():
        if extra=='anchor': recs.append((s,ln,g,None,'name'))
        else: recs.append((s,ln,g,None,'corridor'+(';'+extra if extra else '')))
# cluster: by normalised trad name; within a name, cluster points within 1.2 km
groups=collections.defaultdict(list)
for r in recs: groups[r[2]['osm_id']].append(r)
# merge duplicate OSM points (same modern name within 300 m)
glist=list(groups.values()); merged=[]
for g in glist:
    for m in merged:
        a,b=g[0][2],m[0][2]
        if norm(re.sub(r'(火车站|车站|站)$','',a['name']))==norm(re.sub(r'(火车站|车站|站)$','',b['name'])) and hav(a['lon'],a['lat'],b['lon'],b['lat'])<300:
            m.extend(g); break
    else: merged.append(g)
features=[]; fid=0
for c in merged:
    if True:
        # choose representative OSM point: the one used most often, then smallest dist
        cnt=collections.Counter(r[2]['osm_id'] for r in c)
        best=max(c,key=lambda r:(cnt[r[2]['osm_id']],-(r[3] if r[3] is not None else 9999)))
        g=best[2]
        names=collections.Counter(r[0] for r in c)
        trad=names.most_common(1)[0][0]
        lines0=list(dict.fromkeys(r[1] for r in c))
        rr0=ref_lookup(list(names),lines0)
        if rr0:
            ok=[n for n in names if norm(n)==norm(rr0['old'] or rr0['name'])]
            if ok: trad=ok[0]
        variants=[n for n in names if n!=trad]
        LBL={'國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':'國線 綏佳線'}
        lines_=[]
        for r in c:
            if LBL.get(r[1],r[1]) not in lines_: lines_.append(LBL.get(r[1],r[1]))
        notes=[]
        for n in [trad]+variants:
            if NOTES.get(n): notes.append(NOTES[n])
        for r in c:
            if NOTES.get(r[1]+'|'+r[0]): notes.append(NOTES[r[1]+'|'+r[0]])
        if variants: notes.append('also printed as '+'/'.join(variants))
        if any(r[4]=='korea-csv' for r in c): notes.append('Korean through station; position from interactive-japan-map korea/stations.csv ('+g['osm_id']+', '+g.get('hangul','')+', MR '+g.get('mr','')+')')
        if any(r[4].startswith('corridor') for r in c): notes.append(NOGEOM_NOTE+' ('+', '.join(r[1] for r in c if r[4].startswith('corridor'))+')')
        dists=[r[3] for r in c if r[3] is not None]
        cand_names=[trad]+variants+[SUGG[r[1]+'|'+r[0]] for r in c if r[1]+'|'+r[0] in SUGG]
        rr=ref_lookup(cand_names,lines_)
        yomi=rr['yomi'] if rr else None; rom=romaji(rr['yomi']) if rr and rr['yomi'] else None
        if g.get('romaji'): rom=g['romaji']
        refname=(rr['old'] or rr['name']) if rr else None
        modern=re.sub(r'\s+.*$','',g['name'])
        py=' '.join(lazy_pinyin(norm(modern) if modern else norm(trad),style=Style.TONE))
        py=''.join(w.capitalize() if i==0 else w for i,w in enumerate(py.split(' ')))
        fid+=1
        features.append(dict(type='Feature',id=fid,properties={
            'name':trad,'name_modern':g['name'],'pinyin':py,'name_ref':refname,'yomi':yomi,'romaji':rom,
            'lines':'; '.join(lines_),'osm_id':g['osm_id'],'fclass':g['fclass'],
            'dist_to_line_m':(min(dists) if dists else None),
            'match':'korea-csv' if any(r[4]=='korea-csv' for r in c) else ('name' if all(r[4]=='name' for r in c) else ('alias' if any(r[4]=='alias' for r in c) else 'corridor')),
            'notes':' | '.join(dict.fromkeys(notes)) or None},
            geometry=dict(type='Point',coordinates=[g['lon'],g['lat']])))
features.sort(key=lambda f:(f['properties']['lines'],f['properties']['name']))
for i,f in enumerate(features,1): f['id']=i
json.dump(dict(type='FeatureCollection',name='manchuria-1942-stations',crs={"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},features=features),
          open('add_stations/manchuria-1942-stations.geojson','w'),ensure_ascii=False,indent=1)
print('features',len(features),file=sys.stderr)
json.dump(corridor,open(S+'/corridor.json','w'),ensure_ascii=False,default=str)

json.dump(sorted({(r[1],r[0]) for r in recs}),open(S+'/matched_pairs.json','w'),ensure_ascii=False)
