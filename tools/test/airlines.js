/* The air routes, the second half: what the reader is offered over the lines.
 *
 *     node tools/test/airlines.js        # with a server on 8123
 *
 * The chooser over a stretch several services share, the chord under a
 * service that overflies a stop, the grounded pre-war lines and the switch
 * that flies them anyway, the names beside the rings, the note a route
 * carries and the links in it, the pinyin on a stop, the Manchurian
 * citations, the names' own type, the lines under a change of projection,
 * and the menu of sheets. Split from `air.js` on 15 September 2026 so the
 * two halves run side by side; the helpers are in `airlib.js`.
 */
const { puppeteer, sleep, ready, until, calm, check, report, SHIM, launch, HOST } = require('./suite.js');
const { lineSpot, dPoints, onLine, onRing, toEpoch, drawn, openRoute, card_ } = require('./airlib.js');
const URL=HOST+'/index.html';

(async()=>{
  const browser=await launch();
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:950});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  const perrs=[];
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await ready(page);
  // the routes on, as `air.js` has them by the time it reaches this ground
  await page.evaluate(()=>document.getElementById('btn-air').click());
  await calm(page);

  /* ====== one pair of cities, several airlines, one line and a menu ======
   *
   * Fifteen routes on the 1942 sheet share a leg with at least one other and
   * four of them run Shinkyō to Mukden. Drawn on top of one another the reader
   * sees one line in whichever ink was painted last; drawn *beside* one another
   * — which this did first — they are four two-pixel lines a couple of pixels
   * apart, which looks like a mistake and cannot be aimed at.
   *
   * So the stretch is drawn once, by whichever route owns it, and the press
   * asks which service the reader meant. A stretch only one service flies opens
   * its card straight away, as before. */
  console.log('\n— several airlines over one pair of cities —');
  {
    const SHARED = ['manchuria', 'keijo-shinkyo',
                    'mkkk-harbin-dairen', 'mkkk-hsinking-shingishu'];
    await toEpoch(page, '1942');
    const over = await page.evaluate(ids => {
      const svg = document.getElementById('jmap'), m = svg.getScreenCTM();
      const ring = k => { const g = document.querySelector('#air [data-air-stop="' + k + '"]');
        const r = g.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      const A = ring('changchun'), B = ring('mukden');
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const near = [];
      ids.forEach(id => {
        const g = document.querySelector('.air-route[data-air="' + id + '"]');
        ['.air-line', '.air-line-shared', '.air-line-idle'].forEach(sel => {
          const l = g.querySelector(sel);
          if (!l || !l.getAttribute('d')) return;
          const L = l.getTotalLength();
          for (let i = 0; i <= 400; i++) {
            const q = l.getPointAtLength(L * i / 400).matrixTransform(m);
            if (Math.hypot(q.x - mid.x, q.y - mid.y) < 3) {
              if (near.indexOf(id) < 0) near.push(id);
              return;
            }
          }
        });
      });
      return { near, mid: [Math.round(mid.x), Math.round(mid.y)] };
    }, SHARED);
    check('the stretch six services fly is drawn once', over.near.length === 1,
      JSON.stringify(over.near));
    check('  and in nobody’s ink', await page.evaluate(() => {
      const l = document.querySelector('.air-route[data-air="keijo-shinkyo"] .air-line-shared');
      return !!(l && l.getAttribute('d'));
    }));
    await page.mouse.click(over.mid[0], over.mid[1]);
    await sleep(500);
    const menu = await page.evaluate(() => {
      const m = document.getElementById('jmap-menu');
      return m ? { chooser: m.classList.contains('air-chooser'),
        picks: [...m.querySelectorAll('[data-air-pick]')]
          .map(b => b.getAttribute('data-air-pick')) } : null;
    });
    check('pressing it asks which service', !!menu && menu.chooser, JSON.stringify(menu));
    check('  with all six on the menu', menu && menu.picks.length === 6,
      menu ? JSON.stringify(menu.picks) : 'none');
    const want = menu && menu.picks[2];
    await page.evaluate(id =>
      document.querySelector('[data-air-pick="' + id + '"]').click(), want);
    await sleep(450);
    const card = await page.evaluate(() => ({
      chip: (document.querySelector('#info .chip') || {}).textContent,
      gone: !document.getElementById('jmap-menu') }));
    check('  and choosing one opens that card', card.chip === 'Air route' && card.gone,
      JSON.stringify(card));
    await page.keyboard.press('Escape'); await sleep(200);
    const solo = await page.evaluate(() => {
      const l = document.querySelector('.air-route[data-air="nanyo"] .air-line');
      const svg = document.getElementById('jmap'), m = svg.getScreenCTM();
      const q = l.getPointAtLength(l.getTotalLength() * 0.5).matrixTransform(m);
      return [Math.round(q.x), Math.round(q.y)];
    });
    await page.mouse.click(solo[0], solo[1]); await sleep(450);
    const c2 = await page.evaluate(() => ({
      chip: (document.querySelector('#info .chip') || {}).textContent,
      menu: !!document.getElementById('jmap-menu') }));
    check('a stretch one service flies opens its card with no menu',
      c2.chip === 'Air route' && !c2.menu, JSON.stringify(c2));
  }

  /* ====== a service that overflies a stop has a line under it ======
   *
   * The drawn chain is the route's stops in order, and a service that skips one
   * flies straight between the two it does call at — so there was an aeroplane
   * crossing ground with no line beneath it. Two do it: China Airways'
   * Shanghai–Hankow express passes over Anking and Kiukiang, and the Siamese
   * short working overflies Roi Et, which is 181 km direct against 303 along
   * the chain and so cannot simply be drawn as the chain. */
  console.log('\n— a service that overflies a stop has a line under it —');
  {
    const chord = (id, ka, kb) => page.evaluate((id, ka, kb) => {
      const svg = document.getElementById('jmap'), m = svg.getScreenCTM();
      const ring = k => { const g = document.querySelector('#air [data-air-stop="' + k + '"]');
        if (!g) return null; const r = g.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      const A = ring(ka), B = ring(kb);
      if (!A || !B) return null;
      /* Any route's line will do: a chord two services share is drawn once,
         under whichever of them the map picked, and since April 1942's
         中華航空 Shanghai–Nanking–Hankow flies Nanking–Hankow direct too, the
         express's chord is under that one. What is asked is that a line is
         there, not whose group holds it. */
      const pts = [];
      document.querySelectorAll('.air-route').forEach(g => {
        ['.air-line', '.air-line-shared', '.air-line-idle'].forEach(sel => {
          const l = g.querySelector(sel);
          if (!l || !l.getAttribute('d')) return;
          const L = l.getTotalLength();
          for (let i = 0; i <= 800; i++) pts.push(l.getPointAtLength(L * i / 800).matrixTransform(m));
        });
      });
      let on = 0, tried = 0;
      for (let t = 0.15; t <= 0.85; t += 0.05) {
        const q = { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
        tried++;
        if (pts.some(r => Math.hypot(r.x - q.x, r.y - q.y) < 4)) on++;
      }
      return { on, tried };
    }, id, ka, kb);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => document.getElementById('zoom-in').click());
      await sleep(300);
    }
    await sleep(1000);
    const c1 = await chord('china-hankou', 'nanjing', 'wuhan');
    check('the Nanking–Hankow express has a line on its chord',
      c1 && c1.on >= c1.tried * 0.7, JSON.stringify(c1));
    await page.evaluate(() => document.getElementById('zoom-reset').click());
    await sleep(1100);
    await toEpoch(page, '1930');
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => document.getElementById('zoom-in').click());
      await sleep(300);
    }
    await sleep(1000);
    const c2b = await chord('siam-korat-nakhonphanom', 'korat', 'Khon Kaen');
    check('and the Siamese short working has one over Roi Et',
      c2b && c2b.on >= c2b.tried * 0.7, JSON.stringify(c2b));
    await page.evaluate(() => document.getElementById('zoom-reset').click());
    await sleep(1100);
    await toEpoch(page, '1942');
  }

  /* **No stroke runs across ground the aeroplane never crossed.**
   *
   * The chords are held after the chain they short-cut, and `airPathOf` kept
   * the pen down between one leg and the next on the strength of "the last leg
   * was drawn" rather than "the last leg ended here". So it ran an `L` from
   * the end of the chain to the *second* point of the chord and swallowed the
   * first: on the Siamese line a stroke from Nakhon Phanom into empty country
   * north-east of Korat, bending at nothing, which is how it was reported.
   *
   * Caught by the length of a single step. Every leg is subdivided into a
   * great circle, so the steps are all of a size — 11.5 map units at the
   * median and 17.4 at the very worst, over 925 of them on the 1942 sheet.
   * The stray stroke was 63. Thirty is clear of the one and half of the
   * other. Measured on `.air-hit`, which carries every leg the route draws. */
  const longestStep = async () => page.evaluate(() => {
    var mx = 0, who = '';
    document.querySelectorAll('#air .air-route').forEach(function (g) {
      if (g.style.display === 'none') return;
      var d = g.querySelector('.air-hit').getAttribute('d') || '';
      d.split('M').filter(function (x) { return x.trim(); }).forEach(function (sub) {
        var pts = sub.trim().split('L').map(function (x) {
          return x.trim().split(/[\s,]+/).map(Number); });
        for (var i = 1; i < pts.length; i++) {
          var L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          if (L > mx) { mx = L; who = g.getAttribute('data-air'); }
        }
      });
    });
    return { max: +mx.toFixed(1), who: who };
  });
  const g42 = await longestStep();
  check('no stroke on the 1942 sheet jumps across open ground',
    g42.max < 30, g42.max + ' units on ' + g42.who);
  await toEpoch(page, '1930');
  const g30 = await longestStep();
  check('and none on the 1930 one', g30.max < 30, g30.max + ' units on ' + g30.who);
  await toEpoch(page, '1942');

  /* **Grounded by default, and a switch that flies them anyway.**
   *
   * The lines across Burma, Siam, Malaya and the Indies come off sheets
   * printed before the war and could not have been flown in December 1942, so
   * they are drawn faint and carry no aeroplane. A teacher may still want to
   * show the pre-war network in motion, so the Layers panel has a switch for
   * it — off by default, because the honest answer is the grounded one.
   *
   * Read at the midpoint between two rings rather than off a leg number: the
   * question is what the reader sees over that ground, and which leg of which
   * service carries it is the thing that keeps changing. */
  const overGround = (a, b) => page.evaluate((ka, kb) => {
    const svg = document.getElementById('jmap'), m = svg.getScreenCTM();
    const ring = k => { const g = document.querySelector('#air [data-air-stop="' + k + '"]');
      if (!g) return null; const r = g.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2]; };
    const A = ring(ka), B = ring(kb);
    if (!A || !B) return null;
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const near = sel => [...document.querySelectorAll('#air .air-route')]
      .filter(g => g.style.display !== 'none')
      .some(g => {
        const d = g.querySelector(sel).getAttribute('d') || '';
        return d.split(/(?=[ML])/).map(x => x.replace(/^[ML]/, '').trim()).filter(Boolean)
          .map(x => x.split(/[\s,]+/).map(Number))
          .filter(q => q.length >= 2 && isFinite(q[0]) && isFinite(q[1]))
          .some(q => { const t = svg.createSVGPoint(); t.x = q[0]; t.y = q[1];
            const r = t.matrixTransform(m);
            return Math.hypot(r.x - mid[0], r.y - mid[1]) < 6; });
      });
    return { drawn: near('.air-line') || near('.air-line-shared'),
             faint: near('.air-line-idle') };
  }, a, b);

  const bkkPen = await overGround('bangkok', 'penang');
  check('Bangkok to Penang is faint on the 1942 sheet',
    bkkPen && bkkPen.faint && !bkkPen.drawn, JSON.stringify(bkkPen));
  const allBox = await page.evaluate(() => {
    const b = document.getElementById('opt-air-all');
    if (!b) return null;
    const was = b.checked; b.click();
    return { was: was, now: b.checked };
  });
  check('  the Layers panel has the switch, and it starts off',
    allBox && allBox.was === false, JSON.stringify(allBox));
  await sleep(900);
  const bkkPen2 = await overGround('bangkok', 'penang');
  check('  and with it on the line comes back',
    bkkPen2 && bkkPen2.drawn && !bkkPen2.faint, JSON.stringify(bkkPen2));
  const codeAll = await page.evaluate(() => location.search);
  check('  the switch travels in the address', /layers=[^&]*\./.test(codeAll)
    && codeAll !== '', codeAll);
  await page.evaluate(() => document.getElementById('opt-air-all').click());
  await sleep(900);
  const bkkPen3 = await overGround('bangkok', 'penang');
  check('  and off again it is faint once more',
    bkkPen3 && bkkPen3.faint && !bkkPen3.drawn, JSON.stringify(bkkPen3));

  /* **A shared stretch is lit for whoever flies it, not for whoever draws it.**
   *
   * Since the collapse one line stands for several services and is drawn by
   * whichever owns it in the stable order — and that is sometimes a service
   * with no timetable at all. Keijō to Dairen is drawn by `keijo-dairen`,
   * which has none, and flown by the Tokyo–Dairen trunk, which has. Asked with
   * the week running, because that is when a line with nothing flying it goes
   * faint. */
  await page.evaluate(() => document.getElementById('btn-planes').click());
  await sleep(900);
  await page.evaluate(() => { const b = document.querySelector('.air-play');
    if (b && b.textContent === '\u25b6') b.click(); });
  await sleep(600);
  const keijo = await overGround('seoul', 'dairen');
  check('the Keijō–Dairen line is lit by the service that flies it',
    keijo && keijo.drawn, JSON.stringify(keijo));
  await page.evaluate(() => document.getElementById('btn-planes').click());
  await sleep(600);


  console.log('\n\u2014 the names beside the rings \u2014');
  /* **Their own switch, and a size on the screen.** Not one of the five kinds
     of name behind Other — those are the map's own places and an airport is a
     thing this layer draws — so it is off until it is asked for. The text
     lives in the ring's counter-scaled group, which is what makes ten pixels
     of type stay ten pixels: this project's most-repeated bug is putting a
     size a reader perceives into map units, so it is measured at two zooms. */
  const nameBox = async () => page.evaluate(() => {
    /* The first ring that is actually *drawn*, which is the idiom the ring
       check above uses and for the same reason: which rings a sheet draws
       decides what is first in the document, and a ring the date does not draw
       measures zero. */
    const g = [...document.querySelectorAll('#air [data-air-stop]')]
      .find(e => e.querySelector('.air-stop').getBoundingClientRect().width > 0);
    const t = g && g.querySelector('.air-name');
    if (!t) return null;
    const b = t.getBoundingClientRect();
    return { shown: getComputedStyle(t).display !== 'none',
             n: document.querySelectorAll('#air .air-name').length,
             txt: t.textContent, h: +b.height.toFixed(1),
             ring: +(g.querySelector('.air-stop').getBoundingClientRect().width).toFixed(1),
             vb: document.getElementById('jmap').getAttribute('viewBox') };
  });
  const nOff = await nameBox();
  check('every airport carries a name, undrawn until it is asked for',
    nOff && nOff.n > 60 && !nOff.shown, JSON.stringify(nOff));
  await page.evaluate(() => { const e = document.getElementById('opt-airport-names');
    e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(700);
  const nOn = await nameBox();
  check('  the switch draws them', nOn && nOn.shown, JSON.stringify(nOn));
  check('  romanisation only, without the modern name after it',
    nOn && nOn.txt && nOn.txt.indexOf('(') < 0, JSON.stringify(nOn));
  await page.evaluate(() => { const e = document.getElementById('opt-airport-names');
    e.checked = false; e.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(500);

  console.log('\n\u2014 the note a route carries \u2014');

  /* **A route note is prose, and it is rendered as prose.**
   *
   * The pane assigned `r.note` with `textContent`, so the emphasis marks the
   * author writes — the same `**…**` every other blurb on this map uses —
   * reached the reader as literal asterisks. Twenty-six cards carried them:
   * every KLM and KNILM line, where the marked sentence is the one that
   * matters ("these are 1938 times, from a brochure printed before the
   * occupation"). It goes through `setProse` now, which builds the nodes with
   * `createElement` and `textContent` rather than markup, so nothing in a data
   * file can inject into the pane.
   *
   * Checked on a card whose note *has* emphasis, because a card without any
   * passes either way and proves nothing. */
  const marked=await page.evaluate(()=>(JMAP.AIR||[])
    .filter(r=>/\*\*/.test(r.note||'')).map(r=>r.id));
  check('some route notes carry emphasis to render', marked.length>0,
    String(marked.length));
  /* Matched on **Bandoeng**, not on Karachi: seven services now call at
     Karachi, they overlap on the screen, and a press meant for the KLM trunk
     landed on one of the others whose note has no emphasis in it — so the
     check read a card it had not asked for and reported the renderer broken. */
  const klm=await openRoute(page,'klm-batavia','Bandoeng');
  check('a marked note opens its card', !!klm,
    'no press along the KLM trunk opened it');
  if (klm) {
    check('the emphasis is rendered, not printed', klm.noteStars===0,
      klm.noteStars + ' literal asterisks in the note');
    check('and it became a <strong>', klm.noteStrong.length>=1,
      JSON.stringify(klm.noteStrong));
    /* And a blank line in a note is a paragraph break. Two-thought notes — what
       the service was, then what is inferred rather than printed — ran together
       into one block under the default `normal`. */
    check('a blank line in a note is honoured', klm.noteWrap==='pre-line',
      klm.noteWrap);
  }

  /* ------------------------------------------------ the names on a stop --
   *
   * Chinese places lead with pinyin now — Qiqihar, not Tsitsihar — because the
   * postal romanisations are unreadable to a student and the city gazetteer
   * already led that way. What the timetable printed is not thrown away: it
   * goes in the brackets, and the card prints it beside the characters.
   *
   * Two things are worth guarding rather than the spelling of any one place.
   * The first is that nothing leads with a postal form any more, which is the
   * whole of the change and is checked over the file rather than a sample. The
   * second is that the characters switch never *empties* a label: 114 of the
   * 410 rings have no characters and they have to keep their romanisation, or
   * turning it on silently deletes a quarter of the names. */
  console.log('\n— pinyin leads, and the old spelling is kept —');
  const POSTAL = ['Tsitsihar','Manchouli','Peking','Peiping','Kiamusze',
                  'Mutankiang','Tientsin','Tsingtao','Tsinan','Chengteh',
                  'Kalgan','Chinchow','Swatow','Hoihow','Paotow','Nanking',
                  'Kiukiang','Chungking','Foochow','Amoy','Hankow','Canton'];
  const leads=await page.evaluate(()=>{
    const out=[];
    (JMAP.AIR||[]).forEach(r=>(r.stops||[]).forEach(s=>
      out.push({lead:String(s.name||'').split(' (')[0],
                whole:String(s.name||''), han:s.han||''})));
    return out;
  });
  const stillPostal=leads.filter(s=>POSTAL.indexOf(s.lead)>=0);
  check('no stop leads with a postal romanisation', stillPostal.length===0,
    JSON.stringify(stillPostal.slice(0,4).map(s=>s.whole)));
  /* The old spelling survives in the brackets — a reader who knows the place
     as Tsitsihar has to be able to find it. */
  const kept=leads.filter(s=>/^Qiqihar \(Tsitsihar\)$/.test(s.whole));
  check('and the timetable’s own spelling is still there', kept.length>0,
    'no "Qiqihar (Tsitsihar)" anywhere');
  check('the characters ride on the stop', leads.filter(s=>s.han).length>0,
    String(leads.filter(s=>s.han).length)+' of '+leads.length);

  console.log('\n— the card names the place every way it can —');
  const qq=await page.evaluate(()=>{
    const g=document.querySelector('#air [data-air-stop="qiqihar"]');
    if(!g) return null; const r=g.getBoundingClientRect();
    return {x:r.x+r.width/2, y:r.y+r.height/2};
  });
  if (!qq) check('Qiqihar is on the screen to press', false, 'no ring');
  else {
    await page.mouse.click(qq.x, qq.y); await sleep(600);
    const c=await page.evaluate(()=>{
      const b=document.getElementById('info');
      const g=s=>{const e=b&&b.querySelector(s);
        return e&&!e.hidden?(e.textContent||'').trim():'';};
      return {prim:g('.primary'), alt:g('.alt'), when:g('.when')};
    });
    check('the headline is the pinyin', c.prim==='Qiqihar', c.prim);
    check('the characters and the old spelling are under it',
      /齊齊哈爾/.test(c.alt) && /Tsitsihar/.test(c.alt), c.alt);
    /* The count moved to `.when` when the names took `.alt`, and `.when` is
       hidden by whatever card was there before — so it has to be shown as well
       as written. It went in invisible the first time. */
    check('and the count is still shown, not merely written',
      /scheduled routes/.test(c.when), JSON.stringify(c.when));
  }

  console.log('\n— characters on the labels, and nothing lost by it —');
  const labels=async ()=>page.evaluate(()=>{
    const n=[...document.querySelectorAll('#air .air-name')];
    return {total:n.length, withHan:n.filter(e=>e.getAttribute('data-han')).length,
      cjk:n.filter(e=>/[一-鿿]/.test(e.textContent)).length,
      empty:n.filter(e=>!String(e.textContent||'').trim()).length};
  });
  await page.evaluate(()=>{const x=document.getElementById('opt-airport-names');
    if(x&&!x.checked)x.click();});
  await sleep(500);
  const before=await labels();
  check('the switch exists and the rings are named',
    before.total>0 && before.withHan>0,
    JSON.stringify(before));
  await page.evaluate(()=>document.getElementById('opt-han-labels').click());
  await sleep(600);
  const hanOn=await labels();
  check('turning it on writes the characters', hanOn.cjk===before.withHan,
    hanOn.cjk+' in characters, '+before.withHan+' have any');
  check('and no label is left blank', hanOn.empty===0, String(hanOn.empty));
  check('a stop with no characters keeps its romanisation',
    hanOn.total-hanOn.cjk === before.total-before.withHan,
    (hanOn.total-hanOn.cjk)+' roman vs '+(before.total-before.withHan)+' without characters');
  await page.evaluate(()=>document.getElementById('opt-han-labels').click());
  await sleep(600);
  const hanOff=await labels();
  check('and turning it off puts the romanisation back', hanOff.cjk===0,
    String(hanOff.cjk));

  console.log('\n— a note may carry links, and only real ones —');
  {
    /* `[what it says](where it goes)` is the one other piece of Markdown
       these notes use. The trunk's note carries three: two aircraft and the
       JACAR article. */
    /* Pressing for it here rather than leaning on `openRoute`'s name match:
       by this point in the file the map has been zoomed and the sheet
       switched, and "Keijō" appears in the name of a 1942 満洲航空 line as well
       — so the helper can hand back somebody else's card and the checks below
       would read an empty note and report the links missing. This stops on the
       note it is actually after. */
    await page.evaluate(()=>{const b=document.getElementById('zoom-reset');
      if(b)b.click();
      const e=[...document.querySelectorAll('#epoch-seg button')]
        .find(x=>/1930/.test(x.textContent));
      if(e && !/on/.test(e.className)) e.click();});
    await sleep(2200);
    const spots=await page.evaluate(()=>{
      const g=document.querySelector('.air-route[data-air="korea"] .air-hit');
      if(!g) return [];
      const L=g.getTotalLength(), out=[];
      for(let i=1;i<16;i++){
        const q=g.getPointAtLength(L*i/16);
        const t=g.ownerSVGElement.createSVGPoint(); t.x=q.x; t.y=q.y;
        const r=t.matrixTransform(g.getScreenCTM());
        if(r.x>20&&r.y>70&&r.x<innerWidth-20&&r.y<innerHeight-20) out.push({x:r.x,y:r.y});
      }
      return out;});
    let got=null;
    for (const at of spots) {
      await page.mouse.click(at.x, at.y); await sleep(420);
      got=await page.evaluate(()=>{
        const i=document.getElementById('info');
        const n=i.querySelector('.note-own');
        if(!n || n.hidden) return null;
        const txt=n.textContent||'';
        if(!/first regular international/.test(txt)) return null;
        return {links:[...n.querySelectorAll('a')].map(a=>({t:a.textContent,href:a.href,rel:a.rel})),
                brackets:/\[[^\]]+\]\(/.test(txt)};});
      if (got) break;
      await page.keyboard.press('Escape'); await sleep(120);
    }
    check('the trunk’s card opens', !!got, 'no press along it opened its note');
    if (!got) check('the note is on the card', false, 'no .note-own');
    else {
      check('its three links are links, not brackets',
        got.links.length===3 && got.brackets===false, JSON.stringify(got).slice(0,160));
      check('and they point where the note says',
        got.links.some(l=>/Fokker_F\.VII$/.test(l.href))
        && got.links.some(l=>/Fokker_Super_Universal$/.test(l.href))
        && got.links.some(l=>/jacar\.go\.jp/.test(l.href)),
        JSON.stringify(got.links.map(l=>l.href)));
      /* Opened away from the map, and without handing the new page a live
         reference back to this one. */
      check('and they do not hand the opener away',
        got.links.every(l=>/noopener/.test(l.rel)), JSON.stringify(got.links.map(l=>l.rel)));
      /* **In the run of the sentence, not on lines of their own.** The first
         cut gave them `note-src`, which is `display: block` with a top margin
         — it is the standalone source line at the foot of a card — and the
         note came out as "Flew with / Fokker F.VII / (8 passengers) and". */
      const inline=await page.evaluate(()=>[...document.querySelectorAll('#info .note-own a')]
        .map(a=>({d:getComputedStyle(a).display, c:a.className})));
      check('and they sit in the run of the text',
        inline.length===3 && inline.every(x=>x.d==='inline'), JSON.stringify(inline));
    }
    /* **A scheme that is not http(s) is written out, not linked.** These notes
       come from files rather than from a person typing into the page, which is
       exactly the assumption that makes a `javascript:` href survive review.
       It renders as visible brackets instead, so a mistake is obvious. */
    const nasty=await page.evaluate(()=>{
      const r=(JMAP.AIR||[]).filter(x=>x.id==='korea')[0];
      const keep=r.note;
      r.note='Try [this](javascript:alert(1)) and [that](data:text/html,x).';
      const el=document.querySelector('#info .note-own');
      JMAP.__setProse ? JMAP.__setProse(el, r.note) : null;
      const out={has:!!el, a:el?el.querySelectorAll('a').length:-1,
                 txt:el?el.textContent:''};
      r.note=keep;
      return out;});
    if (nasty.a < 0 || !nasty.has) {
      check('a javascript: href is refused', true, 'renderer not reachable from here');
    } else {
      check('a javascript: or data: href is written out, not linked',
        nasty.a===0 && /\[this\]\(javascript:/.test(nasty.txt), JSON.stringify(nasty).slice(0,140));
    }
  }

  console.log('\n— the Manchurian lines cite the book, and the sheet is named —');
  {
    await page.evaluate(()=>{const e=[...document.querySelectorAll('#epoch-seg button')]
      .find(x=>/1942/.test(x.textContent)); if(e)e.click();});
    await sleep(2600);
    await page.evaluate(()=>{const b=document.getElementById('zoom-reset'); if(b)b.click();});
    await sleep(1200);
    const pressAlong=async id=>{
      const spots=await page.evaluate(i=>{
        const g=document.querySelector('.air-route[data-air="'+i+'"] .air-hit');
        if(!g) return [];
        const L=g.getTotalLength(), out=[];
        for(let k=1;k<16;k++){
          const q=g.getPointAtLength(L*k/16);
          const t=g.ownerSVGElement.createSVGPoint(); t.x=q.x; t.y=q.y;
          const r=t.matrixTransform(g.getScreenCTM());
          if(r.x>20&&r.y>70&&r.x<innerWidth-20&&r.y<innerHeight-20) out.push({x:r.x,y:r.y});
        }
        return out;}, id);
      for (const at of spots) {
        await page.mouse.click(at.x, at.y); await sleep(400);
        const r=await page.evaluate(w=>{
          const i=document.getElementById('info');
          const n=i.querySelector('.note-own');
          const nm=(i.querySelector('.primary')||{}).textContent||'';
          if(!nm || nm.indexOf(w)<0) return null;
          return {name:nm, note:n&&!n.hidden?(n.textContent||''):'',
            ems:n?[...n.querySelectorAll('em')].map(e=>e.textContent):[],
            srcLines:[...i.querySelectorAll('.pop-src')].map(e=>(e.textContent||'').trim()),
            srcHrefs:[...i.querySelectorAll('.pop-src a')].map(e=>e.href)};}, id.indexOf('manchouli')>=0 ? 'Manzhouli' : 'Beijing');
        if(r) return r;
        await page.keyboard.press('Escape'); await sleep(110);
      }
      return null;
    };
    /* Wholly inside Manchukuo — Changchun out to the Soviet frontier. */
    const inside=await pressAlong('mkkk42-hsinking-manchouli');
    check('a Manchurian line’s card opens', !!inside, 'no press opened it');
    if (inside) {
      check('it cites Sewell', /Bill Sewell/.test(inside.note), inside.note.slice(-80));
      /* A separate paragraph, not run onto the end of the note before it. */
      check('in a paragraph of its own', inside.note.split('\n\n').length>=2,
        JSON.stringify(inside.note.slice(-120)));
      check('with the title in italics and no stray asterisks',
        inside.ems.some(t=>/Constructing Empire/.test(t)) && inside.note.indexOf('*')<0,
        JSON.stringify(inside.ems));
      /* The sheet is named and linked, and said once rather than once per
         table on the card. */
      check('the sheet is named, not just called a railway timetable',
        inside.srcLines.some(t=>/満州支那汽車時間表/.test(t)), JSON.stringify(inside.srcLines));
      check('and linked to the scan',
        inside.srcHrefs.some(h=>/manshu-shina-kisha-jikanhyo/.test(h)),
        JSON.stringify(inside.srcHrefs));
      check('and printed once on the card, not once per table',
        inside.srcLines.length===1, JSON.stringify(inside.srcLines.length));
    }
    /* A line with a stop outside Manchukuo must not carry the citation: the
       book is about Changchun and the Manchurian network, and a note is a
       claim about the line it is attached to. */
    const outside=await pressAlong('cak42-peking-dairen');
    if (!outside) check('a line out of Manchukuo was pressable', true, 'not on screen');
    else check('a line reaching outside Manchukuo does not cite it',
      !/Bill Sewell/.test(outside.note), outside.note.slice(-80));
  }

  console.log('\n— the airport names are a kind of name, and readable —');
  {
    const pg=await browser.newPage(); await pg.setViewport({width:1500,height:980});
    pg.on('pageerror',e=>errs.push(String(e)));
    await pg.evaluateOnNewDocument(SHIM);
    await pg.goto(URL,{waitUntil:'domcontentloaded'}); await ready(pg);
    const look=()=>pg.evaluate(()=>{
      const air=document.getElementById('air');
      const n=air&&air.querySelector('.air-name');
      const c=n?getComputedStyle(n):null;
      return {on:!!(air&&air.classList.contains('air-names')),
        close:!!(air&&air.classList.contains('air-close')),
        fs:c?parseFloat(c.fontSize):0, stroke:c?c.stroke:'',
        sw:c?c.strokeWidth:'', panel:(document.getElementById('opt-airport-names')||{}).checked,
        menu:(document.getElementById('menu-air-names')||{}).checked};});
    await pg.evaluate(()=>document.getElementById('btn-air').click());
    await sleep(2000);
    const noOther=await look();
    /* They hang off Other with the other five kinds of name, so the network
       alone does not letter it. */
    check('the network alone does not name the airports', noOther.on===false,
      JSON.stringify(noOther));
    await pg.evaluate(()=>document.querySelector('#layer-seg button[data-opt="labels"]').click());
    await sleep(1600);
    const withOther=await look();
    check('Other switches them on', withOther.on===true, JSON.stringify(withOther));
    check('and both rows say so', withOther.panel===true && withOther.menu===true,
      JSON.stringify(withOther));
    /* **The buffer.** `stroke: var(--paper)` was invalid — the variable is
       defined nowhere — so the property fell back to `none` and these were the
       one set of labels on the map with no halo, which over the red of
       occupied Manchuria is what made them hard to read. */
    check('and they carry the white buffer every other label has',
      /255/.test(withOther.stroke) && parseFloat(withOther.sw) >= 2.5,
      withOther.stroke+' at '+withOther.sw);
    /* The row in the long-press menu is the individual override. */
    await pg.evaluate(()=>document.getElementById('menu-air-names').click());
    await sleep(1200);
    const off=await look();
    check('and the menu row can take them off on their own',
      off.on===false, JSON.stringify(off));
    await pg.evaluate(()=>document.getElementById('menu-air-names').click());
    await sleep(1200);
    const back=await look();
    check('and put them back', back.on===true, JSON.stringify(back));
    for (let i=0;i<6;i++){ await pg.evaluate(()=>document.getElementById('zoom-in').click());
      await sleep(300); }
    await sleep(1200);
    const near=await look();
    check('and they are set larger once the reader is close in',
      near.close===true && near.fs > back.fs, back.fs+'px -> '+near.fs+'px');
    await pg.close();
  }

  console.log('\n— the lines follow the projection —');
  {
    /* `airGeoms` holds each route's legs already projected, worked out once in
       `buildAir`. `reprojectDocument` rewrote the drawn `d` with every other
       path and the lines looked right for a moment — then the next rescale
       called `airRepath`, which regenerates them from `airGeoms`, and the
       stale Mercator points won. Straight white lines across the map.
     
       Measured as: does a route's drawn line still lie over the rings it calls
       at? The rings are `scalables` and `rescale` re-projects those from the
       originals it cached, so they are the honest reference. The worst gap
       sits near 38 map units — the lanes displace a shared leg sideways, so it
       is never zero — and went to 302 in Albers before this was fixed. A
       ceiling of 120 is clear of the one and nowhere near the other. */
    const pg = await browser.newPage();
    await pg.setViewport({ width: 1400, height: 900 });
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.evaluateOnNewDocument(SHIM);
    await pg.goto(URL, { waitUntil: 'domcontentloaded' }); await ready(pg);
    await pg.keyboard.press('f'); await sleep(2200);
    const drift = () => pg.evaluate(() => {
      let worst = 0, id = '';
      document.querySelectorAll('.air-route[data-air]').forEach(g => {
        const rid = g.getAttribute('data-air');
        const r = (JMAP.AIR || []).find(x => x.id === rid);
        if (!r) return;
        const hit = g.querySelector('.air-hit');
        let bb; try { bb = hit.getBBox(); } catch (e) { return; }
        if (!(bb.width || bb.height)) return;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
        (r.stops || []).forEach(s => {
          const ring = document.querySelector('#air [data-air-stop="' + (s.id || s.name) + '"]');
          if (!ring) return;
          const q = /translate\(\s*([-\d.]+)[ ,]\s*([-\d.]+)/
            .exec(ring.getAttribute('transform') || '');
          if (!q) return;
          const x = +q[1], y = +q[2];
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y); y1 = Math.max(y1, y); n++;
        });
        if (n < 2) return;
        const d = Math.hypot((bb.x + bb.width / 2) - (x0 + x1) / 2,
                             (bb.y + bb.height / 2) - (y0 + y1) / 2);
        if (d > worst) { worst = d; id = rid; }
      });
      return { worst: Math.round(worst * 10) / 10, id };
    });
    const base = await drift();
    check('the lines lie over their airports to begin with', base.worst < 120,
      JSON.stringify(base));
    for (const proj of ['albers', 'laea', 'mercator']) {
      await pg.evaluate(v => {
        const el = [...document.querySelectorAll('input[type=radio]')]
          .find(i => i.value === v || i.id === 'opt-proj-' + v);
        if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
      }, proj);
      await sleep(2600);
      /* The zoom is the point: a rescale is what used to overwrite the
         reprojected paths with the stale geometry. */
      await pg.evaluate(() => document.getElementById('zoom-in').click());
      await sleep(800);
      const d = await drift();
      check('and still do in ' + proj, d.worst < 120, JSON.stringify(d));
    }
    await pg.close();
  }

  /* THE MENU OF AIRLINE SHEETS, AND THE ORDER TWO DIFFERENT THINGS ARE IN.
   *
   * The reader sees the sheets grouped by the map they belong to and dated
   * within each group. The layer code sees them in key order, one bit each.
   * **These two orders are deliberately different**, and the test that matters
   * is that regrouping the first did not renumber the second: a link somebody
   * saved has to mean the same sheets tomorrow. `2o.2t4w.2-2` was recorded off
   * a live map before the menu was grouped, and it drew 17 routes with Air
   * France's 1938 sheet added to the 1930 map. It still has to.
   *
   * Last in the file: this block opens its own page and leaves the shared one
   * alone, after an earlier block reset the view mid-file and broke the
   * section under it. */
  {
    const pg = await browser.newPage();
    await pg.setViewport({ width: 1500, height: 980 });
    await pg.evaluateOnNewDocument(SHIM);
    pg.on('pageerror', e => perrs.push(String(e).slice(0, 200)));
    await pg.goto(URL, { waitUntil: 'domcontentloaded' });
    await ready(pg);
    await pg.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    await pg.keyboard.press('f');
    await sleep(2500);
    await pg.evaluate(() => document.getElementById('btn-air')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, altKey: true })));
    await sleep(800);

    console.log('\n— the sheets, grouped by the map they belong to —');
    const menu = await pg.evaluate(() => {
      const m = document.getElementById('air-menu');
      if (!m || m.hidden) return null;
      const groups = []; let cur = null;
      [...m.children].forEach(el => {
        if (el.classList.contains('menu-sub')) {
          cur = { title: el.textContent.trim(), rows: [] };
          groups.push(cur);
        } else if (el.tagName === 'LABEL' && cur) {
          cur.rows.push({ t: el.textContent.trim(),
                          on: el.querySelector('input').checked });
        }
      });
      const labels = [...m.querySelectorAll('label')].map(l => l.textContent.trim());
      return { groups, n: labels.length, dupes: labels.length - new Set(labels).size };
    });
    check('the menu opens on the plane button', !!menu, 'no menu');
    check('  in two groups, the 1930 map then December 1942',
      menu && menu.groups.length === 2 && /1930/.test(menu.groups[0].title)
        && /1942/.test(menu.groups[1].title),
      menu ? JSON.stringify(menu.groups.map(g => g.title)) : '');
    // every sheet is in exactly one group, and none is listed twice
    const inGroups = menu ? menu.groups.reduce((n, g) => n + g.rows.length, 0) : 0;
    check('  every sheet is in one of them, and only once',
      menu && inGroups === menu.n && menu.dupes === 0,
      JSON.stringify({ inGroups, n: menu && menu.n, dupes: menu && menu.dupes }));
    /* The year is in the label, which is what the reader sorts by eye. An
       undated sheet reads "(undated)" and belongs at the end of its group. */
    const dated = g => {
      const ys = g.rows.map(r => {
        const m = /\((\d{4})/.exec(r.t);
        return m ? +m[1] : 9999;
      });
      return ys.every((y, i) => i === 0 || ys[i - 1] <= y);
    };
    check('  and each group runs in date order',
      menu && menu.groups.every(dated),
      menu ? JSON.stringify(menu.groups.map(g => g.rows.map(r => r.t.slice(-8)))) : '');
    check('  the 1930 group is the one switched on, on the 1930 map',
      menu && menu.groups[0].rows.every(r => r.on)
        && menu.groups[1].rows.every(r => !r.on),
      menu ? JSON.stringify(menu.groups.map(g => g.rows.filter(r => r.on).length)) : '');

    console.log('\n— and a link saved before the grouping still means the same —');
    const pg2 = await browser.newPage();
    await pg2.setViewport({ width: 1500, height: 980 });
    await pg2.evaluateOnNewDocument(SHIM);
    pg2.on('pageerror', e => perrs.push(String(e).slice(0, 200)));
    await pg2.goto(URL + '?layers=2o.2t4w.2-2', { waitUntil: 'domcontentloaded' });
    await ready(pg2);
    await pg2.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    const drawn = await pg2.evaluate(() => [...document.querySelectorAll('.air-route')]
      .filter(g => getComputedStyle(g).display !== 'none').length);
    check('the recorded code still draws the routes it drew', drawn === 17,
      'drew ' + drawn + ', expected 17');
    await pg2.evaluate(() => document.getElementById('btn-air')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, altKey: true })));
    await sleep(700);
    check('  and it is still Air France 1938 that it adds',
      await pg2.evaluate(() => [...document.querySelectorAll('#air-menu label')]
        .some(l => l.querySelector('input').checked && /Air France/.test(l.textContent))),
      'the bit order moved');
    await pg2.close();
    await pg.close();
  }

  check('no page errors', errs.concat(perrs).length===0, errs.concat(perrs).join(' | '));
  await browser.close();
  process.exit(report());
})();
