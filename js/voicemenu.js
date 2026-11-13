/* Menu giọng đọc (Bước 8).
   - Danh sách giọng Gemini TTS có sẵn (VOICES), mô tả ngắn lấy từ tài liệu Gemini nếu có (API không trả mô tả).
   - Thiết lập giọng = {voice, style (phong cách đọc, chữ tự do), speed (chậm / vừa / nhanh, ghi thêm vào phong cách)}.
   - Thứ tự áp dụng: riêng của dòng → riêng của clip → mặc định của người làm → mặc định của gian → mặc định chung (Cài đặt).
   - Mặc định theo người và gian, giọng tự tạo lưu trong state.json (voiceDefaults, customVoices). API key chỉ ở localStorage.
   - Không bao giờ gọi API khi mở menu; chỉ gọi khi bấm Nghe thử / Tạo giọng / Tạo lại.
   - Giọng đã có không tự tạo lại. Đổi giọng thì hỏi một lần, nói rõ dòng nào cần tạo lại; chỉ tạo lại đúng các dòng đó. */
var VDESC={}; // mô tả ngắn theo tài liệu; để trống nếu chưa xác minh được
var SPEEDS={'':'Không ghi tốc độ',cham:'Chậm',vua:'Vừa',nhanh:'Nhanh'},SPEEDTXT={cham:'Read slowly.',vua:'Read at a moderate pace.',nhanh:'Read briskly.'};
var VSAMPLE0='Chào bạn, hôm nay mình giới thiệu mẫu lịch mới, bạn xem thử nhé.';
var VPRESET0=['Kể chuyện nhẹ nhàng, tốc độ vừa','Vui tươi, năng động như đang livestream bán hàng','Ấm áp, thân thiện như trả lời bình luận của khách','Rõ ràng, chậm rãi, nhấn vào thông số sản phẩm'];
if(typeof GEM.sample!=='string'||!GEM.sample.trim())GEM.sample=VSAMPLE0;if(!Array.isArray(GEM.presets))GEM.presets=VPRESET0.slice();
var VDEF={person:{},gian:{}},CVOICES=[];
function vcClean(o){o=o||{};var r={};if(o.voice&&typeof o.voice==='string')r.voice=o.voice.slice(0,80);if(typeof o.style==='string'&&o.style.trim())r.style=o.style.slice(0,600);if(SPEEDTXT[o.speed])r.speed=o.speed;return r}
function vcEmpty(o){return !o||(!o.voice&&!o.style&&!o.speed)}
function vdToState(){var o={person:{},gian:{}};['person','gian'].forEach(function(k){for(var n in VDEF[k])if(!vcEmpty(VDEF[k][n]))o[k][n]=vcClean(VDEF[k][n])});return o}
function vdFromState(st){VDEF={person:{},gian:{}};CVOICES=[];var v=st&&st.voiceDefaults;
  if(v&&typeof v==='object')['person','gian'].forEach(function(k){var m=v[k];if(m&&typeof m==='object')for(var n in m){var x=vcClean(m[n]);if(!vcEmpty(x))VDEF[k][n]=x}});
  else if(GEM.byGian)for(var g in GEM.byGian)if(GEM.byGian[g])VDEF.gian[g]={voice:GEM.byGian[g]}; // chuyển giọng theo gian cũ (localStorage) vào state
  (Array.isArray(st&&st.customVoices)?st.customVoices:[]).forEach(function(x){if(x&&x.id)CVOICES.push({id:String(x.id),name:String(x.name||x.id),desc:String(x.desc||''),at:String(x.at||'')})})}
