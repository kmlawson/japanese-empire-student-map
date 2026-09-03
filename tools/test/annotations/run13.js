const { sandboxDownloads } = require('../downloads.js');
/* Losing a reader's work: the three ways it could happen, and cannot now.
 *
 * These are the worst thing this feature can do, so they get a script of their
 * own. All three were found by auditing rather than by use, which is the point:
 * none of them announces itself.
 *
 *   1. Undo after a rename destroyed everything. A title, description or date
 *      edit took no snapshot, so Undo reached past it and consumed whichever
 *      structural snapshot was underneath. Measured before the fix: load two
 *      marks, rename one, press Undo, and the list is *empty* — the snapshot
 *      it found was the state before the load — and a second press says
 *      "Nothing left to undo".
 *
 *   2. An edit after saving left the page willing to close without a word.
 *      `changed()` defined "unsaved" as "there is at least one feature", which
 *      is a different question: it is true the moment anything is drawn and
 *      false again when the last mark is deleted.
 *
 *   3. The clock read an end date written "1931" as 1 January 1931, so a mark
 *      that ran through 1931 vanished the moment the clock reached September
 *      1931 — and one written start 1931-05-01, end 1931 was never visible at
 *      all, its end landing four months before its start.
 */
const S = require('./suite.js');
const puppeteer = S.puppeteer;
const fs = require('fs'), os = require('os'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('    ok   ' + n); }
                             else { fail++; console.log('    FAIL ' + n + (d ? ' — ' + d : '')); } };

const titles = p => p.evaluate(() =>
  [...document.querySelectorAll('#ann-list .ann-name')].map(e => e.textContent.trim()));
/* Does the browser stop somebody closing the tab? A real beforeunload, and
   whether anything cancels it, which is exactly what the browser tests. */
const ASKS = () => { const e = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(e); return e.defaultPrevented || e.returnValue === ''; };

const write = (name, obj) => { const f = path.join(os.tmpdir(), name);
  fs.writeFileSync(f, JSON.stringify(obj)); return f; };
const type = async (p, id, v) => { await p.evaluate((i, val) => {
  const el = document.querySelector(i); el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true })); }, id, v); await sleep(700); };

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 150000 }); await sandboxDownloads(b);
const p = await b.newPage();
await p.setViewport({ width: 1400, height: 950 });
await p.evaluateOnNewDocument(S.SHIM);
const errs = []; p.on('pageerror', e => errs.push(String(e)));
p.on('dialog', async d => { try { await d.accept(); } catch (e) { /* gone */ } });
await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
await S.ready(p, false);
await p.evaluate(() => document.querySelector('#ann-create').click());
await sleep(1200);

console.log('\n  — Undo after a rename undoes the rename, and nothing else —');
const two = write('r13-two.geojson', { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { title: 'first' }, geometry: { type: 'Point', coordinates: [120, 25] } },
  { type: 'Feature', properties: { title: 'second' }, geometry: { type: 'Point', coordinates: [121, 26] } }] });
await (await p.$('#ann-file')).uploadFile(two);
await sleep(1700);
check('two marks are loaded', (await titles(p)).join() === 'first,second', (await titles(p)).join());
await p.evaluate(() => document.querySelectorAll('#ann-list .ann-pick')[0].click());
await sleep(500);
await type(p, '#ann-title', 'first RENAMED');
check('the rename shows in the list', (await titles(p)).join() === 'first RENAMED,second', (await titles(p)).join());
await p.evaluate(() => document.querySelector('#ann-undo').click());
await sleep(800);
check('one Undo puts the name back and keeps both marks',
  (await titles(p)).join() === 'first,second', (await titles(p)).join());

console.log('\n  — typing is one snapshot, not one per letter —');
await p.evaluate(() => document.querySelectorAll('#ann-list .ann-pick')[1].click());
await sleep(400);
for (const v of ['s', 'se', 'sec', 'secon', 'second ed', 'second edited'])
  await p.evaluate((val) => { const el = document.querySelector('#ann-title'); el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
await sleep(1100);
check('the edit is there', (await titles(p)).join() === 'first,second edited', (await titles(p)).join());
await p.evaluate(() => document.querySelector('#ann-undo').click());
await sleep(800);
check('and one Undo takes back the whole burst of typing',
  (await titles(p)).join() === 'first,second', (await titles(p)).join());

console.log('\n  — an edit after saving still counts as unsaved —');
await p.evaluate(() => document.querySelector('#ann-save').click());
await sleep(1100);
check('saving settles it', (await p.evaluate(ASKS)) === false);
await p.evaluate(() => document.querySelectorAll('#ann-list .ann-pick')[0].click());
await sleep(400);
await type(p, '#ann-title', 'edited after the save');
check('and editing a title arms the warning again', (await p.evaluate(ASKS)) === true);
await p.evaluate(() => document.querySelector('#ann-save').click());
await sleep(1100);
await type(p, '#ann-desc', 'a description written after the second save');
check('so does editing a description', (await p.evaluate(ASKS)) === true);

console.log('\n  — an end date means the end of what was written, not the first of January —');
await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
await S.ready(p, false);
await p.evaluate(() => document.querySelector('#ann-create').click());
await sleep(1200);
const dated = write('r13-dates.geojson', { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { title: 'all of 1931', 'jem-start': '1931', 'jem-end': '1931' },
    geometry: { type: 'Point', coordinates: [120, 25] } },
  { type: 'Feature', properties: { title: 'September 1931', 'jem-start': 'Sept 1931' },
    geometry: { type: 'Point', coordinates: [121, 26] } },
  { type: 'Feature', properties: { title: 'from May, through 1931', 'jem-start': '1931-05-01', 'jem-end': '1931' },
    geometry: { type: 'Point', coordinates: [122, 27] } }] });
await (await p.$('#ann-file')).uploadFile(dated);
await sleep(1700);
const drawn = () => p.evaluate(() =>
  [...document.querySelectorAll('#ann-labels text')].map(t => t.textContent));
const step = async n => { for (let i = 0; i < n; i++) {
  await p.evaluate(() => document.querySelector('#ann-clock-next').click()); await sleep(320); } };
await step(1);
let on = await drawn();
check('at the start of 1931 the year-long mark is drawn', on.includes('all of 1931'), JSON.stringify(on));
// the stages are 1 Jan, 1 May, 1 Sept and the end of 1931: four, because the
// mark that runs from May adds one
await step(2);
on = await drawn();
check('and it is still drawn in September 1931', on.includes('all of 1931'), JSON.stringify(on));
check('as is the one that runs from May through 1931',
  on.includes('from May, through 1931'), JSON.stringify(on));
check('and September\'s own mark has arrived', on.includes('September 1931'), JSON.stringify(on));

check('no page errors', errs.length === 0, errs[0]);
console.log('\n    ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
