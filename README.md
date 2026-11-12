# Xưởng Clip

Công cụ dựng video TikTok 9:16 từ source quay sẵn. Chạy hoàn toàn trên trình duyệt, không có bước build, không dùng framework.
Chỉ chạy trên **Chrome hoặc Edge** bản máy tính (cần API chọn thư mục `showDirectoryPicker`).

## Cấu trúc thư mục

```
index.html          Khung trang, nạp CSS và các file JS theo thứ tự
css/style.css       Toàn bộ giao diện
vendor/mp4-muxer.js Thư viện mp4-muxer (giữ nguyên, không sửa)
js/
  state.js          Trạng thái chung và hằng số (thư viện, danh sách clip bắt đầu trống)
  settings.js       Lưu cài đặt nhỏ trong localStorage (Gemini, chất lượng, chữ thông tin, chuyển cảnh, người phụ trách)
  utils.js          Tiện ích dùng chung (escape, chuẩn hóa chữ, màu, msg...)
  timeline.js       Đọc kịch bản, tính dòng thời gian, chữ thông tin, chuyển cảnh
  match.js          Gợi ý cảnh (chấm điểm, lý do, ngưỡng), ghép tự động, trùng cảnh
  checks.js         Kiểm tra luật trước khi xuất: luật từ ngữ, luật hình thức, vùng an toàn, khóa xuất
  library.js        AI gắn tag, thanh chọn đoạn, xem/cắt đoạn; IndexedDB chỉ giữ handle thư mục
  catalog.js        Danh mục sản phẩm, tên tương đương, canonicalProduct(), quy tắc gắn nhãn, gợi ý gộp
  source.js         Thư mục source: chọn thư mục, quét video, state.json, khóa, hình thu nhỏ
  clipstore.js      Tự lưu clip đang ghép, giọng đọc (.xuongclip/audio), ảnh bìa, clip đã xuất
  voice.js          Giọng đọc Gemini và căn giọng theo dòng
  wave.js           Sóng âm giọng đọc, vạch chia dòng
  export.js         Xuất video MP4 (WebCodecs + mp4-muxer), ảnh bìa, lưu file
  ui.js             Giao diện các tab, xem trước, điều hướng
  editor.js         Màn Ghép clip kiểu phòng dựng: thanh trên, thư viện, danh sách dòng, Inspector
  tl.js             Thanh thời gian nhiều tầng (Video, Giọng, Chữ, Nhạc), kéo thả, phím tắt
  kbview.js         Tab Kịch bản: nạp theo đợt, trùng mã, lưu trữ đợt, xóa mềm
  libview.js        Tab Thư viện (lọc, chọn nhiều, gắn hàng loạt, hoàn tác) và phần danh mục / quy tắc ở Cài đặt
  events.js         Bắt sự kiện click / nhập / kéo thả
  main.js           Khởi động (nạp cuối cùng)
```

Các file JS là `<script>` thường, dùng chung biến toàn cục. Thứ tự nạp trong `index.html` là bắt buộc.

## Thư mục source và dữ liệu

Video quay sẵn nằm trong một thư mục trên máy (có thể có thư mục con). Tab **Thư viện source** → **Chọn thư mục source**.
Tool đọc video thẳng từ thư mục đó, không chép vào trình duyệt, và **không bao giờ xóa, đổi tên hay di chuyển file video**.
Thứ duy nhất tool ghi ra là thư mục con `.xuongclip`:

```
<thư mục source>/.xuongclip/
  state.json        version 4: library, deleted, products, rules, mergeSkip (thư viện)
                    clips, clipsArchived, clipsTrash, exported, info (kịch bản, clip đang ghép, clip đã xuất)
                    checkRules, checkCfg (luật kiểm tra, ngưỡng, vùng an toàn)
  state.bak.json    bản state.json trước lần ghi gần nhất
  state.v<N>.bak.json   bản trước khi nâng version (giữ lâu dài)
  audio/<mã clip>.wav   giọng đọc đã tạo hoặc tải lên
  lock.json         khóa chống hai tab / hai máy cùng ghi (hết hạn sau 2 phút không cập nhật)
  state.corrupt-<giờ>.json   chỉ có khi state.json bị hỏng
```

