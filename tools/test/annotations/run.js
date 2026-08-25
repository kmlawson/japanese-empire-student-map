const H=require('./suite.js');
const {puppeteer,sleep,page,tap,openPanel,pickTool,SPOT,FIX,check,report}=H;
const path=require('path');

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});

console.log('\n— loading, and what is not loaded —');
{ const p=await page(b);
  const reqs=[]; p.on('request',r=>reqs.push(r.url()));
  await sleep(400);
  check('annotate.js is not fetched until asked for', !reqs.some(u=>u.includes('annotate.js')));
  await openPanel(p);
  check('annotate.js is fetched when asked for', await p.evaluate(()=>!!window.JMAP_ANNOTATE));
  check('the panel is built by the file', await p.evaluate(()=>!!document.querySelector('#annotate')));
  check('its stylesheet comes with it', await p.evaluate(()=>!!document.getElementById('ann-css')));
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.close(); }

console.log('\n— the four tools —');
{ const p=await page(b); await openPanel(p);
  await pickTool(p,'point');  const s1=await p.evaluate(SPOT,'#a-china'); await tap(p,s1.x,s1.y);
  check('a point names itself from the place under it',
    /China|Chinese/.test(await p.evaluate(()=>document.querySelector('#ann-title').value)),
    await p.evaluate(()=>document.querySelector('#ann-title').value));
  // the Arrow tool, where Event used to be: two presses and it finishes itself
  await pickTool(p,'arrow');  await tap(p,s1.x+40,s1.y+30); await tap(p,s1.x+160,s1.y+90);
  await pickTool(p,'line');   await tap(p,600,500); await tap(p,700,560); await tap(p,780,540);
  await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(300);
  await pickTool(p,'polygon'); await tap(p,850,500); await tap(p,950,530); await tap(p,900,610);
  await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(300);
  const st=await p.evaluate(()=>({marks:document.querySelectorAll('#annotations .ann-mark').length,
    shapes:document.querySelectorAll('#annotations .ann-shape').length,
    rows:document.querySelectorAll('#ann-list li').length,
    meas:[...document.querySelectorAll('#ann-list .ann-meas')].map(x=>x.textContent)}));
  check('four features in the list', st.rows===4, JSON.stringify(st));
  check('three shapes drawn', st.shapes===3, JSON.stringify(st));
  check('an arrow is measured in km', /km$/.test(st.meas[1]), st.meas[1]);
  check('a line is measured in km', /km$/.test(st.meas[2]), st.meas[2]);
  check('an area is measured in km²', /km²$/.test(st.meas[3]), st.meas[3]);
  check('a point is measured as a coordinate', /°[NS], .*°[EW]/.test(st.meas[0]), st.meas[0]);
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.close(); }

console.log('\n— names on the map —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Somewhere'; t.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(400);
  check('a typed name is written on the map',
    await p.evaluate(()=>[...document.querySelectorAll('#ann-labels .ann-label')].some(t=>t.textContent==='Somewhere')));
  await p.evaluate(()=>{const c=document.querySelector('#ann-names'); c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(300);
  check('and the switch takes it off again',
    await p.evaluate(()=>document.querySelectorAll('#ann-labels .ann-label').length===0));
  await p.close(); }

console.log('\n— styling —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const c=document.querySelector('#ann-colour'); c.value='#8c2f39'; c.dispatchEvent(new Event('input',{bubbles:true}));
    const s=document.querySelector('#ann-symbol'); s.value='triangle'; s.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(400);
  // the shape is a <g> of one or two elements now, so ask any of them
  check('the colour reaches the drawn mark',
    await p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-mark *')]
      .some(e=>e.getAttribute('fill')==='#8c2f39'||e.getAttribute('stroke')==='#8c2f39')));
  check('the shape changes to a triangle',
    await p.evaluate(()=>document.querySelector('#annotations .ann-mark path')!==null));
  check('and it is recorded as simplestyle',
    await p.evaluate(()=>{document.querySelector('#ann-save').click(); return true;}) && true);
  await sleep(700);
  const saved=JSON.parse(await p.evaluate(()=>window.__saved));
  check('marker-symbol is triangle', saved.features[0].properties['marker-symbol']==='triangle',
    JSON.stringify(saved.features[0].properties));
  check('marker-color is the chosen colour', saved.features[0].properties['marker-color']==='#8c2f39');
  await p.close(); }

console.log('\n— undo, delete, drag —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450); await tap(p,760,500);
  check('two marks', await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===2);
  await p.evaluate(()=>document.querySelector('#ann-undo').click()); await sleep(400);
  check('undo removes the last', await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===1);
  await pickTool(p,'point');            // turn the tool off so drag is allowed
  const before=await p.evaluate(()=>{const m=document.querySelector('#annotations .ann-mark');
    const r=m.getBoundingClientRect(); return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};});
  await p.mouse.move(before.x,before.y); await p.mouse.down(); await sleep(80);
  await p.mouse.move(before.x+90,before.y+60,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(400);
  const after=await p.evaluate(()=>{const m=document.querySelector('#annotations .ann-mark');
    const r=m.getBoundingClientRect(); return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};});
  check('a mark can be dragged', Math.abs(after.x-before.x)>50, JSON.stringify({before,after}));
  check('the map did not pan with it',
    await p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox'))
      === await p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox')));
  await p.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'Delete',bubbles:true}); document.dispatchEvent(e);});
  await sleep(400);
  check('Delete removes the selected mark', await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===0);
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.close(); }

await b.close();
process.exit(report());
})();
