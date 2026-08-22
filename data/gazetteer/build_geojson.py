import glob, json, collections, io

COLS = ['geonameid','name','asciiname','alt','lat','lon','fclass','fcode','country',
        'cc2','admin1','admin2','admin3','admin4','population','elevation','dem','tz','mod']
SEATS = {'PPLC','PPLA','PPLA2','PPLA3','PPLA4','PPLA5','PPLG'}
# generous frame: the map's home view plus the browse layer's reach into South Asia
BBOX = (60.0, 180.0, -25.0, 60.0)   # lon_min, lon_max, lat_min, lat_max

def rows(path):
    for ln in open(path, encoding='utf-8'):
        c = ln.rstrip('\n').split('\t')
        if len(c) < 19: continue
        yield c

def inbox(lat, lon):
    return BBOX[0] <= lon <= BBOX[1] and BBOX[2] <= lat <= BBOX[3]

def feat(c):
    pop = int(c[14]) if c[14] else 0
    return {'type':'Feature',
            'geometry':{'type':'Point','coordinates':[round(float(c[5]),5), round(float(c[4]),5)]},
            'properties':{'id':int(c[0]),'name':c[1],'ascii':c[2],'fcode':c[7],
                          'country':c[8],'admin1':c[10],'admin2':c[11],'pop':pop}}

def write(path, feats, note):
    with open(path,'w',encoding='utf-8') as f:
        f.write('{"type":"FeatureCollection","name":"%s","features":[\n' % note)
        for i,x in enumerate(feats):
            f.write(json.dumps(x, ensure_ascii=False))
            f.write(',\n' if i < len(feats)-1 else '\n')
        f.write(']}\n')
    print(f'{path}: {len(feats):,} features')

# --- 1. everything with a real population figure, from cities500 (global, clipped) ---
pop_feats=[]; seen=set()
for c in rows('cities500.txt'):
    lat, lon = float(c[4]), float(c[5])
    if inbox(lat, lon):
        pop_feats.append(feat(c)); seen.add(int(c[0]))
pop_feats.sort(key=lambda f: -f['properties']['pop'])
write('places-populated.geojson', pop_feats, 'GeoNames cities500, map region')

# --- 2. every administrative seat from the country dumps ---
seat_feats=[]
for path in sorted(glob.glob('*.p.tsv')):
    for c in rows(path):
        if c[7] in SEATS:
            seat_feats.append(feat(c))
seat_feats.sort(key=lambda f: (f['properties']['fcode'], -f['properties']['pop']))
write('places-seats.geojson', seat_feats, 'GeoNames administrative seats')

# --- 3. the union: seats + anything with a population, deduped ---
union={}
for f in seat_feats + pop_feats:
    union[f['properties']['id']] = f
u=sorted(union.values(), key=lambda f: -f['properties']['pop'])
write('places-merged.geojson', u, 'GeoNames seats + populated places')

# --- 4. China only, at full county-seat detail ---
cn=[f for f in u if f['properties']['country']=='CN']
write('places-china.geojson', cn, 'GeoNames China: seats + populated places')
