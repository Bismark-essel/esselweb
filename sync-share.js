#!/usr/bin/env node
/* ============================================================================
   ESSEL DE PHOTOGRAPHER — the picture a shared link shows.

       node build/sync-share.js

   WHY THIS EXISTS. He has a domain and photographs, and every page declared no card at all — so a link to a PHOTOGRAPHER shared as a line of grey text. This adds both halves: the picture, and the card that promises it.

   THE SECOND HALF, WHICH IS LESS OBVIOUS. **A share-preview robot does not run
   JavaScript.** Anything patched into the page at runtime is invisible to it —
   it reads the HTML as written and nothing else. So this has to be IN THE FILE.

   WHAT IT REFUSES TO WRITE. `og:image` must be an ABSOLUTE url — a relative
   one is ignored by every scraper — so it needs the domain. With no domain, or
   no photograph, this writes NOTHING and REMOVES any tag already there. **A tag
   pointing at a picture that does not exist is worse than none**, because the
   scraper caches the failure and the cache outlives the fix.

   So the site is quiet until it has something to show, and complete the moment
   it does. It never invents a photograph.

   IT IS SAFE TO RUN TWICE. It replaces its own block and nothing else.
   ==========================================================================*/
'use strict';

const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

const win = {};
new Function('window', R('data/content.js'))(win);
const D = win.SITE_DATA || win.SITE;

const has = v => v !== null && v !== undefined && String(v).trim().length > 0;

/* Every page that a person might actually paste somewhere. */
const PAGES = fs.readdirSync(ROOT)
  /* NOT PUBLIC PAGES. admin.html is the editor, 404.html is served in
     place of any missing URL, and START HERE.html is the handover guide
     written for Essel — netlify.toml 404s all three at the edge. A page
     nobody can reach does not need a share card. */
  .filter(f => f.endsWith('.html') && f !== 'admin.html' && f !== '404.html' &&
                                   f !== 'START HERE.html');

function pick() {
  const imgs = (D.images || []).filter(i => i && has(i.src));
  if (!imgs.length) return null;
  const shown = imgs.filter(i => i.showcase)[0];   if (shown)  return shown;
  const feat  = imgs.filter(i => i.featured)[0];   if (feat)   return feat;
  for (const c of (D.categories || [])) {
    const first = imgs.filter(i => i.category === (c.slug || c.id || c)).filter(Boolean)[0];
    if (first) return first;
  }
  return imgs[0];
}

/* 1200px is what every scraper asks for, and the editor already writes it. */
const SHARE_WIDTH = 1200;

/* The scheme is stripped either way rather than assumed, so one careless edit
   cannot produce "https://https://...". */
const domain = String((D.config||{}).domain || '').trim()
  .replace(/^https?:\/\//, '').replace(/\/$/, '');

const shot = pick();

function fileFor(p) {
  /* src is a BASE — 'photos/xyz' — and the widths hang off it. */
  const sized = p.src + '-' + SHARE_WIDTH + '.webp';
  return fs.existsSync(path.join(ROOT, sized)) ? sized : null;
}

let block = '', why = '';

if (!domain) {
  why = 'no domain yet — an og:image has to be an absolute url, so there is nothing to build one from';
} else if (!shot) {
  why = 'no photographs yet — nothing to show, so nothing is promised';
} else {
  const name = fileFor(shot);
  if (!name) {
    why = 'the chosen photograph is not on disk at ' + SHARE_WIDTH + 'px. Nothing written — a tag ' +
          'pointing at a missing file is worse than no tag, because the scraper caches the failure.';
  } else {
    const url = 'https://' + domain + '/' + name.replace(/^\//, '');
    const who = String((D.config||{}).name || 'Essel De Photographer');
    const alt = has(shot.alt) ? shot.alt : ('A photograph from ' + who);
    block =
      '<meta name="twitter:card" content="summary_large_image">\n' +
      '<meta property="og:image" content="' + url + '">\n' +
      '<meta property="og:image:width" content="' + SHARE_WIDTH + '">\n' +
      '<meta property="og:image:alt" content="' + String(alt).replace(/"/g, '&quot;') + '">\n' +
      '<meta name="twitter:image" content="' + url + '">';
    why = 'pointing at ' + name;
  }
}

const OPEN = '<!-- share-image: written by build/sync-share.js -->';
const SHUT = '<!-- /share-image -->';
const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let touched = 0;
PAGES.forEach(f => {
  let s = R(f);

  /* Out first, always — that is what makes running this twice safe, and what
     removes a stale tag when the answer becomes "no". */
  s = s.replace(new RegExp(rx(OPEN) + '[\\s\\S]*?' + rx(SHUT) + '\\n?'), '');

  if (block) {
    /* The block carries its own twitter:card, so any card already in the page
       would be a duplicate. Drop the loose one and let the block own it. */
    let body = block;
    if (/<meta name="twitter:card"[^>]*>/.test(s)) {
      body = block.replace(/<meta name="twitter:card"[^>]*>\n/, '');
    }
    const wrapped = OPEN + '\n' + body + '\n' + SHUT + '\n';
    const anchor = /<meta name="twitter:card"[^>]*>\n?/;
    s = anchor.test(s) ? s.replace(anchor, m => m + wrapped)
                       : s.replace('</head>', wrapped + '</head>');
  }

  W(f, s);
  touched++;
});

console.log('\n  share preview: ' + (block ? 'ON' : 'off') + ' — ' + why);
console.log('  ' + touched + ' pages written\n');
