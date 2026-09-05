/* The Kanji/Hanzi/Hanja switch: characters instead of romanisation, where the
 * map has them.
 *
 *     node tools/test/hanlabels.js        # with a server on 8123
 *
 * The switch's own wording is "When available", and that is the whole of the
 * contract — so the things worth guarding are not the spelling of any one
 * place but the three ways this can go wrong:
 *
 *   * **It blanks something.** A label with no characters must keep its
 *     romanisation. Java and Bengal have none at all, and if the switch
 *     emptied them a third of the map would go silent.
 *   * **It prints the wrong century.** Peking is 北平 on the 1930 map and
 *     北京 on the 1942 one, because the Nationalists demoted it in 1928 and
 *     the occupation restored the name. The record's `ja` says 北京 at both
 *     dates; only `EPOCH_OVERRIDES` knows better, and the first attempt at
 *     this read past it and put 北京 under a headline saying Běipíng.
 *   * **It says the same thing twice.** The characters become the headline,
 *     so they have to leave the line of other names — and the romanisation
 *     they displaced has to join it, or the reader who came in knowing
 *     "Hòulǐ" cannot find it anywhere on the card.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');for(const x of t){try{return require(x);}catch(e){}}
  console.error('hanlabels test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const { ready } = require('./settle.js');
let pass=0,fail=0;
const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);}
  else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)
  ?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}
  :o.call(window,q));};
const URL='http://localhost:8123/index.html';
const CJK=/[㐀-鿿]/;

const labels=p=>p.evaluate(()=>[...document.querySelectorAll('#labels text')]
  .map(e=>(e.textContent||'').trim()).filter(Boolean));
const card=p=>p.evaluate(()=>{const b=document.getElementById('info');
  const g=s=>{const e=b&&b.querySelector(s);return e&&!e.hidden?(e.textContent||'').trim():'';};
  return {chip:g('.chip'),prim:g('.primary'),alt:g('.alt')};});
const han=async(p,on)=>{ await p.evaluate(v=>{const x=document.getElementById('opt-han-labels');
  if(x && x.checked!==v) x.click();}, on); await sleep(1600); };

(async()=>{
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const errs=[];

console.log('\n— the switch is where the ask put it —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  const ui=await p.evaluate(()=>{
    const box=document.getElementById('opt-han-labels');
    const jp=document.getElementById('opt-jpnames');
    const row=box&&box.closest('label');
    const hint=row&&row.nextElementSibling;
    return {exists:!!box, checked:!!(box&&box.checked),
      text:row?(row.textContent||'').trim():'',
      hint:hint&&hint.classList.contains('hint')?(hint.textContent||'').trim():'',
      afterJp:!!(jp&&row&&(jp.closest('label').compareDocumentPosition(row)
                           &Node.DOCUMENT_POSITION_FOLLOWING))};
  });
  check('there is a switch for it', ui.exists);
  check('off until it is asked for', ui.exists && !ui.checked);
  check('worded as the ask worded it',
    ui.text==='When available, show labels and names in Kanji/Hanzi/Hanja', ui.text);
  check('with the note under it',
    ui.hint==='For now limited to Japan, Korea, Taiwan, China, Karafuto.', ui.hint);
  check('and it sits under Use Japanese names', ui.afterJp, String(ui.afterJp));
  await p.close();
}

console.log('\n— characters on the map, and nothing emptied —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await p.evaluate(()=>{
    document.querySelector('#layer-seg button[data-opt="labels"]').click();
    const c=document.querySelector('#layer-seg button[data-cat="city"]');
    if(c.getAttribute('aria-pressed')!=='true') c.click();});
  await sleep(1500);
  for(let i=0;i<3;i++){await p.evaluate(()=>document.getElementById('zoom-in').click());await sleep(400);}
  await sleep(1400);
  const off=await labels(p);
  await han(p,true);
  const on=await labels(p);
  check('the map is labelled before the switch is touched', off.length>50, String(off.length));
  check('and none of it was in characters', off.filter(t=>CJK.test(t)).length===0,
    String(off.filter(t=>CJK.test(t)).length));
  check('turning it on writes characters', on.filter(t=>CJK.test(t)).length>50,
    on.filter(t=>CJK.test(t)).length+' of '+on.length);
  /* The count of labels must not move: the switch changes what a label says,
     never whether there is one. A drop here is the "when available" contract
     broken — something with no characters went blank and stopped being drawn. */
  check('and not one label went missing', on.length===off.length,
    off.length+' before, '+on.length+' after');
  check('nothing came out blank', on.filter(t=>!t).length===0);
  /* Traditional for Chinese and Taiwanese, which is what the ask names: the
     simplified 台 would mean the wrong table had been reached for. */
  check('Taiwanese names are in traditional characters',
    on.indexOf('臺北')>=0 && on.indexOf('台北')<0, JSON.stringify(on.filter(t=>/北$/.test(t))));
  /* **Katakana is not one of the three scripts the switch names.**
     The first rule refused a field only when it was kana end to end, which let
     オホーツク海 and ベンガル湾 and タクラマカン砂漠 through on the strength of
     one character — sixty-six fields across the tables — while `zh` sat behind
     them holding 鄂霍次克海 and 孟加拉灣 and 塔克拉瑪干沙漠. So: with the switch
     on, nothing drawn may contain kana. `ヶ` is the exception and a real one,
     because 青ヶ島 has no other spelling. */
  const kana=on.filter(t=>/[\u30a0-\u30f5\u30f7-\u30fa\u3040-\u309f]/.test(t));
  check('and no label comes out in kana', kana.length===0, JSON.stringify(kana.slice(0,6)));
  check('a sea reads in characters, not katakana',
    on.indexOf('オホーツク海')<0, 'オホーツク海 still drawn');
  await han(p,false);
  const back=await labels(p);
  check('turning it off puts the romanisation back',
    back.filter(t=>CJK.test(t)).length===0, String(back.filter(t=>CJK.test(t)).length));
  await p.close();
}

