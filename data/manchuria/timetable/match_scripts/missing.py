import json,os,re,collections
S=os.path.dirname(os.path.abspath(__file__))
tables=json.load(open(S+'/tables.json'))
matched={tuple(x) for x in json.load(open(S+'/matched_pairs.json'))}
ct=json.load(open(os.path.expanduser('~/.claude/skills/trad-simp-toggle/assets/convtable.json'))); T2S=dict(zip(ct['tk'],ct['tv']))
KOREA={'南陽','羅津','新義州','平壤','開城','京城','大田','大邱','三浪津','釜山','滿浦'}
HEBEI={'山海關','北戴河','塘沽埠頭','塘沽碼頭','天津','北京','承德','平泉','古北口','密雲','新通州','灤平','灤河','藍旗','窰溝門','拉海溝','火斗山','上板城','下板城','永和','上谷','小寺溝','雙□山','楊樹嶺','老鴿'}
NOGEOM={'國線 河北線','國線 北票線','國線 大栗子線','國線 渾三線','國線 榆樹線','國線 東當線','國線 龍豐線','國線 霍黑線','國線 城雞線','國線 青道線','國線 恒山線','其他 錦西鐵道線','其他 開豐鐵道線','其他 吉林鐵道線','連絡船 河北・營口間'}
H={
 '朝陽':'OSM 辽宁朝阳 lies 3.2 km from the traced 錦古線, while 朝阳南 (45 m) and 朝阳西 (97 m) sit on it; check the trace near 朝陽 before accepting 辽宁朝阳',
 '阜新':'OSM 阜新 is 5.5 km from the traced 新義線 (line relocated round the 海州 open‑cast mine after 1942); 1942 site unknown',
 '東阜新':'not in OSM; line relocated near 阜新','西阜新':'not in OSM; line relocated near 阜新',
 '貔子窩':'= 皮口; OSM 皮口 is 2.5 km from the traced 金城線, which here follows the 2015 丹大 alignment (皮口南 is on the trace)',
 '壺蘆島':'= 葫芦岛港 area; no OSM station point','壺蘆島埠頭':'harbour terminus; no OSM station point',
 '撫順城':'= 抚顺北站 (renamed 2000s); no OSM point in the extract','大豐滿':'= 丰满; no OSM point in the extract',
 '南新京':'site unclear (not today\'s 长春南, which is the former 孟家屯)','顧鄉屯':'possibly today\'s (old) 哈尔滨西 at 顾乡; not verified',
 '九站':'possibly = 双吉 (九站 district of 吉林); not verified','代馬灣':'OSM has 代马沟 between 老磨刀石 and 老穆棱 – probably the same halt, name differs',
 '郝家堡':'OSM has 祁家堡 between 连山关 and 草河口 – possibly a misreading, not verified','火連寨':'OSM 火连寨 is 5 km from the traced 安奉線 (old alignment via 溪湖?)',
 '迎春':'OSM 迎春 is 27 km from the traced 虎林線 – a different place','尾山':'','龍門':'OSM has 龙门河 between 龙镇 and 小兴安 – possibly the same; not verified',
 '訥謨爾':'possibly = 五大连池 (ex‑德都); not verified','神武屯':'OSM has 锦河 and 黑河南 between 黄金子 and 黑河; not verified',
 '千振':'Japanese settler name; possibly = 桦南; not verified','前郭旗':'possibly = 前郭 / 松原; not verified','大賚城':'大賚 = 大安; OSM 大安 is the 2017 relocated station (old site 1.8 km N); not verified',
 '到樂':'OSM has 到保 near the expected position – possibly a misreading','西鷄寧':'possibly = 鸡西西; not verified','西雞寧':'possibly = 鸡西西; not verified',
 '西東安':'possibly = 密山西; not verified','密山':'1942 密山 (old county town, now 知一) ≠ today\'s 密山 station (= 1942 東安)',
 '琿春':'OSM 珲春 (1990s 图珲线 station) lies on the reconstructed 東滿洲會社線 trace; 1942 site not verified',
 '老營':'OSM has 老岭 between 石湖 and 阳岔 – different name','靠山屯':'OSM has 石家/团林 between 磐石 and 朝阳镇; no match',
 '土爾池哈':'possibly = 龙江 (ex‑朱家坎?); not verified','十家子':'OSM has 么荒 between 新立屯 and 泡子; no match',
 '□家':'OSM has 华家 between 小合隆 and 农安 – plausible reading 華家','老頭溝':'not in OSM (halt closed?)',
 '元帥林':'OSM has 铁背山 between 南杂木 and 营盘','立山':'OSM has 灵山 between 鞍山 and 首山 (different name)','千山':'OSM has 旧堡 between 汤岗子 and 鞍山',
 '河西':'綏寧線 origin near 綏陽; OSM has 绥阳南 near the expected position','綏西':'OSM has 绥阳南 near the expected position',
 '□陽':'','三林':'','李家':'OSM 李家 on 濱北線 lies beyond 通北 (towards 北安), but the 1942 order is 楊家‑李家‑通北; excluded as probably a different halt',
 '密雲':'OSM 密云 is 14 km from the traced 錦古線 south of 古北口 (trace or station relocated)', '新通州':'possibly = 通州; not verified', '塘沽埠頭':'harbour pier; no OSM station', '塘沽碼頭':'harbour pier; no OSM station', '五河林':'','鶴隆':'','伊胡塔':'','巴胡塔':'',
}
out=['# Stations in the July 1942 timetables not placed in manchuria-1942-stations.geojson','',
 'Matching used the Geofabrik station points for 黑龙江, 吉林, 辽宁, 内蒙古 and 河北 (incl. Beijing/Tianjin). Stations in Korea',
 'were never matchable and are marked as such. Stations placed on another line (through stations) are not repeated here. `□`/`〓` = illegible in the transcription.',
 'Lines marked *(no geometry)* are not in `manchuria-1942-lines.geojson`; for those, only stations that were unique inside a corridor of',
 'the line\'s anchor stations were placed, everything else is listed here.','']
seen=set(); tot=0
order=[]
for t in tables:
    if t['line'] not in order: order.append(t['line'])
for ln in order:
    miss=[]
    for t in tables:
        if t['line']!=ln: continue
        for s,_ in t['stations']:
            if (ln,s) in matched or (ln,s) in seen: continue
            if any(x[1]==s for x in matched) and s not in ('大興',): seen.add((ln,s)); continue
            seen.add((ln,s)); miss.append(s)
    if not miss: continue
    out.append(f"## {ln}"+(' *(no geometry)*' if ln in NOGEOM else ''))
    for s in miss:
        tot+=1
        tag=[]
        if s in KOREA: tag.append('Korea – not in korea/stations.csv')
        elif s in HEBEI: tag.append('no OSM point of this name near the trace (Hebei extract)')
        elif '□' in s or '〓' in s: tag.append('illegible')
        if H.get(s): tag.append(H[s])
        out.append(f"- {s}"+(' — '+'; '.join(tag) if tag else ''))
    out.append('')
out.insert(6,f'Total unplaced (line, station) pairs: {tot}.'); out.insert(7,'')
open('add_stations/missing.md','w').write('\n'.join(out))
print(tot)
