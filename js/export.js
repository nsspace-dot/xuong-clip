/* Xuất video MP4 (WebCodecs + mp4-muxer), ảnh bìa, lưu file ra thư mục. */
function wrapText(ctx,text,maxW){var words=text.split(' '),lines=[],cur='';words.forEach(function(w){var tt=cur?cur+' '+w:w;if(ctx.measureText(tt).width>maxW&&cur){lines.push(cur);cur=w}else cur=tt});if(cur)lines.push(cur);return lines}
function mkTick(fn,ms){var w=null,id=null,u=null;
  try{var src='var t=null;onmessage=function(e){clearInterval(t);if(e.data==="stop")return;t=setInterval(function(){postMessage(1)},e.data)}';u=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));w=new Worker(u);w.onmessage=function(){fn()};w.postMessage(ms)}catch(e){w=null;id=setInterval(fn,ms)}
  return {stop:function(){if(w){try{w.postMessage('stop');w.terminate();URL.revokeObjectURL(u)}catch(e){}w=null}if(id){clearInterval(id);id=null}}}}
function yieldNow(){return new Promise(function(r){var ch=new MessageChannel();ch.port1.onmessage=function(){r()};ch.port2.postMessage(0)})}
function newCanvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function loadVid(url){return new Promise(function(res){var v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.onloadeddata=function(){res(v)};v.onerror=function(){res(null)};setTimeout(function(){res(v)},15000);v.src=url})}
function seekVid(v,t){return new Promise(function(res){var d=false,f=function(){if(!d){d=true;v.removeEventListener('seeked',f);res()}};v.addEventListener('seeked',f);setTimeout(f,2500);
  try{if(Math.abs(v.currentTime-t)<0.002&&v.readyState>=2){f();return}v.currentTime=t}catch(e){f()}})}
function drawTextBox(ctx,W,H,text,fs,fg,bg,cx,cy,shadow){
  ctx.font='700 '+fs+'px "Be Vietnam Pro",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  var ls=[],maxW=W*0.9-fs*1.2;String(text).split('\n').forEach(function(pp){wrapText(ctx,pp,maxW).forEach(function(q){ls.push(q)})});
  var lh=fs*1.24,mw=0;ls.forEach(function(q){mw=Math.max(mw,ctx.measureText(q).width)});
  var bw=Math.min(W*0.98,mw+fs*1.2),bh=ls.length*lh+fs*0.7,bx=Math.min(Math.max(cx-bw/2,W*0.01),W*0.99-bw),by=Math.min(Math.max(cy-bh/2,H*0.005),H*0.995-bh);
  if(bg){ctx.fillStyle=bg;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bw,bh,fs*0.45);else ctx.rect(bx,by,bw,bh);ctx.fill()}
  ctx.save();if(shadow){ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=fs*0.2;ctx.shadowOffsetY=fs*0.04}
  ctx.fillStyle=fg;ls.forEach(function(q,n){ctx.fillText(q,bx+bw/2,by+fs*0.35+lh*(n+0.5))});ctx.restore();ctx.textBaseline='alphabetic'}
function drawBase(ctx,W,H,v,l,sg,st,t,sx){
  if(!st.drew){ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)}
  if(v&&v.readyState>=2&&v.videoWidth){var k=Math.max(W/v.videoWidth,H/v.videoHeight),dw=v.videoWidth*k,dh=v.videoHeight*k;ctx.drawImage(v,(W-dw)/2,(H-dh)/2,dw,dh);st.drew=true;return}
  if(v&&st.drew&&!st.bad[st.li]&&t<sx+1.5)return;
  st.bad[st.li]=1;ctx.fillStyle='#333';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='600 36px system-ui,sans-serif';ctx.textAlign='center';
  wrapText(ctx,v?'Video không giải mã được':(l.seg?'Đoạn mẫu: '+(sg||{}).label:'THIẾU CẢNH: '+l.need),W-120).forEach(function(tx,n){ctx.fillText(tx,W/2,H/2+n*46)})}
