// Walks the whole web build and reports every button, card or piece of text
// that overlaps another, is cut off at the screen's sides, or (on setup
// screens) needs scrolling. The author's rule: nothing may ever overlap.
// Run through tools/checks/overlaps.sh, which serves dist/ and tries four
// phone sizes. Screenshots of every screen go to OUT.
const {chromium}=require('playwright');
const OUT=process.env.OUT||'/tmp/amakarita-checks', VW=+process.env.VW||390, VH=+process.env.VH||844, TAG=process.env.TAG||'a', LANG=process.env.LANG2||'rw';
require('fs').mkdirSync(OUT,{recursive:true});
const findings=[];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:VW,height:VH},deviceScaleFactor:1});
await p.addInitScript(()=>{ try{ localStorage.setItem('amakarita.guides.v1', JSON.stringify({matatu:true,quiz:true})); }catch{} });
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const audit=async(name)=>{
  await p.waitForTimeout(450);
  const res=await p.evaluate(()=>{
    const overlays=[...document.querySelectorAll('[data-testid="overlay"]')];
    const root=overlays.length?overlays[overlays.length-1]:document.body;
    // The part of an element actually on show: cut down by every scrolling or clipping box around it.
    const clipRect=(e,r,self)=>{ let L=r.left,T=r.top,R=r.right,B=r.bottom; for(let a=self?e:e.parentElement;a&&a!==document.body;a=a.parentElement){ const cs=getComputedStyle(a); if(cs.overflowX!=='visible'||cs.overflowY!=='visible'){ const q=a.getBoundingClientRect(); if(cs.overflowX!=='visible'){L=Math.max(L,q.left);R=Math.min(R,q.right);} if(cs.overflowY!=='visible'){T=Math.max(T,q.top);B=Math.min(B,q.bottom);} } } return {left:L,top:T,right:R,bottom:B,width:R-L,height:B-T}; };
    const vis=(e)=>{const r0=e.getBoundingClientRect(); const r=clipRect(e,r0); if(r.width<4||r.height<4) return null; const cs=getComputedStyle(e); if(cs.visibility==='hidden'||+cs.opacity===0) return null; r.full=r0; return r;};
    const lab=(e)=>{const t=e.getAttribute('data-testid')==='card'||e.querySelector('[data-testid="card"]')?'card':(e.getAttribute('role')||'text'); const l=e.getAttribute('aria-label')||(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,24); return `${t}[${l}]`;};
    // Inside a horizontal scroller, items may run past the screen on purpose.
    const items=[];
    for(const e of root.querySelectorAll('[data-testid="card"],[role="button"],[role="radio"],[role="tab"],[role="switch"],[role="checkbox"]')){
      if(e.closest('[data-testid="card"]')!==e && e.closest('[data-testid="card"]')) continue; // things drawn inside a card
      if(e.getAttribute('data-testid')==='card' && e.parentElement.closest('[role="button"],[role="radio"]')) continue; // the button stands for its card
      const r=vis(e); if(r) items.push({e,r,kind:'box'});
    }
    // Leaf text that is not inside a button or card.
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const seen=new Set();
    while(walker.nextNode()){const t=walker.currentNode; if(!t.textContent.trim()) continue; const e=t.parentElement; if(seen.has(e)) continue; seen.add(e);
      if(e.closest('[data-testid="card"],[role="button"],[role="radio"],[role="tab"],[role="switch"],[role="checkbox"]')) continue;
      const rg=document.createRange(); rg.selectNodeContents(e); const r=clipRect(e,rg.getBoundingClientRect(),true); /* text cut short with … is clipped by its own box */ if(r.width<4||r.height<4) continue; items.push({e,r,kind:'text'});}
    const out=[];
    for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
      const A=items[i],B=items[j]; if(A.e.contains(B.e)||B.e.contains(A.e)) continue;
      if(A.kind==='text'&&B.kind==='text'){ /* text vs text */ }
      const ix=Math.min(A.r.right,B.r.right)-Math.max(A.r.left,B.r.left), iy=Math.min(A.r.bottom,B.r.bottom)-Math.max(A.r.top,B.r.top);
      if(ix>3&&iy>3) out.push(`${lab(A.e)} x ${lab(B.e)} (${Math.round(ix)}x${Math.round(iy)})`);
    }
    // Cut off by the screen sides (outside horizontal scrollers).
    const cut=[];
    for(const it of items){ if(it.kind!=='box') continue; 
      const f=it.r.full; if(f && (f.left<it.r.left-1||f.right>it.r.right+1) && it.r.width>4) { cut.push(`${lab(it.e)} partly hidden sideways (${Math.round(f.left)}..${Math.round(f.right)})`); continue; }
      if(it.r.left<-1||it.r.right>innerWidth+1) cut.push(`${lab(it.e)} (${Math.round(it.r.left)}..${Math.round(it.r.right)})`); }
    return {out,cut};
  });
  for(const o of res.out) findings.push(`[${name}] OVERLAP ${o}`);
  for(const c of res.cut) findings.push(`[${name}] CUT ${c}`);
  await p.screenshot({path:`${OUT}/${TAG}-${name}.png`});
};
const fits=async(name)=>{ const r=await p.evaluate(()=>[...document.querySelectorAll('div')].filter(d=>{const cs=getComputedStyle(d); return (cs.overflowY==='auto'||cs.overflowY==='scroll') && d.clientHeight>150;}).map(d=>d.scrollHeight-d.clientHeight)); const worst=Math.max(0,...r); if(worst>2) findings.push(`[${name}] NEEDS SCROLL by ${worst}px`); };
const top=async(loc)=>{ if(!(await loc.count())) return false; const h=await loc.first().elementHandle(); return await h.evaluate(e=>{const r=e.getBoundingClientRect(); const hit=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(r.height/2,20)); return !!hit&&(e===hit||e.contains(hit));}); };
const T=(rw,en)=>LANG==='en'?en:rw;
const go=async()=>{ await p.goto(process.env.URL||'http://localhost:8765/'); await p.waitForTimeout(1300); if(LANG==='en'){ await p.getByText('EN',{exact:true}).first().click(); await p.waitForTimeout(300);} };
const step=async(label,fn)=>{ try{ await fn(); }catch(e){ findings.push(`[${label}] STEP FAILED ${e.message.split('\n')[0].slice(0,120)}`); await p.screenshot({path:`${OUT}/${TAG}-FAILED-${label}.png`}).catch(()=>{});} };

