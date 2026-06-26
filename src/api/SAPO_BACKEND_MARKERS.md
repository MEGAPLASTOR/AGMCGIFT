# Ghi Chú Cho Backend SAPO

File này đánh dấu các điểm backend cần nối tiếp. Frontend hiện là bản raw, đọc dữ liệu thật từ các file JSON dạng bảng database trong `src/test-Data`.

## Các Bảng JSON Hiện Có

Mỗi bảng có 20 record, riêng `gift-accounts.json` có 50 record.

- `admins.json`
- `sapo-orders.json`
- `sapo-order-items.json`
- `eggs.json`
- `product-egg-mappings.json`
- `gift-pools.json`
- `gift-accounts.json`
- `pool-account-mappings.json`
- `egg-opening-logs.json`

## Nguồn Dữ Liệu

- `src/config/giftCatalogData.js`
  - Marker: `SAPO_BACKEND_NGUON_DU_LIEU`
  - Hiện frontend import trực tiếp JSON.
  - Backend cần thay bằng dữ liệu API lấy từ SAPO/MySQL.

## Luồng Check Mã Đơn Cho Khách

- `src/services/giftCatalogService.js`
  - `SAPO_BACKEND_DANH_SACH_DON`: đọc `sapo_orders` và join `sapo_order_items`.
  - `SAPO_BACKEND_CHECK_MA_DON`: check mã khách nhập bằng `sapo_orders.order_code`.
  - `SAPO_BACKEND_CHAN_DON_CHUA_HOP_LE`: chỉ đơn `Paid` được chọn trứng.
  - `BACKEND_LOGIC_KHO_ACC`: join `product_egg_mappings -> gift_pools -> pool_account_mappings -> gift_accounts`.

## Luồng Frontend Khi Khách Nhập Mã

- `src/hooks/useGiftCode.js`
  - `BACKEND_LOGIC_AP_TRUNG`: tính thời gian ấp trứng, backend có thể chuyển sang server.
  - `SAPO_BACKEND_THONG_BAO_TRANG_THAI_DON`: message khi đơn Pending/Cancel.
  - `SAPO_LUONG_1_KIEM_TRA_MA_NHAP`: khách nhập mã đơn SAPO.
  - `SAPO_LUONG_2_TIM_DON_HANG`: tìm đơn bằng order code.
  - `SAPO_LUONG_3_KIEM_TRA_TRANG_THAI_DON`: chặn `Pending` và `Cancel`.
  - `BACKEND_KHOA_LUOT_NHAN_THUONG`: hiện dùng localStorage, backend cần thay bằng khóa claim ở server.
  - `BACKEND_CHON_LOAI_PHAN_THUONG`: trứng vàng lấy normal, trứng kim cương lấy premium.
  - `BACKEND_CHON_ACC_TU_KHO`: hiện random ở frontend, backend nên reserve/claim acc bằng transaction.
  - `BACKEND_PAYLOAD_LUU_LUOT_NHAN`: payload cần lưu khi khách chọn trứng.

## Admin Dashboard

- Route admin khi deploy static host: `/agmcmyadmin`
- `src/pages/Admin/AdminDashboardPage.jsx`
  - Trang dashboard quản trị, độc lập với trang khách.
  - Đọc dữ liệu từ JSON table state.
- `src/services/adminDashboardService.js`
  - `BACKEND_ADMIN_DANG_NHAP`: thay login JSON bằng API auth thật.
  - `BACKEND_ADMIN_THONG_KE`: thay tính toán frontend bằng API `/admin/analytics`.
- `src/hooks/useAdminAuth.js`
  - `BACKEND_ADMIN_PHIEN_DANG_NHAP`: thay sessionStorage bằng token/session thật.

## Module Đổi Mật Khẩu Admin

- `src/components/admin/AdminPasswordPanel.jsx`
  - `BACKEND_ADMIN_DOI_MAT_KHAU`
  - Modal đổi mật khẩu cho admin đang đăng nhập, mở từ nút trên header dashboard.
- `src/hooks/useAdminDataTables.js`
  - `BACKEND_ADMIN_DOI_MAT_KHAU`
  - Frontend hiện đổi `admins.password_hash` trong state tạm.
  - Backend cần tạo API verify mật khẩu hiện tại, hash mật khẩu mới, cập nhật `admins.password_hash`, `admins.updated_at`.

## Module Thêm Sửa Xóa Tìm Kiếm

- `src/components/admin/AdminDataCrudPanel.jsx`
  - `BACKEND_ADMIN_CRUD_GIAO_DIEN`
  - Giao diện form thêm/sửa/xóa/tìm kiếm record theo từng bảng dữ liệu.
  - Hiện chỉ sửa state trong trình duyệt, không ghi ngược vào file JSON.
- `src/hooks/useAdminDataTables.js`
  - `BACKEND_ADMIN_CRUD_DU_LIEU`
  - Backend cần thay bằng API:
    - `GET /admin/{table}`
    - `POST /admin/{table}`
    - `PUT/PATCH /admin/{table}/{id}`
    - `DELETE /admin/{table}/{id}`

