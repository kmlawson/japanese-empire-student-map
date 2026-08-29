/* Adjust Colours: the editor, the file, the link, and what a link may carry.
 *
 *     node tools/test/colours.js         # with a server on 8123
 *
 * The reader can move any colour the map draws with, the sea included. What
 * they choose travels in the address, so sending the link sends the colours —
 * and that is the whole reason the sanitising below is not optional. A colour
 * out of a URL or out of a file goes into `style.setProperty`, and a string
 * that is not a colour is a string that is something else. Only keys the
 * palette knows and values that are exactly six hex digits behind a hash get
 * through; everything else is dropped without comment.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('colours test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const URL0='http://localhost:8123/index.html';
const sea=p=>p.evaluate(()=>getComputedStyle(document.getElementById('ocean')).fill);

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const errs=[];
const p=await b.newPage();
await p.setViewport({width:1300,height:950});
p.on('pageerror',e=>errs.push(String(e)));
await p.goto(URL0,{waitUntil:'networkidle0'});
await sleep(2800);

console.log('\n— the button, and what it opens —');
{
  check('there is an Adjust Colours button',
    await p.evaluate(()=>!!document.getElementById('opt-colours-open')));
  check('and it sits beside the single-colour switch',
    await p.evaluate(()=>{
      const btn=document.getElementById('opt-colours-open');
      return !!(btn.closest('.pair') && btn.closest('.pair').querySelector('#opt-mono'));}));
  check('the editor starts shut',
    (await p.evaluate(()=>document.getElementById('colour-editor').hidden))===true);
  /* Nothing is built until it is asked for: thirty-odd rows with a picker each
     is not something to hand a reader who never opens it. */
  check('and nothing is built until it is',
    (await p.evaluate(()=>document.querySelectorAll('#colour-rows input').length))===0);
  await p.evaluate(()=>document.getElementById('opt-colours-open').click());
  await sleep(500);
  const st=await p.evaluate(()=>({
    open:!document.getElementById('colour-editor').hidden,
    rows:document.querySelectorAll('#colour-rows input[type=color]').length,
    ocean:!!document.getElementById('colour-ocean'),
    cats:(JMAP.SITE_CATEGORIES||[]).length}));
  check('it opens', st.open);
  check('with a row for every colour the map carries', st.rows>20, st.rows+' rows');
  check('and the sea among them, which is not a category', st.ocean);
}

console.log('\n— moving one changes the map —');
{
  const before=await sea(p);
  await p.evaluate(()=>{const o=document.getElementById('colour-ocean');
    o.value='#204060'; o.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(1200);
  check('the sea takes the colour it was given',
    (await sea(p))==='rgb(32, 64, 96)', before+' then '+(await sea(p)));
  await p.evaluate(()=>{const c=document.getElementById('colour-metropole');
    c.value='#00aa55'; c.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(1500);
  check('a country takes its own',
    (await p.evaluate(()=>{const el=document.querySelector('#a-japan');
      return el?getComputedStyle(el).getPropertyValue('--c').trim():'';}))==='#00aa55');
  check('and the legend follows it, not a stale copy',
    (await p.evaluate(()=>{const sw=document.querySelector('#legend .sw');
      return sw?getComputedStyle(sw).backgroundColor:'';}))==='rgb(0, 170, 85)');
}

console.log('\n— and travels in the address —');
let shared='';
{
  await sleep(900);
  shared=await p.url();
  const m=/[?&]colours=([^&]*)/.exec(shared);
  check('the address carries a colours parameter', !!m, shared.slice(-70));
  /* Only what was moved. An untouched map carries nothing, which is what keeps
     a shared link short and honest about what was actually chosen. */
  check('and only the two that were moved',
    !!m && decodeURIComponent(m[1]).split('.').length===2, m && m[1]);
  const q=await b.newPage();
  await q.setViewport({width:1300,height:950});
  q.on('pageerror',e=>errs.push(String(e)));
  await q.goto(shared,{waitUntil:'networkidle0'});
  await sleep(3000);
  check('following the link paints the same sea',
    (await sea(q))==='rgb(32, 64, 96)', await sea(q));
  await q.close();
}

console.log('\n— what a link is not allowed to carry —');
{
  const nasty=['ocean-zzzzzz','evil-000000','ocean-red','city-1f3d5c99',
               '__proto__-ffffff','constructor-ffffff','ocean-url(x)',
               'metropole-00aa55'].join('.');
  const q=await b.newPage();
  await q.setViewport({width:1200,height:900});
  q.on('pageerror',e=>errs.push(String(e)));
  await q.goto(URL0+'?colours='+encodeURIComponent(nasty),{waitUntil:'networkidle0'});
  await sleep(2800);
  check('a value that is not six hex digits is dropped',
    (await sea(q))==='rgb(202, 223, 235)', await sea(q));
  check('and nothing was written into the document either',
    (await q.evaluate(()=>document.documentElement.style.getPropertyValue('--ocean')))==='');
  check('a key the palette does not know is dropped',
    (await q.evaluate(()=>!!document.getElementById('a-evil')))===false);
  check('__proto__ does not reach the prototype',
    (await q.evaluate(()=>({}).ffffff===undefined && Object.prototype.ffffff===undefined)));
  check('the one good colour in it survives',
    /colours=metropole-00aa55/.test(await q.url()), (await q.url()).slice(-60));
  /* A colour set is a few hundred bytes; a link repeating one four hundred
     times is not one, and the cap is the palette's own size. */
  await q.goto(URL0+'?colours='+Array(400).fill('ocean-204060').join('.'),
               {waitUntil:'networkidle0'});
  await sleep(2500);
  const u=await q.url();
  check('a four-hundred-entry link collapses to one', (u.match(/ocean-204060/g)||[]).length===1,
    'length '+u.length);
  await q.close();
}

console.log('\n— Reset all —');
{
  await p.evaluate(()=>document.getElementById('colour-reset').click());
  await sleep(1500);
  check('the sea comes back', (await sea(p))==='rgb(202, 223, 235)', await sea(p));
  await sleep(900);
  check('and the address stops carrying colours',
    !/[?&]colours=/.test(await p.url()), (await p.url()).slice(-60));
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
