const $=id=>document.getElementById(id);
const rows=[...document.querySelectorAll('#markets tr[data-market]')];
const prices={aurora:[64,36]};

// Market data for sparkline - must match the data being charted


// Market names for command palette
const marketNames={
 aurora:'Aurora upgrade before January',
 grant:'Which project receives the grant',
 contributors:'Monthly contributors if the grants plan passes',
 lumen:'How will reviewers score the Lumen proposal',
 vault:'Will Demo Vault A lose over 5%',
 rubric:'Which projects meet the public-goods rubric'
};
const allMarkets=Object.keys(marketNames);
const books={
 aurora:[['Yes',.64],['No',.36]],
 grant:[['Meridian',.44],['Quarry',.31],['Fieldnotes',.25]],
 contributors:[['Over 1.2k',.55],['1.0\u20131.2k',.30],['Under 1.0k',.15]],
 lumen:[['8 or higher',.58],['7\u20138',.29],['Under 7',.13]],
 vault:[['Yes, over 5%',.34],['No',.66]],
 rubric:[['Exactly 3',.41],['More than 3',.32],['Fewer than 3',.27]],
};
const series={
 '7d':{points:[47,50,48,56,54,60,64],label:'seven-day',ago:'7 days ago'},
 '30d':{points:[38,41,44,40,45,52,49,55,58,64],label:'thirty-day',ago:'30 days ago'},
 '90d':{points:[22,28,25,33,30,38,44,41,49,55,52,64],label:'ninety-day',ago:'90 days ago'},
};
let side='buy',unit='credits',outcomeIdx=0;
let currentMarket='aurora';

