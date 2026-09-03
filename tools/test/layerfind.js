/* The Layers panel's search box.
 *
 *     node tools/test/layerfind.js       # with a server on 8123
 *
 * Fifty-odd switches live in that panel and the filter is how a reader finds
 * one. Three things here are worth more than the rest.
 *
 *   * **Clearing the search puts back exactly what was there and nothing
 *     more.** Half these rows carry a hidden state of their own — the station
 *     rows wait for their railway, the relief detail for Topography — so a
 *     filter written with the `hidden` attribute would switch those on when it
 *     let go. Checked by listing the visible rows before and after.
 *   * **A row is found by its section as well as its own words**, so
 *     "transport" brings up the railways; and *only* by the words a reader can
 *     see, so it does not bring up the population maps because a tooltip
 *     somewhere says the word.
 *   * **The chrome follows the rows.** A heading with nothing left under it is
 *     noise.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('layerfind test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const { ready } = require('./settle.js');
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const URL='http://localhost:8123/index.html';

const type=(p,v)=>p.evaluate(x=>{const e=document.getElementById('layers-find');
  e.value=x; e.dispatchEvent(new Event('input',{bubbles:true}));},v);
const rows=p=>p.evaluate(()=>{
  const vis=el=>!!(el.offsetParent||el.getClientRects().length);
  return [...document.querySelectorAll('#dlg-options .row')].filter(vis)
    .map(r=>(r.textContent||'').trim().replace(/\s+/g,' '));
});
const heads=p=>p.evaluate(()=>[...document.querySelectorAll('#dlg-options h3')]
  .filter(h=>!!(h.offsetParent||h.getClientRects().length))
  .map(h=>(h.textContent||'').trim()));

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:950});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle2'});
  await ready(page);

  console.log('\n— a box at the top of the panel —');
  await page.evaluate(()=>document.getElementById('btn-options').click());
  await sleep(500);
  const box=await page.evaluate(()=>{const e=document.getElementById('layers-find');
    if(!e) return null; const b=e.getBoundingClientRect();
    const d=document.getElementById('dlg-options').getBoundingClientRect();
    return {type:e.type, top:Math.round(b.top-d.top), w:Math.round(b.width), h:Math.round(b.height)};});
  check('the panel opens with a search box in it', !!box, JSON.stringify(box));
  check('  near the top of it', box && box.top < 90, JSON.stringify(box));
  check('  and a finger-sized one', box && box.h >= 30 && box.w > 120, JSON.stringify(box));

  const all=await rows(page);
  check('and every row is shown until something is typed', all.length > 25, all.length+' rows');

  console.log('\n— what a word finds —');
  await type(page,'graticule'); await sleep(200);
  const g=await rows(page);
  check('one word, one row', g.length===1 && /graticule/i.test(g[0]), JSON.stringify(g));

  await type(page,'rail'); await sleep(200);
  const r=await rows(page);
  check('"rail" finds the railways', r.length>=2 && r.every(x=>/rail/i.test(x)),
    JSON.stringify(r));
  /* The tooltip on the Japanese-names switch says "a railway timetable of the
     period". Matching titles as well as text brought it up here, which is the
     filter guessing rather than answering. */
  check('  and not the switch whose tooltip mentions one',
    !r.some(x=>/Japanese city and administrative/.test(x)), JSON.stringify(r));

  await type(page,'transport'); await sleep(200);
  const t=await rows(page);
  const th=await heads(page);
  check('a section name finds its rows', t.length>=4, JSON.stringify(t));
  check('  under that heading and no other', th.length===1 && th[0]==='Transport',
    JSON.stringify(th));
  /* The population group is a `div` with its own `h3` inside it, sitting
     between the Transport heading and the next one. Filed by the heading
     *before* the div, its rows answered to "transport". */
  check('  and the density maps are not among them',
    !t.some(x=>/Density/i.test(x)), JSON.stringify(t));

  console.log('\n— and what nothing finds —');
  await type(page,'zzzz'); await sleep(200);
  const none=await rows(page);
  check('no rows are left', none.length===0, JSON.stringify(none));
  check('  no headings either', (await heads(page)).length===0, '');
  check('  and it says so rather than showing an empty panel',
    await page.evaluate(()=>!document.getElementById('layers-none').hidden), '');

  console.log('\n— and clearing it puts the panel back —');
  await type(page,''); await sleep(250);
  const back=await rows(page);
  check('exactly the rows that were there before',
    JSON.stringify(back)===JSON.stringify(all),
    all.length+' → '+back.length);
  check('  and nothing that hides itself was switched on',
    await page.evaluate(()=>{const e=document.getElementById('relief-seg');
      return e.hidden && !(e.offsetParent||e.getClientRects().length);}), '');
  check('  and the "nothing matches" line is gone',
    await page.evaluate(()=>document.getElementById('layers-none').hidden), '');

  /* A reader who has filtered to nothing presses Escape to get the panel back,
     not to lose it. */
  await type(page,'zzzz'); await sleep(200);
  await page.focus('#layers-find');
  await page.keyboard.press('Escape');
  await sleep(250);
  const afterEsc=await page.evaluate(()=>({open:document.getElementById('dlg-options').open,
    v:document.getElementById('layers-find').value}));
  check('Escape clears the box before it closes the panel',
    afterEsc.open===true && afterEsc.v==='', JSON.stringify(afterEsc));

  /* And a search left over from last time is a panel with most of itself
     missing and no sign of why. */
  await type(page,'graticule'); await sleep(200);
  await page.evaluate(()=>document.getElementById('dlg-options').close());
  await sleep(200);
  await page.evaluate(()=>document.getElementById('btn-options').click());
  await sleep(300);
  check('and it opens clean the next time',
    (await rows(page)).length===all.length,
    await page.evaluate(()=>document.getElementById('layers-find').value));

  check('no page errors', errs.length===0, errs.join(' | '));
  console.log('\n  '+pass+' passed, '+fail+' failed\n');
  await browser.close();
  process.exit(fail?1:0);
})();
