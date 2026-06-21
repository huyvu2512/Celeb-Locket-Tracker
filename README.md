# 🎯 Celeb Locket Tracker

Bot GitHub Action tự động quét trang Threads [@locketcameravn](https://www.threads.net/@locketcameravn) để phát hiện celeb mới trên Locket.

## ✨ Tính năng

- 🔍 **Quét tự động** bài viết + bình luận trên Threads
- 🔗 **Resolve đầy đủ** link `locket.cam` → link invite `locket.camera/invites/...`
- 📝 **Ghi nhớ trạng thái** — chỉ quét bài mới, không lặp lại bài cũ đã resolve
- 🔄 **Quét lại bài chưa resolve** — bài quét lần trước không tìm thấy link sẽ được quét lại
- ⚡ **Siêu nhẹ** — không cần Playwright/Selenium, không cần đăng nhập, zero dependencies

## 🚀 Cách hoạt động

1. **cron-job.org** gọi GitHub API để kích hoạt workflow mỗi 15 phút
2. **GitHub Action** chạy `tracker.js`
3. Script quét trang profile → Tìm bài mới → Quét chi tiết (caption + bình luận)
4. Tìm link `locket.cam/username` → Fetch trang đó → Trích xuất invite URL
5. Cập nhật `data/celebs.json` → Auto commit & push

## 📂 Cấu trúc

```
├── .github/workflows/tracker.yml   # GitHub Action workflow
├── src/
│   ├── tracker.js                   # Script chính
│   ├── threads-scraper.js           # Quét Threads
│   ├── locket-resolver.js           # Resolve link Locket
│   └── utils.js                     # Hàm tiện ích
├── data/
│   ├── celebs.json                  # Danh sách celeb đã thu thập
│   └── scan_state.json              # Trạng thái quét
└── package.json
```

## ⚙️ Cấu hình cron-job.org

1. Tạo tài khoản tại [cron-job.org](https://console.cron-job.org/jobs)
2. Tạo job mới với URL:
   ```
   https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/tracker.yml/dispatches
   ```
3. Method: `POST`
4. Headers:
   ```
   Authorization: Bearer {GITHUB_TOKEN}
   Accept: application/vnd.github.v3+json
   ```
5. Body:
   ```json
   {"ref": "main"}
   ```
6. Schedule: Mỗi 15 phút vào các giờ chẵn

## 🔑 Cấu hình GitHub Secrets (Cho Instagram)

Để công cụ có thể quét tin (Stories) trên Instagram, bạn cần cấu hình API Key:

1. Đăng ký tài khoản và subscribe gói Free của API **instagram120** trên [RapidAPI](https://rapidapi.com/3205/api/instagram120).
2. Lấy mã `X-RapidAPI-Key` của bạn.
3. Vào repo GitHub của dự án → **Settings** → **Secrets and variables** → **Actions**.
4. Tạo secret mới với tên `RAPIDAPI_KEY` và dán mã key của bạn vào.
(Nếu bạn chạy thử dưới local, hãy cấu hình environment variable `RAPIDAPI_KEY` trước khi chạy script).

## 🧪 Chạy thử local

```bash
# Chạy bình thường (ghi file)
node src/tracker.js

# Chạy dry-run (chỉ log, không ghi file)
node src/tracker.js --dry-run
```

## 📋 Format dữ liệu celeb

Mỗi celeb trong `data/celebs.json`:

```json
{
  "username": "cuecamfamily",
  "display_name": "Gia đình",
  "locket_cam_url": "https://locket.cam/cuecamfamily",
  "invite_url": "https://locket.camera/invites/2GJKRoeBY5UlaZ7Ml1AGGkjeCJ13d09816d7926150ef?type=UsernameLink",
  "slot_limit": 2000,
  "found_at": "2026-06-20T02:00:24.000Z",
  "source_post_code": "DZy5ChcmOVH",
  "source_type": "caption"
}
```
