/* Tab Kịch bản: nạp kịch bản theo đợt (thêm vào, không đè), hỏi khi trùng mã clip,
   lọc theo đợt, lưu trữ đợt, xóa mềm có hoàn tác. Sự kiện dùng data-kact / data-impch. */
S.kbBatch=null;S.batchIn='';S.imp=null;S.clipUndo=null;

function kbWhere(c){return ARCH.indexOf(c)>=0?'đợt đã lưu trữ':TRASH.indexOf(c)>=0?'đã xóa':'đang mở'}
function batchName(b){return b||'(chưa ghi đợt)'}
function impBox(){
  var im=S.imp,conf=im.fresh.filter(function(n){return !!clipById(n.id)}),nw=im.fresh.length-conf.length;
  return '<div class="box impbox"><h2>Mã clip đã có</h2><div class="meta">Kịch bản vừa dán có '+im.fresh.length+' clip'+(nw?', '+nw+' clip mới sẽ được thêm':'')+'. '+conf.length+' clip trùng mã với clip đã có, chọn cách xử lý cho từng clip:</div>'+
   conf.map(function(n){var ex=clipById(n.id),ch=im.ch[n.id]||'update';return '<div class="prow"><b>'+esc(n.id)+'</b><span class="meta">'+esc(ex.name)+' · đợt '+esc(batchName(ex.batch))+' · '+kbWhere(ex)+'</span>'+
     '<select data-impch="'+esc(n.id)+'" style="width:auto"><option value="update" '+(ch==='update'?'selected':'')+'>Cập nhật lời, giữ cảnh đã chọn ở dòng không đổi</option><option value="copy" '+(ch==='copy'?'selected':'')+'>Tạo bản mới (mã '+esc(uniqueClipId(n.id))+')</option><option value="skip" '+(ch==='skip'?'selected':'')+'>Bỏ qua clip này</option></select></div>'}).join('')+
   '<div class="bar"><button class="btn pri" data-kact="impok">Áp dụng</button><button class="btn" data-kact="impno">Hủy</button></div></div>'}
