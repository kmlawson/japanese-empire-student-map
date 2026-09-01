/* One ladder for how big a point is drawn, and one rule for when it thins out.
 *
 *     node tools/test/pointsize.js       # with a server on 8123
 *
 * A curated point and a gazetteer point of the same size have to be the same
 * size — they share `SIZE_R` for exactly that reason — and the zoom rule that
 * hides the small ones has to be one rule, asked of both.
 *
 * The thing this test exists to protect is the *default*. Every curated point
 * used to be drawn at every zoom, and 125 of the 126 still say nothing about
 * their size, so 125 of them must still be drawn at every zoom. Filling `size`
 * is what opts a point into thinning; leaving it blank has to leave it alone.
 * And `always` — the rule the fourteen 府 of colonial Korea are on, spelled
 * `a` in the gazetteer — has to survive that, at the widest view of all.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('pointsize test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const URL='http://localhost:8123/index.html';

const shown=(p,id)=>p.evaluate(i=>{
  const g=document.getElementById('s-'+i);
  return !!g && g.style.display!=='none' && g.getBoundingClientRect().width>0;
},id);

const dotR=(p,id)=>p.evaluate(i=>{
  const g=document.getElementById('s-'+i); if(!g) return null;
  const c=g.querySelector('circle.dot');
  if(c) return +c.getAttribute('r');
  const path=g.querySelector('path.dot');
  if(path){const m=/M0 (-[\d.]+)/.exec(path.getAttribute('d'));
    return m?-parseFloat(m[1])-1.2:null;}
  const r=g.querySelector('rect.dot');
  return r?+r.getAttribute('width')/2:null;
},id);

/* Widen to the whole sheet, which is the view the reader opens on and the one
   where the thinning bites hardest. */
