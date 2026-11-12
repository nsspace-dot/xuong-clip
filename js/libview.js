/* Tab Thư viện source: bộ lọc, tìm kiếm, chọn nhiều, gắn hàng loạt, hoàn tác.
   Cài đặt: danh mục sản phẩm, tên tương đương, quy tắc tự gắn nhãn, video đã xóa.
   Sự kiện riêng dùng thuộc tính data-lact / data-lf để không lẫn với events.js. */
S.lf={prods:[],st:[],unl:false,guess:false,miss:false,ai:'',used:'',q:''};
S.sel={};S.selLast=null;S.undo=null;S.tagging=false;S.tagStop=false;

/* ---------- lọc ---------- */
function usedInCur(){var c=clip(S.cur),o={};if(c)c.lines.forEach(function(l){if(l.seg)o[l.seg]=1});return o}
function libList(){
  var f=S.lf,q=pkey(f.q),uc=usedInCur();
  return SEGS.filter(function(x){
    return (!f.prods.length||f.prods.indexOf(x.p)>=0)&&(!f.st.length||f.st.indexOf(x.o)>=0)&&(!f.unl||!x.p)&&(!f.guess||(x.p&&x.guess))&&(!f.miss||x.missing)&&
      (!f.ai||(f.ai==='yes'?!!x.desc:!x.desc))&&(!f.used||(f.used==='yes'?!!uc[x.id]:!uc[x.id]))&&(!q||pkey(x.label+' '+x.path).indexOf(q)>=0)})}
function lfActive(){var f=S.lf;return !!(f.prods.length||f.st.length||f.unl||f.guess||f.miss||f.ai||f.used||f.q)}
function lfReset(){S.lf={prods:[],st:[],unl:false,guess:false,miss:false,ai:'',used:'',q:''}}
function selIds(){return Object.keys(S.sel).filter(function(id){return !!seg(id)})}

/* ---------- các mảnh giao diện ---------- */
function srcBox(){
  var h='<div class="box srcbox"><h2>Thư mục source</h2>';
  if(!SRCF.ok)return h+'<div class="meta">Trình duyệt này không đọc được thư mục trên máy. Hãy mở tool bằng Chrome hoặc Edge trên máy tính.</div></div>';
  if(SRCF.h){var nv=SEGS.filter(function(x){return !x.missing}).length,nm=SEGS.length-nv,nd=SRCF.deleted.length;
    h+='<div>Đang dùng: <b>'+esc(SRCF.name)+'</b>'+(SRCF.open?' · '+nv+' video'+(nm?' · '+nm+' thẻ mất file':'')+(nd?' · '+nd+' đã xóa (khôi phục ở tab Cài đặt)':''):'')+' <span class="meta" id="savest">'+esc(saveStatus())+'</span></div>'}
  else h+='<div class="meta">Chưa chọn thư mục. Bấm nút bên dưới và chọn thư mục chứa video quay sẵn (có thể có thư mục con). Chrome sẽ hỏi quyền xem và sửa: quyền sửa chỉ dùng để ghi thư mục con .xuongclip, tool không bao giờ xóa, đổi tên hay di chuyển file video.</div>';
  return h+'<div class="bar"><button class="btn pri" data-act="srcpick" '+(SRCF.scan?'disabled':'')+'>'+(SRCF.h?'Đổi thư mục source':'Chọn thư mục source')+'</button>'+
   (SRCF.h&&SRCF.open&&SRCF.perm==='granted'?'<button class="btn" data-act="srcscan" '+(SRCF.scan?'disabled':'')+'>Quét lại</button><button class="btn" data-lact="rapply">Áp lại quy tắc cho video chưa gắn nhãn</button><a class="btn" href="#caidat">Danh mục và quy tắc</a>':'')+'</div></div>';
}
function mergeBanner(){var all=mergeSuggestions();return all.slice(0,3).map(mergeRow).join('')+(all.length>3?'<div class="meta">Còn '+(all.length-3)+' cặp tên gần giống khác.</div>':'')}
function mergeRow(s){var a=esc(s[0]),b=esc(s[1]);
  return '<div class="w warn mergew">Tên gần giống: <b>'+a+'</b> và <b>'+b+'</b>, gộp thành một? '+
   '<button class="btn sm" data-lact="merge" data-keep="'+a+'" data-drop="'+b+'">Gộp, giữ "'+a+'"</button> '+
   '<button class="btn sm" data-lact="merge" data-keep="'+b+'" data-drop="'+a+'">Gộp, giữ "'+b+'"</button> '+
   '<button class="btn sm" data-lact="mskip" data-a="'+a+'" data-b="'+b+'">Bỏ qua</button></div>'}
