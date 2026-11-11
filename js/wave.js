/* Sóng âm giọng đọc và vạch chia dòng. */
function lineCtl(c,l,i){var auto=(l.ae!=null?l.ae-l.as:l.e-l.s);
  return '<button class="btn sm" data-playline="'+i+'">'+((S.play&&S.stopAt!=null&&S.li===i)?'Dừng':'▶ Nghe dòng này')+'</button>'+
   '<label class="lc">Thời lượng (giây)<input type="number" min="1" max="60" step="0.1" data-dm="'+i+'" value="'+(l.dm||'')+'" placeholder="tự '+auto.toFixed(1)+'" aria-label="Thời lượng dòng '+(i+1)+'"></label>'+
   '<label class="lc">Tốc độ source (×)<input type="number" min="0.25" max="4" step="0.05" data-spd="'+i+'" value="'+((l.spd&&l.spd!==1)?l.spd:'')+'" placeholder="1" aria-label="Tốc độ source dòng '+(i+1)+'"></label>'+(c.audioUrl?'<button class="btn sm" data-playb="'+i+'">'+((S.baud&&S.bi===i)?'Dừng':'Nghe ranh giới')+'</button>':'')+bndCtl(c,l,i)+'<button class="btn sm" data-delline="'+i+'" aria-label="Xóa đoạn '+(i+1)+'">Xóa đoạn này</button>'+((l.dm>0&&l.ae!=null&&l.dm<(l.ae-l.as)-0.05)?'<span class="cutw">Voice dài '+fmt1(l.ae-l.as)+'s, bạn nhập '+fmt1(l.dm)+'s, sẽ bị cắt '+fmt1(l.ae-l.as-l.dm)+'s</span>':'')}
function voiceBox(c){
  return '<aside class="vside" aria-label="Giọng đọc"><b class="vt">Giọng đọc</b>'+gemBlock(c)+waveBox(c)+'<label class="vf">Hoặc tải file giọng (mp3, wav)<input type="file" id="audf" accept="audio/*"></label><div class="meta">'+(c.audioFile?'Đang dùng: '+esc(c.audioFile.name):'Chưa có giọng, video xuất ra sẽ không có tiếng.')+'</div><div class="bar"><button class="btn sm" data-act="copyvo">Sao chép lời thoại</button></div></aside>'}
function waveBox(c){
  if(!c.audioUrl||!c.audioDur)return '';
  return '<div class="wavew"><div class="lab">Sóng giọng và ranh giới các dòng</div><canvas id="wavec" width="540" height="168" role="img" aria-label="Sóng giọng với vạch ranh giới các dòng"></canvas><div class="meta" id="wavei">Kéo vạch đứng để chỉnh. Mỗi dòng cũng có ô nhập giây và nút nghe quanh vạch.</div>'+
   '<div class="bar"><button class="btn sm" data-wx="1">'+(S.wx?'Thu nhỏ sóng':'Phóng to sóng')+'</button></div>'+
   '<label class="note" style="display:block"><input type="checkbox" id="wsnap" '+(S.snapOff?'':'checked')+'> Vạch tự hít vào chỗ lặng (giữ Shift để tắt tạm)</label></div>'}
function waveWide(c){
  if(!S.wx||!c.audioUrl||!c.audioDur)return '';
  return '<div class="wavex"><div class="bar" style="margin:0 0 6px"><b>Sóng giọng phóng to</b><label class="note"><input type="checkbox" id="wzoom" '+(S.wzoom?'checked':'')+'> Zoom quanh vạch đang chọn (±3 giây)</label><button class="btn sm" data-wx="1">Thu nhỏ</button></div><canvas id="wavex" width="760" height="200" role="img" aria-label="Sóng giọng phóng to"></canvas><div class="meta" id="wavei2">'+(S.wzoom&&S.wk==null?'Bấm vào một vạch để zoom quanh vạch đó.':'Kéo vạch để chỉnh. Vạch đầu và cuối là chỗ bắt đầu và kết thúc tiếng nói thật.')+'</div></div>'}
function bndCtl(c,l,i){
  if(!c.audioUrl||!c.audioDur||l.as==null)return '';
  function g(k,lab,val){return '<div class="g"><label class="lc">'+lab+'<input type="number" step="0.05" min="0" data-bv="'+k+'" value="'+val.toFixed(2)+'" aria-label="'+lab+'"></label><button class="btn sm" data-bn="'+k+'|-0.05" aria-label="Lùi 0,05 giây">−0,05</button><button class="btn sm" data-bn="'+k+'|0.05" aria-label="Tiến 0,05 giây">+0,05</button><button class="btn sm" data-bl="'+k+'">'+((S.baud&&S.bi==='b'+k)?'Dừng':'Nghe 1 giây quanh vạch')+'</button></div>'}
  return '<div class="rng" style="flex-basis:100%">'+g(i,i===0?'Giọng bắt đầu (s)':'Vạch đầu dòng (s)',l.as)+(i===c.lines.length-1?g(i+1,'Giọng kết thúc (s)',l.ae):'')+'</div>'}
function setBound(c,k,v){var b=abounds(c),D=c.audioDur,N=c.lines.length,lo=(k===0)?0:b[k-1]+0.3,hi=(k===N)?D:b[k+1]-0.3;if(lo>hi)return;
  b[k]=Math.round(Math.max(lo,Math.min(hi,v))*100)/100;c.bounds=b;c.bManual=true}
function playWin(c,a,e,key){stop();stopB();S.bi=key;S.baud=new Audio(c.audioUrl);try{S.baud.currentTime=Math.max(0,a)}catch(x){}S.baud.play().catch(function(){});
  S.btm=setInterval(function(){if(!S.baud||S.baud.currentTime>=e||S.baud.ended){stopB();render()}},30);render()}
