import adminsData from "../test-Data/admins.json";
import eggOpeningLogsData from "../test-Data/egg-opening-logs.json";
import eggsData from "../test-Data/eggs.json";
import giftAccountsData from "../test-Data/gift-accounts.json";
import giftPoolsData from "../test-Data/gift-pools.json";
import poolAccountMappingsData from "../test-Data/pool-account-mappings.json";
import productEggMappingsData from "../test-Data/product-egg-mappings.json";
import rewardConfig from "../test-Data/reward-config.json";
import sapoOrderItemsData from "../test-Data/sapo-order-items.json";
import sapoOrdersData from "../test-Data/sapo-orders.json";

// SAPO_BACKEND_NGUON_DU_LIEU:
// Đây là nguồn dữ liệu raw cho frontend, đang import trực tiếp từ các file JSON.
// Khi backend xong, thay các mảng JSON này bằng dữ liệu trả về từ API/SAPO/MySQL.
export const giftCatalogData = {
  config: rewardConfig,
  admins: adminsData,
  sapoOrders: sapoOrdersData,
  sapoOrderItems: sapoOrderItemsData,
  eggs: eggsData,
  productEggMappings: productEggMappingsData,
  giftPools: giftPoolsData,
  giftAccounts: giftAccountsData,
  poolAccountMappings: poolAccountMappingsData,
  eggOpeningLogs: eggOpeningLogsData,
};
