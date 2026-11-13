/* Xuất: chất lượng, ước tính dung lượng, tên file theo mẫu, file .txt kèm theo, caption, hàng đợi xuất nhiều clip.
   - Chất lượng: 720p / 1080p (mặc định 1080p), mức bitrate nhẹ / vừa / cao. Dung lượng ước tính = bitrate × thời lượng.
   - Tên file: mẫu sửa được (mặc định <mã>_<tên>), bỏ dấu, chỉ giữ chữ không dấu, số, "_" và "-", không trùng.
   - Mỗi file xuất kèm một file .txt cùng tên: toàn bộ lời thoại + caption / hashtag người dùng nhập. Tool không tự viết caption.
   - Hàng đợi: chọn nhiều clip (mặc định chỉ clip không còn LỖI và chưa xuất), xuất lần lượt, có tiến độ, hủy được,
     một clip hỏng không dừng cả hàng, cuối cùng có bảng tổng kết. */
var EXPBR={nhe:['Nhẹ',3e6,5e6],vua:['Vừa',5e6,8e6],cao:['Cao',8e6,12e6]};
if(EXPQ.res!=='720'&&EXPQ.res!=='1080')EXPQ.res='1080';if(!EXPBR[EXPQ.br])EXPQ.br='vua';if(typeof EXPQ.tpl!=='string'||!EXPQ.tpl.trim())EXPQ.tpl='<mã>_<tên>';EXPQ.date=!!EXPQ.date;
function expBitrate(){var b=EXPBR[EXPQ.br]||EXPBR.vua;return EXPQ.res==='1080'?b[2]:b[1]}
function expDur(c){return clipTotal(c)+(endOn(c)?0:0.4)}
function expEstimate(c){var a=(c.audioFile||hasMusic(c))?128000:0;return (expBitrate()+a)*expDur(c)/8/1048576}
function fmtMB(x){return (x<10?x.toFixed(1):Math.round(x))+' MB'}

/* ---------- tên file ---------- */
function slugVi(s){return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/_+/g,'_').replace(/^[_-]+|[_-]+$/g,'')}
function shortSlug(s,n){s=slugVi(s);if(s.length<=n)return s;var cut=s.slice(0,n),j=cut.lastIndexOf('_');return (j>n*0.5?cut.slice(0,j):cut).replace(/[_-]+$/,'')}
function expDay(d){d=d||new Date();var p=function(n){return ('0'+n).slice(-2)};return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())}
function expName(c,d){var tpl=String(EXPQ.tpl||'<mã>_<tên>'),day=expDay(d);
  var s=tpl.replace(/<mã>/g,'\u0001'+slugVi(c.id)+'\u0001').replace(/<tên>/g,'\u0001'+shortSlug(c.name,30)+'\u0001').replace(/<gian>/g,'\u0001'+slugVi(c.g)+'\u0001').replace(/<sp>/g,'\u0001'+shortSlug(c.prod,24)+'\u0001').replace(/<ngày>/g,'\u0001'+day+'\u0001');
  if(EXPQ.date&&tpl.indexOf('<ngày>')<0)s+='_'+day;
  s=slugVi(s.replace(/\u0001/g,'_')).slice(0,90).replace(/[_-]+$/,'');return s||slugVi(c.id)||'clip'}
function baseOf(n){return String(n||'').replace(/\.[A-Za-z0-9]{1,5}$/,'')}
/* Không trùng với file đã xuất trong phiên / trong danh sách Clip đã xuất. */
function uniqSession(base){var used={};EXP.forEach(function(x){used[baseOf(x.fname).toLowerCase()]=1});var n=base;for(var i=2;used[n.toLowerCase()];i++)n=base+'-'+i;return n}
/* Không trùng với file có sẵn trong thư mục lưu (xét cả video lẫn .txt). */
async function uniqDir(dir,base,exts){for(var i=1;i<1000;i++){var n=i>1?base+'-'+i:base,hit=false;
    for(var k=0;k<exts.length&&!hit;k++){try{await dir.getFileHandle(n+'.'+exts[k]);hit=true}catch(e){}}if(!hit)return n}return base+'-'+Date.now()}

