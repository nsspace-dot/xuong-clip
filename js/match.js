/* Gợi ý cảnh, ghép cảnh tự động, cảnh báo trùng cảnh và kiểm tra luật.
   Điều kiện bắt buộc: video và clip CÙNG sản phẩm theo canonicalProduct(); chuỗi rỗng không bao giờ khớp.
   Video chưa gắn nhãn không bao giờ được gợi ý; nhãn "đoán" chỉ được gợi ý khi bật SG.allowGuess.
   Điểm (0–100): khớp chữ giữa "cảnh cần" và đoạn tag AI / mô tả AI / tên thẻ (tối đa 60),
   độ dài đủ dùng (tối đa 15), chưa dùng ở clip nào (tối đa 15), nguồn gốc (thô +5, đã đăng −10),
   trùng đoạn đang dùng ở clip cùng gian (−30, và không bao giờ tính là đủ điểm).
   Dưới SG.min điểm hoặc không khớp chữ nào thì không gợi ý. */

/* ---------- sản phẩm ---------- */
function prodMatch(cp,sp){var a=pkey(canonicalProduct(cp)),b=pkey(canonicalProduct(sp));return !!a&&!!b&&a===b}
function segEligible(c,s){return !!(s&&s.url&&!s.missing&&!isDel(s.id)&&s.p&&(!s.guess||SG.allowGuess)&&prodMatch(c.prod,s.p))}

/* ---------- dùng ở đâu, trùng đoạn ---------- */
function needLen(l){return Math.max(0.1,((l.e||0)-(l.s||0))*(l.spd||1))}
function lineWin(l){var sg=l.seg?seg(l.seg):null;if(!sg)return null;var d=sdur(sg),a=l.segIn||0,b=l.segOut||Math.min(d,a+needLen(l));return {a:a,b:Math.max(a+0.1,b)}}
function winOverlap(x,y){return !!x&&!!y&&Math.min(x.b,y.b)-Math.max(x.a,y.a)>0.05}
function sameGian(a,b){return pkey(a.g)===pkey(b.g)}
function usesOf(sid){var out=[];CLIPS.forEach(function(c){var t=false;c.lines.forEach(function(l,i){if(l.seg===sid){if(!t){timeline(c);t=true}out.push({c:c,i:i,w:lineWin(l)})}})});return out}
/* Các dòng khác (cùng gian, cùng tuần đang mở) đang dùng đoạn chồng lên khoảng w của video sid. */
function overlapsAt(sid,w,c,i){return usesOf(sid).filter(function(u){return !(u.c===c&&u.i===i)&&sameGian(u.c,c)&&winOverlap(u.w,w)})}
function dupsOf(c,i){var l=c.lines[i];if(!l||!l.seg)return [];timeline(c);return overlapsAt(l.seg,lineWin(l),c,i)}
function useText(u){return 'clip '+u.c.id+', dòng '+(u.i+1)}

/* ---------- chấm điểm ---------- */
function needToks(s){var o=[];toks(s).forEach(function(x){if(o.indexOf(x)<0)o.push(x)});return o}
function hitToks(nt,text){var tb=toks(text);return nt.filter(function(x){return tb.indexOf(x)>=0})}
function short(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s}
/* Mọi khoảng có thể lấy trong một video: từng đoạn tag AI (có thời gian) và cả video (mô tả AI, tên thẻ). */
function windowsOf(s){var d=sdur(s),out=[];
  (s.tags||[]).forEach(function(t){if(t.b>t.a&&t.a<d)out.push({a:t.a,b:Math.min(d,t.b),text:t.d,kind:'tag',w:1})});
  if(s.desc)out.push({a:0,b:d,text:s.desc,kind:'desc',w:0.8});
  out.push({a:0,b:d,text:s.label+' '+s.path.replace(/\.[^.]+$/,'').replace(/[\/_]+/g,' '),kind:'label',w:0.6});
  return out}
