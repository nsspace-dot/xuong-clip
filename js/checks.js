/* Kiểm tra luật trước khi xuất.
   - CRULES: danh sách luật sửa được (cụm từ hoặc mẫu, mức LỖI / CẢNH BÁO / NGOẠI LỆ, phạm vi, bật/tắt, ghi chú).
     Khớp theo từ nguyên vẹn (không dính chữ hay số ở hai đầu), không phân biệt hoa thường;
     bỏ qua dấu thanh khi bật CHK.fold. Luật NGOẠI LỆ che cụm đó trước khi so các luật khác
     (ví dụ ngoại lệ "giá trị" để luật "giá" không bắt nhầm).
   - CHK: ngưỡng và bật/tắt luật hình thức, vùng an toàn TikTok (số ước lượng, chưa kiểm chứng).
   Lưu trong state.json (checkRules, checkCfg); mỗi clip lưu danh sách cảnh báo đã bỏ qua (ignored). */
var CHK_FORMS=[['total','Tổng thời lượng clip','err'],['linedur','Thời lượng từng dòng','warn'],['digits','Chữ số trong lời đọc','warn'],['infomis','Chữ hiện khớp lời','err'],
  ['cta','Dòng cuối có lời kêu gọi','warn'],['noseg','Dòng phải có cảnh','err'],['novoice','Dòng phải có giọng','err'],['safe','Chữ hiện trong vùng an toàn','warn']];
function chkCfgDefault(){var on={};CHK_FORMS.forEach(function(f){on[f[0]]=true});
  return {fold:false,minTotal:45,maxTotal:60,minLine:6,maxLine:9,cta:'giỏ hàng',safe:{t:8,b:22,r:14,l:4},on:on}}
var CHK=chkCfgDefault();
function chkId(){return 'r'+Math.random().toString(36).slice(2,9)}
function chkRulesDefault(){
  var R=function(text,lvl,note,pat){return {id:chkId(),text:text,pat:!!pat,lvl:lvl,scope:'all',sv:'',on:true,note:note||''}};
  return [
    R('giá','err','Không nêu giá trong lời và chữ hiện'),R('bán chạy','err','Không khẳng định bán chạy'),R('giảm giá','err','Không nêu giảm giá'),
    R('tài lộc','err','Không hứa hẹn tài lộc'),R('may mắn','err','Không hứa hẹn may mắn'),R('chiêu tài','err','Không hứa hẹn chiêu tài'),
    R('khuyến mãi','warn','Khuyến mãi dễ bị coi là nêu giá'),R('rẻ nhất','warn','Từ so sánh tuyệt đối'),R('tốt nhất','warn','Từ so sánh tuyệt đối'),R('số một','warn','Từ so sánh tuyệt đối'),
    R('cam kết','warn','Cam kết cần có căn cứ'),R('bảo đảm','warn','Bảo đảm cần có căn cứ'),R('đảm bảo','warn','Bảo đảm cần có căn cứ'),R('chữa bệnh','warn','Không nói công dụng chữa bệnh'),
    // từ bảng luật cũ (5 luật) giữ lại làm dữ liệu khởi tạo
    R('\\d[\\d.,]*\\s?(k|đ|đồng|nghìn|ngàn|triệu|vnđ)','err','Nêu giá bằng số (luật cũ)',true),R('giảm\\s?\\d+\\s?%','err','Nêu mức giảm giá (luật cũ)',true),R('sale','err','Nêu giảm giá (luật cũ)'),
    R('(chắc chắn|đảm bảo).*(phát tài|giàu|may mắn)','err','Hứa chắc chắn tài lộc (luật cũ)',true),R('trị bệnh','warn','Công bố tác dụng sức khỏe (luật cũ)'),R('giảm cân','warn','Công bố tác dụng sức khỏe (luật cũ)'),R('tốt cho sức khỏe','warn','Công bố tác dụng sức khỏe (luật cũ)'),
    R('giá trị','ok','Ngoại lệ: "giá trị" không phải nêu giá')]}
var CRULES=chkRulesDefault();
var LVL={err:'LỖI',warn:'CẢNH BÁO',ok:'NGOẠI LỆ'};