/* ---------- .txt kèm theo ---------- */
function clipTxt(c){timeline(c);var L=[c.id+' · '+(c.name||''),'Gian: '+(c.g||'')+(c.prod?' · Sản phẩm: '+c.prod:''),'','LỜI THOẠI'];
  c.lines.forEach(function(l,i){L.push((i+1)+'. '+String(l.t||'').trim())});
  if(endOn(c)&&String(c.end.text||'').trim())L.push('','CHỮ KHUNG KẾT',String(c.end.text).trim());
  L.push('','CAPTION / HASHTAG',String(c.capt||'').trim()||'(chưa nhập caption)');return L.join('\r\n')+'\r\n'}
/* Lưu video + .txt cùng tên vào thư mục đã chọn; chưa chọn thư mục thì để tải về. Không bao giờ ghi đè file có sẵn. */
async function saveExport(c,blob,base,ext){var r={name:'',txt:'',extra:'',savedIn:'',txtUrl:''},txt='﻿'+clipTxt(c),tb=new Blob([txt],{type:'text/plain;charset=utf-8'});
  base=uniqSession(base);
  if(S.dir){try{var pm=await S.dirPerm;if(pm!=='granted')throw new Error('chưa cấp quyền thư mục');var b2=await uniqDir(S.dir,base,[ext,'txt']);
      await writeBlob(S.dir,b2+'.'+ext,blob);await writeBlob(S.dir,b2+'.txt',tb);r.name=b2+'.'+ext;r.txt=b2+'.txt';r.savedIn=S.dir.name;
      r.extra=' Đã lưu vào thư mục "'+S.dir.name+'": '+r.name+' và '+r.txt+'.';return r}
    catch(e){r.extra=' Chưa lưu được vào thư mục ('+(e&&e.message?e.message:e)+'), hãy dùng nút Tải video về.'}}
  r.name=base+'.'+ext;r.txt=base+'.txt';r.txtUrl=URL.createObjectURL(tb);return r}

/* ---------- caption ---------- */
function copyText(s){var fb=function(){var t=document.createElement('textarea');t.value=s;t.style.cssText='position:fixed;left:-9999px';document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove()};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(s).catch(fb);}catch(e){}fb();return Promise.resolve()}
function captBox(c){return '<label class="lab" for="capt">Caption / hashtag (bạn tự viết, đi kèm file .txt)</label><textarea id="capt" data-capt="'+esc(c.id)+'" rows="3" placeholder="Viết caption và hashtag cho clip này">'+esc(c.capt||'')+'</textarea>'+
  '<div class="bar" style="margin-top:4px"><button class="btn sm" data-copycap="clip|'+esc(c.id)+'"'+(c.capt?'':' disabled')+'>Sao chép caption</button></div>'}

/* ---------- chất lượng ---------- */
function expQualityHTML(c){
  return '<div class="qopt"><label class="lc">Độ phân giải<select data-q="res"><option value="1080"'+(EXPQ.res==='1080'?' selected':'')+'>1080×1920 (mặc định)</option><option value="720"'+(EXPQ.res==='720'?' selected':'')+'>720×1280 (nhẹ hơn)</option></select></label>'+
   '<label class="lc">Bitrate<select data-q="br">'+Object.keys(EXPBR).map(function(k){return '<option value="'+k+'"'+(EXPQ.br===k?' selected':'')+'>'+EXPBR[k][0]+' · '+((EXPQ.res==='1080'?EXPBR[k][2]:EXPBR[k][1])/1e6)+' Mbps</option>'}).join('')+'</select></label></div>'+
   '<div class="meta">Khung dọc 9:16. '+(c?'Ước tính: <b class="qest">≈ '+fmtMB(expEstimate(c))+'</b> cho '+fmt1(expDur(c))+' giây (số ước lượng, file thật có thể lệch).':'Dung lượng ước tính ≈ '+fmtMB((expBitrate()+128000)*50/8/1048576)+' cho clip 50 giây.')+'</div>'}
