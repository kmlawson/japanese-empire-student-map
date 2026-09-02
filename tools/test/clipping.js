/* **Nothing may be cut off by the box it scrolls in.**
 *
 *     node tools/test/clipping.js         # with a server on 8123
 *
 * A scroll container can be scrolled *right* and *down*. It cannot be scrolled
 * left of its own origin or above it, so anything drawn there is gone — not
 * hidden, not reachable, gone. The air card's journey strip did exactly this:
 * every call is marked by a dot sitting 3.5 px left of its own rule, the strip
 * scrolls sideways, and the first column's dots were sliced down their left
 * edge with no way for the reader to see the rest.
 *
 * That is a class of fault rather than one bug, which is why this walks every
 * scroll container on the page instead of testing the strip. It is cheap: two
 * viewports, a few states, and a bounding-box comparison.
 *
 * It compares against the *padding* box, because padding is the room a design
 * gives a mark that hangs outside its content — which is the fix the strip
 * uses. An element inside that room is fine; one outside it is lost.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('clipping test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const { ready } = require('./settle.js');
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const URL='http://localhost:8123/index.html';

const DETECT=()=>{
  const out=[];
  /* HTML only, on both passes. `querySelectorAll('*')` reaches into the map's
     ~7,000 SVG nodes, and a computed style for each of those was enough to
     time the debugging protocol out. They are drawn rather than laid out and
     cannot be clipped by a pane in the way this is looking for. */
  const scrollers=[...document.querySelectorAll('*')]
    .filter(e=>!(e instanceof SVGElement))
    .filter(e=>{
      const s=getComputedStyle(e);
      return /auto|scroll/.test(s.overflowX+s.overflowY)
          && e.getBoundingClientRect().width>0;
    });
  scrollers.forEach(sc=>{
    const b=sc.getBoundingClientRect();
    /* HTML only. The map is ~7,000 SVG nodes inside a scroll container, and
       asking each of them for a computed style and a box took long enough to
       time the protocol out — for elements that are drawn rather than laid
       out, and cannot be clipped by a pane in the way this is looking for. */
    [...sc.querySelectorAll('*')].filter(e=>!(e instanceof SVGElement)).forEach(el=>{
      const s=getComputedStyle(el);
      if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.05) return;
      const r=el.getBoundingClientRect();
      if(!r.width&&!r.height) return;
      /* Left and top only: those are the edges a scrollbar cannot reach.
         Overflow to the right or below is what the scrollbar is for. */
      const dl=b.left-r.left, dt=b.top-r.top;
      if(dl>0.6||dt>0.6) out.push({
        box:(sc.id?'#'+sc.id:sc.tagName)+'.'+String(sc.className||'').slice(0,24),
        el:el.tagName+(el.id?'#'+el.id:'')+'.'+String(el.className||'').slice(0,32),
        leftBy:+dl.toFixed(1), topBy:+dt.toFixed(1)});
    });
  });
  const seen={};
  return out.filter(o=>{const k=o.box+'|'+o.el; if(seen[k])return false; seen[k]=1; return true;});
};

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const errs=[];
  for (const [w,h,tag] of [[1400,950,'a desktop'],[390,844,'a phone']]) {
    const p=await browser.newPage();
    await p.setViewport({width:w,height:h,isMobile:w<500,hasTouch:w<500});
    if (w>500) await p.evaluateOnNewDocument(SHIM);
    p.on('pageerror',e=>errs.push(String(e)));
    /* **Answer the dialogs.** The annotation pane asks before replacing work,
       and an unanswered `confirm()` blocks the page's JavaScript — so the next
       `evaluate` never returns and the run dies on a protocol timeout rather
       than a failed check. */
    p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(URL,{waitUntil:'networkidle0'});
    await ready(p);
    console.log('\n— '+tag+' —');
    const asLoaded=await p.evaluate(DETECT);
    check('nothing is cut off on the map as it loads', asLoaded.length===0,
      JSON.stringify(asLoaded).slice(0,200));

    /* The air card, which is where this was found: a strip of circuits that
       scrolls sideways, with a mark hanging left of every call. */
    await p.evaluate(()=>{const e=[...document.querySelectorAll('#epoch-seg button')]
      .find(x=>/1942/.test(x.textContent)); if(e)e.click();});
    await sleep(2200);
    await p.evaluate(()=>document.getElementById('btn-air').click());
    await sleep(1200);
    const spot=await p.evaluate(()=>{
      const el=document.querySelector('.air-route[data-air="korea-1938"] .air-line');
      if(!el) return null;
      const svg=document.getElementById('jmap'), m=svg.getScreenCTM();
      const box=document.getElementById('map-container').getBoundingClientRect();
      const avoid=[...document.querySelectorAll('#air [data-air-stop]'),
        ...[...document.querySelectorAll('#air .air-route')]
          .filter(g=>g.getAttribute('data-air')!=='korea-1938')]
        .map(e2=>e2.getBoundingClientRect()).filter(r=>r.width||r.height);
      const gap=r=>Math.min(...avoid.map(x=>Math.max(x.left-r.x,r.x-x.right,x.top-r.y,r.y-x.bottom)));
      const L=el.getTotalLength(); let best=null,bg=-1e9;
      for(let q=0;q<=300;q++){const pt=el.getPointAtLength(L*q/300);
        const t=svg.createSVGPoint(); t.x=pt.x; t.y=pt.y;
        const r=t.matrixTransform(m);
        if(r.x<box.left+12||r.x>box.right-12||r.y<box.top+12||r.y>box.bottom-12) continue;
        const g=gap(r); if(g>bg){bg=g;best=r;}}
      return best?{x:Math.round(best.x),y:Math.round(best.y)}:null;
    });
    if (spot) {
      if (w<500) await p.touchscreen.tap(spot.x,spot.y);
      else await p.mouse.click(spot.x,spot.y);
      await sleep(900);
    }
    const drawn=await p.evaluate(()=>document.querySelectorAll('#info-air .air-calls li').length);
    check('the air card drew its circuit to look at', drawn>0, String(drawn));
    const card=await p.evaluate(DETECT);
    check('and not one of its marks is cut off', card.length===0,
      JSON.stringify(card).slice(0,240));

    // and the annotation pane, with something drawn so every control renders
    await p.evaluate(()=>{const c=[...document.querySelectorAll('button')]
      .find(x=>/^Create$/.test(x.textContent.trim())); if(c)c.click();});
    await sleep(1600);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#annotate button')]
      .find(x=>/point/i.test(x.textContent)); if(b)b.click();});
    await sleep(400);
    if (w<500) await p.touchscreen.tap(200,420); else await p.mouse.click(500,500);
    await sleep(900);
    const ann=await p.evaluate(DETECT);
    check('nor anything in the annotation pane', ann.length===0,
      JSON.stringify(ann).slice(0,240));
    const boxes=await p.evaluate(()=>[...document.querySelectorAll('*')]
      .filter(e=>{const s=getComputedStyle(e);
        return /auto|scroll/.test(s.overflowX+s.overflowY)&&e.getBoundingClientRect().width>0;}).length);
    check('and there were scroll containers to check', boxes>=3, String(boxes));
    await p.close();
  }
  check('no page errors', errs.length===0, errs.join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