function scoreWin(c,i,s,win){
  var l=c.lines[i],nt=needToks(l.need),useT=!nt.length;if(useT)nt=needToks(l.t);if(!nt.length)return null;
  var hits=hitToks(nt,win.text);if(!hits.length)return null;
  var why=['cùng sản phẩm'],sc=Math.round(hits.length/nt.length*60*win.w*(useT?0.7:1));
  why.push((win.kind==='tag'?'đoạn AI giây '+fmt1(win.a)+'–'+fmt1(win.b)+' khớp':win.kind==='desc'?'mô tả AI khớp':'tên video khớp')+' "'+short(win.text,60)+'"'+(useT?' (theo lời thoại, dòng chưa ghi cảnh cần)':''));
  var need=needLen(l),d=sdur(s),seglen=win.kind==='tag'?win.b-win.a:d-win.a;
  if(seglen>=need-0.05){sc+=15;why.push('đủ dài ('+fmt1(seglen)+'s, cần '+fmt1(need)+'s)')}
  else if(d-win.a>=need-0.05){sc+=8;why.push('đoạn khớp '+fmt1(seglen)+'s, video chạy tiếp đủ '+fmt1(need)+'s')}
  else why.push('ngắn hơn cần ('+fmt1(d-win.a)+'s / '+fmt1(need)+'s)');
  var w={a:win.a,b:Math.min(d,win.a+need)},ov=overlapsAt(s.id,w,c,i),all=usesOf(s.id).filter(function(u){return !(u.c===c&&u.i===i)});
  if(ov.length){sc-=30;why.push('TRÙNG đoạn đang dùng ở '+ov.map(useText).join(', '))}
  else if(all.length){sc+=8;why.push('video đã dùng ở '+all.map(function(u){return 'clip '+u.c.id}).filter(function(x,k,a){return a.indexOf(x)===k}).join(', ')+' nhưng đoạn khác')}
  else{sc+=15;why.push('chưa dùng ở clip nào')}
  if(s.o==='thô')sc+=5;else if(s.o==='đã đăng'){sc-=10;why.push('lấy từ clip đã đăng')}
  if(s.guess)why.push('nhãn sản phẩm là nhãn đoán');
  return {s:s,a:Math.max(0,Math.round(win.a*10)/10),sc:sc,dup:ov.length>0,why:why}}
/* Gợi ý cho dòng i của clip c: mỗi video một kết quả (khoảng tốt nhất), sắp theo điểm.
   opt.all: trả cả kết quả dưới ngưỡng (chỉ để người dùng tự chọn). */
function suggest(c,i,opt){opt=opt||{};timeline(c);var out=[];
  SEGS.forEach(function(s){if(!segEligible(c,s))return;var best=null;
    windowsOf(s).forEach(function(win){var r=scoreWin(c,i,s,win);if(r&&(!best||r.sc>best.sc))best=r});
    if(!best&&opt.all){var w0={a:0,b:Math.min(sdur(s),needLen(c.lines[i]))},ov=overlapsAt(s.id,w0,c,i); // chỉ để tự chọn tay, không bao giờ đủ điểm
      best={s:s,a:0,sc:0,dup:ov.length>0,why:['cùng sản phẩm','không khớp chữ nào với cảnh cần'].concat(ov.length?['TRÙNG đoạn đang dùng ở '+ov.map(useText).join(', ')]:[])}}
    if(best)out.push(best)});
  out.sort(function(a,b){return b.sc-a.sc});
  return opt.all?out:out.filter(function(r){return r.sc>=SG.min&&!r.dup})} // đoạn trùng không bao giờ là gợi ý đủ điểm
function whyText(r){return 'Điểm '+r.sc+': '+r.why.join('; ')}

