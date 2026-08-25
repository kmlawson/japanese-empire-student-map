/* China's two province sheets, and the one that is meant to be showing.
 *
 *     node tools/test/provsource.js      # with a server on 8123
 *
 * The alternative sheet — the Republic's own provinces, in
 * `japan-empire-map-roc.svg` — came out of the Layers panel when the period
 * sheet was redrawn, and bit 128 of the layer code was deliberately kept
 * working so that a link written while the switch existed still means what it
 * meant. It had stopped meaning it. Three faults, all only reachable from such
 * a link, and all found by an outside review of `map.js`:
 *
 *   * The administrative graft appended its own provinces whatever the reader
 *     had asked for, so whichever fetch landed last won and both sheets could
 *     end up drawn: 42 provinces inside China's atom where there are 21, each
 *     boundary answering the pointer twice.
 *
 *   * China's provinces are in the *base map* file, not the administrative
 *     one, so they were never in `provSets` and the swap had nothing to take
 *     out — which is how both sheets came to be there even when the fetches
 *     landed in the helpful order.
 *
 *   * A set held out of the document is invisible to `reprojectDocument`,
 *     which walks the SVG. The Republic's sheet had never been in the document
 *     at all, so in Albers or Lambert it was drawn at its Mercator
 *     coordinates — a couple of hundred map units from the country.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('provsource test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };

// admin on (8) + level 3 (512), and bit 128 for the Republic's sheet
const code=(...bits)=>bits.reduce((a,b)=>a|b,0).toString(36);
const ENP=code(8,512), ROC=code(8,512,128);
const ALB=32768;

/* What is actually inside China's atom: how many divisions, what they are
   called, and where one of them is. `Gansu` is in both sheets, which makes it
   the one that says which sheet this is and whether it has been reprojected. */
const CHINA=()=>{
  const ns=[...document.querySelectorAll('#a-china [data-prov]')];
  const g=ns.find(n=>n.getAttribute('data-prov')==='Gansu');
  const b=g&&g.getBBox();
  return {n:ns.length,
          names:ns.map(n=>n.getAttribute('data-prov')).slice(0,4),
          gansu:b?[Math.round(b.x),Math.round(b.y)]:null};
};

const open=async(p,c)=>{
  await p.goto('http://localhost:8123/index.html?layers='+c,{waitUntil:'networkidle0'});
  await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
  await sleep(3500);           // both province fetches have to land
  return p.evaluate(CHINA);
};

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:240000});
const p=await b.newPage(); await p.setViewport({width:1400,height:900});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));

console.log('\n— one sheet at a time —');
const enp=await open(p,ENP);
check('the ordinary map gives China its usual divisions', enp.n===21, JSON.stringify(enp));
const roc=await open(p,ROC);
check('and a link asking for the Republic\'s sheet gives that many too, not both',
  roc.n===enp.n, JSON.stringify(roc));
check('and they are the Republic\'s provinces, not the other set\'s',
  roc.names.join()!==enp.names.join(), JSON.stringify(roc.names)+' vs '+JSON.stringify(enp.names));
check('with no province drawn twice',
  await p.evaluate(()=>{const seen={},dup=[];
    document.querySelectorAll('#a-china [data-prov]').forEach(n=>{
      const k=n.getAttribute('data-prov');
      if(seen[k])dup.push(k); else seen[k]=1;});
    return dup.length===0;}));

console.log('\n— and in the projection that is on —');
const enpA=await open(p,code(8,512,ALB));
const rocA=await open(p,code(8,512,128,ALB));
check('the ordinary sheet moves into Albers',
  enpA.gansu && Math.abs(enpA.gansu[0]-enp.gansu[0])>100,
  JSON.stringify(enp.gansu)+' → '+JSON.stringify(enpA.gansu));
check('and so does the Republic\'s, rather than staying in Mercator',
  rocA.gansu && Math.abs(rocA.gansu[0]-roc.gansu[0])>100,
  JSON.stringify(roc.gansu)+' → '+JSON.stringify(rocA.gansu));
check('the two sheets agree about where Gansu is, to within the sources\' own disagreement',
  rocA.gansu && enpA.gansu &&
  Math.abs(rocA.gansu[0]-enpA.gansu[0])<20 && Math.abs(rocA.gansu[1]-enpA.gansu[1])<20,
  JSON.stringify(enpA.gansu)+' vs '+JSON.stringify(rocA.gansu));
check('and the Republic\'s sheet is still the one showing', rocA.n===enp.n, JSON.stringify(rocA));

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
