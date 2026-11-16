/* Tầng Video trên thanh thời gian: mỗi cảnh vẽ dải hình lấy đúng khung tại thời điểm nguồn của cảnh đó
   (tính bằng srcT, cùng hàm với xem thử và xuất), thay cho dải chung của cả video nguồn.
   Khung hình được tải dần: một hàng đợi, mỗi lần một khung, nhường luồng giữa các khung nên giao diện không đơ.
   Dải chung cũ vẫn làm nền tạm trong lúc chờ. */
var FRW=40,FRC={},FRN=0,FRQ=[],FRV={},FRBUSY=false;
function frKey(sid,t){return sid+'@'+(Math.round(t*10)/10).toFixed(1)}
function tlFramesHTML(l,sg,w){var n=Math.max(1,Math.ceil(w/FRW)),tw=w/n,h='';
  for(var j=0;j<n;j++){var tt=l.s+(j+0.5)*(l.e-l.s)/n,k=frKey(sg.id,srcT(l,sg,tt));
    h+='<span class="tlfk" data-fk="'+k+'" style="left:'+(j*tw).toFixed(1)+'px;width:'+(tw+0.5).toFixed(1)+'px'+(FRC[k]?';background-image:url('+FRC[k]+')':'')+'"></span>';if(!FRC[k]&&FRQ.indexOf(k)<0)FRQ.push(k)}
  return '<span class="tlfr">'+h+'</span>'}
function frStart(){if(FRBUSY||!FRQ.length)return;FRBUSY=true;setTimeout(frPump,30)}
async function frPump(){try{
  while(FRQ.length){var k=FRQ.shift();if(FRC[k])continue;var at=k.lastIndexOf('@'),sid=k.slice(0,at),t=+k.slice(at+1),sg=seg(sid);if(!sg||!sg.url||sg.bad)continue;
    if(!document.querySelector('[data-fk="'+k+'"]'))continue; // không còn trên màn hình
    var v=FRV[sid];if(!v){v=await loadVid(sg.url);if(!v||!v.videoWidth){FRV[sid]=null;continue}FRV[sid]=v}
    await seekVid(v,Math.max(0,Math.min(t,sdur(sg)-0.05)));
    var cv=newCanvas(FRW*2,76),g=cv.getContext('2d'),kk=Math.max(cv.width/v.videoWidth,cv.height/v.videoHeight),dw=v.videoWidth*kk,dh=v.videoHeight*kk;
    g.drawImage(v,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);var u=cv.toDataURL('image/jpeg',0.6);FRC[k]=u;FRN++;
    document.querySelectorAll('[data-fk="'+k+'"]').forEach(function(e){e.style.backgroundImage='url('+u+')'});
    if(FRN>3000){FRC={};FRN=0}
    await new Promise(function(r){setTimeout(r,0)})} // nhường luồng giữa các khung
  }catch(e){}finally{FRBUSY=false;if(FRQ.length)frStart()}}