const detail={
 aurora:['Aurora upgrade before January?','64%','Market-implied probability · Yes','Public release of Aurora v2 on its main network before 1 January 2027.','A market estimate, not a promise that the upgrade will ship.'],
 grant:['Which project receives the grant?','38%','Selection forecast · Lumen','The fictional Northstar committee selects one recipient: Lumen, Atlas, Grove or Other.','Forecasts of the committee\'s choice. The committee, not the market, selects the recipient.'],
 contributors:['Contributors if the plan passes','1,240','Forecast monthly contributors · people','Unique active contributors in March 2027, conditional on the fictional grants plan passing.','A conditional quantity, not a probability. Compare with the same measure if the plan does not pass.'],
 lumen:['How will reviewers score Lumen?','8.2 / 10','Forecast mean reviewer score','The mean score from the fictional review panel against the published 10-point rubric.','A forecast of human evaluation, not a score already awarded or a funding decision.'],
 vault:['A loss event at Demo Vault A?','2.4%','Market-implied probability · Yes','Loss exceeding 5% of deposited principal over the fictional 90-day observation window.','A risk estimate for this event and horizon only. It is not a safety rating or expected loss percentage.'],
 rubric:['Which projects meet the rubric?','3 outcomes','Separate project outcome markets','Lumen, Atlas and Grove are each assessed independently against the fictional public-goods rubric.','More than one project can qualify. Their probabilities need not add up to 100%.']
};
function select(row){
 rows.forEach(r=>{r.classList.toggle('selected-row',r===row);r.querySelector('.market-link').setAttribute('aria-pressed',String(r===row));});
 const key=row.dataset.market;currentMarket=key;outcomeIdx=0;
 const d=detail[key];
 ['detail-title','quote','quote-label','criterion','meaning'].forEach((id,i)=>$(id).textContent=d[i]);
 const pair=prices[key];$('chart').hidden=false; document.querySelector('.tf-tabs').hidden=false; renderTf(currentTf); renderOutcomes(); calculate();
 if(pair){$('up-pill').textContent=pair[0]+'\u00a2';$('down-pill').textContent=pair[1]+'\u00a2';}
 document.querySelector('.outcome-pair').hidden=!pair;
 $('selection-status').textContent='Selected: '+d[0];
}
let domain='all';
function filter(){
 const query=$('search').value.trim().toLowerCase(),type=$('type').value;
 let count=0;rows.forEach(row=>{const match=row.textContent.toLowerCase().includes(query)&&(type==='all'||row.dataset.type===type)&&(domain==='all'||row.dataset.domain===domain);row.hidden=!match;if(match)count++;});
 $('result-count').textContent=`${count} sample market${count===1?'':'s'}`;
 $('empty').hidden=count!==0;document.querySelector('.table-scroll').hidden=count===0;
 $('clear').disabled=!query&&type==='all'&&domain==='all';
 const url=new URL(location);query?url.searchParams.set('q',query):url.searchParams.delete('q');type!=='all'?url.searchParams.set('type',type):url.searchParams.delete('type');history.replaceState(null,'',url);
}
function clear(){ $('search').value='';$('type').value='all';domain='all';document.querySelectorAll('.chips .chip').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.domain==='all')));filter();$('search').focus(); }
$('filters').addEventListener('submit',e=>{e.preventDefault();filter();});$('search').addEventListener('input',filter);$('type').addEventListener('change',filter);$('clear').addEventListener('click',clear);$('reset-empty').addEventListener('click',clear);
document.querySelectorAll('.chips .chip').forEach(chip=>chip.addEventListener('click',()=>{domain=chip.dataset.domain;document.querySelectorAll('.chips .chip').forEach(c=>c.setAttribute('aria-pressed',c===chip));filter();}));
rows.forEach(row=>{
 row.querySelector('.market-link').addEventListener('click',()=>openMarket(row.dataset.market));
 row.querySelectorAll('.trade-cell .yn-pill').forEach(b=>b.addEventListener('click',()=>{
  openMarket(row.dataset.market);
  outcomeIdx=Number(b.dataset.idx);side='buy';
  document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.side==='buy')));
  outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
  $('bigyn').querySelectorAll('.bigyn-btn').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.idx)===outcomeIdx)));
  calculate();
 }));
});
const params=new URLSearchParams(location.search);$('search').value=params.get('q')||'';if([...$('type').options].some(o=>o.value===params.get('type')))$('type').value=params.get('type');filter();
function price(){const b=books[currentMarket]||books.aurora;return b[Math.min(outcomeIdx,b.length-1)][1];}
function calculate(){
 const amount=Number($('amount').value),pr=price();
 const book=books[currentMarket]||books.aurora;
 const valid=Number.isFinite(amount)&&amount>=1&&amount<=1000;
 const outLabel=book[Math.min(outcomeIdx,book.length-1)][0];
 if(!valid){$('calculation').textContent=unit==='credits'?'Enter a number from 1 to 1,000 demo credits.':'Enter a number of shares from 1 to 1,000.';$('max-win').textContent='';$('trade-status').textContent='';return valid;}
 const shares=unit==='credits'?amount/pr:amount;
 const credits=unit==='credits'?amount:amount*pr;
 $('calculation').textContent=`${side==='buy'?'Buy':'Sell'} ${outLabel}: ${amount.toLocaleString()} ${unit==='credits'?'demo credits':'shares'} at ${pr.toFixed(2)} \u2192 ${shares.toFixed(2)} simulated shares for ${credits.toFixed(2)} demo credits`;
 $('max-win').textContent=side==='buy'?`If ${outLabel} wins: pays ${shares.toFixed(2)} \u2014 max win +${(shares-credits).toFixed(2)} demo credits, max loss ${credits.toFixed(2)}.`:`You release ${shares.toFixed(2)} shares for ${credits.toFixed(2)} now \u2014 if ${outLabel} wins you owe ${shares.toFixed(2)}.`;
 $('trade-status').textContent='';
 return valid;
}

