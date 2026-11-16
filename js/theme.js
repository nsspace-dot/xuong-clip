/* Giao diện Sáng / Tối. Mặc định Sáng; lựa chọn nhớ trong localStorage (xuongclip_theme), không ghi vào state.json.
   Thuộc tính data-theme trên <html> được đặt sẵn trong <head> để không nháy. Mọi màu là biến CSS;
   phần vẽ bằng canvas (sóng giọng, thanh thời gian) đọc biến lúc vẽ, nên đổi giao diện thì vẽ lại toàn trang. */
function curTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light'}
function themeBtn(){var b=document.getElementById('themetog');if(!b)return;var d=curTheme()==='dark';
  b.innerHTML='<span class="'+(d?'':'on')+'">Sáng</span><span class="'+(d?'on':'')+'">Tối</span>';b.title='Đang dùng giao diện '+(d?'tối':'sáng')+'. Bấm để chuyển sang '+(d?'sáng':'tối')+'.';b.setAttribute('aria-pressed',d?'true':'false')}
function setTheme(t){t=t==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('xuongclip_theme',t)}catch(e){}themeBtn();
  try{render();if(S.vm&&typeof vmRender==='function')vmRender()}catch(e){}}
document.addEventListener('click',function(e){if(e.target.closest('#themetog'))setTheme(curTheme()==='dark'?'light':'dark')});
themeBtn();