console.log('\n— the right century’s characters —');
for (const [ep,want,wrong] of [['1930','北平','北京'],['1942','北京','北平']]) {
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  if(ep==='1942'){ await p.evaluate(()=>{const x=[...document.querySelectorAll('#epoch-seg button')]
    .find(y=>/1942/.test(y.textContent)); if(x)x.click();}); await sleep(3000); }
  await p.evaluate(()=>{
    document.querySelector('#layer-seg button[data-opt="labels"]').click();
    const c=document.querySelector('#layer-seg button[data-cat="city"]');
    if(c.getAttribute('aria-pressed')!=='true') c.click();});
  await sleep(1400);
  for(let i=0;i<3;i++){await p.evaluate(()=>document.getElementById('zoom-in').click());await sleep(400);}
  await han(p,true);
  const on=await labels(p);
  check('on the '+ep+' map Peking is '+want, on.indexOf(want)>=0,
    JSON.stringify(on.filter(t=>/北[平京]/.test(t))));
  check('and not '+wrong+' there', on.indexOf(wrong)<0, wrong+' found');
  await p.close();
}

console.log('\n— the card leads with them, and loses nothing —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await p.evaluate(()=>{const c=document.querySelector('#layer-seg button[data-cat="city"]');
    if(c.getAttribute('aria-pressed')!=='true') c.click();});
  await sleep(1400);
  const hit=async id=>{
    const at=await p.evaluate(k=>{const g=document.querySelector('.gaz[data-id$="_'+k+'"]');
      if(!g) return null; const r=g.getBoundingClientRect();
      const x=r.x+r.width/2,y=r.y+r.height/2;
      return (r.width>0&&x>0&&y>0&&x<innerWidth&&y<innerHeight)?{x,y}:null;},id);
    if(!at) return null;
    await p.mouse.click(at.x,at.y); await sleep(650); return card(p);
  };
  const before=await hit('shanghai');
  check('a city card opens', !!(before&&before.prim), JSON.stringify(before));
  await han(p,true);
  const after=await hit('shanghai');
  if (!before || !after) check('Shanghai was pressable', false, 'not on screen');
  else {
    check('the headline is the characters', after.prim==='上海', after.prim);
    check('and the romanisation it displaced is on the line below',
      after.alt.indexOf(before.prim)>=0, after.alt);
    check('which does not repeat the headline',
      after.alt.split('·').map(s=>s.trim()).indexOf(after.prim)<0, after.alt);
  }
  await p.close();
}

console.log('\n— a station too —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await p.evaluate(()=>{const x=document.getElementById('opt-tw-rail'); if(x&&!x.checked)x.click();});
  await sleep(1500);
  await p.evaluate(()=>{const x=document.getElementById('opt-tw-stations'); if(x&&!x.checked)x.click();});
  await sleep(2500);
  const at=await p.evaluate(()=>{const n=[...document.querySelectorAll('.sta-mark')]
      .map(e=>({r:e.getBoundingClientRect()}))
      .filter(o=>o.r.width>0&&o.r.x>0&&o.r.y>0&&o.r.x<innerWidth&&o.r.y<innerHeight);
    return n.length?{x:n[0].r.x+n[0].r.width/2,y:n[0].r.y+n[0].r.height/2}:null;});
  if(!at) check('a station was on screen to press', false, 'none');
  else {
    await p.mouse.click(at.x,at.y); await sleep(700);
    const off=await card(p);
    await han(p,true);
    await p.mouse.click(at.x,at.y); await sleep(700);
    const on=await card(p);
    check('a station card opens', off.chip==='Railway station', off.chip);
    check('its headline becomes the characters', CJK.test(on.prim), on.prim);
    check('with the reading beside it', on.alt.indexOf(off.prim)>=0, on.alt);
    check('and the characters are not repeated there',
      on.alt.split('·').map(s=>s.trim()).indexOf(on.prim)<0, on.alt);
  }
  await p.close();
}

