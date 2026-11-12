/* Danh mục sản phẩm (tên chuẩn + tên tương đương), quy tắc tự gắn nhãn theo đường dẫn,
   gợi ý gộp tên gần giống. Tất cả lưu trong .xuongclip/state.json (version 2).
   Nhãn sản phẩm của video: r.p (tên chuẩn), r.manual (người dùng gắn tay), r.guess (đoán, chưa xác nhận).
   Nhãn tay không bao giờ bị quy tắc hay đoán tự động ghi đè. */
var PRODUCTS=[];   // [{name, aliases:[]}], luôn sắp theo tên
var PRULES=[];     // [{contains, product}], quy tắc đứng trên được ưu tiên
var MERGESKIP=[];  // các cặp "khóa1|khóa2" người dùng đã bấm Bỏ qua

/* ---------- so khớp tên ---------- */
function cleanName(s){return String(s==null?'':s).replace(/\s+/g,' ').trim()}
function pkey(s){return norm(cleanName(s))}
function findProduct(s){var k=pkey(s);if(!k)return null;
  for(var i=0;i<PRODUCTS.length;i++){var p=PRODUCTS[i];if(pkey(p.name)===k||p.aliases.some(function(a){return pkey(a)===k}))return p}return null}
/* Tên chuẩn của một chuỗi sản phẩm: bỏ dấu, không phân biệt hoa thường, bỏ khoảng trắng thừa, tra theo tên và tên tương đương.
   Không có trong danh mục thì trả lại chuỗi gốc đã chuẩn hóa khoảng trắng. */
function canonicalProduct(s){var p=findProduct(s);return p?p.name:cleanName(s)}
function sortProducts(){PRODUCTS.sort(function(a,b){return a.name.localeCompare(b.name,'vi')})}
/* auto=true: tên chỉ sinh ra từ việc đoán theo thư mục; tự bỏ khỏi danh mục khi không còn video nào dùng. */
function ensureProduct(s,auto){var n=canonicalProduct(s);if(!n)return '';var p=findProduct(n);
  if(!p){p={name:n,aliases:[]};if(auto)p.auto=true;PRODUCTS.push(p);sortProducts()}else if(!auto&&p.auto)delete p.auto;return n}
function pruneAuto(){var used={};Object.keys(LIB).forEach(function(k){if(LIB[k].p)used[LIB[k].p]=1});
  PRODUCTS=PRODUCTS.filter(function(p){return !p.auto||used[p.name]||PRULES.some(function(r){return r.product===p.name})})}
function prodCount(name){var n=0;Object.keys(LIB).forEach(function(k){if(LIB[k].p===name&&!isDel(k))n++});return n}
function renameInClips(oldKeys,name){CLIPS.forEach(function(c){if(c.prod&&oldKeys.indexOf(pkey(c.prod))>=0)c.prod=name})}
function keysOf(p){return [pkey(p.name)].concat(p.aliases.map(pkey))}

/* ---------- thao tác trên danh mục (trả về chuỗi lỗi nếu không làm được) ---------- */
function addProduct(s){var n=cleanName(s);if(!n)return 'Tên sản phẩm trống.';var f=findProduct(n);if(f)return '"'+n+'" đã có trong danh mục'+(f.name!==n?' (là tên tương đương của "'+f.name+'")':'')+'.';
  PRODUCTS.push({name:n,aliases:[]});sortProducts();return ''}
function renameProduct(oldName,newName){
  var p=findProduct(oldName),n=cleanName(newName);if(!p)return 'Không thấy sản phẩm "'+oldName+'".';if(!n)return 'Tên chuẩn không được để trống.';
  var o=findProduct(n);if(o&&o!==p)return 'merge:'+o.name;
  var old=p.name,oldKeys=keysOf(p);delete p.auto;if(old===n)return '';
  p.name=n;p.aliases=p.aliases.filter(function(a){return pkey(a)!==pkey(n)});
  if(pkey(old)!==pkey(n)&&!p.aliases.some(function(a){return pkey(a)===pkey(old)}))p.aliases.push(old); // tên cũ thành tên tương đương
  Object.keys(LIB).forEach(function(k){if(LIB[k].p===old)LIB[k].p=n});
  PRULES.forEach(function(r){if(r.product===old)r.product=n});
  renameInClips(oldKeys,n);sortProducts();return ''}
function mergeProducts(keepName,dropName){
  var k=findProduct(keepName),d=findProduct(dropName);if(!k||!d)return 'Không thấy sản phẩm để gộp.';if(k===d)return '';
  var dk=keysOf(d);delete k.auto;
  [d.name].concat(d.aliases).forEach(function(a){if(pkey(a)!==pkey(k.name)&&!k.aliases.some(function(x){return pkey(x)===pkey(a)}))k.aliases.push(a)});
  Object.keys(LIB).forEach(function(id){if(LIB[id].p===d.name)LIB[id].p=k.name});
  PRULES.forEach(function(r){if(r.product===d.name)r.product=k.name});
  renameInClips(dk,k.name);PRODUCTS=PRODUCTS.filter(function(x){return x!==d});return ''}