function prodList(id){return '<datalist id="'+id+'">'+PRODUCTS.map(function(p){return '<option value="'+esc(p.name)+'">'}).join('')+'</datalist>'}
function lfBar(){
  var f=S.lf,cur=clip(S.cur),chip=function(on,attr,val,txt){return '<button class="chip '+(on?'on':'')+'" data-lf="'+attr+'" data-v="'+esc(val)+'">'+txt+'</button>'};
  f.prods=f.prods.filter(function(n){return !!findProduct(n)});
  var nsel=selIds().length;
  return '<div class="libbar">'+
   '<div class="lfrow"><input type="search" id="libq" placeholder="Tìm theo tên hoặc đường dẫn" value="'+esc(f.q)+'" aria-label="Tìm video" style="max-width:260px">'+
    ['thô','đã dựng','đã đăng'].map(function(o){return chip(f.st.indexOf(o)>=0,'st',o,o)}).join('')+
    chip(f.unl,'unl','1','Chưa gắn nhãn')+chip(f.guess,'guess','1','Nhãn đoán')+chip(f.miss,'miss','1','Mất file')+
    '<select data-lfs="ai" aria-label="Lọc theo tag AI"><option value="">Tag AI: tất cả</option><option value="yes" '+(f.ai==='yes'?'selected':'')+'>Đã tag AI</option><option value="no" '+(f.ai==='no'?'selected':'')+'>Chưa tag AI</option></select>'+
    '<select data-lfs="used" aria-label="Lọc theo clip đang mở" '+(cur?'':'disabled title="Chưa mở clip nào ở tab Ghép clip"')+'><option value="">Clip đang mở'+(cur?' ('+esc(cur.id)+')':'')+': tất cả</option><option value="yes" '+(f.used==='yes'?'selected':'')+'>Đã dùng trong clip đang mở</option><option value="no" '+(f.used==='no'?'selected':'')+'>Chưa dùng</option></select>'+
    (lfActive()?'<button class="btn sm" data-lact="lfreset">Bỏ lọc</button>':'')+'</div>'+
   (PRODUCTS.length?'<div class="lfrow prods"><span class="meta">Sản phẩm:</span>'+PRODUCTS.map(function(p){return chip(f.prods.indexOf(p.name)>=0,'prod',p.name,esc(p.name)+' <small>'+prodCount(p.name)+'</small>')}).join('')+'</div>':'')+
   '<div class="lfrow selrow"><b id="libcnt"></b><span id="selcnt" class="meta"></span>'+
    '<button class="btn sm" data-lact="selall">Chọn tất cả đang lọc</button><button class="btn sm" data-lact="selnone" data-needsel>Bỏ chọn</button>'+
    '<span class="sep"></span><input type="text" id="bulkp" list="plist" placeholder="Sản phẩm (chọn hoặc gõ mới)" style="max-width:210px" aria-label="Sản phẩm để gán"><button class="btn sm pri" data-lact="bprod" data-needsel>Gán sản phẩm</button>'+
    '<select id="bulko" style="width:auto" aria-label="Trạng thái để đổi"><option>thô</option><option>đã dựng</option><option>đã đăng</option></select><button class="btn sm" data-lact="bstat" data-needsel>Đổi trạng thái</button>'+
    '<button class="btn sm" data-lact="bconf" data-needsel title="Biến nhãn đoán thành nhãn chắc chắn">Xác nhận nhãn đoán</button>'+
    '<button class="btn sm" data-lact="bdel" data-needsel title="Chỉ ẩn thẻ, không xóa file video">Xóa mềm</button>'+
    (S.tagging?'<button class="btn sm" data-lact="tagstop">Dừng AI</button>':'<button class="btn sm" data-lact="btag" data-needsel>AI gắn tag</button><label class="ck sm"><input type="checkbox" id="retag"> gắn lại cả video đã có tag</label>')+
    (S.undo?'<button class="btn sm" data-lact="undo">Hoàn tác: '+esc(S.undo.label)+'</button>':'')+
   '</div><div class="meta" id="tagst">'+(S.tagging?'AI đang gắn tag...':'')+'</div>'+prodList('plist')+'</div>';
}
function cardHTML(x,used){
  var badge=!x.p?'<span class="bdg none">chưa gắn</span>':x.manual?'<span class="bdg man" title="Gắn tay, không bị quy tắc ghi đè">tay</span>':x.guess?'<button class="bdg gs" data-lact="conf" data-id="'+x.id+'" title="Nhãn đoán. Bấm để xác nhận">đoán ✓</button>':'<span class="bdg rule" title="Gắn theo quy tắc">quy tắc</span>';
  var dir=x.path.indexOf('/')>=0?x.path.slice(0,x.path.lastIndexOf('/')):'';
  return '<div class="card cmp'+(x.missing?' gone':'')+(S.sel[x.id]?' picked':'')+'" data-card="'+x.id+'">'+
   '<div class="thumb" data-th="'+x.id+'" style="'+bg(x)+'"><span class="thtx">'+(x.missing?'MẤT FILE':(x.thumb?'':esc(x.p||'?')))+'</span>'+
    '<label class="selb" title="Chọn (giữ Shift để chọn một dãy)"><input type="checkbox" data-selc="'+x.id+'" '+(S.sel[x.id]?'checked':'')+' aria-label="Chọn video"></label></div>'+
   '<div class="cbody"><input type="text" class="nm" data-sl="'+x.id+'" value="'+esc(x.label)+'" aria-label="Tên thẻ" title="'+esc(x.path)+'">'+
   (dir?'<div class="meta path" title="'+esc(x.path)+'">'+esc(dir)+'</div>':'')+
   '<div class="prow2"><input type="text" class="pin'+(x.guess?' gsi':'')+'" list="plist" data-sp="'+x.id+'" value="'+esc(x.p)+'" placeholder="Sản phẩm" aria-label="Sản phẩm">'+badge+'</div>'+
   '<div class="prow2"><select data-so="'+x.id+'" aria-label="Nguồn gốc">'+OSTAT.map(function(o){return '<option '+(o===x.o?'selected':'')+'>'+o+'</option>'}).join('')+'</select>'+
    (x.url?'<button class="btn xs" data-pv="'+x.id+'||" title="Xem video" aria-label="Xem video">▶</button>':'')+'<button class="btn xs" data-delseg="'+x.id+'" title="Xóa thẻ (chỉ ẩn khỏi thư viện, không xóa file video)" aria-label="Xóa thẻ">✕</button></div>'+
   '<div class="meta">'+(x.dx?fmt1(x.dx):'?')+'s · '+(used[x.id]?'<span title="'+esc(used[x.id].at.join(', '))+'">dùng '+used[x.id].n+'</span>'+(used[x.id].dup?' <b class="lost" title="Có đoạn chồng nhau giữa các clip cùng gian">trùng</b>':''):'dùng 0')+(x.desc?' · <span title="'+esc(x.desc+(x.tags||[]).map(function(t){return '\n'+t.a.toFixed(0)+'–'+t.b.toFixed(0)+'s: '+t.d}).join(''))+'">AI ✓</span>':'')+(x.missing?' · <b class="lost">mất file</b>':x.bad?' · <b class="lost">không phát được</b>':'')+'</div></div></div>';
}
function libGrid(){
  var list=libList(),used={};CLIPS.forEach(function(c){c.lines.forEach(function(l,i){if(l.seg){var u=used[l.seg]=used[l.seg]||{n:0,at:[],dup:false};u.n++;u.at.push(c.id+' dòng '+(i+1));if(dupsOf(c,i).length)u.dup=true}})});
  return list.length?'<div class="grid cgrid">'+list.map(function(x){return cardHTML(x,used)}).join('')+'</div>':'<div class="empty">Không có video nào khớp bộ lọc.</div>';
}
function vThuvien(){
  var h='<h1>Thư viện source</h1><p class="sub">Video đọc thẳng từ thư mục trên máy, không chép vào trình duyệt. Sản phẩm, trạng thái và tag lưu trong thư mục con .xuongclip.</p>'+srcBox();
  if(!SEGS.length)return h+'<div class="empty">'+(SRCF.h&&SRCF.open&&!SRCF.scan?'Không thấy video nào (.mp4, .mov, .m4v, .webm) trong thư mục này.':'Thư viện đang trống.')+'</div>';
  var nu=SEGS.filter(function(x){return !x.p}).length,ng=SEGS.filter(function(x){return x.p&&x.guess}).length;
  h+=mergeBanner();
  if(nu||ng)h+='<div class="w warn remind">'+(nu?'<button class="lnk" data-lact="fUnl">'+nu+' video chưa gắn nhãn</button>':'')+(nu&&ng?' · ':'')+(ng?'<button class="lnk" data-lact="fGuess">'+ng+' nhãn đoán chưa xác nhận</button>':'')+'</div>';
  return h+lfBar()+'<div id="libres">'+libGrid()+'</div>';
}
function updLib(){var r=document.getElementById('libres');if(!r)return;r.innerHTML=libGrid();updSelUI();observeThumbs()}
function updSelUI(){
  var n=libList().length,s=selIds().length,a=document.getElementById('libcnt'),b=document.getElementById('selcnt');
  if(a)a.textContent=n+' / '+SEGS.length+' video';if(b)b.textContent=s?'· đã chọn '+s:'';
  document.querySelectorAll('[data-needsel]').forEach(function(e){e.disabled=!s});
  document.querySelectorAll('.card[data-card]').forEach(function(e){e.classList.toggle('picked',!!S.sel[e.dataset.card])});
}

