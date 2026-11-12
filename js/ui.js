/* Giao diện các tab và xem trước. */
function pill(s){return '<span class="pill p-'+s+'">'+STAT[s]+'</span>'}
/* ---------- các màn hình ---------- */
function nav(){
  var miss=0,m=missingAll();Object.keys(m).forEach(function(k){miss+=m[k].length});
  var tabs=[['kichban','Kịch bản'],['ghep','Ghép clip'],['thieu','Thiếu source'],['daxuat','Clip đã xuất'],['thuvien','Thư viện source'],['caidat','Cài đặt']];
  document.getElementById('nav').innerHTML=tabs.map(function(t,i){
    return '<a class="'+(S.tab===t[0]?'on':'')+'" href="#'+t[0]+'">'+t[1]+(t[0]==='thieu'&&miss?'<span class="cnt">'+miss+'</span>':'')+'</a>'}).join('');
}
function vKichban(){
  var h='<h1>Kịch bản tuần này</h1><p class="sub">Tải file kịch bản lên hoặc dán văn bản, sửa thoải mái trong bảng bên dưới, rồi cho tool ghép cảnh.</p>';
  h+='<div class="box"><h2>1. Nạp kịch bản</h2><div class="row2"><div><label class="lab" for="file">Tải file (.txt, .csv, .md)</label><input type="file" id="file" accept=".txt,.csv,.md,text/plain"><div class="meta">Bản thật sẽ đọc được cả PDF, Word và Google Sheet. Bản thô chỉ nhận văn bản theo mẫu dưới đây.</div></div></div>'+
    '<label class="lab" for="paste" style="margin-top:10px">Hoặc dán văn bản kịch bản</label><textarea id="paste" rows="7" style="min-height:120px" placeholder="## TV9 | Tường Vip | Lịch laser | Review 3 size&#10;Lời thoại | Cảnh cần | cụm trong thoại=chữ hiện">'+esc(S.paste)+'</textarea>'+
    '<details><summary>Định dạng văn bản</summary><pre>## Mã | Gian | Sản phẩm | Tên clip | (Người phụ trách, bỏ trống là người đầu tiên trong danh sách ở Cài đặt)\nLời thoại | Cảnh cần thấy | cụm trong thoại=chữ hiện trên hình; cụm khác=chữ khác\n(mỗi dòng thoại một dòng, bỏ trống ô cuối nếu không cần chữ thông tin)</pre></details>'+
    '<div class="bar"><button class="btn pri" data-act="load">Nạp vào danh sách</button><button class="btn" data-act="newweek" '+(CLIPS.length?'':'disabled')+'>Bắt đầu tuần mới (xóa danh sách)</button></div></div>';
  if(!CLIPS.length)return h+'<div class="empty">Chưa có clip nào. Tải file hoặc dán văn bản kịch bản rồi bấm "Nạp vào danh sách".</div>';
  var cnt={};CLIPS.forEach(function(c){var k=st(c);cnt[k]=(cnt[k]||0)+1});
  h+='<div class="sumrow">'+['chuaghep','missing','loi','ready','exported'].map(function(k){return '<div class="sum"><b>'+(cnt[k]||0)+'</b><span>'+STAT[k]+'</span></div>'}).join('')+'</div>';
  h+='<div class="box"><h2>2. Danh sách clip ('+CLIPS.length+')</h2><div class="tbl"><table><thead><tr><th>Mã</th><th>Gian</th><th>Sản phẩm</th><th>Tên</th><th>Dòng</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+
   CLIPS.map(function(c){return '<tr><td><b>'+esc(c.id)+'</b></td><td>'+esc(c.g)+'</td><td>'+esc(c.prod)+'</td><td>'+esc(c.name)+'</td><td class="mono">'+c.lines.length+'</td><td>'+pill(st(c))+'</td><td><button class="btn sm" data-edit="'+esc(c.id)+'">Sửa</button> <button class="btn sm" data-delclip="'+esc(c.id)+'">Xóa</button></td></tr>'}).join('')+
   '</tbody></table></div><div class="bar"><button class="btn pri" data-act="autoall">Ghép cảnh tự động cho tất cả</button><span class="meta">Clip của người quay trực tiếp (đánh dấu ở Cài đặt) sẽ được bỏ qua.</span></div></div>';
  var c=clip(S.edit);
  if(c){
    h+='<div class="box"><h2>3. Sửa kịch bản: '+esc(c.id)+'</h2><div class="row2" style="margin-bottom:10px">'+
     [['id','Mã'],['g','Gian'],['prod','Sản phẩm'],['name','Tên clip'],['who','Người phụ trách']].map(function(f){if(f[0]==='who')return whoSelect(c);return '<div><label class="lab" for="f_'+f[0]+'">'+f[1]+'</label><input type="text" id="f_'+f[0]+'" data-ecf="'+f[0]+'" value="'+esc(c[f[0]])+'"></div>'}).join('')+'</div>'+
     '<div class="ed meta"><span>Lời thoại</span><span>Cảnh cần thấy</span><span>Chữ thông tin (cụm=chữ; ...)</span><span></span></div>';
    c.lines.forEach(function(l,i){h+='<div class="ed"><textarea data-el="'+i+'|t" aria-label="Lời thoại dòng '+(i+1)+'">'+esc(l.t)+'</textarea><textarea data-el="'+i+'|need" aria-label="Cảnh cần dòng '+(i+1)+'">'+esc(l.need)+'</textarea><textarea data-el="'+i+'|inf" aria-label="Chữ thông tin dòng '+(i+1)+'">'+esc(infosStr(l))+'</textarea><button class="btn sm" data-dl="'+i+'">Xóa dòng</button></div>'});
    h+='<div class="bar"><button class="btn sm" data-act="addline">+ Thêm dòng</button><button class="btn pri" data-auto="'+esc(c.id)+'">Ghép cảnh tự động clip này</button><a class="btn" href="#ghep" data-cur="'+esc(c.id)+'">Mở trang ghép</a></div></div>';
  }
  return h;
}
function vGhep(){
  if(!CLIPS.length)return '<h1>Ghép clip</h1><div class="empty">Chưa có kịch bản. Qua tab Kịch bản để nạp.</div>';
  if(!clip(S.cur))S.cur=CLIPS[0].id;
  var c=clip(S.cur),sel='<select id="pickclip" style="max-width:420px" aria-label="Chọn clip">'+CLIPS.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+esc(x.id)+' · '+esc(x.name)+'</option>'}).join('')+'</select>';
  if(isDirect(c))return '<h1>Ghép clip</h1>'+sel+'<div class="empty" style="margin-top:12px">Clip này do '+esc(c.who)+' quay trực tiếp, nằm ngoài tool ghép.</div>';
  if(!c.auto)return '<h1>Ghép clip</h1>'+sel+'<div class="empty" style="margin-top:12px">Clip này chưa được ghép cảnh.<div class="bar" style="justify-content:center"><button class="btn pri" data-auto="'+esc(c.id)+'">Ghép cảnh tự động</button></div></div>';
  var tot=timeline(c),w=warnings(c),bad=w.filter(function(x){return x.k==='bad'}).length,miss=c.lines.some(function(l){return !l.seg});
  var h='<h1>'+esc(c.id)+' · '+esc(c.name)+'</h1><div class="bar" style="margin:0 0 6px">'+sel+pill(st(c))+'<span class="meta">'+esc(c.g)+' · tổng '+fmt1(tot)+'s</span></div>'+'<div class="rev"><div class="left">'+
   '<div class="phone" id="phone"><video id="pv" class="pv" muted playsinline hidden></video><div id="sc"></div><div id="tr"></div><div id="inf"></div></div><div class="ctrl"><button class="btn sm" data-act="play">'+(S.play?'Dừng':'Phát thử')+'</button><input type="range" id="scrub" min="0" max="'+tot+'" step="0.1" value="'+S.t+'" aria-label="Thanh thời gian"><span class="t" id="tt"></span></div>'+
   '<label class="note" style="display:block"><input type="checkbox" id="edtxt" '+(S.edTxt!==false?'checked':'')+'> Chế độ chỉnh chữ: hiện hết chữ của dòng đang chọn để kéo đổi vị trí</label>'+
   '<div class="trbox"><label class="lab" for="trtype">Chuyển cảnh mặc định</label><select id="trtype" style="max-width:160px">'+Object.keys(TRN).map(function(k){return '<option value="'+k+'" '+(TR.type===k?'selected':'')+'>'+TRN[k]+'</option>'}).join('')+'</select> <input type="number" id="trdur" min="0.1" max="1" step="0.1" value="'+TR.dur+'" style="width:64px" aria-label="Thời gian chuyển cảnh"> giây<div class="note">Từng chỗ nối đổi riêng được ở ô "Chuyển vào cảnh này" của mỗi dòng.</div></div>'+
   '<label class="note" style="display:block"><input type="checkbox" id="tts" '+(S.tts?'checked':'')+'> Đọc thoại bằng giọng của trình duyệt (để thử)</label><div class="note">Không phụ đề giọng đọc. Chữ thông tin chỉ hiện khi giọng tới đúng cụm. Có giọng đọc thì thời lượng mỗi dòng được đo theo giọng thật.</div></div><div>';
  if(!canonicalProduct(c.prod))h+='<div class="w warn">Clip chưa ghi sản phẩm nên tool không gợi ý cảnh được. Sửa ô Sản phẩm ở tab Kịch bản.</div>';
  h+=waveWide(c)+'<div class="warns">'+(w.length?w.map(function(x){return '<div class="w '+x.k+'">'+esc(x.m)+'</div>'}).join(''):'<div class="w ok">Không có cảnh báo luật hay trùng cảnh.</div>')+'</div>';
  c.lines.forEach(function(l,i){
    var sg=l.seg?seg(l.seg):null;
    h+='<div class="line '+(S.li===i?'cur':'')+'" data-li="'+i+'"><div class="lh"><b>Dòng '+(i+1)+'</b>'+(i>0?'<select data-ltr="'+i+'" aria-label="Chuyển vào cảnh này" style="max-width:190px"><option value="">Chuyển vào cảnh này: theo mặc định</option>'+Object.keys(TRN).map(function(k){return '<option value="'+k+'" '+(l.tr===k?'selected':'')+'>Chuyển vào cảnh này: '+TRN[k]+'</option>'}).join('')+'</select>':'')+'<span class="mono\" data-t="'+i+'">'+fmt1(l.s)+'s – '+fmt1(l.e)+'s · '+wc(l.t)+' từ</span></div><div class="lctl">'+lineCtl(c,l,i)+'</div>'+
     '<textarea data-th="'+i+'" aria-label="Lời thoại dòng '+(i+1)+'">'+esc(l.t)+'</textarea><div class="need">Cảnh cần: '+esc(l.need)+'</div>'+
     '<div class="seg">'+(sg?'<div class="thumb" style="'+bg(sg)+'"></div><div><div>'+esc(sg.label)+'</div><div class="meta">'+sid(sg.id)+' · '+sg.o+' · '+sg.d+'s'+((l.segIn||l.segOut)?' · lấy từ giây '+(l.segIn||0)+' đến '+(l.segOut||sg.d):'')+'</div></div>':'<span class="pill p-missing">Chưa có cảnh</span>')+
     (sg?'<button class="btn sm" data-pv="'+sg.id+'|'+esc(c.id)+'|'+i+'">Xem / cắt đoạn</button>':'')+
     '<button class="btn sm" data-ch="'+i+'">'+(l.choose?'Đóng gợi ý':'Đổi cảnh')+'</button>'+
     (l.lock?'<span class="bdg man" title="Chọn tay: Ghép lại tự động không đổi dòng này">đã khóa'+(sg?'':': để trống')+'</span><button class="btn xs" data-unlock="'+i+'">Mở khóa</button>':'')+'</div>';
    if(sg&&l.why&&!l.lock)h+='<div class="meta why">Tự chọn. '+esc(l.why)+'</div>';
    if(sg){var du=dupsOf(c,i);if(du.length)h+='<div class="w warn dupw">Đoạn này cũng dùng ở '+du.map(function(u){return '<button class="lnk" data-goto="'+esc(u.c.id)+'|'+u.i+'">'+esc(useText(u))+'</button>'}).join(', ')+' (cùng gian, khoảng thời gian chồng nhau).</div>'}
    if(sg)h+=trackHTML(c,l,i,sg);
    if(l.choose){
      var rs=suggest(c,i,{all:true}).filter(function(r){return r.s.id!==l.seg}),good=rs.filter(function(r){return r.sc>=SG.min&&!r.dup}),low=rs.filter(function(r){return r.sc<SG.min||r.dup});
      h+='<div class="cands2">'+(good.length?good.map(function(r){return candRow(c,i,r)}).join(''):'<div class="meta">'+(canonicalProduct(c.prod)?'Không có video "'+esc(canonicalProduct(c.prod))+'" nào đủ '+SG.min+' điểm cho dòng này.':'Clip chưa ghi sản phẩm nên không gợi ý được.')+'</div>')+
        (low.length?'<details><summary>'+low.length+' video cùng sản phẩm chưa đủ điểm hoặc trùng đoạn (chỉ tự chọn khi chắc chắn)</summary>'+low.map(function(r){return candRow(c,i,r)}).join('')+'</details>':'')+
        '<div class="bar" style="margin-top:4px"><button class="btn sm" data-pick="'+i+'|none|0">Bỏ chọn (báo thiếu)</button></div></div>';
    }
    h+='<div class="infos"><div class="irow2 hd"><span>Chữ hiện</span><span>Cụm làm mốc</span><span>Hiện lúc (s)</span><span>Ở lại (s)</span><span>Cỡ</span><span></span></div>'+l.infos.map(function(x,k){var ct=cue(l,x),sp=infoSpan(l,x);
      return '<div class="irow2"><input type="text" data-ix="'+i+'|'+k+'" value="'+esc(x.x)+'" aria-label="Chữ hiện"><input type="text" data-ip="'+i+'|'+k+'" value="'+esc(x.ph)+'" aria-label="Cụm trong thoại"><input type="number" step="0.1" min="0" data-io="'+i+'|'+k+'" value="'+((x.off!=null&&x.off!=='')?(l.s+ +x.off).toFixed(1):'')+'" placeholder="'+(ct===null?'không khớp':'tự '+ct.toFixed(1))+'" aria-label="Giây chữ hiện"><input type="number" step="0.1" min="0.5" data-il="'+i+'|'+k+'" value="'+(x.len||'')+'" placeholder="'+(sp?'tự '+(sp.b-sp.a).toFixed(1):'')+'" aria-label="Giây ở lại"><input type="number" min="10" max="200" data-isz="'+i+'|'+k+'" value="'+(x.sz||'')+'" placeholder="'+INFO.size+'" aria-label="Cỡ chữ"><button class="btn sm" data-delinfo="'+i+'|'+k+'" aria-label="Xóa chữ này" title="Xóa chữ này">×</button></div>'}).join('')+
      '<div><button class="btn sm" data-addinfo="'+i+'">+ Thêm chữ thông tin</button> <span class="meta">Ô giờ để trống thì tự tính theo cụm làm mốc. Kéo chữ ngay trên khung điện thoại để đổi vị trí. Chữ để trống sẽ bị bỏ qua.</span></div></div></div>';
  });
  h+='<div class="box" style="margin-top:12px"><h2>Xuất video thật</h2><div class="meta" style="margin-bottom:8px">Tool ghép các đoạn video theo kịch bản, chèn chữ thông tin, ra file 9:16. Tool dựng từng khung hình rồi ghép thành file MP4. Nếu Chrome không hỗ trợ cách này, tool tự chuyển sang ghi theo thời gian thật, lúc đó hãy giữ tab này ở phía trước.</div>'+
  '<div class="bar"><button class="btn ok" data-act="export" '+((bad||miss||S.exporting)?'disabled':'')+'>'+(S.exporting?'Đang xuất...':'Xuất video thật')+'</button><span class="meta" id="expst"></span></div>'+
  (c.out?'<div style="margin-top:10px"><video src="'+c.out.url+'" controls playsinline style="width:200px;border-radius:8px;background:#000"></video><div class="bar"><a class="btn pri" href="'+c.out.url+'" download="'+esc(c.out.name||(c.id+'.'+c.out.ext))+'">Tải video về ('+c.out.ext+', '+c.out.mb+' MB)</a></div></div>':'')+'</div>'+
  coverBox(c)+
  '<div class="bar"><button class="btn" data-auto="'+esc(c.id)+'">Ghép lại tự động</button>'+
     (bad?'<span class="meta">Còn '+bad+' lỗi luật, sửa xong mới xuất được.</span>':miss?'<span class="meta">Còn cảnh thiếu, xem tab Thiếu source.</span>':'')+'</div>';
  return h+'</div>'+voiceBox(c)+'</div>';
}
function candRow(c,i,r){var s=r.s;
  return '<div class="cand2'+(r.dup?' dup':'')+'"><div class="thumb" style="'+bg(s)+'"></div><div class="cinfo"><b>'+esc(s.label)+'</b> <span class="meta">điểm '+r.sc+' · '+s.o+' · '+fmt1(sdur(s))+'s</span><div class="why">'+esc(r.why.join('; '))+'</div></div>'+
   '<button class="btn sm" data-pv="'+s.id+'|'+esc(c.id)+'|'+i+'">Xem</button><button class="btn sm pri" data-pick="'+i+'|'+s.id+'|'+r.a+'">Chọn</button></div>'}