function compose(ctx,W,H,c,li,t,v,st,sx){
  var l=c.lines[li],sg=l.seg?seg(l.seg):null;
  if(li!==st.li){if(st.li>=0){var px=st.prev.getContext('2d');px.clearRect(0,0,st.prev.width,st.prev.height);px.drawImage(st.cur,0,0)}st.li=li;st.tr=trFor(c,li)}
  drawBase(ctx,W,H,v,l,sg,st,t,sx);
  st.cur.getContext('2d').drawImage(ctx.canvas,0,0);
  if(st.tr&&st.hasPrev&&t-sx<st.tr.dur)trDraw(ctx,W,H,st.prev,st.tr.type,(t-sx)/st.tr.dur);
  st.hasPrev=true;
  l.infos.forEach(function(x){if(!infoOk(x))return;var sp=infoSpan(l,x);if(!sp)return;
    if(t>=sp.a&&t<Math.min(sp.b,l.e)){var pp=infoPos(x);drawTextBox(ctx,W,H,x.x,x.sz||INFO.size,INFO.fg,INFO.bg,pp.px*W,pp.py*H)}})}
function rtAdj(v,l,sg){if(!v||!sg)return;var need=Math.max(0.1,l.e-l.s),spd=l.spd||1,needS=need*spd,d=sdur(sg),a0=l.segIn||0,out=Math.min(l.segOut||d,d),span=Math.max(0.2,out-a0);
  v.playbackRate=Math.min(4,Math.max(0.25,spd));
  if(span<needS&&v.currentTime>=a0+span-0.03){if(l.fill==='hold'||l.fill==='slow'){try{v.pause()}catch(x){}}else{try{v.currentTime=a0}catch(x){}}}}
function askDir(){if(S.dir&&S.dir.queryPermission){S.dirPerm=S.dir.queryPermission({mode:'readwrite'}).then(function(pm){return pm==='granted'?pm:S.dir.requestPermission({mode:'readwrite'})}).catch(function(){return 'denied'})}else S.dirPerm=null}
function canOffline(){return !!(window.VideoEncoder&&window.VideoFrame&&window.AudioEncoder&&window.AudioData&&window.Mp4Muxer&&window.MessageChannel)}
async function pickCodecs(w,h,hasA,ch){
  var vl=[['avc1.640028','avc'],['avc1.640032','avc'],['avc1.4d0028','avc']];if(window.__ANYCODEC)vl.push(['vp09.00.40.08','vp9']);
  var vc=null;for(var i=0;i<vl.length&&!vc;i++){try{var r=await VideoEncoder.isConfigSupported({codec:vl[i][0],width:w,height:h,bitrate:5e6,framerate:30});if(r&&r.supported)vc=vl[i]}catch(e){}}
  if(!vc)return null;var ac=null;
  if(hasA){var al=[['mp4a.40.2','aac']];if(window.__ANYCODEC)al.push(['opus','opus']);
    for(var j=0;j<al.length&&!ac;j++){try{var r2=await AudioEncoder.isConfigSupported({codec:al[j][0],sampleRate:48000,numberOfChannels:ch,bitrate:128000});if(r2&&r2.supported)ac=al[j]}catch(e){}}
    if(!ac)return null}
  return {vc:vc[0],mv:vc[1],ac:ac?ac[0]:null,ma:ac?ac[1]:null}}
