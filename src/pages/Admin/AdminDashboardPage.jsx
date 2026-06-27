import { useEffect, useState } from "react";
import { AdminDataTable } from "../../components/admin/AdminDataTable";
import { AdminDataCrudPanel } from "../../components/admin/AdminDataCrudPanel";
import { AdminLoginPanel } from "../../components/admin/AdminLoginPanel";
import { AdminMetricCard } from "../../components/admin/AdminMetricCard";
import { AdminPasswordPanel } from "../../components/admin/AdminPasswordPanel";
import { AdminStatusBar } from "../../components/admin/AdminStatusBar";
import { AdminWorkflow } from "../../components/admin/AdminWorkflow";
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
  { key: "success", label: "Thành công" },
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

export default function AdminDashboardPage() {
  const adminTables = useAdminDataTables(giftCatalogData);
  const { loadRawTables } = adminTables;
  const { admin, error, isLoggingIn, login, logout } = useAdminAuth(
    adminTables.tables
  );
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const dashboard = buildAdminDashboard(adminTables.tables);

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
          <p className="admin-eyebrow">AGMC MT Admin</p>
          <h1>Dashboard vận hành quà trứng</h1>
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

      <section className="admin-metric-grid">
        <AdminMetricCard
          label="Khách hàng"
          value={dashboard.summary.totalCustomers}
          note={`${dashboard.summary.warningCustomers} cảnh báo`}
          tone="blue"
        />
        <AdminMetricCard
          label="Tổng đơn SAPO"
          value={dashboard.summary.totalOrders}
          note="sapo_orders"
          tone="blue"
        />
        <AdminMetricCard
          label="Đơn Paid"
          value={dashboard.summary.paidOrders}
          note="được nhập mã"
          tone="green"
        />
        <AdminMetricCard
          label="Đơn bị chặn"
          value={dashboard.summary.blockedOrders}
          note="Pending / Cancel"
          tone="red"
        />
        <AdminMetricCard
          label="Doanh thu Paid"
          value={formatCurrency(dashboard.summary.totalRevenue)}
          note="financial_status paid"
          tone="gold"
        />
        <AdminMetricCard
          label="Tổng trứng"
          value={dashboard.summary.totalEggs}
          note={`${dashboard.summary.readyEggs} sẵn sàng`}
          tone="purple"
        />
        <AdminMetricCard
          label="Trứng đang ấp"
          value={dashboard.summary.hatchingEggs}
          note="status incubating"
          tone="purple"
        />
        <AdminMetricCard
          label="Acc available"
          value={dashboard.summary.availableAccounts}
          note={`${dashboard.summary.totalAccounts} total`}
          tone="green"
        />
      </section>

      <AdminWorkflow steps={dashboard.workflow} />

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

      <section className="admin-grid-two">
        <AdminStatusBar title="Trạng thái đơn" counts={dashboard.counts.orderStatus} />
        <AdminStatusBar title="Trạng thái acc" counts={dashboard.counts.accountStatus} />
      </section>

      <section className="admin-grid-two">
        <AdminStatusBar title="Trạng thái trứng" counts={dashboard.counts.eggStatus} />
        <AdminStatusBar title="Log hành động" counts={dashboard.counts.logAction} />
      </section>

      <AdminDataTable
        title="Khách hàng"
        columns={customerColumns}
        rows={dashboard.customerRows}
      />

      <AdminDataTable
        title="Đơn SAPO mới"
        columns={orderColumns}
        rows={dashboard.latestOrders}
      />

      <section className="admin-grid-two">
        <AdminDataTable
          title="Gift pools"
          columns={poolColumns}
          rows={dashboard.poolRows}
        />
        <AdminDataTable
          title="Gift accounts"
          columns={accountColumns}
          rows={dashboard.accountRows}
        />
      </section>

      <AdminDataTable
        title="Sản phẩm KiotViet"
        columns={productColumns}
        rows={dashboard.productRows}
      />

      <AdminDataTable
        title="Egg opening logs"
        columns={logColumns}
        rows={dashboard.logRows}
      />
    </main>
  );
}
