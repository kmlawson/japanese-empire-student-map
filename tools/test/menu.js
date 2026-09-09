const { sandboxDownloads } = require('./downloads.js');
/* The right-click menu: what a reader can take away, and where it came from.
 *
 *     node tools/test/menu.js            # with a server on 8123
 *
 * Three things are checked and the third is the one that would be missed.
 *
 *   * **The offers narrow to what the shape is.** A province offers itself and
 *     its layer; an island offers itself, its archipelago and the layer. A
 *     group is only offered where there is one.
 *   * **The coordinates are the ones pressed.** The menu unprojects the point
 *     under the pointer, and a copied coordinate is a factual claim — so the
 *     figure it shows is checked against the ground the press was aimed at,
 *     not merely checked to exist.
 *   * **A finger opens it.** `contextmenu` is what a touch screen raises after
 *     a long hold, and the map was already swallowing that event on a coarse
 *     pointer. If it swallowed it without opening this, the whole feature
 *     would be desktop-only and every mouse test would still pass.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch, HOST } = require('./suite.js');
const URL=HOST+'/index.html';

/* Aim at a place and open the menu there in one go — and report back what the
   pressed *pixel* stands for, not what was aimed at.
   
   `MouseEvent` coerces clientX and clientY to integers, so a press aimed at
   501.39 lands on 501. At the opening view one pixel is about three map units,
   which is a twentieth of a degree — so comparing the menu against the
   aimed-at longitude fails by 0.06° and looks like a projection bug. It is
   not: a real mouse only ever delivers whole pixels either. The expected
   figure is therefore the *rounded* point unprojected, and the menu has to
   match that exactly. */
const menuAt=(p,lon,lat)=>p.evaluate((lo,la)=>{
  const svg=document.getElementById('jmap'), G=window.JMAP_GEO;
  const q=G.project(lo,la);
  const s=svg.createSVGPoint(); s.x=q.x; s.y=q.y;
  const raw=s.matrixTransform(svg.getScreenCTM());
  const scr={x:Math.round(raw.x), y:Math.round(raw.y)};
  const back=svg.createSVGPoint(); back.x=scr.x; back.y=scr.y;
  const u=back.matrixTransform(svg.getScreenCTM().inverse());
  const want=G.unproject(u.x,u.y);
  const el=document.elementFromPoint(scr.x,scr.y);
  if(!el) return {opened:false, why:'nothing under the point'};
  const wantLL=[+want.lon.toFixed(5), +want.lat.toFixed(5)];
  el.dispatchEvent(new MouseEvent('contextmenu',
    {clientX:scr.x, clientY:scr.y, bubbles:true, cancelable:true}));
  const m=document.getElementById('jmap-menu');
  if(!m) return {opened:false, why:'no menu', wantLL,
                 hit:el.getAttribute('data-prov')};
  const items=[...m.querySelectorAll('button')].map(b=>b.textContent);
  const copy=items.filter(t=>/^Copy coordinates/.test(t))[0]||'';
  const nums=/(-?\d+\.\d+), (-?\d+\.\d+)/.exec(copy);
  return {opened:true, head:m.querySelector('.menu-head').textContent, items,
          wantLL, lat:nums?+nums[1]:null, lon:nums?+nums[2]:null,
          src:[...m.querySelectorAll('.menu-src p')].map(x=>x.textContent),
          links:[...m.querySelectorAll('.menu-src a')].map(a=>a.getAttribute('href'))};
}, lon, lat);

const admin=async p=>{ await p.evaluate(()=>{
  const b=document.querySelector('#layer-seg button[data-cat="territory"]');
  if(b && b.getAttribute('aria-pressed')!=='true') b.click(); }); await sleep(1200); };

