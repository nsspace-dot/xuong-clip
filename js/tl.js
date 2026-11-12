/* Thanh thời gian nhiều tầng ở dưới màn Ghép clip: Video, Giọng, Chữ, Nhạc (để sẵn).
   Chỉ là giao diện cho logic có sẵn: kéo biên cảnh đổi segIn / segOut (và khóa dòng như khi chọn tay),
   kéo vạch giọng dùng setBound, kéo khối chữ đổi off / len của chữ hiện. Kim chạy đồng bộ với khung xem thử. */
S.tlz=(function(){try{var v=+localStorage.getItem('xuongclip_tlz');return v>0?v:0}catch(e){return 0}})(); // điểm ảnh mỗi giây, 0 = vừa khung
S.tlKeys=false;
var TLH={ruler:22,video:46,voice:58,text:34,music:26};
function tlPps(c){var sc=document.getElementById('tlsc'),tot=Math.max(1,timeline(c));if(S.tlz)return Math.min(S.tlz,20000/tot);return Math.max(8,((sc?sc.clientWidth:900)-12)/tot)}
function tlHTML(c){
  return (S.wx?waveWide(c):'')+'<div class="tl" id="tl"><div class="tlbar"><b>Thanh thời gian</b><span class="tc" id="tltc">'+tc(S.t)+'</span>'+edOpts()+'<span class="sp"></span>'+
   '<span class="meta">Phóng</span><button class="btn xs" data-tl="zout" title="Thu nhỏ trục thời gian">−</button><button class="btn xs" data-tl="fit" title="Vừa khung">Vừa khung</button><button class="btn xs" data-tl="zin" title="Phóng to trục thời gian">+</button>'+
   '<button class="btn xs" data-tl="keys" title="Phím tắt (?)">Phím tắt</button></div>'+
   '<div class="tlbody"><div class="tlheads"><div style="height:'+TLH.ruler+'px"></div><div class="tlhd" style="height:'+TLH.video+'px">Video</div><div class="tlhd" style="height:'+TLH.voice+'px">Giọng</div><div class="tlhd" style="height:'+TLH.text+'px">Chữ</div><div class="tlhd off" style="height:'+TLH.music+'px">Nhạc</div></div>'+
   '<div class="tlsc" id="tlsc"><div class="tlin" id="tlin"></div></div></div></div>'+(S.tlKeys?tlKeysHTML():'')}
function tlKeysHTML(){var k=[['Space','Phát / dừng'],['← →','Lùi / tới một khung hình'],['Shift + ← →','Lùi / tới 1 giây'],['[  ]','Dòng trước / dòng sau'],['I','Đặt điểm đầu đoạn video của dòng đang chọn tại kim chạy'],['O','Đặt điểm cuối đoạn video của dòng đang chọn tại kim chạy'],['?','Bật / tắt bảng này'],['Esc','Đóng bảng, thoát toàn màn hình']];
  return '<div class="tlkeys" id="tlkeys" role="dialog" aria-label="Phím tắt"><div class="tlkb"><b>Phím tắt</b><table>'+k.map(function(x){return '<tr><td><kbd>'+x[0]+'</kbd></td><td>'+x[1]+'</td></tr>'}).join('')+'</table><div class="meta">Không bắt phím khi đang gõ trong ô nhập.</div><div class="bar"><button class="btn sm" data-tl="keys">Đóng</button></div></div></div>'}
