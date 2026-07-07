import { useEffect, useMemo, useState } from "react";
import {
  FaEye,
  FaMagnifyingGlass,
  FaPen,
  FaPlus,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import {
  confirmAdminAction,
  showAdminAlert,
} from "../../services/adminBrowserFeedback";
import { useAdminClientPagination } from "../../hooks/useAdminClientPagination";
import { AdminClientPagination } from "./AdminClientPagination";
import { AdminModalPortal } from "./AdminModalPortal";

const EMPTY_ROWS = [];
const TIER_ORDER = ["A", "B", "C", "D", "E", "F"];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeTier(value) {
  return normalizeText(value || "A").toUpperCase();
}

function getPoolId(pool) {
  return normalizeText(pool?.id);
}

function getPoolName(pool) {
  return normalizeText(pool?.pool_name || pool?.poolName || pool?.id);
}

function getAccountId(account) {
  return normalizeText(account?.id || account?.account_id || account?.accountId);
}

function getMappingPoolId(mapping) {
  return normalizeText(mapping?.pool_id || mapping?.poolId);
}

function getMappingAccountId(mapping) {
  return normalizeText(mapping?.account_id || mapping?.accountId);
}

function getMappingId(mapping) {
  const poolId = getMappingPoolId(mapping);
  const accountId = getMappingAccountId(mapping);

  return normalizeText(mapping?.id) || `${poolId}:${accountId}`;
}

function createPoolAccountMapping(poolId, accountId) {
  return {
    id: `${poolId}:${accountId}`,
    pool_id: poolId,
    account_id: accountId,
  };
}

function createEmptyPoolForm() {
  return {
    pool_name: "",
    tier: "A",
  };
}

function createPoolForm(pool) {
  return {
    pool_name: getPoolName(pool),
    tier: normalizeTier(pool?.tier),
  };
}

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

function poolMatchesKeyword(pool, keyword) {
  if (!keyword) {
    return true;
  }

  return [pool?.id, pool?.pool_name, pool?.poolName, pool?.tier]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ")
    .includes(keyword);
}

function accountMatchesTier(account, tier) {
  return normalizeTier(account?.tier) === normalizeTier(tier);
}

function getAccountLabel(account) {
  const accountId = getAccountId(account);
  const username = normalizeText(account?.username) || accountId || "account";
  const status = normalizeText(account?.status) || "-";
  const platform = normalizeText(account?.platform) || "-";

  return `${username} - ${status} - ${platform}`;
}

function getStatusClass(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus === "available") {
    return "is-available";
  }

  if (normalizedStatus === "assigned" || normalizedStatus === "reserved") {
    return "is-assigned";
  }

  return "is-muted";
}

