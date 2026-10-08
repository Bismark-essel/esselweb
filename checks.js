/* ============================================================================
 * checks.js — does the code still behave?
 *
 *   node build/checks.js
 *
 * publish.js asks a different question. It checks THIS data against THIS disk:
 * is that photograph really there, does it have alt text, is the case right.
 * Change the data and its answers change.
 *
 * This file checks the CODE, against data invented here. Its answers should
 * never change unless somebody breaks something. The two are complementary and
 * both run before a push.
 *
 * Every section ends with a deliberate fault. A test that has never failed has
 * never been tested — if `breaks()` reports nothing caught, the check above it
 * is decoration.
 * ==========================================================================*/

/* site.js hands back its pure functions when there is no document. */
global.location = { pathname: '/index.html', search: '' };
const S = require('../js/site.js');

let pass = 0, fail = 0, section = '';
const head = t => { section = t; console.log('\n  ' + t); };
const ok = (name, cond, why) => {
  if (cond) { pass++; }
  else { fail++; console.log('    ✗ ' + name + (why ? '\n        ' + why : '')); }
};

/* Re-runs the ORIGINAL assertion against sabotaged input. It must now fail.
   Asserting the sabotaged value instead is the trap — that proves nothing,
   because a check that reads its answer from the thing it is checking always
   agrees with itself. */
function breaks(name, sabotage, assertion) {
  const restore = sabotage();
  let caught = false;
  try { caught = (assertion() === false); } catch (e) { caught = true; }
  restore();
  ok('caught: ' + name, caught, 'the check still passed against broken code');
}

const at = (path, query) => { global.location = { pathname: path, search: query || '' }; };

const DATA = () => ({
  config: { name: 'Essel', descriptor: 'De Photographer', domain: '' },
  contact: {
    whatsapp: '233 541 651628', phone: '054 165 1628', email: 'e@example.com',
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/x' },
      { platform: 'whatsapp',  url: 'https://wa.me/000000000' },
      { label: 'TikTok',       url: 'https://tiktok.com/@x' },
      { platform: 'myspace',   url: 'https://example.com' }
    ]
  },
  categories: [
    { slug: 'portrait', name: 'Portrait', ratio: '4/5' },
    { slug: 'events',   name: 'Events',   ratio: '3/2' }
  ],
  images: [], videos: []
});
let D = DATA();
S.setData(D);
const reset = () => { D = DATA(); S.setData(D); };

/* ── 1 · THE WHATSAPP MESSAGE ────────────────────────────────────────────
   The point of the message is that Essel learns what they were looking at.
   If the context is wrong the enquiry is worse than useless — it is
   misleading. */
head('1 · The WhatsApp opening message');
{
  at('/index.html');
  let l = S.waLink();
  ok('number is stripped to digits', l.startsWith('https://wa.me/233541651628?text='));
  const msg = u => decodeURIComponent(u.split('text=')[1]);
  ok('home page says "your work"', msg(l).includes('your work'));
  ok('nothing is left unsubstituted', !msg(l).includes('{page}'));
  ok('the URL is encoded, never raw', !l.includes(' '));

  at('/collection.html', '?c=portrait');
  ok('a collection names itself', msg(S.waLink()).includes('the portrait work'));
  ok('and does not also say "your work"', !msg(S.waLink()).includes('your work'));

  at('/collection.html', '?c=events');
  ok('a different collection changes it', msg(S.waLink()).includes('the events work'));

  at('/collection.html', '?c=nonsense');
  ok('an unknown collection falls back safely', msg(S.waLink()).includes('your work'));

  at('/collection.html', '?c=portrait');
  D.contact.whatsappMessage = 'Hi Essel — {page} please.';
  ok('a custom message is used', msg(S.waLink()) === 'Hi Essel — the portrait work please.');

  D.contact.whatsappMessage = '   ';
  ok('a blank custom message falls back', msg(S.waLink()).indexOf('Hello Essel') === 0);
  delete D.contact.whatsappMessage;

  D.contact.whatsapp = '';
  ok('no number gives no link at all, not a broken one', S.waLink() === '');
  reset();

  breaks('the number is emptied',
    () => { const o = D.contact.whatsapp; D.contact.whatsapp = ''; return () => { D.contact.whatsapp = o; }; },
    () => S.waLink().startsWith('https://wa.me/'));

  breaks('a collection is renamed',
    () => { const o = D.categories[0].name; D.categories[0].name = 'Wedding'; return () => { D.categories[0].name = o; }; },
    () => { at('/collection.html', '?c=portrait');
            return decodeURIComponent(S.waLink().split('text=')[1]).includes('the portrait work'); });
  at('/index.html');
}

