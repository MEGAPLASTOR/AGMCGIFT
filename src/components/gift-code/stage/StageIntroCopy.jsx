export function StageIntroCopy({ daysToWait }) {
  return (
    <div className="stage-copy">
      <p className="eyebrow">Giới Thiệu</p>
      <h1>Hệ thống tri ân khách hàng AGMC Gift</h1>
      <p>
        Nhập mã đơn để hệ thống đối soát và kích hoạt gói quà tri ân tương ứng.
        Gói nhận ngay được bàn giao sau khi xác thực; gói chuẩn bị cần khoảng{" "}
        {daysToWait} ngày trước khi nhận thông tin quà.
      </p>
    </div>
  );
}
