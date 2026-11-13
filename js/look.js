/* Bộ lọc ảnh nhẹ và khung hình (phóng / cắt / lệch) cho từng dòng.
   drawSrc() là hàm DUY NHẤT vẽ một khung hình nguồn: khung xem thử, file xuất và ảnh bìa đều gọi nó,
   nên cái thấy ở xem thử y hệt file xuất. Mặc định "Giữ màu gốc": không lọc gì, không đổi điểm ảnh nào.
   Dữ liệu: l.flt = {b,c,s,sh} (sáng, tương phản, bão hòa, sắc nét), l.fx = {fit,z,px,py}. */
var FLT0={b:0,c:0,s:0,sh:0};
var LOOKS=[['goc','Giữ màu gốc',{b:0,c:0,s:0,sh:0}],['sang','Sáng nhẹ',{b:8,c:4,s:4,sh:0}],['ro','Rõ nét',{b:0,c:8,s:6,sh:35}],['tuoi','Tươi màu',{b:3,c:6,s:15,sh:10}]];
var FLTR={b:[-30,30],c:[-30,30],s:[-40,40],sh:[0,100]};
function clampN(v,a,b){v=+v;return isFinite(v)?Math.max(a,Math.min(b,v)):0}
function lineFlt(l){var f=l&&l.flt;if(!f)return FLT0;return {b:clampN(f.b,-30,30),c:clampN(f.c,-30,30),s:clampN(f.s,-40,40),sh:clampN(f.sh,0,100)}}
function fltZero(f){return !f.b&&!f.c&&!f.s&&!f.sh}
function fltCss(f){var a=[];if(f.b)a.push('brightness('+(1+f.b/100)+')');if(f.c)a.push('contrast('+(1+f.c/100)+')');if(f.s)a.push('saturate('+(1+f.s/100)+')');return a.length?a.join(' '):'none'}
function lineFx(l){var x=(l&&l.fx)||{};return {fit:x.fit==='contain'?'contain':'cover',z:clampN(x.z||1,1,3)||1,px:clampN(x.px,-1,1),py:clampN(x.py,-1,1)}}
function fxZero(fx){return fx.fit==='cover'&&fx.z===1&&!fx.px&&!fx.py}
/* Hình chữ nhật đặt video nguồn vw×vh vào khung W×H. px, py từ -1 đến 1: lệch trong phần thừa ra ngoài khung. */
function fxRect(vw,vh,W,H,fx){var k=(fx.fit==='contain'?Math.min(W/vw,H/vh):Math.max(W/vw,H/vh))*fx.z,dw=vw*k,dh=vh*k,mx=Math.max(0,(dw-W)/2),my=Math.max(0,(dh-H)/2);
  return {x:(W-dw)/2-fx.px*mx,y:(H-dh)/2-fx.py*my,w:dw,h:dh,mx:mx,my:my}}
/* Làm nét nhẹ (unsharp 3×3) trên toàn bộ điểm ảnh của canvas. a: 0..1. */
/* Sắc nét: nhân chập 3×3 (tâm 1+4k, bốn cạnh -k) trên điểm ảnh. Dùng lại một bộ đệm ImageData cho mọi khung
   (không cấp phát 8 MB mỗi khung ở 1080p). Đã thử bộ lọc SVG feConvolveMatrix qua ctx.filter: trên máy test
   không có GPU chậm hơn khoảng 5 lần, nên giữ cách này. Kết quả giống hệt bản trước. */
var SHBI=null;
function sharpen(ctx,a){if(!(a>0))return;var cv=ctx.canvas,W=cv.width,H=cv.height,s=ctx.getImageData(0,0,W,H).data,k=a*0.9,c=1+4*k,row=W*4;
  if(!SHBI||SHBI.width!==W||SHBI.height!==H)SHBI=new ImageData(W,H);var o=SHBI.data;o.set(s);
  for(var y=1;y<H-1;y++){var b=y*row,e=b+row-4;for(var i=b+4;i<e;i+=4){
    o[i]=c*s[i]-k*(s[i-4]+s[i+4]+s[i-row]+s[i+row]);o[i+1]=c*s[i+1]-k*(s[i-3]+s[i+5]+s[i+1-row]+s[i+1+row]);o[i+2]=c*s[i+2]-k*(s[i-2]+s[i+6]+s[i+2-row]+s[i+2+row])}}
  ctx.putImageData(SHBI,0,0)}