function vKichban(){
  var h='<h1>Kịch bản</h1><p class="sub">Nạp kịch bản mỗi tuần: clip mới được thêm vào danh sách, không đè clip cũ. Mọi thay đổi tự lưu vào thư mục source.</p>';
  if(!SRCF.h||!SRCF.open)h+='<div class="w warn">Chưa chọn thư mục source nên kịch bản và clip đang ghép chưa được lưu. Chọn thư mục ở tab Thư viện source: các clip đang mở sẽ được lưu vào đó.</div>';
  h+='<div class="box"><h2>1. Nạp kịch bản</h2><div class="row2"><div><label class="lab" for="file">Tải file (.txt, .csv, .md)</label><input type="file" id="file" accept=".txt,.csv,.md,text/plain"></div>'+
    '<div><label class="lab" for="batchin">Đợt (gắn cho các clip sắp nạp)</label><input type="text" id="batchin" value="'+esc(S.batchIn||weekLabel())+'" placeholder="Ví dụ: 16/11 – 22/11"></div></div>'+
    '<label class="lab" for="paste" style="margin-top:10px">Hoặc dán văn bản kịch bản</label><textarea id="paste" rows="7" style="min-height:120px" placeholder="## TV9 | Tường Vip | Lịch laser | Review 3 size&#10;Lời thoại | Cảnh cần | cụm trong thoại=chữ hiện">'+esc(S.paste)+'</textarea>'+
    '<details><summary>Định dạng văn bản</summary><pre>## Mã | Gian | Sản phẩm | Tên clip | (Người phụ trách, bỏ trống là người đầu tiên trong danh sách ở Cài đặt)\nLời thoại | Cảnh cần thấy | cụm trong thoại=chữ hiện trên hình; cụm khác=chữ khác\n(mỗi dòng thoại một dòng, bỏ trống ô cuối nếu không cần chữ thông tin)</pre></details>'+
    '<div class="bar"><button class="btn pri" data-act="load">Nạp vào danh sách</button></div></div>';
  if(S.imp)h+=impBox();
  if(S.clipUndo)h+='<div class="w ok">Đã '+esc(S.clipUndo.label)+'. <button class="btn sm" data-kact="undo">Hoàn tác</button></div>';
  if(!CLIPS.length)h+='<div class="empty">Chưa có clip nào đang mở. Tải file hoặc dán văn bản kịch bản rồi bấm "Nạp vào danh sách".</div>';
  else{
    var bs=batches(CLIPS);if(S.kbBatch!==null&&bs.indexOf(S.kbBatch)<0)S.kbBatch=null;
    var list=CLIPS.filter(function(c){return S.kbBatch===null||(c.batch||'')===S.kbBatch});
    h+='<div class="chips"><span class="meta" style="align-self:center">Đợt:</span><button class="chip '+(S.kbBatch===null?'on':'')+'" data-kact="kbf" data-all="1">Tất cả đợt đang mở</button>'+bs.map(function(b){return '<button class="chip '+(S.kbBatch===b?'on':'')+'" data-kact="kbf" data-b="'+esc(b)+'">'+esc(batchName(b))+' <small>'+CLIPS.filter(function(c){return (c.batch||'')===b}).length+'</small></button>'}).join('')+'</div>';
    var cnt={};list.forEach(function(c){var k=st(c);cnt[k]=(cnt[k]||0)+1});
    h+='<div class="sumrow">'+['chuaghep','missing','loi','ready','exported'].map(function(k){return '<div class="sum"><b>'+(cnt[k]||0)+'</b><span>'+STAT[k]+'</span></div>'}).join('')+'</div>';
    h+='<div class="box"><h2>2. Danh sách clip ('+list.length+(list.length!==CLIPS.length?' / '+CLIPS.length:'')+')</h2><div class="tbl"><table><thead><tr><th>Mã</th><th>Đợt</th><th>Gian</th><th>Sản phẩm</th><th>Tên</th><th>Dòng</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+
     list.map(function(c){return '<tr><td><b>'+esc(c.id)+'</b></td><td class="meta">'+esc(batchName(c.batch))+'</td><td>'+esc(c.g)+'</td><td>'+esc(c.prod)+'</td><td>'+esc(c.name)+'</td><td class="mono">'+c.lines.length+'</td><td>'+pill(st(c))+'</td><td><button class="btn sm" data-edit="'+esc(c.id)+'">Sửa</button> <button class="btn sm" data-delclip="'+esc(c.id)+'" title="Xóa mềm: khôi phục được, không xóa file giọng hay video">Xóa</button></td></tr>'}).join('')+
     '</tbody></table></div><div class="bar"><button class="btn pri" data-act="autoall">Ghép cảnh tự động cho tất cả</button>'+
     (S.kbBatch!==null?'<button class="btn" data-kact="arch" data-b="'+esc(S.kbBatch)+'">Lưu trữ đợt "'+esc(batchName(S.kbBatch))+'"</button>':bs.length===1?'<button class="btn" data-kact="arch" data-b="'+esc(bs[0])+'">Lưu trữ đợt "'+esc(batchName(bs[0]))+'"</button>':'<span class="meta">Chọn một đợt ở trên để lưu trữ.</span>')+
     '<span class="meta">Clip của người quay trực tiếp được bỏ qua khi ghép. Lưu trữ đợt chỉ ẩn khỏi danh sách, mở lại được.</span></div></div>';
    var c=clip(S.edit);
    if(c){
      h+='<div class="box"><h2>3. Sửa kịch bản: '+esc(c.id)+'</h2>'+(c.voiceStale?'<div class="w warn">Lời thoại đã đổi sau khi tạo giọng: cần tạo lại giọng cho khớp.</div>':'')+'<div class="row2" style="margin-bottom:10px">'+
       [['id','Mã'],['batch','Đợt'],['g','Gian'],['prod','Sản phẩm'],['name','Tên clip'],['who','Người phụ trách']].map(function(f){if(f[0]==='who')return whoSelect(c);return '<div><label class="lab" for="f_'+f[0]+'">'+f[1]+'</label><input type="text" id="f_'+f[0]+'" data-ecf="'+f[0]+'" value="'+esc(c[f[0]])+'"></div>'}).join('')+'</div>'+
       '<div class="ed meta"><span>Lời thoại</span><span>Cảnh cần thấy</span><span>Chữ thông tin (cụm=chữ; ...)</span><span></span></div>';
      c.lines.forEach(function(l,i){h+='<div class="ed"><textarea data-el="'+i+'|t" aria-label="Lời thoại dòng '+(i+1)+'">'+esc(l.t)+'</textarea><textarea data-el="'+i+'|need" aria-label="Cảnh cần dòng '+(i+1)+'">'+esc(l.need)+'</textarea><textarea data-el="'+i+'|inf" aria-label="Chữ thông tin dòng '+(i+1)+'">'+esc(infosStr(l))+'</textarea><button class="btn sm" data-dl="'+i+'">Xóa dòng</button></div>'});
      h+='<div class="bar"><button class="btn sm" data-act="addline">+ Thêm dòng</button><button class="btn pri" data-auto="'+esc(c.id)+'">Ghép cảnh tự động clip này</button><a class="btn" href="#ghep" data-cur="'+esc(c.id)+'">Mở trang ghép</a></div></div>';
    }
  }
  if(ARCH.length){var ab=batches(ARCH);
    h+='<details class="box"><summary><b>Đợt đã lưu trữ</b> ('+ab.length+' đợt, '+ARCH.length+' clip)</summary>'+ab.map(function(b){var cs=ARCH.filter(function(c){return (c.batch||'')===b});
      return '<div class="prow"><b>'+esc(batchName(b))+'</b><span class="meta">'+cs.length+' clip: '+esc(cs.map(function(c){return c.id}).join(', '))+'</span><button class="btn sm" data-kact="unarch" data-b="'+esc(b)+'">Mở lại đợt</button></div>'}).join('')+'</details>'}
  if(TRASH.length)h+='<details class="box"><summary><b>Clip đã xóa</b> ('+TRASH.length+')</summary><div class="meta">Xóa clip chỉ ẩn khỏi danh sách; file giọng và video đã xuất trên đĩa vẫn giữ nguyên.</div>'+TRASH.map(function(c){
      return '<div class="prow"><b>'+esc(c.id)+'</b><span class="meta">'+esc(c.name)+' · đợt '+esc(batchName(c.batch))+'</span><button class="btn sm" data-kact="restore" data-id="'+esc(c.id)+'">Khôi phục</button></div>'}).join('')+'</details>';
  return h;
}
/* Nạp kịch bản: gắn đợt, clip mã mới thêm ngay; trùng mã thì hỏi. */
function kbLoad(){
  var ta=document.getElementById('paste'),bi=document.getElementById('batchin');S.paste=ta?ta.value:S.paste;S.batchIn=bi?bi.value.trim():S.batchIn;
  var out=parse(S.paste);if(!out.length){msg('Không đọc được clip nào. Mỗi clip cần một dòng bắt đầu bằng ##, xem mục Định dạng văn bản.');return}
  var b=S.batchIn||weekLabel(),now=new Date().toISOString();out.forEach(function(n){n.batch=b;n.created=now});
  if(out.some(function(n){return !!clipById(n.id)})){S.imp={fresh:out,ch:{}};render();return}
  impDone(applyImport(out,{}),out)}