/* Dựng nội dung theo độ rộng hiện tại (gọi sau mỗi lần vẽ màn Ghép clip). */
function tlBuild(){
  var c=clip(S.cur),inn=document.getElementById('tlin');if(!c||!inn)return;
  var tot=timeline(c),pps=tlPps(c),W=Math.ceil(tot*pps)+40,H=TLH.ruler+TLH.video+TLH.voice+TLH.text+TLH.music,X=function(t){return Math.round(t*pps)},h='';
  inn.style.width=W+'px';inn.style.height=H+'px';inn._pps=pps;
  var cur=c.lines[S.li]||c.lines[0];h+='<div class="tlsel" style="left:'+X(cur.s)+'px;width:'+Math.max(2,X(cur.e)-X(cur.s))+'px"></div>';
  var step=pps>=120?0.5:pps>=40?1:pps>=16?2:5,rul='';for(var t=0;t<=tot+0.001;t+=step){var big=Math.abs(t/ (step*2)-Math.round(t/(step*2)))<1e-6;rul+='<span class="tk'+(big?' b':'')+'" style="left:'+X(t)+'px">'+(big?tc(t).replace(/\.0$/,''):'')+'</span>'}
  h+='<div class="tlr" style="height:'+TLH.ruler+'px">'+rul+'</div>';
  // tầng video
  var y=TLH.ruler,v='';c.lines.forEach(function(l,i){var sg=lineSeg(l),x0=X(l.s),w=Math.max(4,X(l.e)-x0),lv=lineLvl(c,i),st='';
    if(sg){if(!sg.strip)ensureStrip(sg);var spd=l.spd||1,d=sdur(sg),span=Math.max(0.2,(l.e-l.s)*spd),bgW=Math.max(w,w*d/span);
      if(sg.strip)st='background-image:url('+sg.strip+');background-size:'+bgW+'px 100%;background-position:'+(-(l.segIn||0)/d*bgW)+'px 0;'}
    v+='<div class="tlv'+(i===S.li?' cur':'')+(sg?'':' miss')+' lv-'+lv+'" data-tlv="'+i+'" style="left:'+x0+'px;width:'+w+'px;'+st+'" title="Dòng '+(i+1)+': '+esc(sg?sg.label+' · nguồn '+tc(l.segIn||0)+(l.segOut?' – '+tc(l.segOut):''):'chưa có cảnh')+'">'+
     '<span class="tlvl">'+(i+1)+(sg?'':' · thiếu cảnh')+'</span>'+(sg?'<span class="hd l" data-tlh="L|'+i+'" title="Kéo để đổi điểm đầu đoạn video"></span><span class="hd r" data-tlh="R|'+i+'" title="Kéo để đổi điểm cuối đoạn video"></span>':'')+'</div>'});
  h+='<div class="tlt" style="top:'+y+'px;height:'+TLH.video+'px">'+v+'</div>';y+=TLH.video;
  // tầng giọng
  var g='<canvas id="tlwave" width="'+Math.min(W,20000)+'" height="'+TLH.voice+'"></canvas>';
  if(c.audioUrl&&c.audioDur){c.lines.forEach(function(l,i){if(i===0)return;g+='<span class="tlb" data-tlb="'+i+'" style="left:'+(X(l.s)-4)+'px" title="Kéo để chỉnh ranh giới giọng giữa dòng '+i+' và '+(i+1)+'"></span>'});
    c.lines.forEach(function(l,i){if(l.ae!=null&&l.ae-l.as>l.e-l.s+0.05)g+='<span class="tlcut" style="left:'+X(l.e)+'px;width:'+Math.max(3,X(l.s+(l.ae-l.as))-X(l.e))+'px" title="Dòng '+(i+1)+': giọng dài '+fmt1(l.ae-l.as)+'s, dòng chỉ '+fmt1(l.e-l.s)+'s nên bị cắt '+fmt1(l.ae-l.as-(l.e-l.s))+'s">cắt giọng</span>'})}
  else g+='<span class="tlnone">Chưa có giọng đọc</span>';
  h+='<div class="tlt voice" style="top:'+y+'px;height:'+TLH.voice+'px">'+g+'</div>';y+=TLH.voice;
  // tầng chữ
  var tx='';c.lines.forEach(function(l,i){l.infos.forEach(function(x,k){if(!infoOk(x))return;var sp=infoSpan(l,x);if(!sp)return;var x0=X(sp.a),w=Math.max(10,X(sp.b)-x0);
    tx+='<div class="tlx'+(i===S.li?' cur':'')+'" data-tlx="'+i+'|'+k+'" style="left:'+x0+'px;width:'+w+'px;top:'+(3+(k%2)*13)+'px" title="Dòng '+(i+1)+': '+esc(x.x)+' · '+tc(sp.a)+' – '+tc(sp.b)+'. Kéo để đổi thời điểm hiện, kéo mép phải để đổi độ dài">'+esc(x.x)+'<span class="hd r" data-tlxr="'+i+'|'+k+'"></span></div>'})});
  h+='<div class="tlt" style="top:'+y+'px;height:'+TLH.text+'px">'+tx+'</div>';y+=TLH.text;
  h+='<div class="tlt music" style="top:'+y+'px;height:'+TLH.music+'px"><span class="tlnone">Nhạc nền: sẽ có ở bước sau</span></div>';
  h+='<div class="tlph" id="tlph" style="left:'+X(S.t)+'px"><span></span></div>';
  inn.innerHTML=h;tlWave(c);
}
function tlWave(c){var cv=document.getElementById('tlwave'),inn=document.getElementById('tlin');if(!cv||!inn||!c.audioUrl||!c.audioDur)return;
  if(c.peaksUrl!==c.audioUrl||!c.peaks){ensurePeaks(c,function(){tlWave(c)});return}
  var g=cv.getContext('2d'),pps=inn._pps,H=cv.height,cs=getComputedStyle(document.documentElement),pk=c.peaks,D=c.audioDur,mid=H/2;
  g.clearRect(0,0,cv.width,H);
  c.lines.forEach(function(l,i){if(l.as==null)return;var len=Math.min(l.ae-l.as,l.e-l.s),x0=l.s*pps,x1=(l.s+len)*pps;
    g.fillStyle=i===S.li?(cs.getPropertyValue('--accent').trim()):(cs.getPropertyValue('--muted').trim());g.globalAlpha=i===S.li?0.9:0.55;
    for(var x=Math.max(0,Math.floor(x0));x<Math.min(cv.width,x1);x+=2){var at=l.as+(x/pps-l.s),k=Math.floor(at/D*pk.length),v=pk[Math.max(0,Math.min(pk.length-1,k))]||0,hh=Math.max(1,v*(H-10));g.fillRect(x,mid-hh/2,1.5,hh)}
    g.globalAlpha=1});}