/* ---------- đọc / ghi ---------- */
function chkToState(){return {checkRules:CRULES.map(function(r){return {id:r.id,text:r.text,pat:!!r.pat,lvl:r.lvl,scope:r.scope,sv:r.sv,on:!!r.on,note:r.note}}),checkCfg:JSON.parse(JSON.stringify(CHK))}}
function chkRuleClean(r){if(!r||typeof r.text!=='string'||!r.text.trim())return null;
  return {id:String(r.id||chkId()),text:r.text.trim(),pat:!!r.pat,lvl:LVL[r.lvl]?r.lvl:'warn',scope:['all','gian','prod'].indexOf(r.scope)>=0?r.scope:'all',sv:String(r.sv||''),on:r.on!==false,note:String(r.note||'')}}
function chkFromState(o){
  if(Array.isArray(o.checkRules)){CRULES=o.checkRules.map(chkRuleClean).filter(Boolean)}else CRULES=chkRulesDefault();
  var d=chkCfgDefault(),c=o.checkCfg;CHK=d;
  if(c&&typeof c==='object'){['minTotal','maxTotal','minLine','maxLine'].forEach(function(k){if(isFinite(+c[k]))CHK[k]=+c[k]});CHK.fold=!!c.fold;if(typeof c.cta==='string')CHK.cta=c.cta;
    if(c.safe)['t','b','r','l'].forEach(function(k){if(isFinite(+c.safe[k]))CHK.safe[k]=+c.safe[k]});
    if(c.on)for(var k in d.on)if(k in c.on)CHK.on[k]=!!c.on[k]}
  REC={}}

/* ---------- so khớp từ ---------- */
function foldText(s){var o='';s=String(s);for(var i=0;i<s.length;i++){var ch=s[i],lc=ch.toLowerCase();if(lc.length!==1)lc=ch;
    if(CHK.fold){var b=lc.normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(b==='đ')b='d';if(b.length===1)lc=b}o+=lc}return o}
var REC={};
function ruleRe(r){var k=r.text+'\u0001'+r.pat+'\u0001'+CHK.fold;if(k in REC)return REC[k];var src;
  if(r.pat)src=CHK.fold?foldText(r.text):r.text;else src=foldText(r.text.trim()).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
  try{REC[k]=new RegExp('(?<![\\p{L}\\p{N}])(?:'+src+')(?![\\p{L}\\p{N}])','giu')}catch(e){REC[k]=null}return REC[k]}
function ruleBad(r){return !!r.pat&&!ruleRe(r)}
function ruleApplies(r,c){if(!r.on)return false;if(r.scope==='gian')return pkey(r.sv)===pkey(c&&c.g);
  if(r.scope==='prod')return !!r.sv&&prodMatch(r.sv,c&&c.prod);return true}
/* Các chỗ bị bắt trong một đoạn chữ: [{r, m (chữ gốc bị bắt)}]. */
function findHits(text,c){
  var t=foldText(text),rs=CRULES.filter(function(r){return ruleApplies(r,c)});
  rs.filter(function(r){return r.lvl==='ok'}).forEach(function(r){var re=ruleRe(r);if(re){re.lastIndex=0;t=t.replace(re,function(m){return ' '.repeat(m.length)})}});
  var out=[];rs.filter(function(r){return r.lvl!=='ok'}).forEach(function(r){var re=ruleRe(r),m;if(!re)return;re.lastIndex=0;
    while((m=re.exec(t))){if(!m[0].length){re.lastIndex++;continue}out.push({r:r,m:String(text).substr(m.index,m[0].length)})}});
  return out}

/* ---------- vùng an toàn: hộp chữ tính như lúc xuất (drawTextBox, khung 720×1280) ---------- */
var CHKCV=null;
function infoRect(x){var W=720,H=1280,fs=x.sz||INFO.size,pp=infoPos(x),cx=pp.px*W,cy=pp.py*H;
  if(!CHKCV)CHKCV=document.createElement('canvas').getContext('2d');var ctx=CHKCV;ctx.font='700 '+fs+'px "Be Vietnam Pro",system-ui,sans-serif';
  var ls=[],maxW=W*0.9-fs*1.2;String(x.x).split('\n').forEach(function(p){wrapText(ctx,p,maxW).forEach(function(q){ls.push(q)})});
  var lh=fs*1.24,mw=0;ls.forEach(function(q){mw=Math.max(mw,ctx.measureText(q).width)});
  var bw=Math.min(W*0.98,mw+fs*1.2),bh=ls.length*lh+fs*0.7,bx=Math.min(Math.max(cx-bw/2,W*0.01),W*0.99-bw),by=Math.min(Math.max(cy-bh/2,H*0.005),H*0.995-bh);
  return {l:bx/W,t:by/H,r:(bx+bw)/W,b:(by+bh)/H}}
