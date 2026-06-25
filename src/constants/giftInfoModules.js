export const GIFT_INFO_MODULES = [
  {
    id: "intro",
    title: "Giới Thiệu",
    eyebrow: "AGMC Gift Hatchery",
    heading: "Mở trứng may mắn theo mã đơn hàng",
    description:
      "AGMC Gift là khu vực nhận quà dành cho khách đã có mã đơn hàng hợp lệ. Sau khi nhập mã, hệ thống kiểm tra trạng thái đơn và mở lượt chọn trứng để khách nhận tài khoản theo cơ chế random.",
    points: [
      "Trứng vàng dành cho lượt nhận acc ngay sau khi chọn.",
      "Trứng kim cương dành cho lượt ấp 15 ngày với phần thưởng xịn hơn.",
      "Mỗi mã đơn hợp lệ chỉ dùng cho một lượt nhận quà.",
    ],
  },
  {
    id: "policy",
    title: "Chính sách",
    eyebrow: "Điều kiện nhận quà",
    heading: "Quy định áp dụng cho mã đơn và tài khoản",
    description:
      "Hệ thống chỉ mở lượt nhận quà cho đơn hàng đủ điều kiện. Tài khoản được chọn từ kho quà theo sản phẩm và loại trứng, nhằm giữ kết quả minh bạch và hạn chế trùng lượt.",
    points: [
      "Chỉ đơn hàng trạng thái Paid mới được nhập mã và chọn trứng.",
      "Đơn Pending cần chờ giao thành công; đơn Cancel hoặc hoàn trả không được nhận quà.",
      "Tài khoản sau khi nhận hoặc mở trứng cần được lưu lại, hệ thống chỉ hiển thị theo lượt hợp lệ.",
      "Trường hợp tài khoản lỗi đăng nhập cần liên hệ hỗ trợ để được kiểm tra theo log nhận quà.",
    ],
  },
  {
    id: "guide",
    title: "Hướng Dẫn",
    eyebrow: "Cách tham gia",
    heading: "Nhập mã, chọn trứng và nhận tài khoản",
    description:
      "Quy trình được thiết kế ngắn gọn để khách tự thao tác. Nếu chọn trứng ấp, trang sẽ hiển thị thời gian mở trứng và bộ đếm ngược để quay lại nhận quà đúng thời điểm.",
    points: [
      "Bước 1: Nhập mã đơn hàng vào ô kiểm tra mã.",
      "Bước 2: Khi mã hợp lệ, chọn trứng vàng hoặc trứng kim cương.",
      "Bước 3: Trứng vàng hiển thị tài khoản ngay sau random.",
      "Bước 4: Trứng kim cương bắt đầu ấp 15 ngày và mở khi hết thời gian đếm ngược.",
    ],
  },
];

export const DEFAULT_GIFT_INFO_MODULE_ID = GIFT_INFO_MODULES[0].id;

export function getGiftInfoModule(moduleId) {
  return GIFT_INFO_MODULES.find((module) => module.id === moduleId);
}
