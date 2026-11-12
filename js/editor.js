/* Màn Ghép clip kiểu phòng dựng: thanh trên cố định, thư viện bên trái, khung xem thử và danh sách dòng ở giữa,
   bảng thuộc tính (Inspector) của dòng đang chọn bên phải, vùng dưới cho sóng giọng / thanh thời gian.
   Chỉ đổi giao diện: mọi nút, ô nhập vẫn dùng các thuộc tính data-* cũ nên logic trong events.js giữ nguyên. */
(function(){var o=null;try{o=JSON.parse(localStorage.getItem('xuongclip_panels')||'null')}catch(e){}
  S.pL=o&&typeof o.L==='boolean'?o.L:(window.innerWidth<1600);S.pR=o&&typeof o.R==='boolean'?o.R:false;S.fs=false;S.chkOpen=false})();
function savePanels(){try{localStorage.setItem('xuongclip_panels',JSON.stringify({L:S.pL,R:S.pR}))}catch(e){}}
function tc(s){s=Math.max(0,+s||0);var m=Math.floor(s/60),r=s-m*60;return ('0'+m).slice(-2)+':'+(r<10?'0':'')+r.toFixed(1)}
/* Đèn trạng thái của một dòng: lỗi / thiếu cảnh / cảnh báo / sẵn sàng. */
function lineLvl(c,i){var r=checkClip(c),e=r.errs.filter(function(x){return x.i===i});
  if(e.some(function(x){return x.code!=='noseg'}))return 'err';if(e.length)return 'miss';
  return r.warns.some(function(x){return x.i===i})?'warn':'ok'}
var LVLTXT={err:'Có lỗi',miss:'Thiếu cảnh',warn:'Có cảnh báo',ok:'Sẵn sàng'};
function lineDot(c,i){var l=lineLvl(c,i);return '<span class="dot '+l+'" title="'+LVLTXT[l]+'"></span>'}
function chkSum(c){var r=checkClip(c);return '<span class="k">Kiểm tra</span><span class="cnt err">'+r.errs.length+' lỗi</span><span class="cnt warn">'+r.warns.length+' cảnh báo</span>'}

/* ---------- các mảnh ---------- */
function edTop(c,tot){
  var sel='<select id="pickclip" aria-label="Chọn clip">'+CLIPS.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+esc(x.id)+' · '+esc(x.name)+'</option>'}).join('')+'</select>';
  return '<div class="etop">'+chkDot(c)+sel+'<span class="tc" title="Tổng thời lượng">'+tc(tot)+'</span><span class="meta eg">'+esc(c.g)+(c.prod?' · '+esc(c.prod):'')+'</span>'+
   '<div class="chkw"><button class="chkt" id="chkt" data-ui="chk" aria-expanded="'+(S.chkOpen?'true':'false')+'">'+chkSum(c)+'</button>'+
   '<div class="chk chkdd" id="chkbox"'+(S.chkOpen?'':' hidden')+'>'+chkPanel(c)+'</div></div>'+
   '<span class="sp"></span><button class="btn sm" data-auto="'+esc(c.id)+'">Ghép lại tự động</button>'+
   '<button class="btn sm" data-ui="fs" title="Phóng toàn màn hình phần xem thử và thanh thời gian (Esc để thoát)">'+(S.fs?'Thoát toàn màn hình':'Toàn màn hình')+'</button>'+
   '<button class="btn pri" id="expbtn" data-act="export" '+((checkClip(c).errs.length||S.exporting)?'disabled':'')+'>'+esc(expLabel(c))+'</button></div>'}
