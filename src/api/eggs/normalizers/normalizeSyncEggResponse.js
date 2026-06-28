import { normalizeEgg } from "./normalizeEgg";

function getPayloadRoot(payload) {
  return payload?.data || payload?.result || payload || {};
}

function getEggRows(root) {
  const candidates = [
    root.eggs,
    root.order?.eggs,
    root.data?.eggs,
    root.items,
    root.records,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function createEggMap(eggs) {
  return eggs.reduce((map, egg) => {
    if (!map[egg.choice]) {
      map[egg.choice] = egg;
    }

    return map;
  }, {});
}

function normalizeEggRows(root) {
  return getEggRows(root)
    .map((rawEgg, index) => normalizeEgg(rawEgg, index))
    .filter((egg) => egg.eggId)
    .sort((first, second) => first.slot - second.slot)
    .slice(0, 2);
}

export function normalizeSyncEggResponse(payload, orderCode) {
  const root = getPayloadRoot(payload);
  const order = root.order || root.orderInfo || {};
  const customer = root.customer || order.customer || {};
  const firstOrderItem =
    order.orderItems?.[0] || order.items?.[0] || root.orderItems?.[0] || {};
  const product = root.product || firstOrderItem.product || {};
  const eggs = normalizeEggRows(root);
  const eggsByChoice = createEggMap(eggs);

  return {
    product: {
      id:
        root.productId ||
        root.product_id ||
        product.id ||
        product.kvProductId ||
        firstOrderItem.kvProductId ||
        firstOrderItem.kv_product_id ||
        "api-order-product",
      tenSanPham:
        root.productName ||
        root.product_name ||
        product.name ||
        firstOrderItem.productName ||
        firstOrderItem.product_name ||
        "Đơn hàng quà tặng",
    },
    order: {
      id: root.orderId || root.order_id || order.id || orderCode,
      maDonHang: root.orderCode || root.order_code || order.orderCode || orderCode,
      tenKhachHang:
        root.customerName ||
        root.customer_name ||
        customer.customerName ||
        customer.customer_name ||
        customer.name ||
        "Khách hàng",
      customerCode:
        root.customerCode ||
        root.customer_code ||
        customer.customerCode ||
        customer.customer_code ||
        order.customerCode ||
        order.customer_code ||
        "",
      customerStatus: root.customerStatus || customer.status || "",
      returnStreak: Number(
        root.returnStreak ??
          root.return_streak ??
          customer.returnStreak ??
          customer.return_streak ??
          0
      ),
      deliveryStatus:
        root.deliveryStatus ||
        root.delivery_status ||
        root.fulfillmentStatus ||
        root.fulfillment_status ||
        order.deliveryStatus ||
        order.delivery_status ||
        order.fulfillmentStatus ||
        order.fulfillment_status ||
        "",
      financialStatus:
        root.financialStatus ||
        root.financial_status ||
        order.financialStatus ||
        order.financial_status ||
        "",
      deliveredAt:
        root.deliveredAt ||
        root.delivered_at ||
        root.deliveryCompletedAt ||
        root.delivery_completed_at ||
        order.deliveredAt ||
        order.delivered_at ||
        order.deliveryCompletedAt ||
        order.delivery_completed_at ||
        null,
      lastSyncedAt:
        root.lastSyncedAt ||
        root.last_synced_at ||
        order.lastSyncedAt ||
        order.last_synced_at ||
        null,
      trangThai:
        root.orderStatus ||
        root.order_status ||
        root.status ||
        order.status ||
        "",
    },
    code: {
      code: orderCode,
    },
    apiPayload: root,
    eggs,
    eggsByChoice,
  };
}
