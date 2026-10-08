/* ============================================================================
 * publish.js — run this before every push to GitHub.
 *
 *   node build/publish.js
 *   …or double-click PUBLISH.command
 *
 * It does four things and refuses to finish if any of them fail:
 *
 *   1. CHECKS   every photograph referenced actually exists on disk, at exact
 *               case, with alt text and a sane size.
 *   2. RENDERS  the photographs into the HTML between markers, so Google and
 *               social link previews see them without running JavaScript.
 *   3. WRITES   robots.txt and sitemap.xml from the one domain value.
 *   4. GUARDS   against publishing with noindex still on, or with indexing on
 *               while the site is still incomplete.
 *
 * Exit code 1 means do not push.
 * ==========================================================================*/
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const p      = f => path.join(ROOT, f);
/* content.js is a script, not JSON — see the header of data/content.js. The
   data inside is still plain JSON, so unwrap it the same way the editor does. */
function loadData(file){
  const txt = fs.readFileSync(file, 'utf8');
  const i = txt.indexOf('window.SITE_DATA');
  if (i < 0) return JSON.parse(txt);
  return JSON.parse(txt.slice(txt.indexOf('=', i) + 1).trim().replace(/;\s*$/, ''));
}
const D      = loadData(p('data/content.js'));
const WIDTHS = [400, 800, 1200, 2000];

let problems = [], notes = [];
const fail = m => problems.push(m);
const note = m => notes.push(m);

const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ── 1 · CHECKS ─────────────────────────────────────────────────────────── */

/* Exact-case check. macOS does not care about case; the Linux box Netlify
   builds on does. A photograph that works locally and 404s live is almost
   always this. */
function existsExact(rel) {
  const full = p(rel);
  const dir  = path.dirname(full);
  const base = path.basename(full);
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).includes(base);
}

const cats = new Set(D.categories.map(c => c.slug));

D.images.forEach((img, i) => {
  const who = img.src || ('image ' + (i + 1));

  if (!String(img.alt || '').trim())
    fail(`${who} — no description. Every photograph needs alt text.`);

  if (!img.category || !cats.has(img.category))
    fail(`${who} — belongs to a collection that does not exist ("${img.category}").`);

  if (!img.src) { fail(`${who} — no file.`); return; }

  /* Only the widths that were actually generated need to exist: the admin
     never upscales, so a small original legitimately has fewer variants. */
  let found = 0;
  WIDTHS.forEach(w => { if (existsExact(`${img.src}-${w}.webp`)) found++; });
  if (found === 0) fail(`${who} — none of its files are on disk.`);
  else if (!existsExact(`${img.src}-1200.webp`) && (img.w || 0) >= 1200)
    fail(`${who} — the 1200px version is missing.`);

  if (img.w && img.w < 1200)
    note(`${who} is only ${img.w}px wide — it will look soft on a large screen.`);
});

(D.videos || []).forEach((v, i) => {
  const who = v.title || ('film ' + (i + 1));
  if (!String(v.url || '').trim())   fail(`${who} — no YouTube link. It would be an unclickable still.`);
  if (!String(v.title || '').trim()) fail(`${who} — no title.`);
  if (!String(v.alt || '').trim())   fail(`${who} — the still has no description.`);
  if (v.still && !existsExact(`${v.still}-800.webp`))
    fail(`${who} — its still is missing from disk.`);
  if (!v.still) note(`${who} has no still — it will show an empty frame.`);
});

/* The opening message rides in the URL, so it has a practical ceiling —
   long ones get truncated by some clients before the visitor ever sees them. */
const waMsg = String(D.contact.whatsappMessage || '');
if (waMsg && encodeURIComponent(waMsg).length > 700)
  fail('The WhatsApp opening message is too long — it will be cut off on some phones.');
if (waMsg && !waMsg.includes('{page}'))
  note('The WhatsApp message has no {page} in it, so every enquiry reads the same. Not wrong, just less useful.');
if (!String(D.contact.whatsapp || '').trim() &&
    (D.contact.socials || []).some(x => (x.platform || x.label || '').toLowerCase() === 'whatsapp'))
  note('A WhatsApp icon is listed but no WhatsApp number is set — it will open a blank message.');

D.categories.forEach(c => {
  if (c.cover && !existsExact(`${c.cover}-800.webp`))
    fail(`Collection "${c.name}" — its cover photograph is missing.`);
});

/* The hero became five cross-fading slides; this checked the single field it
   used to have, so five files were going unverified. Each slide is one whole
   photograph — there is no srcset here — so a missing one is a black screen
   behind the name, not a slightly soft picture. */
