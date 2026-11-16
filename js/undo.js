/* Hoàn tác / làm lại theo từng clip trên màn Ghép clip (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z; nút ↶ ↷ trên thanh trên).
   Sau mỗi thao tác (bấm, đổi, thả chuột, phím) tool so ảnh chụp phần sửa được của clip đang mở với ảnh trước:
   khác thì ghi thành một bước. Ghi được: cảnh, biên đoạn video, ranh giới giọng, chữ hiện, kiểu chữ, giọng chọn,
   bộ lọc, khung (crop), thời lượng, chuyển cảnh, nhạc nền, khung kết, ảnh bìa. Tối đa UNDO_MAX bước mỗi clip.
   File giọng không nằm trong lịch sử: tạo / tải giọng mới thì lịch sử của clip đó bắt đầu lại (tránh ranh giới lệch giọng). */
var UNDO_MAX=100,UNDO={};
var UNDO_KEYS=['lines','bounds','bManual','alignInfo','vc','music','end','cov','ignored'];
function undoSnap(c){var r=clipToRec(c),o={};UNDO_KEYS.forEach(function(k){if(r[k]!==undefined)o[k]=r[k]});return JSON.stringify(o)}
function undoEpoch(c){return c.audio?(c.audio.file||'')+'@'+(c.audio.at||''):''}
function undoOf(c){var u=UNDO[c.id];if(!u){u=UNDO[c.id]={past:[],future:[],base:undoSnap(c),ep:undoEpoch(c)}}return u}
/* Ghi bước mới nếu clip đã đổi so với lần trước. */
function undoCheck(){if(S.tab!=='ghep'||S.undoing)return;var c=clip(S.cur);if(!c)return;var u=undoOf(c),s=undoSnap(c),ep=undoEpoch(c);
  if(ep!==u.ep){u.past=[];u.future=[];u.base=s;u.ep=ep;undoBtns();return}
  if(s===u.base)return;u.past.push(u.base);if(u.past.length>UNDO_MAX)u.past.shift();u.future=[];u.base=s;undoBtns()}
function undoApply(c,s){var o=JSON.parse(s),tmp=clipFromRec(Object.assign(clipToRec(c),o,{id:c.id}));
  UNDO_KEYS.forEach(function(k){if(k in o){c[k]=tmp[k]}else delete c[k]});
  if(c.music&&tmp.music){c.music=tmp.music}if(S.li>=c.lines.length)S.li=c.lines.length-1}
function undoDo(dir){undoCheck();var c=clip(S.cur);if(!c)return false;var u=undoOf(c),from=dir<0?u.past:u.future,to=dir<0?u.future:u.past;if(!from.length)return false;
  var s=from.pop();to.push(u.base);S.undoing=true;try{undoApply(c,s);u.base=undoSnap(c)}finally{S.undoing=false}
  if(S.play)stop();chkBump();touchClips();render();msg((dir<0?'Đã hoàn tác':'Đã làm lại')+' một bước ở '+c.id+' (còn '+u.past.length+' bước hoàn tác, '+u.future.length+' bước làm lại).');return true}
function undoBtns(){var c=clip(S.cur),u=c&&UNDO[c.id],a=document.getElementById('undob'),b=document.getElementById('redob');
  if(a){a.disabled=!(u&&u.past.length);a.title='Hoàn tác (Ctrl+Z)'+(u&&u.past.length?' · '+u.past.length+' bước':'')}
  if(b){b.disabled=!(u&&u.future.length);b.title='Làm lại (Ctrl+Y hoặc Ctrl+Shift+Z)'+(u&&u.future.length?' · '+u.future.length+' bước':'')}}
function undoHTML(c){var u=UNDO[c.id];return '<span class="undog"><button class="btn sm" id="undob" data-undo="-1"'+(u&&u.past.length?'':' disabled')+' aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)">↶</button><button class="btn sm" id="redob" data-undo="1"'+(u&&u.future.length?'':' disabled')+' aria-label="Làm lại" title="Làm lại (Ctrl+Y)">↷</button></span>'}
['click','change','pointerup','keyup'].forEach(function(t){document.addEventListener(t,function(){setTimeout(undoCheck,0)})});
document.addEventListener('click',function(e){var b=e.target.closest('[data-undo]');if(b)undoDo(+b.dataset.undo)});
document.addEventListener('keydown',function(e){if(S.tab!=='ghep'||!(e.ctrlKey||e.metaKey)||e.altKey)return;if(typeof typing==='function'&&typing(e))return;var k=(e.key||'').toLowerCase();
  if(k==='z'&&!e.shiftKey){e.preventDefault();undoDo(-1)}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();undoDo(1)}});
/* Đổi clip / mở tab: lấy ảnh nền mới (thay đổi ở tab khác vẫn được ghi thành một bước khi về màn Ghép). */
afterGhep=(function(f){return function(){f.apply(this,arguments);var c=clip(S.cur);if(c)undoOf(c);undoBtns()}})(afterGhep);
