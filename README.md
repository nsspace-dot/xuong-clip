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
  voicemenu.js      Menu chọn giọng: nghe thử, phong cách đọc, tốc độ, mặc định theo người / gian, tạo lại giọng từng dòng
  wave.js           Sóng âm giọng đọc, vạch chia dòng
  export.js         Xuất video MP4 (WebCodecs + mp4-muxer), ảnh bìa, lưu file
  ui.js             Giao diện các tab, xem trước, điều hướng
  editor.js         Màn Ghép clip kiểu phòng dựng: thanh trên, thư viện, danh sách dòng, Inspector
  look.js           Bộ lọc ảnh và khung hình; drawSrc() vẽ khung nguồn chung cho xem thử, xuất, ảnh bìa
  tl.js             Thanh thời gian nhiều tầng (Video, Giọng, Chữ, Nhạc), kéo thả, phím tắt
  tstyle.js         Kiểu chữ đã lưu (mặc định theo gian) và khung kết
  queue.js          Xuất: chất lượng, ước tính dung lượng, mẫu tên file, file .txt kèm theo, caption, hàng đợi xuất nhiều clip
  music.js          Nhạc nền: nạp file, cắt / lặp, mờ vào / ra, hạ nhạc khi có giọng; musicAt() dùng chung cho nghe thử và xuất
  xuong.js          Tab Xưởng (mở mặc định): các trạm sản xuất, mốc hạn chót, lọc, xem theo người
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
  state.json        version 7: library, deleted, products, rules, mergeSkip (thư viện)
                    clips, clipsArchived, clipsTrash, exported, info (kịch bản, clip đang ghép, clip đã xuất)
                    checkRules, checkCfg (luật kiểm tra, ngưỡng, vùng an toàn), milestones (hạn chót)
                    textStyles (kiểu chữ đã lưu, kiểu mặc định theo gian)
                    voiceDefaults (giọng mặc định theo người, theo gian), customVoices (giọng tự tạo, hiện chưa dùng)
  state.bak.json    bản state.json trước lần ghi gần nhất
  state.v<N>.bak.json   bản trước khi nâng version (giữ lâu dài)
  audio/<mã clip>.wav   giọng đọc đã tạo hoặc tải lên
  audio/<mã clip>.nhac.<đuôi>   nhạc nền người dùng nạp cho clip
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

## Bộ lọc và khung hình

- Mỗi dòng có bộ lọc nhẹ (độ sáng, tương phản, bão hòa, sắc nét) và khung (lấp đầy / vừa khung 9:16, phóng 1–3×, kéo lệch trên khung xem thử). Mặc định "Giữ màu gốc": không xử lý gì thêm.
- Khung xem thử vẽ bằng đúng hàm `drawSrc()` mà file xuất dùng, nên xem thử và xuất giống hệt.
- Áp cho tất cả dòng của clip hoặc cho các clip đã chọn (hỏi xác nhận, hoàn tác được một lần).

## Nhạc nền, kiểu chữ, khung kết

- **Nhạc nền**: người dùng tự nạp file (mp3, m4a, wav) cho từng clip; tự chọn nhạc có bản quyền phù hợp, tool không kèm nhạc.
  File chép vào `.xuongclip/audio`, `state.json` chỉ giữ đường dẫn và thông số. Chỉnh ở Inspector › Nhạc nền hoặc kéo khối nhạc trên tầng Nhạc:
  điểm bắt đầu trên clip, độ dài (trống = đến hết), bắt đầu từ giây nào của bài, bài ngắn hơn thì lặp hoặc phát một lần, mờ vào / mờ ra.
- Hạ nhạc khi có giọng: hai mức âm lượng riêng (không có giọng / khi có giọng), chuyển mức trong 0,25 giây quanh mỗi đoạn có giọng.
  Nghe thử (nút Phát) và file xuất dùng chung hàm `musicAt()` nên âm lượng như nhau.
- **Kiểu chữ**: tên, phông (chỉ phông có sẵn trên máy: Arial, Tahoma, Verdana, Trebuchet MS, Times New Roman, Georgia hoặc mặc định), cỡ, màu, viền, đổ bóng, nền, vị trí.
  Áp cho một chữ (ô chọn cạnh chữ) hoặc mọi chữ của clip bằng một lần bấm. Mỗi gian có thể có một kiểu mặc định, chữ mới thêm nhận kiểu đó.
  Vùng an toàn vẫn được kiểm theo đúng phông, cỡ, vị trí của kiểu.