function cvToState(){return CVOICES.map(function(x){return {id:x.id,name:x.name,desc:x.desc,at:x.at}})}
function voiceLabel(id){var cv=CVOICES.filter(function(x){return x.id===id})[0];return cv?cv.name+' (tự tạo)':id}
/* Thiết lập giọng thực dùng cho clip c (hoặc dòng li), kèm nguồn để hiển thị. */
function vcFor(c,li){var g={voice:GEM.voice,style:GEM.style,speed:''},src='mặc định chung',m=function(o,s){if(vcEmpty(o))return;if(o.voice)g.voice=o.voice;if(o.style)g.style=o.style;if(o.speed)g.speed=o.speed;src=s};
  if(c){m(VDEF.gian[c.g],'gian '+c.g);var p=person(c.who);if(p)m(VDEF.person[p.name],'người '+p.name);else if(c.who)m(VDEF.person[c.who],'người '+c.who);m(c.vc,'riêng của clip');
    if(li!=null&&c.lines[li])m(c.lines[li].vc,'riêng của dòng '+(li+1))}
  g.src=src;return g}
function vcKey(v){return [v.voice,v.style||'',v.speed||''].join('|')}
function vcStyleText(v){return [v.style||'',v.speed?SPEEDTXT[v.speed]:''].filter(Boolean).join(' ')}
function voiceFor(c){return vcFor(c).voice}
/* Dòng nào có giọng không còn khớp thiết lập hiện tại (cần tạo lại). */
function vcStaleLines(c){if(!c||!c.audio||!c.audioUrl||c.audio.src==='tải lên')return [];var lv=c.audio.lv,r=[];
  c.lines.forEach(function(l,i){var k=vcKey(vcFor(c,i));if(lv&&lv.length===c.lines.length){if(lv[i]!==k)r.push(i)}else if(c.audio.voice&&c.audio.voice!==vcFor(c,i).voice)r.push(i)});return r}
function linesText(ix){if(!ix.length)return '';var r=[],a=ix[0],b=a;for(var i=1;i<=ix.length;i++){if(ix[i]===b+1){b=ix[i];continue}r.push(a===b?String(a+1):(a+1)+'–'+(b+1));a=b=ix[i]}return 'dòng '+r.join(', ')}

/* ---------- gọi API ---------- */
function applyRep(text){GEM.rep.split('\n').forEach(function(ln){var i=ln.indexOf('=');if(i>0){var a=ln.slice(0,i).trim(),b=ln.slice(i+1).trim();if(a)text=text.split(a).join(b)}});return text}
function ttsBody(text,v){return {model:GEM.model,input:[{type:'user_input',content:[{type:'text',text:text,annotations:[{type:'speech_metadata',style:vcStyleText(v)}]}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:v.voice}]}}}
/* Lỗi dễ hiểu, không bao giờ chứa key. */
function apiErr(status,t){var s=String(t||''),m='';try{var j=JSON.parse(s);var e=Array.isArray(j)?j[0].error:j.error;if(e)m=(e.status||'')+' '+(e.message||'')}catch(x){m=s.slice(0,200)}
  if(status===429||/RESOURCE_EXHAUSTED|quota/i.test(m))return 'Hết hạn mức (quota) của API key. Chờ một lúc rồi thử lại, hoặc xem hạn mức trong Google AI Studio. ('+m.trim().slice(0,160)+')';
  if(status===401||status===403||/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(m))return 'API key không hợp lệ hoặc không có quyền dùng model này. ('+m.trim().slice(0,160)+')';
  if(status===404)return 'Không tìm thấy model hoặc giọng (HTTP 404). Kiểm tra tên model ở Cài đặt. ('+m.trim().slice(0,160)+')';
  return 'Lỗi HTTP '+status+': '+m.trim().slice(0,200)}
