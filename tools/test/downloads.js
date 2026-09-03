/* Where a test's downloads go, and who clears them away.
 *
 * Several checks here press the thing a reader presses — Save in the
 * annotation panel, Download GeoJSON in a shape's menu, Download CSV under a
 * table — and that is a real download. Chrome writes it where the reader's own
 * browser would, which on this machine is `~/Downloads`, and nothing ever took
 * it away again: 552 `annotations-*.geojson`, 172 `good-*`, 145 `r13-two-*` and
 * a pile of CSVs had collected there before anybody noticed.
 *
 * So a run gets a directory of its own under the system temp and gives it back
 * when it ends. Nothing in the reader's Downloads folder is touched — the fix
 * is to stop putting things there, not to go and delete things from it.
 *
 *     const { sandboxDownloads } = require('./downloads.js');
 *     const b = await puppeteer.launch(...);
 *     await sandboxDownloads(b);
 *
 * Set on the *browser* rather than a page, so it covers every tab a script
 * opens afterwards, and cleared on `exit` as well as by hand so a script that
 * dies on a failed check does not leave the directory behind. If the browser
 * will not take the command — an older Chrome — the files land where they used
 * to and the run still passes; it says so on stderr rather than failing, since
 * a test's job is not to police the browser it was given.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

async function sandboxDownloads(browser) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jmap-downloads-'));
  const clean = () => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* gone already */ }
  };
  try {
    /* **The session stays attached.** A CDP domain is set per session, so
       detaching puts the behaviour back and the next Save goes to the reader's
       Downloads folder again — which is exactly what happened the first time
       this was written. It is held on the object so it lives as long as the
       browser does. */
    browser.__dlSession = await browser.target().createCDPSession();
    await browser.__dlSession.send('Browser.setDownloadBehavior',
                                   { behavior: 'allow', downloadPath: dir });
  } catch (e) {
    console.error('  (downloads not sandboxed: ' + e.message + ')');
  }
  process.once('exit', clean);
  return { dir: dir, clean: clean };
}

module.exports = { sandboxDownloads };
