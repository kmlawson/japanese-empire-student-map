import json,os,sys,re,difflib,collections
S=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x']; exec(open(S+'/match.py').read().split('# ---- geofabrik')[0])   # norm()
JP={'図':'图','満':'满','浜':'滨','斉':'齐','黒':'黑','沢':'泽','竜':'龙','関':'关','塩':'盐','楡':'榆','昻':'昂','鉄':'铁','豊':'丰','県':'县','呉':'吴','鶏':'鸡','雞':'鸡','戸':'户','歩':'步','桜':'樱','帮':'帮','辺':'边','渓':'溪','堿':'碱','団':'团','壊':'坏','拠':'据','荘':'庄','嶺':'岭','龍':'龙','鹽':'盐','寶':'宝','霊':'灵','斗':'斗','鬪':'斗','門':'门'}
def n2(s):
    s=re.sub(r'[\s()（）]','',s)
    s=''.join(JP.get(c,c) for c in s)
    return norm(s)
ref=json.load(open(S+'/ekimei.json'))
refby={k.split('　')[0].split(' [')[0]:v for k,v in ref.items()}
# timetable line -> reference line keys (list, concatenated in order)
MAP={'滿鐵社線 連京線':['連京線'],'滿鐵社線 安奉線':['安奉線'],'滿鐵社線 金城線':['金城線'],'滿鐵社線 撫順線':['撫順線'],'滿鐵社線 營口線':['営口線'],
 '滿鐵社線 旅順線':['旅順線'],'滿鐵社線 煙臺炭礦線':['煙台炭礦線'],'國線 溪城線':['渓堿線'],'國線 安南線':['安南線'],'國線 奉吉線':['奉吉線'],'國線 壺蘆島線':['壺蘆島線'],
 '滿洲國線 奉山線':['奉山線'],'滿洲國線 新義線':['新義線'],'滿鐵社線 高新線':['高新線'],'國線 河北線':['河北線'],'國線 北票線':['北票線'],'國線 葉峰線':['葉峰線'],'國線 錦古線':['錦古線'],
 '國線 大鄭線':['大鄭線'],'國線 平梅線':['平梅線'],'國線 大栗子線':['大栗子線'],'國線 渾三線':['渾三線'],'國線 梅輯線':['梅輯線'],'國線 平齊線':['平斉線'],'國線 榆樹線':['楡樹線'],
 '國線 京白線':['京白線'],'國線 白阿線':['白杜線'],'國線 寧霍線':['寧霍線'],'國線 阿杜線':['白杜線'],'國線 東當線':['東当線'],'國線 北黑線':['北黒線'],'國線 虎林線':['虎林線'],
 '國線 齊北線':['斉北線'],'國線 濱北線':['浜北線'],'國線 龍豐線':['龍豊線'],'國線 京圖線':['京図線'],'國線 霍黑線':['霍黒線','双源線'],'國線 拉濱線':['拉浜線'],'國線 京濱線':['京浜線'],
 '國線 濱洲線':['浜洲線'],'國線 綏佳線':['綏佳線'],'國線 濱綏線':['浜綏線'],'國線 城雞線':['城雞線'],'國線 綏寧線':['綏寧線'],'滿洲國線 京圖線':['京図線'],'國線 圖佳線':['図佳線'],
 '國線 綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）':['綏佳線','鶴岡線'],'國線 朝開線':['朝開線'],'國線 青道線':['和龍線'],'國線 恒山線':['恒山線','虎林線'],'國線 興寧線':['興寧線'],
 '其他 錦西鐵道線':['錦西鉄道'],'其他 開豐鐵道線':['開豊鉄道'],'其他 吉林鐵道線':['吉林鉄道'],'其他 東滿洲會社線':['東満洲鉄道']}
# all reference names (for through-station detection)
allref={}
for k,v in ref.items():
    for s in v: allref.setdefault(n2(s['old'] or s['name']),[]).append((k.split('　')[0],s))
