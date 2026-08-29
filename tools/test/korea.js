/* Korea's thirteen provinces, and the finer set that arrives on a deep zoom.
 *
 *     node tools/test/korea.js           # with a server on 8123
 *
 * The country is drawn from the National Institute of Korean History's
 * historical districts at two resolutions. What this checks is the swap
 * between them, which is the part with moving pieces:
 *
 *   * nothing extra is fetched until the reader is close in and over Korea;
 *   * the coarse thirteen are what the administrative sheet brings, and they
 *     cost about what the Natural Earth outline they replaced cost;
 *   * zooming in swaps in the fine ones and zooming out puts the coarse ones
 *     back, and the file is fetched once however often that happens;
 *   * the provinces answer the pointer and are named.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('korea test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const WIDE='http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5';
/* The ria coast south-west of Mokpo. Chosen because it is where the two
   resolutions differ most: the coarse set draws blocks and the fine one draws
   the archipelago. */
const CLOSE='http://localhost:8123/index.html?where=126.05,34.55,126.75,35.05';

const shape=p=>p.evaluate(()=>{
  const el=document.querySelector('#a-korea');
  const ps=[...el.querySelectorAll('path')];
  return {paths:ps.length,
          vertices:ps.reduce((a,x)=>a+(x.getAttribute('d')||'').split('L').length-1,0),
          named:ps.filter(x=>x.getAttribute('data-prov')).length,
          provs:ps.map(x=>x.getAttribute('data-prov')).filter(Boolean).sort()};});

const adminOn=async p=>{
  await p.evaluate(()=>{
    const b=[...document.querySelectorAll('#layer-seg button')].find(x=>/Admin/.test(x.textContent));
    if(b)b.click();});
  await sleep(2600);
};

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  try{
    const p=await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({width:1100,height:820});
    const fetched=[];
    const errs=[];
    p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
    p.on('request',r=>{ if(/map-korea\.svg/.test(r.url())) fetched.push(1); });

    await p.goto(WIDE,{waitUntil:'networkidle0'});
    await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
    await sleep(600);
    check('the fine sheet is not fetched at the opening view', fetched.length===0, '');

    await adminOn(p);
    let s=await shape(p);
    check('the administrative sheet brings the thirteen, and Cheju',
      s.named===14 && s.provs.indexOf('Saishu')>=0 && s.provs.indexOf('Kogen')>=0,
      s.provs.join(','));
    /* 7,830 as built. Pinned rather than bounded: the number is what the
       coarse tolerance was chosen to produce, and a change in it is a change
       in the geometry the base map carries. */
    check('drawn coarsely, at about what Natural Earth cost',
      s.vertices>6000 && s.vertices<9500, s.vertices+' vertices');
    check('and the fine sheet is still not fetched', fetched.length===0, '');

    // and now close in, where the finer set is worth its weight
    await p.goto(CLOSE,{waitUntil:'networkidle0'});
    await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
    await adminOn(p);
    await sleep(1200);
    const fine=await shape(p);
    check('zoomed in over Korea, the finer provinces arrive',
      fine.vertices>60000, fine.vertices+' vertices');
    check('fetched exactly once', fetched.length===1, fetched.length+' times');
    check('and there are still fourteen of them, named',
      fine.named===14, JSON.stringify(fine.provs));

    // out again
    await p.evaluate(()=>{ for(let i=0;i<12;i++) document.querySelector('#zoom-out').click(); });
    await sleep(1800);
    const back=await shape(p);
    check('zooming out puts the coarse ones back',
      back.vertices<9500 && back.named===14, back.vertices+' vertices');
    check('with no second fetch', fetched.length===1, fetched.length+' times');

    // and in again: kept, not re-fetched
    await p.evaluate(()=>{ for(let i=0;i<12;i++) document.querySelector('#zoom-in').click(); });
    await sleep(2000);
    const again=await shape(p);
    check('and back in they are kept rather than asked for again',
      again.vertices>60000 && fetched.length===1,
      again.vertices+' vertices, '+fetched.length+' fetch');
    check('no page errors', errs.length===0, errs.join(' | '));
    await p.close();
  } finally { await browser.close(); }
  console.log('\n'+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
