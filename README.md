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
  match.js          Ghép cảnh tự động, kiểm tra luật, trạng thái clip
  library.js        AI gắn tag, thanh chọn đoạn, xem/cắt đoạn; IndexedDB chỉ giữ handle thư mục
  catalog.js        Danh mục sản phẩm, tên tương đương, canonicalProduct(), quy tắc gắn nhãn, gợi ý gộp
  source.js         Thư mục source: chọn thư mục, quét video, state.json, khóa, hình thu nhỏ
  voice.js          Giọng đọc Gemini và căn giọng theo dòng
  wave.js           Sóng âm giọng đọc, vạch chia dòng
  export.js         Xuất video MP4 (WebCodecs + mp4-muxer), ảnh bìa, lưu file
  ui.js             Giao diện các tab, xem trước, điều hướng
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
  state.json        version 2: savedAt, library (path, size, mtime, label, product, manual, guess, status,
                    duration, desc, tags), deleted, products [{name, aliases, auto}], rules [{contains, product}], mergeSkip
  state.bak.json    bản state.json trước lần ghi gần nhất
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
- Kịch bản và clip đang ghép chưa được lưu: tải lại trang sẽ mất.

## Mở thử

- GitHub Pages: chọn nhánh trong Settings → Pages rồi mở địa chỉ Pages.
- Hoặc chạy máy chủ tĩnh cục bộ trong thư mục repo rồi mở `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Không mở trực tiếp bằng `file://` vì một số tính năng trình duyệt (IndexedDB, chọn thư mục) có thể bị chặn.

API key Gemini chỉ nhập trong tab Cài đặt và được lưu trong trình duyệt của người dùng, không có trong code.
