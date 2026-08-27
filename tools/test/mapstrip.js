/* The three switches that strip the 1942 map back: hiding the occupation
   reading altogether, taking Manchukuo and Mengjiang off it, and painting
   every state and province one grey.

       node tools/test/mapstrip.js      # with python3 -m http.server 8123 up
*/
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('mapstrip test: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const tick=async(p,sel,on)=>{await p.evaluate((s,v)=>{const e=document.querySelector(s);
  e.checked=v; e.dispatchEvent(new Event('change',{bubbles:true}));},sel,on); await sleep(1500);};
const cvar=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);
  return e?e.style.getPropertyValue('--c'):'absent';},sel);
const fillOf=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s); if(!e) return 'absent';
  return getComputedStyle(e.querySelector('path')||e).fill;},sel);

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3500);
await p.evaluate(()=>{const t=[...document.querySelectorAll('#epoch-seg button')].find(x=>/1942/.test(x.textContent)); t.click();}); await sleep(2200);
await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(500);

console.log('\n— the controls are there —');
for (const s of ['#occ-none','#opt-manchukuo','#opt-mengjiang','#opt-mono']) {
  check('  '+s, await p.evaluate(x=>!!document.querySelector(x),s));
}
check('Manchukuo and Mengjiang start on',
  await p.evaluate(()=>document.querySelector('#opt-manchukuo').checked
                    && document.querySelector('#opt-mengjiang').checked));
check('and the single colour starts off',
  await p.evaluate(()=>!document.querySelector('#opt-mono').checked));

console.log('\n— hiding the occupation reading —');
const zoneOn=await p.evaluate(()=>{const z=document.querySelector('#a-occupiedzone');
  return z?getComputedStyle(z).display!=='none':null;});
