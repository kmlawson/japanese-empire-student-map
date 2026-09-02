/* An island takes its prefecture's colour, not its country's.
 *
 *     node tools/test/islands.js         # with a server on 8123
 *
 * The bug this pins is one line of the stylesheet — the fine coastlines carry
 * no colour of their own, they are their atom's shapes drawn better — which
 * put every island no table names into *Japan proper's red* on a map shading
 * Japan's prefectures. The check is therefore about hue and not about class:
 * a reddish island inside a shaded atom is the fault, whatever it is called
 * and however it got there.
 *
 * Two things beyond that. The Ryukyus have to come out in *two* bands, because
 * the Amami group was Kagoshima and the Okinawa group Okinawa, and a rule that
 * painted the whole chain one colour would look right and be wrong. And the
 * Shōdoshima group has to stay blank: its box holds Inujima, which is Okayama,
 * so the table leaves it out on purpose and this test says so — if somebody
 * fills it in island by island, this check is the one to update.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('islands test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const { ready } = require('./settle.js');
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const URL='http://localhost:8123/index.html';

const at=(p,lon,lat)=>p.evaluate((lo,la)=>{
  const svg=document.getElementById('jmap'),pt=svg.createSVGPoint(),m=svg.getScreenCTM();
  const q=window.JMAP_GEO.project(lo,la);
  pt.x=q.x!==undefined?q.x:q[0];pt.y=q.y!==undefined?q.y:q[1];
  const s=pt.matrixTransform(m);return {x:s.x,y:s.y};},lon,lat);

/* Zoom in on a place with the wheel, which zooms toward the pointer. Stops if
   the target leaves the frame, so a miss is a short zoom and not a wild one. */
const zoomTo=async(p,lon,lat,n)=>{
  for(let i=0;i<n;i++){
    const s=await at(p,lon,lat);
    if(s.x<0||s.x>940||s.y<110||s.y>880) break;
    await p.mouse.move(s.x,s.y); await p.mouse.wheel({deltaY:-200}); await sleep(110);
  }
  await sleep(2600);
};