function edLib(c){
  var li=Math.min(S.li,c.lines.length-1),rs=canonicalProduct(c.prod)?suggest(c,li,{all:true}):[];
  var body=!canonicalProduct(c.prod)?'<div class="meta">Clip chưa ghi sản phẩm nên không có video gợi ý.</div>':!rs.length?'<div class="meta">Chưa có video nào gắn nhãn "'+esc(canonicalProduct(c.prod))+'".</div>':
    rs.map(function(r){var s=r.s,good=r.sc>=SG.min&&!r.dup,cur=c.lines[li].seg===s.id;
      return '<button class="lcard'+(cur?' on':'')+(good?'':' low')+'" data-pick="'+li+'|'+s.id+'|'+r.a+'" data-q="'+esc(pkey(s.label+' '+s.path))+'" title="'+esc(whyText(r))+'">'+
       '<span class="thumb" data-th="'+s.id+'" style="'+bg(s)+'"><span class="thtx"></span></span><span class="ll">'+esc(s.label)+'</span><span class="ls'+(good?' ok':'')+'">'+r.sc+'</span></button>'}).join('');
  return '<aside class="pnl pl" aria-label="Thư viện source"><div class="ph"><button class="pt" data-ui="pl" title="'+(S.pL?'Mở':'Thu gọn')+' thư viện">'+(S.pL?'›':'‹')+'</button><b>Thư viện</b></div>'+
   (S.pL?'<div class="prail" data-ui="pl">Thư viện</div>':'<div class="pb"><input type="search" id="ghq" placeholder="Tìm video" aria-label="Tìm video trong thư viện">'+
   '<div class="meta">Video cùng sản phẩm, xếp theo điểm cho dòng '+(li+1)+'. Bấm để áp vào dòng đang chọn; rê chuột xem lý do.</div><div class="lgrid" id="ghlib">'+body+'</div></div>')+'</aside>'}
function edRows(c){
  return '<div class="lrows" role="list">'+c.lines.map(function(l,i){var sg=lineSeg(l),lv=lineLvl(c,i);
    return '<div class="lrow'+(S.li===i?' cur':'')+' lv-'+lv+'" data-li="'+i+'" role="listitem" title="'+esc(l.t)+'"><span class="ln">'+(i+1)+'</span>'+lineDot(c,i)+
     '<span class="lt">'+esc(l.t||'(chưa có lời)')+'</span>'+(lv==='err'||lv==='miss'?'<span class="lerr">'+(lv==='miss'?'thiếu cảnh':'lỗi')+'</span>':'<span></span>')+
     '<span class="lth" style="'+(sg?bg(sg):'')+'"></span><span class="ld" data-t="'+i+'">'+tc(l.e-l.s)+'</span></div>'}).join('')+'</div>'}
