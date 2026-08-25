const H=require('./suite.js');

/* Wait for the map rather than for a number. Measured: the atoms and the first
   labels are there 730 ms after the navigation resolves — these scripts were
   sleeping three and a half seconds for it. See `suite.js`. */
async function ready(pg, wantsAnn){
  try {
    await pg.waitForFunction(want=>{
      if(!document.querySelectorAll('#land .atom').length) return false;
      if(!document.querySelectorAll('#labels text').length) return false;
      if(want && !document.querySelectorAll('#annotations [data-ann]').length) return false;
      return true;
    },{timeout:25000,polling:'raf'},!!wantsAnn);
  } catch(e){ /* the script's own checks will say so */ }
  await sleep(250);
}
const {puppeteer,sleep,page,tap,openPanel,pickTool,SPOT,FIX,check,report}=H;
const path=require('path');

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});

console.log('\n— it survives a reload —');
{ const p=await page(b,{accept:true}); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Kept'; t.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(600);
  check('it is written to this browser',
    await p.evaluate(()=>!!window.localStorage.getItem('jem-annotations-v1')));
  await p.reload({waitUntil:'networkidle0'}); await ready(p, false);
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
  const names=await p.evaluate(()=>[...document.querySelectorAll('#ann-list .ann-name')].map(x=>x.textContent));
  check('and offered back after a reload', names.indexOf('Kept')>=0, JSON.stringify(names));
  await p.close(); }

{ const p=await page(b,{accept:false});   // the reader declines
  await p.evaluate(()=>window.localStorage.setItem('jem-annotations-v1',
    JSON.stringify({f:[{type:'Feature',geometry:{type:'Point',coordinates:[120,30]},properties:{title:'Old'}}],s:'',t:Date.now()})));
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
  check('declining leaves nothing on the map',
    await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===0);
  /* And leaves them in the browser. This used to assert the opposite — that
     declining removed the store — which is what the code did and what it
     should never have done: Cancel meant "not now" to the reader and "delete
     the only copy" to the map, with nothing on screen to say so. The prompt
     says which it is now, and the offer is simply not made again this
     session. */
  check('but keeps them in the browser, because Cancel is not Delete',
    await p.evaluate(()=>{const raw=window.localStorage.getItem('jem-annotations-v1');
      return !!raw && JSON.parse(raw).f.length===1;}));
  check('and does not ask again in the same session', await (async()=>{
    await p.evaluate(()=>{const c=document.querySelector('#ann-close'); if(c) c.click();});
    await sleep(400);
    await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(900);
    return await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===0;})());
  await p.close(); }

console.log('\n— the map itself still works —');
{ const p=await page(b); await openPanel(p);
  const vb0=await p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox'));
  await p.mouse.move(700,500); await p.mouse.down();
  for(let i=0;i<12;i++){await p.mouse.move(700-i*8,500+i*3); await sleep(12);}
  await p.mouse.up(); await sleep(500);
  check('the map still pans with the panel open',
    (await p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox')))!==vb0);
  const s=await p.evaluate(SPOT,['#a-china','#a-japan','#a-india','#a-dei','#a-siam']);
  await tap(p,s.x,s.y); await sleep(400);
  check('and a tap still selects a country when no tool is armed',
    await p.evaluate(()=>!document.querySelector('#info').hidden));
  await p.evaluate(()=>document.querySelector('#ann-close').click()); await sleep(400);
  check('closing puts the marks away',
    await p.evaluate(()=>{const g=document.querySelector('#annotations'); return !g||g.style.display==='none';}));
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.close(); }

console.log('\n— projections —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450); await tap(p,800,500);
  const at=async()=>p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-mark')]
    .map(e=>{const r=e.getBoundingClientRect(); return [Math.round((r.left+r.right)/2),Math.round((r.top+r.bottom)/2)];}));
  const m0=JSON.stringify(await at());
  for (const mode of ['albers','laea']) {
    await p.evaluate(v=>{const r=document.querySelector('#proj-'+v); r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));},mode);
    await sleep(2200);
    check('marks survive '+mode, (await at()).length===2);
  }
  await p.evaluate(()=>{const r=document.querySelector('#proj-mercator'); r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(2200);
  check('and come back to the same pixels in Mercator', JSON.stringify(await at())===m0,
    m0+' vs '+JSON.stringify(await at()));
  await p.close(); }

console.log('\n— a finger —');
{ const p=await page(b,{touch:true}); await openPanel(p);
  check('the panel opens on a touch screen', await p.evaluate(()=>!document.querySelector('#annotate').hidden));
  const geom=await p.evaluate(()=>{
    const a=document.querySelector('#annotate').getBoundingClientRect();
    const l=document.querySelector('#legend').getBoundingClientRect();
    return {annTop:Math.round(a.top), annBottom:Math.round(a.bottom), h:innerHeight,
            legBottom:Math.round(l.bottom), overlap: a.top < l.bottom && a.bottom > l.top};
  });
  check('the panel docks to the foot of the screen', geom.annBottom>=geom.h-2, JSON.stringify(geom));
  check('so it no longer stands on the legend', !geom.overlap, JSON.stringify(geom));
  await pickTool(p,'point');
  const s=await p.evaluate(SPOT,['#a-china','#a-japan','#a-india','#a-dei','#a-siam']);
  await tap(p,s.x,s.y);
  check('a finger places a mark', await p.evaluate(()=>document.querySelectorAll('#annotations .ann-mark').length)===1);
  check('and does not select the country under it',
    await p.evaluate(()=>document.querySelector('#info').hidden));
  await pickTool(p,'line');
  await tap(p,380,600); await tap(p,470,650); await tap(p,540,610);
  await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
  check('a finger draws a line and finishes it',
    await p.evaluate(()=>document.querySelectorAll('#annotations .ann-shape').length)===1);
  await pickTool(p,'line');
  const s2=await p.evaluate(SPOT,['#a-china','#a-japan','#a-india','#a-dei','#a-siam']);
  if(s2){ await tap(p,s2.x,s2.y); await sleep(300);
    check('with the tool off, a tap selects again',
      await p.evaluate(()=>!document.querySelector('#info').hidden)); }
  check('no page errors on touch', p.__errs.length===0, p.__errs[0]);
  await p.close(); }

/* The four screen sizes used to be measured here too, in this same
   browser — a fifth, sixth, seventh and eighth page on top of the four
   above, which is exactly the accumulation the README warns about: the
   run reached them and `Runtime.callFunctionOn` timed out. `run4.js`
   does the same measurements with a fresh browser per size, and a
   viewport set at open rather than changed after, which is the more
   honest test anyway. It lives there and not here. */
await b.close();
process.exit(report());
})();
