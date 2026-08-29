/* How far in the map goes, and how faithfully a link records it.
 *
 *     node tools/test/zoom.js            # with a server on 8123
 *
 * The floor on the zoom is a *scale* — a minimum number of map units per CSS
 * pixel — and not a view width, because a view width is the same number of
 * degrees on every screen and so stops a 390-pixel phone three times further
 * out than a 1,200-pixel desktop with every island three times smaller. That
 * fix gave the two screens the same magnification. This one goes past it: a
 * touch screen is allowed several times deeper still, because its pixels are
 * physically smaller and a finger needs a bigger target than a mouse does.
 *
 * Two things are checked and they pull against each other. The phone has to
 * reach a real multiple of the desktop's depth — and a link written down there
 * has to come back to the same ground, which two decimal places of longitude
 * no longer buy: at the bottom of the phone's range a hundredth of a degree is
 * three per cent of the view.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('zoom test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const URL='http://localhost:8123/index.html';
const box=p=>p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox')
  .split(/\s+/).map(Number));

/* Press zoom-in until the view stops narrowing. The button is the reader's own
   instrument, so this measures what they can actually reach and not what an
   internal constant says. */
const deepest=async p=>{
  let last=null,w=null;
  for(let i=0;i<90;i++){
    await p.evaluate(()=>{const b=document.getElementById('zoom-in'); if(b) b.click();});
    w=(await box(p))[2];
    if(last!==null && Math.abs(w-last)<1e-6) break;
    last=w;
  }
  return w;
};
const width=p=>p.evaluate(()=>document.getElementById('map-container')
  .getBoundingClientRect().width);

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const errs=[];

console.log('\n— a desktop reaches the depth it always did —');
const d=await b.newPage();
await d.setViewport({width:1200,height:900});
await d.evaluateOnNewDocument(SHIM);
d.on('pageerror',e=>errs.push(String(e)));
await d.goto(URL,{waitUntil:'networkidle0'});
await sleep(2600);
check('the desktop is not a coarse pointer',
  (await d.evaluate(()=>matchMedia('(pointer: coarse)').matches))===false);
const dw=await deepest(d), dpx=await width(d);
const dScale=dw/dpx;
check('and it stops somewhere sensible', dw>5 && dw<60, dw.toFixed(2)+' units');

console.log('\n— a phone goes several times further —');
const m=await b.newPage();
await m.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:3});
m.on('pageerror',e=>errs.push(String(e)));
await m.goto(URL,{waitUntil:'networkidle0'});
await sleep(2600);
check('the phone is a coarse pointer',
  (await m.evaluate(()=>matchMedia('(pointer: coarse)').matches))===true);
const mw=await deepest(m), mpx=await width(m);
const mScale=mw/mpx;
const times=dScale/mScale;
/* Twice, not four times. The desktop limit was 100x and the boost was 4, so a
   phone went four times further; the desktop is 250x now — the fine coastlines
   and the survey-drawn Korea and Taiwan carry it — and the boost is halved to
   match. A phone still goes further, for the two reasons it always did: its
   pixels are physically smaller, and a finger needs a bigger target than a
   mouse. It no longer goes four times further than a desktop that has caught
   up. */
check('it reaches at least twice the desktop magnification', times>=2,
  times.toFixed(2)+'x');
check('and not absurdly more than the two it is set to', times<=3, times.toFixed(2)+'x');

console.log('\n— and a link written down there comes back to it —');
{
  /* The URL is written on a debounce, so it still holds the opening bbox for
     a moment after the last press. Reading it immediately measured the view
     the map opened on and called the deep link forty degrees wide. */
  await sleep(2200);
  const before=await box(m);
  const url=await m.url();
  check('the deep link carries the view', /where=/.test(url), url.slice(-60));
  /* Two decimal places was sized against the desktop's limit. Four times
     deeper, a hundredth of a degree is three per cent of the view — a link
     landing a tenth of a screen from what was being looked at — so the deep
     end writes a third place. */
  const bb=/where=([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)/.exec(url);
  const span=bb?(parseFloat(bb[3])-parseFloat(bb[1])):0;
  check('and the view down there is under a degree and a half wide',
    span>0 && span<1.5, span.toFixed(3)+'°');
  const places=bb?Math.max(...bb.slice(1).map(s=>(s.split('.')[1]||'').length)):0;
  check('so the link is written to three places', places>=3, places+' places');

  const again=await b.newPage();
  await again.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:3});
  again.on('pageerror',e=>errs.push(String(e)));
  await again.goto(url,{waitUntil:'networkidle0'});
  await sleep(2600);
  const after=await box(again);
  const off=Math.max(Math.abs(after[0]-before[0]),Math.abs(after[1]-before[1]));
  check('and it opens on the same ground', off<=0.05,
    'off by '+off.toFixed(3)+' map units');
  check('at the same depth', Math.abs(after[2]-before[2])<=0.05,
    before[2]+' then '+after[2]);
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
