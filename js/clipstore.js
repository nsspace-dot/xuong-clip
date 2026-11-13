/* Tự lưu kịch bản, clip đang ghép, giọng đọc và danh sách clip đã xuất vào thư mục source.
   - state.json (version 3): clips, clipsArchived (đợt đã lưu trữ), clipsTrash (đã xóa mềm), exported, info.
   - Giọng đọc: file trong .xuongclip/audio/<mã clip>.wav; state.json chỉ ghi đường dẫn, model, tên giọng.
   - Không nhúng blob (video, ảnh, âm thanh) vào state.json. API key không bao giờ nằm ở đây.
   Thay đổi được phát hiện bằng cách so "chữ ký" dữ liệu clip sau mỗi lần bấm, đổi, thả chuột hay gõ phím,
   rồi dùng chung cơ chế ghi trễ 1,5 giây của source.js. Kéo thanh trượt chỉ ghi khi thả. */
var ARCH=[],TRASH=[];
var LINE_KEYS=['t','need','seg','segIn','segOut','lock','tr','spd','dm','dd','fill','why'];
var INFO_KEYS=['x','ph','off','len','sz','px','py'];
var COV_KEYS=['li','tm','text','px','py','sz','fg','bg','nobg'];
var BIG_STATE=5*1024*1024;

function pickKeys(o,keys){var r={};keys.forEach(function(k){var v=o[k];if(v!==undefined&&v!==null&&v!==''&&v!==false&&!(typeof v==='number'&&!isFinite(v)))r[k]=v});return r}
function clipToRec(c){
  var o={id:c.id,g:c.g||'',prod:c.prod||'',name:c.name||'',who:c.who||'',batch:c.batch||'',auto:!!c.auto,exported:!!c.exported,
    lines:c.lines.map(function(l){var r=pickKeys(l,LINE_KEYS);r.t=l.t||'';r.need=l.need||'';r.infos=(l.infos||[]).map(function(x){return pickKeys(x,INFO_KEYS)});return r})};
  if(c.bounds&&c.bounds.length)o.bounds=c.bounds.map(function(x){return Math.round(x*1000)/1000});
  if(c.bManual)o.bManual=true;if(c.alignInfo)o.alignInfo=c.alignInfo;
  if(c.audio)o.audio=pickKeys(c.audio,['file','model','voice','src','name','at']);
  if(c.audio&&c.audioDur)o.audioDur=Math.round(c.audioDur*1000)/1000;
  if(c.cov)o.cov=pickKeys(c.cov,COV_KEYS);
  if(c.out)o.out=pickKeys(c.out,['name','ext','mb']);
  if(c.voiceStale)o.voiceStale=true;if(c.created)o.created=c.created;if(c.ignored&&c.ignored.length)o.ignored=c.ignored.slice();if(c.posted){o.posted=true;if(c.postedAt)o.postedAt=c.postedAt}
  return o}
function num(v){v=+v;return isFinite(v)?v:undefined}
function clipFromRec(o){
  if(!o||!o.id)return null;
  var c={id:String(o.id),g:String(o.g||''),prod:String(o.prod||''),name:String(o.name||''),who:String(o.who||''),batch:String(o.batch||''),auto:!!o.auto,exported:!!o.exported,created:o.created||'',
    lines:(Array.isArray(o.lines)?o.lines:[]).map(function(r){r=r||{};var l={t:String(r.t||''),need:String(r.need||''),seg:r.seg?String(r.seg):null,infos:[],choose:false};
      ['segIn','segOut','spd','dm','dd'].forEach(function(k){var v=num(r[k]);if(v!==undefined)l[k]=v});
      if(r.lock)l.lock=true;['tr','fill','why'].forEach(function(k){if(r[k])l[k]=String(r[k])});
      l.infos=(Array.isArray(r.infos)?r.infos:[]).map(function(x){x=x||{};var i={x:String(x.x==null?'':x.x),ph:String(x.ph||'')};['off','len','sz','px','py'].forEach(function(k){var v=num(x[k]);if(v!==undefined)i[k]=v});return i});
      return l})};
  if(Array.isArray(o.bounds))c.bounds=o.bounds.map(Number);if(o.bManual)c.bManual=true;if(o.alignInfo)c.alignInfo=String(o.alignInfo);
  if(o.audio&&o.audio.file){c.audio=pickKeys(o.audio,['file','model','voice','src','name','at']);c.audioDur=num(o.audioDur)||null}
  if(Array.isArray(o.ignored))c.ignored=o.ignored.map(String);
  if(o.posted){c.posted=true;if(o.postedAt)c.postedAt=String(o.postedAt)}
  if(o.cov)c.cov=pickKeys(o.cov,COV_KEYS);if(o.out)c.out=pickKeys(o.out,['name','ext','mb']);if(o.voiceStale)c.voiceStale=true;
  if(!c.lines.length)c.lines.push({t:'',need:'',seg:null,infos:[],choose:false});
  return c}