/* ---------- Cài đặt: danh mục, quy tắc, đã xóa ---------- */
function needFolder(t){return '<div class="set"><b>'+t+'</b><div class="meta">Lưu trong thư mục source. Hãy chọn thư mục ở tab Thư viện source trước.</div></div>'}
function catalogSettings(){
  if(!SRCF.h||!SRCF.open)return needFolder('Danh mục sản phẩm');
  return '<div class="set"><b>Danh mục sản phẩm</b><div class="meta">Mỗi sản phẩm có một tên chuẩn và các tên tương đương (viết khác, viết sai). Khi gõ hay khi quy tắc gắn nhãn, tên tương đương tự đổi về tên chuẩn. Đổi tên chuẩn thì mọi video và clip theo tên cũ được cập nhật, tên cũ thành tên tương đương. So khớp không phân biệt hoa thường, có dấu hay không.</div>'+
   mergeBanner()+
   (PRODUCTS.length?'<div class="ptable">'+PRODUCTS.map(function(p){var n=esc(p.name);return '<div class="prow">'+
     '<input type="text" data-pren="'+n+'" value="'+n+'" aria-label="Tên chuẩn" class="pname"><span class="meta pc">'+prodCount(p.name)+' video</span>'+
     '<span class="als">'+p.aliases.map(function(a){return '<span class="alias">'+esc(a)+'<button data-lact="aldel" data-p="'+n+'" data-a="'+esc(a)+'" aria-label="Bỏ tên tương đương '+esc(a)+'">×</button></span>'}).join('')+
     '<input type="text" data-pal="'+n+'" placeholder="+ tên tương đương" aria-label="Thêm tên tương đương cho '+n+'" class="alin"></span>'+
     '<button class="btn xs" data-lact="pdelp" data-p="'+n+'">Xóa</button></div>'}).join('')+'</div>':'<div class="meta">Danh mục trống. Sản phẩm được thêm khi bạn gắn nhãn, khi quét theo quy tắc hoặc thêm ở đây.</div>')+
   '<div class="bar" style="margin-top:0"><input type="text" id="pnewp" placeholder="Tên sản phẩm mới" style="max-width:260px" aria-label="Tên sản phẩm mới"><button class="btn" data-lact="paddp">Thêm sản phẩm</button></div></div>';
}
function rulesSettings(){
  if(!SRCF.h||!SRCF.open)return needFolder('Quy tắc tự gắn nhãn');
  return '<div class="set"><b>Quy tắc tự gắn nhãn</b><div class="meta">Đường dẫn của video (tên thư mục hoặc tên file) chứa chuỗi bên trái thì gắn sản phẩm bên phải. Quy tắc đứng trên được ưu tiên. Quy tắc tự chạy mỗi lần quét và chỉ áp cho video chưa gắn nhãn tay; nhãn gắn tay không bao giờ bị ghi đè.</div>'+
   (PRULES.length?PRULES.map(function(r,i){return '<div class="prow"><span class="meta">'+(i+1)+'.</span><input type="text" data-rc="'+i+'" value="'+esc(r.contains)+'" aria-label="Chuỗi cần chứa" style="max-width:220px"><span>→</span>'+
     '<input type="text" list="plist2" data-rp="'+i+'" value="'+esc(r.product)+'" aria-label="Sản phẩm" style="max-width:220px"><span class="meta">khớp '+ruleCount(r)+' video</span>'+
     '<button class="btn xs" data-lact="rup" data-i="'+i+'" '+(i?'':'disabled')+' aria-label="Lên">↑</button><button class="btn xs" data-lact="rdown" data-i="'+i+'" '+(i<PRULES.length-1?'':'disabled')+' aria-label="Xuống">↓</button><button class="btn xs" data-lact="rdel" data-i="'+i+'">Xóa</button></div>'}).join(''):'<div class="meta">Chưa có quy tắc nào.</div>')+
   '<div class="bar" style="margin-top:0"><input type="text" id="rnewc" placeholder="Chuỗi, ví dụ: laser" style="max-width:220px" aria-label="Chuỗi mới"><span>→</span><input type="text" id="rnewp" list="plist2" placeholder="Sản phẩm" style="max-width:220px" aria-label="Sản phẩm của quy tắc mới"><button class="btn" data-lact="radd">Thêm quy tắc</button></div>'+
   '<div class="bar" style="margin-top:0"><button class="btn pri" data-lact="rapply">Áp lại quy tắc cho video chưa gắn nhãn</button></div>'+prodList('plist2')+'</div>';
}
function deletedSettings(){
  var ids=SRCF.deleted;
  return '<div class="set"><b>Video đã xóa khỏi thư viện</b><div class="meta">Nút Xóa ở thư viện chỉ ẩn thẻ, file video vẫn nằm nguyên trong thư mục source. Bấm Khôi phục để hiện lại thẻ cùng nhãn cũ.</div>'+
   (!SRCF.h?'<div class="meta">Chưa chọn thư mục source.</div>':!ids.length?'<div class="meta">Chưa xóa video nào.</div>':
    ids.map(function(id){var r=LIB[id];return '<div class="bar" style="margin-top:0"><span class="path">'+esc(r?r.path:'(id '+sid(id)+')')+'</span>'+(r&&r.missing?'<span class="meta">mất file</span>':'')+'<button class="btn sm" data-act="srcrestore" data-id="'+esc(id)+'">Khôi phục</button></div>'}).join('')+
    (ids.length>1?'<div class="bar" style="margin-top:0"><button class="btn sm" data-act="srcrestoreall">Khôi phục tất cả</button></div>':''))+'</div>';
}

