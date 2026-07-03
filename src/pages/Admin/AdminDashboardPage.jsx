import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBolt,
  FaBoxOpen,
  FaBoxesStacked,
  FaCartShopping,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaCube,
  FaEgg,
  FaKey,
  FaLayerGroup,
  FaLink,
  FaRightFromBracket,
  FaRotateRight,
  FaUserGroup,
} from "react-icons/fa6";
import { AdminAnalyticsPanel } from "../../components/admin/AdminAnalyticsPanel";
import { AdminDataCrudPanel } from "../../components/admin/AdminDataCrudPanel";
import { AdminEarlyHatchPanel } from "../../components/admin/AdminEarlyHatchPanel";
import { AdminLoginPanel } from "../../components/admin/AdminLoginPanel";
import { AdminPasswordPanel } from "../../components/admin/AdminPasswordPanel";
import { showAdminAlert } from "../../services/adminBrowserFeedback";
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
  approveAdminEarlyHatch,
  fetchAdminEarlyHatchEligible,
  updateAdminEggHatchTime,
} from "../../services/adminEggService";
import {
  createAdminGiftAccount,
  deleteAdminGiftAccounts,
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
  updateAdminProductEggMappingRates,
} from "../../services/adminProductEggMappingService";
import { syncAllAdminProducts } from "../../services/adminProductService";

const ADMIN_BASE_PATH = "/agmcmyadmin";
const ADMIN_OVERVIEW_REFRESH_INTERVAL_MS = 10000;

const MANAGEMENT_PAGES = [
  {
    slug: "accounts",
    tableKey: "giftAccounts",
    icon: FaBoxOpen,
    label: "Kho account",
    title: "Quản lý kho account",
    description: "Tạo account, upload Excel, sửa trạng thái và quản lý tồn kho quà.",
  },
  {
    slug: "pools",
    tableKey: "giftPools",
    icon: FaLayerGroup,
    label: "Bể quà",
    title: "Quản lý bể quà",
    description: "Tạo bể quà, chỉnh tier và chuẩn bị nguồn account theo hạng.",
  },
  {
    slug: "egg-mappings",
    tableKey: "productEggMappings",
    icon: FaLink,
    label: "Mapping trứng",
    title: "Quản lý mapping trứng",
    description: "Liên kết sản phẩm AGMC với loại trứng và bể quà phát thưởng.",
  },
  {
    slug: "customers",
    tableKey: "customers",
    icon: FaUserGroup,
    label: "Khách hàng",
    title: "Quản lý khách hàng",
    description: "Theo dõi trạng thái, đơn thành công, cảnh báo và return streak.",
  },
  {
    slug: "eggs",
    tableKey: "eggs",
    icon: FaEgg,
    label: "Trứng",
    title: "Quản lý trứng",
    description: "Kiểm tra loại trứng, trạng thái ấp, thời gian mở và tài khoản được cấp.",
  },
  {
    slug: "early-hatch",
    icon: FaBolt,
    label: "Duyệt sớm",
    title: "Duyệt Trứng Sớm",
    description: "Duyệt giảm 3 ngày ấp cho trứng đủ điều kiện.",
    badgeLabel: "API",
    isCustom: true,
  },
  {
    slug: "products",
    tableKey: "products",
    icon: FaCube,
    label: "Sản phẩm",
    title: "Quản lý sản phẩm",
    description: "Xem sản phẩm đã đồng bộ từ hệ thống AGMC và đối chiếu mapping phát trứng.",
  },
  {
    slug: "orders",
    tableKey: "adminOrders",
    icon: FaCartShopping,
    label: "Đơn hàng",
    title: "Quản lý đơn hàng",
    description: "Kiểm tra đơn hàng gift code, trạng thái thanh toán, giao hàng và điều kiện nhận quà.",
  },
].filter((page) => page.slug !== "egg-mappings");

const MANAGEMENT_TABLE_KEYS = MANAGEMENT_PAGES.map((page) => page.tableKey).filter(Boolean);

function getAdminPath(slug = "") {
  return slug ? `${ADMIN_BASE_PATH}/${slug}` : ADMIN_BASE_PATH;
}

function getActiveSlug(pathname) {
  return pathname
    .replace(ADMIN_BASE_PATH, "")
    .replace(/^\/+/, "")
    .split("/")[0];
}

function shouldCollapseAdminNav() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 900px)").matches
  );
}

