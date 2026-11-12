/* Trạng thái chung và hằng số. Thư viện source và danh sách clip bắt đầu trống. */
var HUE={}; // màu cố định theo sản phẩm (trống: màu tính từ tên). Danh mục sản phẩm nằm trong state.json
var SEGS=[];
var CLIPS=[], EXP=[];
/* Luật kiểm tra nằm ở js/checks.js (CRULES, CHK) và trong state.json. */
var STAT={chuaghep:'Chưa ghép',missing:'Thiếu source',loi:'Còn lỗi',ready:'Sẵn sàng xuất',exported:'Đã xuất',ngoai:'Ngoài tool'};
var VOICES=['Kore','Zephyr','Puck','Charon','Fenrir','Leda','Orus','Aoede','Callirrhoe','Autonoe','Enceladus','Iapetus','Umbriel','Algieba','Despina','Erinome','Algenib','Rasalgethi','Laomedeia','Achernar','Alnilam','Schedar','Gacrux','Pulcherrima','Achird','Zubenelgenubi','Vindemiatrix','Sadachbia','Sadaltager','Sulafat'];
var GIANS=['Nhà Sách','Sách Hay','Tường Vip','Tranh Lịch'];
var TRN={cut:'Cắt thẳng',fade:'Mờ dần',slide:'Trượt',zoom:'Phóng nhẹ'};
var S={tts:false,mode:'',tok:0,bp:{},tab:'kichban',cur:null,edit:null,li:0,t:0,play:false,tm:null,expG:'Tất cả',paste:'',msg:'',copied:false};