function safeOut(x){var r=infoRect(x),s=CHK.safe,o=[];if(r.t<s.t/100)o.push('mép trên');if(r.b>1-s.b/100)o.push('mép dưới');if(r.l<s.l/100)o.push('mép trái');if(r.r>1-s.r/100)o.push('mép phải');return o}

/* ---------- kiểm tra một clip ---------- */
var CHKGEN=0,CHKC={};
function chkBump(){CHKGEN++;CHKC={}}
function checkClip(c){
  if(!c)return {all:[],errs:[],warns:[],ignored:[]};
  var memo=CHKC[c.id];if(memo&&memo.gen===CHKGEN&&memo.c===c)return memo.r;
  var it=[],add=function(lvl,i,code,title,detail){it.push({lvl:lvl,i:i,code:code,title:title,detail:detail||'',key:code+'|'+i+'|'+(detail||title)})};
  if(isDirect(c)){var r0={all:[],errs:[],warns:[],ignored:[]};CHKC[c.id]={gen:CHKGEN,c:c,r:r0};return r0}
  var tot=timeline(c),on=CHK.on,N=c.lines.length;
  if(on.total&&(tot<CHK.minTotal-0.05||tot>CHK.maxTotal+0.05))add('err',-1,'total','Tổng thời lượng '+fmt1(tot)+'s, cần '+CHK.minTotal+'–'+CHK.maxTotal+'s');
  if(on.novoice){if(c.audio&&c.audioMissing)add('err',-1,'novoice','File giọng '+c.audio.file+' không còn, cần tạo lại giọng');
    else if(!c.audioUrl)add('err',-1,'novoice','Clip chưa có giọng đọc (tạo giọng hoặc tải file giọng)')}
  if(c.voiceStale)add('warn',-1,'stale','Lời đã đổi sau khi tạo giọng, nên tạo lại giọng');
  c.lines.forEach(function(l,i){
    var ld=l.e-l.s;
    if(on.noseg){if(!l.seg)add('err',i,'noseg','Dòng chưa gán cảnh');else if(lineLost(l))add('err',i,'noseg','Mất cảnh: '+lostWhy(l))}
    if(on.novoice&&c.audioUrl&&l.ae!=null&&l.ae-l.as<0.3)add('err',i,'novoice','Dòng chưa có giọng (đoạn giọng gần như rỗng)');
    if(on.linedur&&(ld<CHK.minLine-0.05||ld>CHK.maxLine+0.05))add('warn',i,'linedur','Dòng dài '+fmt1(ld)+'s, nên '+CHK.minLine+'–'+CHK.maxLine+'s');
    if(on.digits){var dg=(l.t.match(/\d+(?:[.,x×]\d+)*/g)||[]).filter(function(v,k,a){return a.indexOf(v)===k});
      if(dg.length)add('warn',i,'digits','Lời đọc có chữ số: '+dg.map(function(v){return '"'+v+'"'}).join(', ')+'. Nên viết thành chữ để giọng đọc đúng',dg.join(','))}
    findHits(l.t,c).forEach(function(h){add(h.r.lvl,i,'word','Từ cấm "'+h.r.text+'" trong lời: "'+h.m+'"'+(h.r.note?' ('+h.r.note+')':''),h.r.id+':lời:'+h.m)});
    l.infos.forEach(function(x){if(!infoOk(x))return;
      findHits(x.x,c).forEach(function(h){add(h.r.lvl,i,'word','Từ cấm "'+h.r.text+'" trong chữ hiện: "'+h.m+'"'+(h.r.note?' ('+h.r.note+')':''),h.r.id+':chữ:'+h.m)});
      var ph=(x.ph||x.x||'').trim();if(on.infomis&&ph&&l.t.toLowerCase().indexOf(ph.toLowerCase())<0)add('err',i,'infomis','Chữ hiện "'+x.x+'" lệch lời: cụm "'+ph+'" không có trong lời dòng này',x.x+'='+ph);
      if(on.safe){var so=safeOut(x);if(so.length)add('warn',i,'safe','Chữ hiện "'+x.x+'" ra ngoài vùng an toàn ('+so.join(', ')+')',x.x)}});
    if(l.dm>0&&l.ae!=null&&l.dm<(l.ae-l.as)-0.05)add('warn',i,'cut','Giọng dài '+fmt1(l.ae-l.as)+'s, bạn nhập '+fmt1(l.dm)+'s, sẽ bị cắt '+fmt1(l.ae-l.as-l.dm)+'s');
    if(l.seg&&!lineLost(l)){var u=dupsOf(c,i);if(u.length)add('warn',i,'dup','Đoạn này cũng dùng ở '+u.map(useText).join('; '));
      if((seg(l.seg)||{}).o==='đã đăng')add('warn',i,'posted','Đoạn lấy từ clip đã đăng, dễ bị coi là nội dung lặp')}
  });
  if(on.cta&&N&&CHK.cta.trim()&&foldText(c.lines[N-1].t).indexOf(foldText(CHK.cta.trim()))<0)add('warn',N-1,'cta','Dòng cuối chưa có lời kêu gọi "'+CHK.cta.trim()+'"');
  var ig=c.ignored||[],r={all:it,errs:it.filter(function(x){return x.lvl==='err'}),warns:it.filter(function(x){return x.lvl==='warn'&&ig.indexOf(x.key)<0}),ignored:it.filter(function(x){return x.lvl==='warn'&&ig.indexOf(x.key)>=0})};
  CHKC[c.id]={gen:CHKGEN,c:c,r:r};return r}