tables=json.load(open(S+'/tables.json'))
KOREA={'南陽','羅津','新義州','平壤','開城','京城','大田','大邱','三浪津','釜山','滿浦'}
HUABEI={'山海關','北戴河','塘沽埠頭','塘沽碼頭','天津','北京','密雲','新通州','古北口'}
lines=collections.OrderedDict()
for t in tables: lines.setdefault(t['line'],[]).append(t)
out=['# OCR check of station names against 満洲鉄道駅名一覧 1940–1945 (jikokusouko.pages.dev)','',
'For every line in the timetables, the station column was compared with the reference list for the same line.',
'`✗` = printed name not found on that line in the reference; the proposed reading is the reference station that falls in the same',
'gap between correctly matched neighbours (unique gap = strong evidence). `through` = the name exists on another reference line',
'(a through station listed at the end of the column), not an OCR issue. Reference km from the line origin are given.','']
tot=0;sus=0;fixed=0;summary=[]
sugg={}
for ln,ts in lines.items():
    if ln not in MAP: continue
    refs=[]; 
    for rk in MAP[ln]: refs+= [dict(s,line=rk) for s in refby[rk]]
    refnames=[n2(s['old'] or s['name']) for s in refs]
    rows=[]; seen=set()
    for t in ts:
        tt=[s for s,_ in t['stations']]
        tn=[n2(s) for s in tt]
        sm=difflib.SequenceMatcher(None,tn,refnames,autojunk=False)
        matched={}  # timetable idx -> ref idx
        for a,b,n in sm.get_matching_blocks():
            for i in range(n): matched[a+i]=b+i
        for i,s in enumerate(tt):
            if s in seen: continue
            seen.add(s); tot+=1
            if i in matched: continue
            if tn[i] in refnames:  # matched but out of alignment order
                j=refnames.index(tn[i]); r=refs[j]; continue
            # gap: nearest matched before/after
            prev=[matched[j] for j in range(i-1,-1,-1) if j in matched]; nxt=[matched[j] for j in range(i+1,len(tt)) if j in matched]
            lo=prev[0]+1 if prev else 0; hi=nxt[0] if nxt else len(refs)
            gap=[refs[j] for j in range(lo,hi) if refnames[j] not in tn]
            # how many unmatched timetable stations in same gap
            ntt=sum(1 for j in range(i,len(tt)) if j not in matched and (not nxt or j< [k for k in range(i+1,len(tt)) if k in matched][0]) and tt[j] not in [])
            through=[k for k,ss in allref.get(tn[i],[])]
            if s in KOREA or s in HUABEI:
                rows.append((s,'outside reference (Korea / 華北)','','')); continue
            if through:
                rows.append((s,'through: '+'/'.join(dict.fromkeys(through)),'','')); continue
            sus+=1
            # similarity ranking within gap
            def sim(a,b): return difflib.SequenceMatcher(None,a,b).ratio()
            cands=sorted(gap,key=lambda r:-sim(s,r['old'] or r['name']))
            ren=[r for r in gap if ('「'+s) in r['note'] and '改称' in r['note']]
            if ren:
                r=ren[0]; sugg[(ln,s)]=r['old'] or r['name']
                rows.append((s,'printed name correct; renamed later → '+(r['old'] or r['name']),f"{r['km']}",r['note'])); continue
            if len(gap)==1 or (cands and sim(s,cands[0]['old'] or cands[0]['name'])>=0.5 and (len(cands)==1 or sim(s,cands[0]['old'] or cands[0]['name'])>sim(s,cands[1]['old'] or cands[1]['name']))):
                r=cands[0]; fixed+=1
                sugg[(ln,s)]=r['old'] or r['name']
                rows.append((s,'✗ → **'+(r['old'] or r['name'])+'**',f"{r['km']}",('unique in gap' if len(gap)==1 else f'best of {len(gap)} in gap: '+', '.join((c['old'] or c['name']) for c in cands[:4]))+(' ; '+r['note'] if r['note'] else '')))
            elif gap:
                rows.append((s,'✗ (no clear match)','', 'gap candidates: '+', '.join((c['old'] or c['name'])+f"({c['km']})" for c in cands[:6])))
            else:
                rows.append((s,'✗ not in reference line','','no unmatched reference station in this gap'))
    # reference stations not in timetable at all
    ttall={n2(s) for t in ts for s,_ in t['stations']}
    missing_ref=[r for r in refs if n2(r['old'] or r['name']) not in ttall and n2(r['old'] or r['name']) not in {n2(v) for v in sugg.values()}]
    if rows or missing_ref:
        out.append(f'## {ln}  (reference: {", ".join(MAP[ln])})'); out.append('')
        if rows:
            out.append('| printed | verdict | ref km | evidence |'); out.append('|---|---|---|---|')
            for r in rows: out.append('| '+' | '.join(r)+' |')
            out.append('')
        if missing_ref:
            out.append('Reference stations not in the July 1942 column: '+', '.join(f"{r['old'] or r['name']} ({r['km']}{' '+r['note'] if r['note'] else ''})" for r in missing_ref)); out.append('')
    summary.append((ln,len(rows)))
ren_n=sum(1 for r in out if 'renamed later' in r)
hdr=[f'Stations compared: {tot}. Not found on their reference line: {sus}, of which {ren_n} are names renamed after July 1942 (printed name correct). Proposed OCR corrections: {fixed}.','']
out[6:6]=hdr
open('add_stations/ocr-check.md','w').write('\n'.join(out))
json.dump({f'{k[0]}|{k[1]}':v for k,v in sugg.items()},open(S+'/ocr_suggestions.json','w'),ensure_ascii=False,indent=0)
print(hdr[0])
