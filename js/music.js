/* Nhạc nền của clip (người dùng tự nạp; tự chọn nhạc có bản quyền phù hợp).
   File nhạc lưu ở .xuongclip/audio/<mã clip>.nhac.<đuôi> như file giọng; state.json chỉ giữ đường dẫn và thông số:
   start (giây trên clip bắt đầu nhạc), len (độ dài, 0 = đến hết clip), srcIn (bắt đầu từ giây thứ mấy của bài),
   fit ('loop' lặp lại / 'once' phát một lần rồi im), fin / fout (mờ vào / mờ ra, giây),
   vol (âm lượng khi không có giọng, %), volv (âm lượng khi đang có giọng, %).
   musicAt() là hàm chung cho nghe thử và file xuất, nên âm lượng nghe thử và xuất giống nhau. */
var MUS0={start:0,len:0,srcIn:0,fit:'loop',fin:1,fout:1.5,vol:60,volv:15};
var MUS_KEYS=['file','name','dur','start','len','srcIn','fit','fin','fout','vol','volv'];
var DUCKR=0.25; // giây chuyển mức âm lượng trước / sau đoạn có giọng
function musCfg(m){var o={};for(var k in MUS0)o[k]=MUS0[k];if(m)MUS_KEYS.forEach(function(k){if(m[k]!=null&&m[k]!=='')o[k]=m[k]});
  ['start','len','srcIn','fin','fout','vol','volv','dur'].forEach(function(k){o[k]=+o[k];if(!isFinite(o[k])||o[k]<0)o[k]=k==='dur'?0:MUS0[k]});
  o.vol=Math.min(100,o.vol);o.volv=Math.min(100,o.volv);o.fit=o.fit==='once'?'once':'loop';return o}
function hasMusic(c){return !!(c&&c.music&&c.musicFile&&c.music.dur>0)}
function clipTotal(c){return timeline(c)+(typeof endDur==='function'?endDur(c):0)}
/* Các đoạn có giọng trên trục thời gian clip. */
function voiceSpans(c){if(!c.audioUrl&&!c.audioFile)return [];timeline(c);var man=manualDur(c),r=[];
  c.lines.forEach(function(l){if(l.as==null)return;var len=man?Math.min(l.ae-l.as,l.e-l.s):(l.e-l.s);if(!man&&c.audioDur)len=Math.min(len,Math.max(0,c.audioDur-l.s));if(len>0.05)r.push([l.s,l.s+len])});return r}
function voiceAmt(sp,t){var a=0;for(var i=0;i<sp.length;i++){var v=Math.min((t-(sp[i][0]-DUCKR))/DUCKR,((sp[i][1]+DUCKR)-t)/DUCKR);if(v>a)a=v;if(a>=1)return 1}return Math.max(0,Math.min(1,a))}
function musSpan(c,m){var tot=clipTotal(c),ms=Math.min(Math.max(0,m.start),Math.max(0,tot-0.5)),me=Math.min(tot,m.len>0?ms+m.len:tot);return {a:ms,b:me}}
/* Nhạc tại giây t của clip: {on, src: giây trong bài, g: hệ số âm lượng 0..1}. */
function musicAt(c,t,sp){if(!c||!c.music)return null;var m=musCfg(c.music);if(!(m.dur>0))return null;var r=musSpan(c,m);
  if(t<r.a||t>=r.b)return {on:false,g:0,src:0};
  var el=t-r.a,a=Math.min(m.srcIn,Math.max(0,m.dur-0.2)),span=m.dur-a,src;
  if(el<span)src=a+el;else if(m.fit==='loop')src=a+(el%span);else return {on:false,g:0,src:0};
  var dk=voiceAmt(sp||voiceSpans(c),t),g=(m.vol/100)*(1-dk)+(m.volv/100)*dk,f=1;
  if(m.fin>0)f=Math.min(f,el/m.fin);if(m.fout>0)f=Math.min(f,(r.b-t)/m.fout);return {on:true,src:src,g:g*Math.max(0,Math.min(1,f))}}

