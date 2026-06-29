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

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

const TIME_SERIES_CONFIG = {
  day: {
    label: "Ngày",
    points: 14,
  },
  week: {
    label: "Tuần",
    points: 8,
  },
  month: {
    label: "Tháng",
    points: 12,
  },
  year: {
    label: "Năm",
    points: 5,
  },
};

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function getValidDate(...values) {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function startOfBucket(date, range) {
  if (range === "week") {
    return startOfWeek(date);
  }

  if (range === "month") {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  if (range === "year") {
    return new Date(date.getFullYear(), 0, 1);
  }

  return startOfDay(date);
}

function shiftBucket(date, range, amount) {
  const nextDate = new Date(date);

  if (range === "week") {
    nextDate.setDate(nextDate.getDate() + amount * 7);
    return startOfBucket(nextDate, range);
  }

  if (range === "month") {
    nextDate.setMonth(nextDate.getMonth() + amount);
    return startOfBucket(nextDate, range);
  }

  if (range === "year") {
    nextDate.setFullYear(nextDate.getFullYear() + amount);
    return startOfBucket(nextDate, range);
  }

  nextDate.setDate(nextDate.getDate() + amount);
  return startOfBucket(nextDate, range);
}

function formatShortDate(date) {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatBucketLabel(date, range) {
  if (range === "week") {
    const endDate = shiftBucket(date, "day", 6);
    return `${formatShortDate(date)}-${formatShortDate(endDate)}`;
  }

  if (range === "month") {
    return `T${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  if (range === "year") {
    return String(date.getFullYear());
  }

  return formatShortDate(date);
}

function getBucketKey(date, range) {
  const start = startOfBucket(date, range);

  if (range === "month") {
    return `${start.getFullYear()}-${padDatePart(start.getMonth() + 1)}`;
  }

  if (range === "year") {
    return String(start.getFullYear());
  }

  return getLocalDateKey(start);
}

function getOrderActivityDate(order) {
  return getValidDate(
    order.created_at,
    order.createdAt,
    order.delivered_at,
    order.deliveredAt,
    order.last_synced_at,
    order.lastSyncedAt,
    order.updated_at,
    order.updatedAt
  );
}

function getEggActivityDate(egg) {
  return getValidDate(
    egg.created_at,
    egg.createdAt,
    egg.claimed_at,
    egg.claimedAt,
    egg.hatch_at,
    egg.hatchAt,
    egg.updated_at,
    egg.updatedAt
  );
}

function getTimeSeriesReferenceDate(orders, eggs) {
  const dates = [
    ...orders.map(getOrderActivityDate),
    ...eggs.map(getEggActivityDate),
  ].filter(Boolean);

  if (!dates.length) {
    return new Date();
  }

  return dates.reduce((latestDate, date) =>
    date.getTime() > latestDate.getTime() ? date : latestDate
  );
}

function createTimeSeriesPoints(range, referenceDate) {
  const config = TIME_SERIES_CONFIG[range];
  const currentBucket = startOfBucket(referenceDate, range);
  const firstBucket = shiftBucket(currentBucket, range, -(config.points - 1));

  return Array.from({ length: config.points }, (_, index) => {
    const date = shiftBucket(firstBucket, range, index);

    return {
      key: getBucketKey(date, range),
      label: formatBucketLabel(date, range),
      orders: 0,
      blockedOrders: 0,
      eggs: 0,
      claimedEggs: 0,
      incubatingEggs: 0,
    };
  });
}

function buildTimeSeries(orders, eggs) {
  const referenceDate = getTimeSeriesReferenceDate(orders, eggs);

  return Object.keys(TIME_SERIES_CONFIG).reduce((result, range) => {
    const points = createTimeSeriesPoints(range, referenceDate);
    const pointByKey = new Map(points.map((point) => [point.key, point]));

    orders.forEach((order) => {
      const date = getOrderActivityDate(order);

      if (!date) {
        return;
      }

      const point = pointByKey.get(getBucketKey(date, range));

      if (!point) {
        return;
      }

      point.orders += 1;

      if (normalizeStatus(order.status) !== "paid") {
        point.blockedOrders += 1;
      }
    });

    eggs.forEach((egg) => {
      const date = getEggActivityDate(egg);

      if (!date) {
        return;
      }

      const point = pointByKey.get(getBucketKey(date, range));

      if (!point) {
        return;
      }

      const status = normalizeStatus(egg.status);
      point.eggs += 1;

      if (["hatched", "claimed", "opened"].includes(status)) {
        point.claimedEggs += 1;
      }

      if (status === "incubating") {
        point.incubatingEggs += 1;
      }
    });

    result[range] = {
      label: TIME_SERIES_CONFIG[range].label,
      points,
    };

    return result;
  }, {});
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

function buildTierInventory(giftPools, giftAccounts, poolAccountMappings) {
  const accountById = new Map(giftAccounts.map((account) => [account.id, account]));
  const tierRows = new Map();

  giftPools.forEach((pool) => {
    const tier = String(pool.tier || "Unknown").toUpperCase();

    if (!tierRows.has(tier)) {
      tierRows.set(tier, {
        tier,
        pools: 0,
        totalAccounts: 0,
        availableAccounts: 0,
        usedAccounts: 0,
      });
    }

    tierRows.get(tier).pools += 1;
  });

  poolAccountMappings.forEach((mapping) => {
    const account = accountById.get(mapping.account_id);

    if (!account) {
      return;
    }

    const tier = String(account.tier || "Unknown").toUpperCase();

    if (!tierRows.has(tier)) {
      tierRows.set(tier, {
        tier,
        pools: 0,
        totalAccounts: 0,
        availableAccounts: 0,
        usedAccounts: 0,
      });
    }

    const row = tierRows.get(tier);
    row.totalAccounts += 1;

    if (normalizeStatus(account.status) === "available") {
      row.availableAccounts += 1;
      return;
    }

    row.usedAccounts += 1;
  });

  return [...tierRows.values()]
    .map((row) => ({
      ...row,
      availableRate: percent(row.availableAccounts, row.totalAccounts),
    }))
    .sort((left, right) => left.tier.localeCompare(right.tier));
}

function getProductId(product) {
  return String(
    product.kvProductId ||
      product.kv_product_id ||
      product.productId ||
      product.id ||
      ""
  ).trim();
}

function buildMappedProductIds(products, productEggMappings = []) {
  const mappedProductIds = new Set();

  products.forEach((product) => {
    const productId = getProductId(product);

    if (productId && (product.mappings || []).length) {
      mappedProductIds.add(productId);
    }
  });

  productEggMappings.forEach((mapping) => {
    const productId = getProductId(mapping);

    if (productId) {
      mappedProductIds.add(productId);
    }
  });

  return mappedProductIds;
}

function buildOperationalAlerts({
  blockedOrders,
  customers,
  giftPools,
  poolAvailableCount,
  products,
  mappedProductIds,
  readyEggs,
  totalAccounts,
  availableAccounts,
}) {
  const unmappedProducts = products.filter(
    (product) => !mappedProductIds.has(getProductId(product))
  ).length;
  const emptyPools = giftPools.filter(
    (pool) => !Number(poolAvailableCount[pool.id] || 0)
  ).length;
  const warningCustomers = customers.filter(
    (customer) =>
      normalizeStatus(customer.status).includes("warning") ||
      Number(customer.warningCount || 0) > 0 ||
      Number(customer.returnStreak || 0) === 1
  ).length;
  const bannedCustomers = customers.filter(
    (customer) =>
      normalizeStatus(customer.status).includes("banned") ||
      Number(customer.returnStreak || 0) >= 2
  ).length;
  const lowStock = totalAccounts > 0 && percent(availableAccounts, totalAccounts) < 20;

  return [
    {
      key: "ready-eggs",
      label: "Trứng sẵn sàng",
      value: readyEggs,
      tone: readyEggs ? "gold" : "green",
      note: readyEggs ? "Có thể phát quà khi khách quay lại" : "Không có trứng đang chờ mở",
    },
    {
      key: "blocked-orders",
      label: "Đơn cần chặn",
      value: blockedOrders.length,
      tone: blockedOrders.length ? "red" : "green",
      note: "Pending / Cancel / hoàn trả",
    },
    {
      key: "risk-customers",
      label: "Khách rủi ro",
      value: warningCustomers + bannedCustomers,
      tone: warningCustomers + bannedCustomers ? "red" : "green",
      note: `${warningCustomers} cảnh báo, ${bannedCustomers} bị khóa`,
    },
    {
      key: "inventory",
      label: "Kho quà trống",
      value: emptyPools,
      tone: emptyPools || lowStock ? "red" : "green",
      note: lowStock ? "Tồn kho available dưới 20%" : "Theo bể quà",
    },
    {
      key: "mapping",
      label: "Sản phẩm chưa mapping",
      value: unmappedProducts,
      tone: unmappedProducts ? "gold" : "green",
      note: "Không mapping sẽ không cấp trứng",
    },
  ];
}

// BACKEND_ADMIN_THONG_KE:
// Frontend đang tự tính analytics từ các bảng JSON.
// Backend nên tạo API, ví dụ /admin/analytics, trả về cùng shape dữ liệu để thay thế hàm này.
export function buildAdminDashboard(tables) {
  const customers = tables.customers || [];
  const orders = tables.adminOrders || [];
  const orderItems = tables.adminOrderItems || [];
  const products = tables.products || [];
  const eggs = tables.eggs || [];
  const giftPools = tables.giftPools || [];
  const giftAccounts = tables.giftAccounts || [];
  const poolAccountMappings = tables.poolAccountMappings || [];
  const productEggMappings = tables.productEggMappings || [];
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
  const readyEggs = eggs.filter(
    (egg) => egg.hatch_at && new Date(egg.hatch_at).getTime() <= now
  );
  const claimedEggs = eggs.filter((egg) =>
    ["hatched", "claimed", "opened"].includes(normalizeStatus(egg.status))
  );
  const blockedCustomers = customers.filter(
    (customer) =>
      normalizeStatus(customer.status).includes("banned") ||
      Number(customer.returnStreak || 0) >= 2
  );
  const warningCustomers = customers.filter(
    (customer) =>
      normalizeStatus(customer.status).includes("warning") ||
      Number(customer.warningCount || 0) > 0 ||
      Number(customer.returnStreak || 0) === 1
  );
  const inventoryByTier = buildTierInventory(
    giftPools,
    giftAccounts,
    poolAccountMappings
  );
  const availableAccounts = giftAccounts.filter(
    (account) => normalizeStatus(account.status) === "available"
  );
  const productMappings = productEggMappings.length
    ? productEggMappings
    : products.flatMap((product) => product.mappings || []);
  const mappedProductIds = buildMappedProductIds(products, productEggMappings);

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
      readyEggs: readyEggs.length,
      totalAccounts: giftAccounts.length,
      availableAccounts: availableAccounts.length,
    },
    analytics: {
      alerts: buildOperationalAlerts({
        blockedOrders,
        customers,
        giftPools,
        poolAvailableCount,
        products,
        mappedProductIds,
        readyEggs: readyEggs.length,
        totalAccounts: giftAccounts.length,
        availableAccounts: availableAccounts.length,
      }),
      funnel: [
        {
          label: "Đơn đồng bộ",
          value: orders.length,
          percent: 100,
        },
        {
          label: "Đơn hợp lệ",
          value: paidOrders.length,
          percent: percent(paidOrders.length, orders.length),
        },
        {
          label: "Trứng đã cấp",
          value: eggs.length,
          percent: percent(eggs.length, Math.max(paidOrders.length, 1) * 2),
        },
        {
          label: "Đang ấp",
          value: eggs.filter((egg) => normalizeStatus(egg.status) === "incubating")
            .length,
          percent: percent(
            eggs.filter((egg) => normalizeStatus(egg.status) === "incubating").length,
            eggs.length
          ),
        },
        {
          label: "Đã nhận quà",
          value: claimedEggs.length,
          percent: percent(claimedEggs.length, eggs.length),
        },
      ],
      risk: {
        warningCustomers: warningCustomers.length,
        bannedCustomers: blockedCustomers.length,
        warningRate: percent(warningCustomers.length, customers.length),
        bannedRate: percent(blockedCustomers.length, customers.length),
        blockedOrderRate: percent(blockedOrders.length, orders.length),
      },
      inventoryByTier,
      mapping: {
        mappedProducts: mappedProductIds.size,
        totalProducts: products.length,
        mappingRules: productMappings.length,
        mappedRate: percent(mappedProductIds.size, products.length),
      },
      timeSeries: buildTimeSeries(orders, eggs),
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
        title: "Đồng bộ đơn hàng",
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
