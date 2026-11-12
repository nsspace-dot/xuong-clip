/* Trạng thái chung và hằng số. Thư viện source và danh sách clip bắt đầu trống. */
var HUE={}; // màu cố định theo sản phẩm (trống: màu tính từ tên). Danh mục sản phẩm nằm trong state.json
var SEGS=[];
var CLIPS=[], EXP=[];
var RULES=[
 {id:'gia',on:true,m:'Có nêu giá',re:/\d[\d.,]*\s?(k|đ|đồng|nghìn|ngàn|triệu|vnđ)(?![\p{L}])|(^|[^\p{L}])giá([^\p{L}]|$)/iu},
 {id:'bc',on:true,m:'Có chữ "bán chạy"',re:/bán chạy/iu},
 {id:'cc',on:true,m:'Hứa chắc chắn tài lộc',re:/(chắc chắn|đảm bảo).*(phát tài|giàu|may mắn)/iu},
 {id:'gg',on:true,m:'Nêu mức giảm giá',re:/giảm\s?\d+\s?%|sale/iu},
 {id:'sk',on:true,m:'Công bố tác dụng sức khỏe',re:/(chữa|trị bệnh|giảm cân|tốt cho sức khỏe)/iu}
];
var STAT={chuaghep:'Chưa ghép',missing:'Thiếu source',loi:'Còn lỗi luật',ready:'Sẵn sàng xuất',exported:'Đã xuất',ngoai:'Ngoài tool'};
var VOICES=['Kore','Zephyr','Puck','Charon','Fenrir','Leda','Orus','Aoede','Callirrhoe','Autonoe','Enceladus','Iapetus','Umbriel','Algieba','Despina','Erinome','Algenib','Rasalgethi','Laomedeia','Achernar','Alnilam','Schedar','Gacrux','Pulcherrima','Achird','Zubenelgenubi','Vindemiatrix','Sadachbia','Sadaltager','Sulafat'];
var GIANS=['Nhà Sách','Sách Hay','Tường Vip','Tranh Lịch'];
var TRN={cut:'Cắt thẳng',fade:'Mờ dần',slide:'Trượt',zoom:'Phóng nhẹ'};
var S={tts:false,mode:'',tok:0,bp:{},tab:'kichban',cur:null,edit:null,li:0,t:0,play:false,tm:null,expG:'Tất cả',paste:'',msg:'',copied:false};