function vThieu(){
  var m=missingAll(),ks=Object.keys(m);
  var txt=ks.map(function(k){return k+':\n'+m[k].map(function(x){return '- '+(x.l.need||('cảnh cho câu: '+x.l.t))+' ('+x.c.id+', dòng '+(x.i+1)+')'}).join('\n')}).join('\n\n');
  var h='<h1>Thiếu source</h1><p class="sub">Mỗi cảnh thiếu có ba hướng xử lý: dùng cảnh có sẵn (chỉ hiện khi có video cùng sản phẩm đủ '+SG.min+' điểm), đổi thoại cho khớp cảnh có sẵn, hoặc quay thêm. Tool không gợi ý video khác sản phẩm, video chưa gắn nhãn'+(SG.allowGuess?'':' hay nhãn đoán chưa xác nhận')+'.</p>';
  if(!ks.length)return h+'<div class="empty">Không có cảnh nào thiếu. Nếu chưa thấy gì, hãy ghép cảnh tự động ở tab Kịch bản trước.</div>';
  ks.forEach(function(k){
    h+='<div class="grp"><h3>'+esc(k)+' ('+m[k].length+' cảnh)</h3>'+m[k].map(function(x){
      var al=suggest(x.c,x.i).slice(0,2),need=x.l.need||('cảnh cho câu "'+x.l.t+'"'),cid=esc(x.c.id);
      var head='<b>'+cid+', dòng '+(x.i+1)+'</b> · cần: '+esc(need)+(x.l.lock?' <span class="bdg man">đã khóa: để trống</span>':'')+'<div class="meta">Thoại: '+esc(x.l.t)+'</div>';
      if(!al.length)return '<div class="miss-item">'+head+'<div class="w warn" style="margin-top:6px"><b>Chưa có source phù hợp, cần quay thêm.</b> Cảnh cần quay: '+esc(need)+'.'+
        (canonicalProduct(x.c.prod)?'':' (Clip chưa ghi sản phẩm nên tool không gợi ý được.)')+'</div>'+
        '<div class="alts"><div><div class="lab">Quay thêm</div><div class="alt"><div class="meta" style="flex:1">Quay: '+esc(need)+'. Gợi ý: 4–6 giây, giữ máy cố định, nền sáng, quay hai góc để có thêm lựa chọn.</div></div></div></div></div>';
      return '<div class="miss-item">'+head+'<div class="alts">'+
        '<div><div class="lab">Hướng 1: dùng cảnh có sẵn đủ điểm</div>'+al.map(function(r){var s=r.s;return '<div class="alt'+(r.dup?' dup':'')+'"><div class="thumb" style="'+bg(s)+'"></div><div style="flex:1;min-width:160px">'+esc(s.label)+' <span class="meta">điểm '+r.sc+'</span><div class="why">'+esc(r.why.join('; '))+'</div></div><button class="btn sm" data-pv="'+s.id+'|'+cid+'|'+x.i+'">Xem</button> <button class="btn sm" data-useseg="'+cid+'|'+x.i+'|'+s.id+'|'+r.a+'">Dùng đoạn này</button></div>'}).join('')+'</div>'+
        '<div><div class="lab">Hướng 2: đổi thoại cho khớp cảnh có sẵn</div><div class="alt"><div class="meta" style="flex:1">Giữ cảnh "'+esc(al[0].s.label)+'" và viết lại câu thoại chỉ nói điều hình ảnh này thể hiện.</div><button class="btn sm" data-useseg="'+cid+'|'+x.i+'|'+al[0].s.id+'|'+al[0].a+'">Dùng cảnh này, tôi tự sửa thoại</button></div></div>'+
        '<div><div class="lab">Hướng 3: quay thêm</div><div class="alt"><div class="meta" style="flex:1">Quay: '+esc(need)+'. Gợi ý: 4–6 giây, giữ máy cố định, nền sáng, quay hai góc để có thêm lựa chọn.</div></div></div></div></div>'}).join('')+'</div>';
  });
  return h+'<div class="bar"><button class="btn pri" data-act="copy">'+(S.copied?'Đã sao chép':'Sao chép danh sách quay thêm gửi người quay')+'</button><span class="meta">Gom theo sản phẩm.</span></div><textarea id="misstxt" readonly style="min-height:110px;margin-top:10px" aria-label="Danh sách quay thêm">'+esc(txt)+'</textarea>';
}
function vDaxuat(){
  var gs=['Tất cả'].concat(Object.keys(EXP.reduce(function(o,x){o[x.g]=1;return o},{})));
  var rows=EXP.filter(function(x){return S.expG==='Tất cả'||x.g===S.expG});
  var h='<h1>Clip đã xuất</h1><p class="sub">Các clip đã ghép xong. Sửa caption, đánh dấu đã đăng. Bản thật lưu file mp4 vào thư mục bạn chọn trong Cài đặt, kèm xem lại ngay tại đây.</p>';
  if(!EXP.length)return h+'<div class="empty">Chưa xuất clip nào. Ghép xong ở tab Ghép clip rồi bấm Xuất clip.</div>';
  h+='<div class="chips">'+gs.map(function(g){return '<button class="chip '+(S.expG===g?'on':'')+'" data-eg="'+esc(g)+'">'+esc(g)+'</button>'}).join('')+'</div>';
  h+='<div class="tbl"><table><thead><tr><th>Clip</th><th>Gian</th><th>Giờ</th><th>Dài</th><th>Video</th><th style="min-width:260px">Caption</th><th>Đăng</th><th></th></tr></thead><tbody>'+
   rows.map(function(x){return '<tr><td><b>'+esc(x.clipId)+'</b><div class="meta">'+esc(x.name)+'</div></td><td>'+esc(x.g)+'</td><td class="mono">'+esc(x.date)+'</td><td class="mono">'+x.d+'s</td><td>'+(x.url?'<video src="'+x.url+'" controls playsinline style="width:90px;border-radius:6px;background:#000"></video><br><a class="btn sm" href="'+x.url+'" download="'+esc(x.fname||(x.clipId+'.'+x.ext))+'">Tải về</a>':'<span class="meta">chưa có file</span>')+'</td>'+
     '<td><textarea data-cap="'+x.id+'" aria-label="Caption" style="min-height:44px">'+esc(x.cap)+'</textarea></td>'+
     '<td><label><input type="checkbox" data-posted="'+x.id+'" '+(x.posted?'checked':'')+'> Đã đăng</label></td><td><button class="btn sm" data-delexp="'+x.id+'">Xóa</button></td></tr>'}).join('')+'</tbody></table></div>';
  return h;
}
function whoSelect(c){var cur=c.who||'',inL=!!person(cur),names=PEOPLE.map(function(p){return p.name});
  return '<div><label class="lab" for="f_who">Người phụ trách</label><select id="f_who" data-ecf="who"><option value=""'+(cur?'':' selected')+'>(chưa chọn)</option>'+
   (cur&&!inL?'<option selected value="'+esc(cur)+'">'+esc(cur)+' (chưa có trong danh sách)</option>':'')+
   names.map(function(n){return '<option value="'+esc(n)+'"'+(inL&&person(cur).name===n?' selected':'')+'>'+esc(n)+(person(n).direct?' · quay trực tiếp':'')+'</option>'}).join('')+'</select>'+
   (PEOPLE.length?'':'<div class="meta">Chưa có ai. Thêm ở tab Cài đặt.</div>')+'</div>'}
