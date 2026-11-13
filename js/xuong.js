/* Màn "Xưởng": bảng dây chuyền sản xuất của tuần.
   - Mỗi clip tự rơi vào một trạm theo dữ liệu (không kéo thả); riêng "Đã đăng" do người dùng đánh dấu.
   - Mốc hạn chót nhập tay (tên, ngày giờ theo múi giờ máy, % clip phải tới trạm đích).
   - Lọc theo người, gian, trạm, có lỗi, thiếu source; xem theo trạm hoặc theo người. Bộ lọc nhớ trong localStorage.
   Lưu trong state.json (version 5): clip.posted / clip.postedAt, milestones. */
var STAGES=[['kichban','Kịch bản'],['ghep','Ghép cảnh'],['kiemtra','Kiểm tra'],['ready','Sẵn sàng xuất'],['exported','Đã xuất'],['posted','Đã đăng']];
var STG={};STAGES.forEach(function(s,i){STG[s[0]]=i});
var MILES=[];
S.xf=(function(){var d={who:[],g:[],st:[],err:false,miss:false,view:'stage'};try{var o=JSON.parse(localStorage.getItem('xuongclip_xf')||'null');if(o)for(var k in d)if(k in o)d[k]=o[k]}catch(e){}return d})();
S.xundo=null;S.thieuClip=null;
function saveXf(){try{localStorage.setItem('xuongclip_xf',JSON.stringify(S.xf))}catch(e){}}

/* ---------- trạm của một clip ---------- */
function clipExported(c){return !!c.exported||EXP.some(function(x){return x.clipId===c.id})}
function clipPosted(c){return !!c.posted}
function segCount(c){return c.lines.filter(function(l){return !!lineSeg(l)}).length}
function hasVoice(c){return !!c.audioUrl&&!c.audioMissing}
function clipStage(c){
  if(clipPosted(c))return 'posted';
  if(clipExported(c))return 'exported';
  if(isDirect(c))return 'ready'; // quay trực tiếp, ngoài tool ghép: chờ người dùng đánh dấu đã đăng
  var n=segCount(c);if(!n)return 'kichban';
  if(n<c.lines.length||!hasVoice(c))return 'ghep';
  if(checkClip(c).errs.length)return 'kiemtra';
  return 'ready'}
function clipWho(c){return c.who||''}

/* ---------- lọc ---------- */
function xFiltered(){var f=S.xf;return CLIPS.filter(function(c){var r=checkClip(c),st=clipStage(c);
  return (!f.who.length||f.who.indexOf(clipWho(c))>=0)&&(!f.g.length||f.g.indexOf(c.g||'')>=0)&&(!f.st.length||f.st.indexOf(st)>=0)&&
    (!f.err||r.errs.length>0)&&(!f.miss||(!isDirect(c)&&segCount(c)<c.lines.length))})}
function xActive(){var f=S.xf;return !!(f.who.length||f.g.length||f.st.length||f.err||f.miss)}

/* ---------- hạn chót ---------- */
function milePct(m){var list=CLIPS;if(!list.length)return 0;var t=STG[m.target]||STG.ready;return Math.round(list.filter(function(c){return STG[clipStage(c)]>=t}).length/list.length*100)}
function durTxt(ms){var a=Math.abs(ms),d=Math.floor(a/864e5),h=Math.floor(a%864e5/36e5),mi=Math.floor(a%36e5/6e4);return d?d+' ngày '+h+' giờ':h?h+' giờ '+mi+' phút':mi+' phút'}
function mileState(m){var at=new Date(m.at).getTime(),now=Date.now(),pct=milePct(m),done=pct>=m.pct,left=at-now;
  if(!isFinite(at))return {cls:'',txt:'Chưa có ngày giờ',pct:pct,done:done};
  if(done)return {cls:'ok',txt:(left>=0?'Đã đạt · còn '+durTxt(left):'Đã đạt'),pct:pct,done:true};
  if(left<0)return {cls:'err',txt:'Quá hạn '+durTxt(left),pct:pct,done:false};
  if(left<24*36e5)return {cls:'warn',txt:'Còn '+durTxt(left),pct:pct,done:false};
  return {cls:'',txt:'Còn '+durTxt(left),pct:pct,done:false}}