function expToRec(x){return pickKeys(x,['id','clipId','fname','g','name','d','ext','date','cap','posted','savedIn'])}
function clipsState(){return {clips:CLIPS.map(clipToRec),clipsArchived:ARCH.map(clipToRec),clipsTrash:TRASH.map(clipToRec),exported:EXP.map(expToRec),info:pickKeys(INFO,['size','fg','bg','pos','mode','secs']),checkRules:chkToState().checkRules,checkCfg:chkToState().checkCfg,milestones:milesToState()}}
/* Nạp phần clip từ state.json. Clip đang có trong bộ nhớ (nạp trước khi chọn thư mục) được giữ lại và thêm vào. */
function clipsFromState(o){
  var mem=SRCF.clipsLoaded?[]:CLIPS.slice(),memExp=SRCF.clipsLoaded?[]:EXP.slice();
  CLIPS=[];ARCH=[];TRASH=[];EXP=[];
  (Array.isArray(o.clips)?o.clips:[]).forEach(function(r){var c=clipFromRec(r);if(c)CLIPS.push(c)});
  (Array.isArray(o.clipsArchived)?o.clipsArchived:[]).forEach(function(r){var c=clipFromRec(r);if(c)ARCH.push(c)});
  (Array.isArray(o.clipsTrash)?o.clipsTrash:[]).forEach(function(r){var c=clipFromRec(r);if(c)TRASH.push(c)});
  (Array.isArray(o.exported)?o.exported:[]).forEach(function(x){if(x&&x.id)EXP.push(expToRec(x))});
  milesFromState(o); // mốc hạn chót (version 5)
  chkFromState(o); // luật kiểm tra (version 4); không có thì dùng luật mặc định
  if(o.info&&typeof o.info==='object')['size','fg','bg','pos','mode','secs'].forEach(function(k){if(o.info[k]!=null)INFO[k]=o.info[k]});
  var added=0;mem.forEach(function(c){if(!clipById(c.id)){CLIPS.push(c);added++}else{c.id=uniqueClipId(c.id);CLIPS.push(c);added++}});
  memExp.forEach(function(x){if(!EXP.some(function(y){return y.id===x.id}))EXP.push(x)});
  SRCF.clipsLoaded=true;S.clipUndo=null;
  return added}
function clipsReset(){if(!SRCF.clipsLoaded)return;CLIPS=[];ARCH=[];TRASH=[];EXP=[];S.edit=null;S.cur=null;S.clipUndo=null;S.imp=null;SRCF.clipsLoaded=false;CLIPSIG=''}
function clipById(id){return CLIPS.concat(ARCH,TRASH).filter(function(c){return c.id===id})[0]||null}
function uniqueClipId(id){if(!clipById(id))return id;for(var k=2;;k++){var n=id+'-'+k;if(!clipById(n))return n}}

/* ---------- phát hiện thay đổi ---------- */
var CLIPSIG='',touchT=null;
function clipsSig(){try{return JSON.stringify(clipsState())}catch(e){return ''}}
function touchClips(now){clearTimeout(touchT);touchT=null;
  var f=function(){touchT=null;var s=clipsSig();if(s&&s!==CLIPSIG){CLIPSIG=s;markDirty()}};if(now)f();else touchT=setTimeout(f,250)}
function sigReset(){CLIPSIG=clipsSig()}
['click','change','pointerup','keyup'].forEach(function(t){document.addEventListener(t,function(){touchClips()},true)});