## Module Import Account Bằng Excel

- `src/components/admin/AdminAccountImportPanel.jsx`
  - `BACKEND_ADMIN_IMPORT_ACCOUNT_EXCEL`
  - Giao diện upload file account trong bảng `gift_accounts`.
  - File hỗ trợ các cột: `username`, `password`, `status`, `platform`, `token`, `pool_id`, `assigned_at`.
- `src/services/accountImportService.js`
  - `BACKEND_ADMIN_IMPORT_ACCOUNT_EXCEL`
  - Frontend hiện parse `.xlsx/.csv/.tsv` tại trình duyệt để demo.
  - Backend cần thay bằng API upload file, validate dữ liệu, insert `gift_accounts`.
  - Nếu file có `pool_id`, backend insert thêm `pool_account_mappings` trong cùng transaction.

## Shape Dữ Liệu Backend Nên Trả Về

```js
{
  sapoOrders: [
    { id, order_code, source_name, total_price, financial_status, fulfillment_status, status, created_at, updated_at }
  ],
  sapoOrderItems: [
    { id, order_id, sapo_product_id, sapo_variant_id, product_name, sku, quantity }
  ],
  productEggMappings: [
    { id, sapo_product_id, sapo_variant_id, egg_type: 1 | 2, gift_pool_id, egg_tier, created_at, updated_at }
  ],
  giftPools: [
    { id, pool_name, tier, created_at }
  ],
  giftAccounts: [
    { id, username, password, status, platform, token, created_at, assigned_at }
  ],
  poolAccountMappings: [
    { id, pool_id, account_id }
  ],
  eggs: [
    { id, order_id, account_id, gift_pool_id, egg_type: 1 | 2, status, hatch_at, created_at, updated_at }
  ],
  eggOpeningLogs: [
    { id, egg_id, account_id, action_type, triggered_by, ip_address, created_at }
  ]
}
```

## API Khach Nhap Ma Va Mo Trung

- `src/api/config/apiRuntimeConfig.js`
  - `BACKEND_API_BASE_URL`
  - Cau hinh base URL cho backend.
  - Dev fallback hien tai: `http://10.16.2.116:8080`.
  - Neu backend chay port/domain khac, set `VITE_API_BASE_URL` khi build hoac `AGMC_API_BASE_URL` trong runtime.
- `src/api/endpoints/eggEndpoints.js`
  - Khai bao endpoint rieng cho module eggs.
- `src/api/http/postJson.js`
  - HTTP client dung chung cho cac API POST JSON.
- `src/api/errors/apiErrorMessages.js`
  - Message loi API dung chung, tach khoi UI.
- `src/api/eggs/normalizers/*`
  - Chuan hoa response `/api/eggs/sync` va `/api/eggs/claim` ve shape frontend dang dung.
- `src/api/eggs/messages/*`
  - Chuan hoa thong bao loi API eggs, khong de message ky thuat hien len UI.
- `src/api/eggs/syncEggsByOrderCode.js`
  - `BACKEND_API_SYNC_TRUNG`
  - Frontend goi `POST /api/eggs/sync`.
  - Request body: `{ orderCode: string }`.
  - Response 200 dung cac field: `customerName`, `customerStatus`, `deliveryStatus`, `eggs[]`.
  - Moi phan tu `eggs[]` can co: `eggId`, `eggType`, `displayStatus`, `hatchAt`.
  - Response 400 duoc hieu la ma don khong hop le, khach bi BAN, hoac don chua du dieu kien.
  - Response 429 duoc hien thi la thao tac qua nhanh.
- `src/hooks/useGiftCode.js`
  - `BACKEND_API_NHAP_MA_DON`
  - Sau khi sync thanh cong, frontend khong random account tu JSON nua.
  - Frontend chi hien thi danh sach trung backend tra ve va giu `eggId` cho buoc claim.
- `src/api/eggs/claimEggById.js`
  - `BACKEND_API_CLAIM_TRUNG`
  - Frontend goi `POST /api/eggs/claim`.
  - Request body: `{ eggId: string }`.
  - Response 200 dung cac field: `username`, `password`, `platform`, `message`.
  - Response 400 duoc hieu la trung chua san sang, het qua, hoac da mo.
  - Response 429 duoc hien thi la thao tac qua nhanh.
- `src/hooks/useGiftCode.js`
  - `BACKEND_API_MO_TRUNG`
  - Trung vang goi claim ngay khi khach chon.
  - Trung kim cuong neu `hatchAt` con o tuong lai thi frontend chi hien countdown.
  - Khi countdown ve 0, khach bam mo trung thi frontend moi goi `POST /api/eggs/claim`.

`sapoOrders.status` nên được backend map về một trong ba giá trị: `Pending`, `Paid`, `Cancel`.
