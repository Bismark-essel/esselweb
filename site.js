/* ===========================================================================
   ESSEL DE PHOTOGRAPHER — the only script on the site.

   Reads data/content.json and builds the page from it. Nothing about a
   category, an image, a phone number or a name is written into the HTML, so
   adding or removing a category in the admin changes the whole site with no
   code edit anywhere.

   No dependencies. No slider. Nothing moves on its own.
   ========================================================================= */
(function () {
  'use strict';

  var D = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }


  /* ── the image component, in one place ──────────────────────────────────
     Every photograph on the site is built here. If a picture needs different
     behaviour it gets a different ratio or focal point in the data — never a
     new rule in the stylesheet. */
  function frame(img, opts) {
    opts = opts || {};
    var ar    = (img.ratio || '4/5').replace('/', ' / ');
    var fp    = img.focal || '50% 50%';
    var base  = img.src || '';
    var alt   = esc(img.alt || '');
    var eager = !!opts.eager;

    /* No file yet — an honest labelled frame, never a broken image icon.
       Built, never hidden: the shape of the missing picture is still shown. */
    if (!base) {
      return '<div class="frame empty-frame" data-label="' +
        esc(opts.label || 'Photograph') + '" style="--ar:' + ar + '"></div>';
    }

    var w = [400, 800, 1200, 2000];
    var srcset = w.map(function (n) { return base + '-' + n + '.webp ' + n + 'w'; }).join(', ');
    var sizes  = opts.sizes || '(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw';

    return '<div class="frame" style="--ar:' + ar + ';--fp:' + fp + '">' +
      '<img src="' + base + '-1200.webp"' +
      ' srcset="' + srcset + '" sizes="' + sizes + '"' +
      ' alt="' + alt + '" width="1200" height="' + Math.round(1200 / ratioNum(img.ratio)) + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"') +
      '>' +
      (img.sample ? '<span class="sample-flag">Sample</span>' : '') +
      '</div>';
  }

  function ratioNum(r) {
    var p = String(r || '4/5').split('/');
    var n = parseFloat(p[0]), d = parseFloat(p[1]);
    return (n && d) ? n / d : 0.8;
  }



  /* ── the WhatsApp link ──────────────────────────────────────────────────
     WhatsApp opens on a blank message box, and a blank box is where most
     enquiries die — the visitor has to compose an opening line to a stranger
     about money, on a phone, standing up. Writing the first line for them
     removes that, and it arrives telling Essel what they were looking at.

     The number lives in ONE place (contact.whatsapp). Even if a wa.me link is
     also pasted into the socials list, the link is rebuilt from that number
     here, so the message can never be attached to some links and not others.

     {page} is replaced with what they were looking at, or with "your work"
     when that is not known — so the sentence is grammatical either way and
     there is only one template to edit. */
  var WA_DEFAULT = 'Hello Essel. I saw {page} on your website and I would ' +
                   'like to talk about a shoot.';

  function waContext() {
    var c = catOf(qs('c'));
    return c ? 'the ' + c.name.toLowerCase() + ' work' : 'your work';
  }

  function waLink() {
    var num = String(D.contact.whatsapp || '').replace(/[^0-9]/g, '');
    if (!num) return '';
    var tpl = D.contact.whatsappMessage;
    if (tpl == null || !String(tpl).trim()) tpl = WA_DEFAULT;
    var msg = String(tpl).split('{page}').join(waContext());
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

  /* ── social glyphs ──────────────────────────────────────────────────────
     Drawn here rather than loaded from an icon font, so there is no request,
     nothing to cache and nothing that can 404 in two years. All monochrome,
     all inheriting currentColor.

     Anything not in this list falls back to a lettered circle, so adding an
     unusual link in the admin never leaves a hole in the row. */
  var ICONS = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
               '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
               '<circle cx="17.2" cy="6.8" r="1.15" fill="currentColor"/>',
    tiktok:    '<path d="M14 3v11.4a3.1 3.1 0 1 1-2.6-3.06" fill="none" stroke="currentColor" ' +
               'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
               '<path d="M14 3c.5 2.4 2.2 4 4.6 4.2" fill="none" stroke="currentColor" ' +
               'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    facebook:  '<path d="M15 3h-2.2A3.8 3.8 0 0 0 9 6.8V10H6.6v3.2H9V21h3.3v-7.8h2.5l.5-3.2h-3V7.1c0-.6.4-1 1-1H15z" ' +
               'fill="currentColor"/>',
    x:         '<path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" stroke-width="1.8" ' +
               'stroke-linecap="round"/>',
    youtube:   '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
               '<path d="M10.2 9.3l5 2.7-5 2.7z" fill="currentColor"/>',
    linkedin:  '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
               '<circle cx="7.6" cy="7.8" r="1.25" fill="currentColor"/>' +
               '<path d="M7.6 10.8v6.6M11.4 17.4v-6.6M11.4 13.4c0-1.6 1-2.6 2.4-2.6s2.4 1 2.4 2.6v4" ' +
               'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    whatsapp:  '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.6z" ' +
               'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
               '<path d="M9 8.6c.3-.1.6 0 .8.3l.7 1.2c.1.2.1.5-.1.7l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.5' +
               'c.2-.2.5-.2.7-.1l1.2.7c.3.2.4.5.3.8-.3.8-1.1 1.2-1.9 1-2.6-.6-4.6-2.6-5.2-5.2' +
               '-.2-.8.2-1.6 1-1.9z" fill="currentColor"/>',
    pinterest: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
               '<path d="M10 20l2.2-8.4M9.4 11c-.3-1.9 1-3.6 3-3.7 1.9-.1 3.3 1.2 3.3 3 0 2.2-1.3 3.9-3 3.9' +
               '-.9 0-1.6-.6-1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
  };

  function socialIcon(p, label) {
    var g = ICONS[String(p || '').toLowerCase()];
    if (g) return '<svg viewBox="0 0 24 24" aria-hidden="true">' + g + '</svg>';
    /* Unknown platform — a lettered circle rather than a broken square. */
    var ch = (label || p || '?').trim().charAt(0).toUpperCase();
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
      '<text x="12" y="16.2" text-anchor="middle" font-size="10" font-weight="700" ' +
      'font-family="-apple-system,Helvetica,Arial,sans-serif" fill="currentColor">' + esc(ch) + '</text></svg>';
  }

  /* Names only for platforms ICONS can actually draw. Naming one it cannot
     draw is how Behance and Threads ended up in the admin's dropdown looking
     supported while rendering as a lettered circle. build/checks.js now
     refuses a dropdown option with no icon behind it. */
  function socialName(p) {
    var n = { instagram:'Instagram', tiktok:'TikTok', facebook:'Facebook', x:'X',
              youtube:'YouTube', linkedin:'LinkedIn', whatsapp:'WhatsApp',
              pinterest:'Pinterest' };
    return n[String(p||'').toLowerCase()] || (p ? p.charAt(0).toUpperCase()+p.slice(1) : 'Link');
  }

  function socialRow(cls) {
    var list = (D.contact.socials || []).filter(function (s) { return s.url; });
    if (!list.length) return '';
    return '<div class="' + cls + '">' + list.map(function (s) {
      /* Tolerates the older {label,url} shape as well as {platform,url}, so an
         out-of-date saved file degrades to the right icon rather than a letter. */
      var p = s.platform || String(s.label || '').toLowerCase().replace(/\s+/g, '');
      var name = socialName(p);
      /* WhatsApp is rebuilt from contact.whatsapp rather than trusting the
         pasted link, so the opening message is attached to every route in.
         A bare wa.me link saved here would otherwise open a blank box. */
      var href = (p === 'whatsapp' && waLink()) ? waLink() : s.url;
      return '<a href="' + esc(href) + '" target="_blank" rel="noopener"' +
        ' aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
        socialIcon(p, name) + '</a>';
    }).join('') + '</div>';
  }

  /* ── nav ────────────────────────────────────────────────────────────── */
  function nav() {
    var c = D.config;
    var here = location.pathname.split('/').pop() || 'index.html';
    var items = [
      { href: 'index.html',       label: 'Work' },
      { href: 'collections.html', label: 'Collections' },
      { href: 'about.html',       label: 'About' },
      { href: 'contact.html',     label: 'Contact' }
    ];

    $('#nav').innerHTML =
      '<a class="mark" href="index.html" aria-label="' +
          esc(c.name + ' ' + c.descriptor) + '">' +
        /* His own logo, 56KB of traced vector — referenced rather than
           inlined, so it is fetched once and cached instead of being
           written into every page. */
        '<img src="images/logo-white.svg" alt="" width="1107" height="689">' +
      '</a>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false">' +
        '<span></span><span></span><span></span></button>' +
      '<nav class="links" id="links">' +
        items.map(function (i) {
          return '<a href="' + esc(i.href) + '"' +
            (i.ext ? ' target="_blank" rel="noopener"' : '') +
            (!i.ext && i.href === here ? ' aria-current="page"' : '') +
            '>' + esc(i.label) + '</a>';
        }).join('') +
        socialRow('socials') +
      '</nav>';

    var b = $('#burger'), l = $('#links');
    b.addEventListener('click', function () {
      var open = l.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    if (!$('.rule')) {
      var r = document.createElement('div'); r.className = 'rule';
      document.body.insertBefore(r, document.body.firstChild);
    }
    var n = $('#nav');
    function scrolled() {
      var y = window.scrollY > 40;
      n.classList.toggle('solid', y);
      document.body.classList.toggle('scrolled', y);
    }
    scrolled();
    window.addEventListener('scroll', scrolled, { passive: true });
  }

  /* ── hero ───────────────────────────────────────────────────────────────
     Up to five photographs cross-fading behind the fixed name.

     Deliberately NOT a carousel — no arrows, no dots, nothing to click and
     nothing that slides. It is ambient. The moment a visitor has to operate
     something, it has failed.

     Only the first photograph is fetched with the page. The rest wait until
     load has finished, so five slides cost the same to open as one. */
  function hero() {
    var el = $('#hero'); if (!el) return;
    var h = D.hero, c = D.config;
    var slides = (h.slides || []).filter(function (s) { return s.desktop; });

    var stage = slides.length
      ? '<div class="hero-bg">' + slides.map(function (s, i) {
          return '<figure class="slide' + (i === 0 ? ' on' : '') + '"' +
            ' style="--fp:' + (s.focal || '50% 40%') + '"' +
            (i === 0 ? '' : ' data-src="' + esc(s.desktop) + '"') +
            (i === 0 ? '' : ' data-alt="' + esc(s.alt || '') + '"') +
            (i === 0 || !s.mobile ? '' : ' data-msrc="' + esc(s.mobile) + '"') + '>' +
            (i === 0
              ? '<picture>' +
                  (s.mobile ? '<source media="(max-width:768px)" srcset="' + esc(s.mobile) + '">' : '') +
                  '<img src="' + esc(s.desktop) + '" alt="' + esc(s.alt || '') +
                  '" fetchpriority="high"' +
                  ' width="2560" height="1707">' +
                '</picture>'
              : '') +
          '</figure>';
        }).join('') + '</div>'
      : '<div class="hero-bg placeholder"></div>';

    el.innerHTML = stage +
      '<div class="hero-in">' +
        (h.eyebrow ? '<div class="eyebrow">' + esc(h.eyebrow) + '</div>' : '') +
        '<h1>' + esc(c.name) + '</h1>' +
        '<p>' + esc(c.tagline) +
          (c.legalName ? '<span class="sig">by ' + esc(c.legalName) + '</span>' : '') +
        '</p>' +
        '<a class="see" href="#work"><span>' + esc(h.cta || 'See the work') + '</span>' +
          '<i></i><em>&#8964;</em></a>' +
      '</div>';

    if (slides.length < 2) return;

    /* Someone who has asked their device to reduce motion gets the first
       photograph and nothing else. Not a degraded version — the right one. */
    var still = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;

    var figs = el.querySelectorAll('.slide');
    var hold = +h.hold || 6500, fade = +h.fade || 1800, at = 0, timer = null;

    /* The other photographs load after the page has settled, so the opening
       screen is never held up by pictures nobody has seen yet. */
    function preload() {
      Array.prototype.slice.call(figs, 1).forEach(function (f) {
        if (f.querySelector('img')) return;
        var m = f.dataset.msrc, d2 = f.dataset.src, a = f.dataset.alt || '';
        f.innerHTML = '<picture>' +
          (m ? '<source media="(max-width:768px)" srcset="' + m + '">' : '') +
          '<img src="' + d2 + '" alt="' + esc(a) + '" loading="lazy" decoding="async"' +
          ' width="2560" height="1707"></picture>';
      });
    }
    if (document.readyState === 'complete') setTimeout(preload, 400);
    else window.addEventListener('load', function () { setTimeout(preload, 400); });

    function step() {
      var next = (at + 1) % figs.length;
      figs[at].classList.remove('on');
      figs[next].classList.add('on');
      at = next;
    }
    function run()  { stop(); timer = setInterval(step, hold + fade); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    /* Nothing moves while the tab is in the background. */
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : run();
    });
    run();
  }

  /* ── featured work — the portfolio half ─────────────────────────────── */
  function work() {
    var el = $('#work-grid'); if (!el) return;
    var picks = (D.images || []).filter(function (i) { return i.featured; });

    if (!picks.length) {
      el.innerHTML = '<div class="empty">No photographs selected yet. ' +
        'Mark images as featured in the admin and they appear here.</div>';
      return;
    }
    el.innerHTML = picks.map(function (img, n) {
      var cat = catOf(img.category);
      return '<a class="card" href="collection.html?c=' + esc(img.category) + '">' +
        frame(img, { eager: n < 3 }) +
        '<span class="cap"><b>' + esc(cat ? cat.name : '') + '</b></span></a>';
    }).join('');
  }

  function catOf(slug) {
    return (D.categories || []).filter(function (c) { return c.slug === slug; })[0];
  }


  /* ── film ───────────────────────────────────────────────────────────────
     Films are shown as STILLS, not players.

     Not embedding is the point. A YouTube iframe drags in roughly half a
     megabyte of somebody else's JavaScript before anyone presses play, it
     tracks the visitor whether or not they watch, and it dates the page the
     moment YouTube changes its player. A still frame costs one image.

     It also happens to be better. He is a photographer — a well-chosen frame
     from a film IS a photograph, and it belongs on the page on its own merits.
     The play mark only appears on hover, so at rest the row reads as work
     rather than as a video widget. */
  function films() {
    var el = $('#film-grid'); if (!el) return;
    var list = (D.videos || []).filter(function (v) { return v.url; });

    var sec = el.closest('section');
    if (!list.length) { if (sec) sec.style.display = 'none'; return; }

    el.innerHTML = list.map(function (v, n) {
      var still = v.still
        ? frame({ src: v.still, ratio: v.ratio || '16/9', focal: v.focal || '50% 50%',
                  alt: v.alt || v.title || '' },
                { eager: n < 2, sizes: '(max-width:640px) 100vw, 50vw' })
        : '<div class="frame empty-frame" data-label="' + esc(v.title || 'Film') +
          '" style="--ar:16 / 9"></div>';

      return '<a class="card film" href="' + esc(v.url) + '" target="_blank" rel="noopener">' +
        still +
        '<span class="play" aria-hidden="true">' +
          '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" ' +
          'stroke="currentColor" stroke-width="1.6"/>' +
          '<path d="M26 21l19 11-19 11z" fill="currentColor"/></svg></span>' +
        '<span class="cap"><b>' + esc(v.title || 'Untitled') + '</b>' +
          (v.length ? '<span>' + esc(v.length) + '</span>' : '') + '</span>' +
      '</a>';
    }).join('');
  }

  /* ── collections index — the catalogue half ─────────────────────────── */
  function collections() {
    var el = $('#collections-grid'); if (!el) return;
    var cats = D.categories || [];

    if (!cats.length) {
      el.innerHTML = '<div class="empty">No collections yet.</div>';
      return;
    }
    el.innerHTML = cats.map(function (c) {
      var cover = c.cover
        ? { src: c.cover, ratio: c.ratio, focal: c.focal, alt: c.name }
        : firstIn(c.slug) || { ratio: c.ratio, alt: '' };
      var n = countIn(c.slug);
      return '<a class="card" href="collection.html?c=' + esc(c.slug) + '">' +
        frame(cover, { sizes: '(max-width:640px) 100vw, 50vw', label: c.name }) +
        '<span class="cap"><b>' + esc(c.name) + '</b>' +
          '<span>' + n + (n === 1 ? ' photograph' : ' photographs') + '</span></span></a>';
    }).join('');
  }

  function firstIn(slug) {
    return (D.images || []).filter(function (i) { return i.category === slug && i.src; })[0];
  }
  function countIn(slug) {
    return (D.images || []).filter(function (i) { return i.category === slug; }).length;
  }

  /* ── one collection ─────────────────────────────────────────────────── */
  function collection() {
    var el = $('#collection'); if (!el) return;
    var slug = qs('c');
    var c = catOf(slug);

    if (!c) {
      el.innerHTML = '<div class="wrap"><div class="empty">' +
        'That collection does not exist. <a href="collections.html">See all collections</a>.' +
        '</div></div>';
      return;
    }
    document.title = c.name + ' — ' + D.config.name + ' ' + D.config.descriptor;

    var imgs = (D.images || []).filter(function (i) { return i.category === slug; });

    /* ── the showcase ───────────────────────────────────────────────────
       At most ONE photograph per collection may be marked in the editor as
       the showcase. It comes out of the grid and is set full width above it,
       where the stylesheet lets it open out as the visitor scrolls to it.

       "At most one" is enforced here as well as in the editor. Two showcases
       in a row is not a feature, it is a slideshow nobody asked for, and a
       content file can always be edited by hand. The first wins; the rest go
       back into the grid in their normal places, so nothing is ever lost. */
    var show = null;
    imgs = imgs.filter(function (i) {
      if (i.showcase && !show && i.src) { show = i; return false; }
      return true;
    });

    el.innerHTML =
      '<div class="wrap">' +
        '<div class="head"><div>' +
          '<span class="lbl">Collection</span>' +
          '<h2>' + esc(c.name) + '</h2>' +
          (c.blurb ? '<p>' + esc(c.blurb) + '</p>' : '') +
        '</div></div>' +
        (show
          ? '<figure class="showcase">' + frame(show, { eager: true,
              sizes: '(max-width:1180px) 100vw, 1180px' }) +
            (show.alt ? '<figcaption class="cap">' + esc(show.alt) + '</figcaption>' : '') +
            '</figure>'
          : '') +
        (imgs.length
          ? '<div class="grid">' + imgs.map(function (i, n) {
              return '<div class="card">' + frame(i, { eager: !show && n < 3 }) + '</div>';
            }).join('') + '</div>'
          : (show ? '' : '<div class="empty">No photographs in this collection yet.</div>')) +
      '</div>';
  }

  /* ── contact ────────────────────────────────────────────────────────── */
  function contact() {
    var el = $('#ways'); if (!el) return;
    var k = D.contact, out = [];

    if (k.whatsapp) out.push(way('WhatsApp', k.whatsapp, waLink(), true));
    if (k.phone)    out.push(way('Phone', k.phone, 'tel:' + String(k.phone).replace(/\s/g, '')));
    if (k.email)    out.push(way('Email — commissions and enquiries', k.email, 'mailto:' + k.email));
    el.innerHTML = (out.length ? out.join('')
      : '<div class="empty">Contact details have not been added yet.</div>');

    var row = socialRow('socials contact-socials');
    if (row) {
      var wrap = document.createElement('div');
      wrap.className = 'social-block';
      wrap.innerHTML = '<span class="lbl">Elsewhere</span>' + row;
      el.parentNode.appendChild(wrap);
    }
  }

  function way(label, value, href, primary) {
    return '<a class="way' + (primary ? ' primary' : '') + '" href="' + esc(href) + '"' +
      (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="lbl">' + esc(label) + '</span><b>' + esc(value) + '</b></a>';
  }

  /* ── about ──────────────────────────────────────────────────────────────
     An empty paragraph is not rendered at all — built, never hidden. Better a
     short honest page than a padded one, and nothing here is invented. */
  function about() {
    var el = $('#about-block'); if (!el) return;
    var a = D.about || {}, c = D.config;
    var paras = String(a.body || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); });

    el.innerHTML =
      '<div class="head"><span class="lbl">About</span><h2>' +
        esc(a.heading || 'Behind the camera') + '</h2></div>' +
      '<div class="about">' +
        '<div>' + (a.portrait
          ? frame({ src: a.portrait, ratio: '4/5', focal: a.portraitFocal || '50% 35%',
                    alt: esc(c.legalName || c.name) }, { sizes: '(max-width:900px) 100vw, 40vw' })
          : '<div class="frame empty-frame" style="--ar:4 / 5" data-label="Portrait"></div>') +
        '</div>' +
        '<div class="body">' + (paras.length
          ? paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('')
          : '<p class="empty">Not written yet.</p>') + '</div>' +
      '</div>';
  }

  /* ── foot ───────────────────────────────────────────────────────────── */
  function foot() {
    var el = $('#foot'); if (!el) return;
    var c = D.config;
    el.innerHTML =
      '<img src="images/logo-white.svg" alt="" width="1107" height="689" loading="lazy">' +
      '<div>' + esc(c.name) + ' ' + esc(c.descriptor) +
        (c.city ? ' &middot; ' + esc(c.city) + ', ' + esc(c.country) : '') + '</div>' +
      socialRow('socials foot-socials') +
      '<div>&copy; ' + new Date().getFullYear() + ' ' + esc(c.legalName || c.name) +
        '. All photographs are the property of the photographer.</div>';
  }


  /* ── structured data ────────────────────────────────────────────────────
     Tells Google this is a real photographer in a real city, not a page of
     pictures. It is the difference between being indexed and being understood,
     and it costs nothing. Built from the data file so it cannot go stale. */
  function schema() {
    var c = D.config, k = D.contact;
    var g = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      'additionalType': 'https://schema.org/Photograph',
      'name': c.name + ' ' + c.descriptor,
      'description': c.tagline,
      'address': { '@type': 'PostalAddress', 'addressLocality': c.city,
                   'addressCountry': 'GH' },
      'areaServed': { '@type': 'Country', 'name': 'Ghana' },
      'knowsAbout': (D.categories || []).map(function (x) { return x.name + ' photography'; }),
      'founder': { '@type': 'Person', 'name': c.legalName },
      'sameAs': (k.socials || []).map(function (x) { return x.url; }).filter(Boolean)
    };
    if (k.email) g.email = k.email;
    if (k.phone) g.telephone = k.phone;
    if (c.domain) g.url = /^https?:/.test(c.domain) ? c.domain : 'https://' + c.domain;

    var el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(g);
    document.head.appendChild(el);
  }

  /* ── testing hook ───────────────────────────────────────────────────────
     Node has no document, so requiring this file hands back the pure
     string-building functions instead of trying to boot a page. This is the
     only reason build/checks.js can test the real code rather than a copy of
     it — and a copy is what always drifts. Costs the browser nothing. */
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        setData:   function (d) { D = d; },
        frame:     frame,
        ratioNum:  ratioNum,
        waLink:    waLink,
        socialRow: socialRow,
        socialIcon: socialIcon,
        socialName: socialName
      };
    }
    return;
  }

  /* ── boot ─────────────────────────────────────────────────────────────
     NO FETCH. data/content.js has already run and left window.SITE_DATA
     behind, which is why index.html opens on a double-click with nothing
     installed. A browser will not let a page opened from a folder read a
     JSON file beside it; a <script> tag has no such restriction.

     This replaced a fetch on 4 September 2026. The launcher still works and
     still starts a server, but it is no longer required for anything. */
  D = window.SITE_DATA || null;

  if (!D) {
    document.body.innerHTML =
      '<div style="padding:60px 24px;font-family:sans-serif;color:#F4EFE9;' +
      'background:#0E0C0B;min-height:100vh">' +
      '<h1 style="font-size:1.3rem;margin-bottom:14px">The content file did not load</h1>' +
      '<p style="color:#A2968C;max-width:40em;line-height:1.7">Check that ' +
      '<b>data/content.js</b> is still in the <b>data</b> folder next to this page, ' +
      'with that exact name. Nothing else is needed to open this site.</p></div>';
    return;
  }

  nav(); hero(); work(); collections(); collection(); films(); about(); contact(); foot(); schema();
  document.body.classList.add('ready');

})();
