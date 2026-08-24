const H=require('./suite.js');
const {puppeteer,sleep,page,tap,openPanel,pickTool,SPOT,FIX,check,report}=H;
const path=require('path');

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});

console.log('\n— it survives a reload —');
{ const p=await page(b,{accept:true}); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Kept'; t.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(600);
  check('it is written to this browser',
    await p.evaluate(()=>!!window.localStorage.getItem('jem-annotations-v1')));
  await p.reload({waitUntil:'networkidle0'}); await sleep(3200);
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
  const names=await p.evaluate(()=>[...document.querySelectorAll('#ann-list .ann-name')].map(x=>x.textContent));
  check('and offered back after a reload', names.indexOf('Kept')>=0, JSON.stringify(names));
  await p.close(); }

{ const p=await page(b,{accept:false});   // the reader declines
  await p.evaluate(()=>window.localStorage.setItem('jem-annotations-v1',
    JSON.stringify({f:[{type:'Feature',geometry:{type:'Point',coordinates:[120,30]},properties:{title:'Old'}}],s:'',t:Date.now()})));
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
  check('declining leaves nothing behind',
    await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===0);
  check('and clears the store',
    await p.evaluate(()=>!window.localStorage.getItem('jem-annotations-v1')));
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

console.log('\n— narrow and wide —');
for (const [w,h,tag] of [[390,780,'phone   '],[768,1024,'tablet  '],[1100,800,'laptop  '],[1600,1000,'desktop ']]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3200);
  await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(400);
  const btn=await p.evaluate(()=>{const b=document.querySelector('#ann-create');
    const r=b.getBoundingClientRect(); return {w:Math.round(r.width),vis:r.width>0&&r.height>0};});
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1400);
  const st=await p.evaluate(()=>{
    const a=document.querySelector('#annotate'), r=a.getBoundingClientRect();
    return {left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),
            overflowX:a.scrollWidth-a.clientWidth,
            offRight:Math.round(r.right)>innerWidth, offBottom:Math.round(r.bottom)>innerHeight+2,
            tools:[...document.querySelectorAll('.ann-tool')].map(b=>Math.round(b.getBoundingClientRect().width))};
  });
  check(tag+'the Layers button is reachable', btn.vis);
  check(tag+'the panel fits the width', !st.offRight && st.overflowX===0, JSON.stringify(st));
  check(tag+'its four tools are all on one row and non-zero', st.tools.length===4 && st.tools.every(v=>v>20), JSON.stringify(st.tools));
  check(tag+'no page errors', p.__errs.length===0, p.__errs[0]);
  await p.screenshot({path:'a-'+tag.trim()+'.png'});
  await p.close();
}

await b.close();
process.exit(report());
})();