console.log('\n— and it travels in a shared link —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await han(p,true);
  const url=await p.evaluate(()=>location.search);
  await p.goto(URL+url,{waitUntil:'networkidle0'}); await ready(p); await sleep(900);
  check('a link carrying the switch opens with it on',
    await p.evaluate(()=>document.getElementById('opt-han-labels').checked), url);
  await p.close();
}

console.log('\n— the hover says it the same way the card does —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await p.evaluate(()=>{const c=document.querySelector('#layer-seg button[data-cat="city"]');
    if(c.getAttribute('aria-pressed')!=='true') c.click();});
  await sleep(1500);
  const tipOf=async id=>{
    const at=await p.evaluate(k=>{const g=document.querySelector('.gaz[data-id$="_'+k+'"]');
      if(!g) return null; const r=g.getBoundingClientRect();
      const x=r.x+r.width/2,y=r.y+r.height/2;
      return (r.width>0&&x>0&&y>0&&x<innerWidth&&y<innerHeight)?{x,y}:null;},id);
    if(!at) return null;
    await p.mouse.move(at.x-4,at.y-4); await sleep(70);
    await p.mouse.move(at.x,at.y); await sleep(520);
    return p.evaluate(()=>{const t=document.getElementById('tooltip');
      if(!t||t.hidden) return null;
      const k=[...t.childNodes].map(n=>(n.textContent||'').trim()).filter(Boolean);
      return {head:k[0]||'', next:k[1]||''};});
  };
  const before=await tipOf('shanghai');
  await han(p,true);
  const after=await tipOf('shanghai');
  if(!before||!after) check('Shanghai was hoverable', false, 'no tooltip');
  else {
    /* The card and the map label lead with the characters; the tooltip is the
       third place a name is written and it was still putting the romanisation
       on top. One rule, three places. */
    check('the tooltip headline is the characters', after.head==='上海', after.head);
    check('and the romanisation it displaced is the line under it',
      after.next.indexOf(before.head)>=0, JSON.stringify(after));
    /* The tooltip is cached on what it says rather than rebuilt per move, so
       the switch has to be part of that key or a tooltip already on the screen
       keeps the romanisation until the pointer leaves and comes back. */
    check('and it did not have to be re-entered to change', after.head!==before.head,
      before.head+' -> '+after.head);
  }
  await p.close();
}

console.log('\n— one label to a place —');
{
  const p=await browser.newPage(); await p.setViewport({width:1500,height:980});
  p.on('pageerror',e=>errs.push(String(e)));
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(URL,{waitUntil:'networkidle0'}); await ready(p);
  await p.evaluate(()=>{
    document.querySelector('#layer-seg button[data-opt="labels"]').click();
    const c=document.querySelector('#layer-seg button[data-cat="city"]');
    if(c.getAttribute('aria-pressed')!=='true') c.click();});
  await sleep(1500);
  for(let i=0;i<5;i++){await p.evaluate(()=>document.getElementById('zoom-in').click());await sleep(400);}
  await han(p,true); await sleep(600);
  /* Fifty-one gazetteer cities carry a curated site record too and the site's
     marker is drawn over the dot. Both used to write a name a few pixels
     apart, which at Hankou read as 漢口 over 漢口. The dot yields to the marker
     now. Jilin and Ningxia stay doubled and should: a province and its capital
     genuinely share those names, and the Jilin pair was doubled under the
     romanisation too. */
  const seen=await labels(p);
  const count=t=>seen.filter(x=>x===t).length;
  check('Hankou is named once, not twice', count('漢口')<=1, String(count('漢口')));
  const twins=seen.filter((t,i)=>seen.indexOf(t)!==i);
  const allowed=['吉林','寧夏'];
  const unexpected=[...new Set(twins)].filter(t=>allowed.indexOf(t)<0);
  check('and no other place is written twice', unexpected.length===0,
    JSON.stringify(unexpected.slice(0,6)));
  await p.close();
}

check('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
await browser.close();
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
})();
