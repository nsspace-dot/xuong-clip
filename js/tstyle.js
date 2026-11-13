/* Kiểu chữ đã lưu và khung kết.
   - Kiểu chữ: tên, phông (chỉ phông có sẵn trên Windows / macOS), cỡ, màu, viền, đổ bóng, nền, vị trí.
     Lưu trong state.json (textStyles: {list, byGian}). Mỗi gian có thể có một kiểu mặc định.
     Chữ hiện có x.st = mã kiểu; x.st không có thì theo kiểu mặc định của gian; x.st = '0' là kiểu cơ bản ở Cài đặt.
   - Khung kết (tùy chọn, mặc định tắt): 1–3 giây sau dòng cuối, nền một màu hoặc giữ khung hình cuối, thêm một dòng chữ.
     Chữ khung kết đi qua luật từ ngữ và vùng an toàn như chữ hiện. */
var FONTS={sys:['Mặc định (Be Vietnam Pro / hệ thống)','"Be Vietnam Pro",system-ui,sans-serif'],arial:['Arial','Arial,"Helvetica Neue",Helvetica,sans-serif'],tahoma:['Tahoma','Tahoma,Verdana,sans-serif'],
  verdana:['Verdana','Verdana,Tahoma,sans-serif'],trebuchet:['Trebuchet MS','"Trebuchet MS",Arial,sans-serif'],times:['Times New Roman','"Times New Roman",Times,serif'],georgia:['Georgia','Georgia,"Times New Roman",serif']};