function chkLevel(c){var r=checkClip(c);return r.errs.length?'err':r.warns.length?'warn':'ok'}
function chkDot(c){var l=chkLevel(c),r=checkClip(c);return '<span class="dot '+l+'" title="'+(l==='err'?r.errs.length+' lỗi':l==='warn'?r.warns.length+' cảnh báo':'Không có lỗi hay cảnh báo')+'"></span>'}

/* ---------- bảng Kiểm tra trên trang Ghép clip ---------- */
function chkItem(c,x,ign){var where=x.i>=0?'Dòng '+(x.i+1):'Cả clip';
  return '<div class="ci '+x.lvl+(ign?' ign':'')+'">'+(x.i>=0?'<button class="lnk" data-goto="'+esc(c.id)+'|'+x.i+'">'+where+'</button>':'<b>'+where+'</b>')+
   '<span class="lv">'+(x.lvl==='err'?'LỖI':'CẢNH BÁO')+'</span><span class="ct">'+esc(x.title)+'</span>'+
   (x.lvl==='warn'?(ign?'<button class="btn xs" data-chkun="'+esc(x.key)+'">Hiện lại</button>':'<button class="btn xs" data-chkign="'+esc(x.key)+'" title="Bỏ qua cảnh báo này cho clip này">Bỏ qua</button>'):'')+'</div>'}
function chkPanel(c){var r=checkClip(c);
  return '<div class="chkhd"><b>Kiểm tra</b><span class="cnt err">'+r.errs.length+' lỗi</span><span class="cnt warn">'+r.warns.length+' cảnh báo</span>'+(r.ignored.length?'<span class="meta">'+r.ignored.length+' đã bỏ qua</span>':'')+'</div>'+
   (r.errs.length||r.warns.length?r.errs.concat(r.warns).map(function(x){return chkItem(c,x,false)}).join(''):'<div class="w ok">Không có lỗi hay cảnh báo.</div>')+
   (r.ignored.length?'<details class="chkig"><summary>Cảnh báo đã bỏ qua ('+r.ignored.length+')</summary>'+r.ignored.map(function(x){return chkItem(c,x,true)}).join('')+'</details>':'')+
   (r.errs.length?'<div class="meta">LỖI không bỏ qua được: sửa nội dung hoặc đổi luật ở tab Cài đặt.</div>':'')}
function expLabel(c){var r=checkClip(c);return S.exporting?'Đang xuất...':r.errs.length?'Xuất video thật (còn '+r.errs.length+' lỗi)':'Xuất video thật'+(r.warns.length?' ('+r.warns.length+' cảnh báo)':'')}
function lineMark(c,i){var r=checkClip(c),e=r.errs.filter(function(x){return x.i===i}).length,w=r.warns.filter(function(x){return x.i===i}).length;
  return (e?'<span class="lmark err">'+e+' lỗi</span>':'')+(w?'<span class="lmark warn">'+w+' cảnh báo</span>':'')}
