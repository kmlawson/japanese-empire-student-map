/* Bookmarks, and what happens when an out-of-date version is asked for.
 *
 *     node tools/test/bookmarks.js        # needs a server on 8123
 *
 * The versioned asset URLs must not reach the address bar, and a page that
 * asks for an old one must be served rather than refused. See docs/tasks.md.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('bookmarks test: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})(); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(250);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});

console.log('\n— bookmarks —');
{ const ctx=await b.createBrowserContext(); const p=await ctx.newPage();
  await p.setViewport({width:1300,height:900});
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3300);
  // pan and switch a layer, as a reader would before bookmarking
  await p.mouse.move(700,500); await p.mouse.down();
  for(let i=0;i<12;i++){await p.mouse.move(700-i*9,500+i*3); await sleep(14);} await p.mouse.up();
  await p.evaluate(()=>document.querySelector('[data-cat="city"]').click());
  await sleep(1400);
  const url=await p.evaluate(()=>location.href);
  console.log('  what the address bar holds: ' + url.replace('http://localhost:8123',''));
  check('no ?v= leaks into the address bar', url.indexOf('v=')<0, url);
  check('the bookmark still carries the view', /bbox=/.test(url));
  check('and the layers', /layers=/.test(url));
  // follow the bookmark in a clean profile
  const ctx2=await b.createBrowserContext(); const q=await ctx2.newPage();
  await q.setViewport({width:1300,height:900});
  const errs=[]; q.on('pageerror',e=>errs.push(String(e)));
  await q.goto(url,{waitUntil:'networkidle0'}); await sleep(3500);
  const vA=(await p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox'))).split(' ').map(Number);
  const vB=(await q.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox'))).split(' ').map(Number);
  const drift=Math.max(...vA.map((n,i)=>Math.abs(n-vB[i])));
  console.log('  bookmarked: '+vA.join(' '));
  console.log('  reopened  : '+vB.join(' '));
  console.log('  worst difference: '+drift.toFixed(3)+' map units'
    + '  ('+(drift/vA[2]*100).toFixed(3)+'% of the view width)');
  // the link records a lon/lat box rounded to two decimals, so a hundredth of
  // a degree of drift is arithmetic, not a fault
  check('the bookmark reopens on the same view', drift < 1.0, drift+' units');
  check('with the same layers', await q.evaluate(()=>document.querySelector('[data-cat="city"]').getAttribute('aria-pressed'))==='true');
  check('and no errors', errs.length===0, errs[0]);
  await p.close(); await q.close(); }

console.log('\n— an out-of-date version is asked for —');
{ // the page is stale: it asks for map.js?v=0.01, and the server hands over the current one
  const ctx=await b.createBrowserContext(); const p=await ctx.newPage();
  await p.setViewport({width:1300,height:900});
  const fetched=[]; p.on('response',r=>{const u=r.url(); if(/map\.js/.test(u)) fetched.push(u.split('/').pop()+' -> '+r.status());});
  await p.setRequestInterception(true);
  p.on('request',async r=>{
    if(r.url().endsWith('/index.html')){
      const res=await fetch(r.url()); let t=await res.text();
      t=t.replace(/\?v=[0-9.]+/g,'?v=0.01').replace(/<span id="jem-version">[^<]*<\/span>/,'<span id="jem-version">0.01</span>');
      r.respond({status:200,contentType:'text/html',body:t});
    } else r.continue();});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3800);
  console.log('  ' + fetched.join('  '));
  check('an outdated version is served, not refused', fetched.every(f=>/200/.test(f)), fetched.join(' '));
  check('the map still draws', await p.evaluate(()=>document.querySelectorAll('#land .atom').length)===84);
  const note=await p.evaluate(()=>{const s=document.querySelector('.version-stale'); return s?s.textContent.trim():null;});
  const shown=await p.evaluate(()=>document.querySelector('#jem-version').textContent);
  console.log('  About reports: ' + shown + ' ' + (note||''));
  check('About reports the code that is running', shown!=='0.01', shown);
  check('and says the two disagree without guessing which is stale',
    note && /one of the two is coming from your browser/.test(note), String(note));
  check('no errors', errs.length===0, errs[0]);
  await p.close(); }

console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
