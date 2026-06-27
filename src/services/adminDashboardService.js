function countBy(items, getKey) {
  return items.reduce((result, item) => {
    const key = getKey(item) || "Unknown";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + Number(getValue(item) || 0), 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

// BACKEND_ADMIN_DANG_NHAP:
// Đây là đăng nhập raw ở frontend, chỉ đọc admins.json để demo.
// Backend cần thay bằng API đăng nhập thật, hash mật khẩu, token/session và kiểm tra role.
export function authenticateAdmin(tables, username, password) {
  const normalizedUsername = username.trim().toLowerCase();

  return (tables.admins || []).find(
    (admin) =>
      admin.status === "active" &&
      admin.username.toLowerCase() === normalizedUsername &&
      admin.password_hash === password
  );
}

function getOrderItemMap(orderItems) {
  return new Map(orderItems.map((item) => [item.order_id, item]));
}

function getPoolAccountCount(poolAccountMappings) {
  return countBy(poolAccountMappings, (item) => item.pool_id);
}

function getAvailableAccountIds(accounts) {
  return new Set(
    accounts
      .filter((account) => normalizeStatus(account.status) === "available")
      .map((item) => item.id)
  );
}

function getPoolAvailableCount(poolAccountMappings, availableAccountIds) {
  return poolAccountMappings.reduce((result, item) => {
    if (availableAccountIds.has(item.account_id)) {
      result[item.pool_id] = (result[item.pool_id] || 0) + 1;
    }
    return result;
  }, {});
}

// BACKEND_ADMIN_THONG_KE:
// Frontend đang tự tính analytics từ các bảng JSON.
// Backend nên tạo API, ví dụ /admin/analytics, trả về cùng shape dữ liệu để thay thế hàm này.
export function buildAdminDashboard(tables) {
  const customers = tables.customers || [];
  const orders = tables.kiotvietOrders || [];
  const orderItems = tables.kiotvietOrderItems || [];
  const products = tables.products || [];
  const eggs = tables.eggs || [];
  const giftPools = tables.giftPools || [];
  const giftAccounts = tables.giftAccounts || [];
  const poolAccountMappings = tables.poolAccountMappings || [];
  const eggOpeningLogs = tables.eggOpeningLogs || [];
  const orderItemMap = getOrderItemMap(orderItems);
  const paidOrders = orders.filter((order) => normalizeStatus(order.status) === "paid");
  const blockedOrders = orders.filter((order) => normalizeStatus(order.status) !== "paid");
  const availableAccountIds = getAvailableAccountIds(giftAccounts);
  const poolAccountCount = getPoolAccountCount(poolAccountMappings);
  const poolAvailableCount = getPoolAvailableCount(
    poolAccountMappings,
    availableAccountIds
  );
  const now = Date.now();

  return {
    summary: {
      totalCustomers: customers.length,
      warningCustomers: customers.filter(
        (customer) =>
          normalizeStatus(customer.status).includes("warning") ||
          Number(customer.warningCount || 0) > 0
      ).length,
      bannedCustomers: customers.filter(
        (customer) => normalizeStatus(customer.status).includes("banned")
      ).length,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      blockedOrders: blockedOrders.length,
      totalRevenue: sum(paidOrders, (order) => order.total_price),
      totalProducts: products.length,
      totalEggs: eggs.length,
      hatchingEggs: eggs.filter(
        (egg) => normalizeStatus(egg.status) === "incubating"
      ).length,
      readyEggs: eggs.filter(
        (egg) => egg.hatch_at && new Date(egg.hatch_at).getTime() <= now
      ).length,
      totalAccounts: giftAccounts.length,
      availableAccounts: giftAccounts.filter(
        (account) => normalizeStatus(account.status) === "available"
      ).length,
    },
    counts: {
      customerStatus: countBy(customers, (customer) => customer.status),
      orderStatus: countBy(orders, (order) => order.status),
      financialStatus: countBy(orders, (order) => order.financial_status),
      fulfillmentStatus: countBy(orders, (order) => order.fulfillment_status),
      eggStatus: countBy(eggs, (egg) => egg.status),
      eggType: countBy(eggs, (egg) => egg.egg_type),
      accountStatus: countBy(giftAccounts, (account) => account.status),
      poolTier: countBy(giftPools, (pool) => pool.tier),
      logAction: countBy(eggOpeningLogs, (log) => log.action_type),
    },
    workflow: [
      {
        title: "Đồng bộ KiotViet",
        value: orders.length,
        note: "orders raw",
      },
      {
        title: "Khách hàng",
        value: customers.length,
        note: "customers raw",
      },
      {
        title: "Khách nhập mã",
        value: paidOrders.length,
        note: "Paid được vào chọn trứng",
      },
      {
        title: "Đơn bị chặn",
        value: blockedOrders.length,
        note: "Pending/Cancel không cho claim",
      },
      {
        title: "Cronjob ấp trứng",
        value: eggs.filter((egg) => egg.status === "incubating").length,
        note: "đang chờ hatch_at",
      },
      {
        title: "Log mở trứng",
        value: eggOpeningLogs.length,
        note: "egg_opening_logs",
      },
    ],
    customerRows: customers.map((customer) => ({
      id: customer.id || "-",
      code: customer.customerCode,
      name: customer.customerName,
      status: customer.status,
      success: customer.successCount,
      returnStreak: customer.returnStreak,
      warning: customer.warningCount,
      createdAt: formatDateTime(customer.createdAt),
      updatedAt: formatDateTime(customer.updatedAt),
    })),
    latestOrders: orders.slice(0, 10).map((order) => {
      const item = orderItemMap.get(order.id);
      return {
        code: order.order_code,
        product: item?.product_name || "-",
        status: order.status,
        fulfillment: order.fulfillment_status,
        total: formatCurrency(order.total_price),
        updatedAt: formatDateTime(order.updated_at),
      };
    }),
    poolRows: giftPools.slice(0, 12).map((pool) => ({
      pool: pool.pool_name,
      tier: pool.tier,
      accounts: poolAccountCount[pool.id] || 0,
      available: poolAvailableCount[pool.id] || 0,
      createdAt: formatDateTime(pool.created_at),
    })),
    productRows: products.slice(0, 12).map((product) => ({
      id: product.kvProductId || product.id,
      name: product.name,
      price: formatCurrency(product.basePrice || 0),
      syncedAt: formatDateTime(product.lastSyncedAt),
    })),
    accountRows: giftAccounts.slice(0, 12).map((account) => ({
      username: account.username,
      platform: account.platform || "-",
      tier: account.tier || "-",
      status: account.status,
      token: account.token || "-",
      assignedAt: formatDateTime(account.assigned_at),
      createdAt: formatDateTime(account.created_at),
    })),
    logRows: eggOpeningLogs.slice(0, 10).map((log) => ({
      action: log.action_type,
      eggId: log.egg_id,
      accountId: log.account_id || "-",
      triggeredBy: log.triggered_by,
      createdAt: formatDateTime(log.created_at),
    })),
  };
}