/* ── 2 · THE SOCIAL ROW ─────────────────────────────────────────────────── */
head('2 · Social icons');
{
  const row = S.socialRow('socials');
  ok('every link with a url is drawn', (row.match(/<a /g) || []).length === 4);
  ok('WhatsApp is rebuilt from the number, not the pasted link',
     row.includes('wa.me/233541651628') && !row.includes('wa.me/000000000'),
     'a pasted wa.me link would open a blank message box');
  ok('the older {label} shape still finds its icon',
     S.socialIcon('tiktok', 'TikTok') === S.socialIcon(
       (D.contact.socials[2].label || '').toLowerCase(), 'TikTok'));
  ok('an unknown platform gets a letter, never a hole',
     S.socialIcon('myspace', 'Myspace').includes('<text'));
  ok('a known platform never gets a letter',
     !S.socialIcon('instagram', 'Instagram').includes('<text'));
  ok('every icon is labelled for a screen reader',
     (row.match(/aria-label="/g) || []).length === 4);
  ok('every icon leaves the site safely',
     (row.match(/rel="noopener"/g) || []).length === 4);
  ok('a link with no url is skipped, not drawn empty', (function () {
     D.contact.socials.push({ platform: 'facebook', url: '' });
     const r = S.socialRow('socials'); reset();
     return (r.match(/<a /g) || []).length === 4;
  })());
  ok('no socials at all gives nothing, not an empty box', (function () {
     D.contact.socials = []; const r = S.socialRow('socials'); reset(); return r === '';
  })());

  breaks('WhatsApp falls back to the pasted link',
    () => { const o = D.contact.whatsapp; D.contact.whatsapp = ''; return () => { D.contact.whatsapp = o; }; },
    () => S.socialRow('socials').includes('wa.me/233541651628'));
}

/* ── 3 · THE IMAGE COMPONENT ────────────────────────────────────────────
   This is the part of the site that is easiest to break silently: a wrong
   srcset costs nobody an error message, only sharpness. */
head('3 · The image component');
{
  const IMG = { src: 'photos/a', ratio: '4/5', focal: '50% 30%', alt: 'A portrait' };
  const f = S.frame(IMG);
  ok('all four widths are offered',
     [400, 800, 1200, 2000].every(w => f.includes('photos/a-' + w + '.webp ' + w + 'w')));
  ok('sizes is present, or srcset does nothing at all', f.includes('sizes="'));
  ok('width and height are set, so the page cannot jump',
     f.includes('width="1200"') && f.includes('height="1500"'));
  ok('the focal point reaches the CSS', f.includes('--fp:50% 30%'));
  ok('the ratio becomes an aspect-ratio box, not a pixel height',
     f.includes('--ar:4 / 5') && !f.includes('height:'));
  ok('alt text is carried through', f.includes('alt="A portrait"'));
  ok('below the fold it is lazy', f.includes('loading="lazy"'));
  ok('the first frames are eager and prioritised',
     S.frame({ src: 'photos/a', alt: 'x' }, { eager: true }).includes('fetchpriority="high"'));
  ok('a quote in alt text cannot break out of the tag',
     S.frame({ src: 'photos/a', alt: 'He said "no"' }).includes('&quot;'));
  ok('no file gives an honest labelled frame, not a broken icon',
     S.frame({ ratio: '4/5' }, { label: 'Portrait' })
       .includes('class="frame empty-frame" data-label="Portrait"'));
  ok('a missing ratio defaults to portrait rather than to nothing',
     S.ratioNum(undefined) === 0.8 && S.frame({ src: 'photos/a' }).includes('--ar:4 / 5'));
  ok('a nonsense ratio does not produce NaN', S.ratioNum('banana') === 0.8);
  ok('16/9 measures correctly', Math.abs(S.ratioNum('16/9') - 1.7777) < 0.001);

  breaks('the ratio is changed under it',
    () => { const i = IMG; IMG.ratio = '3/2'; return () => { i.ratio = '4/5'; }; },
    () => S.frame(IMG).includes('height="1500"'));

  breaks('the focal point is lost',
    () => { const o = IMG.focal; delete IMG.focal; return () => { IMG.focal = o; }; },
    () => S.frame(IMG).includes('--fp:50% 30%'));
}

/* ── 4 · WHAT THE ADMIN AND THE SITE MUST AGREE ON ──────────────────────
   Two files, one convention. When they disagree the admin writes files the
   site never asks for, and nobody finds out until a visitor sees a hole. */
head('4 · Admin and site agree');
{
  const fs = require('fs'), path = require('path');
  const p = f => path.join(__dirname, '..', f);
  const admin = fs.readFileSync(p('admin.html'), 'utf8');
  const site  = fs.readFileSync(p('js/site.js'), 'utf8');
  const pub   = fs.readFileSync(p('build/publish.js'), 'utf8');

  ok('all three use the same four widths',
     admin.includes('var WIDTHS  = [400, 800, 1200, 2000]') &&
     site.includes('var w = [400, 800, 1200, 2000]') &&
     pub.includes('const WIDTHS = [400, 800, 1200, 2000]'),
     'the admin would write files the site never asks for');
  ok('the admin never upscales', admin.includes('if(w > bmp.width && i > 0) break'));
  ok('downscaling is stepped, not one jump', admin.includes('function stepDown'));
  ok('quality rises with size', admin.includes('w >= 2000 ? 0.90'));
  ok('the hero is capped at five', admin.includes('var MAX_SLIDES = 5'));
  ok('the admin states the export size where photographs are dropped',
     admin.includes('2000') && admin.includes('2500'),
     'the size instruction has to live where the uploading happens');
  ok('every platform the admin offers, the site can draw', (function () {
     const sel = admin.slice(admin.indexOf('id="soc-new"'));
     const offered = [...sel.slice(0, sel.indexOf('</select>'))
       .matchAll(/<option value="([a-z]+)">/g)].map(m => m[1])
       /* "other" is deliberate — it is the escape hatch, and a lettered
          circle is the correct rendering for something we have no glyph for. */
       .filter(p => p !== 'other');
     return offered.length > 0 && offered.every(p => !S.socialIcon(p, p).includes('<text'));
  })(), 'the dropdown would promise a platform that renders as a lettered circle');

  /* The gap this closed: publish.js has always read config.indexable, but the
     admin had no control for it, so the only way to be found on Google was to
     hand-edit the data file the admin owns. */
  ok('the admin can switch indexing on', admin.includes("id=\"idx-toggle\""),
     'indexing could only be changed by hand-editing content.js');
  ok('and it refuses without a domain',
     admin.includes('btn.disabled = !on && !domain'),
     'robots.txt and the sitemap would have no address to name');
  ok('every config field publish.js reads, the admin can set', (function () {
     const reads = [...pub.matchAll(/D\.config\.(\w+)/g)].map(m => m[1]);
     const uniq = [...new Set(reads)];
     const settable = uniq.filter(k =>
       admin.includes("'config." + k + "'") || admin.includes('cfg.' + k) ||
       admin.includes('config.' + k));
     return uniq.length > 0 && settable.length === uniq.length;
  })(), 'publish.js would act on a setting nobody can reach');

  /* THE RECURRING BUG, caught generally rather than one instance at a time.
     Twice in one day publish.js asked for something the admin had no box for:
     config.indexable, then hero slide descriptions. Both times the check was
     right and the editor was the thing that was incomplete. So: anything
     publish.js complains about must be reachable in the admin. */
  ok('the admin has a box for every hero slide description',
     admin.includes('data-sk="alt"') && pub.includes('has no description'),
     'publish.js would ask for something with nowhere to type it');
  ok('and typing in it actually saves',
     admin.includes("$('slides').addEventListener('input'"),
     'the box would look editable and discard every keystroke');
  ok('the site renders the hero description it was given',
     site.includes("f.dataset.alt") && site.includes("esc(s.alt || '')"),
     'the description would be stored and then thrown away at render time');

  /* The migration to content.js, 4 September 2026. A page that loads site.js
     without the data beside it renders nothing and says nothing — 404.html did
     exactly that for ten minutes. */
  {
    const pages = fs.readdirSync(path.join(__dirname, '..'))
      .filter(f => f.endsWith('.html') && f !== 'admin.html' &&
                   f !== 'START HERE.html');
    const wrong = pages.filter(f => {
      const t = fs.readFileSync(p(f), 'utf8');
      if (!t.includes('js/site.js')) return false;
      /* 404.html uses absolute paths on purpose, because it is served from
         whatever URL the visitor mistyped. Match the tail of each path rather
         than assuming the relative form. */
      return !t.includes('data/content.js') ||
             t.indexOf('data/content.js') > t.indexOf('js/site.js');
    });
    ok('every page loads the data BEFORE the script', wrong.length === 0, wrong.join(', '));
    ok('nothing fetches any more', !site.includes('fetch('),
       'a fetch would break opening the site from a folder, which is the whole point');
    ok('the data file is a script', fs.existsSync(p('data/content.js')) &&
       fs.readFileSync(p('data/content.js'), 'utf8').includes('window.SITE_DATA'));
    ok('the retired content.json is not still sitting beside it',
       !fs.existsSync(p('data/content.json')),
       'two sources of truth is the one thing this workspace never allows');
    ok('the editor reads and writes the script form',
       admin.includes('function wrapFile(json)') && admin.includes('function unwrapFile(txt)') &&
       (admin.match(/getFileHandle\('content\.js'/g) || []).length === 2);
  }

  ok('films are checked before publishing', pub.includes('no YouTube link'));
  ok('the film section exists on the home page',
     fs.readFileSync(p('index.html'), 'utf8').includes('id="film-grid"'),
     'films() would render into nothing and no error would be raised');
}

/* ── 5 · THE SHOWCASE ───────────────────────────────────────────────────
   One photograph per collection is allowed to open out as the page scrolls
   to it. This section exists because the effect arrived as a React component
   that could not come in — no compiler here, a CDN is a thing that can lapse,
   and it set a fixed pixel height, which section 3 has always failed. What
   went in instead is fifteen lines of CSS, and these checks are what keep it
   fifteen lines of CSS. */
/* ══ 12 September 2026 · photographs must not stretch ══════════════════════
   site.js writes width="1200" and a matching height on every photograph so the
   browser reserves the box. The stylesheet had `max-width:100%` and NO
   height:auto, so on any screen narrower than 1200 the width was constrained
   while the HTML height still applied and every picture squashed vertically.
   Worst on a phone, where the gap is biggest — and invisible in a desktop
   preview, which is why it went unnoticed.

   The pair is width+height for the SHAPE and height:auto to let the height
   follow. One without the other stretches. */
head('4b · Photographs keep their shape on a phone');
{
  const fs = require('fs'), path = require('path');
  const p = f => path.join(__dirname, '..', f);
  const css = fs.readFileSync(p('css/site.css'), 'utf8');
  const base = /(?:^|[\s,{])img\s*\{([^}]*)\}/m.exec(css);
  /* THE ARGUMENT ORDER HERE IS ok(name, cond) — not the ok(cond, name) used by
     the newer harnesses. Getting it the wrong way round made all seven of these
     assert a non-empty string, so they passed no matter what the stylesheet
     said. Caught by injecting the fault and watching it stay green, which is
     the only thing that ever catches it. */
  ok('there is a base img rule', !!base);
  ok('the base img rule sets height:auto', !!base && /height\s*:\s*auto/.test(base[1]),
     'without it every picture squashes on any screen narrower than 1200px');
  ok('and max-width:100%', !!base && /max-width\s*:\s*100%/.test(base[1]),
     'so nothing overflows a narrow screen');

  /* A logo is allowed a fixed height because it is a mark, not a photograph —
     and those rules come after the base rule, so they still win. */
  /* Only the BASE rule for a mark needs width:auto. The media-query overrides
     change the height alone and inherit the width, which is correct — demanding
     it on every one of them failed on a stylesheet that was right. What must
     never happen is a fixed height AND a fixed width on the same mark, which is
     what actually squashes a logo. */
  const marks = (css.match(/\.(?:mark|foot)\s+img\s*\{[^}]*\}/g) || []);
  ok('a mark declares width:auto somewhere', marks.some(m => /width\s*:\s*auto/.test(m)),
     'otherwise the logo squashes instead of scaling');
  ok('no mark pins a height and a width at once',
     marks.every(m => !(/height\s*:\s*\d+px/.test(m) && /width\s*:\s*\d+px/.test(m))));

  /* No photograph container may pin a pixel height: that turns a shape into a
     size and crops whatever does not fit. */
  const frames = (css.match(/\.frame[^{]*\{[^}]*\}/g) || []);
  ok('there is a .frame rule', frames.length > 0);
  ok('no picture container pins a pixel height',
     frames.every(f => !/(^|[^-])height\s*:\s*\d+px/.test(f)));

  /* The attributes carry the shape, so they must be a real proportion and not
     a number scaled into nonsense. */
  const js = fs.readFileSync(p('js/site.js'), 'utf8');
  ok('the width and height attributes are derived from the ratio together',
     /width="1200" height="' \+ Math\.round\(1200 \/ ratioNum/.test(js));
}

head('5 · The showcase');
{
  const fs = require('fs'), path = require('path');
  const p = f => path.join(__dirname, '..', f);
  const ROOT = path.join(__dirname, '..');
  const css   = fs.readFileSync(p('css/site.css'), 'utf8');
  const admin = fs.readFileSync(p('admin.html'), 'utf8');
  const site  = fs.readFileSync(p('js/site.js'), 'utf8');

  /* The site has exactly ONE scroll listener and always has: the nav going
     solid. The showcase must not be a second one. Counting rather than
     forbidding is the honest test — "no scroll listeners" would have been a
     lie the day it was written, and a check that starts out false gets
     deleted rather than fixed. */
  ok('the showcase added no scroll listener',
     (site.match(/addEventListener\(\s*['"]scroll['"]/g) || []).length === 1,
     'the nav needs one; the showcase needs none, and CSS is why');
  ok('...and the collection page in particular runs nothing on scroll',
     !/function collection\(\)[\s\S]*?addEventListener\(\s*['"]scroll['"]/
       .test(site.slice(site.indexOf('function collection()'),
                        site.indexOf('function collection()') + 2200)));
  ok('no library was added to pay for it',
     !/<script[^>]+src=["']https?:/i.test(admin) &&
     !fs.readdirSync(ROOT).includes('node_modules'),
     'a dependency is a thing that can lapse');
  ok('the finished width is declared outside @supports',
     /\.showcase \.frame\{[^}]*width:min\(100%, 1180px\)/.test(css),
     'the fallback IS the design; it cannot live inside the enhancement');
  ok('the animation is behind @supports',
     /@supports \(animation-timeline: view\(\)\)/.test(css),
     'Firefox would inherit a half-applied rule and show the picture at 620px forever');
  ok('reduced motion is honoured',
     /@media \(prefers-reduced-motion: no-preference\)/.test(css),
     'someone who asked their device to stop moving things gets the photograph, still');
  ok('the showcase frame is still an aspect-ratio box',
     !/\.showcase[^{]*\{[^}]*[^-]height:\s*\d+px/.test(css),
     'the very thing the React version got wrong');

  /* one per collection, enforced in BOTH places */
  ok('the editor clears the others in the same collection',
     /if\(turningOn\) D\.images\.forEach/.test(admin) &&
     /o\.category===img\.category/.test(admin),
     'two showcases is a slideshow nobody asked for');
  ok('the site refuses a second one even so',
     /if \(i\.showcase && !show && i\.src\)/.test(site),
     'a content file can always be edited by hand');
  ok('a showcase without a photograph stays in the grid',
     /i\.showcase && !show && i\.src/.test(site),
     'an empty labelled frame full width is a hole, not a showcase');

  /* the admin/site agreement that has bitten twice before */
  ok('the admin has a button for it', admin.includes("data-a=\"showcase\""));
  ok('...and the handler behind the button exists',
     admin.includes("if(a==='showcase')"));
  ok('...and new photographs carry the field',
     /showcase: false,/.test(admin),
     'the button would toggle a key that does not exist on older images');
  ok('every photograph on disk has the field',
     (function(){ const t = fs.readFileSync(p('data/content.js'), 'utf8');
        const i = t.indexOf('window.SITE_DATA');
        return JSON.parse(t.slice(t.indexOf('=', i) + 1).trim().replace(/;\s*$/, '')); })()
       .images.every(i => 'showcase' in i),
     'undefined is not false when the editor reads it back');

  breaks('the fallback width is deleted',
    () => { const o = css;
            fs.writeFileSync(p('css/site.css'),
              css.replace('width:min(100%, 1180px);          /* the finished, full width */', ''));
            return () => fs.writeFileSync(p('css/site.css'), o); },
    () => /\.showcase \.frame\{[^}]*width:min\(100%, 1180px\)/
            .test(fs.readFileSync(p('css/site.css'), 'utf8')));

  breaks('@supports is removed and the animation leaks out',
    () => { const o = css;
            fs.writeFileSync(p('css/site.css'),
              css.replace('@supports (animation-timeline: view()){', '@media all {'));
            return () => fs.writeFileSync(p('css/site.css'), o); },
    () => /@supports \(animation-timeline: view\(\)\)/
            .test(fs.readFileSync(p('css/site.css'), 'utf8')));

  breaks('a second scroll listener creeps in',
    () => { const o = site;
            fs.writeFileSync(p('js/site.js'),
              site.replace('function collection() {',
                           "function collection() { addEventListener('scroll', function(){});"));
            return () => fs.writeFileSync(p('js/site.js'), o); },
    () => (fs.readFileSync(p('js/site.js'), 'utf8')
             .match(/addEventListener\(\s*['"]scroll['"]/g) || []).length === 1);

  breaks('the one-per-collection rule is dropped from the site',
    () => { const o = site;
            fs.writeFileSync(p('js/site.js'),
              site.replace('if (i.showcase && !show && i.src)', 'if (i.showcase)'));
            return () => fs.writeFileSync(p('js/site.js'), o); },
    () => /if \(i\.showcase && !show && i\.src\)/
            .test(fs.readFileSync(p('js/site.js'), 'utf8')));
}

/* ── REPORT ─────────────────────────────────────────────────────────────── */
console.log('');


/* ── THE PICTURE A SHARED LINK SHOWS ────────────────────────────────────
   Pages here promise a large photograph when the link is shared. Supplying no
   og:image makes that a lie, and a link to a photographer arriving as a blank
   grey box is the most expensive empty field a site can have — most people who
   ever see a link see the preview and never open the page.

   IT READS THE REAL data/content.js, NOT THE FIXTURE ABOVE, AND THAT MATTERS.
   The rest of this file asks whether the CODE behaves, using data invented
   here. This one question is about THIS data against THIS disk, so asking the
   fixture would compare a made-up domain with real pages and fail every time.
   It did, on the first run — fifteen times.

   Asked BOTH WAYS ROUND against whatever the data actually says, so it is
   green today with nothing uploaded AND green the day a photograph lands. */
{
  const _fs = require('fs'), _p = require('path');
  const _ROOT = _p.join(__dirname, '..');
  const _r = f => _fs.readFileSync(_p.join(_ROOT, f), 'utf8');
  const _has = v => v !== null && v !== undefined && String(v).trim().length > 0;

  const _w = {};
  new Function('window', _r('data/content.js'))(_w);
  const RD = _w.SITE_DATA || _w.SITE;

  const _pages = _fs.readdirSync(_ROOT)
    /* NOT PUBLIC PAGES. admin.html is the editor, 404.html is served in
       place of any missing URL, and START HERE.html is the handover guide
       written for Essel — netlify.toml 404s all three at the edge. A page
       nobody can reach does not need a share card. */
    .filter(f => f.endsWith('.html') && f !== 'admin.html' && f !== '404.html' &&
                                     f !== 'START HERE.html');
  const _dom = String((RD.config||{}).domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const _shots = (RD.images||[]).filter(i => i && _has(i.src));
  const _should = !!_dom && _shots.length > 0;

  ok('there is something that writes the share picture',
     _fs.existsSync(_p.join(__dirname, 'sync-share.js')));
  ok('and it runs before the gates, on every runner this site has',
     ["PUBLISH.command"].every(f => /sync-share/.test(_r(f))));
  ok('it fetches nothing — this site opens from a folder',
     !/fetch\s*\(/.test(_r('build/sync-share.js').replace(/\/\*[\s\S]*?\*\//g, '')));

  const _wrong = [], _bad = [], _loose = [];
  _pages.forEach(f => {
    const _t = _r(f);
    const _tag = /<meta property="og:image" content="(https?:\/\/[^"]+)">/.exec(_t);
    if (!!_tag !== _should) _wrong.push(f);
    if (_tag) {
      const _u = _tag[1];
      const _pre = 'https://' + _dom + '/';
      if (_u.indexOf(_pre) !== 0) { _bad.push(f + ' (not on this domain)'); return; }
      if (!_fs.existsSync(_p.join(_ROOT, _u.slice(_pre.length)))) _bad.push(f + ' (file not on disk)');
      if (!/summary_large_image/.test(_t) || !/<meta name="twitter:image"/.test(_t))
        _loose.push(f);
    }
  });
  ok('the share picture is present exactly when there is one to show',
     _wrong.length === 0,
     'a tag pointing at nothing is worse than no tag — a scraper caches the miss. Wrong: ' + _wrong.join(', '));
  ok('every share picture is absolute, on this domain, and really on disk',
     _bad.length === 0, _bad.join(', '));
  ok('the card a page promises is the card it supplies',
     _loose.length === 0, _loose.join(', '));
}

console.log('  ' + '='.repeat(52));
if (fail) {
  console.log(`  ${pass} passed, ${fail} FAILED. Do not push.`);
  console.log('');
  process.exit(1);
}
console.log(`  ${pass} checks, 0 failures.`);
console.log('');
