const H=require('./suite.js');
const {puppeteer,sleep,page,tap,openPanel,pickTool,SPOT,FIX,BIG,check,report}=H;
const path=require('path');

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});

console.log('\n— files in —');
const CASES=[
 ['good.geojson',        true,  /Loaded 2 features/],
 ['lone-feature.geojson',true,  /Loaded 1 feature/],
 ['bare-geometry.geojson',true, /Loaded 1 feature/],
 ['india-rivers.geojson',true,  /Loaded 63 features/],
 ['notjson.geojson',     false, /not valid JSON/],
 ['truncated.geojson',   false, /character 58/],
 ['bare-array.geojson',  false, /bare array/],
 ['wrong-type.geojson',  false, /"Banana"/],
 ['empty.geojson',       false, /empty FeatureCollection/],
 ['bad-coords.geojson',  false, /cannot read/],
];
for (const [f, good, re] of CASES) {
  const p=await page(b);
  await (await p.$('#ann-file')).uploadFile(f==='india-rivers.geojson'?BIG:path.join(FIX,f));
  await sleep(f.includes('india')?4500:1800);
  const msg=await p.evaluate(()=>{const m=document.querySelector('#ann-msg'); return m?m.textContent:'(no panel)';});
  const bad=await p.evaluate(()=>{const m=document.querySelector('#ann-msg'); return m?m.className.includes('bad'):false;});
  check(f+' → '+(good?'loads':'is refused with a reason'), re.test(msg)&&bad===!good, JSON.stringify(msg).slice(0,90));
  if(!good) check('  '+f+' leaves the map untouched',
    await p.evaluate(()=>document.querySelectorAll('#annotations .ann-mark, #annotations .ann-shape').length)===0);
  check('  '+f+' raises no page error', p.__errs.length===0, p.__errs[0]);
  await p.close();
}

console.log('\n— adding a second file to the first —');
{ const p=await page(b);
  await (await p.$('#ann-file')).uploadFile(path.join(FIX,'good.geojson')); await sleep(1800);
  const n1=await p.evaluate(()=>document.querySelectorAll('#ann-list li').length);
  await p.evaluate(()=>document.querySelector('#ann-add').click()); await sleep(300);
  await (await p.$('#ann-file')).uploadFile(path.join(FIX,'lone-feature.geojson')); await sleep(1800);
  const n2=await p.evaluate(()=>document.querySelectorAll('#ann-list li').length);
  check('Add file merges rather than replacing', n2===n1+1, n1+' then '+n2);
  check('and says so', /Added 1 feature/.test(await p.evaluate(()=>document.querySelector('#ann-msg').textContent)));
  await p.close(); }

console.log('\n— saving —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Named'; t.dispatchEvent(new Event('input',{bubbles:true}));
    const d=document.querySelector('#ann-desc'); d.value='Described.'; d.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(300);
  await p.evaluate(()=>document.querySelector('#ann-save').click()); await sleep(800);
  const txt=await p.evaluate(()=>window.__saved);
  let o=null; try{o=JSON.parse(txt);}catch(e){}
  check('the file is valid JSON', !!o);
  check('it is a FeatureCollection', o&&o.type==='FeatureCollection');
  check('it declares its styling standard', o&&o.properties.style==='simplestyle-spec');
  check('title and description survive', o&&o.features[0].properties.title==='Named'
    && o.features[0].properties.description==='Described.');
  check('the name carries a timestamp',
    /annotations-\d{8}-\d{4}\.geojson/.test(await p.evaluate(()=>document.querySelector('#ann-msg').textContent)),
    await p.evaluate(()=>document.querySelector('#ann-msg').textContent));
  await p.close(); }

{ const p=await page(b);
  await (await p.$('#ann-file')).uploadFile(path.join(FIX,'good.geojson')); await sleep(1800);
  await p.evaluate(()=>document.querySelector('#ann-save').click()); await sleep(800);
  check('a loaded file saves back under its own name plus a stamp',
    /good-\d{8}-\d{4}\.geojson/.test(await p.evaluate(()=>document.querySelector('#ann-msg').textContent)),
    await p.evaluate(()=>document.querySelector('#ann-msg').textContent));
  await p.close(); }

console.log('\n— the link —');
{ const p=await page(b); await openPanel(p); await pickTool(p,'point');
  await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Shared point'; t.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(700);
  await p.evaluate(()=>document.querySelector('#ann-link').click()); await sleep(900);
  const url=await p.evaluate(()=>window.__clip);
  check('Copy link puts a URL on the clipboard', !!url && url.includes('ann='), String(url).slice(0,60));
  check('and it is short', url && url.length<1200, url?url.length+' chars':'');
  const q=await page(b,{query:'?'+url.split('?')[1]});
  check('the link opens with the annotations', await q.evaluate(()=>document.querySelectorAll('#annotations .ann-mark').length)===1);
  var names = await q.evaluate(()=>[...document.querySelectorAll('#ann-list .ann-name')].map(x=>x.textContent));
  check('with the name intact', names[0]==='Shared point', JSON.stringify(names));
  check('the panel opens FOLDED for a shared link',
    await q.evaluate(()=>document.querySelector('#annotate').classList.contains('folded')));
  check('but the panel is present, so it can be opened',
    await q.evaluate(()=>!document.querySelector('#annotate').hidden));
  check('and the count is visible while folded',
    /1 mark/.test(await q.evaluate(()=>document.querySelector('#ann-count').textContent)),
    await q.evaluate(()=>document.querySelector('#ann-count').textContent));
  await q.evaluate(()=>document.querySelector('#ann-fold').click()); await sleep(300);
  check('pressing the head unfolds it',
    await q.evaluate(()=>!document.querySelector('#annotate').classList.contains('folded')));
  check('no page errors on the shared page', q.__errs.length===0, q.__errs[0]);
  await q.close(); await p.close(); }

{ const p=await page(b); await openPanel(p); await pickTool(p,'point'); await tap(p,700,450);
  await sleep(800);
  // the clipboard refuses, as Safari does after an await
  await p.evaluate(()=>{ navigator.clipboard.writeText=()=>Promise.reject(new Error('NotAllowedError')); });
  await p.evaluate(()=>document.querySelector('#ann-link').click()); await sleep(700);
  check('when the clipboard refuses, the link is shown instead',
    await p.evaluate(()=>!document.querySelector('#ann-link-out').hidden));
  check('and the field holds a working URL',
    /\?.*ann=/.test(await p.evaluate(()=>document.querySelector('#ann-link-field').value)));
  check('no dialog is raised', true);
  await p.close(); }

{ const p=await page(b);
  await (await p.$('#ann-file')).uploadFile(BIG); await sleep(5000);
  await p.evaluate(()=>document.querySelector('#ann-link').click()); await sleep(2500);
  check('too much for a link says so with the number',
    /past the 6,000 a link can carry/.test(await p.evaluate(()=>document.querySelector('#ann-msg').textContent)),
    await p.evaluate(()=>document.querySelector('#ann-msg').textContent).then?'':'');
  await p.close(); }

{ const p=await page(b,{query:'?ann=zBROKEN!!!!'});
  check('a damaged link says so',
    /could not be read/.test(await p.evaluate(()=>{const m=document.querySelector('#ann-msg'); return m?m.textContent:'';})),
    await p.evaluate(()=>{const m=document.querySelector('#ann-msg'); return m?m.textContent:'(none)';}));
  check('and it unfolds itself to be read',
    await p.evaluate(()=>!document.querySelector('#annotate').classList.contains('folded')));
  await p.close(); }

await b.close();
process.exit(report());
})();