function peopleSettings(){
  return '<div class="set"><b>Người phụ trách</b><div class="meta">Cột Người trong kịch bản lấy tên từ danh sách này (không phân biệt hoa thường, có dấu hay không). Bỏ trống cột Người thì lấy người đầu tiên. Đánh dấu "Quay trực tiếp, không ghép" cho người tự quay clip trước máy: clip của họ nằm ngoài bước ghép cảnh.</div>'+
   (PEOPLE.length?PEOPLE.map(function(p,i){return '<div class="bar" style="margin-top:0"><input type="text" data-pname="'+i+'" value="'+esc(p.name)+'" aria-label="Tên người '+(i+1)+'" style="max-width:240px"><label class="ck"><input type="checkbox" data-pdirect="'+i+'" '+(p.direct?'checked':'')+'><span>Quay trực tiếp, không ghép</span></label><button class="btn sm" data-act="pdel" data-i="'+i+'">Xóa</button></div>'}).join(''):'<div class="meta">Chưa có ai trong danh sách.</div>')+
   '<div class="bar" style="margin-top:0"><input type="text" id="pnew" placeholder="Tên người mới" aria-label="Tên người mới" style="max-width:240px"><button class="btn" data-act="padd">Thêm</button></div></div>';
}
function suggestSettings(){
  return '<div class="set"><b>Gợi ý cảnh</b><div class="meta">Chỉ gợi ý video cùng sản phẩm (theo tên chuẩn và tên tương đương). Video chưa gắn nhãn không bao giờ được gợi ý. Điểm tối đa 100: khớp "cảnh cần" với tag/mô tả AI hoặc tên video (60), đủ dài (15), chưa dùng (15), video thô (5). Dưới ngưỡng thì không gợi ý và cảnh vào tab Thiếu source.</div>'+
   '<div class="row2"><div><label class="lab" for="sgmin">Ngưỡng điểm tối thiểu (10–95)</label><input type="number" id="sgmin" min="10" max="95" step="5" value="'+SG.min+'"></div></div>'+
   '<label class="ck"><input type="checkbox" id="sgguess" '+(SG.allowGuess?'checked':'')+'><span>Cho phép gợi ý cả video có nhãn sản phẩm "đoán" chưa xác nhận</span></label></div>'}