function ttsCall(text,v){if(!GEM.key)return Promise.reject(new Error('Chưa có API key. Vào Cài đặt › Giọng đọc Gemini để dán key.'));
  var ctl=window.AbortController?new AbortController():null,to=setTimeout(function(){if(ctl)ctl.abort()},90000);
  return fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEM.key},body:JSON.stringify(ttsBody(text,v)),signal:ctl?ctl.signal:undefined})
   .then(function(r){return r.text().then(function(t){if(!r.ok)throw new Error(apiErr(r.status,t));try{return JSON.parse(t)}catch(e){throw new Error('Phản hồi không đọc được')}})},
     function(e){throw new Error(e&&e.name==='AbortError'?'Quá 90 giây không có phản hồi từ Gemini.':'Không kết nối được tới Gemini ('+(e&&e.message?e.message:e)+').')})
   .then(function(j){clearTimeout(to);var a=findAudio(j);if(!a)throw new Error('Không thấy âm thanh trong phản hồi');var u8=b64ToBytes(a.data);
     if(String.fromCharCode(u8[0],u8[1],u8[2],u8[3])==='RIFF')return new Blob([u8],{type:'audio/wav'});var m=/rate=(\d+)/.exec(a.mime||'');return pcmToWav(u8,m?+m[1]:24000)},function(e){clearTimeout(to);throw e})}

/* ---------- nghe thử ---------- */
var VPREV={}; // bộ nhớ tạm trong phiên: cùng giọng + phong cách + câu thì không gọi lại API
function previewVoice(v,el){var st=function(m,cls){if(el){el.textContent=m;el.className='vst'+(cls?' '+cls:'')}};
  var text=applyRep(String(GEM.sample||VSAMPLE0)),key=vcKey(v)+'|'+text;
  if(VPREV[key]){st('Đang phát (đã có sẵn, không gọi lại API).','ok');playBlob(VPREV[key],st);return Promise.resolve(true)}
  var t0=Date.now(),tm=setInterval(function(){st('Đang gọi Gemini… '+Math.round((Date.now()-t0)/1000)+' giây','run')},500);st('Đang gọi Gemini…','run');S.vmBusy=(S.vmBusy||0)+1;
  return ttsCall(text,v).then(function(b){clearInterval(tm);S.vmBusy--;VPREV[key]=b;st('Đang phát giọng '+voiceLabel(v.voice)+'.','ok');playBlob(b,st);return true},
    function(e){clearInterval(tm);S.vmBusy--;st(/^Lỗi/.test(e.message)?e.message:'Lỗi: '+e.message,'err');return false})}
function playBlob(b,st){try{if(S.vmAud)S.vmAud.pause()}catch(e){}var a=new Audio(URL.createObjectURL(b));S.vmAud=a;var p=a.play();if(p&&p.catch)p.catch(function(){st('Trình duyệt chặn tự phát, bấm Nghe thử lần nữa.','warn')})}
function tryVoice(voice){var e=document.getElementById('trygst');previewVoice({voice:voice,style:GEM.style},e)}

