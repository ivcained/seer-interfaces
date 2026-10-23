const $=id=>document.getElementById(id);
const KEY='seer-common-ground-shortlist';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}}
function save(list){localStorage.setItem(KEY,JSON.stringify(list))}
function render(){
 const list=load();const ol=$('sl-list');
 ol.innerHTML=list.map((name,i)=>`<li><span>${i+1}. ${name}</span><button type="button" data-remove="${name}">Remove</button></li>`).join('');
 $('sl-empty').hidden=list.length!==0;
 document.querySelectorAll('[data-sub]').forEach(btn=>{const name=btn.dataset.sub;const inList=list.includes(name);btn.textContent=inList?'Remove from shortlist':'Add to review shortlist';btn.setAttribute('aria-pressed',String(inList));});
 $('sl-status').textContent=`${list.length} submission${list.length===1?'':'s'} in your shortlist`;
}
document.querySelectorAll('[data-sub]').forEach(btn=>btn.addEventListener('click',()=>{
 const name=btn.dataset.sub;let list=load();
 if(list.includes(name)){list=list.filter(n=>n!==name);$('sl-status').textContent='Removed: '+name;}
 else{list.push(name);$('sl-status').textContent='Added: '+name;}
 save(list);render();
}));
$('sl-list').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;save(load().filter(n=>n!==b.dataset.remove));render();});
document.querySelectorAll('.chips .chip').forEach(chip=>chip.addEventListener('click',()=>{
 document.querySelectorAll('.chips .chip').forEach(c=>c.setAttribute('aria-pressed',c===chip));
 const active=chip.dataset.state==='active';
 $('active-section').hidden=!active;$('archive-section').hidden=active;
}));
render();