/* ---------- hàng loạt + hoàn tác ---------- */
function snap(ids,label){S.undo={label:label,recs:ids.map(function(id){var r=LIB[id];return {id:id,p:r.p,manual:!!r.manual,guess:!!r.guess,o:r.o}}),deleted:SRCF.deleted.slice(),products:JSON.stringify(PRODUCTS)}}
function undoLast(){var u=S.undo;if(!u)return;
  u.recs.forEach(function(x){var r=LIB[x.id];if(r){r.p=x.p;r.manual=x.manual;r.guess=x.guess;r.o=x.o}});
  SRCF.deleted=u.deleted;PRODUCTS=JSON.parse(u.products);S.undo=null;rebuildSegs();markDirty();msg('Đã hoàn tác: '+u.label+'.')}
function bulk(kind){
  var ids=selIds();if(!ids.length)return;
  if(kind==='bprod'){var v=cleanName((document.getElementById('bulkp')||{}).value);if(!v){msg('Gõ hoặc chọn tên sản phẩm trước khi gán.');return}
    snap(ids,'gán sản phẩm cho '+ids.length+' video');var n=ensureProduct(v);ids.forEach(function(id){setManualProd(LIB[id],n)});markDirty();msg('Đã gán "'+n+'" cho '+ids.length+' video.');return}
  if(kind==='bstat'){var o=(document.getElementById('bulko')||{}).value;snap(ids,'đổi trạng thái '+ids.length+' video');ids.forEach(function(id){LIB[id].o=o});markDirty();msg('Đã đổi '+ids.length+' video sang "'+o+'".');return}
  if(kind==='bconf'){var g=ids.filter(function(id){return LIB[id].p&&LIB[id].guess});if(!g.length){msg('Trong các video đang chọn không có nhãn đoán nào.');return}
    snap(g,'xác nhận '+g.length+' nhãn đoán');g.forEach(function(id){LIB[id].guess=false;LIB[id].manual=true});markDirty();msg('Đã xác nhận '+g.length+' nhãn đoán.');return}
  if(kind==='bdel'){if(!confirm('Ẩn '+ids.length+' thẻ khỏi thư viện? File video vẫn nằm nguyên trong thư mục, khôi phục được ở Cài đặt hoặc bấm Hoàn tác.'))return;
    snap(ids,'xóa mềm '+ids.length+' video');ids.forEach(function(id){if(!isDel(id))SRCF.deleted.push(id)});S.sel={};rebuildSegs();markDirty();msg('Đã ẩn '+ids.length+' thẻ.');return}
  if(kind==='btag'){var re=(document.getElementById('retag')||{}).checked,list=ids.map(function(id){return LIB[id]}).filter(function(r){return r.url&&(re||!r.desc)});
    var skip=ids.length-list.length;if(!list.length){msg('Không có video nào cần gắn tag'+(skip?' ('+skip+' video đã có tag hoặc mất file; tích "gắn lại" nếu muốn chạy lại)':'')+'.');return}
    tagMany(list)}
}

