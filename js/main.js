/* Khởi động: nạp sau cùng, khi mọi module đã sẵn sàng. */
try{idbGet('dir').then(function(h){if(h){S.dir=h;if(S.tab==='caidat'&&!S.exporting)render()}}).catch(function(){})}catch(e){}
window.addEventListener('hashchange',route);
route();
srcInit();