function vCaidat(){
  return '<h1>Cài đặt</h1><p class="sub">Chỉnh người phụ trách, danh mục sản phẩm, quy tắc gắn nhãn, chữ thông tin, thư mục lưu clip, giọng Gemini và bảng luật. Thay đổi được nhớ trong trình duyệt này.</p>'+
  gemSettings()+'<div class="set"><b>Bảng luật tự kiểm tra</b>'+RULES.map(function(r){return '<label class="ck"><input type="checkbox" data-rule="'+r.id+'" '+(r.on?'checked':'')+'><span>'+r.m+'</span></label>'}).join('')+'</div>'+
  peopleSettings()+catalogSettings()+rulesSettings()+suggestSettings()+infoSettings()+folderSettings()+deletedSettings()+qualitySettings()+'<div class="set"><div class="meta">Chưa có: nhạc nền, logo từng gian.</div></div>';
}
function infoSettings(){
  var pos=[['top','Phía trên'],['mid','Giữa'],['bottom','Phía dưới']],md=[['line','Đến hết câu thoại'],['secs','Một số giây cố định']];
  return '<div class="set"><b>Chữ thông tin trên hình</b><div class="row2"><div><label class="lab" for="i1">Cỡ chữ (24–90)</label><input type="number" id="i1" min="24" max="90" data-info="size" value="'+INFO.size+'"></div>'+
   '<div><label class="lab" for="i2">Màu chữ</label><input type="color" id="i2" data-info="fg" value="'+INFO.fg+'" style="height:36px;padding:2px"></div>'+
   '<div><label class="lab" for="i3">Màu nền chữ</label><input type="color" id="i3" data-info="bg" value="'+INFO.bg+'" style="height:36px;padding:2px"></div>'+
   '<div><label class="lab" for="i4">Vị trí</label><select id="i4" data-info="pos">'+pos.map(function(o){return '<option value="'+o[0]+'" '+(INFO.pos===o[0]?'selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>'+
   '<div><label class="lab" for="i5">Hiện trong bao lâu</label><select id="i5" data-info="mode">'+md.map(function(o){return '<option value="'+o[0]+'" '+(INFO.mode===o[0]?'selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>'+
   '<div><label class="lab" for="i6">Số giây (khi chọn cố định)</label><input type="number" id="i6" min="1" max="10" step="0.5" data-info="secs" value="'+INFO.secs+'"></div></div>'+
   '<div class="meta">Xem trước:</div><div style="width:160px;aspect-ratio:9/16;position:relative;border-radius:12px;overflow:hidden;background:linear-gradient(160deg,#8a3a1f,#3b1c14);color:#fff"><div id="infoprev" style="position:absolute;inset:0">'+infoPrevHTML()+'</div></div></div>';
}
function qualitySettings(){
  return '<div class="set"><b>Chất lượng video xuất</b><div><label class="lab" for="q1">Độ phân giải</label><select id="q1" data-q="res"><option value="720" '+(EXPQ.res==='720'?'selected':'')+'>720×1280 (nhanh, nhẹ, đủ cho TikTok)</option><option value="1080" '+(EXPQ.res==='1080'?'selected':'')+'>1080×1920 (nét hơn, file nặng, máy yếu có thể giật)</option></select></div><div class="meta">Thời gian xuất vẫn bằng đúng độ dài clip.</div></div>';
}
function folderSettings(){
  return '<div class="set"><b>Thư mục lưu clip</b><div class="meta">'+(S.dir?'Đang lưu vào: <b>'+esc(S.dir.name)+'</b>. Mỗi lần mở lại tool, lần xuất đầu Chrome có thể hỏi cấp quyền thư mục.':'Chưa chọn: clip xuất xong sẽ tải về thư mục Downloads.')+' Tên file tự đặt theo dạng MÃ_Gian_ngày-tháng. Nên tạo một thư mục riêng, đừng chọn Downloads hay Desktop vì Chrome thường chặn.</div>'+
   '<div class="bar"><button class="btn pri" data-act="pickdir">Chọn thư mục</button>'+(S.dir?'<button class="btn" data-act="cleardir">Bỏ chọn</button>':'')+'</div></div>';
}
function drawPhone(){
  var c=clip(S.cur),ph=document.getElementById('phone');if(!ph||!c||!c.lines.length)return;
  var tot=timeline(c),t=S.t,l,li;
  if(S.play&&S.mode==='tts'){li=Math.min(S.li,c.lines.length-1);l=c.lines[li]}
  else{l=c.lines.filter(function(x){return t>=x.s&&t<x.e})[0]||c.lines[c.lines.length-1];li=c.lines.indexOf(l)}
  var sg=l.seg?seg(l.seg):null,pv=document.getElementById('pv'),sc=document.getElementById('sc'),inf=document.getElementById('inf'),trl=document.getElementById('tr');
  if(trl&&!S.play)trl.innerHTML='';
  if(S.play&&trl&&pv&&li!==S.lastLi&&S.lastLi>=0&&!pv.hidden&&pv.readyState>=2&&pv.videoWidth){
    var tt=trFor(c,li);
    if(tt){try{var cvs=document.createElement('canvas');cvs.width=ph.clientWidth||270;cvs.height=ph.clientHeight||480;var cx=cvs.getContext('2d'),k2=Math.max(cvs.width/pv.videoWidth,cvs.height/pv.videoHeight),dw=pv.videoWidth*k2,dh=pv.videoHeight*k2;
      cx.drawImage(pv,(cvs.width-dw)/2,(cvs.height-dh)/2,dw,dh);cvs.style.cssText='position:absolute;inset:0;width:100%;height:100%';trl.innerHTML='';trl.appendChild(cvs);
      var kf=tt.type==='fade'?[{opacity:1},{opacity:0}]:(tt.type==='slide'?[{transform:'translateX(0)'},{transform:'translateX(-100%)'}]:[{transform:'scale(1)',opacity:1},{transform:'scale(1.25)',opacity:0}]);
      var an=cvs.animate(kf,{duration:tt.dur*1000,easing:'ease-in-out',fill:'forwards'});an.onfinish=function(){if(cvs.parentNode)cvs.parentNode.removeChild(cvs)}}catch(x){}}}
  S.lastLi=li;
  var useV=!!(sg&&sg.url&&!sg.bad);
  if(pv){pv.hidden=!useV;pv.loop=false;
    if(useV){var a0=l.segIn||0,key=sg.id+'@'+li+'@'+a0,need=Math.max(0.1,l.e-l.s),spd=l.spd||1,needS=need*spd,d=sdur(sg),out=Math.min(l.segOut||d,d),span=Math.max(0.2,out-a0);
      pv.playbackRate=Math.min(4,Math.max(0.25,spd));
      if(pv.dataset.k!==key){pv.dataset.k=key;pv.onerror=function(){sg.bad=true;drawPhone()};pv.src=sg.url;try{pv.currentTime=srcT(l,sg,t)}catch(x){}}
      else if(!S.play){try{pv.currentTime=srcT(l,sg,t)}catch(x){}}
      else if(span<needS&&!(l.fill==='hold'||l.fill==='slow')&&pv.currentTime>=a0+span-0.03){try{pv.currentTime=a0}catch(x){}}
      var held=(l.fill==='hold'||l.fill==='slow')&&span<needS&&pv.currentTime>=a0+span-0.05;
      if(S.play&&!held){var pr=pv.play();if(pr&&pr.catch)pr.catch(function(){})}else pv.pause()}
    else{try{pv.pause()}catch(x){}pv.dataset.k=''}}
  sc.innerHTML=useV?'':(sg?'<div class="scene" style="'+bg(sg)+'">'+(sg.thumb?'':esc(sg.label))+'<small>'+(sg.url?'video không phát được trong khung này':'mất file')+' · '+sg.o+'</small></div>':'<div class="scene miss">THIẾU CẢNH<small>'+esc(l.need)+'</small></div>');
  var edit=!S.play&&S.edTxt!==false;
  var shown=l.infos.map(function(x,k){return {x:x,k:k}}).filter(function(o){var x=o.x;if(!infoOk(x))return false;if(edit)return true;
    if(S.play&&S.mode==='tts'&&S.bp[li]!==undefined&&(x.off==null||x.off==='')){var i=l.t.toLowerCase().indexOf(x.ph.toLowerCase());return x.ph&&i>=0&&S.bp[li]>=i}
    var sp=infoSpan(l,x);return sp&&t>=sp.a&&t<sp.b});
  inf.innerHTML=(sg?'<div class="badge">'+esc(sg.label)+'</div>':'')+shown.map(function(o){return '<div class="info'+(edit?' drag':'')+'" data-dx="'+li+'|'+o.k+'" style="'+infoStyle((ph.clientWidth||270)/720,o.x)+'">'+esc(o.x.x)+'</div>'}).join('');
  var tt2=document.getElementById('tt');if(tt2)tt2.textContent=t.toFixed(1)+' / '+fmt1(tot)+'s';
  var sr=document.getElementById('scrub');if(sr&&document.activeElement!==sr)sr.value=t;
}
function speakLine(c,i){
  var tok=++S.tok;S.bp[i]=undefined;
  try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(c.lines[i].t);u.lang='vi-VN';
    var vs=speechSynthesis.getVoices().filter(function(v){return /^vi/i.test(v.lang)});if(vs.length)u.voice=vs[0];
    u.onboundary=function(ev){if(tok===S.tok)S.bp[i]=ev.charIndex};
    u.onend=function(){if(tok===S.tok&&S.play&&S.mode==='tts')nextLine(c)};
    u.onerror=function(){};speechSynthesis.speak(u)}catch(x){}
}
function nextLine(c){
  var l=c.lines[S.li];l.dd=Math.max(1,Math.round((S.t-l.s)*10)/10);timeline(c);
  if(S.li+1<c.lines.length){S.li++;S.t=c.lines[S.li].s;speakLine(c,S.li)}else{stop();render()}
}
function audSync(c,force){var l=c.lines[S.li];if(!S.aud||!l||l.as==null)return;
  if(S.audLi!==S.li||force){S.audLi=S.li;try{S.aud.currentTime=Math.min(l.ae,l.as+Math.max(0,S.t-l.s))}catch(x){}S.aud.play().catch(function(){})}
  else if(!S.aud.paused&&S.aud.currentTime>=l.ae-0.02){S.aud.pause()}}
function startPlay(c){
  var tot=timeline(c);if(S.stopAt==null&&S.t>=tot-0.1){S.t=0;S.li=0}
  var man=manualDur(c),l0=c.lines.filter(function(x){return S.t>=x.s&&S.t<x.e})[0];if(l0)S.li=c.lines.indexOf(l0);
  S.play=true;S.lastLi=-1;S.audLi=-1;S.mode=(S.tts&&window.speechSynthesis&&!c.audioUrl)?'tts':'timer';
  if(c.audioUrl){S.aud=new Audio(c.audioUrl);if(man){audSync(c,true)}else{try{S.aud.currentTime=Math.max(0,S.t)}catch(x){}S.aud.play().catch(function(){})}}
  if(S.mode==='tts'){var ln=c.lines.filter(function(x){return S.t>=x.s&&S.t<x.e})[0]||c.lines[0];S.li=c.lines.indexOf(ln);S.t=ln.s;speakLine(c,S.li)}
  S.tm=setInterval(function(){
    if(S.aud&&!man&&!S.aud.paused&&!S.aud.ended)S.t=S.aud.currentTime;else S.t+=0.1;
    if(S.stopAt!=null&&S.t>=S.stopAt){stop();render();return}
    if(S.mode==='tts'){var l=c.lines[S.li];if(S.t>=l.s+25)nextLine(c)}
    else{if(S.t>=tot){S.t=tot;stop();render();return}var cl=c.lines.filter(function(x){return S.t>=x.s&&S.t<x.e})[0];if(cl)S.li=c.lines.indexOf(cl);if(man)audSync(c)}
    drawPhone();document.querySelectorAll('.line').forEach(function(n,i){n.classList.toggle('cur',i===S.li)})},100);
}
function render(){
  nav();var m=document.getElementById('main');
  var banner=S.msg?'<div class="w ok" style="margin-top:12px">'+esc(S.msg)+'</div>':'';S.msg='';
  m.innerHTML=banner+{kichban:vKichban,ghep:vGhep,thieu:vThieu,daxuat:vDaxuat,thuvien:vThuvien,caidat:vCaidat}[S.tab]();
  if(S.tab==='ghep'){drawPhone();afterGhep()}
  renderSrcBar();if(S.tab==='thuvien'){observeThumbs();updSelUI()}
}
function afterGhep(){var c=clip(S.cur);if(!c||!c.lines||!c.lines.length)return;drawWave(c);
  c.lines.forEach(function(l){var sg=l.seg?seg(l.seg):null;if(sg)ensureStrip(sg)});
  var cn=document.getElementById('covc');if(cn&&c.cov)coverFrame(c,c.cov,cn)}
function route(){var h=location.hash.replace('#','');if(['kichban','ghep','thieu','daxuat','thuvien','caidat'].indexOf(h)<0)h='kichban';S.tab=h;stop();render()}
function stop(){stopB();S.stopAt=null;S.audLi=-1;S.lastLi=-1;var trl0=document.getElementById('tr');if(trl0)trl0.innerHTML='';if(S.aud){try{S.aud.pause()}catch(x){}S.aud=null}S.play=false;S.mode='';S.tok++;try{speechSynthesis.cancel()}catch(x){}if(S.tm){clearInterval(S.tm);S.tm=null}}
function live(){var c=clip(S.cur);if(!c)return;timeline(c);
  c.lines.forEach(function(l,i){var e=document.querySelector('[data-t="'+i+'"]');if(e)e.textContent=fmt1(l.s)+'s – '+fmt1(l.e)+'s · '+wc(l.t)+' từ'});drawPhone()}