check('the traced zone is drawn to begin with', zoneOn===true, String(zoneOn));
await p.evaluate(()=>{const r=document.querySelector('#occ-none');
  r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1800);
check('choosing "hide" takes it off',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#a-occupiedzone')).display)==='none');
check('and the perimeter is untouched by it',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#extent-1942')).display)!=='none');
await p.reload({waitUntil:'networkidle0'}); await sleep(3500);
check('the choice survives a reload',
  await p.evaluate(()=>document.querySelector('#occ-none').checked));
await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(500);

console.log('\n— the two client states —');
const before=await cvar(p,'#a-manchukuo');
check('Manchukuo carries its own colour', /#|rgb/.test(before), before);
await tick(p,'#opt-manchukuo',false);
/* It takes the Republic's own yellow, not a neutral grey. The ground did not
   become unclaimed when the reader switched the client state off — on this
   map's terms it became the rest of China, and a grey slab in the north-east
   reads as a hole rather than as a country. */
const china=await p.evaluate(()=>{const e=document.querySelector('#a-freechina')
  || document.querySelector('#a-china');
  return e ? e.style.getPropertyValue('--c') : '';});
check('switched off it is drawn as the rest of China',
  (await cvar(p,'#a-manchukuo'))===china && /#|rgb/.test(china),
  await cvar(p,'#a-manchukuo') + ' against China\'s ' + china);
check('and the land is still there to point at',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#a-manchukuo')).display)!=='none');
await tick(p,'#opt-manchukuo',true);
check('switched on again it has its colour back', (await cvar(p,'#a-manchukuo'))===before,
  before+' → '+(await cvar(p,'#a-manchukuo')));
await tick(p,'#opt-mengjiang',false);
check('Mengjiang is drawn as the rest of China too',
  (await cvar(p,'#a-mengjiang'))===china, await cvar(p,'#a-mengjiang'));
check('and its dotted claim goes with it',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#mengjiang-claim')).display)==='none');
await tick(p,'#opt-mengjiang',true);
check('and comes back with it',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#mengjiang-claim')).display)!=='none');

console.log('\n— one colour —');
const japanBefore=await fillOf(p,'#a-japan');
await tick(p,'#opt-mono',true);
const mono=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--mono-land').trim());
const japanMono=await fillOf(p,'#a-japan');
check('the class goes on the map',
  await p.evaluate(()=>document.querySelector('#jmap').classList.contains('mono')));
check('Japan is painted the one grey', japanMono!==japanBefore, japanBefore+' → '+japanMono);
const spread=await p.evaluate(()=>{
  const seen={};
  [...document.querySelectorAll('#jmap .atom:not(.atom-hit), #backings path, #seams path')]
    .forEach(e=>{const f=getComputedStyle(e).fill; seen[f]=(seen[f]||0)+1;});
  return Object.entries(seen).sort((a,b)=>b[1]-a[1]);});
console.log('    fills in use: '+spread.map(e=>e[0]+' ×'+e[1]).join(', '));
check('and so is everything else — one fill, or one and "none"',
  spread.filter(e=>e[0]!=='none' && e[0]!=='rgba(0, 0, 0, 0)').length===1, JSON.stringify(spread));
check('the finger targets stay invisible',
  await p.evaluate(()=>{const c=document.querySelector('.atom-hit');
    const cs=getComputedStyle(c); return cs.fill==='rgba(0, 0, 0, 0)' && cs.stroke==='none';}));
check('the hatchings are off',
  await p.evaluate(()=>[...document.querySelectorAll('.hatch-fill')]
    .every(e=>getComputedStyle(e).display==='none')));
await tick(p,'#opt-mono',false);
check('and it all comes back', (await fillOf(p,'#a-japan'))===japanBefore,
  japanBefore+' → '+(await fillOf(p,'#a-japan')));

console.log('\n— hiding the occupation drops the base areas with it —');
await p.evaluate(()=>{const c=document.querySelector('#opt-ccp');
  c.checked=true; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1200);
await p.evaluate(()=>{const r=document.querySelector('#occ-traced');
  r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1500);
check('the base areas start on', await p.evaluate(()=>document.querySelector('#opt-ccp').checked));
await p.evaluate(()=>{const r=document.querySelector('#occ-none');
  r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1500);
check('hiding the occupation switches them off',
  await p.evaluate(()=>!document.querySelector('#opt-ccp').checked));
await p.evaluate(()=>{const c=document.querySelector('#opt-ccp');
  c.checked=true; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1200);
check('and the reader can put them back',
  await p.evaluate(()=>document.querySelector('#opt-ccp').checked));

/* And the same rule the other way. Max is the reading that says how far the
   occupier's writ was claimed to run and the base areas are where it did not,
   so choosing one without the other is half an argument — Hide takes them away
   and Max brings them back.

   The guard that matters is the third check: only on the way *to* Max. A
   reader who presses Max is asking for the maximum reading, and the base
   areas are half of it — every press restores them (changed 27-08). */
console.log('\n— and choosing Max brings them back —');
const setOcc = async id => { await p.evaluate(i => { const r = document.querySelector(i);
  r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, id);
  await sleep(1500); };
const ccpOn = () => p.evaluate(() => document.querySelector('#opt-ccp').checked);
/* The block above leaves the map on Hide with the base areas put back by
   hand, so Hide is pressed *from Max* here — pressing it while already on it
   is correctly a no-op, and the first draft of this check failed on that. */
await setOcc('#occ-traced');
await setOcc('#occ-none');
check('coming to Hide from Max switches them off', !(await ccpOn()));
await setOcc('#occ-traced');
check('and coming back to Max switches them on', await ccpOn());
await p.evaluate(()=>{const c=document.querySelector('#opt-ccp');
  c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1000);
await setOcc('#occ-traced');
/* This used to pin the opposite — a pressed button must not argue — and the
   map's author overruled it on 27-08: pressing Max always asks for the
   maximum reading, and the base areas are half of it. Every press restores
   them, already-on or not. */
check('Max pressed again brings the base areas back', await ccpOn());
await p.evaluate(()=>{const c=document.querySelector('#opt-ccp');
  c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1000);
await setOcc('#occ-nca');
check('the army reading does not switch them on by itself', !(await ccpOn()));
await setOcc('#occ-traced');
check('and coming to Max from it does', await ccpOn());

console.log('\n— only East Asia —');
check('the whole map is the default', await p.evaluate(()=>document.querySelector('#opt-world').checked));
const drawn=()=>p.evaluate(()=>{const out={};
  document.querySelectorAll('#land .atom[data-id]').forEach(e=>{
    if(getComputedStyle(e).display!=='none') out[e.getAttribute('data-id')]=1;});
  return Object.keys(out).sort();});
const all=await drawn();
await tick(p,'#opt-world',false);
const few=await drawn();
console.log('    kept: '+few.join(', '));
check('switching it off leaves far fewer', few.length < all.length/2, all.length+' → '+few.length);
check('and keeps China, Japan and the leased ground',
  ['japan','tibet','kwantung','hongkong','macau'].every(id=>few.indexOf(id)>=0), few.join(','));
/* China in all the pieces this map draws it in. Naming "china" alone left a
   hole across the whole north-west, because Xinjiang is a territory in its own
   right here — and so are Jehol, Chahar and Suiyuan on the 1930 map. */
check('China is whole — Xinjiang among the rest', few.indexOf('xinjiang')>=0, few.join(','));
check('and Japan is whole — the Kuriles and the Bonins with it',
  few.indexOf('chishima')>=0 && few.indexOf('ogasawara')>=0, few.join(','));
check('but the South Seas Mandate is not, being two thousand miles out',
  few.indexOf('nanyo')<0 && few.indexOf('mandate_jp')<0, few.join(','));
check('while India and the Indies go',
  !few.some(id=>/india|dei|australia|burma|siam/.test(id)), few.join(','));
check('the perimeter goes with them, being a line round empty sea',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#extent-1942')).display)==='none');
await tick(p,'#opt-world',true);
const back=await drawn();
check('and everything comes back', back.length===all.length, all.length+' → '+back.length);

/* Everything that is *not* the atom has to go with it, and each of these was
   found by looking at the render rather than by reasoning about the code. */
await tick(p,'#opt-world',false);
check('the Army report is not hidden with the rest — it is China',
  await (async()=>{
    await p.evaluate(()=>{const r=document.querySelector('#occ-nca');
      r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1800);
    return await p.evaluate(()=>['#a-nca_pacified','#a-nca_unpacified']
      .every(s=>{const e=document.querySelector(s);
        return e && getComputedStyle(e).display!=='none';}));})());
await p.evaluate(()=>{const r=document.querySelector('#occ-traced');
  r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1600);
check('no country outside the frame is still named',
  await p.evaluate(()=>[...document.querySelectorAll('#labels text')]
    .filter(t=>getComputedStyle(t).display!=='none')
    .every(t=>!/Indies|Philippine|Hawaii|Soviet|Kengtung|Australia|Burma/.test(t.textContent))));
check('and no shading is left over open sea',
  await p.evaluate(()=>{
    const svg=document.getElementById('jmap');
    const vb=svg.getAttribute('viewBox').split(' ').map(Number);
    return [...document.querySelectorAll('.hatch-fill')]
      .filter(e=>getComputedStyle(e).display!=='none').length <= 2;}));
check('the frame fits what is drawn rather than the whole hemisphere',
  await p.evaluate(()=>{
    const svg=document.getElementById('jmap');
    const vb=svg.getAttribute('viewBox').split(' ').map(Number);
    let x0=1e9,x1=-1e9;
    document.querySelectorAll('#land .atom[data-id]').forEach(e=>{
      if(getComputedStyle(e).display==='none') return;
      let bb; try{bb=e.getBBox();}catch(err){return;}
      if(!bb.width&&!bb.height) return;
      x0=Math.min(x0,bb.x); x1=Math.max(x1,bb.x+bb.width);});
    return (x1-x0) / vb[2] > 0.7;}));
check('and the key no longer lists colours that appear nowhere',
  await p.evaluate(()=>{const t=[...document.querySelectorAll('#legend .item')]
    .map(x=>x.textContent).join(' ');
    return !/British|Dutch|Soviet|Thai/.test(t);}),
  await p.evaluate(()=>[...document.querySelectorAll('#legend .item')].map(x=>x.textContent.trim()).join(' / ')));
await tick(p,'#opt-world',true);

console.log('\n— a link carries them —');
const code=await p.evaluate(()=>{
  const r=document.querySelector('#occ-none'); r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));
  ['#opt-manchukuo','#opt-mengjiang'].forEach(s=>{const c=document.querySelector(s);
    c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));});
  const m=document.querySelector('#opt-mono'); m.checked=true; m.dispatchEvent(new Event('change',{bubbles:true}));
  return location.search;});
await sleep(1200);
/* The SEARCH, not the hash: the map's address is ?bbox=…&layers=…, and this
   used to copy `location.hash` — the empty string — and still pass, because
   the second page restored the four settings from localStorage instead. The
   map keeps no stored state now, so the check finally tests what its name
   says: the link itself. */
const search=await p.evaluate(()=>location.search);
const p2=await b.newPage(); await p2.setViewport({width:1500,height:950});
await p2.evaluateOnNewDocument(SHIM);
await p2.goto('http://localhost:8123/index.html'+search,{waitUntil:'networkidle0'}); await sleep(3600);
await p2.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(500);
const got=await p2.evaluate(()=>({occ:document.querySelector('#occ-none').checked,
  man:document.querySelector('#opt-manchukuo').checked,
  men:document.querySelector('#opt-mengjiang').checked,
  mono:document.querySelector('#opt-mono').checked}));
check('a shared link brings all four across',
  got.occ && !got.man && !got.men && got.mono, search+' → '+JSON.stringify(got));
check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