/* ---------- nạp / lưu file nhạc ---------- */
function setClipMusic(c,file,dur){var ext=((/\.([a-z0-9]{2,4})$/i.exec(file.name||'')||[])[1]||'mp3').toLowerCase();
  if(c.musicUrl)try{URL.revokeObjectURL(c.musicUrl)}catch(e){}
  var keep=c.music?musCfg(c.music):musCfg(null);c.music={};MUS_KEYS.forEach(function(k){if(keep[k]!=null)c.music[k]=keep[k]});
  c.music.file='audio/'+audioFileName(c,'nhac.'+ext);c.music.name=file.name||'nhạc';c.music.dur=Math.round((+dur||0)*1000)/1000;
  c.musicFile=file;c.musicUrl=URL.createObjectURL(file);c.musicPending=true;c.musicMissing=false;touchClips();markDirty()}
function clearClipMusic(c){if(c.musicUrl)try{URL.revokeObjectURL(c.musicUrl)}catch(e){}delete c.music;delete c.musicFile;delete c.musicUrl;delete c.musicPending;delete c.musicMissing;touchClips()}
function loadMusicFile(c,file){var u=URL.createObjectURL(file),a=new Audio();a.preload='metadata';
  a.onloadedmetadata=function(){var d=a.duration;URL.revokeObjectURL(u);if(!(d>0)||!isFinite(d)){msg('Không đọc được thời lượng file nhạc '+file.name+'.');return}setClipMusic(c,file,d);msg('Đã thêm nhạc nền "'+file.name+'" ('+fmt1(d)+'s) cho '+c.id+'. Nhớ dùng nhạc có bản quyền phù hợp.');render()};
  a.onerror=function(){URL.revokeObjectURL(u);msg('Trình duyệt không đọc được file nhạc '+file.name+'. Hãy dùng mp3, m4a hoặc wav.')};a.src=u}

/* ---------- nghe thử: một thẻ audio, âm lượng và vị trí theo musicAt() ---------- */
function musSync(c){if(!S.play||!hasMusic(c)){if(S.mus)try{S.mus.pause()}catch(e){}return}
  if(!S.mus||S.musUrl!==c.musicUrl){if(S.mus)try{S.mus.pause()}catch(e){}S.mus=new Audio(c.musicUrl);S.musUrl=c.musicUrl}
  var r=musicAt(c,S.t);if(!r||!r.on){if(!S.mus.paused)S.mus.pause();S.musG=0;return}
  S.musG=r.g;S.mus.volume=Math.max(0,Math.min(1,r.g));if(Math.abs(S.mus.currentTime-r.src)>0.3)try{S.mus.currentTime=r.src}catch(e){}
  if(S.mus.paused){var p=S.mus.play();if(p&&p.catch)p.catch(function(){})}}
(function(){var dp=drawPhone;drawPhone=function(){dp.apply(this,arguments);var c=clip(S.cur);if(c&&S.tab==='ghep')musSync(c)}})();
(function(){var st=stop;stop=function(){if(S.mus){try{S.mus.pause()}catch(e){}}return st.apply(this,arguments)}})();

/* ---------- Inspector: mục Nhạc nền ---------- */
function musicBox(c){var m=c.music?musCfg(c.music):null,n=function(k,lab,mn,mx,st,un){return '<label class="lc">'+lab+'<input type="number" min="'+mn+'" max="'+mx+'" step="'+st+'" data-mus="'+k+'" value="'+(m[k]===0&&k==='len'?'':m[k])+'"'+(k==='len'?' placeholder="đến hết"':'')+'>'+(un||'')+'</label>'};
  var h='<label class="vf">Nạp file nhạc (mp3, m4a, wav)<input type="file" id="musf" accept="audio/*"></label><div class="meta">Tự chọn nhạc có bản quyền phù hợp. File được chép vào .xuongclip/audio của thư mục source.</div>';
  if(!m)return h;
  if(c.musicMissing)h+='<div class="w warn">File nhạc '+esc(m.file||'')+' không còn trong thư mục, hãy nạp lại.</div>';
  var sp=musSpan(c,m);
  h+='<div class="meta">Đang dùng: <b>'+esc(m.name||'')+'</b> ('+fmt1(m.dur)+'s) · phát từ '+tc(sp.a)+' đến '+tc(sp.b)+(m.fit==='loop'&&sp.b-sp.a>m.dur-m.srcIn?' · lặp lại':'')+'</div>'+
   '<div class="tsg">'+n('start','Bắt đầu trên clip (s)',0,600,0.1)+n('len','Độ dài (s)',0,600,0.1)+n('srcIn','Bắt đầu từ giây của bài',0,3600,0.1)+
   '<label class="lc">Khi bài ngắn hơn<select data-mus="fit"><option value="loop"'+(m.fit==='loop'?' selected':'')+'>Lặp lại</option><option value="once"'+(m.fit==='once'?' selected':'')+'>Phát một lần rồi im</option></select></label>'+
   n('fin','Mờ vào (s)',0,10,0.1)+n('fout','Mờ ra (s)',0,10,0.1)+'</div>'+
   '<label class="lsl">Không có giọng<input type="range" min="0" max="100" step="1" data-mus="vol" value="'+m.vol+'" aria-label="Âm lượng nhạc khi không có giọng"><span class="tc">'+m.vol+'%</span></label>'+
   '<label class="lsl">Khi có giọng<input type="range" min="0" max="100" step="1" data-mus="volv" value="'+m.volv+'" aria-label="Âm lượng nhạc khi có giọng"><span class="tc">'+m.volv+'%</span></label>'+
   '<div class="meta">Nhạc tự hạ xuống mức "khi có giọng" trong các đoạn có giọng đọc (chuyển mức trong '+DUCKR+' giây). Bấm Phát để nghe thử.</div>'+
   '<div class="bar"><button class="btn sm" data-musact="del">Bỏ nhạc nền</button></div>';
  return h}
