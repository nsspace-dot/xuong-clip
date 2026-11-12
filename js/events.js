/* ---------- sự kiện ---------- */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-edit],[data-delclip],[data-auto],[data-dl],[data-cur],[data-lp],[data-lo],[data-eg],[data-ch],[data-pick],[data-addinfo],[data-useseg],[data-delexp],[data-delseg],[data-pv],[data-delinfo],[data-act],[data-playline],[data-playb],[data-nud],[data-delline],[data-wx],[data-bn],[data-bl],[data-li]');if(!el)return;
  var d=el.dataset,c=clip(S.cur);
  if(d.cur){S.cur=d.cur;S.t=0;S.li=0;return}
  if(d.edit){S.edit=d.edit;render();return}
  if(d.delclip){clipDelete(d.delclip);render();return}
  if(d.dl!==undefined){var ce=clip(S.edit);ce.lines.splice(+d.dl,1);ce.auto=false;render();return}
  if(d.auto){var cc=clip(d.auto);autoPick(cc);S.cur=cc.id;var nk=cc.lines.filter(function(l){return l.lock}).length;msg('Đã ghép cảnh cho '+cc.id+': '+cc.lines.filter(function(l){return l.seg}).length+'/'+cc.lines.length+' dòng có cảnh'+(nk?' ('+nk+' dòng chọn tay giữ nguyên)':'')+'. Dòng không có cảnh đủ điểm để trống, xem tab Thiếu source.');return}
  if(d.eg){S.expG=d.eg;render();return}
  if(d.ch!==undefined){var l=c.lines[+d.ch];l.choose=!l.choose;render();return}
  if(d.pick){var p=d.pick.split('|'),ln=c.lines[+p[0]];ln.seg=p[1]==='none'?null:p[1];ln.segIn=ln.seg?(+p[2]||0):0;ln.segOut=null;ln.fill=null;ln.choose=false;lockLine(ln);render();return}
  if(d.addinfo!==undefined){c.lines[+d.addinfo].infos.push({x:'Chữ mới',ph:''});render();return}
  if(d.useseg){var u=d.useseg.split('|'),uc=clip(u[0]),ul=uc.lines[+u[1]];ul.seg=u[2];ul.segIn=+u[3]||0;ul.segOut=null;lockLine(ul);msg('Đã gán cảnh "'+seg(u[2]).label+'" cho '+u[0]+', dòng '+(+u[1]+1)+'.');return}
  if(d.delseg){delete S.sel[d.delseg];segDelete(d.delseg);render();return}
  if(d.delinfo!==undefined){var di=d.delinfo.split('|');c.lines[+di[0]].infos.splice(+di[1],1);render();return}
  if(d.act==='tag'){var tsg=seg(d.id);if(tsg)tagMany([tsg]);return}
  if(d.act==='covexp'){exportCover(c);return}
  if(d.delexp){EXP=EXP.filter(function(x){return x.id!==d.delexp});render();return}
  if(d.act==='load'){kbLoad();return}
  if(d.act==='autoall'){var n=0;CLIPS.forEach(function(x){if(!isDirect(x)&&!x.exported){autoPick(x);n++}});msg('Đã ghép cảnh cho '+n+' clip. Cảnh nào chưa tìm được sẽ nằm ở tab Thiếu source.');return}
  if(d.act==='addline'){var cd=clip(S.edit);cd.lines.push({t:'',need:'',seg:null,infos:[],choose:false});cd.auto=false;render();return}
  if(d.pv){var pa=d.pv.split('|');openPV(pa[0],pa[1],pa[2]);return}
  if(d.act==='pvclose'){closePV();return}
  if(d.act==='pvin'||d.act==='pvout'||d.act==='pvclear'){var pvv=document.getElementById('pvv'),ct=pvv?Math.round(pvv.currentTime*10)/10:0;
    if(d.act==='pvin'){S.pv.inn=ct;if(S.pv.out&&S.pv.out<=ct)S.pv.out=null}
    else if(d.act==='pvout'){if(ct>(S.pv.inn||0))S.pv.out=ct}
    else{S.pv.inn=0;S.pv.out=null}
    updPV();return}
  if(d.act==='pvuse'){applySeg(S.pv.cid,S.pv.li,S.pv.sid,S.pv.inn,S.pv.out);return}
  if(d.act==='trygem'){tryVoice(d.v);return}
  if(d.act==='srcpick'){srcPick();return}
  if(d.act==='srcscan'){srcScan();return}
  if(d.act==='srcgrant'){srcGrant();return}
  if(d.act==='srccheck'){srcCheckRO(true);return}
  if(d.act==='srcfresh'){srcFresh();return}
  if(d.act==='srcrestore'){segRestore(d.id).then(function(){msg('Đã khôi phục thẻ video.')});return}
  if(d.act==='srcrestoreall'){Promise.all(SRCF.deleted.slice().map(segRestore)).then(function(){msg('Đã khôi phục tất cả thẻ video.')});return}
  if(d.act==='padd'){var pn=document.getElementById('pnew'),pv=pn?pn.value.trim():'';if(!pv)return;if(person(pv)){msg('"'+pv+'" đã có trong danh sách.');return}PEOPLE.push({name:pv,direct:false});savePeople();render();return}
  if(d.act==='pdel'){var pd=PEOPLE[+d.i];if(pd&&confirm('Xóa "'+pd.name+'" khỏi danh sách người phụ trách?')){PEOPLE.splice(+d.i,1);savePeople();render()}return}
  if(d.act==='pickdir'){pickDir();return}
  if(d.act==='cleardir'){S.dir=null;S.dirPerm=null;idbSet('dir',null).catch(function(){});render();return}
  if(d.act==='gem'){makeVoice(c);return}
  if(d.act==='align'){alignToSpeech(c,function(ok){msg(ok?'Đã căn lại cảnh theo giọng.':'Không đọc được file giọng để căn.')});return}
  if(d.act==='export'){if(exportGuard(c))exportClip(c);return}
  if(d.act==='copyvo'){var vo=c.lines.map(function(l){return l.t}).join(' ');try{navigator.clipboard.writeText(vo).then(function(){msg('Đã sao chép lời thoại đọc liền của '+c.id+'.')},function(){msg('Trình duyệt không cho sao chép tự động. Hãy chọn và chép lời thoại trong các ô thoại.')})}catch(x){msg('Trình duyệt không cho sao chép tự động.')}return}
  if(d.wx!==undefined){S.wx=!S.wx;render();return}
  if(d.bn!==undefined){var bq=d.bn.split('|'),bk=+bq[0];setBound(c,bk,abounds(c)[bk]+(+bq[1]));S.wk=bk;render();return}
  if(d.bl!==undefined){var bk2=+d.bl;if(S.baud&&S.bi==='b'+bk2){stopB();render();return}var bb=abounds(c)[bk2];S.wk=bk2;playWin(c,bb-0.5,bb+0.5,'b'+bk2);return}
  if(d.delline!==undefined){var dn=+d.delline;if(c.lines.length<2){msg('Clip phải còn ít nhất một đoạn.');return}
    if(!confirm('Xóa đoạn '+(dn+1)+'? Mốc giọng sẽ chia lại theo số chữ, nên cần bấm "Căn lại cảnh theo giọng" hoặc tạo lại giọng sau khi xóa.'))return;
    stop();c.lines.splice(dn,1);c.bounds=null;c.bManual=false;S.wb=null;S.li=Math.min(S.li,c.lines.length-1);S.t=0;render();return}
  if(d.playb!==undefined){var pbn=+d.playb,pbl=c.lines[pbn],was=(S.baud&&S.bi===pbn);stopB();if(was){render();return}stop();timeline(c);if(!c.audioUrl||pbl.as==null)return;
    S.bi=pbn;S.baud=new Audio(c.audioUrl);try{S.baud.currentTime=pbl.as}catch(x){}S.baud.play().catch(function(){});
    S.btm=setInterval(function(){if(!S.baud||S.baud.currentTime>=pbl.ae||S.baud.ended){stopB();render()}},30);render();return}
  if(d.nud!==undefined){var nn=d.nud.split('|'),nl=c.lines[+nn[0]],ng=seg(nl.seg);if(!ng)return;lockLine(nl);var nd=sdur(ng),dlt=+nn[2];
    if(nn[1]==='in'){var n1=Math.max(0,Math.min(nd-0.2,Math.round(((nl.segIn||0)+dlt)*10)/10));if(nl.segOut)nl.segOut=Math.max(nl.segOut,n1+0.2);nl.segIn=n1}
    else{var curO=nl.segOut||Math.min(nd,(nl.segIn||0)+Math.max(0.1,nl.e-nl.s)*(nl.spd||1));nl.segOut=Math.max((nl.segIn||0)+0.2,Math.min(nd,Math.round((curO+dlt)*10)/10))}
    S.li=+nn[0];S.t=nl.s;render();return}
  if(d.playline!==undefined){var pln=+d.playline,pl=c.lines[pln];if(S.play&&S.stopAt!=null&&S.li===pln){stop();render();return}stop();timeline(c);S.li=pln;S.t=pl.s;S.stopAt=pl.e;startPlay(c);render();return}
  if(d.act==='play'){if(S.play){stop()}else{startPlay(c)}render();return}
  if(d.act==='copy'){var tx=document.getElementById('misstxt');var done=function(){S.copied=true;render()};
    try{navigator.clipboard.writeText(tx.value).then(done,function(){tx.select()})}catch(x){tx.select()}return}
  if(d.li!==undefined&&!e.target.closest('button,textarea,input,select')){S.li=+d.li;S.t=c.lines[S.li].s;render()}
});
document.addEventListener('input',function(e){
  var t=e.target,c=clip(S.cur);
  if(t.id==='paste'){S.paste=t.value}
  if(t.dataset.info){INFO[t.dataset.info]=t.type==='number'?(+t.value||INFO[t.dataset.info]):t.value;saveInfo();var pvv=document.getElementById('infoprev');if(pvv)pvv.innerHTML=infoPrevHTML()}
  if(t.dataset.th!==undefined){var ll=c.lines[+t.dataset.th];ll.t=t.value;ll.dd=null;live()}
  if(t.id&&t.id.indexOf('cov')===0&&c){var cv=covInit(c),ct=document.getElementById('covt'),ck=(document.getElementById('covw')||{clientWidth:270}).clientWidth/720;
    if(t.id==='covtm'){cv.tm=+t.value;var tl=document.getElementById('covtl');if(tl)tl.textContent=cv.tm.toFixed(1);covDraw(c);return}
    if(t.id==='covtx'){cv.text=t.value;if(ct)ct.textContent=t.value;return}
    if(t.id==='covsz'){cv.sz=Math.max(20,Math.min(200,+t.value||90))}
    if(t.id==='covfg')cv.fg=t.value;if(t.id==='covbg')cv.bg=t.value;if(t.id==='covnb')cv.nobg=t.checked;
    if(ct)ct.setAttribute('style',covStyle(cv,ck));return}
  if(t.id==='scrub'){S.t=+t.value;var cl=c.lines.filter(function(x){return S.t>=x.s&&S.t<x.e})[0];if(cl)S.li=c.lines.indexOf(cl);drawPhone()}
});
document.addEventListener('change',function(e){
  var t=e.target,d=t.dataset;
  if(t.id==='file'&&t.files[0]){var f=t.files[0];if(!/\.(txt|csv|md)$/i.test(f.name)){msg('Bản thô chưa đọc được file '+f.name+'. Hãy lưu thành .txt hoặc dán văn bản vào ô bên dưới.');return}
    var r=new FileReader();r.onload=function(){S.paste=String(r.result);msg('Đã đọc '+f.name+'. Kiểm tra nội dung trong ô rồi bấm Nạp vào danh sách.')};r.readAsText(f);return}
  if(d.sl){seg(d.sl).label=t.value;saveSeg(seg(d.sl));return}
  if(d.sp){setManualProd(seg(d.sp),t.value);saveSeg(seg(d.sp));render();return}
  if(d.gemg){GEM.byGian[d.gemg]=t.value;saveGem();render();return}
  if(d.q){EXPQ[d.q]=t.value;saveQ();return}
  if(d.info){INFO[d.info]=t.type==='number'?(+t.value||INFO[d.info]):t.value;saveInfo();render();return}
  if(d.gem){GEM[d.gem]=t.value;saveGem();return}
  if(t.id==='audf'){var ac=clip(S.cur),af=t.files[0]||null;if(!af)return;setClipAudio(ac,af,{src:'tải lên',name:af.name});ac.audioDur=null;var tb=new Audio(ac.audioUrl);tb.onloadedmetadata=function(){ac.audioDur=tb.duration;ac.bounds=null;alignToSpeech(ac,function(){touchClips();render()})};render();return}
  if(t.id==='tts'){S.tts=t.checked;return}
  if(t.id==='edtxt'){S.edTxt=t.checked;drawPhone();return}
  if(t.id==='trtype'){TR.type=t.value;saveTR();return}
  if(t.id==='trdur'){TR.dur=Math.max(0.1,Math.min(1,+t.value||0.3));saveTR();return}
  if(t.id==='covli'){var cc=clip(S.cur),cvv=covInit(cc);cvv.li=+t.value;var cl2=cc.lines[cvv.li];cvv.tm=Math.round(((cl2.segIn||0)+0.5)*10)/10;render();return}
  if(d.sin!==undefined||d.sout!==undefined){var ci=clip(S.cur),ii=+(d.sin!==undefined?d.sin:d.sout),li2=ci.lines[ii],sg2=li2&&seg(li2.seg);if(!sg2)return;lockLine(li2);var dd2=sdur(sg2),vv=+t.value;
    if(d.sin!==undefined){var na=Math.max(0,Math.min(dd2-0.2,Math.round(vv*10)/10));if(li2.segOut)li2.segOut=Math.max(li2.segOut,na+0.2);li2.segIn=na}
    else{if(t.value===''||!(vv>0))li2.segOut=null;else li2.segOut=Math.max((li2.segIn||0)+0.2,Math.min(dd2,Math.round(vv*10)/10))}
    S.li=ii;S.t=li2.s;render();return}
  if(d.bv!==undefined){var kv=+d.bv;setBound(clip(S.cur),kv,+t.value);S.wk=kv;render();return}
  if(t.id==='wsnap'){S.snapOff=!t.checked;return}
  if(t.id==='wzoom'){S.wzoom=t.checked;render();return}
  if(d.dm!==undefined){var ldm=clip(S.cur).lines[+d.dm],vd=+t.value;ldm.dm=(t.value===''||!(vd>0))?null:Math.max(1,Math.min(60,Math.round(vd*10)/10));render();return}
  if(d.spd!==undefined){var lsp=clip(S.cur).lines[+d.spd],vs=+t.value;lsp.spd=(t.value===''||!(vs>0))?null:Math.max(0.25,Math.min(4,Math.round(vs*100)/100));render();return}
  if(d.ltr!==undefined){var lt=clip(S.cur).lines[+d.ltr];lt.tr=t.value||null;return}
  if(d.fill!==undefined){var lf=clip(S.cur).lines[+d.fill];lf.fill=t.value;drawPhone();return}
  if(d.io!==undefined||d.il!==undefined||d.isz!==undefined){var ky=(d.io||d.il||d.isz).split('|'),lx=clip(S.cur).lines[+ky[0]],ix=lx.infos[+ky[1]];
    if(d.io!==undefined)ix.off=t.value===''?null:Math.max(0,Math.round((+t.value-lx.s)*10)/10);
    if(d.il!==undefined)ix.len=t.value===''?null:Math.max(0.5,+t.value);
    if(d.isz!==undefined)ix.sz=t.value===''?null:Math.max(10,Math.min(200,+t.value));
    render();return}
  if(t.id==='pickclip'){S.cur=t.value;S.t=0;S.li=0;render();return}
  if(d.ecf){var ce=clip(S.edit),nv=d.ecf==='who'||d.ecf==='batch'?t.value.trim():t.value;if(d.ecf==='id'){nv=nv.trim();if(!nv||(nv!==ce.id&&clipById(nv))){msg(nv?'Mã "'+nv+'" đã có, chọn mã khác.':'Mã clip không được để trống.');return}if(S.cur===ce.id)S.cur=nv;S.edit=nv}ce[d.ecf]=nv;render();return}
  if(d.el){var a=d.el.split('|'),cl=clip(S.edit),ln=cl.lines[+a[0]];
    if(a[1]==='t'){ln.t=t.value;ln.dd=null}else if(a[1]==='need')ln.need=t.value;else ln.infos=parseInfos(t.value);cl.auto=false;render();return}
  if(d.th!==undefined){render();return}
  if(d.ix||d.ip){var c=clip(S.cur);if(d.ix){var x=d.ix.split('|');c.lines[+x[0]].infos[+x[1]].x=t.value}
    if(d.ip){var y=d.ip.split('|');c.lines[+y[0]].infos[+y[1]].ph=t.value}render();return}
  if(d.so){seg(d.so).o=t.value;saveSeg(seg(d.so));render();return}
  if(d.cap){EXP.filter(function(x){return x.id===d.cap})[0].cap=t.value;return}
  if(d.posted){EXP.filter(function(x){return x.id===d.posted})[0].posted=t.checked;return}
  if(d.pname!==undefined){var pp=PEOPLE[+d.pname],nv=t.value.trim();if(!pp)return;if(!nv||(person(nv)&&person(nv)!==pp)){msg(nv?'"'+nv+'" đã có trong danh sách.':'Tên không được để trống.');render();return}
    CLIPS.forEach(function(x){if(x.who&&person(x.who)===pp)x.who=nv});pp.name=nv;savePeople();render();return}
  if(d.pdirect!==undefined){var pq=PEOPLE[+d.pdirect];if(pq){pq.direct=t.checked;savePeople()}render();return}
  if(t.id==='sgmin'){SG.min=Math.max(10,Math.min(95,Math.round(+t.value)||40));saveSG();render();return}
  if(t.id==='sgguess'){SG.allowGuess=t.checked;saveSG();return}
});
document.addEventListener('pointerdown',function(e){
  var el=e.target.closest('.drag[data-dx],.drag[data-cov],.trk');if(!el||S.play)return;var c=clip(S.cur);if(!c)return;
  if(el.classList.contains('trk')){var a=el.dataset.trk.split('|'),l=c.lines[+a[0]],sg=seg(a[1]);if(!l||!sg)return;
    var rect=el.getBoundingClientRect(),d=sdur(sg),need=Math.max(0.1,(l.e-l.s)*(l.spd||1)),a0=l.segIn||0,wl=l.segOut?Math.max(0.2,l.segOut-a0):Math.min(need,d);
    if(!e.target.classList.contains('win')){a0=((e.clientX-rect.left)/rect.width)*d-wl/2;a0=trkApply(c,l,sg,+a[0],a0).a}
    S.drag={k:'trk',c:c,l:l,sg:sg,i:+a[0],x0:e.clientX,a0:a0,w:rect.width,d:d}}
  else{var host=el.dataset.cov?document.getElementById('covw'):document.getElementById('phone'),obj;
    if(el.dataset.cov)obj=covInit(c);else{var b=el.dataset.dx.split('|');obj=c.lines[+b[0]].infos[+b[1]]}
    var er=el.getBoundingClientRect();S.drag={k:'pos',el:el,host:host,obj:obj,ox:er.left+er.width/2-e.clientX,oy:er.top+er.height/2-e.clientY}}
  try{el.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
document.addEventListener('pointermove',function(e){var g=S.drag;if(!g)return;
  if(g.k==='trk'){trkApply(g.c,g.l,g.sg,g.i,g.a0+(e.clientX-g.x0)/g.w*g.d)}
  else{var r=g.host.getBoundingClientRect(),w=g.host.clientWidth,h=g.host.clientHeight,px=(e.clientX+g.ox-r.left-(g.host.clientLeft||0))/w,py=(e.clientY+g.oy-r.top-(g.host.clientTop||0))/h;
    px=Math.max(0.08,Math.min(0.92,px));py=Math.max(0.05,Math.min(0.95,py));g.obj.px=Math.round(px*1000)/1000;g.obj.py=Math.round(py*1000)/1000;g.el.style.left=(px*100)+'%';g.el.style.top=(py*100)+'%'}});
document.addEventListener('pointerup',function(){S.drag=null});
document.addEventListener('pointerdown',function(e){
  var cv=e.target.closest&&e.target.closest('#wavec,#wavex');if(!cv||S.play)return;var c=clip(S.cur);if(!c||!c.audioDur||!c.lines.length)return;
  var b=abounds(c),r=cv.getBoundingClientRect(),t0=cv._t0||0,t1=cv._t1||c.audioDur,x=t0+(e.clientX-r.left)/r.width*(t1-t0),k=-1,bd=1e9,i,N=c.lines.length;
  for(i=0;i<=N;i++){var dd=Math.abs(b[i]-x);if(dd<bd){bd=dd;k=i}}
  if(k<0||bd/(t1-t0)*r.width>14)return;
  var cx=document.getElementById('wavex');
  S.wk=k;S.wdrag={c:c,k:k,b:b,r:r,t0:t0,t1:t1,moved:false,vw:cx?{a:cx._t0,b:cx._t1}:null,wide:cv.id==='wavex'};S.wb=b;
  if(S.wdrag.wide&&!S.wzoom)S.wdrag.vw=null;
  try{cv.setPointerCapture(e.pointerId)}catch(x2){}drawWave(c);e.preventDefault()});
document.addEventListener('pointermove',function(e){var g=S.wdrag;if(!g)return;var D=g.c.audioDur,N=g.c.lines.length,x=g.t0+(e.clientX-g.r.left)/g.r.width*(g.t1-g.t0);
  if(!S.snapOff&&!e.shiftKey){var cand=(g.k===0)?[g.c.sp0]:(g.k===N?[g.c.sp1]:(g.c.gaps||[])),bs=0.3,sn=null;cand.forEach(function(q){if(q!=null&&Math.abs(q-x)<bs){bs=Math.abs(q-x);sn=q}});if(sn!=null)x=sn}
  var lo=(g.k===0)?0:g.b[g.k-1]+0.3,hi=(g.k===N)?D:g.b[g.k+1]-0.3;if(lo>hi)return;x=Math.max(lo,Math.min(hi,x));
  g.b[g.k]=Math.round(x*100)/100;g.moved=true;drawWave(g.c);
  var m='Vạch '+(g.k===0?'bắt đầu giọng':g.k===N?'kết thúc giọng':'giữa dòng '+g.k+' và '+(g.k+1))+': giây '+g.b[g.k].toFixed(2);
  ['wavei','wavei2'].forEach(function(id){var wi=document.getElementById(id);if(wi)wi.textContent=m})});
document.addEventListener('pointerup',function(){var g=S.wdrag;if(!g)return;S.wdrag=null;S.wb=null;
  if(g.moved){g.c.bounds=g.b.slice();g.c.bManual=true}
  if(g.moved||S.wzoom)render();else drawWave(g.c)});
