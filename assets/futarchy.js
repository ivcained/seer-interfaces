const $=id=>document.getElementById(id);
const rows=[...document.querySelectorAll('[data-proposal]')];
const data={
 gip153:{title:'GNO price if GIP-153 passes',state:'active',stateText:'Active · open 6d 23h',yes:'104.20',no:'95.21',impact:'+9.44%',metric:'GNO price per token in sDAI, measured over the evaluation window after execution.',resolves:'Time-weighted average price of each conditional market, settled on Seer.',note:'Illustrative prices. No governance action is taken from this page.'},
 kipfees:{title:'PNK price if the court-fees update is approved',state:'active',stateText:'Active · open 12d 4h',yes:'0.441',no:'0.420',impact:'+5.00%',metric:'PNK price per token in sDAI, measured over the evaluation window after approval.',resolves:'Time-weighted average price of each conditional market, settled on Seer.',note:'Illustrative prices. No governance action is taken from this page.'},
 gip152:{title:'GNO price if GIP-152 is passed',state:'closed',stateText:'Closed · awaiting resolution',yes:'101.10',no:'98.90',impact:'+2.22%',metric:'GNO price per token in sDAI, measured over the evaluation window after execution.',resolves:'Time-weighted average price of each conditional market, settled on Seer.',note:'Trading closed. Figures are illustrative final prices.'},
 kip81:{title:'PNK price if KIP-81 is approved',state:'resolved',stateText:'Resolved · proposal not approved',yes:'168.98',no:'108.62',impact:'+55.55%',metric:'PNK price per token in sDAI over the evaluation window.',resolves:'Settled after the proposal was voted down; the no-condition market paid out.',note:'Resolved market. The impact shown is the measured outcome, not a forecast.'}
};
const badge={active:'badge-active',closed:'badge-ended',resolved:'badge-resolved'};
function select(row){
 rows.forEach(r=>{r.classList.toggle('selected-row',r===row);r.querySelector('button').setAttribute('aria-pressed',String(r===row));});
 const d=data[row.dataset.proposal];
 $('f-title').textContent=d.title;
 $('f-state').innerHTML=`<span class="badge ${badge[d.state]}">${d.stateText}</span>`;
 $('f-yes').textContent=d.yes;$('f-no').textContent=d.no;$('f-impact').textContent=d.impact;
 $('f-metric').textContent=d.metric;$('f-resolves').textContent=d.resolves;$('f-note').textContent=d.note;
 const yes=parseFloat(d.yes),no=parseFloat(d.no);const max=Math.max(yes,no);
 const scale=Math.ceil(max*1.1);
 const w=v=>Math.min(100,(v/scale*100))+'%';
 $('f-yes-bar').style.width=w(yes);$('f-no-bar').style.width=w(no);
 $('f-axis-max').textContent=scale;
 $('f-status').textContent='Selected: '+d.title;
}
rows.forEach(row=>row.querySelector('button').addEventListener('click',()=>select(row)));
select(rows.find(r=>r.classList.contains('selected-row'))||rows[0]);
let org='all';
document.querySelectorAll('.chips .chip').forEach(chip=>chip.addEventListener('click',()=>{
 org=chip.dataset.org;document.querySelectorAll('.chips .chip').forEach(c=>c.setAttribute('aria-pressed',c===chip));
 let count=0;rows.forEach(r=>{const show=org==='all'||r.dataset.org===org;r.hidden=!show;if(show)count++;});
 document.querySelector('.table-scroll').hidden=count===0;
}));