// ===== SORTABLE COLUMNS =====
const tbody=document.querySelector('#markets');
let sortCol=null,sortDir=1;
document.querySelectorAll('.col-sort').forEach(btn=>btn.addEventListener('click',()=>{
 const col=btn.dataset.col;
 if(sortCol===col)sortDir=-sortDir;else{sortCol=col;sortDir=-1;}
 const attr='data-'+col;
 const sorted=[...tbody.querySelectorAll('tr')].sort((a,b)=>(parseFloat(a.getAttribute(attr))-parseFloat(b.getAttribute(attr)))*sortDir);
 sorted.forEach(r=>tbody.appendChild(r));
 document.querySelectorAll('.col-sort').forEach(b=>{
  const active=b===btn;
  b.querySelector('.sort-ind').textContent=active?(sortDir===-1?'\u2193':'\u2191'):'\u2195';
  b.closest('th').setAttribute('aria-sort',active?(sortDir===-1?'descending':'ascending'):'none');
 });
}));

// ===== WATCHLIST =====
const WKEY='seer-watchlist';
let watched=[];
try{watched=JSON.parse(localStorage.getItem(WKEY)||'[]');}catch(e){}
function paintStars(){
 document.querySelectorAll('.star').forEach(btn=>{
  const on=watched.includes(btn.dataset.watch);
  btn.setAttribute('aria-pressed',String(on));
  btn.classList.toggle('star-on',on);
 });
}
document.querySelectorAll('.star').forEach(btn=>btn.addEventListener('click',()=>{
 const k=btn.dataset.watch;
 watched=watched.includes(k)?watched.filter(x=>x!==k):[...watched,k];
 try{localStorage.setItem(WKEY,JSON.stringify(watched));}catch(e){}
 paintStars();
}));
paintStars();