/* ---------- tạo giọng cho clip: cả clip hoặc chỉ một số dòng ---------- */
function decode24(blob){var oc=new OfflineAudioContext(1,1,24000);return blob.arrayBuffer().then(function(ab){return oc.decodeAudioData(ab)}).then(function(b){return b.getChannelData(0).slice()})}
function f32ToWav(f){var n=f.length,pcm=new Uint8Array(n*2),dv=new DataView(pcm.buffer);for(var i=0;i<n;i++){var s=Math.max(-1,Math.min(1,f[i]));dv.setInt16(i*2,s<0?s*32768:s*32767,true)}return pcmToWav(pcm,24000)}
/* Nhóm các dòng liền nhau dùng cùng thiết lập giọng: mỗi nhóm một lần gọi API. */
function vcGroups(c,ix){var g=[];ix.forEach(function(i){var k=vcKey(vcFor(c,i)),last=g[g.length-1];if(last&&last.k===k&&last.ix[last.ix.length-1]===i-1)last.ix.push(i);else g.push({k:k,v:vcFor(c,i),ix:[i]})});return g}
function makeVoice(c,opt){opt=opt||{};var stEl=function(m){var e=document.getElementById('gemst');if(e)e.textContent=m};
  if(!GEM.key){msg('Chưa có API key. Vào tab Cài đặt, mục Giọng đọc Gemini, dán key vào rồi quay lại.');return Promise.resolve(false)}
  if(S.genv)return Promise.resolve(false);
  var all=c.lines.map(function(l,i){return i}),ix=opt.lines&&opt.lines.length?opt.lines.slice().sort(function(a,b){return a-b}):all;
  var partial=ix.length<all.length&&c.audioFile&&c.audioDur&&c.audio&&c.audio.src!=='tải lên';if(!partial)ix=all;
  var groups=vcGroups(c,ix);S.genv=true;var b0=document.querySelector('[data-act=gem]');if(b0){b0.disabled=true;b0.textContent='Đang tạo giọng...'}
  var n=0,run=function(gr){n++;stEl('Đang tạo giọng '+(partial?linesText(gr.ix)+' ':'')+'('+n+'/'+groups.length+' lần gọi), chờ vài chục giây...');
    return ttsCall(applyRep(gr.ix.map(function(i){return c.lines[i].t}).join(' ')),gr.v)};
  var seq=Promise.resolve(),outs=[];groups.forEach(function(gr){seq=seq.then(function(){return run(gr)}).then(function(b){outs.push(b)})});
  return seq.then(function(){
    var keys=c.lines.map(function(l,i){return vcKey(vcFor(c,i))}),vs=groups.map(function(g){return g.v.voice}).filter(function(v,i,a){return a.indexOf(v)===i});
    var meta={model:GEM.model,voice:vs.join(', '),src:'gemini'};
    if(!partial&&groups.length===1)return {blob:outs[0],meta:meta,keys:keys,bounds:null};
    return Promise.all(outs.map(decode24)).then(function(segs){var gap=new Float32Array(Math.round(0.25*24000)),parts=[],bounds=null;
      if(partial){return decode24(c.audioFile).then(function(old){var ob=abounds(c).map(function(x){return Math.round(x*24000)}),nb=[0],gi=0,i=0;
        while(i<c.lines.length){var gr=groups.filter(function(g){return g.ix[0]===i})[0];
          if(gr){var s=segs[groups.indexOf(gr)],tot=0,w=gr.ix.map(function(k){var d=dur(c.lines[k]);tot+=d;return d});parts.push(s);var acc=nb[nb.length-1];
            w.forEach(function(d){acc+=s.length*d/tot;nb.push(acc)});i=gr.ix[gr.ix.length-1]+1}
          else{var seg=old.subarray(Math.max(0,ob[i]),Math.min(old.length,ob[i+1]));if(i===0&&ob[0]>0)parts.push(old.subarray(0,ob[0]));parts.push(seg);nb.push(nb[nb.length-1]+seg.length);i++}}
        var lead=ob[0]>0&&!groups.some(function(g){return g.ix[0]===0})?ob[0]:0;bounds=nb.map(function(x){return (x+lead)/24000});
        return {blob:f32ToWav(cat(parts)),meta:meta,keys:keys,bounds:bounds}})}
      segs.forEach(function(s,k){if(k)parts.push(gap);parts.push(s)});return {blob:f32ToWav(cat(parts)),meta:meta,keys:keys,bounds:null}})})
  .then(function(r){setClipAudio(c,new File([r.blob],'giong-'+c.id+'.wav',{type:'audio/wav'}),r.meta);c.audio.lv=r.keys;c.audio.style=vcStyleText(vcFor(c)).slice(0,300);c.audioDur=null;S.genv=false;
      var ta=new Audio(c.audioUrl);return new Promise(function(res){ta.onloadedmetadata=function(){c.audioDur=ta.duration;S.t=0;
        if(r.bounds){c.bounds=r.bounds;c.bManual=false;touchClips();render();res(true)}else{c.bounds=null;alignToSpeech(c,function(){touchClips();render();res(true)})}};ta.onerror=function(){render();res(true)}})
      .then(function(){msg(partial?'Đã tạo lại giọng cho '+c.id+', '+linesText(ix)+'. Các dòng khác giữ nguyên.':'Đã tạo giọng cho '+c.id+'. Nghe thử bên dưới rồi bấm Xuất video thật.');return true})})
  .catch(function(e){S.genv=false;msg('Tạo giọng lỗi: '+(e&&e.message?e.message:e));render();return false})}
