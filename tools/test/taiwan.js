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
await p.goto('http://localhost:8123/index.html?layers='+code(8,512,4194304)+TAIWAN,{waitUntil:'networkidle0'});
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

/* A prefecture is the dissolve of its own districts, so the outline drawn
   round it can only ever run along edges the map has actually filled. Both
   halves of that have gone wrong once:

     * the prefectures were taken from a second sheet, and it was the **1926**
       one while the districts are 1930. Its 澎湖廳 carried 131 rings and
       143 km² against the districts' 18 and 128.
     * and then, dissolved from the right units, they were emitted at full
       precision while the districts were thinned to a tenth and their small
       islands dropped below a floor. Eighteen rings outlined, eleven filled.

   Both showed the reader the same thing: rings in the strait round nothing.
   Hoko-cho is the case that can be checked exactly — it has no 蕃地, so its
   outline is its districts and not merely along them. */
console.log('\n— the outline round a prefecture traces ground the map has drawn —');
{
  /* Ring for ring, by where each one is. Not by the path strings: a dissolve
     starts a ring wherever it picked up the chain, and the thinning that
     follows keeps a different vertex or two for having begun somewhere else.
     Four of the eleven differ by one point that way. What has to match is the
     island — which one, and how big — so the boxes are compared, to a
     hundredth of a unit. */
  const same = await p.evaluate(() => {
    const boxes = d => {
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.querySelector('svg').appendChild(probe);
      const out = (d.match(/M[^M]*/g) || []).map(one => {
        probe.setAttribute('d', one); const b = probe.getBBox();
        return [b.x, b.y, b.width, b.height];
      }).sort((u, v) => u[0] - v[0] || u[1] - v[1]);
      probe.remove(); return out;
    };
    const shu = document.querySelector('[data-shu="TwShuHoko"]');
    return { shu: shu ? boxes(shu.getAttribute('d')) : [],
             dis: boxes([...document.querySelectorAll('[data-parent="TwShuHoko"]')]
               .map(e => e.getAttribute('d')).join('')) };
  });
  const off = same.shu.length === same.dis.length
    ? same.shu.map((b, i) => Math.max(...b.map((v, j) => Math.abs(v - same.dis[i][j]))))
    : [];
  check('Hoko-cho is outlined on exactly the islands it is filled on',
    same.shu.length > 1 && same.shu.length === same.dis.length
      && Math.max(...off) < 0.02,
    same.shu.length + ' rings outlined, ' + same.dis.length + ' filled, '
      + 'worst disagreement ' + (off.length ? Math.max(...off).toFixed(3) : '-') + ' units');

  /* And for the other seven — which do reach into the 蕃地, so their outline is
     not their districts — no piece of the outline may sit over open water. */
  const orphans = await p.evaluate(() => {
    const bad = [];
    document.querySelectorAll('[data-shu]').forEach(shu => {
      const key = shu.getAttribute('data-shu');
      const fills = [...document.querySelectorAll('[data-parent="' + key + '"],'
                                                  + '[data-prov="TwBanchi"]')]
        .map(e => e.getBBox());
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shu.parentNode.appendChild(probe);
      (shu.getAttribute('d').match(/M[^M]*/g) || []).forEach(d => {
        probe.setAttribute('d', d);
        const b = probe.getBBox();
        const over = fills.some(f => b.x < f.x + f.width + 0.5 && f.x < b.x + b.width + 0.5
                                  && b.y < f.y + f.height + 0.5 && f.y < b.y + b.height + 0.5);
        if (!over) bad.push(key + ' ' + [b.x, b.y, b.width, b.height].map(Math.round).join(','));
      });
      probe.remove();
    });
    return bad;
  });
  check('and no prefecture is outlined over open water', orphans.length === 0,
    orphans.slice(0, 4).join(' | '));
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
  /* The title is the name the place had at the time, and the brackets are how
     to find it now: the Pinyin of the same characters, then the spelling a
     reader is likelier to have met where that differs. Four of the cities used
     to be the other way round — `Pingtung (Heitō)` — which put the modern name
     where every other place on the map puts the contemporary one. */
  check('the district is titled in Japanese with the Pinyin after it',
    /Kagi-gun \(Jiāyì, Chiayi\)/.test(tip), tip.slice(0,60));
}

