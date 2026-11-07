# Fetching from Wikipedia: slowly, and as little as possible

Read this before any job that asks Wikipedia for more than a handful of pages:
links, coordinates, interlanguage titles for a batch of cities, checking that
links resolve, and so on.

On 7 November 2026 a loop of single-page API calls, 0.2 s apart, got
**HTTP 429 Too Many Requests** after eleven pages. The rerun at 1.2 s apart,
with backoff, went through all 96. Wikipedia is a shared service, so treat its
limits as the rule.

## The rules

1. **Use the API, not page scraping.** Use `https://en.wikipedia.org/w/api.php`
   with `format=json`. Never fetch rendered article HTML in bulk.
2. **One request at a time.** No parallel workers, no thread pools, no
   sub-agents fetching side by side.
3. **At least one second between requests**, and more on a long run. Send
   `maxlag=5` so the servers can turn you away when they are busy. Sleep when
   they do.
4. **Batch titles.** `titles=` takes up to 50 titles joined with `|`, and
   `prop=coordinates|pageprops|info` answers them all in one request. Fifty
   cities is one request, not fifty.
   * `prop=langlinks` is the exception: its limit is shared across the batch.
     Use `lllang=ja` (one language per request) with a batch of titles, or
     fetch per page.
5. **Back off on 429 and 503.** Honour `Retry-After` if it is sent. Otherwise
   wait 5 s, then 10, 20 and 40, and stop after five tries. Do not retry in a
   tight loop.
6. **Cache to disk and never fetch the same thing twice.** Write each answer
   to a JSON file in the scratchpad as it arrives, so a rerun after a failure
   carries on from where it stopped.
7. **User-Agent: descriptive, never personal.** Wikimedia's policy asks for
   contact details in the User-Agent. The author's standing rule forbids that:
   no email, no name. Use something like
   `jmap-city-build/1.0 (offline historical map build)`. If a service refuses
   to work without a contact address, stop and ask the author.
8. **Check what comes back.**
   * `redirects=1` resolves redirects.
   * `pageprops` with `ppprop=disambiguation` flags a disambiguation page.
     Reject those.
   * A title that is a ward, a station or a building is the wrong page. This
     has happened: Shizuoka was once linked to its gymnasium.
   * `check_names` in `tools/build_texts.py` refuses some of these, not all.

## A sketch

```python
import json, time, urllib.parse, urllib.request, urllib.error
UA = {'User-Agent': 'jmap-city-build/1.0 (offline historical map build)'}
API = 'https://en.wikipedia.org/w/api.php?'

def get(params):
    params = dict(params, format='json', maxlag=5)
    url = API + urllib.parse.urlencode(params)
    for wait in (5, 10, 20, 40, 80):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                d = json.load(r)
            if d.get('error', {}).get('code') == 'maxlag':
                time.sleep(wait); continue
            return d
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503):
                raise
            time.sleep(int(e.headers.get('Retry-After') or wait))
    raise SystemExit('Wikipedia keeps refusing; stop and try later')

def pages(titles):                       # up to 50 titles in one request
    d = get({'action': 'query', 'titles': '|'.join(titles), 'redirects': 1,
             'prop': 'coordinates|pageprops', 'ppprop': 'disambiguation'})
    time.sleep(1.5)
    return d['query']
```