function cat(parts){var n=0;parts.forEach(function(p){n+=p.length});var o=new Float32Array(n),k=0;parts.forEach(function(p){o.set(p,k);k+=p.length});return o}

/* ---------- menu chọn giọng ---------- */
function vmTarget(s){if(!s)return null;var c=s.cid?clip(s.cid):null;
  if(s.scope==='clip')return {title:'clip '+s.cid,cur:c&&c.vc,eff:vcFor(c)};
  if(s.scope==='line')return {title:'dòng '+(s.li+1)+' của clip '+s.cid,cur:c&&c.lines[s.li]&&c.lines[s.li].vc,eff:vcFor(c,s.li)};
  if(s.scope==='person')return {title:'người '+s.name,cur:VDEF.person[s.name],eff:null};
  if(s.scope==='gian')return {title:'gian '+s.name,cur:VDEF.gian[s.name],eff:null};
  return {title:'mặc định chung',cur:{voice:GEM.voice,style:GEM.style},eff:null}}
function vmOpen(scope,a,b){var s={scope:scope};if(scope==='clip')s.cid=a;else if(scope==='line'){s.cid=a;s.li=+b}else if(scope!=='global')s.name=a;
  var t=vmTarget(s),base=t.eff||{voice:GEM.voice,style:GEM.style,speed:''},cur=t.cur||{};s.sel={voice:cur.voice||base.voice,style:cur.style!=null?cur.style:(base.style||''),speed:cur.speed||base.speed||''};
  S.vm=s;vmRender()} // chỉ dựng giao diện, không gọi API