// ===== INLINE TRADE TICKET =====
const outcomesEl=$('outcomes');
function renderOutcomes(){
 const book=books[currentMarket]||books.aurora;
 outcomeIdx=Math.min(outcomeIdx,book.length-1);
 outcomesEl.innerHTML=book.map(([label,pr],i)=>`<button type="button" class="outcome-row" data-idx="${i}" aria-pressed="${i===outcomeIdx}"><span class="or-name">${esc(label)}</span><span class="or-price" data-ui-number>${Math.round(pr*100)}\u00a2</span></button>`).join('');
}
outcomesEl.addEventListener('click',e=>{
 const btn=e.target.closest('.outcome-row');if(!btn)return;
 outcomeIdx=Number(btn.dataset.idx);
 outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
 calculate();
});
document.querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click',()=>{side=b.dataset.side;document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));calculate();}));
document.querySelectorAll('[data-unit]').forEach(b=>b.addEventListener('click',()=>{unit=b.dataset.unit;document.querySelectorAll('[data-unit]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelector('label[for="amount"]').textContent=unit==='credits'?'Amount \u00b7 demo credits':'Amount \u00b7 shares';calculate();}));
$('amount').addEventListener('input',calculate);
$('simulate').addEventListener('click',()=>{if(calculate())$('trade-status').textContent='Simulation complete. No wallet; no order placed.';});
renderOutcomes();calculate();

// ===== COMMAND PALETTE =====
const palette=$('palette');
const paletteInput=$('palette-input');
const paletteList=$('palette-list');
let paletteIndex=-1;
let paletteMatches=[];

function updatePalette(query){
 const q=query.replace(/^\//,'').toLowerCase().trim();
 const AM=Object.keys(marketNames);paletteMatches=q?AM.filter(k=>marketNames[k].toLowerCase().includes(q)||k.toLowerCase().includes(q)):AM;
 paletteIndex=paletteMatches.length?0:-1;
 paletteList.innerHTML=paletteMatches.map((key,i)=>
  `<button type="button" role="option" data-market="${key}" aria-selected="${i===paletteIndex}" class="${i===paletteIndex?'selected':''}"><span class="pm-name">${marketNames[key]}</span><span class="pm-type">${detail[key][2]}</span></button>`).join('');
}
function openPalette(){
 palette.hidden=false;
 palette.classList.add('open');
 paletteInput.value='';
 updatePalette('');
 paletteInput.focus();
}
function closePalette(){
 palette.classList.remove('open');
 palette.hidden=true;
 paletteInput.value='';
 paletteIndex=-1;
}
function selectPaletteItem(){
 if(paletteIndex>=0&&paletteIndex<paletteMatches.length){
  const key=paletteMatches[paletteIndex];
  closePalette();openMarket(key);return;
 }
 closePalette();
}
paletteInput.addEventListener('input',()=>updatePalette(paletteInput.value));
paletteInput.addEventListener('keydown',e=>{
 if(e.key==='Enter'){e.preventDefault();selectPaletteItem();}
 else if(e.key==='ArrowDown'){e.preventDefault();paletteIndex=Math.min(paletteIndex+1,paletteMatches.length-1);paintPaletteSelection();}
 else if(e.key==='ArrowUp'){e.preventDefault();paletteIndex=Math.max(paletteIndex-1,0);paintPaletteSelection();}
 else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePalette();}
});
function paintPaletteSelection(){
 const btns=paletteList.querySelectorAll('button');
 btns.forEach((btn,i)=>{btn.classList.toggle('selected',i===paletteIndex);btn.setAttribute('aria-selected',String(i===paletteIndex));});
 btns[paletteIndex]?.scrollIntoView({block:'nearest'});
}
paletteList.addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(btn){paletteIndex=[...paletteList.querySelectorAll('button')].indexOf(btn);selectPaletteItem();}
});
palette.addEventListener('click',e=>{if(e.target===palette)closePalette();});
document.addEventListener('keydown',e=>{
 if(e.key==='/'&&!palette.classList.contains('open')){
  const t=e.target;
  if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;
  e.preventDefault();
  openPalette();
 }
});


// ===== CREATE MARKET (demo) =====
const CDKEY='seer-created-markets';
function createdList(){try{return JSON.parse(localStorage.getItem(CDKEY)||'[]');}catch(e){return[];}}
function fmtVol(v){return v>=1000?(v/1000).toFixed(1).replace('.0','')+'k':String(v);}
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function registerCreated(m){
 marketNames[m.key]=m.title;
 detail[m.key]=[m.title,m.signal,m.quoteLabel,m.criterion,m.meaning];
 books[m.key]=m.book;
 if(m.book.length===2)prices[m.key]=[Math.round(m.book[0][1]*100)+'\u00a2',Math.round(m.book[1][1]*100)+'\u00a2'];
 const tr=document.createElement('tr');
 tr.dataset.market=m.key;tr.dataset.signal=m.signalNum;tr.dataset.volume=m.liquidity;tr.dataset.type=m.type;tr.dataset.domain=m.domain;
 tr.innerHTML=`<td><span class="market-cell"><button class="star" type="button" data-watch="${m.key}" aria-pressed="false" aria-label="Watch this market: ${esc(m.title)}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path class="star-path" d="M8 1.6l2.02 4.24 4.66.56-3.44 3.2.9 4.62L8 12.06l-4.14 2.16.9-4.62L1.32 6.4l4.66-.56z"/></svg></button><button class="market-link" type="button" aria-pressed="false">${esc(m.title)}</button></span><small>${esc(m.typeLabel)} · Demo session</small></td><td class="numeric" data-ui-number>${esc(m.signal)}</td><td class="numeric" data-ui-number>${fmtVol(m.liquidity)}</td><td class="trade-cell">` + (m.book.length===2?m.book:m.book.slice(0,2)).map(([l,pr],bi)=>`<button type="button" class="yn-pill ${m.book.length===2?(bi===0?'yn-yes':'yn-no'):'yn-take'}" data-market="${m.key}" data-idx="${bi}"><span class="yn-l">${esc(l)}</span> <span class="yn-c" data-ui-number>${Math.round(pr*100)}\u00a2</span></button>`).join('') + `</td>`;
 tbody.appendChild(tr);
 rows.push(tr);
 tr.querySelector('.market-link').addEventListener('click',()=>openMarket(m.key));
 tr.querySelectorAll('.trade-cell .yn-pill').forEach(b=>b.addEventListener('click',()=>{
  openMarket(m.key);outcomeIdx=Number(b.dataset.idx);side='buy';
  document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.side==='buy')));
  outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
  calculate();
 }));
 tr.querySelector('.star').addEventListener('click',()=>{
  watched=watched.includes(m.key)?watched.filter(x=>x!==m.key):[...watched,m.key];
  try{localStorage.setItem(WKEY,JSON.stringify(watched));}catch(e){}
  paintStars();
 });
}
createdList().forEach(registerCreated);
renderRail();
paintStars();