function nameHTML(){var c=CLIPS[0];
  return '<div class="qopt"><label class="lc" style="flex:2">Mẫu tên file<input type="text" data-q="tpl" value="'+esc(EXPQ.tpl)+'" aria-label="Mẫu tên file"></label><label class="ck sm" style="align-self:end"><input type="checkbox" id="qdate"'+(EXPQ.date?' checked':'')+'> thêm ngày xuất</label></div>'+
   '<div class="meta">Dùng được: &lt;mã&gt; &lt;tên&gt; (tên clip rút gọn) &lt;gian&gt; &lt;sp&gt; &lt;ngày&gt;. Tool tự bỏ dấu, bỏ ký tự lạ và thêm -2, -3 nếu trùng.'+(c?' Ví dụ: <span class="mono">'+esc(expName(c))+'.mp4</span>':'')+'</div>'}
function qualitySettings(){return '<div class="set"><b>Chất lượng và tên file xuất</b>'+expQualityHTML(null)+nameHTML()+'</div>'}

/* ---------- hàng đợi ---------- */
function qWhy(c){if(!c)return 'clip không còn';if(isDirect(c))return 'quay trực tiếp, nằm ngoài tool ghép';if(!c.auto)return 'chưa ghép cảnh';var r=checkClip(c);
  if(r.errs.length)return 'còn '+r.errs.length+' LỖI: '+r.errs.slice(0,2).map(function(x){return (x.i>=0?'dòng '+(x.i+1)+': ':'')+x.title}).join('; ')+(r.errs.length>2?'; …':'');return ''}
function qDefault(){S.qSel={};CLIPS.forEach(function(c){if(!qWhy(c)&&!c.exported)S.qSel[c.id]=true})}
var QST={wait:'Chờ',run:'Đang xuất',ok:'Đã xuất',err:'Lỗi',skip:'Bỏ qua',cancel:'Đã hủy'};
function qItem(id){var q=S.q;if(!q)return null;return q.items.filter(function(x){return x.id===id})[0]||null}
function qTotalPct(){var q=S.q;if(!q||!q.items.length)return 0;var s=0;q.items.forEach(function(x){s+=x.st==='run'?(x.pct||0):(x.st==='wait'?0:1)});return s/q.items.length}
function qPanel(){if(!S.qSel)qDefault();var q=S.q,run=!!(q&&q.run),n=CLIPS.filter(function(c){return S.qSel[c.id]&&!qWhy(c)}).length,est=0;
  CLIPS.forEach(function(c){if(S.qSel[c.id]&&!qWhy(c))est+=expEstimate(c)});
  var rows=CLIPS.map(function(c){var why=qWhy(c),it=qItem(c.id),ck=!why&&!!S.qSel[c.id],stx;
    if(it&&it.st==='run')stx='<div class="qbar"><span id="qp-'+esc(c.id)+'" style="width:'+Math.round((it.pct||0)*100)+'%"></span></div><span class="meta" id="qpt-'+esc(c.id)+'">'+Math.round((it.pct||0)*100)+'%</span>';
    else if(it&&it.st!=='wait')stx='<span class="qs '+it.st+'">'+QST[it.st]+'</span>'+(it.msg?' <span class="meta">'+esc(it.msg)+'</span>':'')+(it.fname?' <span class="mono meta">'+esc(it.fname)+'</span>':'');
    else if(it)stx='<span class="qs wait">Chờ</span>';
    else stx=why?'<span class="qs skip">Bỏ qua</span> <span class="meta">'+esc(why)+'</span>':(c.exported?'<span class="meta">Đã xuất trước đây · chọn để xuất lại</span>':'<span class="qs ready">Sẵn sàng</span>');
    return '<tr class="'+(why?'qno':'')+'"><td><input type="checkbox" data-qsel="'+esc(c.id)+'"'+(ck?' checked':'')+(why||run?' disabled':'')+' aria-label="Chọn '+esc(c.id)+'"></td><td><b>'+esc(c.id)+'</b><div class="meta">'+esc(c.name)+'</div></td><td>'+esc(c.g)+'</td><td class="mono">'+fmt1(expDur(c))+'s</td><td class="mono">'+(why?'':'≈ '+fmtMB(expEstimate(c)))+'</td><td>'+stx+'</td></tr>'}).join('');
  var h='<details class="box qbox" id="qbox" open><summary><b>Xuất hàng loạt</b> <span class="meta">'+(run?'đang xuất…':n+' clip đã chọn · ≈ '+fmtMB(est))+'</span></summary>'+
   '<div class="qset">'+expQualityHTML(null)+nameHTML()+'</div>'+
   '<div class="bar"><button class="btn pri" data-qact="run"'+(run||!n||S.exporting?' disabled':'')+'>Xuất '+n+' clip đã chọn</button>'+
   (run?'<button class="btn" data-qact="cancel"'+(S.expCancel?' disabled':'')+'>'+(S.expCancel?'Đang hủy…':'Hủy')+'</button>':'<button class="btn sm" data-qact="all">Chọn mọi clip sẵn sàng</button><button class="btn sm" data-qact="none">Bỏ chọn hết</button>')+
   (run?'<div class="qbar big"><span id="qp-all" style="width:'+Math.round(qTotalPct()*100)+'%"></span></div><span class="meta" id="qpt-all">'+q.items.filter(function(x){return x.st!=='wait'&&x.st!=='run'}).length+' / '+q.items.length+' clip</span>':'')+'</div>'+
   '<div class="meta">Mặc định chỉ chọn clip không còn LỖI và chưa xuất. Clip còn LỖI bị bỏ qua (xem lý do). Clip còn CẢNH BÁO vẫn xuất được nếu bạn chọn. Một clip lỗi không làm dừng cả hàng.'+(S.dir?' Lưu vào thư mục "'+esc(S.dir.name)+'".':' Chưa chọn thư mục lưu (Cài đặt › Thư mục lưu clip): file sẽ nằm ở danh sách bên dưới để tải về.')+'</div>'+
   '<div class="tbl"><table class="qtbl"><thead><tr><th></th><th>Clip</th><th>Gian</th><th>Dài</th><th>Ước tính</th><th style="min-width:260px">Trạng thái</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+(S.qSum?qSummary():'')+'</details>';
  return h}
