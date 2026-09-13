import re,json,glob,html
S='/private/tmp/claude-501/-Users-kml-Desktop-manchuria/b37ca7eb-33a8-4b7c-a14b-86cfd06f5716/scratchpad'
out={}
for f in sorted(glob.glob(S+'/ekimei/manshu*.htm')):
    t=open(f,encoding='utf-8').read()
    # split into sections by headings with ids
    secs=re.split(r'(<h[34][^>]*id="[^"]+"[^>]*>.*?</h[34]>)',t)
    cur=None
    for chunk in secs:
        m=re.match(r'<h[34][^>]*id="([^"]+)"[^>]*>(.*?)</h[34]>',chunk,re.S)
        if m:
            cur=(m.group(1),re.sub('<[^>]+>','',m.group(2)).strip()); out[cur]=[]; continue
        if cur is None: continue
        for row in re.findall(r'<tr[^>]*>(.*?)</tr>',chunk,re.S):
            cells=[html.unescape(re.sub('<[^>]+>','',c)).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>',row,re.S)]
            if len(cells)>=4 and re.match(r'^-?[\d.]+$',cells[0] or 'x'):
                out[cur].append(dict(km=float(cells[0]),name=cells[1],old=cells[2],yomi=cells[3],fac=cells[4] if len(cells)>4 else '',note=cells[5] if len(cells)>5 else ''))
res={f'{k[1]} [{k[0]}]':v for k,v in out.items() if v}
json.dump(res,open(S+'/ekimei.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v),' '.join((s['old'] or s['name']) for s in v)[:150])
