const THEME_KEY='seer-theme';
const ORDER=['light','seer','ultra'];
function storedTheme(){try{return localStorage.getItem(THEME_KEY)}catch(e){return null}}
function currentTheme(){return ORDER.includes(document.documentElement.dataset.theme)?document.documentElement.dataset.theme:'seer'}
function nextOf(t){return ORDER[(ORDER.indexOf(t)+1)%ORDER.length]}
function labelFor(n){return n==='seer'?'Switch to Seer mode':n==='ultra'?'Switch to ultra dark mode':'Switch to light mode'}
function glyphFor(n){return n==='seer'?'☾':n==='ultra'?'●':'☀'}
function applyTheme(t,persist){
 document.documentElement.dataset.theme=t;
 document.documentElement.dataset.shade=t==='light'?'light':'dark';
 window.dispatchEvent(new Event('seer-theme-change'));
 if(persist){try{localStorage.setItem(THEME_KEY,t)}catch(e){}}
 document.querySelectorAll('.theme-toggle').forEach(b=>{const n=nextOf(t);const label=labelFor(n);b.setAttribute('aria-label',label);b.dataset.next=n;const g=b.querySelector('.theme-glyph');if(g)g.textContent=glyphFor(n);const tip=b.querySelector('.theme-tip');if(tip)tip.textContent=label;});
}
applyTheme(ORDER.includes(storedTheme())?storedTheme():currentTheme(),false);
document.querySelectorAll('.theme-toggle').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.next;applyTheme(ORDER.includes(n)?n:nextOf(currentTheme()),true)}));
