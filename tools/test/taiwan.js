/* Taiwan's two levels: districts under prefectures.
 *
 *     node tools/test/taiwan.js          # with a server on 8123
 *
 * The 1930 layer gives 55 郡 and 市 inside eight 州 and 廳, plus the 蕃地 — the
 * highlands and the east, outside that hierarchy altogether — as one unit. The
 * map has to say two things about a district without being asked twice:
 *
 *   * pointing at one outlines the **prefecture** it belongs to, with the
 *     district itself picked out more lightly inside it. The outline round the
 *     whole of Taiwan answers neither question a reader is asking.
 *   * the names layer writes the **prefectures** and not the districts. Fifty
 *     names across an island fifty pixels wide is a smudge, and the placer
 *     would drop most of them anyway and keep an arbitrary handful.
 *
 * Both come off one attribute, `data-parent`, written onto every district at
 * build time from the districts file. It is not a cluster: a cluster is a
 * scattered polity that *replaces* the territory (the Straits Settlements),
 * and this is a plain hierarchy that *adds* an outline.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('taiwan test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const code=(...bits)=>bits.reduce((a,b)=>a|b,0).toString(36);
const TAIWAN='&bbox=119.2,21.7,122.4,25.5';

/* The bounding box of what each highlight slot is tracing. A slot round one
   prefecture is a fraction of the island; a slot round the country is the lot. */
const SLOTS=()=>[...document.querySelectorAll('#highlight > .hi-slot')].map(g=>{
  let bb=null; try{const b=g.getBBox(); bb=[b.x,b.y,b.width,b.height].map(Math.round);}catch(e){}
  return bb;
}).filter(b=>b && b[2]>0);

const hoverProv=async(p,key)=>{
  const pt=await p.evaluate(k=>{
    const el=document.querySelector('[data-prov="'+k+'"]');
    if(!el) return null;
    const bb=el.getBBox(), svg=el.ownerSVGElement, m=svg.getScreenCTM(), q=svg.createSVGPoint();
    q.x=bb.x+bb.width/2; q.y=bb.y+bb.height/2;
    const s=q.matrixTransform(m); return [s.x,s.y];},key);
  if(!pt) return null;
  await p.mouse.move(5,5); await sleep(250);
  await p.mouse.move(pt[0],pt[1]); await sleep(900);
  return pt;
};

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const p=await b.newPage(); await p.setViewport({width:1300,height:1000});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html?layers='+code(8,512)+TAIWAN,{waitUntil:'networkidle0'});
await p.waitForFunction(()=>document.querySelectorAll('#a-taiwan [data-prov]').length>10,
  {timeout:25000,polling:'raf'}).catch(()=>{});
await sleep(1200);

console.log('\n— every district knows its prefecture —');
{
  const n=await p.evaluate(()=>document.querySelectorAll('#a-taiwan [data-prov]').length);
  const withParent=await p.evaluate(()=>document.querySelectorAll('#a-taiwan [data-parent]').length);
  check('the 55 districts each carry one, and the 蕃地 does not',
    n===56 && withParent===55, withParent+' of '+n);
  const shu=await p.evaluate(()=>{const s=new Set();
    document.querySelectorAll('#a-taiwan [data-parent]').forEach(e=>s.add(e.getAttribute('data-parent')));
    return [...s].sort();});
  check('and they come to all eight prefectures', shu.length===8, shu.join(','));
  check('the prefectures are carried as their own shapes, not summed from districts',
    (await p.evaluate(()=>document.querySelectorAll('#a-taiwan [data-shu]').length))===8);
  /* A prefecture reaches back over the mountains into the 蕃地 while its
     districts are a rind along the west, so its own shape has to be wider than
     the districts filed under it. Tainan-shū is the plainest case. */
  const cmp=await p.evaluate(()=>{
    const box=els=>{let x0=1e9,x1=-1e9;els.forEach(e=>{const b=e.getBBox();
      x0=Math.min(x0,b.x); x1=Math.max(x1,b.x+b.width);}); return x1-x0;};
    return {shu: box([...document.querySelectorAll('[data-shu="TwShuTainan"]')]),
            sum: box([...document.querySelectorAll('[data-parent="TwShuTainan"]')])};});
  check('and it is', cmp.shu > cmp.sum + 1,
    'prefecture '+cmp.shu.toFixed(1)+' wide, its districts '+cmp.sum.toFixed(1));
}