function abounds(c){timeline(c);var b=[c.lines[0].as];c.lines.forEach(function(l){b.push(l.ae)});return b}
function ensurePeaks(c,cb){
  if(c.peaksUrl===c.audioUrl&&c.peaks){cb();return}
  if(!c.audioFile||c.peaksBusy===c.audioUrl)return;var u=c.audioUrl;c.peaksBusy=u;
  c.audioFile.arrayBuffer().then(function(ab){var AC=window.AudioContext||window.webkitAudioContext,ax=new AC();return ax.decodeAudioData(ab).then(function(buf){try{ax.close()}catch(e){}return buf})}).then(function(buf){
    var ch=buf.getChannelData(0),sr=buf.sampleRate,N=1600,step=Math.max(1,Math.floor(ch.length/N)),p=[],i,j;
    for(i=0;i<N;i++){var m=0;for(j=0;j<step;j+=8){var v=Math.abs(ch[i*step+j]||0);if(v>m)m=v}p.push(m)}
    var mx=Math.max.apply(null,p)||1;c.peaks=p.map(function(v){return v/mx});
    var win=Math.floor(sr*0.02),n=Math.floor(ch.length/win),rms=[],a2;
    for(i=0;i<n;i++){a2=0;for(j=0;j<win;j++){var v2=ch[i*win+j];a2+=v2*v2}rms.push(Math.sqrt(a2/win))}
    var so=rms.slice().sort(function(x,y){return x-y}),p90=so[Math.floor(n*0.9)]||0.01,thr=Math.max(p90*0.1,0.0005),gaps=[],run=0,st0=0;
    for(i=0;i<=n;i++){var sil=i<n&&rms[i]<thr;if(sil){if(!run)st0=i;run++}else{if(run>=6&&st0>3&&i<n-3)gaps.push((st0+i)/2*0.02);run=0}}
    var f0=0,f1=n-1;while(f0<n&&rms[f0]<thr)f0++;while(f1>0&&rms[f1]<thr)f1--;
    c.gaps=gaps;c.sp0=Math.max(0,f0*0.02-0.08);c.sp1=Math.min(c.audioDur||buf.duration,(f1+1)*0.02+0.15);
    c.peaksUrl=u;c.peaksBusy=null;cb()
  }).catch(function(){c.peaksBusy=null})}
function waveView(c){if(!S.wzoom||S.wk==null)return null;var b=abounds(c),m=b[S.wk],D=c.audioDur;if(m==null)return null;var a=Math.max(0,m-3),e=Math.min(D,m+3);if(e-a<6){if(a===0)e=Math.min(D,6);else a=Math.max(0,D-6)}return {a:a,b:e}}
function paintWave(cv,c,view){
  var g=cv.getContext('2d'),W=cv.width,H=cv.height,cs=getComputedStyle(document.documentElement),D=c.audioDur,b=S.wb||abounds(c),i,N=c.lines.length;
  var t0=view?view.a:0,t1=view?view.b:D,sp=t1-t0,X=function(t){return (t-t0)/sp*W};cv._t0=t0;cv._t1=t1;
  var acc=cs.getPropertyValue('--accent').trim()||'#8E1B1B',mut=cs.getPropertyValue('--muted').trim()||'#888',big=W>=700,fs=big?24:20;
  g.clearRect(0,0,W,H);
  for(i=0;i<N;i++){var x0=X(b[i]),x1=X(b[i+1]);if(x1<0||x0>W)continue;
    g.globalAlpha=0.10;g.fillStyle=(i%2)?mut:acc;g.fillRect(Math.max(0,x0),0,Math.min(W,x1)-Math.max(0,x0),H);g.globalAlpha=1;
    g.fillStyle=mut;g.font='bold '+fs+'px sans-serif';g.textBaseline='top';g.fillText(String(i+1),Math.max(0,x0)+5,3)}
  g.fillStyle=mut;var pk=c.peaks,mid=H/2+8,bw=W/pk.length*D/sp;
  for(i=0;i<pk.length;i++){var xx=X(i/pk.length*D);if(xx<-2||xx>W)continue;var h=Math.max(1,pk[i]*(H-44));g.fillRect(xx,mid-h/2,Math.max(1,bw-0.4),h)}
  if(big){g.fillStyle=mut;g.font='16px sans-serif';g.textBaseline='bottom';var tk=sp>10?1:0.5;for(var t=Math.ceil(t0/tk)*tk;t<t1;t+=tk){var xt=X(t);g.fillRect(xt,H-8,1,8);g.fillText(t.toFixed(tk<1?1:0)+'s',xt+3,H-8)}}
  for(i=0;i<=N;i++){var x=X(b[i]);if(x<-8||x>W+8)continue;var sel=(S.wk===i);
    g.strokeStyle=sel?'#C9922B':acc;g.fillStyle=sel?'#C9922B':acc;g.lineWidth=sel?5:3;g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();g.beginPath();g.arc(x,H-14,sel?10:7,0,6.3);g.fill()}}
function drawWave(c){
  var c1=document.getElementById('wavec'),cx=document.getElementById('wavex');if(!c.audioDur||!c.lines.length||(!c1&&!cx))return;
  if(c.peaksUrl!==c.audioUrl||!c.peaks){ensurePeaks(c,function(){drawWave(c)});return}
  if(c1)paintWave(c1,c,null);
  if(cx)paintWave(cx,c,S.wdrag?S.wdrag.vw:waveView(c))}
function stopB(){if(S.btm){clearInterval(S.btm);S.btm=null}if(S.baud){try{S.baud.pause()}catch(x){}S.baud=null}S.bi=-1}
