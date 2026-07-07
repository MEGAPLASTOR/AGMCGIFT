import { CUSTOMER_STATUS_OPTIONS } from "../utils/customerStatus";
import {
  DEFAULT_POOL_TIER,
  POOL_TIER_OPTIONS,
} from "../utils/poolTier";

export const orderFinancialStatusOptions = [
  { value: "paid", label: "paid" },
  { value: "pending", label: "pending" },
  { value: "refunded", label: "refunded" },
];

export const orderFulfillmentStatusOptions = [
  { value: "Chưa giao hàng", label: "Chưa giao hàng" },
  { value: "Đang giao hàng", label: "Đang giao hàng" },
  { value: "Đã giao hàng", label: "Đã giao hàng" },
  { value: "Đang chuyển hoàn", label: "Đang chuyển hoàn" },
  { value: "Đã chuyển hoàn", label: "Đã chuyển hoàn" },
  { value: "delivering", label: "delivering" },
  { value: "shipping", label: "shipping" },
  { value: "delivered", label: "delivered" },
  { value: "returned", label: "returned" },
];

export const orderStatusOptions = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Cancel", label: "Cancel" },
];

const eggTypeOptions = [
  { value: 1, label: "T1 (Nhận ngay)" },
  { value: 2, label: "T2 (Cần ấp)" },
];

export const eggStatusOptions = [
  { value: "pending", label: "PENDING" },
  { value: "claimed", label: "CLAIMED" },
  { value: "cancelled", label: "CANCELLED" },
  { value: "incubating", label: "incubating" },
  { value: "ready", label: "ready" },
  { value: "locked", label: "locked" },
  { value: "invalidated", label: "invalidated" },
];

export const accountStatusOptions = [
  { value: "available", label: "AVAILABLE" },
  { value: "assigned", label: "ASSIGNED" },
  { value: "reserved", label: "RESERVED" },
  { value: "used", label: "USED" },
];

const adminRoleOptions = [
  { value: "owner", label: "owner" },
  { value: "manager", label: "manager" },
  { value: "staff", label: "staff" },
];

const adminStatusOptions = [
  { value: "active", label: "active" },
  { value: "inactive", label: "inactive" },
];

const logActionOptions = [
  { value: "blocked", label: "blocked" },
  { value: "claim_now", label: "claim_now" },
  { value: "incubate", label: "incubate" },
];

const logTriggeredByOptions = [
  { value: "customer", label: "customer" },
  { value: "admin", label: "admin" },
  { value: "system", label: "system" },
];

const text = (key, label, extra = {}) => ({ key, label, type: "text", ...extra });
const number = (key, label, extra = {}) => ({ key, label, type: "number", ...extra });
const dateTime = (key, label, extra = {}) => ({
  key,
  label,
  type: "datetime",
  ...extra,
});
const select = (key, label, options, extra = {}) => ({
  key,
  label,
  type: "select",
  options,
  ...extra,
});

