const $=id=>document.getElementById(id);
const rows=[...document.querySelectorAll('[data-repo]')];
const repos={};rows.forEach(r=>{repos[r.dataset.repo]={up:r.children[1].textContent,down:r.children[2].textContent};});
function select(row){
 rows.forEach(r=>{r.classList.toggle('selected-row',r===row);r.querySelector('button').setAttribute('aria-pressed',String(r===row));});
 $('d-title').textContent=row.dataset.repo;
 $('d-up').textContent=repos[row.dataset.repo].up;$('d-down').textContent=repos[row.dataset.repo].down;
 $('d-status').textContent='Selected: '+row.dataset.repo;
}
rows.forEach(row=>row.querySelector('button').addEventListener('click',()=>select(row)));
function render(){
 const query=$('search').value.trim().toLowerCase(),sort=$('sort').value;
 const visible=rows.filter(r=>r.dataset.repo.includes(query));
 visible.sort((a,b)=>sort==='up'?parseInt(b.children[1].textContent)-parseInt(a.children[1].textContent):parseFloat(b.children[3].textContent)-parseFloat(a.children[3].textContent));
 rows.forEach(r=>{r.hidden=!visible.includes(r);});
 visible.forEach(r=>{r.parentNode.appendChild(r);});
 $('result-count').textContent=`${visible.length} repositor${visible.length===1?'y':'ies'}`;
 $('empty').hidden=visible.length!==0;document.querySelector('.table-scroll').hidden=visible.length===0;
 $('clear').disabled=!query;
}
$('search').addEventListener('input',render);$('sort').addEventListener('change',render);
$('clear').addEventListener('click',()=>{$('search').value='';render();$('search').focus();});
$('reset-empty').addEventListener('click',()=>{$('search').value='';render();$('search').focus();});
render();
$('sample').addEventListener('click',()=>{$('csv').value='repo_id,up_share\nlumen-core,65\ngrove-sdk,50\nunknown-repo,42\natlas-indexer,140\nlumen-core,70\ndeep-ui,fifty';$('csv-result').textContent='';});
$('validate').addEventListener('click',()=>{
 const text=$('csv').value.trim();const out=$('csv-result');
 if(!text){out.innerHTML='<p class="err">Nothing to validate. Paste CSV or load the sample first.</p>';return;}
 const lines=text.split('\n');const seen=new Set();const errors=[];const valid=[];
 if(!/^repo_id\s*,\s*up_share/i.test(lines[0]))errors.push('Line 1: missing header "repo_id,up_share".');
 lines.forEach((line,i)=>{if(!line.trim()||(/^repo_id/i.test(line)&&i===0))return;
  const parts=line.split(',');if(parts.length!==2){errors.push(`Line ${i+1}: expected 2 columns, found ${parts.length}.`);return;}
  const id=parts[0].trim(),val=parts[1].trim();
  if(!repos[id]){errors.push(`Line ${i+1}: unknown repository "${id}".`);return;}
  if(seen.has(id)){errors.push(`Line ${i+1}: duplicate repository "${id}".`);return;}
  if(!/^\d+(\.\d+)?$/.test(val)){errors.push(`Line ${i+1}: up_share "${val}" is not a number.`);return;}
  const n=parseFloat(val);if(n<0||n>100){errors.push(`Line ${i+1}: up_share ${val} outside 0–100.`);return;}
  seen.add(id);valid.push([id,n]);
 });
 let html='';
 if(errors.length)html+=`<p class="err">${errors.length} problem${errors.length===1?'':'s'} found:</p><ul style="margin:8px 0 0 20px">${errors.map(e=>`<li>${e}</li>`).join('')}</ul>`;
 if(valid.length)html+=`<p class="ok-note">${valid.length} valid prediction${valid.length===1?'':'s'} ready for preview (nothing submitted):</p><div class="table-scroll"><table><thead><tr><th scope="col">Repository</th><th scope="col" class="numeric">Your UP</th><th scope="col" class="numeric">Market UP</th><th scope="col" class="numeric">Difference</th></tr></thead><tbody>${valid.map(([id,n])=>{const m=parseInt(repos[id].up);return `<tr><td>${id}</td><td class="numeric">${n}%</td><td class="numeric">${m}%</td><td class="numeric">${(n-m>0?'+':'')+(n-m)} pts</td></tr>`;}).join('')}</tbody></table></div>`;
 out.innerHTML=html||'<p class="err">No valid rows found.</p>';
});
$('export').addEventListener('click',()=>{
 const csv='repo_id,up_share,down_share\n'+rows.map(r=>`${r.dataset.repo},${repos[r.dataset.repo].up.replace('%','')},${repos[r.dataset.repo].down.replace('%','')}`).join('\n');
 const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='deep-market-weights.csv';document.body.appendChild(a);a.click();a.remove();
 $('csv-result').innerHTML='<p class="ok-note">Market weights exported as deep-market-weights.csv (illustrative).</p>';
});
