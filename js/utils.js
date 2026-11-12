/* ---------- tiện ích ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function trim(s){return s.trim()}
function wc(s){return s.trim()?s.trim().split(/\s+/).length:0}
function dur(l){return l.dd||Math.max(3,Math.ceil(wc(l.t)/3.6))}
function clip(id){return CLIPS.filter(function(c){return c.id===id})[0]}
function seg(id){return SEGS.filter(function(s){return s.id===id})[0]}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d')}
var STOP=['la','va','co','cho','cua','nay','de','nho','mot','khi','tren','duoi','cac','roi','nhe','vao','ra','len','the'];
function toks(s){return norm(s).split(/[^a-z0-9]+/).filter(function(x){return x.length>=2&&STOP.indexOf(x)<0})}
function overlap(a,b){var tb=toks(b),n=0;toks(a).forEach(function(x){if(tb.indexOf(x)>=0)n++});return n}
function hue(p){if(HUE[p]!=null)return HUE[p];var h=0;for(var i=0;i<(p||'').length;i++)h=(h*31+p.charCodeAt(i))%360;return h}
function bg(sg){return sg.thumb?'background-image:url('+sg.thumb+');':'background:'+grad(sg.p)+';'}
function grad(p){var h=hue(p);return 'linear-gradient(160deg,hsl('+h+',55%,38%),hsl('+(h+30)+',50%,22%))'}
function fmt1(x){return (Math.round(x*10)/10).toFixed(1).replace('.',',')}
function msg(m){S.msg=m;render()}