/* ---------- giọng đọc trong .xuongclip/audio ---------- */
function audioFileName(c,ext){return String(c.id).replace(/[^\p{L}\p{N}._-]+/gu,'_').replace(/^\.+/,'_')+'.'+(ext||'wav')}
/* Gắn file giọng cho clip (giọng vừa tạo hoặc file người dùng tải lên); ghi ra đĩa ở lần lưu kế tiếp. */
function setClipAudio(c,file,meta){
  var ext=(/\.([a-z0-9]{2,4})$/i.exec(file.name||'')||[])[1]||'wav';
  if(c.audioUrl)try{URL.revokeObjectURL(c.audioUrl)}catch(e){}
  c.audioFile=file;c.audioUrl=URL.createObjectURL(file);c.audioPending=true;c.audioMissing=false;c.voiceStale=false;
  c.audio={file:'audio/'+audioFileName(c,ext.toLowerCase()),at:new Date().toISOString()};for(var k in meta)if(meta[k])c.audio[k]=meta[k];
  touchClips();markDirty()}
async function writeBlob(dir,name,blob){var fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();try{await w.write(blob);await w.close()}catch(e){try{await w.abort()}catch(x){}throw e}}
/* Gọi từ srcSave trước khi ghi state.json. */
async function writePendingAudio(){
  var list=CLIPS.concat(ARCH,TRASH).filter(function(c){return c.audioPending&&c.audioFile&&c.audio&&c.audio.file});if(!list.length)return;
  var ad=await (await xdir()).getDirectoryHandle('audio',{create:true});
  for(var i=0;i<list.length;i++){var c=list[i];await writeBlob(ad,c.audio.file.split('/').pop(),c.audioFile);c.audioPending=false}}
/* Mở lại: nạp file giọng từ đĩa, không gọi API. Không còn file thì đánh dấu "cần tạo lại giọng". */
async function loadClipAudio(){
  var list=CLIPS.concat(ARCH,TRASH).filter(function(c){return c.audio&&c.audio.file&&!c.audioFile});if(!list.length)return;
  var x=await xdir(),ad=null;try{ad=await x.getDirectoryHandle('audio')}catch(e){}
  for(var i=0;i<list.length;i++){var c=list[i];
    try{if(!ad)throw new Error('no dir');var f=await (await ad.getFileHandle(c.audio.file.split('/').pop())).getFile();c.audioFile=f;c.audioUrl=URL.createObjectURL(f);c.audioMissing=false}
    catch(e){if(isPermErr(e))throw e;c.audioMissing=true}}}

/* ---------- đợt, nạp kịch bản thêm vào, xóa mềm ---------- */
function weekLabel(d){d=d||new Date();var m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7)),e=new Date(m.getFullYear(),m.getMonth(),m.getDate()+6),p=function(n){return ('0'+n).slice(-2)};
  return p(m.getDate())+'/'+p(m.getMonth()+1)+' – '+p(e.getDate())+'/'+p(e.getMonth()+1)}
function batches(list){var o=[];list.forEach(function(c){var b=c.batch||'';if(o.indexOf(b)<0)o.push(b)});return o}
function lineKey(l){return pkey(l.t)+'|'+pkey(l.need)}
/* Cập nhật lời cho clip đã có: dòng không đổi (cùng lời, cùng cảnh cần) giữ nguyên cảnh đã chọn và mọi chỉnh sửa. */
function mergeClip(old,n){
  var pool=old.lines.slice(),kept=0;
  var lines=n.lines.map(function(l){var k=lineKey(l),j=-1;for(var q=0;q<pool.length;q++)if(pool[q]&&lineKey(pool[q])===k){j=q;break}
    if(j<0)return l;var o=pool[j];pool[j]=null;kept++;if(infosStr(o)!==infosStr(l))o.infos=l.infos;return o});
  var textChanged=lines.length!==old.lines.length||lines.some(function(l,i){return old.lines[i]!==l});
  old.g=n.g;old.prod=n.prod;old.name=n.name;if(n.who)old.who=n.who;old.batch=n.batch||old.batch;old.lines=lines;
  if(textChanged){old.bounds=null;old.bManual=false;if(old.audio||old.audioFile)old.voiceStale=true;old.exported=false}
  return kept}