var TSPOS={top:0.15,mid:0.5,bottom:0.74},TSPOSN={top:'Phía trên',mid:'Giữa',bottom:'Phía dưới'};
var TS={list:[],byGian:{}};
function tsById(id){return TS.list.filter(function(s){return s.id===id})[0]||null}
function tsClean(s){s=s||{};var o={id:String(s.id||('ts'+Date.now().toString(36))),name:String(s.name||'Kiểu chữ').slice(0,40),font:FONTS[s.font]?s.font:'sys',size:Math.max(16,Math.min(140,Math.round(+s.size)||INFO.size)),
  fg:/^#[0-9a-f]{6}$/i.test(s.fg)?s.fg:'#ffffff',bg:/^#[0-9a-f]{6}$/i.test(s.bg)?s.bg:'',ol:Math.max(0,Math.min(10,Math.round(+s.ol)||0)),olc:/^#[0-9a-f]{6}$/i.test(s.olc)?s.olc:'#000000',sh:!!s.sh,pos:TSPOS[s.pos]!=null?s.pos:'bottom'};return o}
function tsToState(){return {list:TS.list.map(function(s){var o=tsClean(s);if(!o.bg)delete o.bg;if(!o.sh)delete o.sh;return o}),byGian:Object.assign({},TS.byGian)}}
function tsFromState(o){var t=o&&o.textStyles;TS={list:[],byGian:{}};if(!t||typeof t!=='object')return;
  (Array.isArray(t.list)?t.list:[]).forEach(function(s){if(s&&s.id&&!tsById(String(s.id)))TS.list.push(tsClean(s))});
  if(t.byGian&&typeof t.byGian==='object')for(var g in t.byGian)if(tsById(t.byGian[g]))TS.byGian[g]=t.byGian[g]}
/* Kiểu áp cho một chữ: kiểu riêng của chữ, rồi kiểu mặc định của gian. null = kiểu cơ bản (INFO ở Cài đặt). */
function infoTS(x,c){if(x&&x.st==='0')return null;var s=x&&x.st?tsById(x.st):null;if(s)return s;c=c||clip(S.cur);var g=c&&TS.byGian[c.g];return g?tsById(g):null}
function infoLook(x,c){var s=infoTS(x,c);if(!s)return {font:FONTS.sys[1],size:INFO.size,fg:INFO.fg,bg:INFO.bg,ol:0,olc:'#000000',sh:false};
  return {font:FONTS[s.font][1],size:s.size,fg:s.fg,bg:s.bg||'',ol:s.ol||0,olc:s.olc||'#000000',sh:!!s.sh}}
/* Áp kiểu cho chữ: nhớ mã kiểu, cỡ theo kiểu, vị trí theo kiểu (ở giữa theo chiều ngang). */
function tsApply(x,id){if(id==='0'||id===''){x.st=id==='0'?'0':undefined;if(!x.st)delete x.st;delete x.sz;delete x.px;delete x.py;return}
  var s=tsById(id);if(!s)return;x.st=s.id;delete x.sz;x.px=0.5;x.py=TSPOS[s.pos]}
function tsOptions(cur,c,withGian){var g=c&&TS.byGian[c.g]?tsById(TS.byGian[c.g]):null;
  return (withGian?'<option value=""'+(cur?'':' selected')+'>Theo mặc định của gian'+(g?' ('+esc(g.name)+')':'')+'</option>':'')+'<option value="0"'+(cur==='0'?' selected':'')+'>Kiểu cơ bản (Cài đặt)</option>'+
    TS.list.map(function(s){return '<option value="'+esc(s.id)+'"'+(cur===s.id?' selected':'')+'>'+esc(s.name)+'</option>'}).join('')}
/* Bảng quản lý kiểu chữ (dùng ở Inspector màn Ghép clip và ở Cài đặt). */
function tsBox(c){if(S.tsSel&&!tsById(S.tsSel))S.tsSel=null;if(!S.tsSel&&TS.list.length)S.tsSel=TS.list[0].id;var s=S.tsSel?tsById(S.tsSel):null,gdef=c&&TS.byGian[c.g];
  var f=function(k,lab,inp){return '<label class="lc">'+lab+inp+'</label>'};
  var h='<div class="tsbox"><div class="bar" style="margin-top:0"><select id="tssel" aria-label="Kiểu chữ đã lưu">'+(TS.list.length?TS.list.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===S.tsSel?' selected':'')+'>'+esc(x.name)+(c&&gdef===x.id?' · mặc định '+esc(c.g):'')+'</option>'}).join(''):'<option value="">(chưa có kiểu nào)</option>')+'</select>'+
    '<button class="btn sm" data-ts="new">+ Kiểu mới</button></div>';
  if(!s)return h+'<div class="meta">Lưu kiểu chữ để áp cho chữ hiện bằng một lần bấm. Mỗi gian chọn được một kiểu mặc định cho chữ mới.</div></div>';
  h+='<div class="tsg">'+f('name','Tên','<input type="text" data-tsf="name" value="'+esc(s.name)+'" maxlength="40">')+
    f('font','Phông','<select data-tsf="font">'+Object.keys(FONTS).map(function(k){return '<option value="'+k+'"'+(s.font===k?' selected':'')+'>'+FONTS[k][0]+'</option>'}).join('')+'</select>')+
    f('size','Cỡ','<input type="number" min="16" max="140" data-tsf="size" value="'+s.size+'">')+
    f('fg','Màu chữ','<input type="color" data-tsf="fg" value="'+s.fg+'">')+
    f('ol','Viền (px)','<input type="number" min="0" max="10" data-tsf="ol" value="'+s.ol+'">')+
    f('olc','Màu viền','<input type="color" data-tsf="olc" value="'+s.olc+'">')+
    f('bg','Màu nền','<input type="color" data-tsf="bg" value="'+(s.bg||'#000000')+'"'+(s.bg?'':' disabled')+'>')+
    f('pos','Vị trí','<select data-tsf="pos">'+Object.keys(TSPOS).map(function(k){return '<option value="'+k+'"'+(s.pos===k?' selected':'')+'>'+TSPOSN[k]+'</option>'}).join('')+'</select>')+'</div>'+
    '<div class="bar" style="margin-top:2px"><label class="ck sm"><input type="checkbox" data-tsf="nobg"'+(s.bg?'':' checked')+'> Không nền</label><label class="ck sm"><input type="checkbox" data-tsf="sh"'+(s.sh?' checked':'')+'> Đổ bóng</label></div>'+
    '<div class="tsprev" style="font-family:'+esc(FONTS[s.font][1])+';color:'+s.fg+';background:'+(s.bg||'transparent')+';'+(s.ol?'-webkit-text-stroke:'+(s.ol*0.6)+'px '+s.olc+';paint-order:stroke fill;':'')+(s.sh?'text-shadow:0 1px 4px rgba(0,0,0,.85);':'')+'">Bloc 14,5 × 20,5 cm</div>'+
    '<div class="bar">'+(c?'<button class="btn sm" data-ts="all">Áp cho mọi chữ của clip</button><button class="btn sm" data-ts="def">'+(gdef===s.id?'Bỏ mặc định của gian '+esc(c.g):'Đặt làm mặc định gian '+esc(c.g||'(trống)'))+'</button>':'')+
    '<button class="btn sm" data-ts="dup">Nhân bản</button><button class="btn sm" data-ts="del">Xóa kiểu</button></div></div>';
  return h}