console.log('\n— the 蕃地 is one shape, and points at no prefecture —');
{
  const at=await hoverProv(p,'TwBanchi');
  check('it can be pointed at', !!at);
  const tip=await p.evaluate(()=>{const t=document.querySelector('#tip,#tooltip');
    return t?t.textContent:'';});
  check('and it is called Taiwan Indigenous Peoples',
    /Taiwan Indigenous Peoples/.test(tip), tip.slice(0,60));
  /* And the administration's own word for it is *not* in the tooltip. 蕃 is
     "savage", and the tooltip is where a reader meets a place with no context
     round it — the term belongs in the card, once, in the sentence that says
     whose demarcation it was, and nowhere a name would go. */
  check('and the colonial term is not used as its name', !/蕃/.test(tip),
    tip.slice(0,90));
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

console.log('\n— a book title in a note is set in italics, not in asterisks —');
{
  await hoverProv(p,'TwBanchi');
  const at=await p.evaluate(()=>{
    const el=document.querySelector('[data-prov="TwBanchi"]');
    const bb=el.getBBox(), svg=el.ownerSVGElement, m=svg.getScreenCTM(), q=svg.createSVGPoint();
    for(let fy=0.2;fy<0.9;fy+=0.08) for(let fx=0.2;fx<0.9;fx+=0.08){
      q.x=bb.x+bb.width*fx; q.y=bb.y+bb.height*fy;
      const s2=q.matrixTransform(m);
      if(document.elementFromPoint(s2.x,s2.y)===el) return [s2.x,s2.y];
    } return null;});
  if(at){
    await p.mouse.move(at[0],at[1]); await sleep(300);
    await p.mouse.down(); await sleep(60); await p.mouse.up(); await sleep(900);
  }
  const note=await p.evaluate(()=>{
    const n=document.querySelector('#info .note-own');
    return n ? {em:[...n.querySelectorAll('em')].map(e=>e.textContent),
                stars:(n.textContent.match(/\*/g)||[]).length} : null;});
  check('the card is open on it', !!note);
  check('the title is a real <em>', !!note && note.em.length===1
    && /Outcasts of Empire/.test(note.em[0]), JSON.stringify(note));
  check('and not one asterisk is left on screen', !!note && note.stars===0,
    JSON.stringify(note));
  /* The same card is lent to the annotation panel to show a description that
     arrived in a link from a stranger, so the parser may only ever produce
     text, <em> and <strong> — never markup it was handed. */
  const safe=await p.evaluate(() => {
    const n=document.querySelector('#info .note-own');
    return {bad: !!n.querySelector('script,iframe,img,object,embed,style,link,form'),
            // the card appends its own source link inside this element; the
            // parser's own output is only ever text, <em> and <strong>
            marks: [...n.querySelectorAll('em,strong')].length};});
  check('and it grew nothing the parser cannot make',
    !safe.bad && safe.marks >= 1, JSON.stringify(safe));
}

console.log('\n— and the names layer writes prefectures, not districts —');
{
  await p.goto('http://localhost:8123/index.html?layers='+code(16,8,512,4194304)+TAIWAN,
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

/* And the cities under the same rule.
 *
 * Four of them were the other way round — `Pingtung (Heitō)`, `Changhua
 * (Shōka)`, `Yilan (Giran)`, `Taitung (Taitō)` — which put the modern name
 * where every other place on the map puts the contemporary one. They are drawn
 * from `texts/browse.csv`, which is a third list beside `texts/sites/sites.csv`
 * and `data/cities-*.csv`; the first pass at this changed the other two and
 * the map went on drawing the old names, so all three are checked here.
 *
 * What the map draws is the name alone: `mapLabel` strips a trailing bracket
 * so the romanisations stay in the card and off the island. Makō had a comma
 * and "Pescadores" *after* its bracket, which defeats that, and the label read
 * "Makō (Makung), Pescadores" across the strait.
 */
console.log('\n— and the cities are named the same way —');
{
  // bit 22: this file is about the Japanese naming, which is a switch now
  await p.goto('http://localhost:8123/index.html?layers='
    + ((1<<1)|(1<<4)|(1<<5)|(1<<6)|(2<<8)|(1<<22)).toString(36)
    + '&bbox=118.5,21.3,123,25.8', {waitUntil:'networkidle0'});
  await sleep(3200);
  const drawn = await p.evaluate(()=>[...document.querySelectorAll('#browse text, text.blabel')]
    .filter(e=>e.textContent.trim() && e.getBoundingClientRect().width>0)
    .map(e=>e.textContent));
  const WANT = ['Kīrun','Taichū','Shinchiku','Kagi','Karenkō','Shōka','Heitō','Taitō','Giran'];
  const missing = WANT.filter(w=>drawn.indexOf(w)<0);
  check('every city is drawn under its Japanese name', missing.length===0,
    'missing '+missing.join(',')+' — drawn: '+drawn.join(' | '));
  const modern = drawn.filter(t=>/^(Keelung|Taichung|Hsinchu|Chiayi|Hualien|Changhua|Pingtung|Taitung|Yilan|Kirun)$/.test(t));
  check('and not one of them under a modern one', modern.length===0, modern.join(','));
  check('no romanisation is painted on the island',
    drawn.every(t=>t.indexOf('(')<0), drawn.filter(t=>t.indexOf('(')>=0).join(' | '));
  check('Makō still says where it is', drawn.indexOf('Makō, Pescadores')>=0,
    drawn.join(' | '));
  /* And the brackets are in the record, which is what the tooltip and the card
     read — so a reader who points at Kīrun is told it is Jilong and Keelung. */
  const recs = await p.evaluate(()=>{
    const out={}; ['keelung','pingtung','makung','taipei'].forEach(id=>{
      const all=[].concat(JMAP.BROWSE||[], JMAP.SITES||[]);
      const r=all.filter(x=>x.id===id).map(x=>x.en);
      if(r.length) out[id]=r;});
    return out;});
  check('the record carries the Pinyin and the familiar spelling',
    /Jīlóng, Keelung/.test((recs.keelung||[]).join())
    && /Píngdōng, Pingtung/.test((recs.pingtung||[]).join())
    && /Mǎgōng, Makung/.test((recs.makung||[]).join())
    && (recs.taipei||[]).every(v=>/Táiběi, Taipei/.test(v)),
    JSON.stringify(recs));
}

/* Every place on the map says something about itself.
 *
 * A city is two records — a dot in `data/cities-19xx.csv` and a name in
 * `texts/browse.csv` — and its note is a third thing again, a `## id` section
 * in `texts/browse.md`. Nothing enforces the third: a place with no note is
 * drawn, named and clickable, and opens a card with a heading and nothing
 * under it. Nine of the Taiwanese places went in that way and were only
 * noticed by looking. This is a whole-file check rather than a Taiwanese one,
 * because the next gap will not be in Taiwan. */
console.log('\n— and every place in the browse layer says something —');
{
  const bare = await p.evaluate(() =>
    (JMAP.BROWSE || []).filter(r => !(r.note || '').trim())
      .map(r => r.id + ' (' + r.en + ')'));
  check('not one of them is left without a note', bare.length === 0,
    bare.length + ' bare: ' + bare.slice(0, 6).join(', '));
  const tw = await p.evaluate(() => (JMAP.BROWSE || [])
    .filter(r => r.lat > 21.3 && r.lat < 25.9 && r.lon > 118.5 && r.lon < 122.6));
  check('and the Taiwanese ones are all there', tw.length >= 20, tw.length + ' of them');
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
