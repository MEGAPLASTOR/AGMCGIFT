import { useCallback, useState } from "react";
import { GIFT_CODE_STATUS } from "../constants/giftCodeStatus";
import { REWARD_TIERS } from "../constants/rewardTiers";
import {
  findCodeInCatalog,
  getAccountsByTier,
  isPaidOrder,
} from "../services/giftCatalogService";
import {
  findRedemptionByCode,
  saveRedemption,
} from "../services/redemptionStorage";
import { pickRandomItem } from "../utils/random";
import { getDelayedRewardInfo } from "../utils/rewardDate";

const LUA_CHON_NHAN_NGAY = "nhan_ngay";
const LUA_CHON_CHO_NHAN_THUONG_XIN = "cho_nhan_thuong_xin";

// BACKEND_LOGIC_AP_TRUNG:
// Backend có thể lưu redeemedAt/rewardReadyAt nếu muốn khóa thời gian ấp ở server.
// Hiện tại frontend tính ngày mở trứng từ redeemedAt và config.soNgayChoNhanThuongXin.
function taoThongTinNhanThuongSau(record, soNgayCho) {
  return {
    ...record,
    ...getDelayedRewardInfo(record.redeemedAt, soNgayCho),
  };
}

// SAPO_BACKEND_THONG_BAO_TRANG_THAI_DON:
// Message hiển thị khi đơn SAPO tồn tại nhưng chưa đủ điều kiện nhập mã.
// Logic chặn chính nằm ở isPaidOrder trong service.
function taoThongBaoTrangThaiDon(order) {
  const status = order.trangThai || order.status || "Unknown";

  if (String(status).trim().toUpperCase() === "PENDING") {
    return "Đơn hàng đang được giao tới bạn hãy đợi đơn hàng giao tới rồi hãy nhập code nhé ^^";
  }

  if (String(status).trim().toUpperCase() === "CANCEL") {
    return "Bạn đã hoàn đơn hàng nên không được phép nhập code nha ^^";
  }

  return `Đơn hàng đang ở trạng thái ${status}. Chỉ đơn Paid mới được nhập mã.`;
}

export function useGiftCode(catalogData) {
  const [status, setStatus] = useState(GIFT_CODE_STATUS.idle);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [redemptionInfo, setRedemptionInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const soNgayCho =
    (catalogData.config || catalogData.cauHinh)?.soNgayChoNhanThuongXin;

  const checkCode = useCallback(
    (inputCode) => {
      const trimmedCode = inputCode.trim().toUpperCase();

      // SAPO_LUONG_1_KIEM_TRA_MA_NHAP:
      // Người dùng nhập maDonHang từ đơn SAPO.
      if (!trimmedCode) {
        setErrorMsg("Vui lòng nhập mã đơn hàng.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      if (!soNgayCho) {
        setErrorMsg("Thiếu cấu hình số ngày chờ nhận acc premium.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      // SAPO_LUONG_2_TIM_DON_HANG:
      // Tìm đơn hàng theo maDonHang và lấy productId để biết kho acc cần dùng.
      const matchedEntry = findCodeInCatalog(catalogData, trimmedCode);

      if (!matchedEntry) {
        setErrorMsg("Mã đơn hàng không hợp lệ. Vui lòng kiểm tra lại.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      // SAPO_LUONG_3_KIEM_TRA_TRANG_THAI_DON:
      // Chỉ đơn Paid mới được chọn trứng. Pending/Cancel bị chặn tại đây.
      if (!isPaidOrder(matchedEntry.order)) {
        setSelectedEntry(null);
        setRedemptionInfo(null);
        setErrorMsg(taoThongBaoTrangThaiDon(matchedEntry.order));
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      // BACKEND_KHOA_LUOT_NHAN_THUONG:
      // Hiện đang lưu localStorage để tránh nhập lại cùng mã.
      // Khi có backend, nên chuyển sang API kiểm tra mã đơn đã claim chưa.
      const existingRedemption = findRedemptionByCode(trimmedCode);
      setSelectedEntry(matchedEntry);
      setErrorMsg("");

      if (existingRedemption?.choice === LUA_CHON_NHAN_NGAY) {
        setRedemptionInfo(existingRedemption);
        setStatus(GIFT_CODE_STATUS.claimedNow);
        return;
      }

      if (existingRedemption?.choice === LUA_CHON_CHO_NHAN_THUONG_XIN) {
        setRedemptionInfo(
          taoThongTinNhanThuongSau(existingRedemption, soNgayCho)
        );
        setStatus(GIFT_CODE_STATUS.claimedLater);
        return;
      }

      setRedemptionInfo(null);
      setStatus(GIFT_CODE_STATUS.choosing);
    },
    [catalogData, soNgayCho]
  );

  const claimReward = useCallback(
    (choice) => {
      if (status !== GIFT_CODE_STATUS.choosing || !selectedEntry) return;

      // BACKEND_CHON_LOAI_PHAN_THUONG:
      // Trứng vàng lấy acc normal, trứng kim cương lấy acc premium.
      const tier =
        choice === LUA_CHON_NHAN_NGAY
          ? REWARD_TIERS.normal
          : REWARD_TIERS.premium;

      // BACKEND_CHON_ACC_TU_KHO:
      // Lấy kho acc theo productId của đơn SAPO và loaiAcc.
      // Backend có thể thay random frontend bằng API reserve/claim acc để tránh trùng acc.
      const accountPool = getAccountsByTier(
        catalogData,
        selectedEntry.order,
        tier
      );
      const selectedAccount = pickRandomItem(accountPool);

      if (!selectedAccount) {
        setErrorMsg("Không tìm thấy acc phù hợp cho sản phẩm này.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      // BACKEND_PAYLOAD_LUU_LUOT_NHAN:
      // Payload cần lưu khi khách đã chọn trứng.
      // Khi nối backend, gửi payload này lên API để khóa mã đơn và acc đã random.
      const newRedemption = {
        code: selectedEntry.code.code,
        orderId: selectedEntry.order.id,
        orderCode: selectedEntry.order.maDonHang,
        orderStatus: selectedEntry.order.trangThai,
        customerName: selectedEntry.order.tenKhachHang,
        choice,
        productId: selectedEntry.product.id,
        productName: selectedEntry.product.tenSanPham,
        productCode: selectedEntry.product.maSanPham,
        account: selectedAccount,
        reward: selectedAccount,
        redeemedAt: new Date().toISOString(),
      };

      saveRedemption(newRedemption);

      if (choice === LUA_CHON_NHAN_NGAY) {
        setRedemptionInfo(newRedemption);
        setStatus(GIFT_CODE_STATUS.claimedNow);
        return;
      }

      setRedemptionInfo(taoThongTinNhanThuongSau(newRedemption, soNgayCho));
      setStatus(GIFT_CODE_STATUS.claimedLater);
    },
    [catalogData, selectedEntry, soNgayCho, status]
  );

  const reset = useCallback(() => {
    setStatus(GIFT_CODE_STATUS.idle);
    setSelectedEntry(null);
    setRedemptionInfo(null);
    setErrorMsg("");
  }, []);

  return {
    status,
    selectedEntry,
    currentCode: selectedEntry?.code.code || "",
    redemptionInfo,
    errorMsg,
    daysToWait: soNgayCho,
    checkCode,
    claimReward,
    reset,
    choices: {
      now: LUA_CHON_NHAN_NGAY,
      later: LUA_CHON_CHO_NHAN_THUONG_XIN,
    },
  };
}
