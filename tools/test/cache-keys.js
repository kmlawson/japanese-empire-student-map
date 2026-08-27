/* Every file the site fetches must carry a key derived from its contents.
 *
 *     node tools/test/cache-keys.js       # needs a server on 8123
 *
 * See docs/tasks.md. The key is a content hash rather than the version number
 * because the version moves once per push, so keying on it meant a file edited
 * without a bump kept its old URL — and its old place in a week-long cache.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('cache-key test: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})(); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});
const p=await b.newPage(); await p.setViewport({width:1300,height:900});
const urls=[]; p.on('request',r=>{const u=r.url(); if(/\.(js|css|svg)(\?|$)/.test(u)) urls.push(u.split('/').pop());});
const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('requestfailed',r=>errs.push('failed: '+r.url().split('/').pop()));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3500);
console.log('  first load :', urls.join('  '));
// the key is a hash of the file's own contents, not the version number
const KEY=/\?v=[0-9a-f]{10}$/;
check('every first-load file carries a content key',
  urls.filter(u=>/\.(js|css|svg)/.test(u)).every(u=>KEY.test(u)), urls.join(' '));
const keys=urls.filter(u=>KEY.test(u)).map(u=>u.split('?v=')[1]);
check('and the keys differ between files', new Set(keys).size===keys.length, keys.join(' '));
// the deferred ones too
urls.length=0;
await p.evaluate(()=>document.querySelector('[data-cat="territory"]').click()); await sleep(3200);
await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
console.log('  on demand  :', urls.join('  '));
check('the admin sheet carries one', urls.some(u=>/^japan-empire-map-admin\.svg\?v=[0-9a-f]{10}$/.test(u)), urls.join(' '));
check('annotate.js carries one', urls.some(u=>/^annotate\.js\?v=[0-9a-f]{10}$/.test(u)), urls.join(' '));
// and a deep zoom for the fine coastlines
urls.length=0;
await p.goto('http://localhost:8123/index.html?bbox=126.5,25.8,128.6,26.9',{waitUntil:'networkidle0'}); await sleep(4500);
check('the fine coastlines carry one', urls.some(u=>/^japan-empire-map-fine\.svg\?v=[0-9a-f]{10}$/.test(u)), urls.join(' '));
check('the map still works', await p.evaluate(()=>document.querySelectorAll('#land .atom').length)===86);
check('no errors and nothing failed to load', errs.length===0, errs[0]);
console.log('  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
