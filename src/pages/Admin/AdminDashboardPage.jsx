import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBoxesStacked,
  FaKey,
  FaRightFromBracket,
  FaRotateRight,
} from "react-icons/fa6";
import { AdminAnalyticsPanel } from "../../components/admin/AdminAnalyticsPanel";
import { AdminDataCrudPanel } from "../../components/admin/AdminDataCrudPanel";
import { AdminLoginPanel } from "../../components/admin/AdminLoginPanel";
import { AdminMetricCard } from "../../components/admin/AdminMetricCard";
import { AdminPasswordPanel } from "../../components/admin/AdminPasswordPanel";
import { giftCatalogData } from "../../config/giftCatalogData";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAdminDataTables } from "../../hooks/useAdminDataTables";
import {
  buildAdminDashboard,
  formatCurrency,
} from "../../services/adminDashboardService";
import { updateAdminCredentials } from "../../services/adminAuthService";
import { updateAdminCustomerStatus } from "../../services/adminCustomerService";
import {
  createAdminGiftAccount,
  deleteAdminGiftAccount,
  updateAdminGiftAccount,
  uploadAdminGiftAccounts,
} from "../../services/adminGiftAccountService";
import {
  addAdminGiftPoolAccounts,
  createAdminGiftPool,
  deleteAdminGiftPool,
  removeAdminGiftPoolAccounts,
  updateAdminGiftPool,
} from "../../services/adminGiftPoolService";
import {
  deleteAdminProductEggMapping,
  linkAdminProductEggMapping,
} from "../../services/adminProductEggMappingService";
import { syncAllAdminProducts } from "../../services/adminProductService";

const ADMIN_BASE_PATH = "/agmcmyadmin";

const MANAGEMENT_PAGES = [
  {
    slug: "accounts",
    tableKey: "giftAccounts",
    label: "Kho account",
    title: "Quản lý kho account",
    description: "Tạo account, upload Excel, sửa trạng thái và quản lý tồn kho quà.",
  },
  {
    slug: "pools",
    tableKey: "giftPools",
    label: "Bể quà",
    title: "Quản lý bể quà",
    description: "Tạo bể quà, chỉnh tier và chuẩn bị nguồn account theo hạng.",
  },
  {
    slug: "egg-mappings",
    tableKey: "productEggMappings",
    label: "Mapping trứng",
    title: "Quản lý mapping trứng",
    description: "Liên kết sản phẩm KiotViet với loại trứng và bể quà phát thưởng.",
  },
  {
    slug: "pool-accounts",
    tableKey: "poolAccountMappings",
    label: "Gán account",
    title: "Quản lý gán account",
    description: "Gắn hoặc gỡ account vào từng bể quà để backend có nguồn phát thưởng.",
  },
  {
    slug: "customers",
    tableKey: "customers",
    label: "Khách hàng",
    title: "Quản lý khách hàng",
    description: "Theo dõi trạng thái, đơn thành công, cảnh báo và return streak.",
  },
  {
    slug: "eggs",
    tableKey: "eggs",
    label: "Trứng",
    title: "Quản lý trứng",
    description: "Kiểm tra loại trứng, trạng thái ấp, thời gian mở và tài khoản được cấp.",
  },
  {
    slug: "products",
    tableKey: "products",
    label: "Sản phẩm",
    title: "Quản lý sản phẩm",
    description: "Xem sản phẩm đã đồng bộ từ KiotViet và đối chiếu mapping phát trứng.",
  },
  {
    slug: "orders",
    tableKey: "kiotvietOrders",
    label: "Đơn hàng",
    title: "Quản lý đơn hàng",
    description: "Kiểm tra đơn KiotViet, trạng thái thanh toán, giao hàng và điều kiện nhận quà.",
  },
];

const MANAGEMENT_PAGE_BY_TABLE = new Map(
  MANAGEMENT_PAGES.map((page) => [page.tableKey, page])
);
const MANAGEMENT_TABLE_KEYS = MANAGEMENT_PAGES.map((page) => page.tableKey);

function getAdminPath(slug = "") {
  return slug ? `${ADMIN_BASE_PATH}/${slug}` : ADMIN_BASE_PATH;
}

function getActiveSlug(pathname) {
  return pathname
    .replace(ADMIN_BASE_PATH, "")
    .replace(/^\/+/, "")
    .split("/")[0];
}

