/* The corner controls: what a layer is, and how much screen the map gets.
 *
 *     node tools/test/layerinfo.js       # with a server on 8123
 *
 * Three things live here.
 *
 *   * **The "i" and its stack.** A card on this map says what a *thing* is;
 *     nothing said what a whole *layer* is — how complete it is, which sources
 *     it mixes, what it cannot be used for. The air routes forced it: the 1942
 *     sheet draws a 1938 Japanese timetable beside a 1935 Dutch route map, and
 *     twenty-nine of the fifty-four services have no times at all. The prose is
 *     `texts/layer-info.md`; the button appears when a layer that has some is
 *     switched on and goes when it is switched off.
 *   * **The flash.** Two seconds after the layer goes on, once. Straight away
 *     it is lost in whatever the layer just drew.
 *   * **The aeroplane on the air button is the one the sheet flies** — a Fokker
 *     F.VII on 1930, a Nakajima Ki-34 on 1942 — and it is checked against
 *     `air-play.js` character for character, because two copies of a drawing
 *     drift and a guard is cheaper than noticing.
 */
const puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const { ready } = require('./settle.js');
const fs=require('fs');
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const shownIcon=p=>p.evaluate(()=>{
  const b=document.getElementById('btn-air');
  const vis=g=>getComputedStyle(g).display!=='none';
  return {epoch:b.getAttribute('data-epoch'),
    e1930:vis(b.querySelector('.air-icon-e1930')),
    e1942:vis(b.querySelector('.air-icon-e1942'))};
});
let pass=0,fail=0;
const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const st=p=>p.evaluate(()=>({
  info:{hidden:document.getElementById('btn-layer-info').hidden,
        flash:document.getElementById('btn-layer-info').classList.contains('flash')},
  fs:{hidden:document.getElementById('btn-fullscreen').hidden},
  dlg:document.getElementById('dlg-layer-info').open,
  items:[...document.querySelectorAll('#layer-info-body .layer-info-item')]
    .map(x=>x.getAttribute('data-layer-info')),
  title:(document.querySelector('#layer-info-body h3')||{}).textContent,
  paras:(document.querySelector('#layer-info-body .layer-info-note')||{}).textContent||'',
  strongs:[...document.querySelectorAll('#layer-info-body strong')].map(x=>x.textContent),
  src:(document.querySelector('#layer-info-body .layer-info-src a')||{}).href||'',
  wrap:(()=>{const n=document.querySelector('#layer-info-body .layer-info-note');
    return n?getComputedStyle(n).whiteSpace:'';})(),
}));
(async()=>{
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const p=await b.newPage(); await p.setViewport({width:1400,height:900});
  await p.evaluateOnNewDocument(SHIM);
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle2'});
  await ready(p);

  /* This used to read "with nothing on, there is nothing to read", and the
     button was hidden until a layer was switched on. The map itself now
     explains itself — which date it is set in, and that the layers over it are
     built from sources of their own and are not all of that year — so there is
     always exactly one thing to read, and never none. */
  console.log('\n- with nothing on, the map still explains itself -');
  let s=await st(p);
  check('the i button is offered', s.info.hidden===false, JSON.stringify(s.info));
  /* `items` is what was last *rendered*, and the body is only built when the
     dialog opens — so it has to be opened before it can be asked what is in
     it. Reading it cold gives the previous answer, or none at all. */
  await p.evaluate(()=>document.getElementById('btn-layer-info').click());
  await sleep(500);
  s=await st(p);
  check('and it holds the map’s own account and nothing else',
    JSON.stringify(s.items)==='["map1930"]', JSON.stringify(s.items));
  await p.keyboard.press('Escape'); await sleep(400);
  check('the full-screen button is offered', s.fs.hidden===false, JSON.stringify(s.fs));

  console.log('\n- switch the air routes on -');
  await p.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(700);
  s=await st(p);
  check('the i appears', s.info.hidden===false);
  check('and has not flashed yet', s.info.flash===false, 'flash='+s.info.flash);
  await sleep(2200);
  s=await st(p);
  check('two seconds later it flashes', s.info.flash===true, 'flash='+s.info.flash);

  console.log('\n- and pressing it says what the layer is -');
  await p.evaluate(()=>document.getElementById('btn-layer-info').click());
  await sleep(500);
  s=await st(p);
  check('the lightbox opens', s.dlg===true);
  // the layer goes on top of the map's own row, newest first
  check('with the air layer in it', JSON.stringify(s.items)==='["air","map1930"]',
    JSON.stringify(s.items));
  check('headed with its title', s.title==='Airline Routes', s.title);
  check('the emphasis is rendered', s.strongs.length>=2, JSON.stringify(s.strongs));
  check('no literal ** in the prose', !/\*\*/.test(s.paras), s.paras.slice(0,60));
  check('the two paragraphs are kept apart', /\n\n/.test(s.paras) && s.wrap==='pre-line',
    JSON.stringify(s.paras.slice(0,90))+' wrap='+s.wrap);
  check('and the sources are linked', /timetableimages/.test(s.src), s.src);
  await p.keyboard.press('Escape'); await sleep(400);

  console.log('\n- switch it off again -');
  await p.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(900);
  await p.evaluate(()=>document.getElementById('btn-layer-info').click());
  await sleep(500);
  s=await st(p);
  check('the layer’s account goes away with it',
    s.items.indexOf('air')<0, JSON.stringify(s.items));
  check('and the map’s own is what is left',
    JSON.stringify(s.items)==='["map1930"]', JSON.stringify(s.items));
  /* This used to be "and the lightbox with it": the panel closed itself when
     the last layer went off, because there was then nothing to read. There is
     always something now — the map's own account of which date it is — so the
     button stays and the box has a page in it. The behaviour it was guarding
     still exists one step further out: `syncLayerInfo` closes the box when the
     stack empties, and the stack can no longer empty. */
  check('and the box still has the map’s page in it', s.dlg===true,
    'the box closed with the map’s own account still to read');
  await p.keyboard.press('Escape'); await sleep(400);

  console.log('\n- the button wears the aeroplane the sheet flies -');
  let ic=await shownIcon(p);
  check('1930 shows the Fokker', ic.epoch==='e1930'&&ic.e1930&&!ic.e1942, JSON.stringify(ic));
  await p.evaluate(()=>{const x=[...document.querySelectorAll('#epoch-seg button')]
    .find(y=>/1942/.test(y.textContent)); if(x)x.click();}); await sleep(2500);
  ic=await shownIcon(p);
  check('1942 shows the Nakajima', ic.epoch==='e1942'&&!ic.e1930&&ic.e1942, JSON.stringify(ic));
  await p.evaluate(()=>{const x=[...document.querySelectorAll('#epoch-seg button')]
    .find(y=>/1930/.test(y.textContent)); if(x)x.click();}); await sleep(2500);
  ic=await shownIcon(p);
  check('and back again', ic.epoch==='e1930'&&ic.e1930&&!ic.e1942, JSON.stringify(ic));

  console.log('\n- and it is the same drawing the animation flies -');
  const html=fs.readFileSync('index.html','utf8');
  const play=fs.readFileSync('air-play.js','utf8');
  const grab=(name)=>{const i=play.indexOf('var '+name+' = [');
    const j=play.indexOf('\n  ];',i); return play.slice(i,j);};
  const dsOf=blk=>[...blk.matchAll(/\['path', '([^']+)'\]/g)].map(m=>m[1]);
  const btn=html.slice(html.indexOf('id="btn-air"'), html.indexOf('</button>', html.indexOf('id="btn-air"')));
  const groupOf=cls=>{const i=btn.indexOf('air-icon-'+cls);
    const j=btn.indexOf('</g>',i); return btn.slice(i,j);};
  const btnDs=cls=>[...groupOf(cls).matchAll(/<path d="([^"]+)"\/>/g)].map(m=>m[1]);
  for (const [cls,name] of [['e1930','FOKKER'],['e1942','NAKAJIMA']]) {
    const a=dsOf(grab(name)), c=btnDs(cls);
    check('the '+cls+' button paths are air-play.js’s, character for character',
      a.length>0 && a.length===c.length && a.every((d,i)=>d===c[i]),
      'air-play '+a.length+' paths, button '+c.length);
  }
  console.log('\n- full screen is a resize the map already answers -');
  const before=await p.evaluate(()=>({w:document.getElementById('map-container').clientWidth,
    atoms:document.querySelectorAll('#land .atom').length}));
  check('the map is drawn before', before.atoms>0, JSON.stringify(before));
  /* ------------------------------------------- the map's own "i" panel --
   *
   * Two rows describe the map rather than a layer, and they are gated on the
   * date instead of on a switch. The date is not a boolean in `state`, so it
   * cannot be a `flag`; the column is `on_epoch`, named that because the
   * emitter reserves `epoch` for "which file this row came from" and drops it
   * before the browser ever sees it — which is exactly how the first attempt
   * failed, silently and with the panel simply never appearing.
   *
   * What matters to a reader: the panel is there on both dates, it says the
   * right one, and turning to the other date *replaces* it rather than leaving
   * two accounts of which map this is. */
  console.log('\n- the map itself has an "i", and it follows the date -');
  const infoNow=async()=>{
    await p.evaluate(()=>{const b=document.getElementById('btn-layer-info');
      if(b&&!b.hidden)b.click();});
    await sleep(600);
    return p.evaluate(()=>{
      const h=document.getElementById('layer-info-body');
      const secs=[...h.querySelectorAll('.layer-info-item')]
        .map(s=>s.getAttribute('data-layer-info'));
      const d=document.getElementById('dlg-layer-info'); if(d&&d.open)d.close();
      return {hidden:document.getElementById('btn-layer-info').hidden, secs};});
  };
  const on1930=await infoNow();
  check('the 1930 map explains itself', on1930.secs.indexOf('map1930')>=0,
    JSON.stringify(on1930));
  await p.evaluate(()=>{const x=[...document.querySelectorAll('#epoch-seg button')]
    .find(y=>/1942/.test(y.textContent)); if(x)x.click();});
  await sleep(3000);
  const on1942=await infoNow();
  check('and so does the 1942 map', on1942.secs.indexOf('map1942')>=0,
    JSON.stringify(on1942));
  check('and the 1930 account is taken away, not left beside it',
    on1942.secs.indexOf('map1930')<0, JSON.stringify(on1942.secs));
  /* A layer's own note and the map's note are different questions and both are
     worth having; the map's must not push the layer's off. */
  await p.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(2000);
  const withAir=await infoNow();
  check('a layer keeps its own note beside the map’s',
    withAir.secs.indexOf('air')>=0 && withAir.secs.indexOf('map1942')>=0,
    JSON.stringify(withAir.secs));

  check('no page errors', errs.length===0, errs.slice(0,3).join(' | '));
  console.log('\n  '+pass+' passed, '+fail+' failed');
  await b.close(); process.exit(fail?1:0);
})();