function tsSettings(){return '<div class="set"><b>Kiểu chữ đã lưu</b><div class="meta">Kiểu mặc định theo gian: '+(Object.keys(TS.byGian).length?Object.keys(TS.byGian).map(function(g){var s=tsById(TS.byGian[g]);return esc(g)+' → '+esc(s?s.name:'?')}).join('; '):'chưa đặt')+'. Đặt mặc định cho gian ở màn Ghép clip (Inspector › Kiểu chữ).</div>'+tsBox(null)+'</div>'}
function tsAfter(){touchClips();chkBump();render()}
document.addEventListener('click',function(e){var b=e.target.closest('[data-ts]');if(!b)return;var c=S.tab==='ghep'?clip(S.cur):null,s=S.tsSel?tsById(S.tsSel):null;
  switch(b.dataset.ts){
    case 'new':var n=tsClean({name:'Kiểu '+(TS.list.length+1),font:'sys',size:INFO.size,fg:INFO.fg,bg:INFO.bg,pos:INFO.pos});TS.list.push(n);S.tsSel=n.id;break;
    case 'dup':if(!s)return;var d=tsClean(Object.assign({},s,{id:'',name:s.name+' (bản sao)'}));d.id='ts'+Date.now().toString(36);TS.list.push(d);S.tsSel=d.id;break;
    case 'del':if(!s)return;var used=0;CLIPS.concat(ARCH,TRASH).forEach(function(x){x.lines.forEach(function(l){l.infos.forEach(function(i){if(i.st===s.id)used++})});if(x.end&&x.end.st===s.id)used++});
      if(!confirm('Xóa kiểu "'+s.name+'"?'+(used?' '+used+' chữ đang dùng kiểu này sẽ quay về kiểu mặc định của gian.':'')))return;
      CLIPS.concat(ARCH,TRASH).forEach(function(x){x.lines.forEach(function(l){l.infos.forEach(function(i){if(i.st===s.id)delete i.st})});if(x.end&&x.end.st===s.id)delete x.end.st});
      for(var g in TS.byGian)if(TS.byGian[g]===s.id)delete TS.byGian[g];TS.list.splice(TS.list.indexOf(s),1);S.tsSel=null;break;
    case 'def':if(!s||!c)return;if(TS.byGian[c.g]===s.id)delete TS.byGian[c.g];else TS.byGian[c.g]=s.id;msg(TS.byGian[c.g]?'Chữ mới của gian '+c.g+' sẽ dùng kiểu "'+s.name+'".':'Gian '+c.g+' không còn kiểu mặc định.');break;
    case 'all':if(!s||!c)return;var k=0;c.lines.forEach(function(l){l.infos.forEach(function(x){tsApply(x,s.id);k++})});msg('Đã áp kiểu "'+s.name+'" cho '+k+' chữ của '+c.id+'.');break;
    default:return}
  tsAfter()});
document.addEventListener('change',function(e){var t=e.target,d=t.dataset;
  if(t.id==='tssel'){S.tsSel=t.value;render();return}
  if(d.tsf){var s=tsById(S.tsSel);if(!s)return;var k=d.tsf;
    if(k==='nobg')s.bg=t.checked?'':(s.bg||'#000000');else if(k==='sh')s.sh=t.checked;else if(k==='size'||k==='ol')s[k]=+t.value;else s[k]=t.value;
    var cl=tsClean(s);for(var q in cl)s[q]=cl[q];tsAfter();return}
  if(d.ist){var p=d.ist.split('|'),c=clip(S.cur),x=c&&c.lines[+p[0]]&&c.lines[+p[0]].infos[+p[1]];if(!x)return;tsApply(x,t.value);tsAfter();return}});
/* Chữ mới nhận kiểu mặc định của gian (ghi rõ mã kiểu vào chữ). */
document.addEventListener('click',function(e){var b=e.target.closest('[data-addinfo]');if(!b)return;setTimeout(function(){var c=clip(S.cur);if(!c)return;var l=c.lines[+b.dataset.addinfo],x=l&&l.infos[l.infos.length-1],g=TS.byGian[c.g];
  if(x&&g&&x.st==null&&tsById(g)){tsApply(x,g);tsAfter()}},0)});