function AdminManagementNav({ activeSlug, tableCounts }) {
  const overviewActive = !activeSlug;

  return (
    <nav className="admin-management-nav" aria-label="Điều hướng quản trị">
      <Link className={overviewActive ? "is-active" : ""} to={getAdminPath()}>
        <span>Tổng quan</span>
        <strong>Analytics</strong>
      </Link>
      {MANAGEMENT_PAGES.map((page) => (
        <Link
          className={activeSlug === page.slug ? "is-active" : ""}
          key={page.slug}
          to={getAdminPath(page.slug)}
        >
          <span>{page.label}</span>
          <strong>{tableCounts[page.tableKey] || 0}</strong>
        </Link>
      ))}
    </nav>
  );
}

function hasMetricValue(value) {
  return Number(value) > 0;
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function findGiftAccountRow(tables, record) {
  const username = normalizeComparable(record.username);
  const platform = normalizeComparable(record.platform || "blox-fruit");
  const tier = normalizeComparable(record.tier);

  return (tables.giftAccounts || []).find(
    (account) =>
      normalizeComparable(account.username) === username &&
      normalizeComparable(account.platform || "blox-fruit") === platform &&
      (!tier || normalizeComparable(account.tier) === tier)
  );
}

function findProductEggMappingRow(tables, record) {
  const productId = normalizeComparable(
    record.kv_product_id || record.kvProductId || record.productId
  );
  const poolId = normalizeComparable(
    record.gift_pool_id || record.pool_id || record.poolId
  );
  const eggType = Number(record.egg_type || record.eggType);

  return (tables.productEggMappings || []).find(
    (mapping) =>
      normalizeComparable(mapping.kv_product_id) === productId &&
      normalizeComparable(mapping.gift_pool_id) === poolId &&
      Number(mapping.egg_type) === eggType
  );
}

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const adminTables = useAdminDataTables(giftCatalogData);
  const { loadRawTables } = adminTables;
  const { admin, error, handleAuthError, isLoggingIn, login, logout } =
    useAdminAuth(adminTables.tables);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const dashboard = buildAdminDashboard(adminTables.tables);
  const activeSlug = getActiveSlug(location.pathname);
  const activeManagementPage = MANAGEMENT_PAGES.find(
    (page) => page.slug === activeSlug
  );
  const isOverviewPage = !activeSlug || !activeManagementPage;
  const visibleMetrics = [
    {
      label: "Khách hàng",
      value: dashboard.summary.totalCustomers,
      note: `${dashboard.summary.warningCustomers} cảnh báo`,
      tone: "blue",
    },
    {
      label: "Tổng đơn KiotViet",
      value: dashboard.summary.totalOrders,
      note: "orders raw",
      tone: "blue",
    },
    {
      label: "Đơn Paid",
      value: dashboard.summary.paidOrders,
      note: "được nhập mã",
      tone: "green",
    },
    {
      label: "Đơn bị chặn",
      value: dashboard.summary.blockedOrders,
      note: "Pending / Cancel",
      tone: "red",
    },
    {
      label: "Doanh thu Paid",
      value: formatCurrency(dashboard.summary.totalRevenue),
      rawValue: dashboard.summary.totalRevenue,
      note: "financial_status paid",
      tone: "gold",
    },
    {
      label: "Sản phẩm",
      value: dashboard.summary.totalProducts,
      note: "products raw",
      tone: "blue",
    },
    {
      label: "Tổng trứng",
      value: dashboard.summary.totalEggs,
      note: `${dashboard.summary.readyEggs} sẵn sàng`,
      tone: "purple",
    },
    {
      label: "Trứng đang ấp",
      value: dashboard.summary.hatchingEggs,
      note: "status incubating",
      tone: "purple",
    },
    {
      label: "Acc available",
      value: dashboard.summary.availableAccounts,
      note: `${dashboard.summary.totalAccounts} total`,
      tone: "green",
    },
  ].filter((metric) => hasMetricValue(metric.rawValue ?? metric.value));

  useEffect(() => {
    if (activeSlug && !activeManagementPage) {
      navigate(getAdminPath(), { replace: true });
    }
  }, [activeManagementPage, activeSlug, navigate]);

  useEffect(() => {
    if (!admin?.authHeader) {
      return;
    }

    loadRawTables(admin.authHeader).then(handleAuthError).catch((loadError) => {
      handleAuthError(loadError);
      // The hook stores a user-facing error message.
    });
  }, [admin?.authHeader, handleAuthError, loadRawTables]);

  const handleReloadRawData = () => {
    if (!admin?.authHeader || adminTables.isLoadingRawData) {
      return;
    }

    loadRawTables(admin.authHeader).then(handleAuthError).catch((loadError) => {
      handleAuthError(loadError);
      // The hook stores a user-facing error message.
    });
  };

  const handleSyncProducts = async () => {
    if (!admin?.authHeader || isSyncingProducts) {
      return;
    }

    setIsSyncingProducts(true);

    try {
      await syncAllAdminProducts(admin.authHeader);
      const result = await loadRawTables(admin.authHeader);
      handleAuthError(result);
    } catch (syncError) {
      handleAuthError(syncError);
    } finally {
      setIsSyncingProducts(false);
    }
  };

  const handleChangeAdminCredentials = async ({
    currentPassword,
    newUsername,
    newPassword,
  }) => {
    try {
      await updateAdminCredentials(
        {
          oldPassword: currentPassword,
          newUsername,
          newPassword,
        },
        admin.authHeader
      );

      return { ok: true, message: "Đã cập nhật thông tin đăng nhập admin." };
    } catch (changeError) {
      handleAuthError(changeError);
      throw changeError;
    }
  };

  const handleCreateGiftAccount = async (record) => {
    try {
      const payload = await createAdminGiftAccount(record, admin.authHeader);
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);

      return (
        findGiftAccountRow(rawTables, record) ||
        payload?.data ||
        payload?.account ||
        payload?.giftAccount ||
        payload
      );
    } catch (createError) {
      handleAuthError(createError);
      throw createError;
    }
  };

  const handleUpdateGiftAccount = async (record, id) => {
    try {
      return await updateAdminGiftAccount(id, record, admin.authHeader);
    } catch (updateError) {
      handleAuthError(updateError);
      throw updateError;
    }
  };

  const handleDeleteGiftAccount = async (id) => {
    try {
      return await deleteAdminGiftAccount(id, admin.authHeader);
    } catch (deleteError) {
      handleAuthError(deleteError);
      throw deleteError;
    }
  };

  const handleUploadGiftAccounts = async (file) => {
    try {
      const payload = await uploadAdminGiftAccounts(file, admin.authHeader);
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);

      return payload;
    } catch (uploadError) {
      handleAuthError(uploadError);
      throw uploadError;
    }
  };

  const handleCreateGiftPool = async (record) => {
    try {
      return await createAdminGiftPool(record, admin.authHeader);
    } catch (createError) {
      handleAuthError(createError);
      throw createError;
    }
  };

  const handleUpdateGiftPool = async (record, id) => {
    try {
      return await updateAdminGiftPool(id, record, admin.authHeader);
    } catch (updateError) {
      handleAuthError(updateError);
      throw updateError;
    }
  };

  const handleDeleteGiftPool = async (id) => {
    try {
      return await deleteAdminGiftPool(id, admin.authHeader);
    } catch (deleteError) {
      handleAuthError(deleteError);
      throw deleteError;
    }
  };

  const handleAddPoolAccount = async (record) => {
    try {
      const mappings = await addAdminGiftPoolAccounts(record, admin.authHeader);

      return mappings.length === 1 ? mappings[0] : mappings;
    } catch (addError) {
      handleAuthError(addError);
      throw addError;
    }
  };

  const handleRemovePoolAccount = async (record) => {
    try {
      const removedMappings = await removeAdminGiftPoolAccounts(
        record,
        admin.authHeader
      );

      return removedMappings[0] || record;
    } catch (removeError) {
      handleAuthError(removeError);
      throw removeError;
    }
  };

  const handleUpdateCustomerStatus = async (record) => {
    try {
      return await updateAdminCustomerStatus(
        record.customerCode,
        record,
        admin.authHeader
      );
    } catch (updateError) {
      handleAuthError(updateError);
      throw updateError;
    }
  };

  const handleSaveProductEggMapping = async (record) => {
    try {
      const fallbackMapping = await linkAdminProductEggMapping(
        record,
        admin.authHeader
      );
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);

      return findProductEggMappingRow(rawTables, fallbackMapping) || fallbackMapping;
    } catch (mappingError) {
      handleAuthError(mappingError);
      throw mappingError;
    }
  };

  const handleDeleteProductEggMapping = async (id) => {
    try {
      return await deleteAdminProductEggMapping(id, admin.authHeader);
    } catch (deleteError) {
      handleAuthError(deleteError);
      throw deleteError;
    }
  };

  const handleManagementTableChange = (nextTableKey) => {
    const nextPage = MANAGEMENT_PAGE_BY_TABLE.get(nextTableKey);

    if (nextPage) {
      navigate(getAdminPath(nextPage.slug));
    }
  };

  if (!admin) {
    return (
      <main className="admin-page admin-page--login">
        <AdminLoginPanel
          error={error}
          isLoading={isLoggingIn}
          onLogin={login}
        />
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">AGMC KiotViet Admin</p>
          <h1>Dashboard vận hành KiotViet</h1>
          <span>
            Đăng nhập: {admin.full_name} / {admin.role}
          </span>
        </div>
        <div className="admin-header__actions">
          <button
            type="button"
            className="admin-light-button"
            disabled={adminTables.isLoadingRawData}
            onClick={handleReloadRawData}
          >
            <FaRotateRight aria-hidden="true" />
            {adminTables.isLoadingRawData ? "Đang tải dữ liệu" : "Tải lại dữ liệu"}
          </button>
          <button
            type="button"
            className="admin-light-button"
            disabled={isSyncingProducts || adminTables.isLoadingRawData}
            onClick={handleSyncProducts}
          >
            <FaBoxesStacked aria-hidden="true" />
            {isSyncingProducts ? "Đang đồng bộ sản phẩm" : "Đồng bộ sản phẩm"}
          </button>
          <button
            type="button"
            className="admin-light-button"
            onClick={() => setPasswordModalOpen(true)}
          >
            <FaKey aria-hidden="true" />
            Đổi mật khẩu
          </button>
          <button type="button" onClick={logout}>
            <FaRightFromBracket aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </header>

      {isPasswordModalOpen ? (
        <AdminPasswordPanel
          admin={admin}
          onChangePassword={handleChangeAdminCredentials}
          onClose={() => setPasswordModalOpen(false)}
        />
      ) : null}

      {adminTables.isLoadingRawData || adminTables.rawDataError ? (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Dữ liệu raw database</h2>
              <span>
                {adminTables.isLoadingRawData
                  ? "Đang tải từ API raw"
                  : adminTables.rawDataError}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <AdminManagementNav
        activeSlug={isOverviewPage ? "" : activeManagementPage.slug}
        tableCounts={adminTables.tableCounts}
      />

      {isOverviewPage ? (
        <>
          {visibleMetrics.length ? (
            <section className="admin-metric-grid">
              {visibleMetrics.map((metric) => (
                <AdminMetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  note={metric.note}
                  tone={metric.tone}
                />
              ))}
            </section>
          ) : null}

          <AdminAnalyticsPanel analytics={dashboard.analytics} />
        </>
      ) : (
        <AdminDataCrudPanel
          activeTableKey={activeManagementPage.tableKey}
          panelTitle={activeManagementPage.title}
          panelDescription={activeManagementPage.description}
          allowedTableKeys={MANAGEMENT_TABLE_KEYS}
          tables={adminTables.tables}
          tableCounts={adminTables.tableCounts}
          onTableChange={handleManagementTableChange}
          onSaveRecord={adminTables.upsertRecord}
          onDeleteRecord={adminTables.deleteRecord}
          onCreateGiftAccount={handleCreateGiftAccount}
          onUpdateGiftAccount={handleUpdateGiftAccount}
          onDeleteGiftAccount={handleDeleteGiftAccount}
          onCreateGiftPool={handleCreateGiftPool}
          onUpdateGiftPool={handleUpdateGiftPool}
          onDeleteGiftPool={handleDeleteGiftPool}
          onAddPoolAccount={handleAddPoolAccount}
          onRemovePoolAccount={handleRemovePoolAccount}
          onUpdateCustomerStatus={handleUpdateCustomerStatus}
          onSaveProductEggMapping={handleSaveProductEggMapping}
          onDeleteProductEggMapping={handleDeleteProductEggMapping}
          onImportGiftAccounts={adminTables.importGiftAccounts}
          onUploadGiftAccounts={handleUploadGiftAccounts}
          onResetTables={adminTables.resetTables}
        />
      )}
    </main>
  );
}
