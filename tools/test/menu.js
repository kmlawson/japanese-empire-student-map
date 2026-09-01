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
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('menu test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const URL='http://localhost:8123/index.html';

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
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:900});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle0'});
  await sleep(1500);
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
  check('the short source is a line, not a paragraph',
        gifu.src.filter(t=>/^Shape: /.test(t)).every(t=>t.length<120),
        gifu.src.join(' | '));
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
            props:f&&f.properties, closed: ring && ring.length>3
              && ring[0][0]===ring[ring.length-1][0]
              && ring[0][1]===ring[ring.length-1][1],
            box:[+x0.toFixed(2),+y0.toFixed(2),+x1.toFixed(2),+y1.toFixed(2)]};
  });
  check('a file came out of it', geo.ok, JSON.stringify(geo).slice(0,160));
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

  console.log('\n— and a finger opens the same menu —');
  const phone=await browser.newPage();
  await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const perrs=[]; phone.on('pageerror',e=>perrs.push(String(e)));
  await phone.goto(URL,{waitUntil:'networkidle0'});
  await sleep(1600);
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

  check('no page errors', errs.concat(perrs).length===0, errs.concat(perrs).join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