function exportClip(c){
  askDir();
  var types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  var mime='';for(var i=0;i<types.length;i++){if(window.MediaRecorder&&MediaRecorder.isTypeSupported(types[i])){mime=types[i];break}}
  if(!mime&&!canOffline()){msg('Trình duyệt này không hỗ trợ ghi video. Hãy dùng Chrome bản mới.');return}
  S.exporting=true;stop();render();
  var st=function(m){var e=document.getElementById('expst');if(e)e.textContent=m};
  var kq=EXPQ.res==='1080'?1.5:1,W=720,H=1280,cv=newCanvas(W*kq,H*kq),ctx=cv.getContext('2d');ctx.setTransform(kq,0,0,kq,0,0);
  var audioEl=null,adur=0,prep=Promise.resolve();
  if(c.audioFile){audioEl=new Audio();audioEl.src=URL.createObjectURL(c.audioFile);prep=new Promise(function(res){audioEl.onloadedmetadata=function(){adur=audioEl.duration;res()};audioEl.onerror=function(){res()}})}
  prep.then(function(){
    c.audioDur=adur>0?adur:null;timeline(c);var D=c.lines.map(function(l){return l.e-l.s}),Sx=c.lines.map(function(l){return l.s}),acc=c.lines.length?c.lines[c.lines.length-1].e:0;
    var total=acc+0.4;
    var vids=c.lines.map(function(l){var sg=l.seg?seg(l.seg):null;if(!sg||!sg.url)return null;var v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=sg.url;return v});
    var lineAt=function(t){var li=c.lines.length-1;for(var j=0;j<c.lines.length;j++){if(t>=Sx[j]&&t<Sx[j]+D[j]){li=j;break}}return li};
    var newSt=function(){return {drew:false,bad:{},li:-1,tr:null,hasPrev:false,cur:newCanvas(cv.width,cv.height),prev:newCanvas(cv.width,cv.height)}};
    var done=function(blob,ext,actx){var url=URL.createObjectURL(blob),mb=(blob.size/1048576).toFixed(1),base=fname(c);c.out={url:url,ext:ext,mb:mb,name:base+'.'+ext};c.exported=true;
      EXP.unshift({id:'X'+(EXP.length+1)+'-'+c.id,clipId:c.id,fname:base+'.'+ext,g:c.g,name:c.name,d:Math.round(total),url:url,ext:ext,date:new Date().toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),cap:c.name+' #tiktokshop #newshop',posted:false});
      S.exporting=false;try{if(actx)actx.close()}catch(x){}saveOut(blob,base,ext,function(extra){msg('Đã xuất xong '+c.id+' ('+ext+', '+mb+' MB).'+extra+' Xem và tải về ngay bên dưới.')})};
    st('Đang nạp video...');
    return Promise.all(vids.map(function(v){return !v?0:new Promise(function(res){var d=false,f=function(){if(!d){d=true;res()}};v.oncanplay=f;v.onerror=f;setTimeout(f,20000);if(v.readyState>=3)f()})})).then(function(){
      var unreadable=[];vids.forEach(function(v,i){if(v&&!(v.videoWidth>0&&v.readyState>=2))unreadable.push(i+1)});
      if(unreadable.length)st('Cảnh báo: video ở dòng '+unreadable.join(', ')+' không đọc được trong trình duyệt.');

      /* ---- cách 1: dựng từng khung hình (không phụ thuộc thời gian thật) ---- */
      var offline=async function(){
        var FPS=30,N=Math.ceil(total*FPS),hasA=!!c.audioFile,abuf=null,ch=2;
        if(hasA){var buf=await c.audioFile.arrayBuffer();var oc=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(2,1,48000);abuf=await oc.decodeAudioData(buf);ch=Math.min(2,abuf.numberOfChannels)}
        var cod=await pickCodecs(cv.width,cv.height,hasA,ch);if(!cod)throw new Error('trình duyệt chưa mã hóa được H.264 và AAC');
        var target=new Mp4Muxer.ArrayBufferTarget(),mc={target:target,video:{codec:cod.mv,width:cv.width,height:cv.height},fastStart:'in-memory',firstTimestampBehavior:'offset'};
        if(hasA)mc.audio={codec:cod.ma,numberOfChannels:ch,sampleRate:48000};
        var muxer=new Mp4Muxer.Muxer(mc),encErr=null;
        var venc=new VideoEncoder({output:function(chunk,meta){muxer.addVideoChunk(chunk,meta)},error:function(e){encErr=e}});
        venc.configure({codec:cod.vc,width:cv.width,height:cv.height,bitrate:kq>1?8e6:5e6,framerate:FPS,latencyMode:'quality'});
        var aenc=null;
        if(hasA){aenc=new AudioEncoder({output:function(chunk,meta){muxer.addAudioChunk(chunk,meta)},error:function(e){encErr=e}});aenc.configure({codec:cod.ac,sampleRate:48000,numberOfChannels:ch,bitrate:128000});
          var BL=4800,len=Math.min(abuf.length,Math.ceil(total*48000)),AM=abuf;
          if(manualDur(c)){var tl48=Math.ceil(total*48000),mix=[];for(var q0=0;q0<ch;q0++){var ma=new Float32Array(tl48),src0=abuf.getChannelData(q0);c.lines.forEach(function(l){var a0=Math.floor(l.as*48000),a1=Math.min(src0.length,Math.floor(l.ae*48000)),o0=Math.floor(l.s*48000),room=Math.floor((l.e-l.s)*48000),cnt=Math.max(0,Math.min(a1-a0,room,tl48-o0));if(cnt>0)ma.set(src0.subarray(a0,a0+cnt),o0)});mix.push(ma)}AM={length:tl48,getChannelData:function(q){return mix[q]}};len=tl48}
          for(var off=0;off<len;off+=BL){var n=Math.min(BL,len-off),arr=new Float32Array(n*ch);for(var q=0;q<ch;q++)arr.set(AM.getChannelData(q).subarray(off,off+n),q*n);
            var ad=new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:n,numberOfChannels:ch,timestamp:Math.round(off/48000*1e6),data:arr});aenc.encode(ad);ad.close();
            if((off/BL)%20===0){if(encErr)throw encErr;await yieldNow()}}}
        var S2=newSt(),t0=performance.now();
        for(var k=0;k<N;k++){
          if(encErr)throw encErr;
          var t=k/FPS,li=lineAt(t),l=c.lines[li],sg=l.seg?seg(l.seg):null,v=vids[li];
          if(v&&v.videoWidth&&sg)await seekVid(v,srcT(l,sg,t));
          compose(ctx,W,H,c,li,t,v,S2,Sx[li]);
          var fr=new VideoFrame(cv,{timestamp:Math.round(k*1e6/FPS),duration:Math.round(1e6/FPS)});venc.encode(fr,{keyFrame:k%60===0});fr.close();
          while(venc.encodeQueueSize>6)await yieldNow();
          if(k%6===0){var el=(performance.now()-t0)/1000;st('Đang dựng khung hình '+k+' / '+N+' ('+Math.round(k/N*100)+'%), đã chạy '+el.toFixed(0)+'s');await yieldNow()}
        }
        await venc.flush();if(aenc)await aenc.flush();muxer.finalize();
        return new Blob([target.buffer],{type:'video/mp4'})};

      /* ---- cách 2: ghi theo thời gian thật, nhịp vẽ chạy bằng bộ đếm riêng ---- */
      var realtime=function(){
        return new Promise(function(resolve){
          if(!mime){S.exporting=false;msg('Trình duyệt này không hỗ trợ ghi video. Hãy dùng Chrome bản mới.');return}
          var cs=cv.captureStream(30),actx=null;
          if(audioEl){try{actx=new (window.AudioContext||window.webkitAudioContext)();var src=actx.createMediaElementSource(audioEl),dest=actx.createMediaStreamDestination();src.connect(dest);dest.stream.getAudioTracks().forEach(function(t){cs.addTrack(t)})}catch(x){}}
          var rec=new MediaRecorder(cs,{mimeType:mime,videoBitsPerSecond:kq>1?8000000:5000000}),chunks=[];
          rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
          var prevLi=-1,aLi=-1,t0=0,timer=null,S2=newSt();
          var finish=function(){timer.stop();vids.forEach(function(v){if(v)try{v.pause()}catch(x){}});if(audioEl)try{audioEl.pause()}catch(x){}
            rec.onstop=function(){var ext=/mp4/.test(mime)?'mp4':'webm';done(new Blob(chunks,{type:mime.split(';')[0]}),ext,actx);resolve()};rec.stop()};
          rec.start(500);t0=performance.now();if(audioEl&&!manualDur(c))audioEl.play().catch(function(){});
          timer=mkTick(function(){
            var t=(performance.now()-t0)/1000;if(t>=total){finish();return}
            var li=lineAt(t),l=c.lines[li],sg=l.seg?seg(l.seg):null,v=vids[li];
            if(li!==prevLi){if(prevLi>=0&&vids[prevLi])try{vids[prevLi].pause()}catch(x){}if(v&&sg){try{v.currentTime=l.segIn||0;v.play().catch(function(){})}catch(x){}}prevLi=li}
            if(audioEl&&manualDur(c)){if(li!==aLi){aLi=li;try{audioEl.currentTime=l.as}catch(x){}audioEl.play().catch(function(){})}else if(!audioEl.paused&&audioEl.currentTime>=l.ae-0.02)audioEl.pause()}
            rtAdj(v,l,sg);
            compose(ctx,W,H,c,li,t,v,S2,Sx[li]);
            st('Đang xuất theo thời gian thật... '+Math.floor(t)+' / '+Math.ceil(total)+'s (giữ tab này ở phía trước)')},33)})};

      if(canOffline()){
        return offline().then(function(blob){done(blob,'mp4',null)}).catch(function(e){
          st('Không dựng nhanh được ('+(e&&e.message?e.message:e)+'). Chuyển sang ghi theo thời gian thật...');
          vids.forEach(function(v){if(v)try{v.pause()}catch(x){}});return realtime()})}
      return realtime();
    });
  }).catch(function(e){S.exporting=false;msg('Xuất lỗi: '+e)});
}
/* ---------- ảnh bìa ---------- */
function covInit(c){if(!c.cov){var l0=c.lines[0];c.cov={li:0,tm:Math.round((((l0&&l0.segIn)||0)+0.5)*10)/10,text:c.prod||c.name||'',px:0.5,py:0.78,sz:90,fg:'#ffffff',bg:'#d62828',nobg:false}}return c.cov}
function covStyle(cv,k){return boxCss(cv.sz*k,cv.fg,cv.nobg?'transparent':cv.bg,{px:cv.px,py:cv.py},cv.nobg?'text-shadow:0 2px 6px rgba(0,0,0,.85);':'')}
function coverBox(c){var cv=covInit(c);
  var opts=c.lines.map(function(l,i){var sg=l.seg?seg(l.seg):null;return '<option value="'+i+'" '+(cv.li===i?'selected':'')+'>Dòng '+(i+1)+' · '+(sg?esc(sg.label):'chưa có cảnh')+'</option>'}).join('');
  var cl=c.lines[cv.li],lsg=cl&&cl.seg?seg(cl.seg):null,d=lsg?sdur(lsg):10;
  return '<div class="box" style="margin-top:12px"><h2>Ảnh bìa (thumbnail)</h2><div class="meta" style="margin-bottom:8px">Chọn khung hình từ clip, gõ tên sản phẩm, kéo chữ tới chỗ muốn. Xuất ra ảnh PNG dọc 1080×1920 để dùng làm ảnh bìa khi đăng TikTok.</div><div class="row2"><div><div class="covw" id="covw"><canvas id="covc" width="270" height="480"></canvas><div class="info drag" data-cov="1" id="covt" style="'+covStyle(cv,270/720)+'">'+esc(cv.text)+'</div></div></div><div>'+
   '<label class="lab" for="covli">Lấy khung hình từ cảnh</label><select id="covli">'+opts+'</select>'+
   '<label class="lab" for="covtm">Thời điểm trong video: <span id="covtl">'+cv.tm.toFixed(1)+'</span>s</label><input type="range" id="covtm" min="0" max="'+d+'" step="0.1" value="'+cv.tm+'">'+
   '<label class="lab" for="covtx">Chữ trên ảnh bìa</label><textarea id="covtx" rows="2">'+esc(cv.text)+'</textarea>'+
   '<div class="row2"><div><label class="lab" for="covsz">Cỡ chữ</label><input type="number" id="covsz" min="20" max="200" value="'+cv.sz+'"></div><div><label class="lab" for="covfg">Màu chữ</label><input type="color" id="covfg" value="'+cv.fg+'"></div><div><label class="lab" for="covbg">Màu nền chữ</label><input type="color" id="covbg" value="'+cv.bg+'"></div></div>'+
   '<label class="note" style="display:block"><input type="checkbox" id="covnb" '+(cv.nobg?'checked':'')+'> Không dùng nền cho chữ</label>'+
   '<div class="bar"><button class="btn ok" data-act="covexp">Xuất ảnh bìa (PNG)</button><span class="meta" id="covst"></span></div>'+
   (c.coverOut?'<div style="margin-top:8px"><img src="'+c.coverOut.url+'" style="width:120px;border-radius:8px" alt="Ảnh bìa đã xuất"><div class="bar"><a class="btn pri" href="'+c.coverOut.url+'" download="'+esc(c.coverOut.name)+'">Tải ảnh bìa về</a></div></div>':'')+'</div></div></div>'}