function fmtAt(s){var d=new Date(s);if(!isFinite(d))return '';var p=function(n){return ('0'+n).slice(-2)};return p(d.getHours())+':'+p(d.getMinutes())+' ngày '+p(d.getDate())+'/'+p(d.getMonth()+1)}
function mileHTML(m,i){var s=mileState(m),tn=(STAGES[STG[m.target]]||STAGES[3])[1];
  return '<div class="mile '+s.cls+'" data-mile="'+i+'"><div class="mh"><b>'+esc(m.name||'Mốc')+'</b><span class="mt">'+esc(fmtAt(m.at))+'</span><span class="mc" data-mcd="'+i+'">'+esc(s.txt)+'</span></div>'+
   '<div class="mgoal"><span>'+m.pct+'% clip tới trạm "'+esc(tn)+'" · đang '+s.pct+'%</span>'+
   '<button class="btn xs" data-xact="medit" data-i="'+i+'">Sửa</button><button class="btn xs" data-xact="mdel" data-i="'+i+'">Xóa</button></div>'+
   '<div class="mbar" title="Đang '+s.pct+'%, mục tiêu '+m.pct+'%"><span class="mfill" style="width:'+Math.min(100,s.pct)+'%"></span><span class="mtgt" style="left:'+Math.min(100,m.pct)+'%"></span></div></div>'}
function mileForm(){var e=S.medit!=null?MILES[S.medit]:null,dv=e?e.at:'',tg=e?e.target:'ready';
  return '<div class="mform"><input type="text" id="mname" placeholder="Tên mốc, ví dụ: Chốt clip tuần" value="'+esc(e?e.name:'')+'" aria-label="Tên mốc">'+
   '<input type="datetime-local" id="mat" value="'+esc(dv)+'" aria-label="Ngày giờ hạn chót">'+
   '<input type="number" id="mpct" min="1" max="100" value="'+(e?e.pct:70)+'" aria-label="Phần trăm mục tiêu" style="width:70px">% clip tới'+
   '<select id="mtgt" aria-label="Trạm đích">'+STAGES.slice(1).map(function(s){return '<option value="'+s[0]+'" '+(tg===s[0]?'selected':'')+'>'+s[1]+'</option>'}).join('')+'</select>'+
   '<button class="btn sm pri" data-xact="msave">'+(e?'Lưu mốc':'Thêm mốc')+'</button>'+(e?'<button class="btn sm" data-xact="mcancel">Hủy</button>':'')+'</div>'}

/* ---------- thẻ clip ---------- */
function xCard(c){var r=checkClip(c),n=segCount(c),N=c.lines.length,miss=N-n,tot=timeline(c),st=clipStage(c);
  return '<div class="xcard" data-xopen="'+esc(c.id)+'" title="Mở '+esc(c.id)+' ở màn Ghép clip"><div class="xc1">'+chkDot(c)+'<b>'+esc(c.id)+'</b><span class="xdur">'+tc(tot)+'</span></div>'+
   '<div class="xname">'+esc(c.name||'(chưa đặt tên)')+'</div><div class="xmeta">'+esc(c.g||'chưa ghi gian')+' · '+esc(clipWho(c)||'chưa giao')+(isDirect(c)?' · quay trực tiếp':'')+'</div>'+
   (isDirect(c)?'':'<div class="xprog" title="Đã gán cảnh '+n+'/'+N+' dòng"><span style="width:'+(N?n/N*100:0)+'%"></span></div>')+
   '<div class="xc3">'+(isDirect(c)?'':'<span class="xsg">'+n+'/'+N+' cảnh</span>')+(r.errs.length?'<span class="xe">'+r.errs.length+' lỗi</span>':'')+(r.warns.length?'<span class="xw">'+r.warns.length+' cảnh báo</span>':'')+
   (miss&&!isDirect(c)&&st!=='kichban'?'<button class="xmiss" data-xact="thieu" data-id="'+esc(c.id)+'" title="Xem cảnh thiếu của clip này ở tab Thiếu source">thiếu '+miss+' cảnh</button>':'')+'</div>'+
   (st==='posted'?'<div class="xc4"><span class="meta">Đăng '+esc(c.postedAt?fmtAt(c.postedAt):'')+'</span><button class="btn xs" data-xact="unpost" data-id="'+esc(c.id)+'">Bỏ đánh dấu</button></div>':
    (st==='exported'||isDirect(c))?'<div class="xc4"><button class="btn xs pri" data-xact="post" data-id="'+esc(c.id)+'">Đánh dấu đã đăng</button></div>':'')+'</div>'}

