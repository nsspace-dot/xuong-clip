/* Giao diện các tab và xem trước. */
function pill(s){return '<span class="pill p-'+s+'">'+STAT[s]+'</span>'}
/* ---------- các màn hình ---------- */
function nav(){
  var miss=0,m=missingAll();Object.keys(m).forEach(function(k){miss+=m[k].length});
  var tabs=[['xuong','Xưởng'],['kichban','Kịch bản'],['ghep','Ghép clip'],['thieu','Thiếu source'],['daxuat','Clip đã xuất'],['thuvien','Thư viện source'],['caidat','Cài đặt']];
  document.getElementById('nav').innerHTML=tabs.map(function(t,i){
    return '<a class="'+(S.tab===t[0]?'on':'')+'" href="#'+t[0]+'">'+t[1]+(t[0]==='thieu'&&miss?'<span class="cnt">'+miss+'</span>':'')+'</a>'}).join('');
}
function candRow(c,i,r){var s=r.s;
  return '<div class="cand2'+(r.dup?' dup':'')+'"><div class="thumb" style="'+bg(s)+'"></div><div class="cinfo"><b>'+esc(s.label)+'</b> <span class="meta">điểm '+r.sc+' · '+s.o+' · '+fmt1(sdur(s))+'s</span><div class="why">'+esc(r.why.join('; '))+'</div></div>'+
   '<button class="btn sm" data-pv="'+s.id+'|'+esc(c.id)+'|'+i+'">Xem</button><button class="btn sm pri" data-pick="'+i+'|'+s.id+'|'+r.a+'">Chọn</button></div>'}
function vThieu(){
  if(S.thieuClip&&!clip(S.thieuClip))S.thieuClip=null;
  var m=missingAll(S.thieuClip),ks=Object.keys(m);
  var txt=ks.map(function(k){return k+':\n'+m[k].map(function(x){return '- '+(x.l.need||('cảnh cho câu: '+x.l.t))+' ('+x.c.id+', dòng '+(x.i+1)+')'}).join('\n')}).join('\n\n');
  var h='<h1>Thiếu source</h1><p class="sub">Mỗi cảnh thiếu có ba hướng xử lý: dùng cảnh có sẵn (chỉ hiện khi có video cùng sản phẩm đủ '+SG.min+' điểm), đổi thoại cho khớp cảnh có sẵn, hoặc quay thêm. Tool không gợi ý video khác sản phẩm, video chưa gắn nhãn'+(SG.allowGuess?'':' hay nhãn đoán chưa xác nhận')+'.</p>';
  if(S.thieuClip)h+='<div class="w warn">Đang lọc theo clip <b>'+esc(S.thieuClip)+'</b>. <button class="btn sm" data-xact="thieuall">Xem tất cả clip</button></div>';
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
   rows.map(function(x){return '<tr><td><b>'+esc(x.clipId)+'</b><div class="meta">'+esc(x.name)+'</div></td><td>'+esc(x.g)+'</td><td class="mono">'+esc(x.date)+'</td><td class="mono">'+x.d+'s</td><td>'+(x.url?'<video src="'+x.url+'" controls playsinline style="width:90px;border-radius:6px;background:#000"></video><br><a class="btn sm" href="'+x.url+'" download="'+esc(x.fname||(x.clipId+'.'+x.ext))+'">Tải về</a>':'<span class="meta">'+(x.savedIn?'Đã lưu ở thư mục "'+esc(x.savedIn)+'"':'Bản xem trong trình duyệt không còn')+'<br>'+esc(x.fname||'')+'</span>')+'</td>'+
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
  gemSettings()+checkRulesSettings()+checkFormSettings()+safeSettings()+
  peopleSettings()+catalogSettings()+rulesSettings()+suggestSettings()+infoSettings()+folderSettings()+deletedSettings()+qualitySettings()+tsSettings()+'<div class="set"><div class="meta">Chưa có: logo từng gian. Nhạc nền chọn riêng cho từng clip ở màn Ghép clip.</div></div>';
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
      var pvc0=document.getElementById('pvc');if(pvc0)cx.drawImage(pvc0,0,0,cvs.width,cvs.height);else cx.drawImage(pv,(cvs.width-dw)/2,(cvs.height-dh)/2,dw,dh);cvs.style.cssText='position:absolute;inset:0;width:100%;height:100%';trl.innerHTML='';trl.appendChild(cvs);
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
  var tot=timeline(c)+endDur(c);if(S.stopAt==null&&S.t>=tot-0.1){S.t=0;S.li=0}
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
/* Vẽ lại màn hiện tại. Khi đang vẽ mà có yêu cầu vẽ lại (ô đang gõ bị gỡ ra sinh sự kiện change/blur),
   không vẽ lồng nhau mà hẹn vẽ lại ngay sau đó. */
function render(){if(S._rendering){S._rerender=true;return}S._rendering=true;try{renderNow()}finally{S._rendering=false;if(S._rerender){S._rerender=false;setTimeout(render,0)}}}
function renderNow(){
  chkBump();nav();var m=document.getElementById('main');
  var banner=S.msg?'<div class="w ok" style="margin-top:12px">'+esc(S.msg)+'</div>':'';S.msg='';
  m.innerHTML=banner+{xuong:vXuong,kichban:vKichban,ghep:vGhep,thieu:vThieu,daxuat:vDaxuat,thuvien:vThuvien,caidat:vCaidat}[S.tab]();
  if(S.tab==='ghep'){drawPhone();afterGhep()}
  renderSrcBar();if(S.tab==='thuvien'){observeThumbs();updSelUI()}if(S.tab==='ghep')observeThumbs();
}
function afterGhep(){var c=clip(S.cur);if(!c||!c.lines||!c.lines.length)return;drawWave(c);
  c.lines.forEach(function(l){var sg=l.seg?seg(l.seg):null;if(sg)ensureStrip(sg)});
  var cn=document.getElementById('covc');if(cn&&c.cov)coverFrame(c,c.cov,cn)}
function route(){var h=location.hash.replace('#','');if(['xuong','kichban','ghep','thieu','daxuat','thuvien','caidat'].indexOf(h)<0)h='xuong';S.tab=h;stop();render()}
function stop(){stopB();S.stopAt=null;S.audLi=-1;S.lastLi=-1;var trl0=document.getElementById('tr');if(trl0)trl0.innerHTML='';if(S.aud){try{S.aud.pause()}catch(x){}S.aud=null}S.play=false;S.mode='';S.tok++;try{speechSynthesis.cancel()}catch(x){}if(S.tm){clearInterval(S.tm);S.tm=null}}
function live(){var c=clip(S.cur);if(!c)return;timeline(c);
  c.lines.forEach(function(l,i){document.querySelectorAll('[data-t="'+i+'"]').forEach(function(e){e.textContent=e.classList.contains('ld')?tc(l.e-l.s):tc(l.s)+' – '+tc(l.e)+' · '+wc(l.t)+' từ'})});drawPhone();schedChk()}
