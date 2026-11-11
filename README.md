# Xưởng Clip

Công cụ dựng video TikTok 9:16 từ source quay sẵn. Chạy hoàn toàn trên trình duyệt, không có bước build, không dùng framework.

## Cấu trúc thư mục

```
index.html          Khung trang, nạp CSS và các file JS theo thứ tự
css/style.css       Toàn bộ giao diện
vendor/mp4-muxer.js Thư viện mp4-muxer (giữ nguyên, không sửa)
js/
  state.js          Trạng thái chung và hằng số (thư viện, danh sách clip bắt đầu trống)
  settings.js       Lưu cài đặt nhỏ trong localStorage (Gemini, chất lượng, chữ thông tin, chuyển cảnh)
  utils.js          Tiện ích dùng chung (escape, chuẩn hóa chữ, màu, msg...)
  timeline.js       Đọc kịch bản, tính dòng thời gian, chữ thông tin, chuyển cảnh
  match.js          Ghép cảnh tự động, kiểm tra luật, trạng thái clip
  library.js        Thư viện source: thêm video, lưu IndexedDB, AI gắn tag, xem/chọn đoạn
  voice.js          Giọng đọc Gemini và căn giọng theo dòng
  wave.js           Sóng âm giọng đọc, vạch chia dòng
  export.js         Xuất video MP4 (WebCodecs + mp4-muxer), ảnh bìa, lưu file
  ui.js             Giao diện các tab, xem trước, điều hướng
  events.js         Bắt sự kiện click / nhập / kéo thả
  main.js           Khởi động (nạp cuối cùng)
```

Các file JS là `<script>` thường, dùng chung biến toàn cục. Thứ tự nạp trong `index.html` là bắt buộc.

## Mở thử

- GitHub Pages: chọn nhánh trong Settings → Pages rồi mở địa chỉ Pages.
- Hoặc chạy máy chủ tĩnh cục bộ trong thư mục repo rồi mở `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Không mở trực tiếp bằng `file://` vì một số tính năng trình duyệt (IndexedDB, chọn thư mục) có thể bị chặn.

API key Gemini chỉ nhập trong tab Cài đặt và được lưu trong trình duyệt của người dùng, không có trong code.
