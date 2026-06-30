import { REWARD_TIERS } from "../constants/rewardTiers.js";

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

// ORDER_STATUS_NORMALIZATION:
// Trạng thái đơn hàng được chuẩn hóa về Pending, Paid hoặc Cancel.
function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getAdminOrders(catalogData) {
  return catalogData.adminOrders || [];
}

function getAdminOrderItems(catalogData) {
  return catalogData.adminOrderItems || [];
}

function getProductEggMappings(catalogData) {
  return catalogData.productEggMappings || catalogData.product_egg_mappings || [];
}

function getGiftPools(catalogData) {
  return catalogData.giftPools || catalogData.gift_pools || [];
}

function getGiftAccounts(catalogData) {
  return catalogData.giftAccounts || catalogData.gift_accounts || [];
}

function getPoolAccountMappings(catalogData) {
  return catalogData.poolAccountMappings || catalogData.pool_account_mappings || [];
}

function getOrderItemByOrderId(catalogData, orderId) {
  return getAdminOrderItems(catalogData).find((item) => item.order_id === orderId);
}

function normalizeProductFromOrderItem(orderItem) {
  if (!orderItem) return null;

  return {
    id: orderItem.kv_product_id,
    tenSanPham: orderItem.product_name,
    maSanPham: orderItem.sku,
    moTa: `Biến thể sản phẩm: ${orderItem.kv_variant_id || "-"}`,
    productVariantId: orderItem.kv_variant_id,
  };
}

function getProducts(catalogData) {
  if (catalogData.products?.length || catalogData.sanPham?.length) {
    return catalogData.products || catalogData.sanPham;
  }

  const products = new Map();

  getAdminOrderItems(catalogData).forEach((item) => {
    const productId = item.kv_product_id;

    if (!products.has(productId)) {
      products.set(productId, normalizeProductFromOrderItem(item));
    }
  });

  return [...products.values()];
}

function getEggTypeByTier(tier) {
  return tier === REWARD_TIERS.premium ? 2 : 1;
}

function normalizeAccount(account, tier, productId, pool) {
  return {
    id: account.id,
    productId,
    loaiAcc: tier,
    tenAcc: account.username,
    taiKhoan: account.username,
    matKhau: account.password,
    ghiChu: `${pool?.pool_name || "Gift pool"} - ${account.status}`,
    platform: account.platform,
    token: account.token,
    sourceStatus: account.status,
    assignedAt: account.assigned_at,
  };
}

// ORDER_DATA:
// Đọc dữ liệu đơn hàng đã chuẩn hóa từ nguồn runtime.
// Field cần có: order_code, status, kv_product_id.
export function getCustomerOrders(catalogData) {
  if (catalogData.customerOrders?.length || catalogData.orders?.length) {
    const orders = catalogData.customerOrders || catalogData.orders;

    return orders.map((order) => ({
      ...order,
      code: order.code || order.maDonHang,
    }));
  }

  return getAdminOrders(catalogData).map((order) => {
    const orderItem = getOrderItemByOrderId(catalogData, order.id);

    return {
      ...order,
      productId: orderItem?.kv_product_id,
      productVariantId: orderItem?.kv_variant_id,
      maDonHang: order.order_code,
      trangThai: order.status,
      tenKhachHang: order.source_name,
      code: order.order_code,
    };
  });
}

// ORDER_ELIGIBILITY:
// Chỉ đơn Paid mới được đi tiếp vào bước chọn trứng.
// Pending/Cancel vẫn tìm được đơn nhưng bị chặn trong hook useGiftCode.
export function isPaidOrder(order) {
  return normalizeStatus(order?.trangThai || order?.status) === "PAID";
}

// ORDER_CODE_LOOKUP:
// Người dùng nhập mã đơn hàng gift code.
// Hàm này join theo luồng: order -> order_item -> product.
export function findCodeInCatalog(catalogData, inputCode) {
  const normalizedCode = normalizeCode(inputCode);
  const products = getProducts(catalogData);
  const matchedOrder = getCustomerOrders(catalogData).find(
    (order) => normalizeCode(order.maDonHang || order.code) === normalizedCode
  );

  if (!matchedOrder) {
    return null;
  }

  const product = products.find((item) => item.id === matchedOrder.productId);

  if (!product) {
    return null;
  }

  return {
    product,
    order: matchedOrder,
    code: {
      ...matchedOrder,
      code: matchedOrder.maDonHang || matchedOrder.code,
    },
  };
}

// ACCOUNT_POOL_LOOKUP:
// Join dữ liệu kho quà theo các bảng đã tải:
// product_egg_mappings -> gift_pools -> pool_account_mappings -> gift_accounts.
export function getAccountsByTier(catalogData, orderItem, tier) {
  if (catalogData.accounts?.length) {
    return catalogData.accounts.filter((account) => {
      const accountTier = account.loaiAcc || account.tier;
      return account.productId === orderItem.productId && accountTier === tier;
    });
  }

  const eggType = getEggTypeByTier(tier);
  const mapping = getProductEggMappings(catalogData).find(
    (item) =>
      item.kv_product_id === orderItem.productId &&
      (item.kv_variant_id || "") === (orderItem.productVariantId || "") &&
      (item.egg_tier === tier || Number(item.egg_type) === eggType)
  );

  if (!mapping) {
    return [];
  }

  const pool = getGiftPools(catalogData).find(
    (item) => item.id === mapping.gift_pool_id
  );
  const accountIds = new Set(
    getPoolAccountMappings(catalogData)
      .filter((item) => item.pool_id === mapping.gift_pool_id)
      .map((item) => item.account_id)
  );

  return getGiftAccounts(catalogData)
    .filter((account) => accountIds.has(account.id))
    .filter((account) => account.status === "available")
    .map((account) => normalizeAccount(account, tier, orderItem.productId, pool));
}

export const getRewardsByTier = getAccountsByTier;