function vmClose(){S.vm=null;var e=document.getElementById('vmenu');if(e)e.remove();try{if(S.vmAud)S.vmAud.pause()}catch(x){}}
function vmRender(){var s=S.vm,e=document.getElementById('vmenu');if(!s){if(e)e.remove();return}var t=vmTarget(s);
  if(!e){e=document.createElement('div');e.id='vmenu';e.className='vmwrap';document.body.appendChild(e)}
  var row=function(id,name,desc,custom){return '<div class="vrow'+(s.sel.voice===id?' on':'')+'"><label class="vname"><input type="radio" name="vmv" value="'+esc(id)+'"'+(s.sel.voice===id?' checked':'')+'> <b>'+esc(name)+'</b></label><span class="vdesc">'+esc(desc||'')+'</span>'+
    '<button class="btn sm" data-vtry="'+esc(id)+'">Nghe thử</button>'+(custom?'<button class="btn xs" data-vcdel="'+esc(id)+'" title="Xóa giọng tự tạo khỏi danh sách">Xóa</button>':'')+'<span class="vst" data-vstat="'+esc(id)+'"></span></div>'};
  var inh=s.scope==='clip'||s.scope==='line'||s.scope==='person'||s.scope==='gian';
  e.innerHTML='<div class="vmbox" role="dialog" aria-label="Chọn giọng đọc"><div class="vmhd"><b>Chọn giọng đọc cho '+esc(t.title)+'</b><span class="sp"></span><button class="btn sm" data-vm="close" aria-label="Đóng">Đóng</button></div>'+
   (t.eff?'<div class="meta">Đang dùng: <b>'+esc(voiceLabel(t.eff.voice))+'</b> · theo '+esc(t.eff.src)+'</div>':'')+
   '<div class="vmgrid"><div class="vmleft">'+
    '<label class="lab" for="vmsample">Câu nghe thử (bạn tự gõ)</label><input type="text" id="vmsample" value="'+esc(GEM.sample)+'" maxlength="300">'+
    '<label class="lab" for="vmstyle">Phong cách đọc (chữ tự do, đi kèm lời khi gọi API)</label><textarea id="vmstyle" rows="3" maxlength="600">'+esc(s.sel.style||'')+'</textarea>'+
    '<div class="chips vpres">'+GEM.presets.map(function(p,i){return '<button class="chip" data-vpreset="'+i+'">'+esc(p)+'</button>'}).join('')+'</div>'+
    '<label class="lab" for="vmspeed">Tốc độ</label><select id="vmspeed">'+Object.keys(SPEEDS).map(function(k){return '<option value="'+k+'"'+(s.sel.speed===k?' selected':'')+'>'+SPEEDS[k]+'</option>'}).join('')+'</select>'+
    '<div class="meta">Gemini không có thông số tốc độ riêng: tool ghi thêm câu yêu cầu tốc độ vào phong cách đọc.</div>'+
    '<div class="bar"><button class="btn pri" data-vm="apply">Áp dụng: '+esc(voiceLabel(s.sel.voice))+'</button>'+(inh&&t.cur?'<button class="btn" data-vm="clear">Bỏ thiết lập riêng</button>':'')+'</div>'+
    '<div class="meta">Mở menu không gọi API. Chỉ khi bấm Nghe thử mới gọi (tốn hạn mức); cùng giọng, phong cách và câu thì lần sau phát lại bản đã có.</div>'+
    '<div class="vcreate"><button class="btn sm" data-vm="create" disabled title="'+esc(VCREATE_WHY)+'">Tạo giọng mới</button><div class="meta">'+esc(VCREATE_WHY)+'</div></div>'+
   '</div><div class="vmlist">'+(CVOICES.length?'<div class="lab">Giọng tự tạo</div>'+CVOICES.map(function(x){return row(x.id,x.name,x.desc,true)}).join(''):'')+
    '<div class="lab">Giọng có sẵn của Gemini ('+VOICES.length+')</div>'+VOICES.map(function(v){return row(v,v,VDESC[v]||'',false)}).join('')+
   '</div></div></div>'}
var VCREATE_WHY='Chưa làm: chưa xác minh được API tạo giọng bằng mô tả (xem báo cáo Bước 8).';
function vmApply(){var s=S.vm;if(!s)return;var v=vcClean(s.sel),c=s.cid?clip(s.cid):null;
  if(s.scope==='global'){GEM.voice=v.voice||GEM.voice;GEM.style=v.style||'';saveGem();vmClose();msg('Đã đổi giọng mặc định chung: '+voiceLabel(GEM.voice)+'.');render();return}
  if(s.scope==='person'||s.scope==='gian'){VDEF[s.scope][s.name]=v;touchClips();markDirty();vmClose();var aff=CLIPS.filter(function(x){return vcStaleLines(x).length}).length;
    msg('Đã lưu giọng mặc định cho '+(s.scope==='person'?'người ':'gian ')+s.name+': '+voiceLabel(v.voice)+'.'+(aff?' '+aff+' clip đã có giọng cũ: tool không tự tạo lại, mở từng clip để tạo lại khi cần.':''));render();return}
  var before=c?vcStaleLines(c):[];if(s.scope==='clip')c.vc=v;else c.lines[s.li].vc=v;vcAfter(c,before);vmClose()}
/* Sau khi đổi giọng của clip / dòng: clip đã có giọng thì hỏi một lần, nói rõ dòng nào sẽ tạo lại. */
function vcAfter(c,before){touchClips();var st=vcStaleLines(c),nw=st.filter(function(i){return before.indexOf(i)<0});
  if(c.audioUrl&&nw.length){var all=st.length===c.lines.length;
    if(confirm('Clip '+c.id+' đã có giọng. Thiết lập mới làm '+linesText(st)+(all?' (cả clip)':'')+' không còn khớp giọng đã tạo.\n\nOK: tạo lại giọng cho '+linesText(st)+' ngay (gọi API, tốn hạn mức).\nHủy: chỉ lưu thiết lập, giữ giọng cũ, tạo lại sau bằng nút "Tạo lại giọng".')){render();makeVoice(c,{lines:st});return}
    msg('Đã lưu thiết lập giọng. Giọng cũ giữ nguyên; '+linesText(st)+' cần tạo lại khi bạn muốn.')}
  render()}
