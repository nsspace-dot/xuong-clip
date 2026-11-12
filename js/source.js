/* Thư mục source trên máy người dùng (chỉ Chrome / Edge).
   - Chọn thư mục bằng showDirectoryPicker, nhớ handle trong IndexedDB (khóa 'srcdir').
   - Quét đệ quy video, đọc thẳng bằng getFile() + createObjectURL, không chép nội dung.
   - Dữ liệu thư viện lưu ở <thư mục>/.xuongclip/state.json (bản trước: state.bak.json).
   - Khóa .xuongclip/lock.json để hai tab / hai máy không cùng ghi.
   TUYỆT ĐỐI không xóa, đổi tên, di chuyển file nào ngoài thư mục .xuongclip. */
var LIB={};   // id -> bản ghi video (gồm cả video mất file và video đã xóa khỏi thư viện)
var SRCF={ok:!!(window.showDirectoryPicker&&window.crypto&&crypto.subtle),h:null,name:'',perm:'',open:false,ro:false,roAt:0,broken:'',newer:0,extra:{},err:'',
  dirty:false,ver:0,saveT:null,saving:false,again:false,savedAt:0,deleted:[],scan:null,beat:null,roT:null,
  me:Math.random().toString(36).slice(2)+Date.now().toString(36),prev:''};
// Khóa do chính tab này để lại trước khi tải lại trang (pagehide ghi id vào sessionStorage) thì coi là của mình.
// Tab nhân bản không có dấu này vì tab gốc chưa rời trang.
try{SRCF.prev=sessionStorage.getItem('xuongclip_left')||'';sessionStorage.removeItem('xuongclip_left')}catch(e){}
var STATE_VER=3,XDIR='.xuongclip',LOCK_TTL=120000,VEXT=/\.(mp4|mov|m4v|webm)$/i;
var OSTAT=['thô','đã dựng','đã đăng'];

