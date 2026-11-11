/* Ghép cảnh tự động và kiểm tra luật. */
function segText(s){return s.label+' '+(s.desc||'')+' '+((s.tags||[]).map(function(t){return t.d}).join(' '))}
function bestTag(s,l){var b=null,bs=0;(s.tags||[]).forEach(function(t){var o=overlap(l.need,t.d)*3+overlap(l.t,t.d);if(o>bs){bs=o;b=t}});return b?{t:b,o:bs}:null}
function autoPick(c){
  var inClip={};c.lines.forEach(function(l){l.seg=null;l.segIn=0;l.segOut=null});
  c.lines.forEach(function(l){
    var best=null,bs=0;
    SEGS.forEach(function(s){
      if(s.missing||!prodMatch(c.prod,s.p))return;
      var tx=segText(s),bt=bestTag(s,l),ov=overlap(l.need,tx)*3+overlap(l.t,tx)+(bt?bt.o:0);if(ov<=0)return;
      var sc=ov+(s.o==='thô'?1:0)-(usedElsewhere(s.id,c).length?5:0)-(inClip[s.id]?5:0)-(s.o==='đã đăng'?2:0);
      if(sc>bs){bs=sc;best=s}});
    l.seg=best?best.id:null;if(best){inClip[best.id]=1;var b2=bestTag(best,l);if(b2)l.segIn=Math.max(0,b2.t.a)}
  });
  c.auto=true;
}
function warnings(c){
  var w=[];timeline(c);
  c.lines.forEach(function(l,i){
    var texts=[l.t].concat(l.infos.map(function(x){return x.x}));
    RULES.forEach(function(r){if(r.on&&texts.some(function(t){return r.re.test(t)}))w.push({k:'bad',m:'Dòng '+(i+1)+': '+r.m})});
    l.infos.forEach(function(x){if(cue(l,x)===null)w.push({k:'warn',m:'Dòng '+(i+1)+': cụm "'+x.ph+'" không có trong lời thoại nên chữ "'+x.x+'" sẽ không hiện'})});
    if(l.dm>0&&l.ae!=null&&l.dm<(l.ae-l.as)-0.05)w.push({k:'cut',m:'Dòng '+(i+1)+': voice dài '+fmt1(l.ae-l.as)+'s, bạn nhập '+fmt1(l.dm)+'s, sẽ bị cắt '+fmt1(l.ae-l.as-l.dm)+'s'});
    if(!l.seg)w.push({k:'warn',m:'Dòng '+(i+1)+': chưa có cảnh, xem tab Thiếu source'});
    else{var u=usedElsewhere(l.seg,c);if(u.length)w.push({k:'warn',m:'Dòng '+(i+1)+': đoạn này đã dùng ở '+u.join(', ')+' cùng gian trong tuần'});
      if((seg(l.seg)||{}).o==='đã đăng')w.push({k:'warn',m:'Dòng '+(i+1)+': đoạn lấy từ clip đã đăng, dễ bị coi là nội dung lặp'})}
  });
  return w;
}
function st(c){
  if(c.exported)return 'exported';if(isDirect(c))return 'ngoai';
  if(!c.auto)return 'chuaghep';if(c.lines.some(function(l){return !l.seg}))return 'missing';
  if(warnings(c).some(function(x){return x.k==='bad'}))return 'loi';return 'ready';
}
function altSegs(c,l){
  return SEGS.filter(function(s){return !s.missing}).map(function(s){var m=prodMatch(c.prod,s.p);return {s:s,sc:overlap(l.need,s.label)*3+overlap(l.t,s.label)+(m?2:0)+(s.o==='thô'?1:0)-(usedElsewhere(s.id,c).length?3:0)}})
    .filter(function(x){var inC=c.lines.some(function(o){return o.seg===x.s.id});return x.sc>2&&x.s.id!==l.seg&&!inC&&(prodMatch(c.prod,x.s.p)||overlap(l.need,x.s.label)>=2)}).sort(function(a,b){return b.sc-a.sc}).slice(0,2).map(function(x){return x.s});
}
function missingAll(){var o={};CLIPS.forEach(function(c){if(isDirect(c)||!c.auto||c.exported)return;c.lines.forEach(function(l,i){if(!l.seg){(o[c.prod||'Chưa rõ sản phẩm']=o[c.prod||'Chưa rõ sản phẩm']||[]).push({c:c,i:i,l:l})}})});return o}