/* ---------- sự kiện ---------- */
document.addEventListener('click',function(e){
  var cb=e.target.closest('input[data-selc]');
  if(cb){var id=cb.dataset.selc,on=cb.checked;
    if(e.shiftKey&&S.selLast&&S.selLast!==id){var ids=libList().map(function(x){return x.id}),a=ids.indexOf(S.selLast),b=ids.indexOf(id);
      if(a>=0&&b>=0){for(var i=Math.min(a,b);i<=Math.max(a,b);i++){if(on)S.sel[ids[i]]=1;else delete S.sel[ids[i]]}
        document.querySelectorAll('input[data-selc]').forEach(function(c){c.checked=!!S.sel[c.dataset.selc]})}}
    else{if(on)S.sel[id]=1;else delete S.sel[id]}
    S.selLast=id;updSelUI();return}
  var el=e.target.closest('[data-lact],[data-lf]');if(!el)return;var d=el.dataset,err='';
  if(d.lf){var f=S.lf;
    if(d.lf==='st'||d.lf==='prod'){var arr=d.lf==='st'?f.st:f.prods,k=arr.indexOf(d.v);if(k>=0)arr.splice(k,1);else arr.push(d.v)}
    else f[d.lf]=!f[d.lf];render();return}
  switch(d.lact){
    case 'lfreset':lfReset();render();return;
    case 'fUnl':lfReset();S.lf.unl=true;render();return;
    case 'fGuess':lfReset();S.lf.guess=true;render();return;
    case 'selall':libList().forEach(function(x){S.sel[x.id]=1});updSelUI();document.querySelectorAll('input[data-selc]').forEach(function(c){c.checked=!!S.sel[c.dataset.selc]});return;
    case 'selnone':S.sel={};updSelUI();document.querySelectorAll('input[data-selc]').forEach(function(c){c.checked=false});return;
    case 'bprod':case 'bstat':case 'bconf':case 'bdel':case 'btag':bulk(d.lact);return;
    case 'undo':undoLast();return;
    case 'tagstop':S.tagStop=true;var ts=document.getElementById('tagst');if(ts)ts.textContent='Đang dừng sau video hiện tại...';return;
    case 'conf':var r=LIB[d.id];if(r&&r.p){r.guess=false;r.manual=true;markDirty();render()}return;
    case 'merge':if(!confirm('Gộp "'+d.drop+'" vào "'+d.keep+'"? Mọi video và clip theo "'+d.drop+'" sẽ chuyển sang "'+d.keep+'", "'+d.drop+'" thành tên tương đương.'))return;
      err=mergeProducts(d.keep,d.drop);if(err){msg(err);return}markDirty();msg('Đã gộp "'+d.drop+'" vào "'+d.keep+'".');return;
    case 'mskip':skipMerge(d.a,d.b);markDirty();render();return;
    case 'paddp':var pn=document.getElementById('pnewp');err=addProduct(pn?pn.value:'');if(err){msg(err);return}markDirty();render();return;
    case 'pdelp':var pc=prodCount(d.p),nr=PRULES.filter(function(r){return r.product===d.p}).length;
      if(!confirm('Xóa sản phẩm "'+d.p+'" khỏi danh mục?'+(pc?' '+pc+' video đang gắn sẽ chuyển về "chưa gắn nhãn".':'')+(nr?' '+nr+' quy tắc dùng sản phẩm này cũng bị xóa.':'')))return;
      err=deleteProduct(d.p);if(err){msg(err);return}S.lf.prods=S.lf.prods.filter(function(x){return x!==d.p});markDirty();msg('Đã xóa sản phẩm "'+d.p+'".');return;
    case 'aldel':removeAlias(d.p,d.a);markDirty();render();return;
    case 'radd':var rc=cleanName((document.getElementById('rnewc')||{}).value),rp=cleanName((document.getElementById('rnewp')||{}).value);
      if(!rc||!rp){msg('Quy tắc cần cả chuỗi và tên sản phẩm.');return}PRULES.push({contains:rc,product:ensureProduct(rp)});markDirty();msg('Đã thêm quy tắc. Bấm "Áp lại quy tắc cho video chưa gắn nhãn" để gắn ngay.');return;
    case 'rup':case 'rdown':var i=+d.i,j=d.lact==='rup'?i-1:i+1;if(j<0||j>=PRULES.length)return;var t=PRULES[i];PRULES[i]=PRULES[j];PRULES[j]=t;markDirty();render();return;
    case 'rdel':PRULES.splice(+d.i,1);markDirty();render();return;
    case 'rapply':if(!SRCF.open)return;var n=applyRulesAll();rebuildSegs();if(n)markDirty();msg(n?'Đã cập nhật nhãn cho '+n+' video (nhãn gắn tay giữ nguyên).':'Không có video nào cần đổi nhãn (nhãn gắn tay giữ nguyên).');return;
  }
});
document.addEventListener('input',function(e){if(e.target.id==='libq'){S.lf.q=e.target.value;updLib()}});
document.addEventListener('change',function(e){var t=e.target,d=t.dataset,err='';
  if(d.lfs){S.lf[d.lfs]=t.value;render();return}
  if(d.pren!==undefined){err=renameProduct(d.pren,t.value);
    if(err.indexOf('merge:')===0){var o=err.slice(6);if(confirm('"'+cleanName(t.value)+'" đã có trong danh mục (sản phẩm "'+o+'"). Gộp "'+d.pren+'" vào "'+o+'"?')){err=mergeProducts(o,d.pren);if(!err){markDirty();msg('Đã gộp "'+d.pren+'" vào "'+o+'".');return}}else{render();return}}
    if(err){msg(err);return}S.lf.prods=[];markDirty();msg('Đã đổi tên chuẩn thành "'+cleanName(t.value)+'". Mọi video và clip theo tên cũ đã cập nhật.');return}
  if(d.pal!==undefined){err=addAlias(d.pal,t.value);if(err){msg(err);return}markDirty();render();return}
  if(d.rc!==undefined){var r=PRULES[+d.rc];if(r&&cleanName(t.value)){r.contains=cleanName(t.value);markDirty()}render();return}
  if(d.rp!==undefined){var r2=PRULES[+d.rp];if(r2&&cleanName(t.value)){r2.product=ensureProduct(t.value);markDirty()}render();return}
});