await go(); await audit('home');
await step('cod',async()=>{ await p.getByRole('button',{name:T('Kanda urebe igisubizo','Tap to see the answer')}).first().click({timeout:3000}); await p.waitForTimeout(700); await audit('home-cod'); });
await step('decks',async()=>{ await go(); await p.getByRole('tab').nth(1).click(); await audit('decks'); });
await step('deck',async()=>{ await p.getByRole('button').filter({hasText:'Kirazira'}).first().click({timeout:3000}); await audit('deck'); });
await step('viewer',async()=>{ await p.locator('[role="button"]:has([data-testid="card"])').nth(3).click({timeout:3000}); await audit('viewer'); });
await step('games',async()=>{ await go(); await p.getByRole('tab').nth(2).click(); await audit('games'); });
await step('quiz-setup',async()=>{ await p.getByRole('button',{name:'Amakarita'}).first().click({timeout:3000}); await audit('quiz-setup-deck'); await fits('quiz-setup-deck'); await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await audit('quiz-setup-how'); await fits('quiz-setup-how'); await p.getByRole('radio',{name:T('Mubazanye','Ask each other')}).click(); await fits('quiz-setup-how-group'); await p.getByRole('radio',{name:T('Telefoni ibaza','Phone asks')}).click(); await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await audit('quiz-setup'); await fits('quiz-setup'); await p.getByRole('radio',{name:/^6 /}).click(); await audit('quiz-setup6'); await fits('quiz-setup6'); await p.getByRole('radio',{name:/^2 /}).click(); });
await step('quiz',async()=>{ await p.getByText(T('Tangira','Start'),{exact:true}).click(); await audit('quiz-draw');
  await p.locator('[data-testid="card"]').last().click({force:true}); await p.waitForTimeout(700); await audit('quiz-q');
  const opts=p.locator('[role="button"]').filter({hasText:/^[A-ZÀ-Ü’' ,()?\/0-9-]+$/}); if(await opts.count()) await opts.first().click(); else await p.getByRole('button',{name:/^(Ni byo|Yes|Si byo)/}).first().click().catch(()=>{});
  await p.waitForTimeout(1200); await audit('quiz-result'); });
await step('matatu-setup',async()=>{ await go(); await p.getByRole('button',{name:'Matatu'}).first().click(); await audit('matatu-setup-deck'); await fits('matatu-setup-deck'); await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await audit('matatu-setup'); await fits('matatu-setup'); await p.getByRole('radio',{name:/^6 /}).click(); await audit('matatu-setup6'); await fits('matatu-setup6'); });
for(const n of [2,4,6]){
  await step('matatu'+n,async()=>{ await go(); await p.getByRole('button',{name:'Matatu'}).first().click(); await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await p.getByRole('radio',{name:new RegExp('^'+n+' ')}).click({timeout:3000}); await p.getByText(T('Tangira','Start'),{exact:true}).click();
    for(let i=0;i<40;i++){ if(await top(p.getByText(T('Ni wowe ukina','Your turn'),{exact:false}))) break; await p.waitForTimeout(400);} await audit('matatu'+n);
    if(n===4){ // preview, then pick
      const hand=p.locator('[role="button"]:has([data-testid="card"])'); const c=await hand.count(); await hand.nth(c-1).click({force:true}); await audit('matatu-preview');
      await p.getByRole('button',{name:T('Reka','Cancel')}).click().catch(()=>{}); await p.waitForTimeout(300);
      const pick=p.getByRole('button',{name:/^(Fata|Pick|Take)/}); await pick.first().click(); await p.waitForTimeout(700); await audit('matatu-picked'); }
  });
}

await step('quiz-group',async()=>{ await go(); await p.getByRole('tab').nth(2).click(); await p.getByRole('button',{name:'Amakarita'}).first().click(); await p.getByRole('button',{name:T('Komeza','Continue')}).click();
  await p.getByRole('radio',{name:T('Mubazanye','Ask each other')}).click({timeout:3000}).catch(()=>p.getByText(T('Mubazanye','Ask each other')).click());
  await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await audit('quiz-group-setup'); await fits('quiz-group-setup'); await p.getByRole('radio',{name:/^6 /}).click(); await audit('quiz-group-setup6'); await fits('quiz-group-setup6'); await p.getByRole('radio',{name:/^2 /}).click();
  await p.getByText(T('Tangira','Start'),{exact:true}).click(); await p.waitForTimeout(700);
  await p.locator('[data-testid="card"]').last().click({force:true}); await p.waitForTimeout(900); await audit('quiz-group-q');
  const btns=await p.$$eval('[role="button"]',a=>a.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()).filter(Boolean)); findings.push('[quiz-group-q] buttons: '+btns.join(' | '));
  const next=p.getByRole('button').filter({hasText:/Erekana|Reveal|Show/}); if(await next.count()){ await next.first().click(); await p.waitForTimeout(700); await audit('quiz-group-reveal'); }
});
await step('quiz-over',async()=>{ await go(); await p.getByRole('tab').nth(2).click(); await p.getByRole('button',{name:'Amakarita'}).first().click(); await p.getByRole('button',{name:T('Komeza','Continue')}).click();
  await p.getByRole('radio',{name:T('Amahirwe 5','5 attempts'),exact:true}).click({timeout:3000}); await p.getByRole('button',{name:T('Komeza','Continue')}).click();
  await p.getByText(T('Tangira','Start'),{exact:true}).click(); await p.waitForTimeout(700);
  for(let i=0;i<120;i++){
    if(await p.getByText(T('Umukino warangiye','Game over')).count()){ await audit('quiz-over'); break; }
    const draw=p.getByText(T('Kanda ufate ikarita','Tap to draw a card'),{exact:true}); if(await top(draw)){ await p.locator('[data-testid="card"]').last().click({force:true}); await p.waitForTimeout(600); continue; }
    const opts=p.locator('[role="button"]').filter({hasText:/^[A-ZÀ-Ü’' ,()?\/0-9-]+$/}); if(await opts.count() && await top(opts.first())){ await opts.nth(i%3===0?1:0).click().catch(()=>{}); await p.waitForTimeout(500); continue; }
    const yes=p.getByRole('button',{name:/^(Ni byo|Yes|Kirazira|Indangagaciro)$/}); if(await yes.count() && await top(yes.first())){ await yes.first().click(); await p.waitForTimeout(500); continue; }
    const cont=p.getByRole('button',{name:T('Komeza','Continue')}); if(await cont.count() && await top(cont.first())){ await cont.first().click(); await p.waitForTimeout(500); continue; }
    await p.waitForTimeout(500);
  }
});
await step('matatu-pass',async()=>{ await go(); await p.getByRole('button',{name:'Matatu'}).first().click(); await p.getByRole('button',{name:T('Komeza','Continue')}).click(); await p.getByRole('radio',{name:/^2 /}).click();
  await p.getByRole('button',{name:new RegExp(T('Umukinnyi 2: ','Player 2: '))}).click({timeout:3000});
  await p.getByText(T('Tangira','Start'),{exact:true}).click(); await p.waitForTimeout(900); await audit('matatu-pass');
  await p.getByRole('button',{name:/^(Ndi|I am)/}).first().click({timeout:3000}); await p.waitForTimeout(600); await audit('matatu-pass-table');
});
await step('leave',async()=>{ await p.getByRole('button',{name:T('Va mu mukino','Leave game')}).first().click({timeout:3000}).catch(async()=>{ await p.locator('[role="button"]').first().click(); }); await p.waitForTimeout(500); await audit('leave-confirm'); });

await step('guide',async()=>{ await go(); await p.getByRole('button',{name:'Matatu'}).first().click(); await p.getByRole('button',{name:T('Uko bakina','How to play')}).click({timeout:3000});
  for(let i=0;i<6;i++){ await audit('guide-matatu-'+i); const btn=p.getByRole('button',{name:new RegExp('^('+T('Komeza|Tangira','Continue|Start')+')$')}).last(); await btn.click(); await p.waitForTimeout(250); }
  await go(); await p.getByRole('tab').nth(2).click(); await p.getByRole('button',{name:'Amakarita'}).first().click(); await p.getByRole('button',{name:T('Uko bakina','How to play')}).click({timeout:3000});
  for(let i=0;i<5;i++){ await audit('guide-quiz-'+i); const btn=p.getByRole('button',{name:new RegExp('^('+T('Komeza|Tangira','Continue|Start')+')$')}).last(); await btn.click(); await p.waitForTimeout(250); }
});
await step('ibisakuzo',async()=>{ await go(); await p.getByRole('tab').nth(2).click(); await p.getByRole('button',{name:'Ibisakuzo'}).first().click({timeout:3000}); await p.waitForTimeout(500);
  for(let i=0;i<4;i++){ await audit('guide-ibisakuzo-'+i); await p.getByRole('button',{name:new RegExp('^('+T('Komeza|Tangira','Continue|Start')+')$')}).last().click(); await p.waitForTimeout(250); }
  await audit('ibisakuzo-setup'); await fits('ibisakuzo-setup');
  await p.getByText(T('Tangira','Start'),{exact:true}).last().click(); await audit('ibisakuzo-sakwe');
  const round=async(tag)=>{ await p.getByRole('button',{name:'Soma!'}).click({timeout:3000}); if(tag) await audit('ibisakuzo-riddle');
    await p.getByRole('button',{name:T('Erekana igisubizo','Show the answer')}).last().click(); if(tag) await audit('ibisakuzo-answer');
    await p.getByRole('button',{name:new RegExp(T('Si byo','Wrong'))}).last().click(); if(tag) await audit('ibisakuzo-result'); };
  await round(true);
  for(let r=0;r<12;r++){ await p.getByRole('button',{name:T('Komeza','Continue')}).last().click(); await p.waitForTimeout(250); if(await p.getByText(T('Umukino warangiye','Game over')).count()) break; await round(false); }
  await audit('ibisakuzo-over');
});
await step('review',async()=>{ await go(); const start=p.getByRole('button',{name:new RegExp('^('+T('Tangira isubiramo ry’uyu munsi|Andi makarita 10','Start today’s review|10 more cards')+')$')}); /* the second once earlier steps met today's goal */ await start.scrollIntoViewIfNeeded(); await audit('home-review-button'); await start.click({timeout:3000}); await p.waitForTimeout(600); await audit('review-q');
  const opts=()=>p.locator('[role="button"]').filter({hasText:/^[A-ZÀ-Ü’' ,()?\/0-9-]+$|^(Kirazira|Indangagaciro)$/});
  await opts().first().click(); await p.waitForTimeout(900); await audit('review-result');
  let again=false;
  for(let i=0;i<90;i++){
    if(await p.getByText(T('Isubiramo rirarangiye','Review finished')).count()){ await audit('review-over'); break; }
    if(!again&&await p.getByText(T('Wongere ugerageze','One more try')).count()){ again=true; await audit('review-again'); }
    const cont=p.getByRole('button',{name:T('Komeza','Continue')}); if(await cont.count()){ await cont.first().click(); await p.waitForTimeout(400); continue; }
    if(await opts().count()){ await opts().nth(i%2).click().catch(()=>{}); await p.waitForTimeout(500); continue; }
    await p.waitForTimeout(400);
  }
  await p.getByRole('button',{name:T('Andi makarita 10','10 more cards')}).click({timeout:3000}); await p.waitForTimeout(600); await audit('review-more');
  await p.getByRole('button',{name:T('Subira inyuma','Back')}).first().click(); await p.waitForTimeout(500); await audit('home-after-review');
});
console.log(`== ${TAG} ${VW}x${VH} ${LANG}`); console.log(findings.join('\n')||'no findings'); console.log('errors',JSON.stringify(errs.slice(0,3)));
await b.close();})();
