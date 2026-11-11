/* Thư viện source: AI gắn tag, thanh chọn đoạn, xem và cắt đoạn. IndexedDB chỉ giữ handle thư mục, không giữ video. */
/* ---------- AI gắn tag ---------- */
function tagSeg(sg){
  if(!GEM.key)return Promise.reject(new Error('Chưa có API key, vào tab Cài đặt để dán key'));
  if(!sg.url)return Promise.reject(new Error('Không đọc được file video (mất file hoặc chưa cấp quyền thư mục)'));
  var d=sdur(sg),N=Math.max(4,Math.min(16,Math.ceil(d/2))),parts=[];
  return loadVid(sg.url).then(async function(v){if(!v||!v.videoWidth)throw new Error('Trình duyệt không đọc được video này');
    var w=320,h=Math.round(w*v.videoHeight/v.videoWidth),cv=newCanvas(w,h),cx=cv.getContext('2d');
    for(var i=0;i<N;i++){var t=Math.min(d-0.05,(i+0.5)*d/N);await seekVid(v,t);cx.drawImage(v,0,0,w,h);parts.push({text:'Khung '+(i+1)+' (giây '+t.toFixed(1)+'):'});parts.push({inlineData:{mimeType:'image/jpeg',data:cv.toDataURL('image/jpeg',0.6).split(',')[1]}})}
  }).then(function(){
    var prompt='Đây là '+N+' khung hình lấy đều từ một video quay sản phẩm'+(sg.p?' "'+sg.p+'"':'')+', dài '+d.toFixed(1)+' giây, quay cận cảnh (thường chỉ có tay và sản phẩm). Hãy mô tả video và chia thành các đoạn liên tục theo nội dung cảnh. Chỉ trả JSON đúng dạng: {"mo_ta":"mô tả chung ngắn","doan":[{"tu":giây bắt đầu,"den":giây kết thúc,"mo_ta":"cảnh này thấy gì"}]}. Viết tiếng Việt, cụ thể: cận hay toàn cảnh, tay đang làm gì, thấy chi tiết nào (số, chữ, màu, chất liệu, sản phẩm nào). Chỉ tả điều nhìn thấy, không bịa.';
    var body={contents:[{parts:[{text:prompt}].concat(parts)}],generationConfig:{responseMimeType:'application/json'}};
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(GEM.vmodel||'gemini-3.8-flash')+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEM.key},body:JSON.stringify(body)})})
  .then(function(r){return r.text().then(function(t){if(!r.ok)throw new Error('HTTP '+r.status+': '+t.slice(0,250));return JSON.parse(t)})})
  .then(function(j){var tx=((((j.candidates||[])[0]||{}).content||{}).parts||[]).map(function(p){return p.text||''}).join('').replace(/^```json|^```|```$/gm,'').trim(),o;
    try{o=JSON.parse(tx)}catch(e){throw new Error('AI trả về không đúng dạng: '+tx.slice(0,150))}
    var tg=(o.doan||[]).map(function(x){return {a:Math.max(0,+x.tu||0),b:Math.min(d,+x.den||d),d:String(x.mo_ta||'')}}).filter(function(x){return x.d&&x.b>x.a});
    sg.desc=String(o.mo_ta||'');sg.tags=tg;saveSeg(sg);return tg.length});
}
function tagMany(list){var say=function(m){var e=document.getElementById('tagst');if(e)e.textContent=m},i=0,ok=0,errs=[];
  (function next(){if(i>=list.length){msg('AI đã gắn tag cho '+ok+'/'+list.length+' video.'+(errs.length?' Lỗi: '+errs[0]:''));return}
    var sg=list[i++];say('Đang đọc video '+i+'/'+list.length+': '+sg.label);
    tagSeg(sg).then(function(){ok++}).catch(function(e){errs.push((e&&e.message)||String(e))}).then(function(){if(errs.length&&/HTTP (400|401|403|404)|API key/.test(errs[errs.length-1])){msg('Dừng vì lỗi: '+errs[errs.length-1]+' (nếu báo không tìm thấy model, vào Cài đặt đổi tên model đọc video)');return}next()})})()}
function idbOpen(){return new Promise(function(res,rej){var r=indexedDB.open('xuongclip',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
function idbSet(k,v){return idbOpen().then(function(db){return new Promise(function(res,rej){var tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=res;tx.onerror=function(){rej(tx.error)}})})}
function idbGet(k){return idbOpen().then(function(db){return new Promise(function(res,rej){var q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})})}
/* ---------- thanh kéo đoạn ---------- */
function trackHTML(c,l,i,sg){if(!sg.url)return '';
  var need=Math.max(0.1,(l.e-l.s)*(l.spd||1)),d=sdur(sg),a0=Math.min(l.segIn||0,Math.max(0,d-0.1)),wl=l.segOut?Math.max(0.2,l.segOut-a0):Math.min(need,d);a0=Math.min(a0,Math.max(0,d-wl));var short=wl<need-0.05;
  return '<div class="trkw"><div class="meta" data-tl="'+i+'">'+tlText(a0,wl,d,need)+'</div>'+
   '<div class="trk" data-trk="'+i+'|'+sg.id+'" style="'+(sg.strip?'background-image:url('+sg.strip+');':'')+'"><div class="win" style="left:'+(a0/d*100)+'%;width:'+Math.min(100,wl/d*100)+'%"></div></div>'+
   '<div class="rng"><div class="g"><label class="lc">Từ giây<input type="number" step="0.1" min="0" data-sin="'+i+'" value="'+a0.toFixed(1)+'" aria-label="Bắt đầu lấy từ giây, dòng '+(i+1)+'"></label><button class="btn sm" data-nud="'+i+'|in|-0.1" aria-label="Lùi 0,1 giây">−0,1</button><button class="btn sm" data-nud="'+i+'|in|0.1" aria-label="Tiến 0,1 giây">+0,1</button></div>'+
   '<div class="g"><label class="lc">Đến giây<input type="number" step="0.1" min="0" data-sout="'+i+'" value="'+(a0+wl).toFixed(1)+'" aria-label="Kết thúc ở giây, dòng '+(i+1)+'"></label><button class="btn sm" data-nud="'+i+'|out|-0.1" aria-label="Lùi 0,1 giây">−0,1</button><button class="btn sm" data-nud="'+i+'|out|0.1" aria-label="Tiến 0,1 giây">+0,1</button></div></div>'+
   (short?'<div class="meta" style="color:#b45309">Source chạy hết sau '+fmt1(wl/(l.spd||1))+'s, dòng dài '+fmt1(l.e-l.s)+'s (tốc độ source không làm đổi giọng). Phần còn lại: <select data-fill="'+i+'"><option value="loop" '+((l.fill==='hold'||l.fill==='slow')?'':'selected')+'>Lặp lại đoạn</option><option value="hold" '+((l.fill==='hold'||l.fill==='slow')?'selected':'')+'>Giữ khung cuối</option></select></div>':'')+'</div>'}
function tlText(a0,wl,d,need){return 'Lấy từ giây '+a0.toFixed(1)+' đến '+(a0+wl).toFixed(1)+' ('+wl.toFixed(1)+'s) trong video dài '+d.toFixed(1)+'s · dòng cần '+need.toFixed(1)+'s. Kéo khung vàng để chọn đoạn.'}
function trkApply(c,l,sg,i,a){var d=sdur(sg),need=Math.max(0.1,(l.e-l.s)*(l.spd||1)),wl=l.segOut?Math.max(0.2,l.segOut-(l.segIn||0)):Math.min(need,d);
  a=Math.max(0,Math.min(a,d-wl));a=Math.round(a*10)/10;l.segIn=a;if(l.segOut)l.segOut=Math.round((a+wl)*10)/10;
  var w=document.querySelector('.trk[data-trk^="'+i+'|"] .win');if(w){w.style.left=(a/d*100)+'%';w.style.width=Math.min(100,wl/d*100)+'%'}
  var m=document.querySelector('[data-tl="'+i+'"]');if(m)m.textContent=tlText(a,wl,d,need);
  var qi=document.querySelector('[data-sin="'+i+'"]'),qo=document.querySelector('[data-sout="'+i+'"]');if(qi)qi.value=a.toFixed(1);if(qo)qo.value=(a+wl).toFixed(1);
  S.li=i;S.t=l.s;drawPhone();return {a:a,wl:wl,d:d}}
function ensureStrip(sg){if(!sg||!sg.url||sg.strip||sg.stripBusy||sg.bad)return;sg.stripBusy=1;var N=10,d=sdur(sg);
  loadVid(sg.url).then(async function(v){if(!v||!v.videoWidth){return}
    var cv=newCanvas(64*N,38),cx=cv.getContext('2d');
    for(var i=0;i<N;i++){await seekVid(v,Math.min(d-0.05,(i+0.5)*d/N));var k=Math.max(64/v.videoWidth,38/v.videoHeight),dw=v.videoWidth*k,dh=v.videoHeight*k;cx.drawImage(v,i*64+(64-dw)/2,(38-dh)/2,dw,dh)}
    sg.strip=cv.toDataURL('image/jpeg',0.6);
    document.querySelectorAll('.trk').forEach(function(e){if(e.dataset.trk.split('|')[1]===sg.id)e.style.backgroundImage='url('+sg.strip+')'})
  }).catch(function(){}).then(function(){sg.stripBusy=0})}
function applySeg(cid,li,sid,inn,out){var c=clip(cid);if(!c)return;var l=c.lines[li];l.seg=sid;l.segIn=inn||0;l.segOut=out||null;l.choose=false;closePV();msg('Đã chọn đoạn "'+seg(sid).label+'"'+(inn||out?' (giây '+(inn||0)+' đến '+(out||seg(sid).d)+')':'')+' cho '+cid+', dòng '+(li+1)+'.')}
function closePV(){var el=document.getElementById('pvm');if(el){var v=document.getElementById('pvv');if(v)try{v.pause()}catch(e){}el.remove()}S.pv=null}
function updPV(){var e=document.getElementById('pvt');if(e&&S.pv)e.textContent='Đầu: '+(S.pv.inn||0)+'s · Cuối: '+(S.pv.out||'hết video')+(S.pv.out?'s':'')}
function openPV(sid,cid,li){
  var sg=seg(sid);if(!sg)return;closePV();
  var c=cid?clip(cid):null,ln=(c&&li!=='')?c.lines[+li]:null;
  S.pv={sid:sid,cid:c?c.id:'',li:ln?+li:-1,inn:(ln&&ln.seg===sid&&ln.segIn)||0,out:(ln&&ln.seg===sid&&ln.segOut)||null};
  var el=document.createElement('div');el.id='pvm';el.style.cssText='position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML='<div style="background:var(--surface);color:var(--fg);border-radius:12px;padding:14px;max-width:400px;width:100%;max-height:96vh;overflow:auto"><div style="font-weight:600;margin-bottom:6px">'+esc(sg.label)+'</div>'+
   (sg.url?'<video id="pvv" src="'+sg.url+'" controls muted playsinline style="width:100%;max-height:58vh;background:#000;border-radius:8px"></video>':'<div class="empty">Không đọc được file video này (mất file hoặc chưa cấp quyền thư mục).</div>')+
   '<div class="meta" id="pvt" style="margin:6px 0"></div>'+
   (sg.url?'<div class="bar" style="margin:0 0 6px"><button class="btn sm" data-act="pvin">Đặt điểm đầu tại đây</button><button class="btn sm" data-act="pvout">Đặt điểm cuối tại đây</button><button class="btn sm" data-act="pvclear">Xóa mốc</button></div>':'')+
   '<div class="bar">'+(S.pv.cid?'<button class="btn pri" data-act="pvuse">Dùng đoạn này</button>':'')+'<button class="btn" data-act="pvclose">Đóng</button></div></div>';
  document.body.appendChild(el);
  var v=document.getElementById('pvv');
  if(v){v.muted=true;v.onloadedmetadata=function(){try{v.currentTime=S.pv.inn||0}catch(e){}};v.ontimeupdate=function(){if(S.pv&&S.pv.out&&v.currentTime>=S.pv.out){v.currentTime=S.pv.inn||0}}}
  updPV();
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closePV()});
