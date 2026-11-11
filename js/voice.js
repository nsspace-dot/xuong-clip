/* Giọng đọc Gemini (TTS) và căn giọng theo dòng. */
function voiceFor(c){return (GEM.byGian&&GEM.byGian[c.g])||GEM.voice}
function gemBlock(c){
  return '<div class="bar" style="margin:0 0 8px"><button class="btn pri" data-act="gem" '+(S.genv?'disabled':'')+'>'+(S.genv?'Đang tạo giọng...':'Tạo giọng bằng Gemini')+'</button><span class="meta" id="gemst">'+(GEM.key?'Giọng '+esc(voiceFor(c))+' · '+esc(GEM.model):'Chưa nhập API key, vào tab Cài đặt.')+'</span></div>'+
   (c.audioUrl?'<audio controls src="'+c.audioUrl+'" style="width:100%;max-width:360px"></audio><div class="bar" style="margin:6px 0"><button class="btn sm" data-act="align">Căn lại cảnh theo giọng</button><span class="meta">'+(c.bounds?(c.bManual?'Đã chỉnh ranh giới bằng tay.':'Đã căn theo chỗ nghỉ của giọng ('+c.alignInfo+' mốc tìm thấy, còn lại ước lượng).'):'Đang chia theo số chữ.')+'</span></div>':'');
}
function gemSettings(){
  return '<div class="set"><b>Giọng đọc Gemini (Google AI Studio)</b><div class="meta">Key chỉ lưu trong trình duyệt của máy này. Chỉ dùng bản file xuong_clip.html mở trên máy bạn, đừng dán key vào trang chia sẻ cho người khác.</div>'+
   '<div><label class="lab" for="gk">API key</label><input type="password" id="gk" data-gem="key" value="'+esc(GEM.key)+'" autocomplete="off"></div>'+
   '<div><label class="lab" for="gm">Model</label><select id="gm" data-gem="model">'+['gemini-3.8-flash-tts','gemini-3.8-flash-lite-tts'].map(function(m){return '<option '+(GEM.model===m?'selected':'')+'>'+m+'</option>'}).join('')+'</select></div>'+
   '<div><label class="lab" for="gvm">Model AI đọc video (để gắn tag)</label><input type="text" id="gvm" data-gem="vmodel" list="vml" value="'+esc(GEM.vmodel)+'"><datalist id="vml"><option value="gemini-3.8-flash"><option value="gemini-3.8-flash-lite"><option value="gemini-2.5-flash"></datalist><div class="meta">Tên model phải có trong tài khoản Google AI Studio của bạn. Nếu báo lỗi "model not found", mở AI Studio xem danh sách model và dán tên vào đây.</div></div>'+
   '<div><label class="lab" for="gv">Giọng</label><select id="gv" data-gem="voice">'+VOICES.map(function(m){return '<option '+(GEM.voice===m?'selected':'')+'>'+m+'</option>'}).join('')+'</select></div>'+
   '<div><button class="btn sm" data-act="trygem" data-v="'+esc(GEM.voice)+'">Nghe thử giọng mặc định</button> <span class="meta" id="trygst"></span></div>'+
   '<div><label class="lab">Giọng riêng cho từng gian (bỏ trống = dùng giọng mặc định)</label><div class="row2">'+GIANS.map(function(g,i){var cur=(GEM.byGian&&GEM.byGian[g])||'';return '<div><label class="lab" for="gg'+i+'">'+g+'</label><select id="gg'+i+'" data-gemg="'+g+'"><option value="">Mặc định</option>'+VOICES.map(function(m){return '<option '+(cur===m?'selected':'')+'>'+m+'</option>'}).join('')+'</select>'+(cur?'<button class="btn sm" data-act="trygem" data-v="'+cur+'" style="margin-top:4px">Nghe thử</button>':'')+'</div>'}).join('')+'</div></div>'+
   '<div><label class="lab" for="gs">Cách đọc (viết bằng tiếng Anh thì ổn định hơn)</label><textarea id="gs" data-gem="style">'+esc(GEM.style)+'</textarea></div>'+
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
function tryVoice(voice){
  var st=function(m){var e=document.getElementById('trygst');if(e)e.textContent=m};
  if(!GEM.key){st('Chưa có API key, dán key ở ô phía trên.');return}
  st('Đang tạo giọng '+voice+'...');
  var body={model:GEM.model,input:[{type:'user_input',content:[{type:'text',text:'Chào bạn, mình đang giới thiệu bloc lịch đại khổ 14,5 nhân 20,5 cho bạn xem.',annotations:[{type:'speech_metadata',style:GEM.style}]}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:voice}]}};
  fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEM.key},body:JSON.stringify(body)})
   .then(function(r){return r.text().then(function(t){if(!r.ok)throw new Error('HTTP '+r.status+': '+t.slice(0,200));return JSON.parse(t)})})
   .then(function(j){var a=findAudio(j);if(!a)throw new Error('không thấy âm thanh trong phản hồi');var u8=b64ToBytes(a.data),blob;
     if(String.fromCharCode(u8[0],u8[1],u8[2],u8[3])==='RIFF')blob=new Blob([u8],{type:'audio/wav'});else{var m=/rate=(\d+)/.exec(a.mime||'');blob=pcmToWav(u8,m?+m[1]:24000)}
     st('Đang phát giọng '+voice+'.');var au=new Audio(URL.createObjectURL(blob));au.play().catch(function(){st('Trình duyệt chặn tự phát, hãy bấm lại.')})})
   .catch(function(e){st('Lỗi: '+(e&&e.message?e.message:e))})
}
function b64ToBytes(b){var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
function pcmToWav(pcm,rate){var h=new ArrayBuffer(44),v=new DataView(h);function w(o,t){for(var i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))}
  w(0,'RIFF');v.setUint32(4,36+pcm.length,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,pcm.length,true);
  return new Blob([h,pcm],{type:'audio/wav'})}