/* Chi tiết của dòng i (dùng trong Inspector), giữ nguyên các ô và nút cũ. */
function lineDetail(c,l,i){
  var sg=lineSeg(l),h='<div class="line cur" data-li="'+i+'"><div class="lh"><b>Dòng '+(i+1)+'</b>'+lineMark(c,i)+'<span class="mono" data-t="'+i+'">'+tc(l.s)+' – '+tc(l.e)+' · '+wc(l.t)+' từ</span></div>'+
   '<label class="lab">Lời thoại</label><textarea data-th="'+i+'" aria-label="Lời thoại dòng '+(i+1)+'">'+esc(l.t)+'</textarea><div class="need">Cảnh cần: '+esc(l.need)+'</div>'+
   '<div class="sec"><div class="lab">Cảnh</div><div class="seg">'+(sg?'<div class="thumb" style="'+bg(sg)+'"></div><div class="sgi"><div>'+esc(sg.label)+'</div><div class="meta">'+sid(sg.id)+' · '+sg.o+' · '+sg.d+'s'+((l.segIn||l.segOut)?' · từ '+(l.segIn||0)+' đến '+(l.segOut||sg.d):'')+'</div></div>':lineLost(l)?'<span class="pill p-loi">Mất cảnh</span><span class="meta">'+esc(lostWhy(l))+'. Bấm Đổi cảnh để chọn lại.</span>':'<span class="pill p-missing">Chưa có cảnh</span>')+
   '</div><div class="bar" style="margin-top:4px">'+(sg?'<button class="btn sm" data-pv="'+sg.id+'|'+esc(c.id)+'|'+i+'">Xem / cắt đoạn</button>':'')+'<button class="btn sm" data-ch="'+i+'">'+(l.choose?'Đóng gợi ý':'Đổi cảnh')+'</button>'+
   (l.lock?'<span class="bdg man" title="Chọn tay: Ghép lại tự động không đổi dòng này">đã khóa'+(sg?'':': để trống')+'</span><button class="btn xs" data-unlock="'+i+'">Mở khóa</button>':'')+'</div>';
  if(sg&&l.why&&!l.lock)h+='<div class="meta why">Tự chọn. '+esc(l.why)+'</div>';
  if(sg){var du=dupsOf(c,i);if(du.length)h+='<div class="w warn dupw">Đoạn này cũng dùng ở '+du.map(function(u){return '<button class="lnk" data-goto="'+esc(u.c.id)+'|'+u.i+'">'+esc(useText(u))+'</button>'}).join(', ')+' (cùng gian, khoảng thời gian chồng nhau).</div>'}
  if(sg)h+=trackHTML(c,l,i,sg);
  if(l.choose){var rs=suggest(c,i,{all:true}).filter(function(r){return r.s.id!==l.seg}),good=rs.filter(function(r){return r.sc>=SG.min&&!r.dup}),low=rs.filter(function(r){return r.sc<SG.min||r.dup});
    h+='<div class="cands2">'+(good.length?good.map(function(r){return candRow(c,i,r)}).join(''):'<div class="meta">'+(canonicalProduct(c.prod)?'Không có video "'+esc(canonicalProduct(c.prod))+'" nào đủ '+SG.min+' điểm cho dòng này.':'Clip chưa ghi sản phẩm nên không gợi ý được.')+'</div>')+
      (low.length?'<details><summary>'+low.length+' video cùng sản phẩm chưa đủ điểm hoặc trùng đoạn (chỉ tự chọn khi chắc chắn)</summary>'+low.map(function(r){return candRow(c,i,r)}).join('')+'</details>':'')+
      '<div class="bar" style="margin-top:4px"><button class="btn sm" data-pick="'+i+'|none|0">Bỏ chọn (báo thiếu)</button></div></div>'}
  h+='</div><div class="sec"><div class="lab">Thời lượng, tốc độ, chuyển cảnh</div><div class="lctl">'+lineCtl(c,l,i)+'</div>'+
   (i>0?'<label class="lab">Chuyển vào cảnh này<select data-ltr="'+i+'" aria-label="Chuyển vào cảnh này"><option value="">Theo mặc định ('+TRN[TR.type]+')</option>'+Object.keys(TRN).map(function(k){return '<option value="'+k+'" '+(l.tr===k?'selected':'')+'>'+TRN[k]+'</option>'}).join('')+'</select></label>':'')+'</div>';
  h+='<details class="sec infos" open><summary class="lab">Chữ hiện ('+l.infos.length+')</summary>'+l.infos.map(function(x,k){var ct=cue(l,x),sp=infoSpan(l,x);
    return '<div class="irow3"><div class="ir1"><input type="text" data-ix="'+i+'|'+k+'" value="'+esc(x.x)+'" aria-label="Chữ hiện"><button class="btn xs" data-delinfo="'+i+'|'+k+'" aria-label="Xóa chữ này" title="Xóa chữ này">×</button></div>'+
     '<details class="ir2"><summary>Cụm "'+esc(x.ph||'')+'" · '+(sp?tc(sp.a)+' – '+tc(sp.b):'không khớp')+'</summary><div class="ir2g">'+
     '<label class="lc">Cụm làm mốc<input type="text" data-ip="'+i+'|'+k+'" value="'+esc(x.ph)+'" aria-label="Cụm trong thoại"></label>'+
     '<label class="lc">Hiện lúc (s)<input type="number" step="0.1" min="0" data-io="'+i+'|'+k+'" value="'+((x.off!=null&&x.off!=='')?(l.s+ +x.off).toFixed(1):'')+'" placeholder="'+(ct===null?'không khớp':'tự '+ct.toFixed(1))+'" aria-label="Giây chữ hiện"></label>'+
     '<label class="lc">Ở lại (s)<input type="number" step="0.1" min="0.5" data-il="'+i+'|'+k+'" value="'+(x.len||'')+'" placeholder="'+(sp?'tự '+(sp.b-sp.a).toFixed(1):'')+'" aria-label="Giây ở lại"></label>'+
     '<label class="lc">Cỡ<input type="number" min="10" max="200" data-isz="'+i+'|'+k+'" value="'+(x.sz||'')+'" placeholder="'+INFO.size+'" aria-label="Cỡ chữ"></label></div></details></div>'}).join('')+
   '<div class="bar" style="margin-top:4px"><button class="btn sm" data-addinfo="'+i+'">+ Thêm chữ</button><span class="meta">Kéo chữ trên khung xem thử để đổi vị trí.</span></div></details>';
  return h}