const wideOut=async p=>{
  for(let i=0;i<40;i++)
    await p.evaluate(()=>{const b=document.getElementById('zoom-out'); if(b) b.click();});
  await sleep(400);
};
const zoomIn=async (p,n)=>{
  for(let i=0;i<n;i++)
    await p.evaluate(()=>{const b=document.getElementById('zoom-in'); if(b) b.click();});
  await sleep(400);
};

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:900});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle0'});
  await sleep(1200);
  /* Rabaul and Port Moresby are points of the 1942 sheet and the map opens on
     1930, so the epoch is switched by pressing the reader's own button. The
     first version of this test set an `#e=1942` hash that means nothing to the
     page, stayed on 1930, and read the two as hidden — which they honestly
     are, on that sheet. A test that opens on the wrong map measures nothing. */
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#epoch-seg button')]
      .find(x=>/1942/.test(x.textContent));
    if(b) b.click();
  });
  await sleep(2400);
  /* Both are off at first load — that is the opening state the map is meant
     to have — so they are switched on here rather than assumed. */
  await page.evaluate(()=>{
    ['city','battle'].forEach(c=>{
      const b=document.querySelector('#layer-seg button[data-cat="'+c+'"]');
      if(b && b.getAttribute('aria-pressed')!=='true') b.click();
    });
  });
  await sleep(600);

  console.log('\n— the ladder is one ladder —');
    const r=await page.evaluate(()=>{
    // the gazetteer's radii, read off the dots it actually drew
    const out={};
    document.querySelectorAll('#gaz g[data-id] circle.dot').forEach(c=>{
      const v=+c.getAttribute('r'); out[v]=(out[v]||0)+1;
    });
    return out;
  });
  const radii=Object.keys(r).map(Number).sort((a,b)=>a-b);
  check('the gazetteer draws only ladder radii',
        radii.every(v=>[2.5,3.4,4.4,5.8].includes(v)), JSON.stringify(radii));

  console.log('\n— Rabaul is medium, Port Moresby large —');
  const rr=await dotR(page,'rabaul'), pm=await dotR(page,'portmoresby');
  check('Rabaul is drawn at the medium radius', rr===3.4, 'r='+rr);
  check('Port Moresby is drawn at the large radius', pm===4.4, 'r='+pm);
  check('Rabaul is smaller than Port Moresby', rr<pm, rr+' vs '+pm);
  check('and both differ from the old fixed 5.5', rr!==5.5 && pm!==5.5);

  /* The map opens on the whole sheet, so the opening view *is* the widest and
     there is nothing to zoom out of. That is the view the reader is asking
     about when they say a place should or should not be there at max zoom. */
  console.log('\n— and the zoom rule tells them apart —');
  const wide=await page.evaluate(()=>+document.getElementById('jmap')
    .getAttribute('viewBox').split(/\s+/)[2]);
  check('the opening view is the whole sheet', wide>1000, 'w='+wide);
  check('Rabaul is not drawn at the widest view', !(await shown(page,'rabaul')));
  check('Port Moresby is drawn at the widest view', await shown(page,'portmoresby'));

  console.log('\n— the always rule survives, which is what it is for —');
  const always=await page.evaluate(()=>{
    const g=(JMAP.GAZ&&JMAP.GAZ['e1942'])||[];
    const pinned=g.filter(c=>c.a!==undefined);
    let drawn=0;
    pinned.forEach(c=>{
      /* The gazetteer namespaces its ids by epoch — `g_e1942_seoul` — because
         the same place is a separate element on each sheet. And four of the
         fourteen are curated as well, drawn as a marker over the dot, so
         either element standing is the place being on the map. */
      const el=document.querySelector(
            '#gaz g[data-epoch="e1942"][data-id="g_e1942_'+c.id+'"]')
            || document.getElementById('s-'+c.id);
      if(el && el.style.display!=='none') drawn++;
    });
    return {n:pinned.length, drawn:drawn};
  });
  check('there are pinned places to protect', always.n>0, 'n='+always.n);
  check('every pinned place is drawn at the widest view',
        always.drawn===always.n, always.drawn+' of '+always.n);

  /* The default is the thing worth guarding. 125 of the 126 curated points
     say nothing about their size, and every one of them was drawn at every
     zoom before there was a ladder to put them on — so the set drawn at the
     widest view and the set drawn deep in have to be the same set. */
  const blankSet=()=>page.evaluate(()=>JMAP.SITES
    .filter(s=>!s.size)
    .filter(s=>{const el=document.getElementById('s-'+s.id);
                return el && el.style.display!=='none';})
    .map(s=>s.id).sort().join(','));
  const wideBlanks=await blankSet();

  console.log('\n— Rabaul comes back on the way in —');
  await zoomIn(page,6);
  const nowW=await page.evaluate(()=>+document.getElementById('jmap')
    .getAttribute('viewBox').split(/\s+/)[2]);
  check('the view really narrowed', nowW<wide/3, nowW+' from '+wide);
  check('Rabaul is drawn once the reader closes in', await shown(page,'rabaul'));

  console.log('\n— a blank size still means every zoom —');
  const deepBlanks=await blankSet();
  check('there are unsized points to protect', wideBlanks.length>0);
  check('not one of them changed with the zoom', wideBlanks===deepBlanks,
        'wide '+wideBlanks.split(',').length+' vs deep '+deepBlanks.split(',').length);

  /* The four the gazetteer used to lend a weight to. `sizePinnedMarkers` read
     it off the other table; the records say it themselves now, so the sizes
     must be unchanged — and Inch'ŏn must still differ by date, which is the
     part a single column could not have carried. */
  console.log('\n— the four that used to borrow their weight —');
  const four=await page.evaluate(()=>{
    const out={};
    ['seoul','pusan','pyongyang','incheon'].forEach(id=>{
      const g=document.getElementById('s-'+id);
      const c=g&&g.querySelector('circle.dot');
      out[id]=c?+c.getAttribute('r'):null;
    });
    return out;
  });
  check('Keijō is drawn large, as the gazetteer pinned it', four.seoul===4.4, String(four.seoul));
  check('Pusan medium', four.pusan===3.4, String(four.pusan));
  check('P’yŏngyang medium', four.pyongyang===3.4, String(four.pyongyang));
  check('Inch’ŏn medium on the 1942 sheet', four.incheon===3.4, String(four.incheon));
  check('and none of the four is the old fixed 5.5',
        Object.keys(four).every(k=>four[k]!==5.5), JSON.stringify(four));

  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#epoch-seg button')].find(x=>/1930/.test(x.textContent));
    if(b) b.click();
  });
  await sleep(2600);
  const i30=await page.evaluate(()=>{
    const c=document.querySelector('#s-incheon circle.dot');
    return c?+c.getAttribute('r'):null;
  });
  check('Inch’ŏn is a step smaller on the 1930 sheet, as it was pinned there',
        i30===2.5, String(i30));
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#epoch-seg button')].find(x=>/1942/.test(x.textContent));
    if(b) b.click();
  });
  await sleep(2600);

  console.log('\n— the subtypes reached the markers —');
  const subs=await page.evaluate(()=>{
    const out={};
    document.querySelectorAll('#markers g.site[data-subtype]').forEach(g=>{
      out[g.getAttribute('data-id')]=g.getAttribute('data-subtype');
    });
    return out;
  });
  check('Ashio is a mine', subs.ashio==='mine', JSON.stringify(subs));
  check('Ōkunoshima is a works', subs.okunoshima==='works');
  check('the Suihō dam is a dam', subs.supung==='dam');
  check('Côn Sơn is a prison', subs.consan==='prison');

  check('no page errors', errs.length===0, errs.join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