console.log('\n— pointing at a district outlines its prefecture —');
{
  const island=await p.evaluate(()=>{const b2=document.getElementById('a-taiwan').getBBox();
    return [b2.x,b2.y,b2.width,b2.height].map(Math.round);});
  const at=await hoverProv(p,'TwKagi');
  check('Kagi-gun can be pointed at', !!at);
  const slots=await p.evaluate(SLOTS);
  check('two outlines are drawn, not one', slots.length>=2, JSON.stringify(slots));
  if(slots.length>=2){
    const big=slots[0], small=slots[1];
    check('the larger is a prefecture and not the whole island',
      big[2] < island[2]*0.7 && big[2] > island[2]*0.1,
      'island '+island[2]+' wide, outline '+big[2]);
    check('and the smaller one is inside it — the district itself',
      small[2] < big[2] && small[0] >= big[0]-1 && small[0]+small[2] <= big[0]+big[2]+1,
      JSON.stringify(big)+' vs '+JSON.stringify(small));
  }
  const tip=await p.evaluate(()=>{const t=document.querySelector('#tip,#tooltip');
    return t?t.textContent:'';});
  check('the tooltip still names the district, not the prefecture',
    /Kagi-gun/.test(tip), tip.slice(0,60));
  check('and says which prefecture it was in, with its kanji',
    /Tainan-sh/.test(tip) && /臺南州/.test(tip), tip.slice(0,140));
}

console.log('\n— the 蕃地 is one shape, and points at no prefecture —');
{
  const at=await hoverProv(p,'TwBanchi');
  check('it can be pointed at', !!at);
  const tip=await p.evaluate(()=>{const t=document.querySelector('#tip,#tooltip');
    return t?t.textContent:'';});
  check('and it is called Taiwan Indigenous Peoples',
    /Taiwan Indigenous Peoples/.test(tip), tip.slice(0,60));
  check('with the administration\'s own word for it beside that',
    /蕃地/.test(tip), tip.slice(0,90));
  const one=await p.evaluate(()=>document.querySelectorAll('[data-prov="TwBanchi"]').length);
  check('the seven blocks are drawn as one shape, not seven', one===1, String(one));
  /* Pointing at it must not light a prefecture: it was one territory under one
     regime, and the 州 a slice was filed under says nothing true about it. */
  const slots=await p.evaluate(SLOTS);
  const island=await p.evaluate(()=>{const b2=document.getElementById('a-taiwan').getBBox();
    return Math.round(b2.width);});
  check('and the larger outline is the colony, not one of its prefectures',
    slots.length>=2 && Math.abs(slots[0][2]-island)<3,
    'island '+island+' wide, outline '+(slots[0]||[])[2]);
}

console.log('\n— and the names layer writes prefectures, not districts —');
{
  await p.goto('http://localhost:8123/index.html?layers='+code(16,8,512)+TAIWAN,
    {waitUntil:'networkidle0'});
  await p.waitForFunction(()=>document.querySelectorAll('#a-taiwan [data-prov]').length>10,
    {timeout:25000,polling:'raf'}).catch(()=>{});
  await sleep(1800);
  const shown=await p.evaluate(()=>[...document.querySelectorAll('#labels text')]
    .filter(e=>e.textContent.trim() && e.style.display!=='none'
                && e.getBoundingClientRect().width>0)
    .map(e=>e.textContent));
  const shu=shown.filter(t=>/-sh[uū]$|-ch[oō]$/.test(t));
  const gun=shown.filter(t=>/-gun|-shi\b/.test(t));
  check('the prefectures are written', shu.length>=6, shu.join(' | '));
  check('and not one district is', gun.length===0, gun.join(' | '));
  check('Taiwan itself is still named', shown.some(t=>/^Taiwan$/.test(t)), shown.join(' | '));
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