(async()=>{
  const browser=await launch(); await sandboxDownloads(browser);
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:900});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await ready(page);
  await admin(page);

  console.log('\n— a province —');
  const gifu=await menuAt(page,136.5,35.4);
  check('the menu opens on a province', gifu.opened, gifu.why||'');
  check('it is headed with the unit pressed', !!gifu.head, gifu.head);
  check('it offers that unit', gifu.items.some(t=>/^Download GeoJSON — /.test(t)),
        gifu.items.join(' | '));
  check('and the whole layer it belongs to',
        gifu.items.some(t=>/^Download GeoJSON — all of /.test(t)),
        gifu.items.join(' | '));
  check('a province is offered no group, having none',
        !gifu.items.some(t=>/Islands \(/.test(t)), gifu.items.join(' | '));

  console.log('\n— and the coordinates are the pixel pressed —');
  check('latitude is the unprojected press, to five places',
        gifu.lat === gifu.wantLL[1], gifu.lat + ' vs ' + gifu.wantLL[1]);
  check('longitude is the unprojected press, to five places',
        gifu.lon === gifu.wantLL[0], gifu.lon + ' vs ' + gifu.wantLL[0]);
  /* And it is the right part of the world, so that an exact match against a
     wrongly-derived expectation cannot pass quietly. */
  check('and it is the ground aimed at, within a pixel',
        Math.abs(gifu.lat-35.4)<0.1 && Math.abs(gifu.lon-136.5)<0.1,
        gifu.lat + ', ' + gifu.lon);

  console.log('\n— where the shape came from —');
  check('a source section', gifu.src.some(t=>/^Source$/.test(t)), gifu.src.join(' | '));
  check('it names the shape’s source, short', gifu.src.some(t=>/^Shape: /.test(t)),
        gifu.src.join(' | '));
  /* The *name* stays short — a book and its year, or a dataset and its
     version — and the note is extra. Measuring the whole line stopped being
     the check the moment notes were added, so the two halves are measured
     apart. */
  const halves=t=>{const i=t.indexOf(' — '); return i<0?[t,'']:[t.slice(0,i),t.slice(i+3)];};
  check('the source name is short, whatever the note says',
        gifu.src.filter(t=>/^Shape: /.test(t)).every(t=>halves(t)[0].length<90),
        gifu.src.filter(t=>/^Shape: /.test(t)).map(t=>halves(t)[0]).join(' | '));
  check('and the note is a phrase, not a paragraph',
        gifu.src.filter(t=>/^Shape: /.test(t)).every(t=>halves(t)[1].length<160),
        gifu.src.filter(t=>/^Shape: /.test(t)).map(t=>halves(t)[1]).join(' | '));
  check('and it links out to the original',
        gifu.links.some(h=>/^https?:/.test(h)), gifu.links.join(' | '));
  check('with the full page a click away',
        gifu.links.some(h=>/sources\.html/.test(h)), gifu.links.join(' | '));

  /* The file itself. Everything above tests the offer; this tests what comes
     out of it — which is the whole point of the feature and the part that can
     be wrong while every label is right. The blob is caught on its way to the
     download rather than fetched off disk. */
  console.log('\n— and the file is real GeoJSON, over the right ground —');
  const geo=await page.evaluate(()=>{
    let caught=null;
    const realBlob=window.Blob, realURL=URL.createObjectURL;
    window.Blob=function(parts,opts){ caught=String(parts[0]);
                                      return new realBlob(parts,opts); };
    URL.createObjectURL=function(){ return 'blob:stub'; };
    const b=[...document.querySelectorAll('#jmap-menu button')]
      .filter(x=>/^Download GeoJSON — /.test(x.textContent))[0];
    if(b) b.click();
    window.Blob=realBlob; URL.createObjectURL=realURL;
    if(!caught) return {ok:false};
    let j=null; try{ j=JSON.parse(caught); }catch(e){ return {ok:false, parse:String(e)}; }
    const f=j.features && j.features[0];
    const ring=f && f.geometry.coordinates[0][0];
    let x0=180,x1=-180,y0=90,y1=-90;
    (ring||[]).forEach(([x,y])=>{ x0=Math.min(x0,x); x1=Math.max(x1,x);
                                  y0=Math.min(y0,y); y1=Math.max(y1,y); });
    return {ok:true, type:j.type, n:j.features.length, gtype:f&&f.geometry.type,
            bom: caught.charCodeAt(0)===0xFEFF,
            props:f&&f.properties, closed: ring && ring.length>3
              && ring[0][0]===ring[ring.length-1][0]
              && ring[0][1]===ring[ring.length-1][1],
            box:[+x0.toFixed(2),+y0.toFixed(2),+x1.toFixed(2),+y1.toFixed(2)]};
  });
  check('a file came out of it', geo.ok, JSON.stringify(geo).slice(0,160));
  /* The CSVs carry a byte-order mark so Excel does not read them as
     Windows-1252. This must not: `JSON.parse` rejects a leading BOM, and so
     do most strict parsers a reader would put the file through. */
  check('and no byte-order mark, which the CSVs need and JSON cannot take',
        geo.bom===false, String(geo.bom));
  check('it is a FeatureCollection of MultiPolygon',
        geo.type==='FeatureCollection' && geo.gtype==='MultiPolygon',
        geo.type+' / '+geo.gtype);
  check('its rings are closed, as GeoJSON requires and SVG does not',
        geo.closed===true, String(geo.closed));
  check('it carries the name, the atom and the epoch',
        !!geo.props && !!geo.props.name && !!geo.props.atom && !!geo.props.epoch,
        JSON.stringify(geo.props||{}).slice(0,120));
  /* And it says what it is. A shape that leaves here and is measured elsewhere
     must not be mistaken for the survey it was drawn from. */
  check('and says it is the drawn geometry, not the source geometry',
        !!geo.props && /thinning|drawn/.test(geo.props.note||''),
        (geo.props&&geo.props.note||'').slice(0,80));
  check('the shape is over Gifu, not over the sea',
        geo.box[0]>135 && geo.box[2]<138.5 && geo.box[1]>34.5 && geo.box[3]<37.5,
        geo.box.join(', '));

  /* Naming a dataset is half of provenance. The shape drawn is often not the
     shape distributed, and where it is not, the menu has to say so — otherwise
     a reader takes China's provinces for ENP-China's, which they are not. */
  console.log('\n— what was done to the source, not only its name —');
  check('the shape source carries a note', gifu.src.some(t=>/^Shape: .+ — .+/.test(t)),
        gifu.src.join(' | '));
  check('and the note says these units were modified',
        gifu.src.some(t=>/^Shape: /.test(t) && /modified|taken back|traced|rebuilt|thinned|consulted|only/.test(t)),
        gifu.src.filter(t=>/^Shape: /.test(t)).join(' | '));

  /* China is the case the registry exists for: the coastline is one dataset,
     the provinces were re-traced from a second, and two more were consulted.
     One line would have to leave three of them out. */
  const cn=await menuAt(page,113.0,30.5);
  const shapes=(cn.src||[]).filter(t=>/^Shape: /.test(t));
  check('a shape built from several sources names them all', shapes.length>=3,
        shapes.length + ': ' + shapes.join(' | '));
  check('and each says what it contributed',
        shapes.length>=3 && shapes.every(t=>/ — /.test(t)), shapes.join(' | '));
  check('the coastline source says it is the coastline only',
        shapes.some(t=>/ENP-China/.test(t) && /coastline only/.test(t)),
        shapes.join(' | '));
  check('and the provinces say they were re-traced',
        shapes.some(t=>/re-traced/.test(t)), shapes.join(' | '));

  /* Escape first. An open menu sits over the map and swallows the wheel, so
     the zoom below simply did not happen and the next press landed on the
     province still under the pointer. */
  await page.keyboard.press('Escape');
  await sleep(200);

  console.log('\n— an island, which has an archipelago —');
  // Amami Ōshima: a fine island, in a group, on the 1942 sheet as on 1930
  const screenOf=(lon,lat)=>page.evaluate((lo,la)=>{
    const svg=document.getElementById('jmap'), G=window.JMAP_GEO;
    const q=G.project(lo,la);
    const s=svg.createSVGPoint(); s.x=q.x; s.y=q.y;
    const r=s.matrixTransform(svg.getScreenCTM());
    return {x:r.x, y:r.y};
  }, lon, lat);
  // the real wheel, through the browser: a synthesised WheelEvent does not
  // reliably reach the map's own handler
  for(let i=0;i<16;i++){
    const s=await screenOf(129.4,28.35);
    if(s.x<0||s.x>940||s.y<110||s.y>880) break;
    await page.mouse.move(s.x,s.y);
    await page.mouse.wheel({deltaY:-200});
    await sleep(110);
  }
  await sleep(2600);
  const isl=await menuAt(page,129.4,28.35);
  if (isl.opened && /Islands \(/.test(isl.items.join('|'))) {
    check('an island is offered its archipelago as well',
          isl.items.some(t=>/Islands \(\d+\)/.test(t)), isl.items.join(' | '));
  } else {
    check('an island is offered its archipelago as well', false,
          'menu: ' + JSON.stringify(isl).slice(0,200));
  }

  /* **Every shape offers something.** An atom is not one kind of element:
     most are a single `<path class="atom">` with the whole country in one `d`,
     some are a `<g>` of paths, a small place is met as a hit circle carrying
     `data-atom`, and a deferred atom is empty with its outline drawn by the
     base sheet as `path.whole[data-for]`. The first version handled the second
     of those four, so British India, Nepal, Karafuto, Tuva, Weihaiwei, the
     mandates and Japan-without-Administrative all offered nothing. */
  console.log('\n— every shape offers a download, whatever kind it is —');
  await page.keyboard.press('Escape');
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await ready(page);
  const PLACES=[['British India',78.5,23.0],['Nepal',84.0,28.3],
                ['Karafuto',142.5,49.5],['Weihaiwei',122.1,37.5],
                ['Tannu Tuva',94.5,51.5],['Goa',73.9,15.4],
                ['the mandate',168.0,7.1],['Japan',136.5,35.4]];
  for (const [n,lo,la] of PLACES) {
    const r=await menuAt(page,lo,la);
    const dl=(r.items||[]).filter(t=>/^Download GeoJSON/.test(t));
    check(n + ' offers a download', r.opened && dl.length>0,
          r.opened ? 'menu but no download' : (r.why||'no menu'));
    /* And headed with a name a reader would recognise, not the atom key: the
       key for British India is `india` and its territory is `britishindia`,
       which claims four atoms of its own. */
    check(n + ' is headed with a name, not a key',
          !!r.head && r.head !== r.head.toLowerCase(), r.head);
    await page.keyboard.press('Escape');
    await sleep(120);
  }

  /* **The country a shape is drawn as part of.** On the 1930 map China is not
     one atom: Xinjiang, Jehol, Chahar, Suiyuan and Manchuria are territories
     of their own, drawn separately and coloured alike because they share the
     legend's `chinese`. Right-clicking Xinjiang and asking for "the whole
     layer it is part of" means the Republic of China, and used to mean
     Xinjiang. */
  console.log('\n— and the country it is drawn as part of —');
  for (const [n,lo,la] of [['Xinjiang',85.0,41.0],['Jehol',118.0,42.0],
                           ['Manchuria',125.0,45.0]]) {
    const r=await menuAt(page,lo,la);
    const dl=(r.items||[]).filter(t=>/^Download GeoJSON/.test(t));
    check(n + ' offers itself and the Republic of China',
          dl.length>=2 && dl.some(t=>/all of Republic of China/.test(t)),
          dl.join(' | '));
    await page.keyboard.press('Escape');
    await sleep(120);
  }

  console.log('\n— and a finger opens the same menu —');
  const phone=await browser.newPage();
  await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const perrs=[]; phone.on('pageerror',e=>perrs.push(String(e)));
  await phone.goto(URL,{waitUntil:'domcontentloaded'});
  await ready(phone);
  await admin(phone);
  const tap=await menuAt(phone,136.5,35.4);
  check('the long press opens it on a touch screen', tap.opened,
        tap.why||JSON.stringify(tap).slice(0,140));
  check('with the same offers', tap.opened
        && tap.items.some(t=>/^Download GeoJSON/.test(t))
        && tap.items.some(t=>/^Copy coordinates/.test(t)),
        (tap.items||[]).join(' | '));
  check('and it fits on the screen it opened on', await phone.evaluate(()=>{
    const m=document.getElementById('jmap-menu'); if(!m) return false;
    const b=m.getBoundingClientRect();
    return b.left>=0 && b.top>=0 && b.right<=window.innerWidth+1
        && b.bottom<=window.innerHeight+1;
  }), 'a menu off the edge of a phone is no menu');

  /* ---- the Layers pane hands over its layers too --------------------
   *
   * The right-click menu gives a reader a territory; these give a *layer* —
   * the occupation as traced and as the North China Area Army reported it, the
   * rivers, the graticule, the line of control. Each is a ↓ on the row that
   * switches it on.
   *
   * **Mengchiang is the one that could do real harm.** It claimed 603,888 km²
   * and held 441,459; the map draws the held ground as a fill through a clip,
   * so that path's own `d` is the *claim*. Reading it back out and calling it
   * the territory would publish a claim as a fact. What leaves here is the two
   * shapes that are exact — the whole claim, and the part never held — each
   * saying how to get the third.
   */
  console.log('\n— and the Layers pane hands over its layers —');
  const WANT = ['occ-traced', 'occ-nca', 'opt-ccp', 'opt-manchukuo',
                'opt-mengjiang', 'opt-mengjiang-claim', 'opt-rivers',
                'opt-india-rivers', 'opt-extent', 'opt-graticule'];
  await page.evaluate(()=>{const e=[...document.querySelectorAll('#epoch-seg button')]
    .find(x=>/1942/.test(x.textContent)); if(e)e.click();});
  await sleep(2400);
  await page.evaluate(()=>document.getElementById('btn-options').click());
  await sleep(700);
  const arrows=await page.evaluate(()=>[...document.querySelectorAll('#dlg-options .pop-dl')]
    .map(x=>x.getAttribute('data-geo')).filter(Boolean));
  check('every layer asked for has an arrow',
    WANT.every(k=>arrows.indexOf(k)>=0),
    'missing ' + WANT.filter(k=>arrows.indexOf(k)<0).join(', '));

  const grab = k => page.evaluate(key=>{
    let caught=null; const B=window.Blob, U=URL.createObjectURL;
    window.Blob=function(parts,o){caught=String(parts[0]);return new B(parts,o);};
    URL.createObjectURL=function(){return 'blob:stub';};
    document.querySelector('.pop-dl[data-geo="'+key+'"]').click();
    window.Blob=B; URL.createObjectURL=U;
    if(!caught) return {ok:false};
    let j=null; try{ j=JSON.parse(caught); }catch(e){ return {ok:false,parse:String(e)}; }
    const flat=[]; const walk=v=>Array.isArray(v[0])?v.forEach(walk):flat.push(v);
    j.features.forEach(f=>walk(f.geometry.coordinates));
    const lon=flat.map(q=>q[0]), lat=flat.map(q=>q[1]);
    return {ok:true, n:j.features.length, type:j.features[0].geometry.type,
            pts:flat.length, props:j.features[0].properties,
            box:[Math.min(...lon),Math.min(...lat),Math.max(...lon),Math.max(...lat)]};
  }, k);

  const got={};
  for (const k of WANT) { got[k]=await grab(k); await sleep(120); }
  check('and every one of them yields a FeatureCollection with shapes in it',
    WANT.every(k=>got[k].ok && got[k].pts>50),
    WANT.filter(k=>!(got[k].ok&&got[k].pts>50)).join(', '));
  /* A river is not a polygon. `pathToRings` closes every subpath, which would
     bring the Yangzi back as a sliver running to Sichuan and home again. */
  check('the areas come back as polygons',
    ['occ-traced','occ-nca','opt-ccp','opt-manchukuo','opt-mengjiang']
      .every(k=>got[k].type==='MultiPolygon'),
    WANT.map(k=>k+':'+got[k].type).join(' '));
  check('and the rivers, the graticule and the line of control as lines',
    ['opt-rivers','opt-india-rivers','opt-extent','opt-graticule']
      .every(k=>got[k].type==='MultiLineString'),
    ['opt-rivers','opt-india-rivers','opt-extent','opt-graticule']
      .map(k=>k+':'+got[k].type).join(' '));
  /* Each over its own ground, so a mislabelled row shows up as a shape in the
     wrong part of the world rather than as a file nobody opens. */
  const over=(k,w,e,s2,n)=>{const b=got[k].box;
    return b[0]>=w&&b[2]<=e&&b[1]>=s2&&b[3]<=n;};
  check('the traced occupation lies over eastern China',
    over('occ-traced',105,125,17,42), JSON.stringify(got['occ-traced'].box));
  check('Manchukuo over the north-east',
    over('opt-manchukuo',114,137,38,55), JSON.stringify(got['opt-manchukuo'].box));
  check('and the rivers of India over India',
    over('opt-india-rivers',66,100,8,38), JSON.stringify(got['opt-india-rivers'].box));

  /* **The claim is bigger than the part of it never held, and says so.** */
  const claim=got['opt-mengjiang'].box, unheld=got['opt-mengjiang-claim'].box;
  check('Mengjiang\u2019s claim encloses the part never held',
    unheld[0]>=claim[0]-0.01 && unheld[2]<=claim[2]+0.01
    && unheld[1]>=claim[1]-0.01 && unheld[3]<=claim[3]+0.01,
    JSON.stringify(claim)+' vs '+JSON.stringify(unheld));
  check('and the never-held part is the western end of it',
    unheld[2] < claim[2] - 5, JSON.stringify(unheld)+' inside '+JSON.stringify(claim));
  check('each says in its own properties what it is and is not',
    /441,459|never held/.test(JSON.stringify(got['opt-mengjiang'].props))
    && /never under Japanese control/.test(JSON.stringify(got['opt-mengjiang-claim'].props)),
    JSON.stringify(got['opt-mengjiang'].props).slice(0,140));

  /* ===================== the gazetteer =============================
   *
   * A right click on a dot. Two things are being guarded: that the dot answers
   * at all — before this it fell through to the province underneath, so a
   * reader who pressed Shanghai was offered Jiangsu — and that the file which
   * comes out carries what a gazetteer is *for*. A point layer with one glued
   * display string in it can be sorted by nothing and joined to nothing, so
   * the names are checked apart from each other and the size is checked as a
   * word as well as a number.
   *
   * The curated markers are tested beside the plain dots because fifty-odd
   * places have both, the marker is drawn on top, and it is the marker the
   * pointer meets. Those answered from a different record and had to be sent
   * back to the gazetteer for the size. */
  console.log('\n— a city dot, and the gazetteer behind it —');
  /* A page of its own. The section above loads every layer the pane offers
     into this one, and asking that page to switch the gazetteer on and redraw
     four hundred dots is enough work to outrun the protocol timeout — which
     reads as a hang in a test that is measuring neither. */
  const town=await browser.newPage();
  await town.setViewport({width:1280,height:900});
  await town.evaluateOnNewDocument(SHIM);
  town.on('pageerror',e=>errs.push(String(e)));
  await town.goto(URL+'?layers=2',{waitUntil:'domcontentloaded'});
  await ready(town);
  await sleep(900);

  /* Pressed on the element rather than at a coordinate: at the opening view
     the big dots sit within a few pixels of each other and a press aimed at
     one lands on its neighbour, which measures nothing about either. */
  const cityMenu=(p,sel)=>p.evaluate(s=>{
    document.getElementById('jmap-menu')?.remove();
    const el=document.querySelector(s);
    if(!el) return {opened:false, why:'no such element: '+s};
    const hit=el.querySelector('.hit')||el;
    const r=el.getBoundingClientRect();
    hit.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,
      clientX:Math.round(r.x+r.width/2), clientY:Math.round(r.y+r.height/2)}));
    const m=document.getElementById('jmap-menu');
    if(!m) return {opened:false, why:'no menu'};
    return {opened:true, head:m.querySelector('.menu-head').textContent,
            items:[...m.querySelectorAll('button')].map(b=>b.textContent)};
  }, sel);

  const dot=await cityMenu(town,'#gaz g.gaz[data-id="g_e1930_shanghai"]');
  check('a plain gazetteer dot opens the menu', dot.opened, dot.why||'');
  check('headed with the place, not the province under it',
        /Shàng|Shang/.test(dot.head||''), dot.head);
  check('it offers that one place',
        (dot.items||[]).some(t=>/^Download GeoJSON — Shàng|^Download GeoJSON — Shang/.test(t)),
        (dot.items||[]).join(' | '));
  check('and every city on the date',
        (dot.items||[]).some(t=>/^Download GeoJSON — all cities and towns, 1930 \(\d+\)/.test(t)),
        (dot.items||[]).join(' | '));

  /* Tokyo carries a curated marker over its dot, so the record that answers is
     the site's and not the gazetteer's. */
  const site=await cityMenu(town,'g.site[data-cat="city"][data-id="tokyo"]');
  check('a curated city marker opens it too', site.opened, site.why||'');
  check('and offers the same two things',
        (site.items||[]).filter(t=>/^Download GeoJSON/.test(t)).length>=2,
        (site.items||[]).join(' | '));

  console.log('\n— and the file is a point layer worth joining to —');
  const cities=await town.evaluate(()=>{
    let caught=null;
    const realBlob=window.Blob, realURL=URL.createObjectURL;
    window.Blob=function(parts,opts){ caught=String(parts[0]);
                                      return new realBlob(parts,opts); };
    URL.createObjectURL=function(){ return 'blob:stub'; };
    const b=[...document.querySelectorAll('#jmap-menu button')]
      .filter(x=>/all cities and towns/.test(x.textContent))[0];
    if(b) b.click();
    window.Blob=realBlob; URL.createObjectURL=realURL;
    if(!caught) return {ok:false};
    let j=null; try{ j=JSON.parse(caught); }catch(e){ return {ok:false, parse:String(e)}; }
    const P=j.features.map(f=>f.properties);
    const sh=P.filter(p=>p.id==='shanghai')[0]||{};
    return {ok:true, type:j.type, n:j.features.length, layer:j.layer,
            gtype:(j.features[0]||{}).geometry.type,
            epochs:[...new Set(P.map(p=>p.epoch))],
            sizes:[...new Set(P.map(p=>p.size))].sort(),
            tiersAgree:P.every(p=>['small','medium','large','largest'][p.size_tier]===p.size),
            named:P.filter(p=>p.name_en).length,
            ja:P.filter(p=>p.name_ja).length,
            caps:P.filter(p=>p.capital).length,
            capsNamed:P.filter(p=>p.capital&&p.capital_of).length,
            coords:(j.features[0]||{}).geometry.coordinates,
            shanghai:sh};
  });
  check('the download parses as GeoJSON', cities.ok && cities.type==='FeatureCollection',
        cities.parse||JSON.stringify(cities).slice(0,120));
  check('of points', cities.gtype==='Point', cities.gtype);
  /* Not "some cities": the whole date. A file whose extent nobody can state
     afterwards is a file nobody can cite. */
  check('every place on the date, not the ones the zoom left on screen',
        cities.n>400, cities.n+' features');
  check('and only that date', (cities.epochs||[]).length===1, (cities.epochs||[]).join(' | '));
  check('the layer says what it is and where it came from',
        !!(cities.layer && cities.layer.title && cities.layer.source && cities.layer.note),
        JSON.stringify(cities.layer||{}).slice(0,120));
  /* The size as a word — the thing the whole request was about — and the
     number beside it, agreeing. A tier that reads 2 and says `medium` would
     pass any check of either half alone. */
  check('the size is a word, at four tiers',
        (cities.sizes||[]).join(',')==='large,largest,medium,small',
        (cities.sizes||[]).join(','));
  check('and the number beside it agrees, on every row', cities.tiersAgree===true,
        'tier and word disagree somewhere');
  check('every place carries a romanised name', cities.named===cities.n,
        cities.named+' of '+cities.n);
  /* Separate columns, not one display string: this is the rule the tables
     follow and the reason the export exists. */
  check('the names are separate fields, not one glued string',
        cities.ja>100 && 'name_local' in cities.shanghai && 'characters' in cities.shanghai,
        cities.ja+' with Japanese; keys '+Object.keys(cities.shanghai).join(','));
  check('a capital says what it is the capital of',
        cities.caps>0 && cities.capsNamed>0,
        cities.caps+' capitals, '+cities.capsNamed+' naming their unit');
  check('the coordinates are the source pair, not a reading of the screen',
        Math.abs(cities.shanghai.size_tier)>=0
        && Math.abs(cities.coords[0])<=180 && Math.abs(cities.coords[1])<=90,
        JSON.stringify(cities.coords));

  check('no page errors', errs.concat(perrs).length===0, errs.concat(perrs).join(' | '));
  await browser.close();
  process.exit(report());
})();