function edInspector(c){var li=Math.min(S.li,c.lines.length-1),l=c.lines[li];
  return '<aside class="pnl pr" aria-label="Thuộc tính dòng"><div class="ph"><b>'+(S.pR?'':'Thuộc tính')+'</b><button class="pt" data-ui="pr" title="'+(S.pR?'Mở':'Thu gọn')+' bảng thuộc tính">'+(S.pR?'‹':'›')+'</button></div>'+
   (S.pR?'<div class="prail" data-ui="pr">Thuộc tính</div>':'<div class="pb">'+lineDetail(c,l,li)+
   '<details class="sec" open><summary class="lab">Giọng đọc của clip</summary>'+voiceInner(c)+'</details>'+
   '<details class="sec"><summary class="lab">Ảnh bìa</summary>'+coverBox(c)+'</details>'+
   '<details class="sec"'+(c.out?' open':'')+'><summary class="lab">Xuất</summary><div class="meta" id="expst"></div>'+
   (c.out&&!c.out.url?'<div class="meta">Đã xuất trước đây: '+esc(c.out.name||'')+' ('+esc(c.out.mb||'?')+' MB). Bản xem trong trình duyệt không còn sau khi tải lại trang.</div>':'')+
   (c.out&&c.out.url?'<video src="'+c.out.url+'" controls playsinline style="width:160px;border-radius:8px;background:#000"></video><div class="bar"><a class="btn pri sm" href="'+c.out.url+'" download="'+esc(c.out.name||(c.id+'.'+c.out.ext))+'">Tải video về ('+c.out.ext+', '+c.out.mb+' MB)</a></div>':'')+'</details></div>')+'</aside>'}
function voiceInner(c){return gemBlock(c)+waveBox(c)+'<label class="vf">Hoặc tải file giọng (mp3, wav)<input type="file" id="audf" accept="audio/*"></label><div class="meta">'+(c.audioFile?'Đang dùng: '+esc(c.audioFile.name):'Chưa có giọng.')+'</div><div class="bar"><button class="btn sm" data-act="copyvo">Sao chép lời thoại</button></div>'}

