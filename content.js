/* ============================================================================
   ESSEL DE PHOTOGRAPHER — the whole website is in this one file.

   THIS IS A SCRIPT, NOT A JSON FILE, AND THAT IS DELIBERATE.
   A browser refuses to let a page opened from a folder read a data file next
   to it. A <script> tag has no such rule. Writing the content as a script
   means index.html opens by DOUBLE-CLICKING it, on a Mac or on Windows, with
   nothing installed. No server, no launcher, no instructions.

   THIS FILE IS WRITTEN BY admin.html. Open that, make the changes, press Save.
   Do not type in here: one stray quotation mark takes the whole site down, and
   the editor cannot make that mistake.
   ========================================================================= */
window.SITE_DATA = {
  "_note": "The whole site is built from this file. Nothing here is hardcoded in the pages. Edit through admin.html, not by hand.",
  "meta": {
    "app": "essel-site",
    "version": 1,
    "saves": 32,
    "machine": "MacIntel",
    "savedAt": "2026-09-02T06:56:34.824Z"
  },
  "config": {
    "_note": "domain is blank until bought. It is used in ONE place to build canonicals and the sitemap, so filling it in later is a one-line change rather than an 18-place hunt.",
    "domain": "esseldephotographer.com",
    "name": "Essel",
    "descriptor": "De Photographer",
    "legalName": "Bismarck Essel",
    "city": "Accra",
    "country": "Ghana",
    "tagline": "Cinematic photography — portrait, event and editorial — made in Accra",
    "indexable": true,
    "_indexable": "TRUE since the domain was bought — the site is meant to be found, and this is the switch. It was left reading 'false until…' for weeks after the value had been turned on, which is the worst shape a note can take: somebody reads the sentence, believes the site is hidden, and the sentence is not what the build obeys. If you ever want the site hidden again, change the VALUE above, not this line.",
    "_tagline_note": "Uses his own word — cinematic — rather than one we chose. Everything else is drawn from his category list."
  },
  "contact": {
    "whatsapp": "233541651628",
    "phone": "054 165 1628",
    "email": "esselplange@gmail.com",
    "_note": "WhatsApp stored with the country code because wa.me requires it. Phone shown in local form because that is how people read it. Email named plainly for corporate and editorial enquiries.",
    "socials": [
      {
        "label": "TikTok",
        "url": "https://www.tiktok.com/@essel_de_photographer",
        "platform": "tiktok"
      },
      {
        "platform": "youtube",
        "url": "http://www.youtube.com/@esselplange"
      },
      {
        "platform": "instagram",
        "_url": "STRIPPED 25 September 2026. It arrived as a SHARE link carrying ?igsi=… and &utm_source=qr. `igsi` is a token Instagram mints for the person who copied the link — publishing one puts a token tied to somebody's own session on a public page, and it expires, so the link rots and the site looks like it gave out a dead address. `utm_source=qr` was worse: it would tell Instagram that every visitor arrived by scanning a QR code. Never paste a link straight out of the share sheet — cut everything from the question mark onwards.",
        "url": "https://www.instagram.com/essel_de_photographer"
      }
    ]
  },
  "hero": {
    "_note": "Up to five photographs, cross-fading slowly behind the fixed name. NOT a carousel: no arrows, no dots, nothing to click, nothing that slides. The first loads immediately; the rest wait until the page has finished, so adding photographs here does not slow the opening.\n\nEvery one needs a QUIET, DARKER CENTRE — the name sits across the middle of all five. One bright frame and the headline disappears on that slide only, which is worse than a bright hero throughout because nobody notices it.\n\nStops entirely for anyone who has asked their device to reduce motion, and pauses when the tab is not being looked at.",
    "placeholder": "#1A1614",
    "focal": "50% 40%",
    "cta": "See the work",
    "eyebrow": "Accra, Ghana",
    "slides": [
      {
        "desktop": "photos/hero-fc29120b.webp",
        "mobile": "photos/hero-tall-cd175f83.webp",
        "focal": "50% 40%",
        "alt": "Amerado late night show"
      },
      {
        "desktop": "photos/hero-2c4dcf91.webp",
        "mobile": "",
        "focal": "50% 40%",
        "alt": "Open Mic"
      },
      {
        "desktop": "photos/hero-ab7acb33.webp",
        "mobile": "",
        "focal": "50% 40%",
        "alt": "Stage craft"
      },
      {
        "desktop": "photos/hero-5bc48705.webp",
        "mobile": "",
        "focal": "50% 40%",
        "alt": "Band playing their hearts out"
      },
      {
        "desktop": "photos/hero-e410174c.webp",
        "mobile": "",
        "focal": "51% 9%",
        "alt": "Amewuga on stage"
      }
    ],
    "hold": 6500,
    "fade": 1800
  },
  "categories": [
    {
      "slug": "portrait",
      "name": "Portrait",
      "blurb": "People, photographed properly. Studio or on location.",
      "cover": "",
      "ratio": "4/5"
    },
    {
      "slug": "events",
      "name": "Events",
      "blurb": "Weddings, celebrations and the moments nobody thought to ask for.",
      "cover": "",
      "ratio": "3/2"
    },
    {
      "slug": "corporate",
      "name": "Corporate",
      "blurb": "Headshots, teams, and the working life of a business.",
      "cover": "",
      "ratio": "3/2"
    },
    {
      "slug": "editorial",
      "name": "Editorial",
      "blurb": "Commissioned work with a story attached.",
      "cover": "",
      "ratio": "3/2"
    }
  ],
  "images": [
    {
      "id": "2295adfa",
      "src": "photos/r6-20063-copy-5fff3c17",
      "alt": "Group photo after saturday fun",
      "category": "editorial",
      "ratio": "3/2",
      "focal": "50% 50%",
      "featured": true,
      "w": 0,
      "h": 0,
      "added": "2026-09-01T12:44:41.237Z",
      "showcase": false
    },
    {
      "id": "c7692f5f",
      "src": "photos/dsc00871-copy-jpg-copy-0260d27e",
      "alt": "A man with cowry posing for a portrait",
      "category": "portrait",
      "ratio": "3/2",
      "focal": "49% 0%",
      "featured": false,
      "w": 0,
      "h": 0,
      "added": "2026-09-01T12:23:49.995Z",
      "showcase": false
    },
    {
      "id": "207a12d0",
      "src": "photos/4y6a3603-copy-140019fb",
      "alt": "Out getting drinks",
      "category": "events",
      "ratio": "3/2",
      "focal": "49% 17%",
      "featured": false,
      "w": 0,
      "h": 0,
      "added": "2026-09-01T12:20:22.065Z",
      "showcase": false
    },
    {
      "id": "a78302e0",
      "src": "photos/r6-20134-copy-jpg-copy-ab31bc81",
      "alt": "Corporate woman",
      "category": "editorial",
      "ratio": "3/2",
      "focal": "38% 8%",
      "featured": false,
      "w": 0,
      "h": 0,
      "added": "2026-09-01T12:20:06.967Z",
      "showcase": false
    },
    {
      "id": "8a801786",
      "src": "photos/r6-20486-copy-jpg-copy-e13f9209",
      "alt": "A corporate lady ",
      "category": "corporate",
      "ratio": "3/2",
      "focal": "49% 49%",
      "featured": false,
      "w": 0,
      "h": 0,
      "added": "2026-09-01T12:06:16.316Z",
      "showcase": false
    }
  ],
  "about": {
    "heading": "Behind the camera",
    "body": "Bismarck Essel is a photographer working out of Accra, Ghana.\n\nHe photographs people — portraits, weddings and events, fashion, corporate and editorial commissions — with a cinematic eye and an unhurried manner on set. The calm is deliberate. People photograph better when nobody is rushing them, and the pictures show it.\n\nEvery frame is finished by hand. Nothing leaves the studio that he would not put his name to.",
    "portrait": "",
    "_note": "Rewritten 1 September from Essel's own description. His words 'cinematic' and 'calm energy' are the spine; the CV language around them was cut. Nothing here is claimed that he did not say. Show him before launch."
  },
  "categories_note": "Add, rename, reorder or remove freely in the admin. Nothing about a category is written into the pages. A slug never changes once created, even if the name does — changing it breaks saved links and loses the page in search."
};