function qSummary(){var s=S.qSum,cnt=function(k){return s.items.filter(function(x){return x.st===k}).length};
  return '<div class="qsum"><b>Tổng kết lần xuất lúc '+hhmm(s.at)+'</b>: '+cnt('ok')+' đã xuất, '+cnt('err')+' lỗi, '+cnt('skip')+' bỏ qua, '+cnt('cancel')+' đã hủy.'+
   '<table><thead><tr><th>Clip</th><th>Kết quả</th><th>File</th><th>Dung lượng</th><th>Thời gian</th></tr></thead><tbody>'+s.items.map(function(x){return '<tr><td><b>'+esc(x.id)+'</b></td><td><span class="qs '+x.st+'">'+QST[x.st]+'</span>'+(x.msg?' <span class="meta">'+esc(x.msg)+'</span>':'')+'</td><td class="mono">'+esc(x.fname||'')+(x.txt?'<br>'+esc(x.txt):'')+'</td><td class="mono">'+(x.mb?x.mb+' MB':'')+'</td><td class="mono">'+(x.sec!=null?fmt1(x.sec)+'s':'')+'</td></tr>'}).join('')+'</tbody></table>'+
   '<div class="bar"><button class="btn sm" data-qact="clearsum">Ẩn tổng kết</button></div></div>'}
function qPaint(){if(S.tab!=='daxuat')return;var b=document.getElementById('qbox');if(!b){render();return}var w=document.createElement('div');w.innerHTML=qPanel();b.replaceWith(w.firstChild)}
function qProg(){var q=S.q;if(!q)return;q.items.forEach(function(x){if(x.st!=='run')return;var e=document.getElementById('qp-'+x.id),t=document.getElementById('qpt-'+x.id);if(e)e.style.width=Math.round((x.pct||0)*100)+'%';if(t)t.textContent=Math.round((x.pct||0)*100)+'%'});
  var a=document.getElementById('qp-all');if(a)a.style.width=Math.round(qTotalPct()*100)+'%'}
