/* Which copy of the map this is.
 *
 *     node tools/test/beta.js            # with a server on 8123
 *
 * There are two: the GitHub Pages one, where a change lands first and where a
 * reader may be looking at something half an hour old, and froginawell.net,
 * which is the one to point a class at. They are built from the same files, so
 * nothing in the page can tell them apart except the address it was served
 * from — and the mark has to be *absent* on the stable site, which is the half
 * of this that a check written on one host would miss.
 *
 * So the page is served from all three names. Chrome's own resolver is told to
 * send them to the loopback (`--host-resolver-rules`), which means the page
 * really is loaded from `http://kmlawson.github.io:8123/` and `location
 * .hostname` is the thing under test rather than something stubbed.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('beta test: puppeteer not found.');process.exit(1);})();
const { ready } = require('./settle.js');
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };

const look=p=>p.evaluate(()=>{
  const b=document.getElementById('beta-badge');
  const t=document.querySelector('.beta-tag');
  const mc=document.getElementById('map-container').getBoundingClientRect();
  const bb=b.getBoundingClientRect();
  return {
    host: location.hostname,
    shown: !b.hidden && getComputedStyle(b).display !== 'none',
    text: (b.textContent||'').trim(),
    title: b.title,
    left: Math.round(bb.left-mc.left), bottom: Math.round(mc.bottom-bb.bottom),
    w: Math.round(bb.width), h: Math.round(bb.height),
    tag: !t.hidden && getComputedStyle(t).display !== 'none',
    bar: (document.getElementById('bar-version')||{}).textContent||'',
    cls: document.documentElement.classList.contains('is-beta'),
  };});

const on=async(host,args)=>{
  const b=await puppeteer.launch({headless:'new',
    args:['--no-sandbox'].concat(args||[])});
  const p=await b.newPage();
  await p.setViewport({width:1400,height:900});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://'+host+':8123/index.html',{waitUntil:'networkidle2'});
  await ready(p);
  const v=await look(p); v.errs=errs;
  await b.close();
  return v;
};

(async()=>{
  console.log('\n— the rule is a function of the hostname —');
  const rule=await (async()=>{
    const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
    const p=await b.newPage();
    await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle2'});
    await ready(p);
    const r=await p.evaluate(()=>({
      pages: JMAP.__betaHost('kmlawson.github.io'),
      bare: JMAP.__betaHost('github.io'),
      stable: JMAP.__betaHost('froginawell.net'),
      www: JMAP.__betaHost('www.froginawell.net'),
      local: JMAP.__betaHost('localhost'),
      /* A host that merely *ends* in the letters. `github.io` has to be the
         whole name or a whole label of it, or `notgithub.io` and
         `github.io.example.com` would both be called the testing server. */
      lookalike: JMAP.__betaHost('notgithub.io'),
      suffixed: JMAP.__betaHost('github.io.example.com'),
      empty: JMAP.__betaHost(''),
    }));
    await b.close(); return r;
  })();
  check('a github.io host is the testing copy', rule.pages && rule.bare, JSON.stringify(rule));
  check('  froginawell.net is not, with or without the www',
    !rule.stable && !rule.www, JSON.stringify(rule));
  check('  and neither is a machine somebody is working on',
    !rule.local && !rule.empty, JSON.stringify(rule));
  check('  a name that only ends in the letters is not it either',
    !rule.lookalike && !rule.suffixed, JSON.stringify(rule));

  console.log('\n— served from the testing address —');
  const beta=await on('kmlawson.github.io',
    ['--host-resolver-rules=MAP kmlawson.github.io 127.0.0.1']);
  check('the badge is on the map', beta.shown, JSON.stringify(beta));
  check('  reading BETA', beta.text === 'BETA', beta.text);
  check('  and saying where the stable one is',
    /testing server/.test(beta.title) && /Frog in a Well/.test(beta.title), beta.title);
  check('  in the bottom left corner',
    beta.left > 0 && beta.left < 40 && beta.bottom > 0 && beta.bottom < 40,
    beta.left + ' px from the left, ' + beta.bottom + ' from the foot');
  check('  small, not a banner', beta.w < 90 && beta.h < 34,
    beta.w + ' x ' + beta.h);
  check('the version says beta too', /^1\.\d+ beta$/.test(beta.bar), beta.bar);
  check('  and the update number in About carries it', beta.tag, String(beta.tag));
  check('  with a class on the root for anything else that needs it', beta.cls, '');
  check('no page errors', beta.errs.length === 0, beta.errs.join(' | '));

  console.log('\n— and from the stable one, no mark at all —');
  const live=await on('froginawell.net',
    ['--host-resolver-rules=MAP froginawell.net 127.0.0.1']);
  check('no badge', !live.shown, JSON.stringify(live));
  check('  no word after the version', !/beta/.test(live.bar) && !live.tag, live.bar);
  check('  and no class on the root', !live.cls, '');
  check('no page errors there either', live.errs.length === 0, live.errs.join(' | '));

  console.log('\n— nor on a machine somebody is working on —');
  const dev=await on('localhost');
  check('nothing marked', !dev.shown && !dev.tag && !/beta/.test(dev.bar),
    JSON.stringify(dev));

  console.log('\n  '+pass+' passed, '+fail+' failed\n');
  process.exit(fail?1:0);
})();