function coverFrame(c,cv,canvas){var l=c.lines[cv.li],sg=l&&l.seg?seg(l.seg):null,ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  var ph=function(){ctx.fillStyle=sg?'hsl('+hue(sg.p)+',55%,32%)':'#333';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='600 '+Math.round(W/14)+'px system-ui';ctx.textAlign='center';ctx.fillText(sg?'(cảnh mẫu, không có video)':'chưa có cảnh',W/2,H/2)};
  if(!sg||!sg.url){ph();return Promise.resolve()}
  var get=(S.cvVid&&S.cvVid.sid===sg.id)?Promise.resolve(S.cvVid.v):loadVid(sg.url).then(function(v){S.cvVid={sid:sg.id,v:v};return v});
  return get.then(function(v){if(!v||!v.videoWidth){ph();return}return seekVid(v,Math.max(0,Math.min(cv.tm,sdur(sg)-0.05))).then(function(){var k=Math.max(W/v.videoWidth,H/v.videoHeight),dw=v.videoWidth*k,dh=v.videoHeight*k;ctx.drawImage(v,(W-dw)/2,(H-dh)/2,dw,dh)})})}
function covDraw(c){clearTimeout(S.cvT);S.cvT=setTimeout(function(){var cn=document.getElementById('covc');if(cn&&c.cov)coverFrame(c,c.cov,cn)},60)}
function exportCover(c){var cv=covInit(c),W=1080,H=1920,cn=newCanvas(W,H),say=function(m){var e=document.getElementById('covst');if(e)e.textContent=m};askDir();say('Đang tạo ảnh...');
  coverFrame(c,cv,cn).then(function(){drawTextBox(cn.getContext('2d'),W,H,cv.text,cv.sz*1.5,cv.fg,cv.nobg?null:cv.bg,cv.px*W,cv.py*H,cv.nobg);
    cn.toBlob(function(b){if(!b){say('Không tạo được ảnh');return}var url=URL.createObjectURL(b),base=fname(c)+'_bia';c.coverOut={url:url,name:base+'.png'};
      saveOut(b,base,'png',function(extra){msg('Đã tạo ảnh bìa cho '+c.id+'.'+extra)})},'image/png')})}