const createDialog=$('create');
const TYPE_LABELS={binary:'Binary',categorical:'Categorical',conditional:'Conditional',scalar:'Scalar',multi:'Multi-categorical'};
$('ctype').addEventListener('change',()=>{
 $('coutcomes-wrap').style.display=$('ctype').value==='binary'?'none':'';
 if($('ctype').value==='binary')$('coutcomes').value='Yes, No';
});
$('create-open').addEventListener('click',()=>{createDialog.showModal();$('cq').focus();});
$('create-close').addEventListener('click',()=>createDialog.close());
$('create-form').addEventListener('submit',e=>{
 e.preventDefault();
 const q=$('cq').value.trim();
 const type=$('ctype').value,domain=$('cdomain').value;
 const labels=(type==='binary'?['Yes','No']:$('coutcomes').value.split(',').map(x=>x.trim()).filter(Boolean));
 const liq=Math.round(Number($('cliquidity').value));
 if(q.length<10){$('create-status').textContent='Give the question at least 10 characters.';return;}
 if(labels.length<2){$('create-status').textContent='List at least two outcomes.';return;}
 if(!Number.isFinite(liq)||liq<100||liq>10000){$('create-status').textContent='Opening volume must be 100 to 10,000 demo credits.';return;}
 const key='created-'+Date.now().toString(36);
 const share=1/labels.length;
 const book=labels.map(l=>[l,share]);
 const top=labels[0];
 const signalNum=Math.round(share*100);
 const m={key,title:q,type,domain,typeLabel:TYPE_LABELS[type],book,
  signal:`${signalNum}% ${top}`,signalNum,liquidity:liq,
  quoteLabel:'Opening probability · '+top,
  criterion:'Resolution criteria to be defined by the market creator. Demo market created in this session.',
  meaning:'A demo market stored only in this browser. Nothing is deployed onchain.'};
 const all=createdList();all.push(m);
 try{localStorage.setItem(CDKEY,JSON.stringify(all));}catch(err){}
 registerCreated(m);
 renderRail();
 filter();
 const row=document.querySelector(`tr[data-market="${key}"]`);
 if(row){select(row);row.scrollIntoView({behavior:'smooth',block:'center'});}
 $('create-status').textContent='';
 createDialog.close();
 e.target.reset();$('coutcomes-wrap').style.display='';$('coutcomes').value='Yes, No';
});