function AdminManagementNav({ activeSlug, onNavigate, tableCounts }) {
  const overviewActive = !activeSlug;

  return (
    <nav
      className="admin-management-nav"
      id="admin-management-nav"
      aria-label="Dieu huong quan tri"
    >
      <Link
        className={overviewActive ? "is-active" : ""}
        title="Tong quan"
        to={getAdminPath()}
        onClick={onNavigate}
      >
        <FaChartLine className="admin-management-nav__icon" aria-hidden="true" />
        <span>Tổng quan</span>
        <strong>Analytics</strong>
      </Link>
      {MANAGEMENT_PAGES.map((page) => {
        const Icon = page.icon;

        return (
          <Link
            className={activeSlug === page.slug ? "is-active" : ""}
            key={page.slug}
            title={page.label}
            to={getAdminPath(page.slug)}
            onClick={onNavigate}
          >
            <Icon className="admin-management-nav__icon" aria-hidden="true" />
            <span>{page.label}</span>
            <strong>{page.badgeLabel || tableCounts[page.tableKey] || 0}</strong>
          </Link>
        );
      })}
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
  const mappingsType = normalizeComparable(
    record.mappingsType || record.mappings_type || record.eggType || record.egg_type || 1
  );

  return (tables.productEggMappings || []).find(
    (mapping) =>
      normalizeComparable(mapping.kv_product_id) === productId &&
      normalizeComparable(mapping.gift_pool_id) === poolId &&
      normalizeComparable(
        mapping.mappingsType || mapping.mappings_type || mapping.egg_type || 1
      ) === mappingsType
  );
}

function findProductEggMappingRows(tables, productId) {
  const normalizedProductId = normalizeComparable(productId);

  return (tables.productEggMappings || []).filter(
    (mapping) => normalizeComparable(mapping.kv_product_id) === normalizedProductId
  );
}

function findEggRow(tables, eggId) {
  return (tables.eggs || []).find((egg) => normalizeComparable(egg.id) === normalizeComparable(eggId));
}

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const adminTables = useAdminDataTables(giftCatalogData);
  const { loadRawTables } = adminTables;
  const { admin, error, handleAuthError, isLoggingIn, login, logout } =
    useAdminAuth(adminTables.tables);
  const [isNavCollapsed, setNavCollapsed] = useState(shouldCollapseAdminNav);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const isAutoRefreshingRawData = useRef(false);
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
      label: "Tổng đơn gift code",
      value: dashboard.summary.totalOrders,
      note: "đơn đã tải",
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
      note: "sản phẩm đã tải",
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
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const syncNavState = () => setNavCollapsed(mediaQuery.matches);

    syncNavState();
    mediaQuery.addEventListener("change", syncNavState);

    return () => mediaQuery.removeEventListener("change", syncNavState);
  }, []);

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

  useEffect(() => {
    if (!admin?.authHeader || !isOverviewPage) {
      return undefined;
    }

    const refreshOverviewData = () => {
      if (adminTables.isLoadingRawData || isAutoRefreshingRawData.current) {
        return;
      }

      isAutoRefreshingRawData.current = true;
      loadRawTables(admin.authHeader, { silent: true })
        .then(handleAuthError)
        .catch((loadError) => {
          handleAuthError(loadError);
        })
        .finally(() => {
          isAutoRefreshingRawData.current = false;
        });
    };

    const intervalId = window.setInterval(
      refreshOverviewData,
      ADMIN_OVERVIEW_REFRESH_INTERVAL_MS
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    admin?.authHeader,
    adminTables.isLoadingRawData,
    handleAuthError,
    isOverviewPage,
    loadRawTables,
  ]);

  useEffect(() => {
    if (!adminTables.rawDataError) {
      return;
    }

    showAdminAlert(adminTables.rawDataError);
  }, [adminTables.rawDataError]);

  const handleToggleAdminNav = () => {
    setNavCollapsed((currentValue) => !currentValue);
  };

  const handleCloseAdminNav = () => {
    setNavCollapsed(true);
  };

  const handleAdminNavNavigate = () => {
    if (shouldCollapseAdminNav()) {
      handleCloseAdminNav();
    }
  };

  const handleReloadRawData = () => {
    if (
      !admin?.authHeader ||
      adminTables.isLoadingRawData ||
      isAutoRefreshingRawData.current
    ) {
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
      return Array.isArray(id)
        ? await deleteAdminGiftAccounts(id, admin.authHeader)
        : await deleteAdminGiftAccount(id, admin.authHeader);
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

  const handleUpdateProductEggMappingRates = async (productId, mappings) => {
    try {
      await updateAdminProductEggMappingRates(
        productId,
        mappings,
        admin.authHeader
      );
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);

      return findProductEggMappingRows(rawTables, productId);
    } catch (updateError) {
      handleAuthError(updateError);
      throw updateError;
    }
  };

  const handleUpdateEggHatchTime = async (eggId, hatchAt) => {
    try {
      const fallbackEgg = await updateAdminEggHatchTime(
        eggId,
        hatchAt,
        admin.authHeader
      );
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);

      return findEggRow(rawTables, eggId) || fallbackEgg;
    } catch (updateError) {
      handleAuthError(updateError);
      throw updateError;
    }
  };

  const handleFetchEarlyHatchEligible = async () => {
    try {
      return await fetchAdminEarlyHatchEligible(admin.authHeader);
    } catch (fetchError) {
      handleAuthError(fetchError);
      throw fetchError;
    }
  };

  const handleApproveEarlyHatch = async (eggId) => {
    try {
      await approveAdminEarlyHatch(eggId, admin.authHeader);
      const rawTables = await loadRawTables(admin.authHeader);
      handleAuthError(rawTables);
    } catch (approveError) {
      handleAuthError(approveError);
      throw approveError;
    }
  };

  const SidebarToggleIcon = isNavCollapsed ? FaChevronRight : FaChevronLeft;

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
          <p className="admin-eyebrow">Anh Gà MC Gift Code Admin</p>
          <h1>Dashboard vận hành gift code</h1>
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

      <div
        className={`admin-shell${
          isNavCollapsed ? " is-nav-collapsed" : " is-nav-open"
        }`}
      >
        <button
          type="button"
          className="admin-sidebar__mobile-toggle"
          aria-controls="admin-management-nav"
          aria-expanded={!isNavCollapsed}
          onClick={handleToggleAdminNav}
        >
          <FaBars aria-hidden="true" />
          <span>Menu</span>
        </button>

        <aside className="admin-sidebar" aria-label="Admin navigation">
          <button
            type="button"
            className="admin-sidebar__toggle"
            aria-controls="admin-management-nav"
            aria-expanded={!isNavCollapsed}
            aria-label={
              isNavCollapsed ? "Mo menu quan tri" : "Dong menu quan tri"
            }
            onClick={handleToggleAdminNav}
          >
            <SidebarToggleIcon aria-hidden="true" />
            <span>{isNavCollapsed ? "Mo rong" : "Thu gon"}</span>
          </button>

          <AdminManagementNav
            activeSlug={isOverviewPage ? "" : activeManagementPage.slug}
            tableCounts={adminTables.tableCounts}
            onNavigate={handleAdminNavNavigate}
          />
        </aside>

        {!isNavCollapsed ? (
          <button
            type="button"
            className="admin-sidebar__scrim"
            aria-label="Dong menu quan tri"
            onClick={handleCloseAdminNav}
          />
        ) : null}

        <div className="admin-shell__content">
          {isOverviewPage ? (
            <AdminAnalyticsPanel
              dashboard={dashboard}
              isRefreshing={adminTables.isLoadingRawData}
              metrics={visibleMetrics}
              onRefresh={handleReloadRawData}
            />
          ) : activeManagementPage.slug === "early-hatch" ? (
            <AdminEarlyHatchPanel
              authHeader={admin.authHeader}
              isRefreshing={adminTables.isLoadingRawData}
              onApproveEarlyHatch={handleApproveEarlyHatch}
              onFetchEligible={handleFetchEarlyHatchEligible}
            />
          ) : (
            <AdminDataCrudPanel
              activeTableKey={activeManagementPage.tableKey}
              panelTitle={activeManagementPage.title}
              panelDescription={activeManagementPage.description}
              allowedTableKeys={MANAGEMENT_TABLE_KEYS}
              tables={adminTables.tables}
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
              onUpdateProductEggMappingRates={handleUpdateProductEggMappingRates}
              onUpdateEggHatchTime={handleUpdateEggHatchTime}
              onImportGiftAccounts={adminTables.importGiftAccounts}
              onUploadGiftAccounts={handleUploadGiftAccounts}
              isRefreshing={adminTables.isLoadingRawData}
              isSyncingProducts={isSyncingProducts}
              onRefresh={handleReloadRawData}
              onSyncProducts={handleSyncProducts}
              onResetTables={adminTables.resetTables}
            />
          )}
        </div>
      </div>
    </main>
  );
}