document.addEventListener('click',function(e){var b=e.target.closest('[data-vmopen],[data-vm],[data-vtry],[data-vpreset],[data-vcdel],[data-vmclr]');if(!b)return;var d=b.dataset;
  if(d.vmopen){var p=d.vmopen.split('|');vmOpen(p[0],p[1],p[2]);return}
  if(d.vmclr){var q=d.vmclr.split('|');if(q[0]==='person'||q[0]==='gian'){delete VDEF[q[0]][q[1]];touchClips();markDirty();render()}return}
  if(d.vtry){var s=S.vm;if(!s)return;previewVoice({voice:d.vtry,style:s.sel.style,speed:s.sel.speed},document.querySelector('[data-vstat="'+CSS.escape(d.vtry)+'"]'));return}
  if(d.vpreset!==undefined){var ta=document.getElementById('vmstyle');if(ta&&S.vm){ta.value=GEM.presets[+d.vpreset]||'';S.vm.sel.style=ta.value}return}
  if(d.vcdel){if(!confirm('Xóa giọng tự tạo "'+voiceLabel(d.vcdel)+'" khỏi danh sách của tool?'))return;CVOICES=CVOICES.filter(function(x){return x.id!==d.vcdel});touchClips();markDirty();vmRender();return}
  switch(d.vm){case 'close':vmClose();return;case 'apply':vmApply();return;
    case 'clear':var s2=S.vm,c=s2.cid?clip(s2.cid):null,bf=c?vcStaleLines(c):[];if(s2.scope==='clip')delete c.vc;else if(s2.scope==='line')delete c.lines[s2.li].vc;else delete VDEF[s2.scope][s2.name];vmClose();if(c)vcAfter(c,bf);else{touchClips();markDirty();render()}return}});
document.addEventListener('change',function(e){var t=e.target,s=S.vm;
  if(t.name==='vmv'&&s){s.sel.voice=t.value;vmRender();return}
  if(t.id==='vmsample'){GEM.sample=t.value.trim()||VSAMPLE0;saveGem();return}
  if(t.id==='vmspeed'&&s){s.sel.speed=t.value;return}
  if(t.id==='vmpresets'){GEM.presets=t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean).slice(0,12);if(!GEM.presets.length)GEM.presets=VPRESET0.slice();saveGem();render();return}});
document.addEventListener('input',function(e){if(e.target.id==='vmstyle'&&S.vm)S.vm.sel.style=e.target.value});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&S.vm)vmClose()});
document.addEventListener('click',function(e){var b=e.target.closest('[data-act="gemre"]');if(!b)return;var c=clip(S.cur);if(!c)return;var st=vcStaleLines(c);
  if(!st.length)return;if(!confirm('Tạo lại giọng cho '+c.id+', '+linesText(st)+'? (gọi API, tốn hạn mức; các dòng khác giữ nguyên)'))return;makeVoice(c,{lines:st})});
/* Đổi tên người ở Cài đặt: chuyển luôn giọng mặc định theo tên mới. */
document.addEventListener('change',function(e){var t=e.target;if(t.dataset.pname===undefined)return;var p=PEOPLE[+t.dataset.pname],old=p&&p.name;
  setTimeout(function(){if(old&&p.name!==old&&VDEF.person[old]){VDEF.person[p.name]=VDEF.person[old];delete VDEF.person[old];touchClips();markDirty()}},0)},true);

