/* **Wait for the thing, not for a number of seconds.**
 *
 * Every script here opened the map and then slept — 1,800 ms, 2,400, 3,200,
 * whatever had been enough on the machine it was written on. Across the suite
 * that came to **725 seconds of literal `sleep`**, and every one of those
 * numbers is a guess in two directions at once: too long on a fast machine,
 * where it is dead time, and too short on a slow one, where it is a flake that
 * looks like a bug in the map.
 *
 * `ready` waits for the map to have drawn its land, which is the condition the
 * sleep was standing in for, and returns the moment it is true. On this
 * machine that is a fifth of a second where the sleeps were two and a half.
 *
 * It is not a blanket replacement. A sleep that is waiting for a *transition*
 * — a fade, a nudge settling, a frame of animation — is waiting for time to
 * pass and should keep waiting for time to pass. Those stay.
 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* The map has drawn its land. `#land .atom` is what every other check reads,
   so nothing can be measured before it exists and nothing useful happens after
   it does — plus two animation frames, which is where the first `rescale` puts
   the labels and the markers. */
async function ready(page, opts) {
  const o = opts || {};
  /* **Say so, rather than hang.** Called on a page that is not the map — the
     printed timetable is the one in this suite — the wait below can never come
     true and the script died on a 25-second timeout with a stack trace and no
     hint. This turns that into one line naming the mistake, immediately. */
  const isMap = await page.evaluate(() => !!document.getElementById('jmap'));
  if (!isMap) {
    throw new Error('ready() waits for the map to draw its land, and this page '
      + 'has no #jmap: ' + page.url() + '. Use a plain sleep, or `until` with a '
      + 'condition this page can meet.');
  }
  await page.waitForFunction(
    () => document.querySelectorAll('#land .atom').length > 0,
    { polling: 'raf', timeout: o.timeout || 25000 });
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))));
  if (o.then) await sleep(o.then);
}

/* Anything else worth waiting on, in the page's own words. */
async function until(page, fn, arg, opts) {
  const o = opts || {};
  await page.waitForFunction(fn, { polling: o.polling || 'raf',
                                   timeout: o.timeout || 15000 }, arg);
}

module.exports = { ready, until, sleep };