const slides = D.hero.slides || [];
slides.forEach((sl, i) => {
  const n = 'Hero slide ' + (i + 1);
  if (!sl.desktop) { fail(`${n} has no wide photograph.`); return; }
  if (!existsExact(sl.desktop)) fail(`${n} — ${sl.desktop} is missing from disk.`);
  if (sl.mobile && !existsExact(sl.mobile)) fail(`${n} — its tall version is missing from disk.`);
  if (!String(sl.alt || '').trim()) note(`${n} has no description.`);
});
if (!slides.length)
  note('No hero photographs yet — the placeholder colour will show.');
else if (!slides[0].mobile)
  note('The first hero slide has no tall version — on a phone it will be cropped from the wide one.');
if (slides.length > 5)
  fail(`${slides.length} hero slides. Five is the ceiling the admin enforces and the page expects.`);

const empties = D.categories.filter(c => !D.images.some(i => i.category === c.slug));
empties.forEach(c => note(`Collection "${c.name}" has no photographs.`));

/* ── 2 · PRE-RENDER ──────────────────────────────────────────────────────
   The same markup site.js builds, written into the file. Browsers re-render
   over it harmlessly; crawlers and link previews get it without JavaScript. */
function frame(img, opts = {}) {
  const ar = (img.ratio || '4/5').replace('/', ' / ');
  const fp = img.focal || '50% 50%';
  if (!img.src)
    return `<div class="frame empty-frame" data-label="${esc(opts.label || 'Photograph')}" style="--ar:${ar}"></div>`;

  const have = WIDTHS.filter(w => existsExact(`${img.src}-${w}.webp`));
  const srcset = have.map(w => `${img.src}-${w}.webp ${w}w`).join(', ');
  const largest = have[have.length - 1] || 1200;
  const rn = (() => { const [a, b] = (img.ratio || '4/5').split('/').map(Number); return a && b ? a / b : 0.8; })();

  return `<div class="frame" style="--ar:${ar};--fp:${fp}">` +
    `<img src="${img.src}-${largest}.webp" srcset="${srcset}"` +
    ` sizes="${opts.sizes || '(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw'}"` +
    ` alt="${esc(img.alt)}" width="1200" height="${Math.round(1200 / rn)}"` +
    (opts.eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"') +
    `></div>`;
}

const catOf = s => D.categories.find(c => c.slug === s);

const workHTML = D.images.filter(i => i.featured).map((img, n) => {
  const c = catOf(img.category);
  return `<a class="card" href="collection.html?c=${esc(img.category)}">${frame(img, { eager: n < 3 })}` +
         `<span class="cap"><b>${esc(c ? c.name : '')}</b></span></a>`;
}).join('\n') || '<div class="empty">No photographs selected yet.</div>';

const collHTML = D.categories.map(c => {
  const cover = c.cover ? { src: c.cover, ratio: c.ratio, focal: c.focal, alt: c.name }
                        : (D.images.find(i => i.category === c.slug && i.src) || { ratio: c.ratio, alt: '' });
  const n = D.images.filter(i => i.category === c.slug).length;
  return `<a class="card" href="collection.html?c=${esc(c.slug)}">` +
         frame(cover, { sizes: '(max-width:640px) 100vw, 50vw', label: c.name }) +
         `<span class="cap"><b>${esc(c.name)}</b><span>${n} photograph${n === 1 ? '' : 's'}</span></span></a>`;
}).join('\n') || '<div class="empty">No collections yet.</div>';

function inject(file, id, html) {
  const f = p(file);
  if (!fs.existsSync(f)) return;
  let s = fs.readFileSync(f, 'utf8');
  const open = `<!-- built:${id} -->`, close = `<!-- /built:${id} -->`;
  const block = `${open}\n${html}\n${close}`;
  const re = new RegExp(open.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&') + '[\\s\\S]*?' + close.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'));

  if (re.test(s)) s = s.replace(re, block);
  else {
    const anchor = new RegExp(`(<div class="grid[^"]*" id="${id}">)`);
    if (!anchor.test(s)) return;
    s = s.replace(anchor, `$1\n${block}`);
  }
  fs.writeFileSync(f, s);
}

inject('index.html',       'work-grid',        workHTML);
inject('index.html',       'collections-grid', collHTML);
inject('collections.html', 'collections-grid', collHTML);

/* Drift guard: everything in the data must appear in the file. If the two
   renderers ever disagree, this catches it rather than a visitor doing so. */
const idx = fs.readFileSync(p('index.html'), 'utf8');
D.images.filter(i => i.featured && i.src).forEach(i => {
  if (!idx.includes(i.src)) fail(`${i.src} is featured but did not reach index.html.`);
});

