/* Seer canvas chart — bespoke EF-themed price history renderer.
   TradingView lightweight-charts was evaluated and vendored, but page-created instances
   rendered dead in this environment (no events, no series paint); a purpose-built canvas
   renderer proved reliable and theme-true. ~zero deps. */
(function(){
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function seeded(key){let h=1779033703;for(let i=0;i<key.length;i++)h=Math.imul(h^key.charCodeAt(i),3432918353);h=Math.imul(h^(h>>>16),2246822507);return()=>{h=Math.imul(h^(h>>>13),3266489909);return((h^(h>>>16))>>>0)/4294967296;};}
const TF={ '7d':{pts:168,stepH:1,ago:'7 days ago',label:'7-day'}, '30d':{pts:180,stepH:4,ago:'30 days ago',label:'30-day'}, '90d':{pts:180,stepH:12,ago:'90 days ago',label:'90-day'} };
function genSeries(key,tf,end){
 const rnd=seeded(key+tf);const n=TF[tf].pts;
 const out=[];let v=end*(0.52+rnd()*0.24);
 for(let i=0;i<n;i++){
  const t=Date.parse('2026-10-19T18:00:00Z')-(n-1-i)*TF[tf].stepH*3600000;
  if(i===n-1)v=end;else v=Math.min(97,Math.max(2,v+(rnd()-0.485)*3.2+(end-v)*0.03));
  out.push({t,value:Math.round(v*10)/10});
 }
 return out;
}
function fmtTime(t,tf){const d=new Date(t);return tf==='7d'?d.toLocaleDateString('en-GB',{weekday:'short'})+' '+String(d.getUTCHours()).padStart(2,'0')+':00':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}

window.SeerChart={
 mount(host){
  const canvas=document.createElement('canvas');canvas.className='chart-canvas';host.appendChild(canvas);
  const tip=document.createElement('div');tip.className='chart-tip';tip.setAttribute('aria-hidden','true');host.appendChild(tip);
  const st={host,canvas,tip,data:[],tf:'7d',end:64,hoverI:-1,key:'aurora'};
  const ctx=canvas.getContext('2d');
  function resize(){const r=host.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(10,r.width*dpr);canvas.height=Math.max(10,r.height*dpr);canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';draw();}
  function draw(){
   const W=canvas.width,H=canvas.height,dpr=Math.min(2,window.devicePixelRatio||1);
   ctx.clearRect(0,0,W,H);
   if(!st.data.length)return;
   const padR=52*dpr,padB=24*dpr,padT=14*dpr,padL=6*dpr;
   const pw=W-padR-padL,ph=H-padT-padB;
   const vals=st.data.map(p=>p.value);
   let lo=Math.min(...vals),hi=Math.max(...vals);
   const pad=(hi-lo)*0.18||2;lo=Math.max(0,lo-pad);hi=hi+pad;
   const X=i=>padL+pw*i/(st.data.length-1), Y=v=>padT+ph*(1-(v-lo)/(hi-lo));
   const line=cssVar('--line'),text2=cssVar('--text-2'),accent='#7D33FF';
   // gridlines + y labels
   ctx.strokeStyle=line;ctx.fillStyle=text2;ctx.lineWidth=1;ctx.font=`${11*dpr}px Public Sans, Arial`;
   ctx.textAlign='left';ctx.textBaseline='middle';
   for(let g=0;g<=4;g++){const v=lo+(hi-lo)*g/4,y=Y(v);
    ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillText(v.toFixed(1)+'%',W-padR+8*dpr,y);}
   // x labels
   ctx.textAlign='center';
   for(let g=0;g<=4;g++){const i=Math.round((st.data.length-1)*g/4);ctx.fillText(fmtTime(st.data[i].t,st.tf),X(i),H-10*dpr);}
   // area fill
   const grad=ctx.createLinearGradient(0,padT,0,H-padB);
   grad.addColorStop(0,'rgba(125,51,255,.30)');grad.addColorStop(1,'rgba(125,51,255,0)');
   ctx.beginPath();ctx.moveTo(X(0),Y(st.data[0].value));
   for(let i=1;i<st.data.length;i++)ctx.lineTo(X(i),Y(st.data[i].value));
   ctx.lineTo(X(st.data.length-1),H-padB);ctx.lineTo(X(0),H-padB);ctx.closePath();
   ctx.fillStyle=grad;ctx.fill();
   // line
   ctx.beginPath();ctx.moveTo(X(0),Y(st.data[0].value));
   for(let i=1;i<st.data.length;i++)ctx.lineTo(X(i),Y(st.data[i].value));
   ctx.strokeStyle=accent;ctx.lineWidth=2.5*dpr;ctx.lineJoin='round';ctx.stroke();
   // last point + dashed price line
   const last=st.data[st.data.length-1],ly=Y(last.value);
   ctx.setLineDash([5*dpr,5*dpr]);ctx.strokeStyle=accent;ctx.lineWidth=1*dpr;
   ctx.beginPath();ctx.moveTo(padL,ly);ctx.lineTo(W-padR,ly);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle=accent;ctx.beginPath();ctx.arc(X(st.data.length-1),ly,4*dpr,0,7);ctx.fill();
   // price badge
   const bt=last.value.toFixed(1)+'%';ctx.font=`600 ${11*dpr}px Public Sans, Arial`;
   const bw=ctx.measureText(bt).width+12*dpr;
   ctx.fillStyle=accent;ctx.beginPath();ctx.roundRect(W-padR+2*dpr,ly-10*dpr,bw,20*dpr,5*dpr);ctx.fill();
   ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(bt,W-padR+8*dpr,ly+0.5*dpr);
   // hover crosshair
   if(st.hoverI>=0){const hx=X(st.hoverI),hv=st.data[st.hoverI],hy=Y(hv.value);
    ctx.strokeStyle=text2;ctx.lineWidth=1*dpr;ctx.setLineDash([3*dpr,4*dpr]);
    ctx.beginPath();ctx.moveTo(hx,padT);ctx.lineTo(hx,H-padB);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=accent;ctx.beginPath();ctx.arc(hx,hy,5*dpr,0,7);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5*dpr;ctx.stroke();
    st.tip.textContent=hv.value.toFixed(1)+'% · '+fmtTime(hv.t,st.tf);
    const hr=st.host.getBoundingClientRect();
    st.tip.style.left=Math.min(Math.max(hx/dpr,40),hr.width-70)+'px';
    st.tip.style.opacity='1';}
   else st.tip.style.opacity='0';
  }
  canvas.addEventListener('pointermove',e=>{
   const r=canvas.getBoundingClientRect();
   const i=Math.round((e.clientX-r.left-6)/(r.width-58-6)*(st.data.length-1));
   st.hoverI=Math.max(0,Math.min(st.data.length-1,i));draw();
  });
  canvas.addEventListener('pointerleave',()=>{st.hoverI=-1;draw();});
  new ResizeObserver(resize).observe(host);
  st.setMarket=(key,end)=>{st.key=key;st.end=end;st.setTf(st.tf);};
  st.setTf=tf=>{st.tf=tf;st.data=genSeries(st.key,tf,st.end);st.hoverI=-1;draw();};
  st.tick=()=>{ // live tape movement — nudge the last point
   const rnd=seeded(st.key+Date.now().toString(36).slice(-5));
   const last=st.data[st.data.length-1];
   last.value=Math.round(Math.min(97,Math.max(2,last.value+(rnd()-0.48)*0.7))*10)/10;
   st.end=last.value;draw();return last.value;
  };
  resize();
  return st;
 }
};
})();