document.addEventListener('change',function(e){var t=e.target,c=clip(S.cur);if(!c)return;
  if(t.id==='musf'){var f=t.files&&t.files[0];if(f)loadMusicFile(c,f);return}
  var k=t.dataset.mus;if(!k||!c.music)return;
  if(k==='fit')c.music.fit=t.value==='once'?'once':'loop';else{var v=t.value===''?0:+t.value;if(!isFinite(v)||v<0)v=0;if(k==='vol'||k==='volv')v=Math.min(100,Math.round(v));else v=Math.round(v*10)/10;c.music[k]=v}
  touchClips();render()});
document.addEventListener('input',function(e){var k=e.target.dataset.mus;if(k!=='vol'&&k!=='volv')return;var s=e.target.nextElementSibling;if(s)s.textContent=e.target.value+'%'});
document.addEventListener('click',function(e){var b=e.target.closest('[data-musact]');if(!b)return;var c=clip(S.cur);if(!c)return;
  if(b.dataset.musact==='del'){if(!confirm('Bỏ nhạc nền của '+c.id+'? File nhạc đã chép trong .xuongclip vẫn giữ nguyên trên đĩa.'))return;clearClipMusic(c);if(S.mus)try{S.mus.pause()}catch(x){}render()}});

/* ---------- tầng Nhạc trên thanh thời gian ---------- */
function tlMusicHTML(c,X){if(!c.music)return '<span class="tlnone">Chưa có nhạc nền · thêm ở Inspector › Nhạc nền</span>';var m=musCfg(c.music),r=musSpan(c,m),x0=X(r.a),w=Math.max(12,X(r.b)-x0),h='';
  var a=Math.min(m.srcIn,Math.max(0,m.dur-0.2)),span=m.dur-a;
  if(m.fit==='loop'&&span>0)for(var k=r.a+span;k<r.b-0.05;k+=span)h+='<span class="tlmk" style="left:'+(X(k)-x0)+'px" title="Nhạc lặp lại"></span>';
  var end=m.fit==='once'?Math.min(r.b,r.a+span):r.b;
  if(m.fit==='once'&&end<r.b)h+='<span class="tlmq" style="left:'+(X(end)-x0)+'px;width:'+Math.max(0,X(r.b)-X(end))+'px" title="Bài hết, phần còn lại im"></span>';
  if(m.fin>0)h+='<span class="tlmf in" style="width:'+Math.min(w,X(r.a+m.fin)-x0)+'px"></span>';if(m.fout>0)h+='<span class="tlmf out" style="width:'+Math.min(w,X(r.b)-X(r.b-m.fout))+'px"></span>';
  return '<div class="tlm'+(c.musicMissing?' miss':'')+'" data-tlm="1" style="left:'+x0+'px;width:'+w+'px" title="'+esc((m.name||'Nhạc')+' · '+tc(r.a)+' – '+tc(r.b)+'. Kéo để dời điểm bắt đầu, kéo mép phải để đổi độ dài')+'">'+h+'<span class="tlml">♪ '+esc(m.name||'Nhạc')+'</span><span class="hd r" data-tlmr="1"></span></div>'}