function applyImport(fresh,choices){
  var r={add:0,upd:0,copy:0,skip:0,kept:0};
  fresh.forEach(function(n){var ex=clipById(n.id),ch=ex?(choices[n.id]||'update'):'add';
    if(ch==='skip'){r.skip++;return}
    if(ch==='copy'){n.id=uniqueClipId(n.id);CLIPS.push(n);r.copy++;return}
    if(ch==='update'){if(ARCH.indexOf(ex)>=0){ARCH.splice(ARCH.indexOf(ex),1);CLIPS.push(ex)}if(TRASH.indexOf(ex)>=0){TRASH.splice(TRASH.indexOf(ex),1);CLIPS.push(ex)}r.kept+=mergeClip(ex,n);r.upd++;return}
    CLIPS.push(n);r.add++});
  return r}
function clipDelete(id){var c=clip(id);if(!c)return;CLIPS.splice(CLIPS.indexOf(c),1);c.deletedAt=new Date().toISOString();TRASH.unshift(c);
  if(S.edit===id)S.edit=null;if(S.cur===id)S.cur=null;S.clipUndo={ids:[id],label:'xóa clip '+id};touchClips()}
function clipRestore(ids){ids.forEach(function(id){var c=TRASH.filter(function(x){return x.id===id})[0];if(!c)return;TRASH.splice(TRASH.indexOf(c),1);delete c.deletedAt;CLIPS.push(c)});S.clipUndo=null;touchClips()}
function archiveBatch(b){var mv=CLIPS.filter(function(c){return (c.batch||'')===b});mv.forEach(function(c){CLIPS.splice(CLIPS.indexOf(c),1);ARCH.push(c)});
  if(S.edit&&!clip(S.edit))S.edit=null;if(S.cur&&!clip(S.cur))S.cur=null;S.kbBatch='';touchClips();return mv.length}
function unarchiveBatch(b){var mv=ARCH.filter(function(c){return (c.batch||'')===b});mv.forEach(function(c){ARCH.splice(ARCH.indexOf(c),1);CLIPS.push(c)});touchClips();return mv.length}

/* ---------- dòng mất cảnh ---------- */
function lineSeg(l){var s=l&&l.seg?seg(l.seg):null;return s&&!s.missing&&s.url?s:null}
function lineLost(l){return !!(l&&l.seg&&!lineSeg(l))}
function lostWhy(l){var s=seg(l.seg),r=LIB[l.seg];return !SRCF.open?'chưa mở thư mục source':s&&s.missing?'mất file video':r&&isDel(l.seg)?'thẻ video đã bị xóa khỏi thư viện':'không còn video này trong thư viện'}

/* ---------- chỉ báo lưu trên đầu trang ---------- */
function hhmm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}
/* Luôn trả về một trạng thái (không bao giờ rỗng), theo thứ tự ưu tiên. */
function saveBadgeState(){
  if(!SRCF.ok)return ['Trình duyệt không hỗ trợ: không lưu','bad'];
  if(!SRCF.h)return ['Chưa chọn thư mục: chưa lưu','warn'];
  if(SRCF.perm&&SRCF.perm!=='granted')return ['Mất quyền thư mục: chưa lưu','bad'];
  if(SRCF.ro)return ['Chỉ đọc: không lưu','bad'];
  if(SRCF.broken||SRCF.newer)return ['Không lưu: xem cảnh báo','bad'];
  if(!SRCF.open)return ['Đang mở thư mục...',''];
  if(SRCF.saving||SRCF.dirty)return ['Đang lưu...',''];
  if(SRCF.savedAt)return ['Đã lưu '+hhmm(SRCF.savedAt),'ok'];
  if(SRCF.fileSavedAt)return ['Đã lưu '+hhmm(SRCF.fileSavedAt),'ok'];
  return ['Đã lưu','ok']}
function updSaveBadge(){var e=document.getElementById('savebadge');if(!e)return;var st=saveBadgeState();
  e.textContent=st[0];e.className='savebadge'+(st[1]?' '+st[1]:'');e.title=SRCF.h?saveStatus():'Chọn thư mục source ở tab Thư viện source để tool tự lưu.'}
