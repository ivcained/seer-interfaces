const $=id=>document.getElementById(id);
const rows=[...document.querySelectorAll('.pd-row')];
const known=new Set(rows.map(r=>r.children[0].firstChild.textContent.trim()));
function fmt(v){return v.toFixed(2)+'%'}
function render(){
 const query=$('search').value.trim().toLowerCase();let group='all';
 const gChip=document.querySelector('.chips [data-group][aria-pressed="true"]');if(gChip)group=gChip.dataset.group;
 const basis=document.querySelector('#basis [aria-pressed="true"]').dataset.basis;
 const visible=rows.filter(r=>r.children[0].textContent.toLowerCase().includes(query)&&(group==='all'||r.dataset.group===group));
 visible.sort((a,b)=>basis==='ann'?parseFloat(b.dataset.ann)-parseFloat(a.dataset.ann):parseFloat(b.dataset.qt)-parseFloat(a.dataset.qt));
 rows.forEach(r=>r.hidden=!visible.includes(r));
 visible.forEach(r=>r.parentNode.appendChild(r));
 const max=visible.length?Math.max(...visible.map(r=>basis==='ann'?parseFloat(r.dataset.ann):parseFloat(r.dataset.qt))):16;
 const scale=Math.ceil(max*1.25);
 rows.forEach(r=>{const v=basis==='ann'?parseFloat(r.dataset.ann):parseFloat(r.dataset.qt);r.querySelector('.bar i').style.width=Math.min(100,(v/scale*100))+'%';});
 const scaleCell=document.querySelector('th.scale-head');if(scaleCell)scaleCell.textContent=`Scale 0–${scale}%`;
 const jv=$('j-val'),jl=$('j-label'),ja=$('j-alt'),jal=$('j-alt-label');
 if(jv){const ann=basis==='ann';jv.textContent=ann?'46.52%':'82.59%';jl.textContent=ann?'Annualized basis':'Quarterly basis';ja.textContent=ann?'82.59%':'46.52%';jal.textContent=ann?'Quarterly basis':'Annualized basis';}
 $('result-count').textContent=`${visible.length} asset${visible.length===1?'':'s'}`;
 $('empty').hidden=visible.length!==0;document.querySelector('.table-scroll').hidden=visible.length===0;
 $('clear').disabled=!query&&group==='all';
}
$('search').addEventListener('input',render);
document.querySelectorAll('.chips [data-group]').forEach(chip=>chip.addEventListener('click',()=>{document.querySelectorAll('.chips [data-group]').forEach(c=>c.setAttribute('aria-pressed',c===chip));render();}));
document.querySelectorAll('#basis button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#basis button').forEach(c=>c.setAttribute('aria-pressed',c===b));render();}));
$('clear').addEventListener('click',()=>{$('search').value='';document.querySelectorAll('.chips [data-group]').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.group==='all')));render();$('search').focus();});
$('reset-empty').addEventListener('click',()=>{$('search').value='';document.querySelectorAll('.chips [data-group]').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.group==='all')));render();$('search').focus();});
render();
$('rsample').addEventListener('click',()=>{$('rcsv').value='asset,pd_ann,pd_qt\nweETH,0.12,0.03\nnotAnAsset,5,1\nUSDC,0.05,0.01\nUSDF,160,40';$('rcsv-result').textContent='';});
$('rvalidate').addEventListener('click',()=>{
 const text=$('rcsv').value.trim();const out=$('rcsv-result');
 if(!text){out.innerHTML='<p class="err">Nothing to validate. Paste CSV or load the sample first.</p>';return;}
 const lines=text.split('\n');const seen=new Set();const errors=[];const valid=[];
 if(!/^asset\s*,\s*pd_ann\s*,\s*pd_qt/i.test(lines[0]))errors.push('Line 1: missing header "asset,pd_ann,pd_qt".');
 lines.forEach((line,i)=>{if(!line.trim()||(/^asset/i.test(line)&&i===0))return;
  const parts=line.split(',');if(parts.length!==3){errors.push(`Line ${i+1}: expected 3 columns, found ${parts.length}.`);return;}
  const name=parts[0].trim(),ann=parts[1].trim(),qt=parts[2].trim();
  if(!known.has(name)){errors.push(`Line ${i+1}: unknown asset "${name}".`);return;}
  if(seen.has(name)){errors.push(`Line ${i+1}: duplicate asset "${name}".`);return;}
  const bad=[ann,qt].filter(v=>!/^\d+(\.\d+)?$/.test(v));
  if(bad.length){errors.push(`Line ${i+1}: non-numeric value${bad.length>1?'s':''} "${bad.join('", "')}".`);return;}
  const a=parseFloat(ann),q=parseFloat(qt);
  if(a>100||q>100){errors.push(`Line ${i+1}: a percentage exceeds 100.`);return;}
  seen.add(name);valid.push([name,a,q]);
 });
 let html='';
 if(errors.length)html+=`<p class="err">${errors.length} problem${errors.length===1?'':'s'} found:</p><ul style="margin:8px 0 0 20px">${errors.map(e=>`<li>${e}</li>`).join('')}</ul>`;
 if(valid.length)html+=`<p class="ok-note">${valid.length} valid estimate${valid.length===1?'':'s'} (nothing submitted):</p><div class="table-scroll"><table><thead><tr><th scope="col">Asset</th><th scope="col" class="numeric">Your PD · ann</th><th scope="col" class="numeric">Market · ann</th></tr></thead><tbody>${valid.map(([n,a])=>{const m=rows.find(r=>r.children[0].firstChild.textContent.trim()===n);return `<tr><td>${n}</td><td class="numeric">${a}%</td><td class="numeric">${m?parseFloat(m.dataset.ann).toFixed(2)+'%':'—'}</td></tr>`;}).join('')}</tbody></table></div>`;
 out.innerHTML=html||'<p class="err">No valid rows found.</p>';
});
$('rdownload').addEventListener('click',()=>{
 const csv='asset,group,pd_ann_percent,pd_qt_percent\n'+rows.map(r=>`${r.children[0].firstChild.textContent.trim()},${r.dataset.group},${r.dataset.ann},${r.dataset.qt}`).join('\n');
 const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='risk-pricing-q3-2026-snapshot.csv';document.body.appendChild(a);a.click();a.remove();
 $('rcsv-result').innerHTML='<p class="ok-note">Snapshot exported as risk-pricing-q3-2026-snapshot.csv (Q3 2026 ended round).</p>';
});