var chkT=null;
/* Chạy lại kiểm tra sau khi gõ (chống rung 300 ms), chỉ vẽ lại bảng và nút Xuất. */
function schedChk(){clearTimeout(chkT);chkT=setTimeout(function(){chkT=null;chkBump();var c=clip(S.cur),b=document.getElementById('chkbox');if(!c||!b)return;b.innerHTML=chkPanel(c);
  var x=document.getElementById('expbtn');if(x){x.disabled=!!checkClip(c).errs.length||!!S.exporting;x.textContent=expLabel(c)}},300)}
/* Xuất: còn LỖI thì chặn; chỉ còn CẢNH BÁO thì hỏi một lần. */
function exportGuard(c){chkBump();var r=checkClip(c);
  if(r.errs.length){msg('Chưa xuất được '+c.id+': còn '+r.errs.length+' lỗi ('+r.errs.slice(0,3).map(function(x){return (x.i>=0?'dòng '+(x.i+1)+': ':'')+x.title}).join('; ')+(r.errs.length>3?'; …':'')+').');return false}
  if(r.warns.length&&!confirm('Clip '+c.id+' còn '+r.warns.length+' cảnh báo:\n- '+r.warns.slice(0,5).map(function(x){return (x.i>=0?'Dòng '+(x.i+1)+': ':'')+x.title}).join('\n- ')+(r.warns.length>5?'\n- …':'')+'\n\nVẫn xuất?'))return false;
  return true}

/* ---------- vùng an toàn trên khung xem thử ---------- */
S.safe=(function(){try{return localStorage.getItem('xuongclip_safe')==='1'}catch(e){return false}})();
function safeOverlay(){var s=CHK.safe;return '<div class="safe" id="safe"'+(S.safe?'':' hidden')+'><div class="safebox" style="top:'+s.t+'%;bottom:'+s.b+'%;left:'+s.l+'%;right:'+s.r+'%"></div><span class="safelb">Vùng an toàn (ước lượng)</span></div>'}
function safeToggle(){return '<label class="note" style="display:block"><input type="checkbox" id="safetog" '+(S.safe?'checked':'')+'> Vùng an toàn TikTok <span class="meta">(số ước lượng, chưa kiểm chứng)</span></label>'}