function impDone(r,out){S.imp=null;S.paste='';S.kbBatch=null;S.edit=(out[0]&&clip(out[0].id))?out[0].id:S.edit;touchClips();
  msg('Đã nạp kịch bản: '+[r.add?r.add+' clip mới':'',r.upd?r.upd+' clip cập nhật lời ('+r.kept+' dòng không đổi giữ nguyên cảnh)':'',r.copy?r.copy+' bản mới':'',r.skip?r.skip+' bỏ qua':''].filter(Boolean).join(', ')+'. Sửa trong bảng nếu cần, rồi bấm Ghép cảnh tự động.')}
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-kact]');if(!el)return;var d=el.dataset,n=0;
  switch(d.kact){
    case 'impok':var im=S.imp;if(im)impDone(applyImport(im.fresh,im.ch),im.fresh);return;
    case 'impno':S.imp=null;render();return;
    case 'undo':if(S.clipUndo){var u=S.clipUndo;clipRestore(u.ids);msg('Đã hoàn tác: '+u.label+'.')}return;
    case 'kbf':S.kbBatch=d.all?null:(d.b||'');render();return;
    case 'arch':if(!confirm('Lưu trữ đợt "'+batchName(d.b)+'"? Các clip của đợt sẽ ẩn khỏi danh sách chính (không xóa), mở lại được ở mục Đợt đã lưu trữ.'))return;
      n=archiveBatch(d.b);msg('Đã lưu trữ đợt "'+batchName(d.b)+'" ('+n+' clip).');return;
    case 'unarch':n=unarchiveBatch(d.b);S.kbBatch=d.b;msg('Đã mở lại đợt "'+batchName(d.b)+'" ('+n+' clip).');return;
    case 'restore':clipRestore([d.id]);msg('Đã khôi phục clip '+d.id+'.');return;
  }
});
document.addEventListener('change',function(e){var t=e.target;
  if(t.dataset.impch&&S.imp){S.imp.ch[t.dataset.impch]=t.value;return}
  if(t.id==='batchin'){S.batchIn=t.value.trim();return}
});