export function AdminGiftPoolTablePanel({
  panelTitle,
  panelDescription,
  tables,
  onSaveRecord,
  onDeleteRecord,
  onCreateGiftPool,
  onUpdateGiftPool,
  onDeleteGiftPool,
  onAddPoolAccount,
  onRemovePoolAccount,
}) {
  const [keyword, setKeyword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingPoolId, setEditingPoolId] = useState("");
  const [poolForm, setPoolForm] = useState(createEmptyPoolForm);
  const [isPoolModalOpen, setPoolModalOpen] = useState(false);
  const [detailPoolId, setDetailPoolId] = useState("");
  const [selectedTier, setSelectedTier] = useState("A");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedPoolAccountIds, setSelectedPoolAccountIds] = useState([]);
  const [deletePoolId, setDeletePoolId] = useState("");

  const pools = tables.giftPools || EMPTY_ROWS;
  const accounts = tables.giftAccounts || EMPTY_ROWS;
  const mappings = tables.poolAccountMappings || EMPTY_ROWS;
  const normalizedKeyword = normalizeText(keyword).toLowerCase();

  const accountById = useMemo(() => {
    const map = new Map();

    accounts.forEach((account) => {
      const accountId = getAccountId(account);

      if (accountId) {
        map.set(accountId, account);
      }
    });

    return map;
  }, [accounts]);

  const poolAccountsByPoolId = useMemo(() => {
    const map = new Map();
    const poolIdsWithMappings = new Set();

    pools.forEach((pool) => {
      const poolId = getPoolId(pool);

      if (poolId) {
        map.set(poolId, []);
      }
    });

    mappings.forEach((mapping) => {
      const poolId = getMappingPoolId(mapping);
      const accountId = getMappingAccountId(mapping);

      if (!poolId || !accountId) {
        return;
      }

      poolIdsWithMappings.add(poolId);

      if (!map.has(poolId)) {
        map.set(poolId, []);
      }

      map.get(poolId).push(
        accountById.get(accountId) || {
          id: accountId,
          username: accountId,
          tier: "",
          status: "",
          platform: "",
        }
      );
    });

    pools.forEach((pool) => {
      const poolId = getPoolId(pool);

      if (!poolId || poolIdsWithMappings.has(poolId) || !Array.isArray(pool.accounts)) {
        return;
      }

      map.set(
        poolId,
        pool.accounts.map(
          (account) => accountById.get(getAccountId(account)) || account
        )
      );
    });

    map.forEach((poolAccounts, poolId) => {
      const seenAccountIds = new Set();
      const uniqueAccounts = [];

      poolAccounts.forEach((account) => {
        const accountId = getAccountId(account);

        if (!accountId || seenAccountIds.has(accountId)) {
          return;
        }

        seenAccountIds.add(accountId);
        uniqueAccounts.push(account);
      });

      map.set(
        poolId,
        uniqueAccounts.sort((left, right) =>
          normalizeText(left.username || left.id).localeCompare(
            normalizeText(right.username || right.id),
            "vi"
          )
        )
      );
    });

    return map;
  }, [accountById, mappings, pools]);

  const mappedAccountIds = useMemo(() => {
    const ids = new Set();

    poolAccountsByPoolId.forEach((poolAccounts) => {
      poolAccounts.forEach((account) => {
        const accountId = getAccountId(account);

        if (accountId) {
          ids.add(accountId);
        }
      });
    });

    return ids;
  }, [poolAccountsByPoolId]);

  const tierOptions = useMemo(() => {
    const tiers = new Set(TIER_ORDER);

    pools.forEach((pool) => {
      const tier = normalizeTier(pool?.tier);

      if (tier) {
        tiers.add(tier);
      }
    });

    accounts.forEach((account) => {
      const tier = normalizeTier(account?.tier);

      if (tier) {
        tiers.add(tier);
      }
    });

    return [...tiers];
  }, [accounts, pools]);

  const filteredPools = useMemo(
    () =>
      [...pools]
        .filter((pool) => poolMatchesKeyword(pool, normalizedKeyword))
        .sort((left, right) =>
          getPoolName(left).localeCompare(getPoolName(right), "vi")
        ),
    [normalizedKeyword, pools]
  );
  const poolPagination = useAdminClientPagination(
    filteredPools,
    `${keyword}|${pools.length}`
  );
  const paginatedPools = poolPagination.pageRows;

  const selectedPool = useMemo(
    () => pools.find((pool) => getPoolId(pool) === detailPoolId) || null,
    [detailPoolId, pools]
  );
  const deletePool = useMemo(
    () => pools.find((pool) => getPoolId(pool) === deletePoolId) || null,
    [deletePoolId, pools]
  );
  const currentPoolAccounts = selectedPool
    ? poolAccountsByPoolId.get(getPoolId(selectedPool)) || EMPTY_ROWS
    : EMPTY_ROWS;
  const poolAccountPagination = useAdminClientPagination(
    currentPoolAccounts,
    `${detailPoolId}|${selectedTier}|${currentPoolAccounts.length}`
  );
  const paginatedPoolAccounts = poolAccountPagination.pageRows;
  const currentPoolAccountIds = useMemo(
    () => currentPoolAccounts.map(getAccountId).filter(Boolean),
    [currentPoolAccounts]
  );
  const selectedPoolAccountIdSet = useMemo(
    () => new Set(selectedPoolAccountIds),
    [selectedPoolAccountIds]
  );
  const allPoolAccountsSelected =
    paginatedPoolAccounts.length > 0 &&
    paginatedPoolAccounts.every((account) =>
      selectedPoolAccountIdSet.has(getAccountId(account))
    );
  const candidateAccounts = useMemo(() => {
    const currentPoolAccountIdSet = new Set(currentPoolAccountIds);

    return accounts
      .filter((account) => {
        const accountId = getAccountId(account);

        return (
          accountId &&
          accountMatchesTier(account, selectedTier) &&
          !currentPoolAccountIdSet.has(accountId) &&
          !mappedAccountIds.has(accountId)
        );
      })
      .sort((left, right) =>
        normalizeText(left.username || left.id).localeCompare(
          normalizeText(right.username || right.id),
          "vi"
        )
      );
  }, [accounts, currentPoolAccountIds, mappedAccountIds, selectedTier]);

  useEffect(() => {
    if (!candidateAccounts.some((account) => getAccountId(account) === selectedAccountId)) {
      setSelectedAccountId(getAccountId(candidateAccounts[0]) || "");
    }
  }, [candidateAccounts, selectedAccountId]);

  useEffect(() => {
    setSelectedPoolAccountIds((currentIds) =>
      currentIds.filter((accountId) => currentPoolAccountIds.includes(accountId))
    );
  }, [currentPoolAccountIds]);

  const openCreatePoolModal = () => {
    setEditingPoolId("");
    setPoolForm(createEmptyPoolForm());
    setPoolModalOpen(true);
  };

  const openEditPoolModal = (pool) => {
    setEditingPoolId(getPoolId(pool));
    setPoolForm(createPoolForm(pool));
    setPoolModalOpen(true);
  };

  const openDetailModal = (pool) => {
    const poolTier = normalizeTier(pool?.tier);

    setDetailPoolId(getPoolId(pool));
    setSelectedTier(poolTier || tierOptions[0] || "A");
    setSelectedAccountId("");
    setSelectedPoolAccountIds([]);
  };

  const updatePoolField = (field, value) => {
    setPoolForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const savePool = async () => {
    if (isSaving) {
      return;
    }

    const record = {
      pool_name: normalizeText(poolForm.pool_name),
      poolName: normalizeText(poolForm.pool_name),
      tier: normalizeTier(poolForm.tier),
    };

    if (!record.pool_name) {
      showAdminAlert("Vui lòng nhập tên bể quà.");
      return;
    }

    setIsSaving(true);

    try {
      const savedPool = editingPoolId
        ? await onUpdateGiftPool(record, editingPoolId)
        : await onCreateGiftPool(record);
      const nextPool = {
        ...record,
        ...savedPool,
        pool_name: getPoolName(savedPool) || record.pool_name,
        tier: normalizeTier(savedPool?.tier || record.tier),
      };

      onSaveRecord("giftPools", nextPool);
      setPoolModalOpen(false);
      setEditingPoolId("");
      showAdminAlert(editingPoolId ? "Đã cập nhật bể quà." : "Đã tạo bể quà mới.");
    } catch (error) {
      showAdminAlert(error.message || "Không thể lưu bể quà.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletePool = async () => {
    if (!deletePool || isSaving) {
      return;
    }

    const poolId = getPoolId(deletePool);

    setIsSaving(true);

    try {
      await onDeleteGiftPool(poolId);
      onDeleteRecord("giftPools", poolId);
      mappings
        .filter((mapping) => getMappingPoolId(mapping) === poolId)
        .forEach((mapping) =>
          onDeleteRecord("poolAccountMappings", getMappingId(mapping))
        );

      if (detailPoolId === poolId) {
        setDetailPoolId("");
      }

      setDeletePoolId("");
      showAdminAlert("Đã xóa bể quà.");
    } catch (error) {
      showAdminAlert(error.message || "Không thể xóa bể quà.");
    } finally {
      setIsSaving(false);
    }
  };

  const addAccountsToPool = async (accountIds) => {
    const poolId = getPoolId(selectedPool);
    const uniqueAccountIds = [...new Set(accountIds.map(normalizeText).filter(Boolean))];

    if (!poolId || !uniqueAccountIds.length || isSaving) {
      return;
    }

    if (
      !confirmAdminAction(
        uniqueAccountIds.length === 1
          ? "Xác nhận thêm account vào bể quà?"
          : `Xác nhận thêm ${uniqueAccountIds.length} account vào bể quà?`
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await onAddPoolAccount({
        pool_id: poolId,
        account_ids: uniqueAccountIds,
      });
      const returnedMappings = Array.isArray(result) ? result : [result].filter(Boolean);
      const nextMappings = returnedMappings.length
        ? returnedMappings
        : uniqueAccountIds.map((accountId) =>
            createPoolAccountMapping(poolId, accountId)
          );

      nextMappings.forEach((mapping) =>
        onSaveRecord("poolAccountMappings", mapping)
      );
      showAdminAlert(`Đã thêm ${uniqueAccountIds.length} account vào bể.`);
    } catch (error) {
      showAdminAlert(error.message || "Không thể thêm account vào bể.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePoolAccount = (accountId) => {
    setSelectedPoolAccountIds((currentIds) =>
      currentIds.includes(accountId)
        ? currentIds.filter((currentId) => currentId !== accountId)
        : [...currentIds, accountId]
    );
  };

  const toggleAllPoolAccounts = () => {
    setSelectedPoolAccountIds(
      allPoolAccountsSelected ? [] : paginatedPoolAccounts.map(getAccountId).filter(Boolean)
    );
  };

  const removeAccountsFromPool = async (accountIds) => {
    const poolId = getPoolId(selectedPool);
    const uniqueAccountIds = [...new Set(accountIds.map(normalizeText).filter(Boolean))];

    if (!poolId || !uniqueAccountIds.length || isSaving) {
      return;
    }

    if (
      !confirmAdminAction(
        uniqueAccountIds.length === 1
          ? "Xác nhận gỡ account khỏi bể quà?"
          : `Xác nhận gỡ ${uniqueAccountIds.length} account khỏi bể quà?`
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await onRemovePoolAccount({
        pool_id: poolId,
        account_ids: uniqueAccountIds,
      });
      const returnedMappings = Array.isArray(result) ? result : [result].filter(Boolean);
      const mappingIds = returnedMappings.length
        ? returnedMappings.map(getMappingId)
        : uniqueAccountIds.map((accountId) =>
            getMappingId(
              mappings.find(
                (mapping) =>
                  getMappingPoolId(mapping) === poolId &&
                  getMappingAccountId(mapping) === accountId
              ) || createPoolAccountMapping(poolId, accountId)
            )
          );

      mappingIds.forEach((mappingId) =>
        onDeleteRecord("poolAccountMappings", mappingId)
      );
      setSelectedPoolAccountIds((currentIds) =>
        currentIds.filter((accountId) => !uniqueAccountIds.includes(accountId))
      );
      showAdminAlert(`Đã gỡ ${uniqueAccountIds.length} account khỏi bể.`);
    } catch (error) {
      showAdminAlert(error.message || "Không thể gỡ account khỏi bể.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeAccountFromPool = (accountId) => {
    removeAccountsFromPool([accountId]);
  };

  return (
    <section className="admin-panel admin-gift-pool-manager-panel">
      <div className="admin-gift-pool-toolbar">
        <label className="admin-gift-pool-search">
          <FaMagnifyingGlass aria-hidden="true" />
          <span>Tìm kiếm</span>
          <input
            type="search"
            placeholder="Tìm theo tên bể, tier..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="admin-gift-pool-create-button"
          onClick={openCreatePoolModal}
        >
          <FaPlus aria-hidden="true" />
          Tạo bể quà mới
        </button>
      </div>

      <div className="admin-table-wrap admin-gift-pool-table-wrap">
        <table className="admin-table admin-gift-pool-table">
          <thead>
            <tr>
              <th>ID Bể Quà</th>
              <th>Tên Bể Quà</th>
              <th>Phân cấp (Tier)</th>
              <th>Ngày Tạo</th>
              <th>Tài khoản</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPools.length ? (
              paginatedPools.map((pool) => {
                const poolId = getPoolId(pool);
                const poolAccounts = poolAccountsByPoolId.get(poolId) || EMPTY_ROWS;

                return (
                  <tr key={poolId || getPoolName(pool)}>
                    <td className="admin-gift-pool-id">{poolId || "-"}</td>
                    <td>
                      <strong>{getPoolName(pool) || "Bể chưa đặt tên"}</strong>
                    </td>
                    <td>
                      <span className="admin-gift-pool-tier-pill">
                        TIER {normalizeTier(pool.tier) || "-"}
                      </span>
                    </td>
                    <td>{formatDateTime(pool.created_at || pool.createdAt)}</td>
                    <td>{poolAccounts.length}</td>
                    <td>
                      <div className="admin-gift-pool-actions">
                        <button
                          type="button"
                          className="admin-mini-button"
                          onClick={() => openDetailModal(pool)}
                        >
                          <FaEye aria-hidden="true" />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="admin-mini-button"
                          onClick={() => openEditPoolModal(pool)}
                        >
                          <FaPen aria-hidden="true" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-mini-button admin-danger-button"
                          onClick={() => setDeletePoolId(poolId)}
                        >
                          <FaTrashCan aria-hidden="true" />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>Không tìm thấy bể quà phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminClientPagination itemLabel="bể quà" pagination={poolPagination} />

      {isPoolModalOpen ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-gift-pool-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-gift-pool-modal-title"
          >
            <div className="admin-record-editor admin-record-editor--modal">
              <div className="admin-record-editor__head">
                <div>
                  <strong id="admin-gift-pool-modal-title">
                    {editingPoolId ? "Sửa bể quà" : "Tạo bể quà mới"}
                  </strong>
                  <span>{panelTitle || panelDescription}</span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  aria-label="Đóng modal bể quà"
                  onClick={() => setPoolModalOpen(false)}
                >
                  <FaXmark aria-hidden="true" />
                  Đóng
                </button>
              </div>

              <div className="admin-form-grid admin-gift-pool-form-grid">
                <label className="admin-gift-pool-form-field admin-gift-pool-form-field--name">
                  Tên bể quà
                  <input
                    type="text"
                    placeholder="Nháº­p tÃªn bá»ƒ quÃ "
                    value={poolForm.pool_name}
                    onChange={(event) =>
                      updatePoolField("pool_name", event.target.value)
                    }
                  />
                </label>
                <label className="admin-gift-pool-form-field admin-gift-pool-form-field--tier">
                  Tier
                  <select
                    value={poolForm.tier}
                    onChange={(event) => updatePoolField("tier", event.target.value)}
                  >
                    {tierOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        Tier {tier}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="admin-crud-actions admin-gift-pool-modal-actions">
                <button
                  type="button"
                  className="admin-light-button"
                  disabled={isSaving}
                  onClick={() => setPoolModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="button" disabled={isSaving} onClick={savePool}>
                  {isSaving ? "Đang lưu..." : editingPoolId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}

      {selectedPool ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-gift-pool-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-gift-pool-detail-title"
          >
            <div className="admin-gift-pool-detail">
              <div className="admin-record-editor__head">
                <div>
                  <strong id="admin-gift-pool-detail-title">
                    {getPoolName(selectedPool) || "Chi tiết bể quà"}
                  </strong>
                  <span>{getPoolId(selectedPool)}</span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  aria-label="Đóng chi tiết bể quà"
                  onClick={() => {
                    setDetailPoolId("");
                    setSelectedPoolAccountIds([]);
                  }}
                >
                  <FaXmark aria-hidden="true" />
                  Đóng
                </button>
              </div>

              <div className="admin-gift-pool-detail-summary">
                <span>Tier {normalizeTier(selectedPool.tier) || "-"}</span>
                <span>{currentPoolAccounts.length} account trong bể</span>
                <span>{candidateAccounts.length} account có thể thêm</span>
              </div>

              <div className="admin-gift-pool-add-panel">
                <label>
                  Chọn tier
                  <select
                    value={selectedTier}
                    onChange={(event) => setSelectedTier(event.target.value)}
                  >
                    {tierOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        Tier {tier}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!candidateAccounts.length || isSaving}
                  onClick={() => addAccountsToPool(candidateAccounts.map(getAccountId))}
                >
                  <FaPlus aria-hidden="true" />
                  Thêm tất cả tier {selectedTier}
                </button>
                <label>
                  Chọn account
                  <select
                    value={selectedAccountId}
                    onChange={(event) => setSelectedAccountId(event.target.value)}
                  >
                    {candidateAccounts.length ? (
                      candidateAccounts.map((account) => {
                        const accountId = getAccountId(account);

                        return (
                          <option key={accountId} value={accountId}>
                            {getAccountLabel(account)}
                          </option>
                        );
                      })
                    ) : (
                      <option value="">Không còn account trống trong tier</option>
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!selectedAccountId || isSaving}
                  onClick={() => addAccountsToPool([selectedAccountId])}
                >
                  <FaPlus aria-hidden="true" />
                  Thêm account
                </button>
              </div>

              <div className="admin-gift-pool-bulk-actions">
                <span>{selectedPoolAccountIds.length} account đã chọn</span>
                <button
                  type="button"
                  className="admin-mini-button admin-danger-button"
                  disabled={!selectedPoolAccountIds.length || isSaving}
                  onClick={() => removeAccountsFromPool(selectedPoolAccountIds)}
                >
                  <FaTrashCan aria-hidden="true" />
                  Gỡ đã chọn
                </button>
              </div>

              <div className="admin-table-wrap admin-gift-pool-account-wrap">
                <table className="admin-table admin-gift-pool-account-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          aria-label="Chọn tất cả account trong bể"
                          checked={allPoolAccountsSelected}
                          disabled={!currentPoolAccountIds.length || isSaving}
                          type="checkbox"
                          onChange={toggleAllPoolAccounts}
                        />
                      </th>
                      <th>Username / Account</th>
                      <th>Password</th>
                      <th>Nền tảng</th>
                      <th>Tier</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPoolAccounts.length ? (
                      paginatedPoolAccounts.map((account) => {
                        const accountId = getAccountId(account);

                        return (
                          <tr key={accountId}>
                            <td>
                              <input
                                aria-label={`Chọn ${account.username || accountId}`}
                                checked={selectedPoolAccountIdSet.has(accountId)}
                                disabled={isSaving}
                                type="checkbox"
                                onChange={() => togglePoolAccount(accountId)}
                              />
                            </td>
                            <td>
                              <strong>{account.username || accountId}</strong>
                              <small>{accountId}</small>
                            </td>
                            <td>{account.password || "-"}</td>
                            <td>{account.platform || "-"}</td>
                            <td>
                              <span className="admin-gift-pool-tier-pill">
                                {normalizeTier(account.tier) || "-"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`admin-gift-pool-status ${getStatusClass(
                                  account.status
                                )}`}
                              >
                                {account.status || "-"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="admin-mini-button admin-danger-button"
                                disabled={isSaving}
                                onClick={() => removeAccountFromPool(accountId)}
                              >
                                <FaTrashCan aria-hidden="true" />
                                Gỡ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>Bể này chưa có account.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <AdminClientPagination
                itemLabel="account trong bể"
                pagination={poolAccountPagination}
              />
            </div>
          </section>
        </AdminModalPortal>
      ) : null}

      {deletePool ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-pool-title"
          >
            <div className="admin-record-editor__head">
              <div>
                <strong id="admin-delete-pool-title">Xóa bể quà</strong>
                <span>{getPoolName(deletePool)}</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Đóng xác nhận xóa"
                onClick={() => setDeletePoolId("")}
              >
                <FaXmark aria-hidden="true" />
                Đóng
              </button>
            </div>
            <p className="admin-confirm-copy">
              Thao tác này sẽ xóa bể quà và gỡ các account đang liên kết khỏi bể
              trên giao diện quản trị.
            </p>
            <div className="admin-crud-actions">
              <button
                type="button"
                className="admin-light-button"
                disabled={isSaving}
                onClick={() => setDeletePoolId("")}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-danger-button"
                disabled={isSaving}
                onClick={confirmDeletePool}
              >
                <FaTrashCan aria-hidden="true" />
                <span>{isSaving ? "Đang xóa..." : "Xóa bể"}</span>
              </button>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}
    </section>
  );
}