// ===== MARKET DETAIL VIEW =====
const mv=$('market-view');
const chartFig=$('chart');
const tfTabs=document.querySelector('.tf-tabs');
const ticketEl=document.querySelector('.ticket');
const chartHome={parent:chartFig.parentElement,next:chartFig.nextSibling};
const tfHome={parent:tfTabs.parentElement,next:tfTabs.nextSibling};
const ticketHome={parent:ticketEl.parentElement,next:ticketEl.nextSibling};
const mainBlocks=[document.querySelector('.workspace'),document.querySelector('.preview-note')];
function fmtK(v){return v>=1000?(v/1000).toFixed(1).replace('.0','')+'k':String(v);}
function delta(label){let h=0;for(const c of label)h=(h*31+c.charCodeAt(0))%997;return ((h%60)-30)/10;}
function openMarket(key){
 const row=document.querySelector(`tr[data-market="${key}"]`);
 if(row)select(row);
 const d=detail[key];if(!d)return;
 currentMarket=key;outcomeIdx=0;renderOutcomes();calculate();
 $('mv-kicker').textContent=(row?row.dataset.type:'')+(row?' · '+row.dataset.domain:'');
 $('mv-title').textContent=d[0];
 $('mv-quote').textContent=d[1];
 $('mv-quote-label').textContent=d[2];
 $('mv-criterion').textContent=d[3];
 $('mv-meaning').textContent=d[4];
 const book=books[key]||books.aurora;
 $('mv-outcomes').innerHTML=book.map(([label,pr],i)=>{
  const dl=delta(label);
  const cents=Math.round(pr*100);
  const actions=book.length===2
   ? `<button type="button" class="yn-pill yn-yes" data-idx="${i}" aria-pressed="${i===outcomeIdx}">Yes ${cents}\u00a2</button><button type="button" class="yn-pill yn-no" data-idx="${i}" data-comp="${1-i}">No ${100-cents}\u00a2</button>`
   : `<button type="button" class="yn-pill yn-take" data-idx="${i}" aria-pressed="${i===outcomeIdx}">${label} ${cents}\u00a2</button>`;
  return `<div class="mv-contract"><span class="mc-name">${esc(label)}</span><span class="mc-delta ${dl>=0?'up':'down'}" data-ui-number>${dl>=0?'+':''}${dl.toFixed(1)}%</span><span class="mc-actions">${actions}</span></div>`;
 }).join('');
 const byn=$('bigyn');
 if(book.length===2){
  byn.innerHTML=book.map(([label,pr],i)=>`<button type="button" class="bigyn-btn ${i===0?'yes':'no'}" data-idx="${i}"><span class="bj-name">${esc(label)}</span><span class="bj-price" data-ui-number>${Math.round(pr*100)}\u00a2</span></button>`).join('');
 }else{
  byn.innerHTML=book.slice(0,2).map(([label,pr],i)=>`<button type="button" class="bigyn-btn take" data-idx="${i}"><span class="bj-name">${esc(label)}</span><span class="bj-price" data-ui-number>${Math.round(pr*100)}\u00a2</span></button>`).join('');
 }
 const vol=row?Number(row.dataset.volume):2500;
 $('mv-vol').textContent=fmtK(vol)+' demo credits';
 $('mv-liq').textContent=fmtK(Math.round(vol*0.6))+' demo credits';
 const mvs=$('mv-star');mvs.dataset.watch=key;paintStars();
 mvs.setAttribute('aria-label','Watch this market: '+d[0]);

 // move chart + ticket into the detail view (listeners survive reparenting)
 $('mv-chart-slot').appendChild(tfTabs);$('mv-chart-slot').appendChild(chartFig);
 tfTabs.hidden=false;chartFig.hidden=false; renderTf(currentTf);
 $('mv-ticket-slot').appendChild(ticketEl);
 mainBlocks.forEach(el=>el.hidden=true);
 mv.hidden=false;
 history.pushState({m:key},'',location.pathname+'?m='+key);
 document.title=d[0]+' · Seer market';
 window.scrollTo(0,0);
 $('mv-title').focus({preventScroll:true});
}
function closeMarket(){
 chartHome.parent.insertBefore(chartFig,chartHome.next);
 tfHome.parent.insertBefore(tfTabs,tfHome.next);
 ticketHome.parent.insertBefore(ticketEl,ticketHome.next);
 mv.hidden=true;
 mainBlocks.forEach(el=>el.hidden=false);
 history.pushState({},'',location.pathname);
 document.title='Market explorer · Seer / Common Ground';
 $('mv-back').blur();
}
$('mv-back').addEventListener('click',closeMarket);
$('mv-copy').addEventListener('click',async()=>{
 const url=location.origin+location.pathname+'?m='+currentMarket;
 try{await navigator.clipboard.writeText(url);$('mv-copy').textContent='Link copied';}
 catch(e){$('mv-copy').textContent=url;}
 setTimeout(()=>{$('mv-copy').textContent='Copy link';},1800);
});
$('mv-star').addEventListener('click',()=>{
 const k=$('mv-star').dataset.watch;if(!k)return;
 watched=watched.includes(k)?watched.filter(x=>x!==k):[...watched,k];
 try{localStorage.setItem(WKEY,JSON.stringify(watched));}catch(e){}
 paintStars();
});
$('mv-outcomes').addEventListener('click',e=>{
 const btn=e.target.closest('.yn-pill');if(!btn)return;
 outcomeIdx=Number(btn.dataset.comp!==undefined?btn.dataset.comp:btn.dataset.idx);
 side='buy';
 document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.side==='buy')));
 outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
 $('mv-outcomes').querySelectorAll('.yn-pill[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.idx)===outcomeIdx)));
 calculate();
 ticketEl.scrollIntoView({behavior:'smooth',block:'nearest'});
 $('amount').focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mv.hidden)closeMarket();});