/* Đồng bộ kim chạy, dòng đang chọn và tự cuộn khi phát. */
function tlSync(c,t){var ph=document.getElementById('tlph'),inn=document.getElementById('tlin'),sc=document.getElementById('tlsc'),lb=document.getElementById('tltc');if(lb)lb.textContent=tc(t);
  if(!ph||!inn)return;var x=t*inn._pps;ph.style.left=x+'px';
  if(S.play&&sc&&(x<sc.scrollLeft+20||x>sc.scrollLeft+sc.clientWidth-40))sc.scrollLeft=Math.max(0,x-sc.clientWidth*0.3)}
function tlLineAt(c,t){var l=c.lines.filter(function(x){return t>=x.s&&t<x.e})[0];return l?c.lines.indexOf(l):(t>0?c.lines.length-1:0)}
function tlSeek(c,t,sel){var tot=timeline(c);S.t=Math.max(0,Math.min(tot,t));var li=tlLineAt(c,S.t);if(S.play){stop()}
  if(sel!==false&&li!==S.li){S.li=li;render()}else{var sb=document.getElementById('scrub');if(sb)sb.value=S.t;drawPhone()}}
afterGhep=(function(f){return function(){f.apply(this,arguments);tlBuild()}})(afterGhep);
window.addEventListener('resize',function(){if(S.tab==='ghep'&&!S.tlz)tlBuild()});