/* ---------- các khối hiển thị ---------- */
function vcText(v){return voiceLabel(v.voice)+(v.speed?' · '+SPEEDS[v.speed].toLowerCase():'')+(v.style?' · "'+String(v.style).slice(0,60)+(String(v.style).length>60?'…':'')+'"':'')}
function voicePick(c){var li=Math.min(S.li,c.lines.length-1),v=vcFor(c),vl=vcFor(c,li),st=vcStaleLines(c);
  return '<div class="vpick"><div><span class="lab">Giọng của clip:</span> <b class="vcur">'+esc(voiceLabel(v.voice))+'</b> <span class="meta">theo '+esc(v.src)+(v.speed?' · '+SPEEDS[v.speed].toLowerCase():'')+'</span></div>'+
   (v.style?'<div class="meta">Phong cách: '+esc(v.style)+'</div>':'')+
   '<div class="bar" style="margin:4px 0"><button class="btn sm" data-vmopen="clip|'+esc(c.id)+'">Chọn giọng cho clip…</button>'+(c.vc?'<span class="bdg">riêng của clip</span>':'')+'</div>'+
   '<div><span class="lab">Dòng '+(li+1)+':</span> '+(c.lines[li]&&c.lines[li].vc?'<b>'+esc(voiceLabel(vl.voice))+'</b> <span class="bdg">riêng của dòng</span>':'<span class="meta">theo clip</span>')+' <button class="btn xs" data-vmopen="line|'+esc(c.id)+'|'+li+'">Chọn giọng cho dòng '+(li+1)+'…</button></div>'+
   (st.length?'<div class="w warn" style="margin-top:6px">Giọng đã tạo không khớp thiết lập hiện tại ở '+linesText(st)+'. Tool không tự tạo lại. <button class="btn sm" data-act="gemre">Tạo lại giọng cho '+linesText(st)+'</button></div>':'')+'</div>'}
function voiceDefaultsSettings(){
  var row=function(scope,name,lab){var v=VDEF[scope][name];return '<tr><td>'+esc(lab)+'</td><td>'+(v&&!vcEmpty(v)?esc(vcText(Object.assign({voice:GEM.voice,style:'',speed:''},v))):'<span class="meta">chưa đặt</span>')+'</td><td><button class="btn sm" data-vmopen="'+scope+'|'+esc(name)+'">Chọn giọng…</button>'+(v?'<button class="btn xs" data-vmclr="'+scope+'|'+esc(name)+'">Bỏ</button>':'')+'</td></tr>'};
  var gians=GIANS.slice();CLIPS.forEach(function(c){if(c.g&&gians.indexOf(c.g)<0)gians.push(c.g)});
  return '<div class="set" id="vdefs"><b>Giọng mặc định theo người và gian</b><div class="meta">Clip lấy giọng theo thứ tự: riêng của dòng → riêng của clip → người làm → gian → mặc định chung. Lưu trong state.json của thư mục source (không có API key). Đổi mặc định không tự tạo lại giọng đã có.</div>'+
   '<div class="bar"><span>Mặc định chung: <b>'+esc(voiceLabel(GEM.voice))+'</b></span><button class="btn sm" data-vmopen="global">Chọn giọng…</button></div>'+
   '<div class="tbl"><table><thead><tr><th>Người / gian</th><th>Giọng, tốc độ, phong cách</th><th></th></tr></thead><tbody>'+
   (PEOPLE.length?PEOPLE.map(function(p){return row('person',p.name,'Người: '+p.name)}).join(''):'<tr><td colspan="3" class="meta">Chưa có người phụ trách (thêm ở mục Người phụ trách).</td></tr>')+
   gians.map(function(g){return row('gian',g,'Gian: '+g)}).join('')+'</tbody></table></div>'+
   '<label class="lab" for="vmpresets">Mẫu phong cách đọc gợi ý (mỗi dòng một mẫu, sửa được)</label><textarea id="vmpresets" rows="4">'+esc(GEM.presets.join('\n'))+'</textarea></div>'}
