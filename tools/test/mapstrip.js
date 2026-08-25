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
check('switched off it takes the neutral', (await cvar(p,'#a-manchukuo')).indexOf('inactive')>=0,
  await cvar(p,'#a-manchukuo'));
check('and the land is still there to point at',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#a-manchukuo')).display)!=='none');
await tick(p,'#opt-manchukuo',true);
check('switched on again it has its colour back', (await cvar(p,'#a-manchukuo'))===before,
  before+' → '+(await cvar(p,'#a-manchukuo')));
await tick(p,'#opt-mengjiang',false);
check('Mengjiang goes neutral too', (await cvar(p,'#a-mengjiang')).indexOf('inactive')>=0);
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
check('while India and the Indies go',
  !few.some(id=>/india|dei|australia|burma|siam/.test(id)), few.join(','));
check('the perimeter goes with them, being a line round empty sea',
  await p.evaluate(()=>getComputedStyle(document.querySelector('#extent-1942')).display)==='none');
await tick(p,'#opt-world',true);
const back=await drawn();
check('and everything comes back', back.length===all.length, all.length+' → '+back.length);

console.log('\n— a link carries them —');
const code=await p.evaluate(()=>{
  const r=document.querySelector('#occ-none'); r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));
  ['#opt-manchukuo','#opt-mengjiang'].forEach(s=>{const c=document.querySelector(s);
    c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));});
  const m=document.querySelector('#opt-mono'); m.checked=true; m.dispatchEvent(new Event('change',{bubbles:true}));
  return location.hash;});
await sleep(1200);
const hash=await p.evaluate(()=>location.hash);
const p2=await b.newPage(); await p2.setViewport({width:1500,height:950});
await p2.evaluateOnNewDocument(SHIM);
await p2.goto('http://localhost:8123/index.html'+hash,{waitUntil:'networkidle0'}); await sleep(3600);
await p2.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(500);
const got=await p2.evaluate(()=>({occ:document.querySelector('#occ-none').checked,
  man:document.querySelector('#opt-manchukuo').checked,
  men:document.querySelector('#opt-mengjiang').checked,
  mono:document.querySelector('#opt-mono').checked}));
check('a shared link brings all four across',
  got.occ && !got.man && !got.men && got.mono, hash+' → '+JSON.stringify(got));
check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
