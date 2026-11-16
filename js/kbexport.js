/* Bước 9: kịch bản theo người, kiểm định dạng khi nạp cả tuần, danh sách cần quay thêm.
   - Tải kịch bản theo người: mỗi người (cột Người) một file .txt đúng định dạng nạp, tên kichban_<người>_<ngày>.txt không dấu.
     Nhiều người thì tải lần lượt; bảng bên dưới giữ link từng file để tải lại nếu trình duyệt chặn.
   - Nạp: kbCheck() đọc lại từng dòng, báo clip lỗi định dạng kèm số dòng; clip lỗi không được nạp, clip đúng vẫn nạp.
   - Cần quay thêm: gom các dòng thiếu cảnh theo sản phẩm và cảnh cần, đếm số lần cần. Chỉ tạo danh sách, không gửi cho ai. */
function kbCell(s){return String(s==null?'':s).replace(/[\r\n]+/g,' ').replace(/\|/g,'/').trim()}
function kbClipText(c){var h='## '+[c.id,c.g,c.prod,c.name,c.who].map(kbCell).join(' | ');
  return h+'\n'+c.lines.map(function(l){var inf=(l.infos||[]).filter(infoOk).map(function(x){var ph=kbCell(x.ph).replace(/[;=]/g,' ').trim(),tx=kbCell(x.x).replace(/;/g,',');return ph&&ph!==tx?ph+'='+tx:tx}).join('; ');
    return kbCell(l.t)+' | '+kbCell(l.need)+(inf?' | '+inf:'')}).join('\n')}
function kbByPerson(){var g={},order=[];CLIPS.forEach(function(c){var w=(c.who||'').trim();if(!(w in g)){g[w]=[];order.push(w)}g[w].push(c)});
  return order.map(function(w){var day=expDay(),nm='kichban_'+(slugVi(w)||'chua_co_nguoi')+'_'+day+'.txt';
    var txt='# Kịch bản của '+(w||'(chưa có người)')+' · '+g[w].length+' clip · xuất từ Xưởng Clip ngày '+new Date().toLocaleDateString('vi-VN')+'\n\n'+g[w].map(kbClipText).join('\n\n')+'\n';
    return {who:w,name:nm,n:g[w].length,txt:txt}})}