function findAudio(o){var r=null;(function walk(x){if(!x||typeof x!=='object')return;
  if(x.type==='audio'&&typeof x.data==='string')r={data:x.data,mime:x.mime_type||''};
  else if(x.inlineData&&typeof x.inlineData.data==='string')r={data:x.inlineData.data,mime:x.inlineData.mimeType||''};
  Object.keys(x).forEach(function(k){walk(x[k])})})(o);return r}
function makeVoice(c){
  var st=function(m){var e=document.getElementById('gemst');if(e)e.textContent=m};
  if(!GEM.key){msg('Chưa có API key. Vào tab Cài đặt, mục Giọng đọc Gemini, dán key vào rồi quay lại.');return}
  var text=c.lines.map(function(l){return l.t}).join(' ');
  GEM.rep.split('\n').forEach(function(ln){var i=ln.indexOf('=');if(i>0){var a=ln.slice(0,i).trim(),b=ln.slice(i+1).trim();if(a)text=text.split(a).join(b)}});
  var body={model:GEM.model,input:[{type:'user_input',content:[{type:'text',text:text,annotations:[{type:'speech_metadata',style:GEM.style}]}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:voiceFor(c)}]}};
  S.genv=true;st('Đang tạo giọng, chờ vài chục giây...');var b=document.querySelector('[data-act=gem]');if(b){b.disabled=true;b.textContent='Đang tạo giọng...'}
  fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEM.key},body:JSON.stringify(body)})
   .then(function(r){return r.text().then(function(t){if(!r.ok)throw new Error('HTTP '+r.status+': '+t.slice(0,300));try{return JSON.parse(t)}catch(e){throw new Error('Phản hồi không đọc được: '+t.slice(0,200))}})})
   .then(function(j){var a=findAudio(j);if(!a)throw new Error('Không thấy dữ liệu âm thanh trong phản hồi: '+JSON.stringify(j).slice(0,300));
     var u8=b64ToBytes(a.data),blob;
     if(String.fromCharCode(u8[0],u8[1],u8[2],u8[3])==='RIFF')blob=new Blob([u8],{type:'audio/wav'});
     else{var m=/rate=(\d+)/.exec(a.mime||'');blob=pcmToWav(u8,m?+m[1]:24000)}
     c.audioFile=new File([blob],'giong-'+c.id+'.wav',{type:'audio/wav'});c.audioUrl=URL.createObjectURL(blob);c.audioDur=null;S.genv=false;var ta=new Audio(c.audioUrl);ta.onloadedmetadata=function(){c.audioDur=ta.duration;S.t=0;c.bounds=null;alignToSpeech(c,function(){render()})};msg('Đã tạo giọng cho '+c.id+'. Nghe thử bên dưới rồi bấm Xuất video thật.')})
   .catch(function(e){S.genv=false;msg('Tạo giọng lỗi: '+(e&&e.message?e.message:e)+(/Failed to fetch|NetworkError/i.test(String(e))?' (bản trên claude.ai không gọi được dịch vụ ngoài, hãy dùng file xuong_clip.html mở trên máy)':''))});
}
