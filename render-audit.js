#!/usr/bin/env node
/* ============================================================================
 * render-audit.js — OPTIONAL third gate.
 *
 *   npm install jsdom && node build/render-audit.js
 *
 * checks.js and publish.js read the files as text. This one RUNS the site in a
 * real DOM and looks at what came out. It exists because the showcase makes a
 * claim that cannot be proved by reading source: that one photograph leaves the
 * grid, that a second one is refused, and that nothing is lost either way.
 *
 * IT NEEDS ONE PACKAGE, WHICH IS WHY IT IS NOT IN PUBLISH.command.
 * The two gates that decide whether a site may be pushed must not need a
 * package manager to be reachable on the day.
 * ==========================================================================*/
'use strict';
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.log('\nThis audit needs jsdom, which is not installed.\n');
  console.log('  npm install jsdom\n');
  console.log('Nothing else needs it. PUBLISH.command runs without it, and the');
  console.log('website itself has no dependencies at all.\n');
  process.exit(2);
}
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
let pass=0,fail=0;const bad=[];
const ok=(n,c,d)=>{c?(pass++,console.log('  ok   '+n)):(fail++,bad.push(n),console.log('  FAIL '+n+(d?'\n        '+d:'')));};

function render(page,query,DATA){
  const dom=new JSDOM(read(page),{runScripts:'outside-only',
    url:'http://localhost/'+page+(query||'')});
  const w=dom.window;
  w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.requestAnimationFrame=c=>c();
  w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  Object.defineProperty(w,'localStorage',{value:{getItem:()=>null,setItem(){}},configurable:true});
  /* THE DATA ARRIVES AS A SCRIPT, NOT AS A FETCH.

     This used to stub w.fetch and hand the data back as a promise. That was
     correct until data/content.json became data/content.js in the September
     2026 migration — after which site.js reads window.SITE_DATA and never
     calls fetch at all. The stub kept "working", the page rendered empty, and
     every check below failed for months without anybody looking, because this
     gate is optional and needs jsdom.

     A stale harness is worse than no harness: it reports failure on correct
     code, and the next person learns to ignore it. */
  w.SITE_DATA = DATA;
  /* Left deliberately hostile. If fetch is ever reintroduced this throws
     rather than quietly succeeding, which is the behaviour the build wants. */
  w.fetch=()=>{ throw new Error('this site must never fetch'); };
  w.eval(read('js/site.js'));
  return new Promise(r=>setTimeout(()=>r(w.document),60));
}

(async()=>{
const base=(function(){ const t=read('data/content.js'); const i=t.indexOf('window.SITE_DATA');
  return JSON.parse(t.slice(t.indexOf('=',i)+1).trim().replace(/;\s*$/,'')); })();

console.log('\nA. No showcase set — the page is exactly as it was');
{
  const D=JSON.parse(JSON.stringify(base));
  const d=await render('collection.html','?c=editorial',D);
  ok('no showcase element', d.querySelectorAll('.showcase').length===0);
  ok('every editorial photograph is in the grid',
     d.querySelectorAll('#collection .grid .card').length===
       D.images.filter(i=>i.category==='editorial').length);
}

console.log('\nB. One showcase set');
{
  const D=JSON.parse(JSON.stringify(base));
  const ed=D.images.filter(i=>i.category==='editorial');
  ed[0].showcase=true;
  const d=await render('collection.html','?c=editorial',D);
  const sc=d.querySelector('.showcase');
  ok('the showcase is rendered', !!sc);
  ok('it sits above the grid',
     sc && sc.compareDocumentPosition(d.querySelector('.grid'))
           & d.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
  ok('it is a figure with a caption', sc && sc.tagName==='FIGURE' && !!sc.querySelector('.cap'));
  ok('it left the grid', d.querySelectorAll('#collection .grid .card').length===ed.length-1);
  ok('it is still an aspect-ratio frame, not a pixel height',
     sc && /--ar:/.test(sc.querySelector('.frame').getAttribute('style')) &&
     !/height:\s*\d+px/.test(sc.querySelector('.frame').getAttribute('style')));
  ok('it keeps its focal point',
     sc && /--fp:/.test(sc.querySelector('.frame').getAttribute('style')));
  ok('it still offers all four widths',
     sc && [400,800,1200,2000].every(n=>sc.querySelector('img').srcset.includes(n+'w')));
  ok('it loads eagerly, being the top of the page',
     sc && sc.querySelector('img').getAttribute('fetchpriority')==='high');
  ok('it carries its alt text', sc && sc.querySelector('img').alt===ed[0].alt);
  ok('the grid photographs are no longer forced eager',
     [...d.querySelectorAll('.grid img')].every(i=>i.getAttribute('loading')==='lazy'));
}

console.log('\nC. Two set by hand — the site refuses the second');
{
  const D=JSON.parse(JSON.stringify(base));
  const ed=D.images.filter(i=>i.category==='editorial');
  ed[0].showcase=true; ed[1].showcase=true;
  const d=await render('collection.html','?c=editorial',D);
  ok('only one showcase renders', d.querySelectorAll('.showcase').length===1);
  ok('the other went back into the grid',
     d.querySelectorAll('#collection .grid .card').length===ed.length-1);
  ok('nothing was lost',
     d.querySelectorAll('.showcase').length +
     d.querySelectorAll('#collection .grid .card').length === ed.length);
}

console.log('\nD. A showcase with no photograph');
{
  const D=JSON.parse(JSON.stringify(base));
  const ed=D.images.filter(i=>i.category==='editorial');
  ed[0].showcase=true; ed[0].src='';
  const d=await render('collection.html','?c=editorial',D);
  ok('no empty frame is blown up to full width', d.querySelectorAll('.showcase').length===0);
  ok('it stays in the grid as a labelled frame',
     d.querySelectorAll('#collection .grid .card').length===ed.length);
}

console.log('\nE. Other pages untouched');
{
  const D=JSON.parse(JSON.stringify(base));
  D.images.filter(i=>i.category==='editorial')[0].showcase=true;
  const home=await render('index.html','',D);
  ok('the home page work grid is unchanged',
     home.querySelectorAll('#work-grid .card').length===D.images.filter(i=>i.featured).length);
  ok('the hero still renders', !!home.querySelector('.hero-in h1'));
  ok('no showcase leaked onto the home page', home.querySelectorAll('.showcase').length===0);
  const cols=await render('collections.html','',D);
  ok('the collections index is unchanged', cols.querySelectorAll('.showcase').length===0);
}

console.log('\n'+'='.repeat(58));
console.log(fail?('  '+fail+' FAILED, '+pass+' passed'):('  ALL '+pass+' RENDER CHECKS PASSED'));
bad.forEach(b=>console.log('   x '+b));
console.log('='.repeat(58));
process.exit(fail?1:0);
})();