/* ---------- kéo thả trên thanh thời gian ---------- */
var TLD=null;
document.addEventListener('pointerdown',function(e){
  var inn=e.target.closest('#tlin');if(!inn||e.button!==0)return;var c=clip(S.cur);if(!c)return;var pps=inn._pps,r=inn.getBoundingClientRect(),t0=(e.clientX-r.left)/pps,d=e.target.dataset,el;
  if(d.tlh){var p=d.tlh.split('|'),l=c.lines[+p[1]],sg=lineSeg(l);if(!sg)return;var need=Math.max(0.1,(l.e-l.s)*(l.spd||1));
    TLD={k:p[0],i:+p[1],l:l,sg:sg,x0:e.clientX,a0:l.segIn||0,o0:l.segOut||Math.min(sdur(sg),(l.segIn||0)+need),moved:false}}
  else if(d.tlb){var k=+d.tlb;TLD={k:'B',i:k,b0:abounds(c)[k],x0:e.clientX,moved:false}}
  else if((el=e.target.closest('[data-tlx]'))){var q=el.dataset.tlx.split('|'),ll=c.lines[+q[0]],x=ll.infos[+q[1]],sp=infoSpan(ll,x);if(!sp)return;
    TLD={k:d.tlxr?'XR':'X',i:+q[0],x:x,l:ll,el:el,a0:sp.a,b0:sp.b,x0:e.clientX,moved:false}}
  else{TLD={k:'SEEK',x0:e.clientX,t:t0,moved:false};var v=e.target.closest('[data-tlv]');if(v)TLD.li=+v.dataset.tlv}
  TLD.c=c;TLD.pps=pps;try{e.target.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
document.addEventListener('pointermove',function(e){var g=TLD;if(!g)return;var dt=(e.clientX-g.x0)/g.pps;if(Math.abs(e.clientX-g.x0)>2)g.moved=true;if(!g.moved)return;
  var tipT='';
  if(g.k==='L'||g.k==='R'){var d=sdur(g.sg),spd=g.l.spd||1;
    if(g.k==='L'){var a=Math.max(0,Math.min(d-0.2,Math.round((g.a0+dt*spd)*10)/10));g.l.segIn=a;if(g.l.segOut&&g.l.segOut<a+0.2)g.l.segOut=Math.min(d,a+0.2);tipT='Điểm đầu đoạn video: '+tc(a)}
    else{var o=Math.max((g.l.segIn||0)+0.2,Math.min(d,Math.round((g.o0+dt*spd)*10)/10));g.l.segOut=o;tipT='Điểm cuối đoạn video: '+tc(o)}}
  else if(g.k==='B'){setBound(g.c,g.i,g.b0+dt);tipT='Ranh giới giọng: '+tc(abounds(g.c)[g.i])}
  else if(g.k==='X'){var off=Math.max(0,Math.min(g.l.e-g.l.s-0.3,Math.round((g.a0-g.l.s+dt)*10)/10));g.x.off=off;g.el.style.left=Math.round((g.l.s+off)*g.pps)+'px';tipT='Chữ hiện lúc '+tc(g.l.s+off)}
  else if(g.k==='XR'){var len=Math.max(0.5,Math.round((g.b0-g.a0+dt)*10)/10);g.x.len=len;g.el.style.width=Math.round(len*g.pps)+'px';tipT='Chữ ở lại '+fmt1(len)+'s'}
  else if(g.k==='SEEK'){tlSeek(g.c,g.t+dt,false);return}
  if(g.k!=='X'&&g.k!=='XR'){tlBuild();drawPhone()}else drawPhone();
  var lb=document.getElementById('tltc');if(lb)lb.textContent=tipT});
document.addEventListener('pointerup',function(e){var g=TLD;if(!g)return;TLD=null;
  if(g.k==='SEEK'){var t=g.moved?S.t:g.t;if(!g.moved&&g.li!=null&&g.li!==S.li){S.li=g.li;S.t=t;if(S.play)stop();render();return}tlSeek(g.c,t);return}
  if(!g.moved)return;
  if(g.k==='L'||g.k==='R')lockLine(g.l); // chỉnh đoạn tay như ở Inspector: khóa dòng
  render()});
document.addEventListener('wheel',function(e){if(!e.ctrlKey||!e.target.closest('#tlsc'))return;e.preventDefault();var c=clip(S.cur);if(!c)return;S.tlz=Math.max(4,Math.min(600,tlPps(c)*(e.deltaY<0?1.25:0.8)));tlSaveZ();tlBuild()},{passive:false});
function tlSaveZ(){try{localStorage.setItem('xuongclip_tlz',String(S.tlz||0))}catch(e){}}
document.addEventListener('click',function(e){var b=e.target.closest('[data-tl]');if(!b)return;var c=clip(S.cur);if(!c)return;
  switch(b.dataset.tl){
    case 'zin':S.tlz=Math.min(600,tlPps(c)*1.5);tlSaveZ();tlBuild();return;
    case 'zout':S.tlz=Math.max(4,tlPps(c)/1.5);tlSaveZ();tlBuild();return;
    case 'fit':S.tlz=0;tlSaveZ();tlBuild();return;
    case 'keys':S.tlKeys=!S.tlKeys;render();return}});

/* ---------- phím tắt ---------- */
function typing(e){var t=e.target;return !!t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))}
document.addEventListener('keydown',function(e){
  if(S.tab!=='ghep'||typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;var c=clip(S.cur);if(!c||!c.auto||!document.getElementById('ed5'))return;
  var k=e.key,l=c.lines[S.li],sg;
  if(k==='?'){S.tlKeys=!S.tlKeys;render();e.preventDefault();return}
  if(k==='Escape'&&S.tlKeys){S.tlKeys=false;render();return}
  if(k===' '||e.code==='Space'){e.preventDefault();if(S.play)stop();else startPlay(c);render();return}
  if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();var dt=(e.shiftKey?1:1/30)*(k==='ArrowLeft'?-1:1);tlSeek(c,S.t+dt);return}
  if(k==='['||k===']'){e.preventDefault();var n=Math.max(0,Math.min(c.lines.length-1,S.li+(k===']'?1:-1)));timeline(c);S.li=n;S.t=c.lines[n].s;if(S.play)stop();render();return}
  if(k==='i'||k==='I'||k==='o'||k==='O'){if(!l||!(sg=lineSeg(l))){msg('Dòng '+(S.li+1)+' chưa có cảnh để đặt điểm đầu, cuối.');return}e.preventDefault();
    timeline(c);var tt=Math.max(l.s,Math.min(l.e-0.01,S.t)),src=Math.round(srcT(l,sg,tt)*10)/10,d=sdur(sg);
    if(k==='i'||k==='I'){l.segIn=Math.max(0,Math.min(d-0.2,src));if(l.segOut&&l.segOut<l.segIn+0.2)l.segOut=null;lockLine(l);msg('Dòng '+(S.li+1)+': điểm đầu đoạn video '+tc(l.segIn)+'.')}
    else{if(src<(l.segIn||0)+0.2){msg('Điểm cuối phải sau điểm đầu ('+tc(l.segIn||0)+').');return}l.segOut=Math.min(d,src);lockLine(l);msg('Dòng '+(S.li+1)+': điểm cuối đoạn video '+tc(l.segOut)+'.')}
    touchClips();return}
});