export const ADMIN_TABLES = [
  {
    key: "admins",
    label: "admins",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("username", "Tên đăng nhập", { required: true }),
      text("password_hash", "Mật khẩu hash", { required: true, wide: true }),
      text("full_name", "Họ tên"),
      select("role", "Vai trò", adminRoleOptions),
      select("status", "Trạng thái", adminStatusOptions),
      dateTime("created_at", "Ngày tạo"),
      dateTime("updated_at", "Ngày cập nhật"),
    ],
  },
  {
    key: "customers",
    label: "customers",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("customerCode", "Mã khách hàng", { required: true }),
      text("customerName", "Tên khách hàng", { wide: true }),
      select("status", "Trạng thái", CUSTOMER_STATUS_OPTIONS),
      number("successCount", "Chuỗi VIP"),
      number("returnStreak", "Chuỗi hoàn hàng"),
      number("returnCount", "Tổng hoàn/hủy"),
      number("warningCount", "Số cảnh báo"),
      dateTime("unbanAt", "Mở lại lúc", { nullable: true }),
      dateTime("createdAt", "Ngày tạo"),
      dateTime("updatedAt", "Ngày cập nhật"),
    ],
  },
  {
    key: "adminOrders",
    label: "orders",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("order_code", "Mã đơn hàng", { required: true }),
      text("source_name", "Nguồn đơn"),
      number("total_price", "Tổng tiền"),
      select("financial_status", "Thanh toán", orderFinancialStatusOptions),
      select("fulfillment_status", "Giao hàng", orderFulfillmentStatusOptions),
      select("status", "Trạng thái nhận quà", orderStatusOptions),
      dateTime("created_at", "Ngày tạo"),
      dateTime("updated_at", "Ngày cập nhật"),
      dateTime("delivered_at", "Ngày giao thành công", { nullable: true }),
      dateTime("last_synced_at", "Đồng bộ cuối", { nullable: true }),
    ],
  },
  {
    key: "adminOrderItems",
    label: "order_items",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("order_id", "ID đơn hàng", { required: true }),
      text("kv_product_id", "ID sản phẩm AGMC"),
      text("kv_variant_id", "ID biến thể AGMC"),
      text("product_name", "Tên sản phẩm", { wide: true }),
      text("sku", "SKU"),
      number("quantity", "Số lượng"),
    ],
  },
  {
    key: "products",
    label: "products",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("kvProductId", "ID sản phẩm AGMC"),
      text("name", "Tên sản phẩm"),
      text("fullName", "Tên đầy đủ", { wide: true }),
      number("basePrice", "Giá gốc"),
      text("imageUrl", "Ảnh", { wide: true }),
      dateTime("lastSyncedAt", "Đồng bộ cuối"),
    ],
  },
  {
    key: "eggs",
    label: "eggs",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("order_id", "ID đơn hàng", { required: true }),
      text("account_id", "ID tài khoản", { nullable: true }),
      text("gift_pool_id", "ID kho quà", { required: true }),
      select("egg_type", "Loại trứng", eggTypeOptions, {
        valueType: "number",
      }),
      select("status", "Trạng thái trứng", eggStatusOptions),
      dateTime("hatch_at", "Giờ nở trứng", { nullable: true }),
      dateTime("created_at", "Ngày tạo"),
      dateTime("updated_at", "Ngày cập nhật"),
    ],
  },
  {
    key: "productEggMappings",
    label: "product_egg_mappings",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("kv_product_id", "ID sản phẩm AGMC", { required: true }),
      text("kv_variant_id", "ID biến thể AGMC"),
      select("egg_type", "Loại trứng", eggTypeOptions, {
        valueType: "number",
      }),
      text("gift_pool_id", "ID kho quà", { required: true }),
      select("egg_tier", "Hạng quà", POOL_TIER_OPTIONS),
      dateTime("created_at", "Ngày tạo"),
      dateTime("updated_at", "Ngày cập nhật"),
    ],
  },
  {
    key: "giftPools",
    label: "gift_pools",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("pool_name", "Tên kho quà", { required: true, wide: true }),
      select("tier", "Hạng kho", POOL_TIER_OPTIONS),
      dateTime("created_at", "Ngày tạo"),
    ],
  },
  {
    key: "giftAccounts",
    label: "gift_accounts",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("username", "Tên tài khoản", { required: true }),
      text("password", "Mật khẩu", { required: true }),
      select("tier", "Tier", POOL_TIER_OPTIONS, { defaultValue: DEFAULT_POOL_TIER }),
      select("status", "Trạng thái", accountStatusOptions),
      text("platform", "Nền tảng", { defaultValue: "blox-fruit" }),
      text("token", "Token", { wide: true }),
      dateTime("created_at", "Ngày tạo"),
      dateTime("assigned_at", "Ngày gán", { nullable: true }),
    ],
  },
  {
    key: "poolAccountMappings",
    label: "pool_account_mappings",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("pool_id", "ID kho quà", { required: true }),
      text("account_id", "ID tài khoản", { required: true }),
    ],
  },
  {
    key: "eggOpeningLogs",
    label: "egg_opening_logs",
    idField: "id",
    fields: [
      text("id", "ID", { required: true, wide: true }),
      text("egg_id", "ID trứng", { required: true }),
      text("account_id", "ID tài khoản", { nullable: true }),
      select("action_type", "Hành động", logActionOptions),
      select("triggered_by", "Người thực hiện", logTriggeredByOptions),
      text("ip_address", "Địa chỉ IP"),
      dateTime("created_at", "Ngày tạo"),
    ],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

function fromDateTimeInputValue(value, nullable) {
  if (!value) {
    return nullable ? null : "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function getEmptyValue(field) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.nullable) {
    return null;
  }

  if (field.type === "number") {
    return 0;
  }

  if (field.type === "select") {
    return field.options?.[0]?.value || "";
  }

  return "";
}

function createDatabaseId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createAdminTableState(sourceTables) {
  const state = {};

  ADMIN_TABLES.forEach((table) => {
    state[table.key] = clone(sourceTables[table.key] || []);
  });

  return {
    ...sourceTables,
    ...state,
  };
}

export function getTableConfig(tableKey) {
  return ADMIN_TABLES.find((table) => table.key === tableKey) || ADMIN_TABLES[0];
}

export function getTableFields(tableKey) {
  return getTableConfig(tableKey).fields || [];
}

export function getRecordId(record, tableKey) {
  const table = getTableConfig(tableKey);
  return record?.[table.idField];
}

export function createEmptyRecord(tableKey) {
  const table = getTableConfig(tableKey);
  const timestamp = new Date().toISOString();
  const record = {};

  getTableFields(tableKey).forEach((field) => {
    record[field.key] = getEmptyValue(field);
  });

  record[table.idField] = createDatabaseId();

  if ("created_at" in record) {
    record.created_at = timestamp;
  }

  if ("updated_at" in record) {
    record.updated_at = timestamp;
  }

  return record;
}

export function normalizeRecordForForm(record, tableKey) {
  const formValues = {};

  getTableFields(tableKey).forEach((field) => {
    const value = record?.[field.key] ?? getEmptyValue(field);
    formValues[field.key] =
      field.type === "datetime" ? toDateTimeInputValue(value) : String(value ?? "");
  });

  return formValues;
}

export function buildRecordFromForm(formValues, tableKey) {
  const record = {};

  getTableFields(tableKey).forEach((field) => {
    const rawValue = formValues[field.key] ?? "";
    const stringValue = String(rawValue).trim();

    if (field.required && !stringValue) {
      throw new Error(`Vui lòng nhập ${field.label}.`);
    }

    if (field.type === "number") {
      const numberValue = Number(rawValue);

      if (Number.isNaN(numberValue)) {
        throw new Error(`${field.label} phải là số.`);
      }

      record[field.key] = numberValue;
      return;
    }

    if (field.type === "datetime") {
      record[field.key] = fromDateTimeInputValue(rawValue, field.nullable);
      return;
    }

    if (field.type === "select" && field.valueType === "number") {
      record[field.key] = Number(rawValue);
      return;
    }

    record[field.key] = field.nullable && !stringValue ? null : rawValue;
  });

  if ("updated_at" in record) {
    record.updated_at = new Date().toISOString();
  }

  return record;
}

export function searchTableRows(rows, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return rows;
  }

  return rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(normalizedKeyword)
  );
}

export function mergeSelectOptions(options = [], values = [], getLabel) {
  const map = new Map();

  options.forEach((option) => {
    const value = String(option?.value ?? "").trim();

    if (!value) {
      return;
    }

    map.set(value.toLowerCase(), {
      value: option.value,
      label: option.label ?? value,
    });
  });

  values.forEach((rawValue) => {
    const value = String(rawValue ?? "").trim();

    if (!value || map.has(value.toLowerCase())) {
      return;
    }

    map.set(value.toLowerCase(), {
      value,
      label: getLabel ? getLabel(value) : value,
    });
  });

  return [...map.values()];
}

export function getVisibleColumns(rows) {
  const columns = new Set();

  rows.slice(0, 12).forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });

  return [...columns].slice(0, 7);
}
