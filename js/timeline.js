/* Kịch bản: đọc văn bản, tính dòng thời gian, chữ thông tin, chuyển cảnh. */
function trFor(c,li){if(li<=0)return null;var l=c.lines[li],ty=l.tr||TR.type;if(ty==='cut'||!TRN[ty])return null;var d=Math.max(0.1,Math.min(+TR.dur||0.3,(l.e-l.s)/2));return {type:ty,dur:d}}
function trEase(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p)}
function trDraw(ctx,W,H,prev,ty,p){var e=trEase(p);ctx.save();
  if(ty==='fade'){ctx.globalAlpha=1-e;ctx.drawImage(prev,0,0,W,H)}
  else if(ty==='slide'){ctx.drawImage(prev,-e*W,0,W,H)}
  else{var z=1+0.25*e;ctx.globalAlpha=1-e;ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.drawImage(prev,-W/2,-H/2,W,H)}
  ctx.restore()}
function sdur(sg){return sg.dx||sg.d}
function srcT(l,sg,t){var spd=l.spd||1,need=Math.max(0.1,l.e-l.s),needS=need*spd,d=sdur(sg),a0=l.segIn||0,out=Math.min(l.segOut||d,d),span=Math.max(0.2,out-a0),el=Math.max(0,t-l.s);
  if(span>=needS)return a0+el*spd;if(l.fill==='hold'||l.fill==='slow')return a0+Math.min(el*spd,Math.max(0,span-0.04));return a0+((el*spd)%span)}
/* Vị trí chữ: vị trí kéo tay, rồi vị trí của kiểu chữ (kiểu riêng / mặc định của gian), rồi vị trí ở Cài đặt. */
function infoPos(x,c){var py=x.py;if(py==null){var st=typeof infoTS==='function'?infoTS(x,c):null;py=st?TSPOS[st.pos]:(INFO.pos==='top'?0.15:(INFO.pos==='mid'?0.5:0.74))}return {px:x.px!=null?x.px:0.5,py:py}}
function boxCss(px,fg,bg,pos,extra){return 'font-size:'+px+'px;line-height:1.24;white-space:pre-wrap;color:'+fg+';background:'+bg+';padding:'+(px*0.35)+'px '+(px*0.6)+'px;border-radius:'+(px*0.45)+'px;left:'+(pos.px*100)+'%;top:'+(pos.py*100)+'%;right:auto;bottom:auto;transform:translate(-50%,-50%);width:max-content;max-width:90%;box-sizing:border-box;'+(extra||'')}
function infoStyle(k,x,c){x=x||{};var L=typeof infoLook==='function'?infoLook(x,c):{font:'',size:INFO.size,fg:INFO.fg,bg:INFO.bg},fs=Math.max(8,(x.sz||L.size)*k);
  return boxCss(fs,L.fg,L.bg||'transparent',infoPos(x,c),(L.font?'font-family:'+L.font.replace(/"/g,"'")+';':'')+(L.ol?'-webkit-text-stroke:'+(L.ol*2*k)+'px '+L.olc+';paint-order:stroke fill;':'')+(L.sh?'text-shadow:0 '+(fs*0.04)+'px '+(fs*0.2)+'px rgba(0,0,0,.85);':''))}
function infoPrevHTML(){return '<div class="info" style="'+infoStyle(160/720,{st:'0'})+'">Bloc 14,5 × 20,5 cm</div>'}
function infoEnd(l,q){return INFO.mode==='secs'?Math.min(l.e,q+Math.max(1,INFO.secs)):l.e}
function infoOk(x){return String(x.x==null?'':x.x).trim()!==''}
function infoSpan(l,x){var q;if(x.off!=null&&x.off!==''&&!isNaN(+x.off))q=l.s+Math.min(+x.off,Math.max(0,l.e-l.s-0.3));else q=cue(l,x);if(q===null)return null;var b=(+x.len>0)?Math.min(l.e,q+ +x.len):infoEnd(l,q);return {a:q,b:b}}
function trimmedB(c){var b=c.bounds,N=c.lines.length;return !!(b&&c.audioDur&&b.length===N+1&&(b[0]>0.05||b[N]<c.audioDur-0.05))}
function manualDur(c){return c.lines.some(function(l){return l.dm>0})||trimmedB(c)}
function timeline(c){var tot;
  if(c.bounds&&c.audioDur&&c.bounds.length===c.lines.length+1){c.lines.forEach(function(l,i){l.s=c.bounds[i];l.e=c.bounds[i+1];l.sc=Math.max(0.2,(l.e-l.s)/dur(l))});tot=c.audioDur}
  else{var sum=0;c.lines.forEach(function(l){sum+=dur(l)});var k=(c.audioDur&&sum>0)?c.audioDur/sum:1,t=0;c.lines.forEach(function(l){l.sc=k;l.s=t;l.e=t+dur(l)*k;t=l.e});tot=t}
  c.lines.forEach(function(l){l.as=l.s;l.ae=l.e});
  if(manualDur(c)){var u=0;c.lines.forEach(function(l){var len=l.dm>0?l.dm:(l.ae-l.as);l.s=u;l.e=u+len;u=l.e;l.sc=Math.max(0.2,len/dur(l))});return u}
  return tot}
function cue(l,inf){if(!inf.ph)return null;var i=l.t.toLowerCase().indexOf(inf.ph.toLowerCase());if(i<0)return null;return l.s+Math.min(wc(l.t.slice(0,i))/3.6*(l.sc||1),Math.max(0,(l.e-l.s)-1))}
function infosStr(l){return l.infos.map(function(x){return x.ph+'='+x.x}).join('; ')}
function parseInfos(s){return s.split(';').map(trim).filter(Boolean).map(function(a){var i=a.indexOf('=');return i<0?{ph:a,x:a}:{ph:a.slice(0,i).trim(),x:a.slice(i+1).trim()}})}
function parse(txt){
  var out=[],cur=null;
  txt.split(/\r?\n/).forEach(function(ln){
    ln=ln.trim();if(!ln)return;
    if(ln.indexOf('##')===0){var p=ln.replace(/^##\s*/,'').split('|').map(trim);
      cur={id:p[0]||('C'+(CLIPS.length+out.length+1)),g:p[1]||'',prod:p[2]||'',name:p[3]||'',who:p[4]?((person(p[4])||{name:p[4].trim()}).name):(PEOPLE[0]?PEOPLE[0].name:''),lines:[],auto:false,exported:false};out.push(cur);return}
    if(!cur||ln[0]==='#')return;
    var f=ln.split('|').map(trim);cur.lines.push({t:f[0]||'',need:f[1]||'',seg:null,infos:parseInfos(f[2]||''),choose:false});
  });
  return out;
}