function pickDir(){
  if(!window.showDirectoryPicker){msg('Trình duyệt này không hỗ trợ chọn thư mục. Hãy dùng Chrome bản mới, mở file xuong_clip.html trên máy.');return}
  window.showDirectoryPicker({mode:'readwrite'}).then(function(h){S.dir=h;idbSet('dir',h).catch(function(){});msg('Đã chọn thư mục "'+h.name+'". Clip xuất xong sẽ lưu vào đó.')})
   .catch(function(e){if(e&&e.name!=='AbortError')msg('Không chọn được thư mục ('+(e.message||e)+'). Hãy thử một thư mục riêng, không phải Downloads hay Desktop.')})
}
function fname(c){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return (c.id+'_'+c.g.replace(/\s+/g,'')+'_'+p(d.getDate())+'-'+p(d.getMonth()+1)).replace(/[\\\/:*?"<>|]/g,'')}
function uniq(dir,base,ext,i){var n=i>1?base+'-'+i+'.'+ext:base+'.'+ext;return dir.getFileHandle(n).then(function(){return uniq(dir,base,ext,i+1)},function(){return n})}
function saveOut(blob,base,ext,done){
  if(!S.dir){done('');return}
  Promise.resolve(S.dirPerm).then(function(pm){if(pm!=='granted')throw new Error('chưa cấp quyền thư mục');return uniq(S.dir,base,ext,1)})
   .then(function(n){return S.dir.getFileHandle(n,{create:true}).then(function(fh){return fh.createWritable()}).then(function(w){return w.write(blob).then(function(){return w.close()})}).then(function(){done(' Đã lưu vào thư mục "'+S.dir.name+'" với tên '+n+'.')})})
   .catch(function(e){done(' Chưa lưu được vào thư mục ('+(e&&e.message?e.message:e)+'), hãy dùng nút Tải video về.')})
}