/* ---------- khung kết ---------- */
function endOn(c){return !!(c&&c.end&&c.end.on)}
function endDur(c){return endOn(c)?Math.max(1,Math.min(3,+c.end.dur||2)):0}
function endInit(c){if(!c.end)c.end={on:false,dur:2,mode:'color',color:'#000000',text:''};return c.end}
function endObj(c){var e=c.end||{};return {x:String(e.text||''),st:e.st,px:0.5,py:0.5}}
function inEnd(c,t){if(!endOn(c))return false;var tot=timeline(c);return t>=tot-1e-6&&t<tot+endDur(c)+0.5}
/* Vẽ khung kết lên ctx (khung logic W×H). last: canvas khung hình cuối (chế độ "giữ khung hình cuối"). */
function drawEndCard(ctx,W,H,c,last){var e=c.end||{};
  if(e.mode==='last'&&last){if(last!==ctx.canvas)ctx.drawImage(last,0,0,W,H)}else{ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(e.color)?e.color:'#000000';ctx.fillRect(0,0,W,H)}
  var o=endObj(c);if(infoOk(o)){var L=infoLook(o,c),pp=infoPos(o,c);drawTextBox(ctx,W,H,o.x,L.size,L.fg,L.bg||null,pp.px*W,pp.py*H,L.sh,L)}}
function endBox(c){var e=endInit(c);
  return '<div class="endbox"><label class="ck"><input type="checkbox" data-endf="on"'+(e.on?' checked':'')+'><span>Thêm khung kết sau dòng cuối</span></label>'+
   (e.on?'<div class="tsg">'+
    '<label class="lc">Dài (giây)<input type="number" min="1" max="3" step="0.5" data-endf="dur" value="'+endDur(c)+'"></label>'+
    '<label class="lc">Nền<select data-endf="mode"><option value="color"'+(e.mode!=='last'?' selected':'')+'>Một màu</option><option value="last"'+(e.mode==='last'?' selected':'')+'>Giữ khung hình cuối</option></select></label>'+
    (e.mode!=='last'?'<label class="lc">Màu nền<input type="color" data-endf="color" value="'+(e.color||'#000000')+'"></label>':'')+
    '<label class="lc">Kiểu chữ<select data-endf="st">'+tsOptions(e.st||'',c,true)+'</select></label></div>'+
    '<label class="lab">Dòng chữ (không bắt buộc)</label><input type="text" data-endf="text" value="'+esc(e.text||'')+'" maxlength="120" placeholder="Ví dụ: Bấm giỏ hàng để xem mẫu">'+
    '<div class="meta">Chữ khung kết cũng được kiểm luật từ ngữ và vùng an toàn. Tổng thời lượng clip tính cả khung kết.</div>':'')+'</div>'}
document.addEventListener('change',function(e){var t=e.target,k=t.dataset.endf;if(!k)return;var c=clip(S.cur);if(!c)return;var en=endInit(c);
  if(k==='on')en.on=t.checked;else if(k==='dur')en.dur=Math.max(1,Math.min(3,Math.round((+t.value||2)*2)/2));else if(k==='st'){if(t.value)en.st=t.value;else delete en.st}else en[k]=t.value;
  touchClips();chkBump();render()});

/* Xem thử khung kết: giữ video ở khung hình cuối của dòng cuối, vẽ khung kết bằng đúng hàm của file xuất. */
(function(){var dp=drawPhone;drawPhone=function(){var c=clip(S.cur);
  if(!c||!inEnd(c,S.t)){var r=dp.apply(this,arguments);if(endOn(c)){var t1=document.getElementById('tt');if(t1)t1.textContent=S.t.toFixed(1)+' / '+fmt1(timeline(c)+endDur(c))+'s'}return r}
  var t0=S.t,pl=S.play,L=c.lines[c.lines.length-1];S.t=Math.max(L.s,L.e-0.04);S.play=false;try{dp.apply(this,arguments)}finally{S.t=t0;S.play=pl}
  var inf=document.getElementById('inf');if(inf)inf.innerHTML='';var tt=document.getElementById('tt');if(tt)tt.textContent=t0.toFixed(1)+' / '+fmt1(timeline(c)+endDur(c))+'s';
  var sr=document.getElementById('scrub');if(sr&&document.activeElement!==sr)sr.value=t0;if(typeof tlSync==='function')tlSync(c,t0)}})();
(function(){var pp=paintPreview;paintPreview=function(){var c=clip(S.cur);if(!c||!inEnd(c,S.t))return pp.apply(this,arguments);
  var cv=document.getElementById('pvc'),v=document.getElementById('pv');if(!cv)return;var g=cv.getContext('2d'),useV=c.end.mode==='last'&&v&&!v.hidden;
  if(useV){if(!(v.readyState>=2&&v.videoWidth)||v.seeking){pvLater();return}drawSrc(g,PVW,PVH,v,c.lines[c.lines.length-1])}
  drawEndCard(g,PVW,PVH,c,useV?cv:null);cv.style.visibility='visible';pvRetry=0}})();