async function runQueue(){if(S.exporting||(S.q&&S.q.run))return;if(!S.qSel)qDefault();
  var ids=CLIPS.filter(function(c){return S.qSel[c.id]&&!qWhy(c)}).map(function(c){return c.id});if(!ids.length){msg('Chưa chọn clip nào sẵn sàng để xuất.');return}
  var skip=CLIPS.filter(function(c){return qWhy(c)}).map(function(c){return {id:c.id,st:'skip',msg:qWhy(c)}});
  askDir();S.expCancel=false;S.qSum=null;S.q={run:true,items:ids.map(function(id){return {id:id,st:'wait',pct:0}}),skip:skip};render();
  for(var i=0;i<S.q.items.length;i++){var it=S.q.items[i];
    if(S.expCancel){it.st='cancel';it.msg='hủy trước khi tới lượt';continue}
    var c=clip(it.id),why=qWhy(c);if(why){it.st='skip';it.msg=why;continue}
    it.st='run';it.t0=Date.now();qPaint();
    try{var r=await exportClip(c,{queue:true,onProg:(function(x){return function(f){x.pct=Math.max(0,Math.min(1,f));qProg()}})(it)});
      if(r&&r.ok){it.st='ok';it.fname=r.fname;it.txt=r.txt;it.mb=r.mb}else if(r&&r.cancel){it.st='cancel';it.msg='hủy giữa chừng, không lưu file'}else{it.st='err';it.msg=(r&&r.err)||'lỗi không rõ'}}
    catch(e){S.exporting=false;it.st='err';it.msg=e&&e.message?e.message:String(e)}
    it.sec=(Date.now()-it.t0)/1000;qPaint()}
  var items=S.q.items;S.q.run=false;S.qSum={items:items.concat(S.q.skip),at:Date.now()};S.q=null;S.qSel=null;S.expCancel=false;
  var k=function(st){return items.filter(function(x){return x.st===st}).length};touchClips();
  msg('Xuất hàng loạt xong: '+k('ok')+' đã xuất, '+k('err')+' lỗi, '+k('cancel')+' đã hủy, '+S.qSum.items.filter(function(x){return x.st==='skip'}).length+' bỏ qua. Xem bảng tổng kết.')}

/* ---------- sự kiện ---------- */
document.addEventListener('click',function(e){var b=e.target.closest('[data-qact],[data-copycap]');if(!b)return;
  if(b.dataset.copycap){var p=b.dataset.copycap.split('|'),s='';if(p[0]==='clip'){var c=clip(p[1]);s=c?c.capt||'':''}else{var x=EXP.filter(function(y){return y.id===p[1]})[0];s=x?x.cap||'':''}
    if(!s){msg('Chưa có caption để sao chép.');return}copyText(s).then(function(){S.copiedCap=s;msg('Đã sao chép caption.')});return}
  switch(b.dataset.qact){
    case 'run':runQueue();return;
    case 'cancel':S.expCancel=true;b.disabled=true;b.textContent='Đang hủy…';return;
    case 'all':S.qSel={};CLIPS.forEach(function(c){if(!qWhy(c))S.qSel[c.id]=true});render();return;
    case 'none':S.qSel={};render();return;
    case 'clearsum':S.qSum=null;render();return}});
document.addEventListener('change',function(e){var t=e.target,d=t.dataset;
  if(d.qsel){if(!S.qSel)qDefault();if(t.checked)S.qSel[d.qsel]=true;else delete S.qSel[d.qsel];if(S.tab==='daxuat')qPaint();return}
  if(t.id==='qdate'){EXPQ.date=t.checked;saveQ();render();return}
  if(d.q){setTimeout(render,0);return} // events.js đã lưu EXPQ; vẽ lại để cập nhật ước tính và ví dụ tên file
  if(d.capt){var c=clip(d.capt);if(c){c.capt=t.value;touchClips()}return}
  if(d.cap){var x=EXP.filter(function(y){return y.id===d.cap})[0],cc=x&&clip(x.clipId);if(cc)cc.capt=t.value;touchClips();return}});
document.addEventListener('input',function(e){var t=e.target;if(t.dataset&&t.dataset.capt){var c=clip(t.dataset.capt);if(c)c.capt=t.value;var b=document.querySelector('[data-copycap="clip|'+t.dataset.capt+'"]');if(b)b.disabled=!t.value}});