/* ---------- màn Xưởng ---------- */
function vXuong(){
  var h='<div class="xw5"><div class="xhead"><h1>Xưởng</h1>';
  var all=CLIPS,list=xFiltered(),errs=0,warns=0,errClips=0,done=0;
  list.forEach(function(c){var r=checkClip(c);errs+=r.errs.length;warns+=r.warns.length;if(r.errs.length)errClips++;if(STG[clipStage(c)]>=STG.exported)done++});
  h+='<div class="xsum"><div><b>'+list.length+'</b><span>clip'+(list.length!==all.length?' (lọc từ '+all.length+')':'')+'</span></div><div class="ok"><b>'+done+'</b><span>đã xong (đã xuất / đã đăng)</span></div><div><b>'+(list.length-done)+'</b><span>còn lại</span></div>'+
   '<div class="err"><b>'+errs+'</b><span>lỗi cần sửa · '+errClips+' clip</span></div><div class="warn"><b>'+warns+'</b><span>cảnh báo</span></div></div></div>';
  if(S.xundo)h+='<div class="w ok">Đã '+esc(S.xundo.label)+'. <button class="btn sm" data-xact="undo">Hoàn tác</button></div>';
  // hạn chót
  h+='<div class="xmiles">'+(MILES.length?MILES.map(mileHTML).join(''):'<div class="meta">Chưa có mốc hạn chót. Thêm mốc để theo dõi tiến độ tuần.</div>')+
   '<details class="mnew"'+(S.medit!=null?' open':'')+'><summary class="btn sm">'+(S.medit!=null?'Sửa mốc':'+ Thêm mốc')+'</summary>'+mileForm()+'</details></div>';
  if(!all.length)return h+'<div class="empty">Chưa có clip nào. Nạp kịch bản ở tab Kịch bản.</div></div>';
  // lọc
  var f=S.xf,whos=[],gs=[];all.forEach(function(c){var w=clipWho(c);if(whos.indexOf(w)<0)whos.push(w);if(gs.indexOf(c.g||'')<0)gs.push(c.g||'')});
  var chip=function(on,k,v,t){return '<button class="chip'+(on?' on':'')+'" data-xf="'+k+'" data-v="'+esc(v)+'">'+esc(t)+'</button>'};
  h+='<div class="xfil"><div class="xview"><button class="chip'+(f.view==='stage'?' on':'')+'" data-xact="view" data-v="stage">Theo trạm</button><button class="chip'+(f.view==='person'?' on':'')+'" data-xact="view" data-v="person">Theo người</button></div>'+
   '<span class="lab">Người</span>'+whos.map(function(w){return chip(f.who.indexOf(w)>=0,'who',w,w||'Chưa giao')}).join('')+
   '<span class="lab">Gian</span>'+gs.map(function(g){return chip(f.g.indexOf(g)>=0,'g',g,g||'Chưa ghi gian')}).join('')+
   '<span class="lab">Trạm</span>'+STAGES.map(function(s){return chip(f.st.indexOf(s[0])>=0,'st',s[0],s[1])}).join('')+
   chip(f.err,'err','1','Có lỗi')+chip(f.miss,'miss','1','Thiếu source')+(xActive()?'<button class="btn xs" data-xact="clear">Bỏ lọc</button>':'')+'</div>';
  var by={};STAGES.forEach(function(s){by[s[0]]=[]});list.forEach(function(c){by[clipStage(c)].push(c)});
  if(f.view==='person'){
    var ws=[];list.forEach(function(c){if(ws.indexOf(clipWho(c))<0)ws.push(clipWho(c))});ws.sort();
    h+='<div class="xpeople"><div class="xpr xph"><span>Người</span>'+STAGES.map(function(s){return '<span>'+s[1]+'</span>'}).join('')+'<span>Tồn</span></div>'+
     ws.map(function(w){var mine=list.filter(function(c){return clipWho(c)===w}),open=mine.filter(function(c){return STG[clipStage(c)]<STG.exported}).length;
       return '<div class="xpr" data-who="'+esc(w)+'"><span class="xpn"><b>'+esc(w||'Chưa giao')+'</b><small>'+mine.length+' clip</small></span>'+STAGES.map(function(s){var cs=mine.filter(function(c){return clipStage(c)===s[0]});
         return '<span class="xpc'+(cs.length?'':' z')+'" data-stage="'+s[0]+'"><b>'+cs.length+'</b>'+cs.map(function(c){return '<button class="xpchip" data-xopen="'+esc(c.id)+'" title="'+esc(c.id+' · '+c.name)+'">'+chkDot(c)+esc(c.id)+'</button>'}).join('')+'</span>'}).join('')+
         '<span class="xpt'+(open?'':' z')+'"><b>'+open+'</b><small>chưa xuất</small></span></div>'}).join('')+'</div>';
  }else{
    h+='<div class="xboard">'+STAGES.map(function(s){var cs=by[s[0]];
      return '<section class="xcol" data-stage="'+s[0]+'"><div class="xch"><b>'+s[1]+'</b><span class="xn">'+cs.length+'</span></div><div class="xcb">'+(cs.length?cs.map(xCard).join(''):'<div class="xempty">Trống</div>')+'</div></section>'}).join('')+'</div>';
  }
  return h+'</div>'}