/* ---------- tiện ích nhỏ ---------- */
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function sid(id){return String(id||'').slice(0,8)}
function isDel(id){return SRCF.deleted.indexOf(id)>=0}
function isPermErr(e){return !!e&&(e.name==='NotAllowedError'||e.name==='SecurityError')}
function errTxt(e){return (e&&(e.message||e.name))||String(e)}
function clock(t){return new Date(t).toLocaleTimeString('vi-VN')}
function stamp(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
function skipName(n){return n.charAt(0)==='.'||/^[$@#~]/.test(n)||n==='System Volume Information'}
async function sha1(s){var b=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
async function permOf(h,ask){if(!h.queryPermission)return 'granted';var o={mode:'readwrite'},pm=await h.queryPermission(o);if(pm!=='granted'&&ask)pm=await h.requestPermission(o);return pm}
async function xdir(){return SRCF.h.getDirectoryHandle(XDIR,{create:true})}
async function readTxt(dir,name){try{var fh=await dir.getFileHandle(name);return await (await fh.getFile()).text()}catch(e){if(e&&(e.name==='NotFoundError'||e.name==='TypeMismatchError'))return null;throw e}}
async function writeTxt(dir,name,txt){var fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();try{await w.write(txt);await w.close()}catch(e){try{await w.abort()}catch(x){}throw e}}
async function moveAside(dir,from,to){var t=await readTxt(dir,from);if(t==null)return '';await writeTxt(dir,to,t);await dir.removeEntry(from);return to}
function parseState(t){try{var o=JSON.parse(t);if(o&&typeof o==='object'&&Array.isArray(o.library))return o}catch(e){}return null}

/* ---------- bản ghi <-> state.json ---------- */
function toRec(r){return {id:r.id,path:r.path,size:r.size,mtime:r.mtime,label:r.label||'',product:r.p||'',status:r.o||'thô',duration:Math.round((r.dx||0)*1000)/1000,manual:!!r.manual,guess:!!(r.guess&&r.p),desc:r.desc||'',tags:(r.tags||[]).map(function(t){return {a:t.a,b:t.b,d:t.d}})}}
function fromRec(o){var dx=+o.duration||0;
  return {id:String(o.id),path:String(o.path||''),size:+o.size||0,mtime:+o.mtime||0,label:String(o.label||''),p:String(o.product||''),o:OSTAT.indexOf(o.status)>=0?o.status:'thô',
    dx:dx,d:dx?Math.max(1,Math.round(dx)):5,manual:!!o.manual,guess:!!o.guess,desc:String(o.desc||''),
    tags:Array.isArray(o.tags)?o.tags.filter(function(t){return t&&isFinite(+t.a)&&isFinite(+t.b)}).map(function(t){return {a:+t.a,b:+t.b,d:String(t.d||'')}}):[],
    missing:true,url:null,fh:null}}
function stateObj(){
  var lib=Object.keys(LIB).map(function(k){return toRec(LIB[k])}).sort(function(a,b){return a.path<b.path?-1:a.path>b.path?1:0});
  var o={};for(var k in SRCF.extra)o[k]=SRCF.extra[k]; // giữ các trường lạ để không làm mất dữ liệu của bản tool khác
  var c=catalogToState();o.version=STATE_VER;o.savedAt=new Date().toISOString();o.library=lib;o.deleted=SRCF.deleted.slice();
  o.products=c.products;o.rules=c.rules;o.mergeSkip=c.mergeSkip;
  var cs=clipsState();for(var ck in cs)o[ck]=cs[ck];return o}
function saveSeg(){markDirty()}

/* ---------- đoán sản phẩm / trạng thái từ đường dẫn ---------- */
function isStatusDir(n){return /^(tho|da dung|da dang|raw|ai)$/.test(norm(n.trim()))}
function guessO(path){var f=path.split('/').slice(0,-1).map(function(x){return norm(x.trim())});
  for(var i=f.length-1;i>=0;i--){if(f[i]==='da dung')return 'đã dựng';if(f[i]==='da dang')return 'đã đăng'}
  return /(^|[\/_ ])(ai)([\/_. ]|$)/i.test(path)?'đã dựng':'thô'}
function guessProd(path){
  var parts=path.split('/'),folders=parts.slice(0,-1),ks=PRODUCTS.map(function(p){return p.name}),i;
  for(i=folders.length-1;i>=0;i--){var hit=findProduct(folders[i]);if(hit)return hit.name}
  for(i=folders.length-1;i>=0;i--){var f=folders[i].trim();if(f&&/\p{L}/u.test(f)&&!isStatusDir(f))return f}
  var best='',bs=0,nt=toks(parts[parts.length-1]);
  ks.forEach(function(k){var weak=['lich','tranh','bang','treo'],n=toks(k).filter(function(w){return weak.indexOf(w)<0&&nt.indexOf(w)>=0}).length;if(n>bs){bs=n;best=k}});
  return best}
function baseLabel(path){var n=path.split('/').pop();return n.replace(/\.[^.]+$/,'').replace(/[_]+/g,' ')}

/* ---------- khởi động / chọn thư mục / quyền ---------- */
function cleanOldIdb(){ // bản cũ chép video vào IndexedDB (khóa 'seg:*'): dọn đi để trả lại dung lượng
  idbOpen().then(function(db){var tx=db.transaction('kv','readwrite'),os=tx.objectStore('kv'),rq=os.openKeyCursor();
    rq.onsuccess=function(){var cu=rq.result;if(cu){if(String(cu.key).indexOf('seg:')===0)os.delete(cu.key);cu.continue()}}}).catch(function(){})}
async function srcInit(){
  cleanOldIdb();
  if(!SRCF.ok){renderSrcBar();return}
  var h=null;try{h=await idbGet('srcdir')}catch(e){}
  if(!h){renderSrcBar();return}
  SRCF.h=h;SRCF.name=h.name;
  try{SRCF.perm=await permOf(h)}catch(e){SRCF.perm='prompt'}
  if(SRCF.perm==='granted')await srcOpen();else render();
}
function srcReset(){
  stopBeat();clearInterval(SRCF.roT);SRCF.roT=null;clearTimeout(SRCF.saveT);SRCF.saveT=null;
  Object.keys(LIB).forEach(function(k){if(LIB[k].url)URL.revokeObjectURL(LIB[k].url)});
  LIB={};SEGS=[];SRCF.deleted=[];PRODUCTS=[];PRULES=[];MERGESKIP=[];SRCF.newer=0;SRCF.extra={};S.sel={};S.undo=null;SRCF.open=false;SRCF.ro=false;SRCF.broken='';SRCF.err='';SRCF.dirty=false;SRCF.savedAt=0;SRCF.big=0;clipsReset();
}
async function srcPick(){
  if(!SRCF.ok){msg('Trình duyệt này không chọn được thư mục trên máy. Hãy dùng Chrome hoặc Edge trên máy tính.');return}
  if(SRCF.scan)return;
  var h;try{h=await window.showDirectoryPicker({id:'xuongclip-src',mode:'readwrite'})}catch(e){if(e&&e.name==='AbortError')return;msg('Không mở được thư mục: '+errTxt(e));return}
  try{if(await permOf(h,true)!=='granted'){msg('Cần cho phép xem và sửa thư mục thì tool mới lưu được dữ liệu vào .xuongclip.');return}}catch(e){}
  if(SRCF.h&&SRCF.open){await srcSave();await releaseLock()}
  srcReset();SRCF.h=h;SRCF.name=h.name;SRCF.perm='granted';
  try{await idbSet('srcdir',h)}catch(e){}
  await srcOpen();
}
async function srcGrant(){ // phải gọi trong sự kiện bấm của người dùng
  if(!SRCF.h)return;var pm='denied';try{pm=await permOf(SRCF.h,true)}catch(e){}
  SRCF.perm=pm;if(pm!=='granted'){render();return}
  if(SRCF.open){try{await takeLock()}catch(e){}SRCF.err='';render();if(SRCF.dirty)srcSave();return}
  await srcOpen();
}
function permLost(){SRCF.perm='prompt';stopBeat();render()}
async function srcOpen(){
  SRCF.open=false;SRCF.err='';render();
  try{
    await takeLock();
    var note=await loadState();
    await loadClipAudio();sigReset();
    SRCF.open=true;
    await srcScan(note);
  }catch(e){if(isPermErr(e))permLost();else{SRCF.err='Không mở được thư mục "'+SRCF.name+'": '+errTxt(e);render()}}
}

/* ---------- khóa chống mở trùng ---------- */
async function readLock(){var t=await readTxt(await xdir(),'lock.json');if(!t)return null;try{return JSON.parse(t)}catch(e){return null}}
function lockOther(l){return !!(l&&l.owner&&l.owner!==SRCF.me&&l.owner!==SRCF.prev&&Math.abs(Date.now()-(+l.at||0))<LOCK_TTL)}
async function writeLock(){await writeTxt(await xdir(),'lock.json',JSON.stringify({owner:SRCF.me,at:Date.now(),updated:new Date().toISOString()}))}
async function takeLock(){
  var l=await readLock();if(lockOther(l)){setRO(l);return false}
  await writeLock();await sleep(400);
  l=await readLock();if(lockOther(l)){setRO(l);return false}
  SRCF.ro=false;clearInterval(SRCF.roT);SRCF.roT=null;startBeat();return true}
function startBeat(){stopBeat();SRCF.beat=setInterval(async function(){if(!SRCF.open||SRCF.ro||SRCF.perm!=='granted')return;
  try{var l=await readLock();if(lockOther(l)){setRO(l);render();return}await writeLock()}catch(e){if(isPermErr(e))permLost()}},30000)}
function stopBeat(){if(SRCF.beat){clearInterval(SRCF.beat);SRCF.beat=null}}
function setRO(l){SRCF.ro=true;SRCF.roAt=+l.at||0;stopBeat();if(!SRCF.roT)SRCF.roT=setInterval(function(){srcCheckRO(false)},30000)}
async function srcCheckRO(manual){
  if(!SRCF.ro||!SRCF.h)return;
  try{var l=await readLock();if(lockOther(l)){SRCF.roAt=+l.at||0;if(manual)msg('Thư mục vẫn đang được mở ở nơi khác (cập nhật lúc '+clock(SRCF.roAt)+').');else renderSrcBar();return}}
  catch(e){if(isPermErr(e)){permLost();return}}
  clearInterval(SRCF.roT);SRCF.roT=null;SRCF.ro=false;
  srcReset();await srcOpen(); // nạp lại từ đĩa vì nơi kia có thể đã ghi
}
async function releaseLock(){if(!SRCF.h||SRCF.ro||!SRCF.open)return;try{var l=await readLock();if(l&&l.owner===SRCF.me)await (await xdir()).removeEntry('lock.json')}catch(e){}}

/* ---------- đọc state.json ---------- */
async function loadState(){
  var x=await xdir(),st=await readTxt(x,'state.json'),bk=await readTxt(x,'state.bak.json');
  var a=st!=null?parseState(st):null,b=bk!=null?parseState(bk):null,use=null,note='',ts=stamp();
  SRCF.broken='';
  if(a)use=a;
  else if(st==null&&bk==null)use={library:[],deleted:[]};
  else if(b){
    if(st!=null){var nm=SRCF.ro?'':await moveAside(x,'state.json','state.corrupt-'+ts+'.json');note='state.json bị hỏng'+(nm?', đã đổi tên thành '+nm:'')+'. Đã dùng bản dự phòng state.bak.json.'}
    else note='Không thấy state.json, đã dùng bản dự phòng state.bak.json.';
    use=b;
  }else{
    var names=[];
    if(!SRCF.ro){if(st!=null)names.push(await moveAside(x,'state.json','state.corrupt-'+ts+'.json'));if(bk!=null)names.push(await moveAside(x,'state.bak.json','state.corrupt-'+ts+'-bak.json'))}
    SRCF.broken=(st!=null&&bk!=null?'Cả state.json và state.bak.json đều hỏng':st!=null?'state.json bị hỏng và không có state.bak.json':'Không có state.json, còn state.bak.json bị hỏng')+
      (names.length?' (đã đổi tên thành '+names.join(', ')+')':'')+'. Tool không tự ghi dữ liệu mới để tránh mất dữ liệu cũ. Nếu chắc muốn bắt đầu lại, bấm "Bắt đầu dữ liệu mới".';
    use={library:[],deleted:[]};
  }
  SRCF.fileSavedAt=Date.parse(use.savedAt)||0; // giờ ghi gần nhất trong file, cho chỉ báo "Đã lưu" lúc vừa mở
  var v=+use.version||1;SRCF.newer=v>STATE_VER?v:0;SRCF.extra={};
  for(var k in use)if(['version','savedAt','library','deleted','products','rules','mergeSkip','clips','clipsArchived','clipsTrash','exported','info'].indexOf(k)<0)SRCF.extra[k]=use[k];
  LIB={};(use.library||[]).forEach(function(o){if(o&&o.id&&o.path){var r=fromRec(o);LIB[r.id]=r}});
  SRCF.deleted=[];(Array.isArray(use.deleted)?use.deleted:[]).forEach(function(id){id=String(id);if(!isDel(id))SRCF.deleted.push(id)});
  catalogFromState(use);
  if(v<2)migrateV1();
  SRCF.oldVer=v<STATE_VER?v:0;
  if(v<STATE_VER&&(use.library||[]).length&&!note)note='Đã chuyển dữ liệu sang định dạng mới (version '+STATE_VER+'), dữ liệu cũ giữ nguyên và có bản sao state.v'+v+'.bak.json.';
  var nAdopt=clipsFromState(use);if(nAdopt&&!note)note='Đã thêm '+nAdopt+' clip đang mở vào dữ liệu của thư mục này.';
  Object.keys(LIB).forEach(function(k){var r=LIB[k];if(r.p)r.p=ensureProduct(r.p,true);else{r.manual=false;r.guess=false}}); // auto=true: không đổi cờ của sản phẩm đã có
  if((note||SRCF.oldVer)&&!SRCF.ro&&!SRCF.newer){SRCF.dirty=true;SRCF.ver++}
  return note;
}
/* version 1 chưa có danh mục và cờ nhãn: lập danh mục từ các sản phẩm đang dùng.
   Nhãn trùng với kết quả đoán hiện nay thì coi là "đoán", khác thì coi là người dùng đã gõ tay. */
function migrateV1(){
  Object.keys(LIB).forEach(function(k){if(LIB[k].p)ensureProduct(LIB[k].p)});
  Object.keys(LIB).forEach(function(k){var r=LIB[k];if(!r.p)return;var g=guessProd(r.path);r.guess=!!g&&canonicalProduct(g)===r.p;r.manual=!r.guess;if(r.guess)findProduct(r.p).auto=true});
}
function srcFresh(){if(!SRCF.broken)return;if(!confirm('Bắt đầu dữ liệu thư viện mới cho thư mục này? Các file state.corrupt-*.json vẫn được giữ lại trong .xuongclip.'))return;SRCF.broken='';markDirty();render()}

/* ---------- quét thư mục ---------- */
async function walk(dir,pre,out){
  for await (var ent of dir.entries()){var name=ent[0],h=ent[1];if(skipName(name))continue;
    if(h.kind==='directory')await walk(h,pre+name+'/',out);else if(VEXT.test(name))out.push({path:pre+name,fh:h})}
  if(SRCF.scan){SRCF.scan.total=out.length;renderSrcBar()}
}
function vidMeta(url){return new Promise(function(res){var v=document.createElement('video'),done=false,to;
  var fin=function(d){if(done)return;done=true;clearTimeout(to);try{v.removeAttribute('src');v.load()}catch(x){}res(d)};
  to=setTimeout(function(){fin(0)},15000);v.preload='metadata';v.muted=true;
  v.onloadedmetadata=function(){fin(isFinite(v.duration)?v.duration:0)};v.onerror=function(){fin(0)};v.src=url})}
async function pool(items,n,fn){var i=0;async function run(){while(i<items.length){var it=items[i++];await fn(it)}}var ws=[];for(var k=0;k<Math.min(n,items.length);k++)ws.push(run());await Promise.all(ws)}
async function srcScan(note){
  if(!SRCF.h||!SRCF.open||SRCF.scan)return;
  SRCF.scan={t:'Đang tìm video trong thư mục',done:0,total:0};render();
  var nNew=0,changed=false;
  try{
    var found=[];await walk(SRCF.h,'',found);
    found.sort(function(a,b){return a.path<b.path?-1:a.path>b.path?1:0});
    var foundPath={};found.forEach(function(f){foundPath[f.path]=1});
    var byPath={},bySig={},seen={};
    Object.keys(LIB).forEach(function(k){var r=LIB[k];byPath[r.path]=r;bySig[r.path.split('/').pop()+'|'+r.size+'|'+r.mtime]=r});
    SRCF.scan={t:'Đang đọc thông tin video',done:0,total:found.length};renderSrcBar();
    for(var i=0;i<found.length;i+=25){
      var part=found.slice(i,i+25);
      var infos=await Promise.all(part.map(async function(it){var f;try{f=await it.fh.getFile()}catch(e){if(isPermErr(e))throw e;return null}
        return {it:it,f:f,id:await sha1(it.path+'|'+f.size+'|'+f.lastModified)}}));
      infos.forEach(function(x){if(!x)return;var r=LIB[x.id];
        if(!r){
          // file sửa tại chỗ (cùng đường dẫn) hoặc file chuyển chỗ (cùng tên, size, mtime): mang nhãn cũ sang id mới
          var old=byPath[x.it.path],moved=false;
          if(!old||seen[old.id]||LIB[old.id]!==old){old=bySig[x.f.name+'|'+x.f.size+'|'+x.f.lastModified];moved=true;if(old&&(foundPath[old.path]||seen[old.id]||LIB[old.id]!==old))old=null}
          r={id:x.id,path:x.it.path,size:x.f.size,mtime:x.f.lastModified,label:baseLabel(x.it.path),p:'',o:'thô',dx:0,d:5,desc:'',tags:[]};
          if(old){r.label=old.label;r.p=old.p;r.o=old.o;r.manual=old.manual;r.guess=old.guess;if(moved){r.dx=old.dx;r.d=old.d;r.desc=old.desc;r.tags=old.tags}
            if(old.url)URL.revokeObjectURL(old.url);delete LIB[old.id];seen[old.id]=1;var di=SRCF.deleted.indexOf(old.id);if(di>=0)SRCF.deleted[di]=x.id}
          else{labelAuto(r);r.o=guessO(x.it.path);nNew++}
          LIB[r.id]=r;changed=true;
        }
        r.path=x.it.path;r.fh=x.it.fh;r.missing=false;if(!r.url)r.url=URL.createObjectURL(x.f);seen[r.id]=1;
      });
      SRCF.scan.done=Math.min(found.length,i+25);renderSrcBar();
    }
    if(applyRulesAll())changed=true; // quy tắc chỉ áp cho video chưa gắn nhãn tay
    Object.keys(LIB).forEach(function(k){var r=LIB[k];if(!seen[k]){r.missing=true;r.fh=null;if(r.url){URL.revokeObjectURL(r.url);r.url=null}}});
    var need=Object.keys(LIB).map(function(k){return LIB[k]}).filter(function(r){return !r.missing&&!r.dx&&!isDel(r.id)});
    if(need.length){SRCF.scan={t:'Đang đọc thời lượng video',done:0,total:need.length};renderSrcBar();
      await pool(need,4,async function(r){var d=await vidMeta(r.url);if(d){r.dx=d;r.d=Math.max(1,Math.round(d));changed=true}else r.bad=true;SRCF.scan.done++;renderSrcBar()})}
    SRCF.scan=null;rebuildSegs();
    var nm=SEGS.filter(function(x){return x.missing}).length;
    if(changed||SRCF.dirty)markDirty(); // dirty có sẵn: dữ liệu vừa chuyển version hoặc lấy từ bản dự phòng
    msg((note?note+' ':'')+'Đã quét "'+SRCF.name+'": '+SEGS.filter(function(x){return !x.missing}).length+' video'+(nNew?', '+nNew+' video mới':'')+(nm?', '+nm+' thẻ mất file':'')+'.');
  }catch(e){SRCF.scan=null;rebuildSegs();if(isPermErr(e))permLost();else{SRCF.err='Lỗi khi quét thư mục: '+errTxt(e);render()}}
}
function rebuildSegs(){
  SEGS=Object.keys(LIB).map(function(k){return LIB[k]}).filter(function(r){return !isDel(r.id)})
    .sort(function(a,b){return (a.missing?1:0)-(b.missing?1:0)||(a.path<b.path?-1:a.path>b.path?1:0)});
}  // dòng có cảnh không còn trong thư viện vẫn giữ id: giao diện hiện "mất cảnh" để chọn lại

/* ---------- xóa / khôi phục (chỉ ẩn thẻ, không đụng file) ---------- */
function segDelete(id){if(!isDel(id))SRCF.deleted.push(id);rebuildSegs();markDirty()}
async function segRestore(id){
  SRCF.deleted=SRCF.deleted.filter(function(x){return x!==id});var r=LIB[id];
  if(r&&!r.missing&&!r.dx&&r.url){var d=await vidMeta(r.url);if(d){r.dx=d;r.d=Math.max(1,Math.round(d))}}
  rebuildSegs();markDirty();render()}

/* ---------- tự lưu ---------- */
function markDirty(){pruneAuto();SRCF.dirty=true;SRCF.ver++;clearTimeout(SRCF.saveT);SRCF.saveT=setTimeout(srcSave,1500);updSaveSt()}
function canWrite(){return !!(SRCF.h&&SRCF.open&&!SRCF.ro&&!SRCF.broken&&!SRCF.newer&&SRCF.perm==='granted')}
async function srcSave(){
  clearTimeout(SRCF.saveT);SRCF.saveT=null;
  if(!SRCF.dirty||!canWrite())return;
  if(SRCF.saving){SRCF.again=true;return}
  SRCF.saving=true;SRCF.again=false;var v=SRCF.ver,retry=0;updSaveSt();
  try{
    if(await permOf(SRCF.h)!=='granted'){permLost();return}
    var l=await readLock();if(lockOther(l)){setRO(l);render();return}
    var x=await xdir(),old=await readTxt(x,'state.json');
    await writePendingAudio();
    var po=old!=null?parseState(old):null;
    if(po){await writeTxt(x,'state.bak.json',old);
      var ov=+po.version||1;if(ov<STATE_VER){var vn='state.v'+ov+'.bak.json';if(await readTxt(x,vn)==null)await writeTxt(x,vn,old)}} // bản trước khi nâng version giữ lâu dài
    var txt=JSON.stringify(stateObj(),null,1);SRCF.big=txt.length>BIG_STATE?txt.length:0;
    await writeTxt(x,'state.json',txt);
    await writeLock();
    SRCF.savedAt=Date.now();if(SRCF.err.indexOf('Chưa lưu')===0)SRCF.err='';if(SRCF.ver===v)SRCF.dirty=false;
  }catch(e){if(isPermErr(e))permLost();else{SRCF.err='Chưa lưu được state.json: '+errTxt(e)+'. Thay đổi vẫn giữ trong bộ nhớ, tool sẽ thử lại.';retry=10000;renderSrcBar()}}
  finally{SRCF.saving=false;
    if(SRCF.dirty&&canWrite()&&(SRCF.again||SRCF.ver!==v||retry)){SRCF.again=false;clearTimeout(SRCF.saveT);SRCF.saveT=setTimeout(srcSave,retry||1500)}
    updSaveSt()}
}
function srcFlush(){touchClips(true);if(SRCF.dirty)srcSave()}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')srcFlush();else if(SRCF.h&&SRCF.open&&SRCF.ro)srcCheckRO(false)});
window.addEventListener('pagehide',function(){try{if(SRCF.open&&!SRCF.ro)sessionStorage.setItem('xuongclip_left',SRCF.me)}catch(e){}srcFlush();releaseLock()});
window.addEventListener('pageshow',function(e){if(e.persisted&&SRCF.open&&!SRCF.ro&&SRCF.perm==='granted')takeLock().then(function(){render()}).catch(function(){})});

/* ---------- hiển thị trạng thái ---------- */
function saveStatus(){
  if(!SRCF.h)return '';
  if(SRCF.ro)return 'Chỉ đọc: thư mục đang mở ở nơi khác, thay đổi ở tab này không được lưu.';
  if(SRCF.broken)return 'Không ghi: dữ liệu cũ bị hỏng, xem thông báo phía trên.';
  if(SRCF.newer)return 'Không ghi: dữ liệu do bản tool mới hơn tạo, xem thông báo phía trên.';
  if(SRCF.perm!=='granted')return SRCF.dirty?'Chưa có quyền ghi. Thay đổi đang giữ trong bộ nhớ, sẽ ghi khi cấp lại quyền.':'Chưa có quyền đọc thư mục.';
  if(SRCF.saving)return 'Đang lưu vào .xuongclip/state.json...';
  if(SRCF.dirty)return 'Có thay đổi, sẽ tự lưu sau 1,5 giây.';
  if(SRCF.savedAt)return 'Đã lưu vào .xuongclip/state.json lúc '+clock(SRCF.savedAt)+'.';
  return 'Dữ liệu thư viện nằm ở .xuongclip/state.json trong thư mục này.';
}
function updSaveSt(){var e=document.getElementById('savest');if(e)e.textContent=saveStatus();updSaveBadge()}
function renderSrcBar(){
  var el=document.getElementById('srcbar');if(!el)return;var h='',nm=esc(SRCF.name);
  if(!SRCF.ok)h+='<div class="w bad">Trình duyệt này không đọc được thư mục trên máy, nên thư viện source không dùng được. Hãy mở tool bằng Chrome hoặc Edge trên máy tính.</div>';
  else if(SRCF.h&&SRCF.perm&&SRCF.perm!=='granted')h+='<div class="w bad srcw">'+(SRCF.open?'Tool vừa mất quyền với thư mục "'+nm+'". Thay đổi vẫn giữ trong bộ nhớ.':'Thư mục source "'+nm+'" cần được cấp quyền lại sau khi mở tool.')+' <button class="btn sm pri" data-act="srcgrant">Bấm để cấp quyền lại cho thư mục "'+nm+'"</button></div>';
  if(SRCF.ro)h+='<div class="w bad srcw">Thư mục "'+nm+'" đang được mở ở tab hoặc máy khác (cập nhật lúc '+clock(SRCF.roAt)+'). Tab này chỉ đọc, mọi thay đổi ở đây không được lưu. Đóng nơi kia rồi bấm kiểm tra lại (khóa tự hết hạn sau 2 phút không cập nhật). <button class="btn sm" data-act="srccheck">Kiểm tra lại</button></div>';
  if(SRCF.newer)h+='<div class="w bad">Dữ liệu trong .xuongclip/state.json được tạo bởi bản tool mới hơn (version '+SRCF.newer+', bản này hiểu tới version '+STATE_VER+'). Bản này chỉ đọc và không ghi gì để tránh làm mất dữ liệu. Hãy cập nhật tool: mở đúng địa chỉ bản mới hoặc tải lại trang (Ctrl+F5).</div>';
  if(SRCF.broken)h+='<div class="w bad srcw">'+esc(SRCF.broken)+' <button class="btn sm" data-act="srcfresh">Bắt đầu dữ liệu mới</button></div>';
  if(SRCF.err)h+='<div class="w bad">'+esc(SRCF.err)+'</div>';
  if(SRCF.big)h+='<div class="w warn">.xuongclip/state.json đang lớn ('+(SRCF.big/1048576).toFixed(1)+' MB). Nên lưu trữ hoặc xóa bớt các đợt cũ để tool mở nhanh hơn.</div>';
  if(SRCF.scan){var sc=SRCF.scan;h+='<div class="w ok scanw">'+esc(sc.t)+(sc.total?': '+sc.done+'/'+sc.total:'')+'...'+(sc.total&&sc.t!=='Đang tìm video trong thư mục'?'<progress max="'+sc.total+'" value="'+sc.done+'"></progress>':'')+'</div>'}
  el.innerHTML=h;updSaveBadge();
}

/* ---------- hình thu nhỏ: chỉ tạo khi thẻ hiện ra ---------- */
var THQ=[],THN=0,THO=null;
function observeThumbs(){
  if(THO){THO.disconnect();THO=null}
  var els=document.querySelectorAll('[data-th]');if(!els.length)return;
  var want=function(r){return r&&!r.thumb&&r.url&&!r.bad&&!r.thBusy};
  if(!('IntersectionObserver' in window)){els.forEach(function(el){var r=LIB[el.dataset.th];if(want(r)){r.thBusy=1;THQ.push(r)}});thumbNext();return}
  THO=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;THO.unobserve(e.target);var r=LIB[e.target.dataset.th];if(want(r)){r.thBusy=1;THQ.push(r);thumbNext()}})},{rootMargin:'300px'});
  els.forEach(function(el){if(want(LIB[el.dataset.th]))THO.observe(el)});
}
function thumbNext(){while(THN<2&&THQ.length){var r=THQ.shift();THN++;makeThumb(r).then(function(){THN--;thumbNext()})}}
function makeThumb(r){return new Promise(function(res){
  var v=document.createElement('video'),done=false,to;
  var fin=function(){if(done)return;done=true;clearTimeout(to);try{v.removeAttribute('src');v.load()}catch(x){}r.thBusy=0;res()};
  to=setTimeout(fin,15000);v.preload='metadata';v.muted=true;v.playsInline=true;
  v.onloadedmetadata=function(){if(!r.dx&&isFinite(v.duration)&&v.duration){r.dx=v.duration;r.d=Math.max(1,Math.round(v.duration));markDirty()}try{v.currentTime=Math.min(1,(v.duration||2)/2)}catch(x){fin()}};
  v.onseeked=function(){try{var cv=document.createElement('canvas');cv.width=180;cv.height=Math.round(180*(v.videoHeight||16)/(v.videoWidth||9));cv.getContext('2d').drawImage(v,0,0,cv.width,cv.height);r.thumb=cv.toDataURL('image/jpeg',0.6);
    document.querySelectorAll('[data-th="'+r.id+'"]').forEach(function(el){el.style.backgroundImage='url('+r.thumb+')';el.querySelectorAll('.thtx').forEach(function(t){t.textContent=''})})}catch(x){}fin()};
  v.onerror=function(){r.bad=true;fin()};
  if(!r.url){fin();return}v.src=r.url})}
