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
const { ready } = require('./settle.js');
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const URL0='http://localhost:8123/index.html';
const sea=p=>p.evaluate(()=>getComputedStyle(document.getElementById('ocean')).fill);

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const errs=[];
const p=await b.newPage();
await p.setViewport({width:1300,height:950});
/* **Say which scheme.** Without this the page inherits whatever the host
   reports, and the sea colours these checks compare against are the light
   scheme's: two of them began failing after this machine went dark for the
   night, having passed all day, and reported the dark ocean as a wrong
   answer. A test that does not say what it wants is not measuring. */
await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
p.on('pageerror',e=>errs.push(String(e)));
await p.goto(URL0,{waitUntil:'networkidle0'});
await ready(p);

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

  /* GROUPED BY DATE. Seven ids are in both epochs and appear once; the rest
     belong to one date, and two of those carry the same words — `chinese` on
     the 1930 map and `freechina` on the 1942 one are both "Republic of China".
     Side by side with no heading between them they read as the same row twice,
     which is what they were reported as. They are two colours for two maps. */
  const groups = await p.evaluate(() => {
    const out = []; let g = null;
    [...document.getElementById('colour-rows').children].forEach(n => {
      if (n.classList.contains('colour-group')) { g = n.textContent; out.push([g, []]); }
      else if (n.classList.contains('colour-name') && out.length) {
        out[out.length - 1][1].push(n.textContent);
      }
    });
    return out;
  });
  check('the rows are grouped', groups.length === 4,
    groups.map(g => g[0]).join(' | '));
  check('and the groups say which date they belong to',
    /1930/.test(groups.map(g => g[0]).join(' '))
    && /1942/.test(groups.map(g => g[0]).join(' ')),
    groups.map(g => g[0]).join(' | '));
  const china = groups.filter(g => g[1].indexOf('Republic of China') >= 0);
  check('the two Republics of China are in different groups, not adjacent',
    china.length === 2, china.map(g => g[0]).join(' and '));
  const flat = groups.reduce((a, g) => a.concat(g[1]), []);
  check('and no group repeats a name within itself',
    groups.every(g => new Set(g[1]).size === g[1].length));
  check('every row is in a group', flat.length === st.rows,
    flat.length + ' named, ' + st.rows + ' pickers');
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

console.log('\n— the railways are inked by the reader too —');
{
  /* WHICH of the two inks is used is not the reader's choice — the line has
     to read against the country it crosses, so it follows that country's
     luminance — but the two inks themselves are theirs. */
  await p.evaluate(()=>{const e=document.getElementById('opt-tw-rail');
    if(e && !e.checked){e.checked=true; e.dispatchEvent(new Event('change',{bubbles:true}));}});
  await sleep(1300);
  const ink = () => p.evaluate(()=>{
    const el=document.querySelector('#tw-rail path.rail[data-epoch="e1930"]');
    return el ? el.style.getPropertyValue('--rail-ink') : null;});
  check('the map picks the pale ink over dark Taiwan', (await ink())==='#fbf7ef',
    String(await ink()));
  check('there is a row for each of the two inks',
    await p.evaluate(()=>!!document.getElementById('colour-raildark')
                       && !!document.getElementById('colour-raillight')));
  await p.evaluate(()=>{const c=document.getElementById('colour-raildark');
    c.value='#00ffcc'; c.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(1500);
  check('and changing that one changes the line', (await ink())==='#00ffcc',
    String(await ink()));
  await p.evaluate(()=>{const c=document.getElementById('colour-raildark');
    c.value='#fbf7ef'; c.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(1200);
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
  /* Fixed-width chunks of eight — two letters of code and six hex digits —
     so two colours is sixteen characters and there is nothing to split on. */
  check('and only the two that were moved',
    !!m && decodeURIComponent(m[1]).length===16, m && m[1]);
  const q=await b.newPage();
  await q.setViewport({width:1300,height:950});
  await q.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
  q.on('pageerror',e=>errs.push(String(e)));
  await q.goto(shared,{waitUntil:'networkidle0'});
  await ready(q);
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
  await q.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
  q.on('pageerror',e=>errs.push(String(e)));
  await q.goto(URL0+'?colours='+encodeURIComponent(nasty),{waitUntil:'networkidle0'});
  await ready(q);
  check('a value that is not six hex digits is dropped',
    (await sea(q))==='rgb(202, 223, 235)', await sea(q));
  check('and nothing was written into the document either',
    (await q.evaluate(()=>document.documentElement.style.getPropertyValue('--ocean')))==='');
  check('a key the palette does not know is dropped',
    (await q.evaluate(()=>!!document.getElementById('a-evil')))===false);
  check('__proto__ does not reach the prototype',
    (await q.evaluate(()=>({}).ffffff===undefined && Object.prototype.ffffff===undefined)));
  /* The address is written in the short form even when the link that made
     it used the long one: two letters of code and six hex digits, no
     separators. `metropole` is `mp`. */
  check('the one good colour in it survives',
    /colours=mp00aa55/.test(await q.url()), (await q.url()).slice(-60));
  /* A colour set is a few hundred bytes; a link repeating one four hundred
     times is not one, and the cap is the palette's own size. */
  await q.goto(URL0+'?colours='+Array(400).fill('ocean-204060').join('.'),
               {waitUntil:'networkidle0'});
  await ready(q);
  const u=await q.url();
  check('a four-hundred-entry link collapses to one', (u.match(/se204060/g)||[]).length===1,
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