/* ---------- sự kiện ---------- */
function setPosted(ids,on){ids.forEach(function(id){var c=clip(id);if(!c)return;if(on){c.posted=true;c.postedAt=new Date().toISOString()}else{delete c.posted;delete c.postedAt}
  EXP.forEach(function(x){if(x.clipId===id)x.posted=on?true:false})});touchClips()}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-xact],[data-xf]');
  if(!b){var o=e.target.closest('[data-xopen]');if(o){var c=clip(o.dataset.xopen);if(!c)return;S.cur=c.id;S.li=0;S.t=0;location.hash='ghep'}return}
  var d=b.dataset;
  if(d.xf){var f=S.xf;if(d.xf==='err'||d.xf==='miss')f[d.xf]=!f[d.xf];else{var a=f[d.xf],k=a.indexOf(d.v);if(k>=0)a.splice(k,1);else a.push(d.v)}saveXf();render();return}
  switch(d.xact){
    case 'view':S.xf.view=d.v;saveXf();render();return;
    case 'clear':S.xf={who:[],g:[],st:[],err:false,miss:false,view:S.xf.view};saveXf();render();return;
    case 'post':var was=clip(d.id)&&clip(d.id).posted;setPosted([d.id],true);S.xundo={label:'đánh dấu '+d.id+' đã đăng',ids:[d.id],on:!!was};render();return;
    case 'unpost':var c0=clip(d.id),prev=c0&&c0.postedAt;setPosted([d.id],false);S.xundo={label:'bỏ đánh dấu đã đăng của '+d.id,ids:[d.id],on:true,at:prev};render();return;
    case 'undo':var u=S.xundo;if(!u)return;setPosted(u.ids,u.on);if(u.on&&u.at)u.ids.forEach(function(id){var cc=clip(id);if(cc)cc.postedAt=u.at});S.xundo=null;touchClips();render();return;
    case 'thieu':S.thieuClip=d.id;location.hash='thieu';return;
    case 'thieuall':S.thieuClip=null;render();return;
    case 'msave':var nm=(document.getElementById('mname')||{}).value||'',at=(document.getElementById('mat')||{}).value||'',pc=+((document.getElementById('mpct')||{}).value),tg=(document.getElementById('mtgt')||{}).value||'ready';
      if(!at){msg('Chọn ngày giờ cho mốc hạn chót.');return}if(!(pc>=1&&pc<=100)){msg('Mục tiêu phải từ 1 đến 100%.');return}
      var m={id:S.medit!=null?MILES[S.medit].id:'m'+Date.now().toString(16),name:nm.trim()||'Mốc',at:at,pct:Math.round(pc),target:tg};
      if(S.medit!=null)MILES[S.medit]=m;else MILES.push(m);MILES.sort(function(x,y){return x.at<y.at?-1:1});S.medit=null;touchClips();render();return;
    case 'medit':S.medit=+d.i;render();return;
    case 'mcancel':S.medit=null;render();return;
    case 'mdel':if(!confirm('Xóa mốc "'+(MILES[+d.i]||{}).name+'"?'))return;MILES.splice(+d.i,1);S.medit=null;touchClips();render();return;
  }
});
/* Đếm ngược tự cập nhật mỗi 30 giây khi đang ở tab Xưởng. */
setInterval(function(){if(S.tab!=='xuong')return;MILES.forEach(function(m,i){var el=document.querySelector('[data-mcd="'+i+'"]'),box=document.querySelector('[data-mile="'+i+'"]');if(!el)return;var s=mileState(m);el.textContent=s.txt;if(box)box.className='mile '+s.cls})},30000);
function milesToState(){return MILES.map(function(m){return {id:m.id,name:m.name,at:m.at,pct:m.pct,target:m.target}})}
function milesFromState(o){MILES=(Array.isArray(o.milestones)?o.milestones:[]).filter(function(m){return m&&m.at}).map(function(m){return {id:String(m.id||('m'+Math.random().toString(16).slice(2,8))),name:String(m.name||'Mốc'),at:String(m.at),pct:Math.max(1,Math.min(100,Math.round(+m.pct)||70)),target:STG[m.target]>0?m.target:'ready'}})}