function deleteProduct(name){
  var p=findProduct(name);if(!p)return 'Không thấy sản phẩm.';
  Object.keys(LIB).forEach(function(k){var r=LIB[k];if(r.p===p.name){r.p='';r.manual=false;r.guess=false}});
  PRULES=PRULES.filter(function(r){return r.product!==p.name});
  PRODUCTS=PRODUCTS.filter(function(x){return x!==p});return ''}
function addAlias(name,alias){
  var p=findProduct(name),a=cleanName(alias);if(!p)return 'Không thấy sản phẩm.';if(!a)return '';
  var f=findProduct(a);if(f===p)return '"'+a+'" đã là tên của "'+p.name+'".';
  if(f)return '"'+a+'" đang là sản phẩm "'+f.name+'". Muốn coi là một thì dùng Gộp (đổi tên chuẩn của "'+f.name+'" thành "'+p.name+'").';
  p.aliases.push(a);delete p.auto;return ''}
function removeAlias(name,alias){var p=findProduct(name);if(!p)return '';p.aliases=p.aliases.filter(function(a){return a!==alias});return ''}

/* ---------- gợi ý gộp tên gần giống ---------- */
function lev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;var prev=[],cur,i,j;for(j=0;j<=b.length;j++)prev[j]=j;
  for(i=1;i<=a.length;i++){cur=[i];var best=i;for(j=1;j<=b.length;j++){cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));if(cur[j]<best)best=cur[j]}if(best>max)return max+1;prev=cur}
  return prev[b.length]}
function skipKey(a,b){return [pkey(a),pkey(b)].sort().join('|')}
function mergeSuggestions(){
  var out=[],ps=PRODUCTS.map(function(p){var k=pkey(p.name).replace(/\s+/g,'');return {n:p.name,k:k,d:(k.match(/\d+/g)||[]).join(',')}});
  for(var i=0;i<ps.length;i++)for(var j=i+1;j<ps.length;j++){var a=ps[i],b=ps[j],L=Math.min(a.k.length,b.k.length);
    if(L<4||a.d!==b.d)continue; // tên ngắn hoặc khác số (Lịch 2026 / Lịch 2027) thì không gợi ý
    var lim=L<6?1:2,d=lev(a.k,b.k,lim);if(d>lim)continue;
    if(MERGESKIP.indexOf(skipKey(a.n,b.n))>=0)continue;
    out.push([a.n,b.n])}
  return out}
function skipMerge(a,b){var k=skipKey(a,b);if(MERGESKIP.indexOf(k)<0)MERGESKIP.push(k)}

/* ---------- quy tắc tự gắn nhãn ---------- */
function ruleFor(path){var k=pkey(path);for(var i=0;i<PRULES.length;i++){var r=PRULES[i],c=pkey(r.contains);if(c&&r.product&&k.indexOf(c)>=0)return r}return null}
function ruleCount(r){var c=pkey(r.contains),n=0;if(!c)return 0;Object.keys(LIB).forEach(function(k){if(!isDel(k)&&pkey(LIB[k].path).indexOf(c)>=0)n++});return n}
/* Gắn nhãn tự động cho một video chưa gắn tay: quy tắc trước, đoán là phương án cuối. Trả về true nếu có thay đổi. */
function labelAuto(r){
  if(r.manual)return false;
  var ru=ruleFor(r.path);
  if(ru){var n=ensureProduct(ru.product);if(r.p!==n||r.guess){r.p=n;r.guess=false;return true}return false}
  if(!r.p){var g=guessProd(r.path);if(g){r.p=ensureProduct(g,true);r.guess=true;return true}}
  return false}
function applyRulesAll(){var n=0;Object.keys(LIB).forEach(function(k){if(labelAuto(LIB[k]))n++});pruneAuto();return n}
function setManualProd(r,s){var n=cleanName(s);if(n){r.p=ensureProduct(n);r.manual=true;r.guess=false}else{r.p='';r.manual=false;r.guess=false}}

/* ---------- đọc / ghi phần danh mục trong state.json ---------- */
function catalogFromState(o){
  PRODUCTS=[];PRULES=[];MERGESKIP=[];
  (Array.isArray(o.products)?o.products:[]).forEach(function(p){if(!p)return;var n=cleanName(p.name);if(!n||findProduct(n))return;
    var al=[];(Array.isArray(p.aliases)?p.aliases:[]).forEach(function(a){a=cleanName(a);if(a&&pkey(a)!==pkey(n)&&!findProduct(a)&&!al.some(function(x){return pkey(x)===pkey(a)}))al.push(a)});
    var q={name:n,aliases:al};if(p.auto)q.auto=true;PRODUCTS.push(q)});
  sortProducts();
  (Array.isArray(o.rules)?o.rules:[]).forEach(function(r){if(r&&cleanName(r.contains))PRULES.push({contains:cleanName(r.contains),product:cleanName(r.product)})});
  (Array.isArray(o.mergeSkip)?o.mergeSkip:[]).forEach(function(k){if(typeof k==='string'&&MERGESKIP.indexOf(k)<0)MERGESKIP.push(k)});
}
function catalogToState(){return {products:PRODUCTS.map(function(p){var o={name:p.name,aliases:p.aliases.slice()};if(p.auto)o.auto=true;return o}),rules:PRULES.map(function(r){return {contains:r.contains,product:r.product}}),mergeSkip:MERGESKIP.slice()}}