function dlText(name,txt){var u=URL.createObjectURL(new Blob(['﻿'+txt],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();return u}
function kbExportPeople(){if(!CLIPS.length){msg('Chưa có clip nào để xuất kịch bản.');return}var fs=kbByPerson();S.kbExp=[];
  fs.forEach(function(f,i){setTimeout(function(){var u=dlText(f.name,f.txt);S.kbExp.push({name:f.name,who:f.who,n:f.n,url:u});if(i===fs.length-1){msg('Đã tạo '+fs.length+' file kịch bản theo người: '+fs.map(function(x){return x.name}).join(', ')+'. Nếu trình duyệt hỏi "tải nhiều file", hãy chọn Cho phép; hoặc tải lại từng file trong bảng.')}},i*400)})}
function kbExpBox(){return '<div class="box"><h2>Tải kịch bản theo người</h2><div class="meta">Mỗi người (cột Người) một file .txt đúng định dạng nạp ở trên, gồm các clip đang mở. Tên file kichban_&lt;người&gt;_&lt;ngày&gt;.txt, không dấu. Nhiều người thì tải lần lượt từng file.</div>'+
  '<div class="bar"><button class="btn" data-kx="people"'+(CLIPS.length?'':' disabled')+'>Tải kịch bản theo người ('+kbByPerson().length+' file)</button></div>'+
  (S.kbExp&&S.kbExp.length?'<div class="tbl"><table><thead><tr><th>File</th><th>Người</th><th>Số clip</th><th></th></tr></thead><tbody>'+S.kbExp.map(function(x){return '<tr><td class="mono">'+esc(x.name)+'</td><td>'+esc(x.who||'(chưa có người)')+'</td><td class="mono">'+x.n+'</td><td><a class="btn sm" href="'+x.url+'" download="'+esc(x.name)+'">Tải lại</a></td></tr>'}).join('')+'</tbody></table></div>':'')+'</div>'}
document.addEventListener('click',function(e){var b=e.target.closest('[data-kx]');if(!b)return;if(b.dataset.kx==='people')kbExportPeople();if(b.dataset.kx==='errclose'){S.kbErr=null;render()}});

/* ---------- kiểm định dạng ---------- */
/* Trả về {clips (đúng định dạng, theo thứ tự), errs:[{id, line, msg}], bad:{chỉ số clip lỗi}} */
function kbCheck(txt){var errs=[],cur=null,blocks=[],ids={};
  String(txt||'').split(/\r?\n/).forEach(function(raw,k){var ln=raw.trim(),no=k+1;if(!ln)return;
    if(ln.indexOf('##')===0){var p=ln.replace(/^##\s*/,'').split('|').map(trim);cur={idx:blocks.length,id:p[0]||'',no:no,lines:0,err:[]};blocks.push(cur);
      if(!p[0])cur.err.push({line:no,msg:'dòng tiêu đề clip thiếu Mã'});
      if(p.length>5)cur.err.push({line:no,msg:'dòng tiêu đề có '+p.length+' cột, tối đa 5 (Mã | Gian | Sản phẩm | Tên clip | Người)'});
      if(p[0]&&ids[p[0].toLowerCase()])cur.err.push({line:no,msg:'mã '+p[0]+' bị lặp trong cùng file (đã có ở dòng '+ids[p[0].toLowerCase()]+')'});else if(p[0])ids[p[0].toLowerCase()]=no;return}
    if(ln[0]==='#')return;
    if(!cur){errs.push({id:'',line:no,msg:'lời thoại nằm ngoài clip nào (thiếu dòng ## ở phía trên)'});return}
    var f=ln.split('|');cur.lines++;
    if(f.length>3)cur.err.push({line:no,msg:'dòng thoại có '+f.length+' cột, tối đa 3 (Lời | Cảnh cần | chữ hiện)'});
    if(!trim(f[0]))cur.err.push({line:no,msg:'dòng thoại thiếu Lời'})});
  blocks.forEach(function(b){if(!b.lines)b.err.push({line:b.no,msg:'clip không có dòng thoại nào'});b.err.forEach(function(x){errs.push({id:b.id,line:x.line,msg:x.msg})})});
  var all=parse(txt),bad={};blocks.forEach(function(b){if(b.err.length)bad[b.idx]=1});
  return {clips:all.filter(function(c,i){return !bad[i]}),errs:errs,nBad:Object.keys(bad).length,nAll:all.length}}
function kbErrBox(){var e=S.kbErr;if(!e||!e.errs.length)return '';
  return '<div class="w bad kberr"><b>'+(e.nBad?e.nBad+' clip lỗi định dạng, chưa nạp':'Có dòng lỗi định dạng')+'</b>'+(e.nOk?' (đã nạp '+e.nOk+' clip đúng định dạng)':'')+':<ul>'+e.errs.map(function(x){return '<li>'+(x.id?'Clip <b>'+esc(x.id)+'</b>, ':'')+'dòng '+x.line+': '+esc(x.msg)+'</li>'}).join('')+'</ul>Sửa trong ô dán rồi bấm Nạp lại (clip đã nạp sẽ được hỏi ghi đè hay bỏ qua). <button class="btn sm" data-kx="errclose">Ẩn</button></div>'}

/* ---------- cần quay thêm ---------- */
function shootList(cid){var m=missingAll(cid),out=[];Object.keys(m).sort().forEach(function(p){var g={},order=[];
    m[p].forEach(function(x){var need=(x.l.need||'').trim()||('cảnh cho câu "'+x.l.t+'"'),k=pkey(need);if(!g[k]){g[k]={need:need,n:0,refs:[]};order.push(k)}g[k].n++;g[k].refs.push(x.c.id+' dòng '+(x.i+1))});
    out.push({prod:p,items:order.map(function(k){return g[k]})})});return out}
function shootText(L){return 'CẦN QUAY THÊM · '+new Date().toLocaleDateString('vi-VN')+'\n'+L.map(function(p){return '\nSản phẩm: '+p.prod+'\n'+p.items.map(function(x){return '- '+x.need+' · cần '+x.n+' lần ('+x.refs.join(', ')+')'}).join('\n')}).join('\n')+'\n'}
function shootBox(){var L=shootList(S.thieuClip),n=0;L.forEach(function(p){p.items.forEach(function(x){n+=x.n})});if(!L.length)return '';
  return '<div class="box shoot"><h2>Danh sách cần quay thêm</h2><div class="meta">Gom theo sản phẩm và cảnh cần: '+n+' lượt cần, '+L.reduce(function(a,p){return a+p.items.length},0)+' cảnh khác nhau. Tool chỉ tạo danh sách, không tự gửi cho ai.</div>'+
   '<div class="tbl"><table><thead><tr><th>Sản phẩm</th><th>Cảnh cần quay</th><th>Số lần cần</th><th>Ở đâu</th></tr></thead><tbody>'+L.map(function(p){return p.items.map(function(x,i){return '<tr><td>'+(i?'':'<b>'+esc(p.prod)+'</b>')+'</td><td>'+esc(x.need)+'</td><td class="mono">'+x.n+'</td><td class="meta">'+esc(x.refs.join(', '))+'</td></tr>'}).join('')}).join('')+'</tbody></table></div>'+
   '<div class="bar"><button class="btn pri" data-shoot="copy">Sao chép</button><button class="btn" data-shoot="dl">Tải .txt</button></div></div>'}
document.addEventListener('click',function(e){var b=e.target.closest('[data-shoot]');if(!b)return;var t=shootText(shootList(S.thieuClip));
  if(b.dataset.shoot==='copy')copyText(t).then(function(){msg('Đã sao chép danh sách cần quay thêm.')});else{dlText('can_quay_'+expDay()+'.txt',t);msg('Đã tải can_quay_'+expDay()+'.txt.')}});