/* ── 3 · ROBOTS AND SITEMAP ─────────────────────────────────────────────── */
const domain = String(D.config.domain || '').trim().replace(/\/+$/, '');
const live   = domain ? (/^https?:/.test(domain) ? domain : 'https://' + domain) : '';

if (D.config.indexable && !live)
  fail('Indexing is switched on but no domain is set. One or the other.');

if (D.config.indexable && problems.length === 0) {
  const urls = ['', 'collections.html', 'about.html', 'contact.html']
    .concat(D.categories.map(c => `collection.html?c=${c.slug}`));
  fs.writeFileSync(p('sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${live}/${u}</loc></url>`).join('\n') +
    '\n</urlset>\n');
  fs.writeFileSync(p('robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /originals/\n\nSitemap: ${live}/sitemap.xml\n`);
  note('robots.txt and sitemap.xml written — the site will be indexed.');
} else {
  fs.writeFileSync(p('robots.txt'), 'User-agent: *\nDisallow: /\n');
  if (fs.existsSync(p('sitemap.xml'))) fs.unlinkSync(p('sitemap.xml'));
  note('Indexing is OFF. robots.txt blocks everything, no sitemap written.');
}

/* Keep the noindex meta tag honest with the setting, in one pass. */
['index.html', 'collections.html', 'collection.html', 'about.html', 'contact.html'].forEach(f => {
  if (!fs.existsSync(p(f))) return;
  let s = fs.readFileSync(p(f), 'utf8');
  const tag = '<meta name="robots" content="noindex,nofollow">';
  const has = s.includes(tag);
  if (D.config.indexable && has)  s = s.replace(tag + '\n', '');
  if (!D.config.indexable && !has) s = s.replace('</head>', tag + '\n</head>');
  fs.writeFileSync(p(f), s);
});

/* ── THE SHOWCASE ────────────────────────────────────────────────────────
   One photograph per collection may be set full width above the grid, where
   the stylesheet lets it open out as the visitor scrolls to it. The site
   already refuses a second one silently — it puts the extras back in the
   grid — so this is here to say so out loud, because a silent correction is
   a thing Essel would never find out about. */
{
  const byCat = {};
  D.images.filter(i => i.showcase).forEach(i => {
    (byCat[i.category] = byCat[i.category] || []).push(i);
  });
  Object.keys(byCat).forEach(cat => {
    const list = byCat[cat];
    const name = (D.categories.find(c => c.slug === cat) || {}).name || cat;
    if (list.length > 1) {
      fail(`${name} has ${list.length} photographs set to open out. Only one can. ` +
           `Pick one in the editor — the site is currently ignoring the rest.`);
    }
    const one = list[0];
    if (one && !one.src) {
      fail(`A photograph set to open out in ${name} has no file. It will stay in the grid.`);
    }
    if (one && one.src && !one.alt) {
      fail(`The photograph that opens out in ${name} has no description. ` +
           `It is the largest picture on the page — it needs one most.`);
    }
  });
  const total = D.images.filter(i => i.showcase && i.src).length;
  if (total) notes.push(`${total} collection${total === 1 ? '' : 's'} open a photograph out on scroll`);

  /* The effect must never become a dependency. This is the rule the whole
     site rests on, checked where it is cheapest to check. */
  const css = fs.readFileSync(p('css/site.css'), 'utf8');
  if (!css.includes('@supports (animation-timeline: view())')) {
    fail('The showcase animation is no longer behind @supports. Firefox would ' +
         'be left showing the photograph at its opening width forever.');
  }
  if (!/\.showcase \.frame\{[^}]*width:min\(100%, 1180px\)/.test(css)) {
    fail('The showcase has lost its finished width. That width IS the fallback.');
  }
}

/* ── REPORT ─────────────────────────────────────────────────────────────── */
console.log('');
console.log('  Essel De Photographer — publish check');
console.log('  =====================================');
console.log('');
console.log(`  ${D.images.length} photograph${D.images.length === 1 ? '' : 's'} · ` +
            `${D.categories.length} collections · ` +
            `${D.images.filter(i => i.featured).length} on the home page`);
console.log(`  Indexing: ${D.config.indexable ? 'ON' : 'off'}${live ? '  ·  ' + live : '  ·  no domain yet'}`);
console.log('');

notes.forEach(n => console.log('  ·  ' + n));
if (notes.length) console.log('');

if (problems.length) {
  problems.forEach(m => console.log('  ✗  ' + m));
  console.log('');
  console.log(`  ${problems.length} problem${problems.length === 1 ? '' : 's'}. Do not push yet.`);
  console.log('');
  process.exit(1);
}

console.log('  ✓  Everything checks out. Safe to push.');
console.log('');