/* ---------- Cài đặt: bảng luật, luật hình thức, vùng an toàn ---------- */
function chkSaveNote(){return SRCF.h&&SRCF.open?'':'<div class="w warn">Chưa chọn thư mục source: luật đang sửa chỉ nằm trong trình duyệt, sẽ được lưu vào thư mục khi bạn chọn thư mục.</div>'}
function checkRulesSettings(){
  var scopeSel=function(r,i){return '<select data-cr="'+i+'|scope" aria-label="Phạm vi">'+[['all','Tất cả'],['gian','Theo gian'],['prod','Theo sản phẩm']].map(function(o){return '<option value="'+o[0]+'" '+(r.scope===o[0]?'selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'};
  return '<div class="set" id="chkrules"><b>Luật kiểm tra từ ngữ</b><div class="meta">Áp cho lời thoại và chữ hiện. Khớp theo từ nguyên vẹn, không phân biệt hoa thường. NGOẠI LỆ: cụm được phép, che luật khác (ví dụ "giá trị" để luật "giá" không bắt nhầm; muốn cho phép "giá treo" thì thêm ngoại lệ "giá treo" hoặc giới hạn phạm vi luật). Tích "mẫu" để viết biểu thức chính quy. LỖI chặn xuất; CẢNH BÁO xuất được sau khi xác nhận.</div>'+chkSaveNote()+
   '<label class="ck"><input type="checkbox" id="chkfold" '+(CHK.fold?'checked':'')+'><span>Bỏ qua dấu thanh khi so khớp (ví dụ "gia" bắt cả "giá", "giả")</span></label>'+
   '<div class="crt"><div class="crh"><span>Bật</span><span>Cụm từ / mẫu</span><span>Mẫu</span><span>Mức</span><span>Phạm vi</span><span>Gian / sản phẩm</span><span>Ghi chú lý do</span><span></span></div>'+
   CRULES.map(function(r,i){return '<div class="crr'+(r.on?'':' off')+(ruleBad(r)?' bad':'')+'"><input type="checkbox" data-cr="'+i+'|on" '+(r.on?'checked':'')+' aria-label="Bật luật">'+
     '<input type="text" data-cr="'+i+'|text" value="'+esc(r.text)+'" aria-label="Cụm từ hoặc mẫu"'+(ruleBad(r)?' title="Mẫu không hợp lệ"':'')+'>'+
     '<input type="checkbox" data-cr="'+i+'|pat" '+(r.pat?'checked':'')+' aria-label="Là mẫu (biểu thức chính quy)">'+
     '<select data-cr="'+i+'|lvl" class="lvl-'+r.lvl+'" aria-label="Mức độ">'+['err','warn','ok'].map(function(k){return '<option value="'+k+'" '+(r.lvl===k?'selected':'')+'>'+LVL[k]+'</option>'}).join('')+'</select>'+
     scopeSel(r,i)+'<input type="text" data-cr="'+i+'|sv" value="'+esc(r.sv)+'" list="'+(r.scope==='prod'?'plist2':'glist')+'" aria-label="Gian hoặc sản phẩm" '+(r.scope==='all'?'disabled':'')+'>'+
     '<input type="text" data-cr="'+i+'|note" value="'+esc(r.note)+'" aria-label="Ghi chú lý do">'+
     '<span class="crb"><button class="btn xs" data-cract="dup" data-i="'+i+'" title="Nhân bản">Nhân bản</button><button class="btn xs" data-cract="del" data-i="'+i+'" title="Xóa luật">Xóa</button></span></div>'}).join('')+'</div>'+
   '<datalist id="glist">'+GIANS.map(function(g){return '<option value="'+esc(g)+'">'}).join('')+'</datalist><datalist id="plist2">'+PRODUCTS.map(function(p){return '<option value="'+esc(p.name)+'">'}).join('')+'</datalist>'+
   '<div class="bar"><button class="btn" data-cract="add">+ Thêm luật</button><button class="btn" data-cract="export">Xuất danh sách luật (JSON)</button><label class="btn">Nhập danh sách luật (JSON)<input type="file" id="chkimp" accept=".json,application/json" hidden></label><button class="btn" data-cract="reset">Khôi phục luật mặc định</button></div>'+
   '<div class="row2" style="margin-top:6px"><div><label class="lab" for="chktry">Thử một câu</label><input type="text" id="chktry" placeholder="Gõ câu để xem luật nào bắt"></div><div class="meta" id="chktryout" style="align-self:end"></div></div></div>'}
function checkFormSettings(){var on=CHK.on,n=function(id,k,v,st){return '<input type="number" id="'+id+'" data-ck="'+k+'" value="'+v+'" step="'+(st||1)+'" min="0" style="width:72px">'};
  return '<div class="set"><b>Luật hình thức</b><div class="meta">Áp cho từng clip. Mức in đậm là mức mặc định của luật.</div>'+
   CHK_FORMS.map(function(f){var ex='';
     if(f[0]==='total')ex=' từ '+n('ck1','minTotal',CHK.minTotal)+' đến '+n('ck2','maxTotal',CHK.maxTotal)+' giây';
     if(f[0]==='linedur')ex=' từ '+n('ck3','minLine',CHK.minLine,0.5)+' đến '+n('ck4','maxLine',CHK.maxLine,0.5)+' giây';
     if(f[0]==='cta')ex=': <input type="text" id="ck5" data-ck="cta" value="'+esc(CHK.cta)+'" style="width:160px">';
     return '<div class="prow"><label class="ck"><input type="checkbox" data-ckon="'+f[0]+'" '+(on[f[0]]?'checked':'')+'><span>'+f[1]+'</span></label>'+ex+'<span class="lvb '+f[2]+'">'+LVL[f[2]]+'</span></div>'}).join('')+'</div>'}
function safeSettings(){var s=CHK.safe,n=function(k,lab){return '<div><label class="lab" for="sf'+k+'">'+lab+' (%)</label><input type="number" id="sf'+k+'" data-sf="'+k+'" min="0" max="45" step="0.5" value="'+s[k]+'"></div>'};
  return '<div class="set"><b>Vùng an toàn TikTok</b><div class="w warn">Số ước lượng, chưa kiểm chứng với TikTok. Chữ hiện nằm ra ngoài vùng này bị CẢNH BÁO; bật lớp phủ ở khung xem thử để xem.</div><div class="row2">'+n('t','Mép trên')+n('b','Mép dưới')+n('l','Mép trái')+n('r','Mép phải')+'</div></div>'}
function chkTryOut(v){var c=clip(S.cur)||{g:'',prod:''},h=findHits(v||'',c);
  return !v?'':h.length?h.map(function(x){return LVL[x.r.lvl]+': "'+x.m+'" (luật "'+x.r.text+'")'}).join(' · '):'Không luật nào bắt.'}
function chkChanged(){REC={};chkBump();touchClips()}

document.addEventListener('click',function(e){
  var g=e.target.closest('[data-chkign],[data-chkun],[data-cract]');if(!g)return;var d=g.dataset,c=clip(S.cur);
  if(d.chkign&&c){c.ignored=(c.ignored||[]).concat([d.chkign]);chkBump();render();return}
  if(d.chkun&&c){c.ignored=(c.ignored||[]).filter(function(k){return k!==d.chkun});chkBump();render();return}
  var i=+d.i;
  switch(d.cract){
    case 'add':CRULES.push({id:chkId(),text:'cụm mới',pat:false,lvl:'warn',scope:'all',sv:'',on:true,note:''});chkChanged();render();return;
    case 'dup':var cp=JSON.parse(JSON.stringify(CRULES[i]));cp.id=chkId();CRULES.splice(i+1,0,cp);chkChanged();render();return;
    case 'del':if(!confirm('Xóa luật "'+CRULES[i].text+'"?'))return;CRULES.splice(i,1);chkChanged();render();return;
    case 'reset':if(!confirm('Thay toàn bộ danh sách luật bằng luật mặc định?'))return;CRULES=chkRulesDefault();chkChanged();render();return;
    case 'export':var blob=new Blob([JSON.stringify({loai:'xuongclip-luat',version:1,fold:CHK.fold,rules:chkToState().checkRules},null,1)],{type:'application/json'}),a=document.createElement('a');
      a.href=URL.createObjectURL(blob);a.download='luat-kiem-tra.json';document.body.appendChild(a);a.click();a.remove();return;
  }
});
document.addEventListener('change',function(e){var t=e.target,d=t.dataset;
  if(d.cr){var p=d.cr.split('|'),r=CRULES[+p[0]],f=p[1];if(!r)return;
    if(f==='on'||f==='pat')r[f]=t.checked;else if(f==='text'){if(!t.value.trim()){msg('Cụm từ không được để trống.');render();return}r.text=t.value.trim()}else r[f]=t.value;
    if(f==='scope'&&r.scope==='all')r.sv='';chkChanged();if(f==='pat'&&ruleBad(r))msg('Mẫu "'+r.text+'" không hợp lệ, luật này đang không có tác dụng.');render();return}
  if(t.id==='chkfold'){CHK.fold=t.checked;chkChanged();return}
  if(d.ckon){CHK.on[d.ckon]=t.checked;chkChanged();return}
  if(d.ck){if(d.ck==='cta')CHK.cta=t.value;else if(isFinite(+t.value)&&t.value!=='')CHK[d.ck]=+t.value;chkChanged();render();return}
  if(d.sf){if(isFinite(+t.value)&&t.value!=='')CHK.safe[d.sf]=Math.max(0,Math.min(45,+t.value));chkChanged();render();return}
  if(t.id==='safetog'){S.safe=t.checked;try{localStorage.setItem('xuongclip_safe',S.safe?'1':'0')}catch(x){}var sv=document.getElementById('safe');if(sv)sv.hidden=!S.safe;return}
  if(t.id==='chkimp'&&t.files[0]){var f0=t.files[0],rd=new FileReader();rd.onload=function(){var o;try{o=JSON.parse(String(rd.result))}catch(x){msg('File không phải JSON hợp lệ.');return}
      var arr=Array.isArray(o)?o:(o&&Array.isArray(o.rules)?o.rules:null);if(!arr){msg('Không thấy danh sách luật trong file.');return}
      var rs=arr.map(chkRuleClean).filter(Boolean);if(!rs.length){msg('File không có luật hợp lệ nào.');return}
      if(confirm('Nhập '+rs.length+' luật. Bấm OK để THAY toàn bộ danh sách hiện có, Hủy để THÊM vào cuối.'))CRULES=rs;else{rs.forEach(function(r){r.id=chkId()});CRULES=CRULES.concat(rs)}
      if(o&&typeof o.fold==='boolean')CHK.fold=o.fold;chkChanged();msg('Đã nhập '+rs.length+' luật.')};rd.readAsText(f0);t.value='';return}
});
document.addEventListener('input',function(e){if(e.target.id==='chktry'){var o=document.getElementById('chktryout');if(o)o.textContent=chkTryOut(e.target.value)}});
