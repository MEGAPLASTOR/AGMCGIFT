import { useEffect, useMemo, useState } from "react";
import { FaBolt, FaBoxOpen, FaRotateRight } from "react-icons/fa6";
import {
  confirmAdminAction,
  showAdminAlert,
} from "../../services/adminBrowserFeedback";
import { useAdminClientPagination } from "../../hooks/useAdminClientPagination";
import { AdminClientPagination } from "./AdminClientPagination";

const EMPTY_GROUPS = [];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}

function getEggTypeLabel(type) {
  if (Number(type) === 1) {
    return "T1 - Nhận ngay";
  }

  if (Number(type) === 2) {
    return "T2 - Cần ấp";
  }

  return type ? `Loại ${type}` : "-";
}

function flattenEarlyHatchGroups(groups) {
  return groups.flatMap((group) =>
    (group.orders || []).flatMap((order) =>
      (order.eggs || []).map((egg) => ({
        customerCode: group.customerCode,
        earlyHatchCredits: group.earlyHatchCredits,
        eggId: egg.eggId,
        eggType: egg.eggType,
        hatchAt: egg.hatchAt,
        key: `${group.customerCode}:${order.orderId}:${egg.eggId}`,
        orderCode: order.orderCode,
        orderId: order.orderId,
        skuDetails: order.skuDetails,
        successCount: group.successCount,
      }))
    )
  );
}

export function AdminEarlyHatchPanel({
  authHeader,
  isRefreshing = false,
  onApproveEarlyHatch,
  onFetchEligible,
}) {
  const [groups, setGroups] = useState(EMPTY_GROUPS);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingEggId, setApprovingEggId] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => flattenEarlyHatchGroups(groups), [groups]);
  const pagination = useAdminClientPagination(
    rows,
    rows.map((row) => row.eggId).join("|")
  );

  const loadEligible = async ({ silent = false } = {}) => {
    if (!authHeader || isLoading || !onFetchEligible) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const nextGroups = await onFetchEligible();
      setGroups(Array.isArray(nextGroups) ? nextGroups : EMPTY_GROUPS);

      if (!silent) {
        showAdminAlert("Đã tải danh sách trứng chờ duyệt sớm.");
      }
    } catch (loadError) {
      const message =
        loadError.message || "Không thể tải danh sách trứng chờ duyệt sớm.";
      setError(message);
      showAdminAlert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEligible({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeader]);

  const handleApprove = async (row) => {
    if (!row?.eggId || approvingEggId) {
      return;
    }

    if (
      !confirmAdminAction(
        `Duyệt sớm 3 ngày cho trứng ${row.eggId}? Hệ thống sẽ trừ 1 tín dụng duyệt sớm của khách.`
      )
    ) {
      return;
    }

    setApprovingEggId(row.eggId);

    try {
      await onApproveEarlyHatch(row.eggId);
      showAdminAlert("Đã duyệt sớm 3 ngày cho trứng.");
      await loadEligible({ silent: true });
    } catch (approveError) {
      showAdminAlert(approveError.message || "Không thể duyệt sớm trứng.");
    } finally {
      setApprovingEggId("");
    }
  };

  const isBusy = isLoading || isRefreshing;

  return (
    <section className="admin-panel admin-early-hatch-panel">
      <div className="admin-panel__head admin-early-hatch-panel__head">
        <div>
          <span>Duyệt thủ công</span>
          <h2>Duyệt Trứng Sớm (Manual Approval)</h2>
          <p>
            Lấy danh sách trứng đang ấp đủ điều kiện từ backend và duyệt giảm
            3 ngày cho từng quả.
          </p>
        </div>
        <button
          type="button"
          className="admin-light-button"
          disabled={isBusy}
          onClick={() => loadEligible()}
        >
          <FaRotateRight aria-hidden="true" />
          {isBusy ? "Đang tải" : "Làm mới"}
        </button>
      </div>

      <div className="admin-early-hatch-rules">
        <strong>Quy tắc duyệt sớm:</strong>
        <ul>
          <li>
            Chỉ hiển thị trứng đang ấp của đơn nhiều sản phẩm/số lượng lớn và
            khách còn tín dụng duyệt sớm.
          </li>
          <li>Mỗi lần duyệt trừ 1 tín dụng và giảm thời gian ấp 3 ngày.</li>
          <li>
            Nếu thời gian nở mới nhỏ hơn hoặc bằng hiện tại, backend sẽ chuyển
            trứng sang READY_TO_CLAIM.
          </li>
        </ul>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {rows.length ? (
        <>
          <div className="admin-table-wrap admin-early-hatch-table-wrap">
            <table className="admin-table admin-early-hatch-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Đơn hàng</th>
                  <th>SKU</th>
                  <th>ID trứng</th>
                  <th>Loại</th>
                  <th>Giờ nở</th>
                  <th>Tín dụng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <strong>{row.customerCode || "-"}</strong>
                      <small>{row.successCount} đơn thành công</small>
                    </td>
                    <td>
                      <strong>{row.orderCode || "-"}</strong>
                      <small>{row.orderId}</small>
                    </td>
                    <td>{row.skuDetails || "-"}</td>
                    <td>
                      <code className="admin-table-code">{row.eggId}</code>
                    </td>
                    <td>
                      <span
                        className={`admin-egg-type is-${
                          Number(row.eggType) === 2 ? "incubate" : "instant"
                        }`}
                      >
                        {getEggTypeLabel(row.eggType)}
                      </span>
                    </td>
                    <td>{formatDateTime(row.hatchAt)}</td>
                    <td>
                      <span className="admin-early-hatch-credit">
                        {row.earlyHatchCredits}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-mini-button admin-early-hatch-approve"
                        disabled={Boolean(approvingEggId)}
                        onClick={() => handleApprove(row)}
                      >
                        <FaBolt aria-hidden="true" />
                        {approvingEggId === row.eggId ? "Đang duyệt" : "Duyệt sớm"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminClientPagination itemLabel="trứng" pagination={pagination} />
        </>
      ) : (
        <div className="admin-early-hatch-empty">
          <FaBoxOpen aria-hidden="true" />
          <strong>
            {isLoading
              ? "Đang tải danh sách trứng đủ điều kiện..."
              : "Hiện tại không có trứng nào đủ điều kiện chờ duyệt sớm."}
          </strong>
        </div>
      )}
    </section>
  );
}