/* ---------- ghép tự động ---------- */
/* Dòng đã chọn cảnh tay (l.lock) giữ nguyên. Dòng khác lấy gợi ý đủ điểm tốt nhất không trùng đoạn; không có thì để trống. */
function autoPick(c){
  timeline(c);
  c.lines.forEach(function(l){if(!l.lock){l.seg=null;l.segIn=0;l.segOut=null;l.fill=null;l.why=''}});
  c.lines.forEach(function(l,i){if(l.lock)return;
    var r=suggest(c,i)[0];
    if(r){l.seg=r.s.id;l.segIn=r.a;l.why=whyText(r)}});
  c.auto=true;
}
function lockLine(l){if(l){l.lock=true;l.why=''}}

function warnings(c){
  var w=[];timeline(c);
  c.lines.forEach(function(l,i){
    var texts=[l.t].concat(l.infos.map(function(x){return x.x}));
    RULES.forEach(function(r){if(r.on&&texts.some(function(t){return r.re.test(t)}))w.push({k:'bad',m:'Dòng '+(i+1)+': '+r.m})});
    l.infos.forEach(function(x){if(cue(l,x)===null)w.push({k:'warn',m:'Dòng '+(i+1)+': cụm "'+x.ph+'" không có trong lời thoại nên chữ "'+x.x+'" sẽ không hiện'})});
    if(l.dm>0&&l.ae!=null&&l.dm<(l.ae-l.as)-0.05)w.push({k:'cut',m:'Dòng '+(i+1)+': voice dài '+fmt1(l.ae-l.as)+'s, bạn nhập '+fmt1(l.dm)+'s, sẽ bị cắt '+fmt1(l.ae-l.as-l.dm)+'s'});
    if(!l.seg)w.push({k:'warn',m:'Dòng '+(i+1)+': chưa có cảnh, xem tab Thiếu source'});
    else if(lineLost(l))w.push({k:'warn',m:'Dòng '+(i+1)+': mất cảnh ('+lostWhy(l)+'), chọn lại cảnh khác'});
    else{var u=dupsOf(c,i);if(u.length)w.push({k:'warn',m:'Dòng '+(i+1)+': đoạn này cũng dùng ở '+u.map(useText).join('; ')});
      if((seg(l.seg)||{}).o==='đã đăng')w.push({k:'warn',m:'Dòng '+(i+1)+': đoạn lấy từ clip đã đăng, dễ bị coi là nội dung lặp'})}
  });
  return w;
}
function st(c){
  if(c.exported)return 'exported';if(isDirect(c))return 'ngoai';
  if(!c.auto)return 'chuaghep';if(c.lines.some(function(l){return !lineSeg(l)}))return 'missing';
  if(warnings(c).some(function(x){return x.k==='bad'}))return 'loi';return 'ready';
}
/* Cảnh thiếu, gom theo sản phẩm (tên chuẩn). */
function missingAll(){var o={};CLIPS.forEach(function(c){if(isDirect(c)||!c.auto||c.exported)return;var k=canonicalProduct(c.prod)||'Chưa rõ sản phẩm';
  c.lines.forEach(function(l,i){if(!lineSeg(l))(o[k]=o[k]||[]).push({c:c,i:i,l:l})})});return o}

/* ---------- sự kiện: tới chỗ trùng, mở khóa dòng ---------- */
function gotoLine(cid,i){var c=clip(cid);if(!c)return;timeline(c);S.cur=cid;S.li=Math.min(i,c.lines.length-1);S.t=c.lines[S.li].s;
  if(location.hash!=='#ghep')location.hash='ghep';else render();
  setTimeout(function(){var e=document.querySelector('.line[data-li="'+S.li+'"]');if(e)e.scrollIntoView({block:'center'})},60)}
document.addEventListener('click',function(e){
  var g=e.target.closest('[data-goto]');if(g){var p=g.dataset.goto.split('|');gotoLine(p[0],+p[1]);return}
  var u=e.target.closest('[data-unlock]');if(u){var c=clip(S.cur),l=c&&c.lines[+u.dataset.unlock];if(l){l.lock=false;msg('Đã mở khóa dòng '+(+u.dataset.unlock+1)+'. Bấm "Ghép lại tự động" để tool chọn lại cảnh cho dòng này.')}}
});
