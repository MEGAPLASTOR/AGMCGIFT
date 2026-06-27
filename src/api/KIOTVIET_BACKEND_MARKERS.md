# Ghi Chú Cho Backend KiotViet

Frontend hiện lấy dữ liệu từ API backend KiotViet, không đọc dữ liệu mẫu JSON.

## API Admin Đang Dùng

Tất cả API admin yêu cầu JWT token trong header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc4MjU1ODY3NywiZXhwIjoxNzgyNjQ1MDc3fQ.42JTdCbnR7_83zsPac_h3b030kgOoZL2kbztQYy3ubM
```

- `POST /api/admin/auth/login`
- `GET /api/admin/customers`
- `GET /api/admin/eggs`
- `GET /api/admin/gift-accounts`
- `GET /api/admin/gift-pools`
- `GET /api/admin/orders`
- `GET /api/admin/products`
- `POST /api/admin/gift-accounts/single`
- `POST /api/admin/gift-accounts/upload`

## Shape Dữ Liệu Frontend Chuẩn Hóa

- `kiotvietOrders`: danh sách đơn KiotViet.
- `kiotvietOrderItems`: dòng sản phẩm trong đơn KiotViet.
- `customers`: danh sách khách hàng.
- `products`: danh sách sản phẩm KiotViet.
- `eggs`: danh sách trứng.
- `giftAccounts`: kho tài khoản quà.
- `giftPools`: bể quà.

## Luồng Khách Nhập Mã

- Frontend gọi `POST /api/eggs/sync`.
- Backend kiểm tra mã đơn KiotViet, trạng thái khách, trạng thái giao hàng và trả danh sách trứng hợp lệ.
- Khi khách mở trứng, frontend gọi `POST /api/eggs/claim`.

## Admin Dashboard

- Route admin: `/agmcmyadmin`.
- Sau khi đăng nhập JWT, frontend tải các API admin raw ở trên.
- Dashboard chỉ hiện metric/bảng có dữ liệu thật.