/* Vẽ khung hình nguồn v cho dòng l lên ctx (khung logic W×H). raw=true: bỏ bộ lọc (nút "Giữ để so sánh"). */
function drawSrc(ctx,W,H,v,l,raw){
  var fx=lineFx(l),f=raw?FLT0:lineFlt(l),r=fxRect(v.videoWidth,v.videoHeight,W,H,fx);
  if(fx.fit==='contain'||r.x>0||r.y>0||r.x+r.w<W||r.y+r.h<H){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H)}
  var fc=fltCss(f);if(fc!=='none'){ctx.save();ctx.filter=fc;ctx.drawImage(v,r.x,r.y,r.w,r.h);ctx.restore()}else ctx.drawImage(v,r.x,r.y,r.w,r.h);
  if(f.sh)sharpen(ctx,f.sh/100)}

/* ---------- khung xem thử: vẽ video lên canvas bằng drawSrc ---------- */
var PVW=720,PVH=1280;
function pvLine(){var c=clip(S.cur);if(!c)return null;timeline(c);var t=S.t,l=c.lines.filter(function(x){return t>=x.s&&t<x.e})[0]||c.lines[c.lines.length-1];return l}
var pvRetry=0;
function paintPreview(){var cv=document.getElementById('pvc'),v=document.getElementById('pv');if(!cv||!v)return;var g=cv.getContext('2d');
  if(v.hidden){g.clearRect(0,0,cv.width,cv.height);cv.style.visibility='hidden';return}
  if(!(v.readyState>=2&&v.videoWidth)||v.seeking){pvLater();return} // chưa có khung: giữ khung cũ, thử lại sau
  var l=pvLine();if(!l)return;drawSrc(g,PVW,PVH,v,l,!!S.cmp);
  if(g.getImageData(PVW>>1,PVH>>1,1,1).data[3]===0){pvLater();return} // khung vẽ ra trống (video vừa đổi nguồn): thử lại
  cv.style.visibility='visible';pvRetry=0}
function pvLater(){if(pvRetry>40||S.tab!=='ghep')return;pvRetry++;setTimeout(pvKick,120)}
var pvRaf=0;
function pvLoop(){pvRaf=0;paintPreview();if(S.play&&S.tab==='ghep')pvRaf=requestAnimationFrame(pvLoop)}
function pvKick(){if(!pvRaf)pvRaf=requestAnimationFrame(pvLoop)}
(function(){var dp=drawPhone;drawPhone=function(){dp.apply(this,arguments);var v=document.getElementById('pv');
  if(v&&!v._lk){v._lk=1;pvRetry=0;['seeked','loadeddata','timeupdate','play'].forEach(function(ev){v.addEventListener(ev,pvKick)})}pvKick()}})();

/* ---------- Inspector: mục Hình ảnh ---------- */
function lookBox(c,l,i){var f=lineFlt(l),fx=lineFx(l),cur=LOOKS.filter(function(p){var q=p[2];return q.b===f.b&&q.c===f.c&&q.s===f.s&&q.sh===f.sh})[0];
  var sl=function(k,lab){var r=FLTR[k];return '<label class="lsl">'+lab+'<input type="range" min="'+r[0]+'" max="'+r[1]+'" step="1" value="'+f[k]+'" data-flt="'+k+'" aria-label="'+lab+'"><span class="tc" data-fltv="'+k+'">'+(f[k]>0&&k!=='sh'?'+':'')+f[k]+'</span></label>'};
  return '<details class="sec look" open><summary class="lab">Hình ảnh của dòng '+(i+1)+(fltZero(f)?'':' · đã lọc')+(fxZero(fx)?'':' · đã chỉnh khung')+'</summary>'+
   '<div class="chips lks">'+LOOKS.map(function(p){return '<button class="chip'+(cur&&cur[0]===p[0]?' on':'')+'" data-look="p|'+p[0]+'">'+p[1]+'</button>'}).join('')+'</div>'+
   sl('b','Độ sáng')+sl('c','Tương phản')+sl('s','Bão hòa')+sl('sh','Sắc nét')+
   '<div class="bar" style="margin-top:4px"><button class="btn sm" data-look="reset">Đặt lại</button><button class="btn sm" data-cmp="1" title="Đè giữ để xem bản gốc, thả ra xem bản đã lọc">Giữ để so sánh</button></div>'+
   '<div class="lab" style="margin-top:8px">Khung hình</div><div class="lfx"><select data-fxfit="'+i+'" aria-label="Kiểu khung"><option value="cover" '+(fx.fit==='cover'?'selected':'')+'>Lấp đầy khung</option><option value="contain" '+(fx.fit==='contain'?'selected':'')+'>Vừa khung 9:16</option></select>'+
   '<label class="lsl">Phóng<input type="range" min="1" max="3" step="0.05" value="'+fx.z+'" data-fxz="'+i+'" aria-label="Phóng to"><span class="tc" data-fxzv="1">'+fx.z.toFixed(2)+'×</span></label>'+
   '<button class="btn sm" data-look="fxreset">Đặt lại khung</button></div><div class="meta">Kéo trên khung xem thử để dời khung (khi ảnh lớn hơn khung).</div>'+
   '<div class="lbulk"><label class="ck sm"><input type="checkbox" id="bulkfx"> kèm khung hình</label><button class="btn sm" data-look="all">Áp cho tất cả dòng của clip</button><button class="btn sm" data-look="clips">Áp cho các clip đã chọn</button>'+
   (S.lookUndo?'<button class="btn sm" data-look="undo">Hoàn tác: '+esc(S.lookUndo.label)+'</button>':'')+'</div>'+(S.lookPick?lookPicker(c):'')+'</details>'}
