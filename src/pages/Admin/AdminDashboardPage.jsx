import { useEffect, useState } from "react";
import { AdminDataTable } from "../../components/admin/AdminDataTable";
import { AdminDataCrudPanel } from "../../components/admin/AdminDataCrudPanel";
import { AdminLoginPanel } from "../../components/admin/AdminLoginPanel";
import { AdminMetricCard } from "../../components/admin/AdminMetricCard";
import { AdminPasswordPanel } from "../../components/admin/AdminPasswordPanel";
import { AdminStatusBar } from "../../components/admin/AdminStatusBar";
import { giftCatalogData } from "../../config/giftCatalogData";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAdminDataTables } from "../../hooks/useAdminDataTables";
import {
  buildAdminDashboard,
  formatCurrency,
} from "../../services/adminDashboardService";
import {
  createAdminGiftAccount,
  uploadAdminGiftAccounts,
} from "../../services/adminGiftAccountService";

const orderColumns = [
  { key: "code", label: "Mã đơn" },
  { key: "product", label: "Sản phẩm" },
  { key: "status", label: "Trạng thái" },
  { key: "fulfillment", label: "Giao hàng" },
  { key: "total", label: "Tổng tiền" },
  { key: "updatedAt", label: "Cập nhật" },
];

const poolColumns = [
  { key: "pool", label: "Pool" },
  { key: "tier", label: "Tier" },
  { key: "accounts", label: "Acc map" },
  { key: "available", label: "Có sẵn" },
  { key: "createdAt", label: "Ngày tạo" },
];

const customerColumns = [
  { key: "code", label: "Mã khách" },
  { key: "name", label: "Tên khách" },
  { key: "status", label: "Trạng thái" },
  { key: "success", label: "Đơn thành công" },
  { key: "returnStreak", label: "Hoàn liên tiếp" },
  { key: "warning", label: "Cảnh báo" },
  { key: "updatedAt", label: "Cập nhật" },
];

const accountColumns = [
  { key: "username", label: "Username" },
  { key: "platform", label: "Platform" },
  { key: "tier", label: "Tier" },
  { key: "status", label: "Status" },
  { key: "token", label: "Token" },
  { key: "assignedAt", label: "Assigned" },
];

const productColumns = [
  { key: "id", label: "ID KV" },
  { key: "name", label: "Sản phẩm" },
  { key: "price", label: "Giá" },
  { key: "syncedAt", label: "Đồng bộ" },
];

const logColumns = [
  { key: "action", label: "Action" },
  { key: "eggId", label: "Egg" },
  { key: "accountId", label: "Account" },
  { key: "triggeredBy", label: "By" },
  { key: "createdAt", label: "Created" },
];

function hasRows(rows) {
  return Array.isArray(rows) && rows.length > 0;
}

function hasCounts(counts) {
  return Object.values(counts || {}).some((value) => Number(value) > 0);
}

function hasMetricValue(value) {
  return Number(value) > 0;
}