const fineIn=p=>p.evaluate(()=>{
  const lit={};
  document.querySelectorAll('#land [data-prov].pop-shaded').forEach(e=>{
    if(e.parentNode&&e.parentNode.id) lit[e.parentNode.id]=(lit[e.parentNode.id]||0)+1;});
  const out=[];
  document.querySelectorAll('#land .atom > path.fine').forEach(e=>{
    if(!e.parentNode||!lit[e.parentNode.id]) return;
    const f=getComputedStyle(e).fill||'';
    const m=/rgba?\((\d+), (\d+), (\d+)/.exec(f);
    const rgb=m?[+m[1],+m[2],+m[3]]:null;
    const nm=e.getAttribute('data-prov');
    const rec=nm&&JMAP.PROVINCES?JMAP.PROVINCES[nm]:null;
    out.push({n:nm||'(unnamed)', own:!!(rec&&rec.part_of),
              g:e.getAttribute('data-group')||'', atom:e.parentNode.id, fill:f,
              red: !!rgb && rgb[0]>rgb[1]+40 && rgb[0]>rgb[2]+40,
              white: !!rgb && rgb[0]>250 && rgb[1]>250 && rgb[2]>250});
  });
  return {lit, isl: out};
});

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:900});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle0'});
  await ready(page);
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#epoch-seg button')].find(x=>/1942/.test(x.textContent));
    if(b) b.click();
  });
  await sleep(2500);
  await page.evaluate(()=>{
    const b=document.querySelector('#layer-seg button[data-cat="territory"]');
    if(b && b.getAttribute('aria-pressed')!=='true') b.click();
  });
  await sleep(900);

  console.log('\n— the group table reached the page —');
  const G=await page.evaluate(()=>JMAP.ISLAND_GROUPS||null);
  check('there is a group table', !!G && Object.keys(G).length>=16,
        G?Object.keys(G).length+' groups':'absent');
  check('the Oki Islands are Shimane', G && G['Oki Islands']==='Shimane');
  check('the Amami Islands are Kagoshima', G && G['Amami Islands']==='Kagoshima');
  check('the Yaeyamas are Okinawa', G && G['Yaeyama Islands']==='Okinawa');
  check('Shōdoshima is deliberately absent', !!G && !G['Shōdoshima'],
        'its box holds Inujima, which is Okayama');
  check('Amakusa is deliberately absent', !!G && !G['Amakusa Islands']);

  await page.evaluate(()=>document.querySelector('#opt-pop-japan-density-density').click());
  await sleep(1600);

  console.log('\n— the Ryukyus, in two bands —');
  await zoomTo(page,127.8,26.3,13);
  const r=await fineIn(page);
  const ryu=r.isl.filter(i=>i.atom==='a-ryukyu');
  check('the chain is drawn', ryu.length>100, ryu.length+' islands');
  check('not one of them is red', ryu.every(i=>!i.red),
        ryu.filter(i=>i.red).map(i=>i.n).slice(0,5).join(', '));
  check('not one of them is blank', ryu.every(i=>!i.white),
        ryu.filter(i=>i.white).map(i=>i.n).slice(0,5).join(', '));
  const byGroup=g=>new Set(ryu.filter(i=>i.g===g).map(i=>i.fill));
  const oki=byGroup('Okinawa Islands'), ama=byGroup('Amami Islands');
  check('Okinawa is one colour', oki.size===1, [...oki].join(' | '));
  check('Amami is one colour', ama.size===1, [...ama].join(' | '));
  check('and the two are different colours',
        oki.size===1 && ama.size===1 && [...oki][0]!==[...ama][0],
        [...oki][0]+' vs '+[...ama][0]);

  console.log('\n— the Inland Sea, where the red specks were —');
  await page.goto(URL,{waitUntil:'networkidle0'});
  await ready(page);
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#epoch-seg button')].find(x=>/1942/.test(x.textContent));
    if(b) b.click();
  });
  await sleep(2500);
  await page.evaluate(()=>{
    const b=document.querySelector('#layer-seg button[data-cat="territory"]');
    if(b && b.getAttribute('aria-pressed')!=='true') b.click();
  });
  await sleep(900);
  await page.evaluate(()=>document.querySelector('#opt-pop-japan-density-density').click());
  await sleep(1600);
  await zoomTo(page,134.05,34.42,14);
  const s=await fineIn(page);
  const jp=s.isl.filter(i=>i.atom==='a-japan');
  check('islands are drawn there', jp.length>40, jp.length+' islands');
  check('not one of them is red', jp.every(i=>!i.red),
        jp.filter(i=>i.red).map(i=>i.n).slice(0,6).join(', '));
  /* Present *and* coloured. This read `!e || …` at first, which passes when
     the island is not there at all — a check that reports green for the very
     failure it exists to catch. */
  const named=['Sado Island','Awaji Island','Tsushima Island']
    .map(n=>jp.filter(i=>i.n===n)[0]);
  check('Sado, Awaji and Tsushima are all three drawn',
        named.every(Boolean),
        named.map((e,i)=>e?'ok':['Sado','Awaji','Tsushima'][i]+' missing').join(', '));
  check('and all three are coloured, neither red nor blank',
        named.every(e=>e && !e.red && !e.white),
        named.map(e=>e?(e.red?'red':e.white?'blank':'ok'):'missing').join(', '));
  const shodo=jp.filter(i=>i.g==='Shōdoshima');
  /* Blank unless the island names its own parent. Shōdoshima itself does —
     it is one of the twenty-eight — and an island-level `part_of` is meant to
     beat the group, so the four that carry one stay coloured. What has to be
     blank is the rest: the ones the table could only have guessed at. */
  check('the Shōdoshima group is blank except where an island names its own',
        shodo.length>0 && shodo.every(i=>i.own ? !i.white : i.white),
        shodo.length+' islands, '+shodo.filter(i=>i.own).length+' with a record, '
        +shodo.filter(i=>i.white).length+' blank');

  check('no page errors', errs.length===0, errs.join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
