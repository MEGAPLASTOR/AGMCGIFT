export const ADMIN_ENDPOINTS = {
  customers: "/api/admin/customers",
  eggs: "/api/admin/eggs",
  giftAccounts: "/api/admin/gift-accounts",
  giftAccountsSingle: "/api/admin/gift-accounts/single",
  giftAccountsUpload: "/api/admin/gift-accounts/upload",
  giftPools: "/api/admin/gift-pools",
  giftPoolsAddAccount: "/api/admin/gift-pools/add-account",
  giftPoolsAddAccounts: "/api/admin/gift-pools/add-accounts",
  giftPoolsRemoveAccounts: "/api/admin/gift-pools/remove-accounts",
  login: "/api/admin/auth/login",
  orders: "/api/admin/orders",
  products: "/api/admin/products",
};

export function getAdminGiftPoolEndpoint(id) {
  return `${ADMIN_ENDPOINTS.giftPools}/${encodeURIComponent(id)}`;
}