- **Khung kết** (mặc định tắt): 1–3 giây sau dòng cuối, nền một màu hoặc giữ khung hình cuối, thêm một dòng chữ.
  Chữ khung kết đi qua luật từ ngữ và vùng an toàn; tổng thời lượng clip tính cả khung kết. Xem thử vẽ bằng đúng hàm của file xuất.

## Giọng đọc

- Menu chọn giọng (nút "Giọng: …" ở thanh trên màn Ghép clip, mục Giọng đọc trong Inspector, hoặc Cài đặt › Giọng mặc định theo người và gian):
  30 giọng có sẵn của Gemini TTS, nút Nghe thử cho từng giọng đọc câu mẫu bạn tự gõ, ô Phong cách đọc (chữ tự do, có mẫu gợi ý sửa được), Tốc độ.
- Gemini không có thông số tốc độ riêng: tool ghi thêm câu yêu cầu tốc độ (tiếng Anh) vào phong cách đọc gửi kèm lời.
- Thứ tự áp dụng: riêng của dòng → riêng của clip → mặc định của người làm → mặc định của gian → mặc định chung (Charon). Màn Ghép ghi rõ giọng đang dùng và lấy theo đâu.
- Mở menu không gọi API. Chỉ gọi khi bấm Nghe thử / Tạo giọng / Tạo lại. Nghe thử lại cùng giọng, phong cách và câu thì phát bản đã có.
- Giọng đã tạo không bao giờ tự tạo lại. Đổi giọng của clip / dòng đã có giọng thì tool hỏi một lần, nói rõ dòng nào sẽ tạo lại; đồng ý thì chỉ gọi API cho các dòng đó rồi ghép vào file giọng cũ.
  Đổi mặc định theo người / gian chỉ báo "cần tạo lại", không gọi API.
- Lỗi khi gọi API (sai key, hết hạn mức, lỗi máy chủ, mất mạng) hiện bằng lời rõ ràng, không bao giờ in key.
- "Tạo giọng mới" bằng mô tả: chưa làm, nút để xám kèm lý do (chưa xác minh được API).

## Xuất

- Chất lượng: 1080×1920 (mặc định) hoặc 720×1280, khung dọc 9:16; bitrate Nhẹ / Vừa / Cao. Dung lượng ước tính hiện trước khi xuất (bitrate × thời lượng, chỉ là ước lượng).
- Tên file theo mẫu sửa được, mặc định `<mã>_<tên>` (tên clip rút gọn); dùng được `<mã> <tên> <gian> <sp> <ngày>`, tùy chọn thêm ngày xuất.
  Tool bỏ dấu, bỏ ký tự lạ (chỉ giữ chữ không dấu, số, `_`, `-`) và thêm `-2`, `-3` khi trùng; không ghi đè file có sẵn.
- Mỗi file xuất kèm file `.txt` cùng tên: toàn bộ lời thoại, chữ khung kết (nếu có) và caption / hashtag **do người dùng tự nhập** cho từng clip (lưu trong `state.json`, trường `capt`). Tool không tự viết caption. Có nút sao chép caption.
- Tab **Clip đã xuất** › Xuất hàng loạt: chọn nhiều clip (mặc định chỉ clip không còn LỖI và chưa xuất; clip còn LỖI hiện "Bỏ qua" kèm lý do), xuất lần lượt, có tiến độ từng clip và tổng, hủy được (clip đang xuất dừng, không lưu file dở), một clip lỗi không làm dừng cả hàng, cuối cùng có bảng tổng kết.
- Clip xuất xong vào trạm Đã xuất ở màn Xưởng.

## Màn Xưởng

- Tab đầu tiên, mở mặc định. Mỗi clip tự rơi vào một trạm theo dữ liệu: Kịch bản (chưa gán cảnh nào) → Ghép cảnh (thiếu cảnh hoặc chưa có giọng) → Kiểm tra (đủ cảnh và giọng, còn LỖI) → Sẵn sàng xuất → Đã xuất → Đã đăng (người dùng tự đánh dấu, có hoàn tác). Clip quay trực tiếp nằm ở Sẵn sàng xuất chờ đánh dấu đã đăng.
- Mốc hạn chót nhập tay: tên, ngày giờ (múi giờ máy), mục tiêu % clip tới trạm đích; đếm ngược, thanh tiến độ, vàng khi còn dưới 24 giờ mà chưa đạt, đỏ khi quá hạn chưa đạt.
- Lọc theo người, gian, trạm, có lỗi, thiếu source; xem theo trạm hoặc theo người. Bộ lọc nhớ trong trình duyệt.

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
