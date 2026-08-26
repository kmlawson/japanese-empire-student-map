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
const {puppeteer,sleep,check,report}=H;
(async()=>{
console.log('\n— narrow and wide —');
for (const [w,h,tag,touch] of [[390,780,'phone   ',true],[768,1024,'tablet  ',true],
                               [1100,800,'laptop  ',false],[1600,1000,'desktop ',false]]) {
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
  const p=await b.newPage();
  await p.setViewport(touch?{width:w,height:h,isMobile:true,hasTouch:true}:{width:w,height:h});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p, false);
  await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(500);
  const btn=await p.evaluate(()=>{const b=document.querySelector('#ann-create').getBoundingClientRect();
    return {vis:b.width>0&&b.height>0, w:Math.round(b.width)};});
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1600);
  const st=await p.evaluate(()=>{
    const a=document.querySelector('#annotate'), r=a.getBoundingClientRect();
    return {box:[r.left,r.top,r.width,r.height].map(Math.round),
            overflowX:a.scrollWidth-a.clientWidth,
            offRight:Math.round(r.right)>innerWidth+1,
            offBottom:Math.round(r.bottom)>innerHeight+2,
            share:Math.round(100*r.height/innerHeight),
            tools:[...document.querySelectorAll('.ann-tool')].map(b=>Math.round(b.getBoundingClientRect().width)),
            fieldsFit:[...document.querySelectorAll('#annotate input, #annotate textarea, #annotate select')]
              .every(e=>e.getBoundingClientRect().right<=innerWidth+1)};
  });
  check(tag+'the Layers button is reachable', btn.vis);
  check(tag+'the panel fits the width', !st.offRight && st.overflowX===0, JSON.stringify(st));
  check(tag+'nothing runs off the bottom', !st.offBottom, JSON.stringify(st.box)+' of '+h);
  check(tag+'its five tools are all sized', st.tools.length===5 && st.tools.every(v=>v>24), JSON.stringify(st.tools));
  check(tag+'every field fits inside the window', st.fieldsFit);
  // with a tool armed the map must keep most of the screen on a small one
  await p.evaluate(()=>document.querySelector('.ann-tool[data-tool="point"]').click()); await sleep(500);
  const armed=await p.evaluate(()=>Math.round(100*document.querySelector('#annotate').getBoundingClientRect().height/innerHeight));
  check(tag+'the map keeps the screen while drawing', w>=1000 ? true : armed<=22, armed+'% used by the panel');
  check(tag+'no page errors', errs.length===0, errs[0]);
  await p.screenshot({path:H.shot('lay-'+tag.trim()+'.png')});
  await b.close();
}
process.exit(report());
})();
