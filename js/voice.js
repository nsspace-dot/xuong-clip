/* Giọng đọc Gemini (TTS) và căn giọng theo dòng. */
function gemBlock(c){
  var note=(c.audioMissing?'<div class="w warn">Không thấy file giọng '+esc(c.audio.file)+' trong .xuongclip. Cần tạo lại giọng (tool không tự gọi API).</div>':'')+
   (c.voiceStale&&!c.audioMissing?'<div class="w warn">Lời thoại đã đổi sau khi tạo giọng. Cần tạo lại giọng cho khớp.</div>':'')+
   (c.audio&&c.audioUrl?'<div class="meta">Giọng đã lưu: .xuongclip/'+esc(c.audio.file)+(c.audio.voice?' · giọng '+esc(c.audio.voice):'')+(c.audio.model?' · '+esc(c.audio.model):'')+(c.audio.src==='tải lên'?' · file tải lên':'')+'</div>':'');
  return note+voicePick(c)+'<div class="bar" style="margin:0 0 8px"><button class="btn pri" data-act="gem" '+(S.genv?'disabled':'')+'>'+(S.genv?'Đang tạo giọng...':(c.audioUrl?'Tạo lại giọng cả clip':'Tạo giọng bằng Gemini'))+'</button><span class="meta" id="gemst">'+(GEM.key?'Giọng '+esc(voiceLabel(voiceFor(c)))+' · '+esc(GEM.model):'Chưa nhập API key, vào tab Cài đặt.')+'</span></div>'+
   (c.audioUrl?'<audio controls src="'+c.audioUrl+'" style="width:100%;max-width:360px"></audio><div class="bar" style="margin:6px 0"><button class="btn sm" data-act="align">Căn lại cảnh theo giọng</button><span class="meta">'+(c.bounds?(c.bManual?'Đã chỉnh ranh giới bằng tay.':'Đã căn theo chỗ nghỉ của giọng ('+c.alignInfo+' mốc tìm thấy, còn lại ước lượng).'):'Đang chia theo số chữ.')+'</span></div>':'');
}
function gemSettings(){
  return '<div class="set"><b>Giọng đọc Gemini (Google AI Studio)</b><div class="meta">Key chỉ lưu trong trình duyệt của máy này. Chỉ dùng bản file xuong_clip.html mở trên máy bạn, đừng dán key vào trang chia sẻ cho người khác.</div>'+
   '<div><label class="lab" for="gk">API key</label><input type="password" id="gk" data-gem="key" value="'+esc(GEM.key)+'" autocomplete="off"></div>'+
   '<div><label class="lab" for="gm">Model</label><select id="gm" data-gem="model">'+['gemini-3.8-flash-tts','gemini-3.8-flash-lite-tts'].map(function(m){return '<option '+(GEM.model===m?'selected':'')+'>'+m+'</option>'}).join('')+'</select></div>'+
   '<div><label class="lab" for="gvm">Model AI đọc video (để gắn tag)</label><input type="text" id="gvm" data-gem="vmodel" list="vml" value="'+esc(GEM.vmodel)+'"><datalist id="vml"><option value="gemini-3.8-flash"><option value="gemini-3.8-flash-lite"><option value="gemini-2.5-flash"></datalist><div class="meta">Tên model phải có trong tài khoản Google AI Studio của bạn. Nếu báo lỗi "model not found", mở AI Studio xem danh sách model và dán tên vào đây.</div></div>'+
   '<div class="meta">Giọng, phong cách đọc và tốc độ: chọn ở mục "Giọng mặc định theo người và gian" bên dưới hoặc ở màn Ghép clip.</div>'+
   '<div><label class="lab" for="gr">Thay chữ khi đọc (mỗi dòng: chữ gốc=chữ đọc), giúp đọc đúng số và ký hiệu</label><textarea id="gr" data-gem="rep">'+esc(GEM.rep)+'</textarea></div></div>';
}
function alignToSpeech(c,done){
  if(!c.audioFile||!c.audioDur){if(done)done(false);return}
  c.audioFile.arrayBuffer().then(function(ab){
    var AC=window.AudioContext||window.webkitAudioContext,ax=new AC();
    return ax.decodeAudioData(ab).then(function(buf){try{ax.close()}catch(e){}return buf})
  }).then(function(buf){
    var ch=buf.getChannelData(0),sr=buf.sampleRate,win=Math.floor(sr*0.02),n=Math.floor(ch.length/win),rms=[],i,j;
    for(i=0;i<n;i++){var a=0;for(j=0;j<win;j++){var v=ch[i*win+j];a+=v*v}rms.push(Math.sqrt(a/win))}
    var sorted=rms.slice().sort(function(x,y){return x-y}),p90=sorted[Math.floor(n*0.9)]||0.01,thr=Math.max(p90*0.1,0.0005);
    var gaps=[],run=0,st0=0;
    for(i=0;i<=n;i++){var sil=i<n&&rms[i]<thr;if(sil){if(!run)st0=i;run++}else{if(run>=8&&st0>5&&i<n-5)gaps.push({mid:(st0+i)/2*0.02,len:run*0.02});run=0}}
    var f0=0,f1=n-1;while(f0<n&&rms[f0]<thr)f0++;while(f1>0&&rms[f1]<thr)f1--;var sp0=Math.max(0,f0*0.02-0.08),sp1=Math.min(c.audioDur,(f1+1)*0.02+0.15);if(sp1-sp0<1){sp0=0;sp1=c.audioDur}
    var N=c.lines.length,adur=c.audioDur,est=c.lines.map(dur),sum=est.reduce(function(x,y){return x+y},0),cum=0,b=[sp0],prev=sp0,used=0;
    for(i=0;i<N-1;i++){cum+=est[i];var exp=sp0+(sp1-sp0)*cum/sum,best=null,bs=1e9;
      gaps.forEach(function(g){if(g.mid>prev+0.4&&Math.abs(g.mid-exp)<Math.max(2,adur*0.25)){var sc=Math.abs(g.mid-exp)-3*g.len;if(sc<bs){bs=sc;best=g}}});
      var m;if(best){m=best.mid;used++}else m=Math.max(prev+0.5,exp);b.push(m);prev=m}
    b.push(sp1);c.bounds=b;c.bManual=false;c.alignInfo=used+'/'+(N-1);
    if(done)done(true)
  }).catch(function(){if(done)done(false)})
}
function b64ToBytes(b){var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
function pcmToWav(pcm,rate){var h=new ArrayBuffer(44),v=new DataView(h);function w(o,t){for(var i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))}
  w(0,'RIFF');v.setUint32(4,36+pcm.length,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,pcm.length,true);
  return new Blob([h,pcm],{type:'audio/wav'})}
function findAudio(o){var r=null;(function walk(x){if(!x||typeof x!=='object')return;
  if(x.type==='audio'&&typeof x.data==='string')r={data:x.data,mime:x.mime_type||''};
  else if(x.inlineData&&typeof x.inlineData.data==='string')r={data:x.inlineData.data,mime:x.inlineData.mimeType||''};
  Object.keys(x).forEach(function(k){walk(x[k])})})(o);return r}
/* tryVoice, makeVoice, voiceFor: ở js/voicemenu.js (Bước 8). */
