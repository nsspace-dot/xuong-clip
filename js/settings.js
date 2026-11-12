/* Lưu cài đặt nhỏ trong localStorage: Gemini, chất lượng xuất, chữ thông tin, chuyển cảnh. */
var GEM={key:'',model:'gemini-3.8-flash-tts',vmodel:'gemini-3.8-flash',voice:'Kore',style:'warm, friendly Vietnamese woman with a Southern accent, natural conversational tone like replying to a customer comment, moderate pace',rep:'20,5=hai mươi phẩy năm\n14,5=mười bốn phẩy năm\nA4=a bốn',byGian:{}};
try{var gs=JSON.parse(localStorage.getItem('xuongclip_gem')||'null');if(gs)for(var gk in gs)GEM[gk]=gs[gk]}catch(e){}
var EXPQ={res:'720'};
try{var q0=JSON.parse(localStorage.getItem('xuongclip_q')||'null');if(q0)for(var qk in q0)EXPQ[qk]=q0[qk]}catch(e){}
function saveQ(){try{localStorage.setItem('xuongclip_q',JSON.stringify(EXPQ))}catch(e){}}
var INFO={size:50,fg:'#111111',bg:'#ffffff',pos:'bottom',mode:'line',secs:3};
try{var is0=JSON.parse(localStorage.getItem('xuongclip_info')||'null');if(is0)for(var ik in is0)INFO[ik]=is0[ik]}catch(e){}
function saveInfo(){try{localStorage.setItem('xuongclip_info',JSON.stringify(INFO))}catch(e){}}
var TR={type:'fade',dur:0.3};
try{var tr0=JSON.parse(localStorage.getItem('xuongclip_tr')||'null');if(tr0)for(var tk in tr0)TR[tk]=tr0[tk]}catch(e){}
function saveTR(){try{localStorage.setItem('xuongclip_tr',JSON.stringify(TR))}catch(e){}}
function saveGem(){try{localStorage.setItem('xuongclip_gem',JSON.stringify(GEM))}catch(e){}}

/* Người phụ trách: danh sách tên nhập ở Cài đặt; direct = quay trực tiếp, không ghép trong tool. */
var PEOPLE=[];
try{var pp0=JSON.parse(localStorage.getItem('xuongclip_people')||'null');if(Array.isArray(pp0))PEOPLE=pp0.filter(function(x){return x&&typeof x.name==='string'}).map(function(x){return {name:x.name,direct:!!x.direct}})}catch(e){}
function savePeople(){try{localStorage.setItem('xuongclip_people',JSON.stringify(PEOPLE))}catch(e){}}
function person(name){var n=norm(String(name||'').trim());if(!n)return null;return PEOPLE.filter(function(p){return norm(p.name.trim())===n})[0]||null}
function isDirect(c){var p=person(c&&c.who);return !!(p&&p.direct)}
/* Gợi ý cảnh: ngưỡng điểm tối thiểu, có cho gợi ý video nhãn "đoán" hay không (mặc định không). */
var SG={min:40,allowGuess:false};
try{var sg0=JSON.parse(localStorage.getItem('xuongclip_sg')||'null');if(sg0){if(isFinite(+sg0.min))SG.min=Math.max(10,Math.min(95,+sg0.min));SG.allowGuess=!!sg0.allowGuess}}catch(e){}
function saveSG(){try{localStorage.setItem('xuongclip_sg',JSON.stringify(SG))}catch(e){}}