function lookPicker(c){return '<div class="lpick"><div class="meta">Chọn clip để áp bộ lọc'+(S.lookPick.fx?' và khung hình':'')+' của dòng đang chọn cho MỌI dòng của clip đó:</div>'+
  CLIPS.filter(function(x){return x!==c}).map(function(x){return '<label class="ck sm"><input type="checkbox" data-lpc="'+esc(x.id)+'"> '+esc(x.id)+' · '+esc(x.name)+'</label>'}).join('')+
  '<div class="bar"><button class="btn sm pri" data-look="clipsok">Áp dụng</button><button class="btn sm" data-look="clipsno">Hủy</button></div></div>'}
function copyLook(l,src,withFx){if(fltZero(lineFlt(src)))delete l.flt;else l.flt=JSON.parse(JSON.stringify(lineFlt(src)));
  if(withFx){var fx=lineFx(src);if(fxZero(fx))delete l.fx;else l.fx={fit:fx.fit,z:fx.z,px:fx.px,py:fx.py}}}
function lookSnap(lines,label){S.lookUndo={label:label,items:lines.map(function(l){return {l:l,flt:l.flt?JSON.parse(JSON.stringify(l.flt)):null,fx:l.fx?JSON.parse(JSON.stringify(l.fx)):null}})}}
function curLine(){var c=clip(S.cur);return c?c.lines[Math.min(S.li,c.lines.length-1)]:null}
function setFlt(l,k,v){var f=JSON.parse(JSON.stringify(lineFlt(l)));f[k]=clampN(v,FLTR[k][0],FLTR[k][1]);if(fltZero(f))delete l.flt;else l.flt=f}
document.addEventListener('click',function(e){var b=e.target.closest('[data-look]');if(!b)return;var c=clip(S.cur),l=curLine();if(!c||!l)return;var a=b.dataset.look.split('|'),fx=(document.getElementById('bulkfx')||{}).checked;
  switch(a[0]){
    case 'p':var p=LOOKS.filter(function(x){return x[0]===a[1]})[0];if(fltZero(p[2]))delete l.flt;else l.flt=JSON.parse(JSON.stringify(p[2]));render();return;
    case 'reset':delete l.flt;render();return;
    case 'fxreset':delete l.fx;render();return;
    case 'all':var n=c.lines.length-1;if(!n){msg('Clip chỉ có một dòng.');return}
      if(!confirm('Áp bộ lọc'+(fx?' và khung hình':'')+' của dòng '+(S.li+1)+' cho '+n+' dòng còn lại của clip '+c.id+'? Bộ lọc'+(fx?' và khung':'')+' hiện có của các dòng đó sẽ bị thay. Hoàn tác được một lần.'))return;
      lookSnap(c.lines,'áp cho tất cả dòng của '+c.id);c.lines.forEach(function(x){if(x!==l)copyLook(x,l,fx)});msg('Đã áp cho '+n+' dòng của '+c.id+'.');return;
    case 'clips':S.lookPick={fx:fx};render();return;
    case 'clipsno':S.lookPick=null;render();return;
    case 'clipsok':var ids=[].map.call(document.querySelectorAll('[data-lpc]:checked'),function(x){return x.dataset.lpc}),fx2=S.lookPick&&S.lookPick.fx;
      if(!ids.length){msg('Chưa chọn clip nào.');return}var ls=[];ids.forEach(function(id){var cc=clip(id);if(cc)ls=ls.concat(cc.lines)});
      if(!confirm('Áp bộ lọc'+(fx2?' và khung hình':'')+' của dòng '+(S.li+1)+' ('+c.id+') cho '+ls.length+' dòng của '+ids.length+' clip: '+ids.join(', ')+'? Hoàn tác được một lần.'))return;
      lookSnap(ls,'áp cho '+ids.length+' clip');ls.forEach(function(x){copyLook(x,l,fx2)});S.lookPick=null;msg('Đã áp cho '+ids.length+' clip ('+ls.length+' dòng).');return;
    case 'undo':var u=S.lookUndo;if(!u)return;u.items.forEach(function(it){if(it.flt)it.l.flt=it.flt;else delete it.l.flt;if(it.fx)it.l.fx=it.fx;else delete it.l.fx});S.lookUndo=null;msg('Đã hoàn tác: '+u.label+'.');return}});