export default function AdminDashboardPage() {
  const adminTables = useAdminDataTables(giftCatalogData);
  const { loadRawTables } = adminTables;
  const { admin, error, isLoggingIn, login, logout } = useAdminAuth(
    adminTables.tables
  );
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const dashboard = buildAdminDashboard(adminTables.tables);
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
    if (!admin?.authHeader) {
      return;
    }

    loadRawTables(admin.authHeader).catch(() => {
      // The hook stores a user-facing error message.
    });
  }, [admin?.authHeader, loadRawTables]);

  const handleReloadRawData = () => {
    if (!admin?.authHeader || adminTables.isLoadingRawData) {
      return;
    }

    loadRawTables(admin.authHeader).catch(() => {
      // The hook stores a user-facing error message.
    });
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
            {adminTables.isLoadingRawData ? "Đang tải dữ liệu" : "Tải lại dữ liệu"}
          </button>
          {admin.id ? (
            <button
              type="button"
              className="admin-light-button"
              onClick={() => setPasswordModalOpen(true)}
            >
              Đổi mật khẩu
            </button>
          ) : null}
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {isPasswordModalOpen && admin.id ? (
        <AdminPasswordPanel
          admin={admin}
          onChangePassword={adminTables.changeAdminPassword}
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

      <AdminDataTable
        title="Danh sách khách hàng"
        columns={customerColumns}
        rows={dashboard.customerRows}
        emptyMessage={
          adminTables.isLoadingRawData
            ? "Đang tải danh sách khách hàng từ API..."
            : "Chưa có khách hàng từ /api/admin/customers. Bấm Tải lại dữ liệu sau khi đăng nhập JWT."
        }
      />

      <AdminDataCrudPanel
        tables={adminTables.tables}
        tableCounts={adminTables.tableCounts}
        onSaveRecord={adminTables.upsertRecord}
        onDeleteRecord={adminTables.deleteRecord}
        onCreateGiftAccount={(record) =>
          createAdminGiftAccount(record, admin.authHeader)
        }
        onImportGiftAccounts={adminTables.importGiftAccounts}
        onUploadGiftAccounts={(file) =>
          uploadAdminGiftAccounts(file, admin.authHeader)
        }
        onResetTables={adminTables.resetTables}
      />

      {hasCounts(dashboard.counts.customerStatus) ? (
        <AdminStatusBar
          title="Trạng thái khách"
          counts={dashboard.counts.customerStatus}
        />
      ) : null}

      {hasCounts(dashboard.counts.orderStatus) ||
      hasCounts(dashboard.counts.accountStatus) ? (
        <section className="admin-grid-two">
          {hasCounts(dashboard.counts.orderStatus) ? (
            <AdminStatusBar
              title="Trạng thái đơn"
              counts={dashboard.counts.orderStatus}
            />
          ) : null}
          {hasCounts(dashboard.counts.accountStatus) ? (
            <AdminStatusBar
              title="Trạng thái acc"
              counts={dashboard.counts.accountStatus}
            />
          ) : null}
        </section>
      ) : null}

      {hasCounts(dashboard.counts.eggStatus) ||
      hasCounts(dashboard.counts.logAction) ? (
        <section className="admin-grid-two">
          {hasCounts(dashboard.counts.eggStatus) ? (
            <AdminStatusBar
              title="Trạng thái trứng"
              counts={dashboard.counts.eggStatus}
            />
          ) : null}
          {hasCounts(dashboard.counts.logAction) ? (
            <AdminStatusBar
              title="Log hành động"
              counts={dashboard.counts.logAction}
            />
          ) : null}
        </section>
      ) : null}

      {hasRows(dashboard.latestOrders) ? (
        <AdminDataTable
          title="Đơn KiotViet mới"
          columns={orderColumns}
          rows={dashboard.latestOrders}
        />
      ) : null}

      {hasRows(dashboard.poolRows) || hasRows(dashboard.accountRows) ? (
        <section className="admin-grid-two">
          {hasRows(dashboard.poolRows) ? (
            <AdminDataTable
              title="Gift pools"
              columns={poolColumns}
              rows={dashboard.poolRows}
            />
          ) : null}
          {hasRows(dashboard.accountRows) ? (
            <AdminDataTable
              title="Gift accounts"
              columns={accountColumns}
              rows={dashboard.accountRows}
            />
          ) : null}
        </section>
      ) : null}

      {hasRows(dashboard.productRows) ? (
        <AdminDataTable
          title="Sản phẩm KiotViet"
          columns={productColumns}
          rows={dashboard.productRows}
        />
      ) : null}

      {hasRows(dashboard.logRows) ? (
        <AdminDataTable
          title="Egg opening logs"
          columns={logColumns}
          rows={dashboard.logRows}
        />
      ) : null}
    </main>
  );
}
