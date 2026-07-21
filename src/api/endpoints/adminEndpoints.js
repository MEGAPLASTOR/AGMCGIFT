export const ADMIN_ENDPOINTS = {
  authCredentials: "/api/admin/auth/credentials",
  customers: "/api/admin/customers",
  eggs: "/api/admin/eggs",
  eggsEarlyHatchEligible: "/api/admin/eggs/early-hatch/eligible",
  giftAccounts: "/api/admin/gift-accounts",
  giftAccountsBatchDelete: "/api/admin/gift-accounts/batch-delete",
  giftAccountsSingle: "/api/admin/gift-accounts/single",
  giftAccountsUpload: "/api/admin/gift-accounts/upload",
  giftPools: "/api/admin/gift-pools",
  giftPoolsAddAccount: "/api/admin/gift-pools/add-account",
  giftPoolsAddAccounts: "/api/admin/gift-pools/add-accounts",
  giftPoolsRemoveAccounts: "/api/admin/gift-pools/remove-accounts",
  login: "/api/admin/auth/login",
  orders: "/api/admin/orders",
  productEggMappings: "/api/admin/product-egg-mappings",
  productEggMappingsBatchDelete: "/api/admin/product-egg-mappings/batch-delete",
  products: "/api/admin/products",
  productsSyncAll: "/api/admin/products/sync/all",
  systemConfigs: "/api/admin/system-configs",
};

export function getAdminGiftPoolEndpoint(id) {
  return `${ADMIN_ENDPOINTS.giftPools}/${encodeURIComponent(id)}`;
}

export function getAdminGiftAccountEndpoint(id) {
  return `${ADMIN_ENDPOINTS.giftAccounts}/${encodeURIComponent(id)}`;
}

export function getAdminCustomerStatusEndpoint(customerCode) {
  return `${ADMIN_ENDPOINTS.customers}/${encodeURIComponent(customerCode)}/status`;
}

export function getAdminProductEggMappingEndpoint(id) {
  return `${ADMIN_ENDPOINTS.productEggMappings}/${encodeURIComponent(id)}`;
}

export function getAdminProductEggMappingRatesEndpoint(productId) {
  return `${ADMIN_ENDPOINTS.productEggMappings}/products/${encodeURIComponent(
    productId
  )}/rates`;
}

export function getAdminProductEggQuantitiesEndpoint(productId) {
  return `${ADMIN_ENDPOINTS.products}/${encodeURIComponent(productId)}/egg-quantities`;
}

export function getAdminEggHatchTimeEndpoint(id) {
  return `${ADMIN_ENDPOINTS.eggs}/${encodeURIComponent(id)}/hatch-time`;
}

export function getAdminEggEarlyHatchApprovalEndpoint(id) {
  return `${ADMIN_ENDPOINTS.eggs}/${encodeURIComponent(id)}/reduce-hatch-time-manual`;
}