document.addEventListener('input',function(e){var t=e.target,d=t.dataset,l=curLine();if(!l)return;
  if(d.flt){setFlt(l,d.flt,t.value);var o=document.querySelector('[data-fltv="'+d.flt+'"]');if(o)o.textContent=(+t.value>0&&d.flt!=='sh'?'+':'')+t.value;paintPreview();return}
  if(d.fxz!==undefined){var fx=lineFx(l);fx.z=clampN(t.value,1,3);l.fx=fx;var o2=document.querySelector('[data-fxzv]');if(o2)o2.textContent=fx.z.toFixed(2)+'×';paintPreview();return}});
document.addEventListener('change',function(e){var t=e.target,d=t.dataset,l=curLine();if(!l)return;
  if(d.fxfit!==undefined){var fx=lineFx(l);fx.fit=t.value;l.fx=fx;if(fxZero(fx))delete l.fx;render();return}
  if(d.flt||d.fxz!==undefined)render()});
/* Giữ để so sánh */
document.addEventListener('pointerdown',function(e){if(e.target.closest('[data-cmp]')){S.cmp=true;paintPreview()}});
['pointerup','pointercancel','pointerleave'].forEach(function(ev){document.addEventListener(ev,function(e){if(S.cmp&&(ev!=='pointerleave'||e.target.closest&&e.target.closest('[data-cmp]'))){S.cmp=false;paintPreview()}},true)});
/* Kéo trên khung xem thử để dời khung */
var PAN=null;
document.addEventListener('pointerdown',function(e){var ph=e.target.closest('#phone');if(!ph||e.target.closest('.drag,.info')||S.play)return;var v=document.getElementById('pv'),l=curLine();
  if(!v||v.hidden||!v.videoWidth||!l)return;var fx=lineFx(l),r=fxRect(v.videoWidth,v.videoHeight,PVW,PVH,fx);if(!r.mx&&!r.my)return;
  PAN={x0:e.clientX,y0:e.clientY,fx:fx,r:r,k:PVW/ph.clientWidth,l:l,moved:false};e.preventDefault()});
document.addEventListener('pointermove',function(e){var g=PAN;if(!g)return;var dx=(e.clientX-g.x0)*g.k,dy=(e.clientY-g.y0)*g.k;if(Math.abs(dx)+Math.abs(dy)>2)g.moved=true;
  var fx={fit:g.fx.fit,z:g.fx.z,px:g.r.mx?clampN(g.fx.px-dx/g.r.mx,-1,1):0,py:g.r.my?clampN(g.fx.py-dy/g.r.my,-1,1):0};
  fx.px=Math.round(fx.px*1000)/1000;fx.py=Math.round(fx.py*1000)/1000;g.l.fx=fx;paintPreview()});
document.addEventListener('pointerup',function(){var g=PAN;if(!g)return;PAN=null;if(g.moved)render()});
