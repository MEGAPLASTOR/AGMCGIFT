# Ghi Chú Tích Hợp API AGMC Gift Code

Web hiện lấy dữ liệu từ các endpoint AGMC Gift Code, không đọc dữ liệu mẫu JSON.

## API Admin Đang Dùng

Tất cả API admin yêu cầu JWT token trong header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc4MjU1ODY3NywiZXhwIjoxNzgyNjQ1MDc3fQ.42JTdCbnR7_83zsPac_h3b030kgOoZL2kbztQYy3ubM
```

- `POST /api/admin/auth/login`
- `PUT /api/admin/auth/credentials`
- `GET /api/admin/customers`
- `PUT /api/admin/customers/{customerCode}/status`
- `GET /api/admin/eggs`
- `GET /api/admin/gift-accounts`
- `PUT /api/admin/gift-accounts/{id}`
- `POST /api/admin/gift-accounts/batch-delete`
- `POST /api/admin/gift-accounts/single`
- `POST /api/admin/gift-accounts/upload`
- `GET /api/admin/gift-pools`
- `POST /api/admin/gift-pools`
- `GET /api/admin/gift-pools/{id}`
- `PUT /api/admin/gift-pools/{id}`
- `DELETE /api/admin/gift-pools/{id}`
- `POST /api/admin/gift-pools/add-account`
- `POST /api/admin/gift-pools/add-accounts`
- `POST /api/admin/gift-pools/remove-accounts`
- `GET /api/admin/orders`
- `GET /api/admin/products`
- `POST /api/admin/products/sync/all`
- `POST /api/admin/product-egg-mappings`
- `DELETE /api/admin/product-egg-mappings/{id}`
- `POST /api/admin/product-egg-mappings/batch-delete`

## Shape Dữ Liệu Web Chuẩn Hóa

- `adminOrders`: danh sách đơn hàng gift code.
- `adminOrderItems`: dòng sản phẩm trong đơn hàng.
- `customers`: danh sách khách hàng.
- `products`: danh sách sản phẩm AGMC.
- `eggs`: danh sách trứng.
- `giftAccounts`: kho tài khoản quà.
- `giftPools`: bể quà.

## Luồng Khách Nhập Mã

- Web gọi `POST /api/eggs/sync`.
- Dịch vụ dữ liệu kiểm tra mã đơn hàng gift code, trạng thái khách, trạng thái giao hàng và trả danh sách trứng hợp lệ.
- Khi khách mở trứng, web gọi `POST /api/eggs/claim`.

## Admin Dashboard

- Route admin: `/agmcmyadmin`.
- Sau khi đăng nhập JWT, web tải các dữ liệu admin ở trên.
- Dashboard chỉ hiện metric/bảng có dữ liệu thật.