function vGhep(){
  if(!CLIPS.length)return '<h1>Ghép clip</h1><div class="empty">Chưa có kịch bản. Qua tab Kịch bản để nạp.</div>';
  if(!clip(S.cur))S.cur=CLIPS[0].id;
  var c=clip(S.cur),sel='<select id="pickclip" style="max-width:420px" aria-label="Chọn clip">'+CLIPS.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+esc(x.id)+' · '+esc(x.name)+'</option>'}).join('')+'</select>';
  if(isDirect(c))return '<h1>Ghép clip</h1>'+sel+'<div class="empty" style="margin-top:12px">Clip này do '+esc(c.who)+' quay trực tiếp, nằm ngoài tool ghép.</div>';
  if(!c.auto)return '<h1>Ghép clip</h1>'+sel+'<div class="empty" style="margin-top:12px">Clip này chưa được ghép cảnh.<div class="bar" style="justify-content:center"><button class="btn pri" data-auto="'+esc(c.id)+'">Ghép cảnh tự động</button></div></div>';
  if(S.li>=c.lines.length)S.li=c.lines.length-1;
  var tot=timeline(c);
  var h='<div class="ed5'+(S.pL?' pl-off':'')+(S.pR?' pr-off':'')+(S.fs?' fs':'')+'" id="ed5">'+edTop(c,tot)+
   (canonicalProduct(c.prod)?'':'<div class="w warn">Clip chưa ghi sản phẩm nên tool không gợi ý cảnh được. Sửa ô Sản phẩm ở tab Kịch bản.</div>')+
   '<div class="egrid">'+edLib(c)+
   '<section class="ectr"><div class="eview">'+
    '<div class="phone" id="phone"><video id="pv" class="pv" muted playsinline hidden></video><div id="sc"></div><div id="tr"></div><div id="inf"></div>'+safeOverlay()+'</div>'+
    '<div class="ctrl"><button class="btn sm pri" data-act="play">'+(S.play?'Dừng':'Phát')+'</button><input type="range" id="scrub" min="0" max="'+tot+'" step="0.1" value="'+S.t+'" aria-label="Thanh thời gian"><span class="t tc" id="tt"></span></div>'+
    '<div class="vopts">'+safeToggle()+'<label class="note"><input type="checkbox" id="edtxt" '+(S.edTxt!==false?'checked':'')+'> Chế độ chỉnh chữ</label>'+
    '<label class="note"><input type="checkbox" id="tts" '+(S.tts?'checked':'')+'> Đọc thử bằng giọng trình duyệt</label></div></div>'+
   '<div class="elist"><div class="lhd"><b>Dòng thoại</b><span class="meta">'+c.lines.length+' dòng · bấm để mở chi tiết</span></div>'+edRows(c)+
    '<div class="trbox"><label class="lab" for="trtype">Chuyển cảnh mặc định</label><select id="trtype">'+Object.keys(TRN).map(function(k){return '<option value="'+k+'" '+(TR.type===k?'selected':'')+'>'+TRN[k]+'</option>'}).join('')+'</select> <input type="number" id="trdur" min="0.1" max="1" step="0.1" value="'+TR.dur+'" aria-label="Thời gian chuyển cảnh"> giây</div></div>'+
   '</section>'+edInspector(c)+'</div>'+
   '<div class="ebot" id="ebot">'+(typeof tlHTML==='function'?tlHTML(c):waveWide(c))+'</div></div>';
  return h}

/* ---------- sự kiện giao diện ---------- */
document.addEventListener('click',function(e){
  var u=e.target.closest('[data-ui]');if(!u)return;
  switch(u.dataset.ui){
    case 'pl':S.pL=!S.pL;savePanels();render();return;
    case 'pr':S.pR=!S.pR;savePanels();render();return;
    case 'fs':S.fs=!S.fs;render();return;
    case 'chk':S.chkOpen=!S.chkOpen;var b=document.getElementById('chkbox');if(b)b.hidden=!S.chkOpen;u.setAttribute('aria-expanded',S.chkOpen?'true':'false');return;
  }
});
document.addEventListener('click',function(e){ // bấm ra ngoài thì đóng bảng Kiểm tra
  if(!S.chkOpen||e.target.closest('.chkw'))return;var b=document.getElementById('chkbox');if(b){S.chkOpen=false;b.hidden=true;var t=document.getElementById('chkt');if(t)t.setAttribute('aria-expanded','false')}});
document.addEventListener('input',function(e){if(e.target.id!=='ghq')return;var q=pkey(e.target.value);
  document.querySelectorAll('#ghlib .lcard').forEach(function(x){x.hidden=!!q&&x.dataset.q.indexOf(q)<0})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&S.fs&&S.tab==='ghep'){S.fs=false;render()}});

/* Đồng bộ danh sách dòng (và kim chạy ở thanh thời gian) với khung xem thử khi phát hoặc kéo thanh thời gian. */
function edSync(){var c=clip(S.cur);if(!c||S.tab!=='ghep')return;var t=S.t,l=c.lines.filter(function(x){return t>=x.s&&t<x.e})[0],li=l?c.lines.indexOf(l):S.li;
  document.querySelectorAll('.lrow').forEach(function(r){r.classList.toggle('play',+r.dataset.li===li)});if(typeof tlSync==='function')tlSync(c,t)}
var _drawPhone0=drawPhone;drawPhone=function(){_drawPhone0.apply(this,arguments);edSync()};
