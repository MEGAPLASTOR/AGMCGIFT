import { normalizeEgg } from "./normalizeEgg";

function createEggMap(eggs) {
  return eggs.reduce((map, egg) => {
    if (!map[egg.choice]) {
      map[egg.choice] = egg;
    }

    return map;
  }, {});
}

export function normalizeSyncEggResponse(payload, orderCode) {
  const eggs = (payload?.eggs || []).map(normalizeEgg).filter((egg) => egg.eggId);
  const eggsByChoice = createEggMap(eggs);

  return {
    product: {
      id: payload?.productId || payload?.product_id || "api-order-product",
      tenSanPham:
        payload?.productName || payload?.product_name || "Đơn hàng quà tặng",
    },
    order: {
      id: payload?.orderId || payload?.order_id || orderCode,
      maDonHang: orderCode,
      tenKhachHang: payload?.customerName || "Khách hàng",
      customerStatus: payload?.customerStatus || "",
      deliveryStatus: payload?.deliveryStatus || "",
      trangThai: "Paid",
    },
    code: {
      code: orderCode,
    },
    apiPayload: payload,
    eggs,
    eggsByChoice,
  };
}