- Id video = SHA-1 của `đường dẫn tương đối|size|mtime`.
- Nhãn sản phẩm theo thứ tự: gắn tay (`manual`, không bao giờ bị ghi đè) → quy tắc (chuỗi trong đường dẫn, quy tắc trên được ưu tiên) → đoán (`guess`, theo tên thư mục chứa video, bỏ qua thư mục `thô` / `đã dựng` / `đã đăng`; ở gốc thì đoán từ tên file theo danh mục).
- Tên sản phẩm luôn quy về tên chuẩn bằng `canonicalProduct()` (bỏ dấu, không phân biệt hoa thường, bỏ khoảng trắng thừa, tra theo tên tương đương).
- Tool gặp `state.json` có version mới hơn bản nó hiểu thì chỉ đọc, không ghi. Gặp version 1 thì tự chuyển lên 2 (bản cũ giữ ở `state.bak.json`).
- Bỏ qua thư mục / file bắt đầu bằng `.`, `$`, `@`, `#`, `~` (ví dụ `@eaDir`, `#recycle` của Synology).
- Nút Xóa chỉ ẩn thẻ; khôi phục ở tab Cài đặt.
- API key Gemini, tên model, người phụ trách lưu trong localStorage của trình duyệt, **không** ghi vào `state.json`.
- Kịch bản, clip đang ghép (cảnh đã chọn, chữ, vị trí chữ, giọng, vạch ranh giới, ảnh bìa) và danh sách Clip đã xuất tự lưu 1,5 giây sau mỗi thay đổi. Giọng đọc nạp lại từ file, không gọi lại API.
- Nạp kịch bản là thêm vào theo Đợt; trùng mã clip thì tool hỏi. Lưu trữ đợt chỉ ẩn, xóa clip là xóa mềm. Tool không xóa file giọng hay video trên đĩa.
- Kiểu chữ thông tin lưu theo thư mục; key, model, giọng, người phụ trách, ngưỡng gợi ý, chuyển cảnh mặc định, chất lượng xuất lưu trong trình duyệt.

## Gợi ý cảnh

- Chỉ gợi ý video **cùng sản phẩm** với clip (so bằng `canonicalProduct()`, tên tương đương tính là một). Sản phẩm rỗng không bao giờ khớp.
- Video chưa gắn nhãn không bao giờ được gợi ý; video nhãn "đoán" chỉ khi bật ở Cài đặt.
- Điểm (tối đa 95): khớp "cảnh cần" với đoạn tag AI / mô tả AI / tên video (60), đủ dài (15), chưa dùng (15), video thô (5); video đã đăng trừ 10, trùng đoạn trừ 30.
- Dưới ngưỡng (mặc định 40, đổi ở Cài đặt) hoặc trùng đoạn thì không phải gợi ý; cảnh đó vào tab Thiếu source là "cần quay thêm".
- Trùng cảnh = cùng video, cùng gian, khoảng thời gian chồng nhau. Dòng đã chọn cảnh tay bị khóa, Ghép lại tự động không đổi.

## Kiểm tra luật

- Luật từ ngữ sửa được ở Cài đặt: cụm từ hoặc mẫu, mức LỖI / CẢNH BÁO / NGOẠI LỆ, phạm vi (tất cả, theo gian, theo sản phẩm), bật/tắt, ghi chú; nhân bản, xuất / nhập JSON.
- Khớp theo từ nguyên vẹn, không phân biệt hoa thường; bỏ qua dấu thanh khi bật tùy chọn. Luật NGOẠI LỆ che cụm được phép (mặc định có "giá trị").
- Luật hình thức: tổng thời lượng 45–60 giây (LỖI), mỗi dòng 6–9 giây (CẢNH BÁO), chữ số trong lời (CẢNH BÁO), cụm chữ hiện không có trong lời (LỖI), dòng cuối thiếu "giỏ hàng" (CẢNH BÁO), dòng chưa có cảnh / clip chưa có giọng (LỖI), chữ hiện ra ngoài vùng an toàn (CẢNH BÁO). Ngưỡng và bật/tắt ở Cài đặt.
- Vùng an toàn TikTok: trên 8%, dưới 22%, phải 14%, trái 4% — **số ước lượng, chưa kiểm chứng**.
- Còn LỖI thì nút Xuất bị khóa; chỉ còn CẢNH BÁO thì hỏi xác nhận. CẢNH BÁO bỏ qua được cho từng clip, LỖI thì không.

## Giao diện phòng dựng

- Nền tối, toàn bộ màu là biến CSS ở đầu `css/style.css` (`--bg`, `--panel`, `--line`, `--fg`, `--muted`, `--accent`, `--ok`, `--warn`, `--err`).
- Màn Ghép clip: thanh trên (chọn clip, đèn trạng thái, tổng thời lượng, Kiểm tra, Xuất), thư viện bên trái và Inspector bên phải thu gọn được (nhớ trạng thái), khung xem thử 9:16, danh sách dòng mỗi dòng một hàng, thanh thời gian nhiều tầng ở dưới, nút Toàn màn hình.
- Phím tắt trên màn Ghép clip (không bắt khi đang gõ): Space phát/dừng, ← → một khung hình (Shift: 1 giây), [ ] dòng trước/sau, I / O điểm đầu/cuối đoạn video tại kim chạy, ? bảng phím tắt.

## Mở thử

- GitHub Pages: chọn nhánh trong Settings → Pages rồi mở địa chỉ Pages.
- Hoặc chạy máy chủ tĩnh cục bộ trong thư mục repo rồi mở `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Không mở trực tiếp bằng `file://` vì một số tính năng trình duyệt (IndexedDB, chọn thư mục) có thể bị chặn.

API key Gemini chỉ nhập trong tab Cài đặt và được lưu trong trình duyệt của người dùng, không có trong code.