window.addEventListener('popstate',()=>{const m=new URLSearchParams(location.search).get('m');if(m&&detail[m]){if(mv.hidden)openMarket(m);}else if(!mv.hidden)closeMarket();});
// deep link
const deepM=new URLSearchParams(location.search).get('m');
window.__deepM=deepM;
if(window.__deepM&&!detail[window.__deepM]){const rc=$('result-count');rc.textContent='Market "'+window.__deepM+'" not found — showing all markets.';history.replaceState({},'',location.pathname);}

// ===== MARKET CARDS RAIL (auto-drifting) =====
function railEl(){return $('rail');}
function railCards(){
 return [...tbody.querySelectorAll('tr')].map(tr=>{
  const key=tr.dataset.market;
  const d=detail[key];if(!d)return null;
  let h=0;for(const c of key)h=(h*31+c.charCodeAt(0))%997;
  const dl=((h%60)-30)/10;
  return {key,title:marketNames[key]||d[0],signal:d[1],vol:fmtK(Number(tr.dataset.volume)),delta:dl,pct:Math.min(100,Math.max(4,parseFloat(tr.dataset.signal)||4))};
 }).filter(Boolean);
}
function renderRail(){
 const rail=railEl();
 rail.innerHTML=railCards().map((c,i)=>{
  const book=books[c.key]||books.aurora;
  const yn=(book.length===2?book:book.slice(0,2)).map(([label,pr],bi)=>`<button type="button" class="yn-pill ${book.length===2?(bi===0?'yn-yes':'yn-no'):'yn-take'}" data-market="${c.key}" data-idx="${bi}"><span class="yn-l">${label}</span> <span class="yn-c" data-ui-number>${Math.round(pr*100)}\u00a2</span></button>`).join('');
  return `<article class="mcard" data-market="${c.key}"><span class="mc-top"><span class="mc-idx">${String(i+1).padStart(2,'0')}</span><span class="mc-vol" data-ui-number>${c.vol}</span><span class="mc-delta ${c.delta>=0?'up':'down'}" data-ui-number>${c.delta>=0?'\u25B2':'\u25BC'} ${c.delta>=0?'+':''}${c.delta.toFixed(1)}%</span></span><button type="button" class="mc-open" data-market="${c.key}"><span class="mc-signal" data-ui-number>${c.signal}</span><span class="mc-title">${c.title}</span></button><span class="mc-bar" aria-hidden="true"><span class="mc-fill" style="width:${c.pct}%"></span></span><span class="mc-yn">${yn}</span></article>`;
 }).join('');
}
const rail=railEl();
renderRail();
rail.addEventListener('click',e=>{
 const pill=e.target.closest('.yn-pill');
 if(pill){openMarket(pill.dataset.market);
  outcomeIdx=Number(pill.dataset.idx);side='buy';
  document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.side==='buy')));
  outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
  $('bigyn').querySelectorAll('.bigyn-btn').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.idx)===outcomeIdx)));
  calculate();return;}
 const open=e.target.closest('.mc-open');
 if(open)openMarket(open.dataset.market);
});
const railStep=()=>{const card=rail.querySelector('.mcard');return card?card.getBoundingClientRect().width+16:280;};
rail.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();rail.scrollBy({left:railStep(),behavior:'smooth'});}if(e.key==='ArrowLeft'){e.preventDefault();rail.scrollBy({left:-railStep(),behavior:'smooth'});}});
const railMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let railPaused=false;
['pointerenter','focusin','pointerdown'].forEach(ev=>rail.addEventListener(ev,()=>railPaused=true));
let railResume=null;
['pointerleave','focusout'].forEach(ev=>rail.addEventListener(ev,()=>{clearTimeout(railResume);railResume=setTimeout(()=>railPaused=false,2000);}));
function drift(){if(!railPaused&&!railMotion.matches){rail.scrollLeft+=0.5;if(rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2)rail.scrollLeft=0;}requestAnimationFrame(drift);}
requestAnimationFrame(drift);
// ===== SEER CANVAS CHART + LIVE TAPE =====
let chart=null,currentTf='7d',tapeTimer=null;
const TF_AGO={'7d':'7 days ago','30d':'30 days ago','90d':'90 days ago'};
const TAPE=[];
function renderTape(){
 const el=$('tape');if(!el)return;
 el.innerHTML=TAPE.map(t=>`<li><span class="tape-side ${t.side==='Yes'?'up':'down'}">${t.side}</span><span data-ui-number>${t.shares} shares @ ${t.price.toFixed(1)}\u00a2</span><span class="tape-when">${t.when}</span></li>`).join('');
}
function tapeAdd(value){
 const r=Math.random();
 TAPE.unshift({side:r>0.5?'Yes':'No',shares:Math.round(8+r*90),price:value,when:'just now'});
 if(TAPE.length>6)TAPE.pop();
 renderTape();
}
function renderTf(tf){
 currentTf=tf;
 if(!chart&&window.SeerChart)chart=window.SeerChart.mount($('lw-chart'));
 if(!chart)return;
 chart.setMarket(currentMarket,(books[currentMarket]||books.aurora)[0][1]*100);
 chart.setTf(tf);
 $('chart').dataset.tf=tf;
 const cap=$('chart').querySelector('figcaption span');if(cap)cap.textContent=TF_AGO[tf]||'';
 const fb=$('chart').querySelector('svg.lw-fallback');if(fb)fb.style.display='none';
}
document.querySelectorAll('[data-tf]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-tf]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 renderTf(b.dataset.tf);
}));
function startTape(){
 if(tapeTimer)return;
 tapeTimer=setInterval(()=>{
  if(document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const fig=$('chart');if(!fig||fig.hidden||!chart)return;
  const v=chart.tick();
  const book=books[currentMarket]||books.aurora;
  const q=$('quote'),mvq=$('mv-quote');
  if(q&&/^\d/.test(q.textContent))q.textContent=v.toFixed(1)+'%';
  if(mvq&&/^\d/.test(mvq.textContent))mvq.textContent=v.toFixed(1)+'%';
  tapeAdd(v);
 },2400);
}
window.addEventListener('seer-theme-change',()=>{if(chart)chart.setTf(currentTf);});
renderTf('7d');
startTape();
window.__lw={get chart(){return chart},get series(){return chart}};
if(window.__deepM&&detail[window.__deepM])openMarket(window.__deepM);

// big Yes/No -> arm the ticket instantly
$('bigyn').addEventListener('click',e=>{
 const btn=e.target.closest('.bigyn-btn');if(!btn)return;
 outcomeIdx=Number(btn.dataset.idx);
 side='buy';
 document.querySelectorAll('[data-side]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.side==='buy')));
 outcomesEl.querySelectorAll('.outcome-row').forEach((r,i)=>r.setAttribute('aria-pressed',String(i===outcomeIdx)));
 $('bigyn').querySelectorAll('.bigyn-btn').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.idx)===outcomeIdx)));
 calculate();
 ticketEl.scrollIntoView({behavior:'smooth',block:'nearest'});
 $('amount').focus({preventScroll:true});
});
