import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaFloppyDisk,
  FaGripVertical,
  FaLayerGroup,
  FaPen,
  FaRotateLeft,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import { showAdminAlert } from "../../services/adminBrowserFeedback";
import { AdminModalPortal } from "./AdminModalPortal";

const EMPTY_ROWS = [];
const UNASSIGNED_POOL_ID = "__unassigned__";
const POOL_TIER_OPTIONS = ["A", "B", "C", "D"];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeSearch(value) {
  return normalizeText(value).toLowerCase();
}

function getPoolId(pool) {
  return normalizeText(pool?.id);
}

function getPoolName(pool) {
  return normalizeText(pool?.pool_name || pool?.poolName || pool?.id);
}

function getAccountId(account) {
  return normalizeText(account?.id);
}

function getAccountName(account) {
  return normalizeText(account?.username || account?.id);
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

function createPoolForm(pool) {
  return {
    pool_name: getPoolName(pool),
    tier: normalizeText(pool?.tier || "A").toUpperCase(),
  };
}

function createEmptyPoolForm() {
  return {
    pool_name: "",
    tier: "A",
  };
}

function sortAccounts(accounts) {
  return [...accounts].sort((first, second) => {
    const firstStatus = normalizeSearch(first.status);
    const secondStatus = normalizeSearch(second.status);

    if (firstStatus !== secondStatus) {
      if (firstStatus === "available") return -1;
      if (secondStatus === "available") return 1;
    }

    return getAccountName(first).localeCompare(getAccountName(second));
  });
}

function accountMatchesKeyword(account, keyword) {
  if (!keyword) {
    return true;
  }

  return [
    account?.id,
    account?.username,
    account?.tier,
    account?.platform,
    account?.status,
  ]
    .map(normalizeSearch)
    .join(" ")
    .includes(keyword);
}

function poolMatchesKeyword(pool, keyword) {
  if (!keyword) {
    return true;
  }

  return [pool?.id, pool?.pool_name, pool?.poolName, pool?.tier]
    .map(normalizeSearch)
    .join(" ")
    .includes(keyword);
}

function parseDragAccountId(event) {
  const jsonPayload = event.dataTransfer.getData("application/json");

  if (jsonPayload) {
    try {
      const payload = JSON.parse(jsonPayload);
      const accountId = normalizeText(payload.accountId);

      if (accountId) {
        return accountId;
      }
    } catch {
      // Fall back to text/plain below.
    }
  }

  return normalizeText(event.dataTransfer.getData("text/plain"));
}

function PoolAccountTable({
  accounts,
  compact = false,
  draggingAccountId,
  emptyMessage,
  onDragEnd,
  onDragStart,
  pendingAccountIds,
}) {
  const tableClassName = compact
    ? "admin-table admin-pool-account-table admin-pool-account-table--compact"
    : "admin-table admin-pool-account-table";

  return (
    <div
      className={`admin-pool-account-table-wrap${
        compact ? " admin-pool-account-table-wrap--compact" : ""
      }`}
    >
      <table className={tableClassName}>
        {!compact ? (
          <thead>
            <tr>
              <th aria-label="Kéo thả" />
              <th>Account</th>
              <th>Tier</th>
              <th>Trạng thái</th>
              <th>Lưu</th>
            </tr>
          </thead>
        ) : null}
        <tbody>
          {accounts.length ? (
            accounts.map((account) => {
              const accountId = getAccountId(account);
              const status = normalizeText(account.status || "-");
              const isPending = pendingAccountIds.has(accountId);
              const isDragging = draggingAccountId === accountId;

              return (
                <tr
                  className={`admin-pool-account-row${
                    isPending ? " is-pending" : ""
                  }${isDragging ? " is-dragging" : ""}`}
                  draggable
                  key={accountId}
                  onDragEnd={onDragEnd}
                  onDragStart={(event) => onDragStart(event, accountId)}
                >
                  <td className="admin-pool-account-row__drag">
                    <FaGripVertical aria-hidden="true" />
                  </td>
                  <td>
                    <strong>{getAccountName(account)}</strong>
                    <span>{accountId || "no-id"}</span>
                  </td>
                  <td>
                    <em>{normalizeText(account.tier || "-")}</em>
                  </td>
                  <td>
                    <small className="admin-pool-status-pill">{status}</small>
                  </td>
                  <td>
                    {isPending ? (
                      <small className="admin-pool-draft-badge">Chưa lưu</small>
                    ) : (
                      <small className="admin-pool-saved-badge">Đã lưu</small>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5}>
                <div className="admin-pool-empty-drop">
                  <FaBoxOpen aria-hidden="true" />
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminGiftPoolDragPanel({
  panelTitle = "Quản lý bể quà",
  panelDescription = "Tạo bể quà và kéo account vào từng bể để đồng bộ nguồn phát thưởng.",
  tables,
  onSaveRecord,
  onDeleteRecord,
  onCreateGiftPool,
  onUpdateGiftPool,
  onDeleteGiftPool,
  onAddPoolAccount,
  onRemovePoolAccount,
  onResetTables,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [poolForm, setPoolForm] = useState(createEmptyPoolForm);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingAccountId, setDraggingAccountId] = useState("");
  const [dragOverPoolId, setDragOverPoolId] = useState("");
  const [isPoolModalOpen, setPoolModalOpen] = useState(false);
  const [draftMoves, setDraftMoves] = useState(() => new Map());

  const pools = tables.giftPools || EMPTY_ROWS;
  const accounts = tables.giftAccounts || EMPTY_ROWS;
  const mappings = tables.poolAccountMappings || EMPTY_ROWS;
  const normalizedKeyword = normalizeSearch(keyword);
  const poolIdSet = useMemo(
    () => new Set(pools.map(getPoolId).filter(Boolean)),
    [pools]
  );
  const accountIdSet = useMemo(
    () => new Set(accounts.map(getAccountId).filter(Boolean)),
    [accounts]
  );
  const mappingByAccountId = useMemo(() => {
    const map = new Map();

    mappings.forEach((mapping) => {
      const accountId = getMappingAccountId(mapping);
      const poolId = getMappingPoolId(mapping);

      if (accountId && poolId && !map.has(accountId)) {
        map.set(accountId, mapping);
      }
    });

    return map;
  }, [mappings]);
  const persistedPoolByAccountId = useMemo(() => {
    const map = new Map();

    mappingByAccountId.forEach((mapping, accountId) => {
      const poolId = getMappingPoolId(mapping);

      if (poolId && poolIdSet.has(poolId)) {
        map.set(accountId, poolId);
      }
    });

    return map;
  }, [mappingByAccountId, poolIdSet]);
  const pendingMoves = useMemo(
    () =>
      [...draftMoves.entries()]
        .map(([accountId, nextPoolId]) => ({
          accountId,
          currentPoolId: persistedPoolByAccountId.get(accountId) || "",
          nextPoolId,
        }))
        .filter((move) => move.currentPoolId !== move.nextPoolId),
    [draftMoves, persistedPoolByAccountId]
  );
  const pendingAccountIds = useMemo(
    () => new Set(pendingMoves.map((move) => move.accountId)),
    [pendingMoves]
  );
  const pendingPoolIds = useMemo(() => {
    const set = new Set();

    pendingMoves.forEach((move) => {
      if (move.currentPoolId) {
        set.add(move.currentPoolId);
      }

      if (move.nextPoolId) {
        set.add(move.nextPoolId);
      }
    });

    return set;
  }, [pendingMoves]);
  const accountsByPoolId = useMemo(() => {
    const map = new Map([[UNASSIGNED_POOL_ID, []]]);

    pools.forEach((pool) => {
      map.set(getPoolId(pool), []);
    });

    accounts.forEach((account) => {
      const accountId = getAccountId(account);
      const persistedPoolId = persistedPoolByAccountId.get(accountId) || "";
      const effectivePoolId = draftMoves.has(accountId)
        ? draftMoves.get(accountId)
        : persistedPoolId;
      const targetPoolId =
        effectivePoolId && poolIdSet.has(effectivePoolId)
          ? effectivePoolId
          : UNASSIGNED_POOL_ID;

      if (!map.has(targetPoolId)) {
        map.set(targetPoolId, []);
      }

      map.get(targetPoolId).push(account);
    });

    map.forEach((poolAccounts, poolId) => {
      map.set(poolId, sortAccounts(poolAccounts));
    });

    return map;
  }, [accounts, draftMoves, persistedPoolByAccountId, poolIdSet, pools]);
  const filteredPools = useMemo(
    () =>
      [...pools]
        .sort((first, second) => {
          const tierCompare = normalizeText(first.tier).localeCompare(
            normalizeText(second.tier)
          );

          return (
            tierCompare || getPoolName(first).localeCompare(getPoolName(second))
          );
        })
        .filter((pool) => {
          if (poolMatchesKeyword(pool, normalizedKeyword)) {
            return true;
          }

          return (accountsByPoolId.get(getPoolId(pool)) || []).some((account) =>
            accountMatchesKeyword(account, normalizedKeyword)
          );
        }),
    [accountsByPoolId, normalizedKeyword, pools]
  );
  const unassignedAccounts = useMemo(
    () =>
      (accountsByPoolId.get(UNASSIGNED_POOL_ID) || []).filter((account) =>
        accountMatchesKeyword(account, normalizedKeyword)
      ),
    [accountsByPoolId, normalizedKeyword]
  );
  const assignedAccountCount =
    accounts.length - (accountsByPoolId.get(UNASSIGNED_POOL_ID) || []).length;
  const availableAccountCount = accounts.filter(
    (account) => normalizeSearch(account.status) === "available"
  ).length;

  useEffect(() => {
    setDraftMoves((currentMoves) => {
      let hasChanged = false;
      const nextMoves = new Map();

      currentMoves.forEach((nextPoolId, accountId) => {
        const currentPoolId = persistedPoolByAccountId.get(accountId) || "";

        if (!accountIdSet.has(accountId)) {
          hasChanged = true;
          return;
        }

        if (nextPoolId && !poolIdSet.has(nextPoolId)) {
          hasChanged = true;
          return;
        }

        if (currentPoolId === nextPoolId) {
          hasChanged = true;
          return;
        }

        nextMoves.set(accountId, nextPoolId);
      });

      return hasChanged ? nextMoves : currentMoves;
    });
  }, [accountIdSet, persistedPoolByAccountId, poolIdSet]);

  const startCreatePool = () => {
    setSelectedPoolId("");
    setPoolForm(createEmptyPoolForm());
    setPoolModalOpen(true);
  };

  const startEditPool = (pool) => {
    const poolId = getPoolId(pool);

    setSelectedPoolId(poolId);
    setPoolForm(createPoolForm(pool));
    setPoolModalOpen(true);
  };

  const closePoolModal = () => {
    if (isSaving) {
      return;
    }

    setPoolModalOpen(false);
  };

  const updatePoolField = (fieldKey, value) => {
    setPoolForm((currentForm) => ({
      ...currentForm,
      [fieldKey]: value,
    }));
  };

  const savePoolForm = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const record = {
      pool_name: normalizeText(poolForm.pool_name),
      poolName: normalizeText(poolForm.pool_name),
      tier: normalizeText(poolForm.tier || "A").toUpperCase(),
    };

    if (!record.pool_name) {
      showAdminAlert("Vui lòng nhập tên bể quà.");
      return;
    }

    setIsSaving(true);

    try {
      const savedPool = selectedPoolId
        ? await onUpdateGiftPool(record, selectedPoolId)
        : await onCreateGiftPool(record);
      const nextPool = {
        ...record,
        ...savedPool,
        pool_name: getPoolName(savedPool) || record.pool_name,
        tier: normalizeText(savedPool?.tier || record.tier),
      };
      const nextPoolId = getPoolId(nextPool) || selectedPoolId;

      onSaveRecord("giftPools", nextPool);
      setSelectedPoolId(nextPoolId);
      setPoolForm(createPoolForm(nextPool));
      setPoolModalOpen(false);
      showAdminAlert(selectedPoolId ? "Đã cập nhật bể quà." : "Đã tạo bể quà mới.");
    } catch (error) {
      showAdminAlert(error.message || "Không thể lưu bể quà.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePool = async (poolId = selectedPoolId) => {
    if (!poolId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onDeleteGiftPool(poolId);
      onDeleteRecord("giftPools", poolId);
      mappings
        .filter((mapping) => getMappingPoolId(mapping) === poolId)
        .forEach((mapping) =>
          onDeleteRecord("poolAccountMappings", getMappingId(mapping))
        );

      if (selectedPoolId === poolId) {
        setSelectedPoolId("");
        setPoolForm(createEmptyPoolForm());
        setPoolModalOpen(false);
      }

      showAdminAlert("Đã xóa bể quà.");
    } catch (error) {
      showAdminAlert(error.message || "Không thể xóa bể quà.");
    } finally {
      setIsSaving(false);
    }
  };

  const stageAccountMove = (accountId, targetPoolId) => {
    const nextPoolId = targetPoolId === UNASSIGNED_POOL_ID ? "" : targetPoolId;
    const currentPoolId = persistedPoolByAccountId.get(accountId) || "";

    if (!accountId || isSaving) {
      return;
    }

    setDraftMoves((currentMoves) => {
      const nextMoves = new Map(currentMoves);

      if (currentPoolId === nextPoolId) {
        nextMoves.delete(accountId);
      } else {
        nextMoves.set(accountId, nextPoolId);
      }

      return nextMoves;
    });
  };

  const saveDraftMoves = async () => {
    if (!pendingMoves.length || isSaving) {
      return;
    }

    const movesToSave = pendingMoves;

    setIsSaving(true);

    try {
      for (const move of movesToSave) {
        const currentMapping = mappingByAccountId.get(move.accountId);

        if (move.currentPoolId) {
          const removedMappings = await onRemovePoolAccount({
            pool_id: move.currentPoolId,
            account_id: move.accountId,
          });
          const records = Array.isArray(removedMappings)
            ? removedMappings
            : [currentMapping || removedMappings];

          records.filter(Boolean).forEach((mapping) => {
            onDeleteRecord("poolAccountMappings", getMappingId(mapping));
          });
        }

        if (move.nextPoolId) {
          const addedMappings = await onAddPoolAccount({
            pool_id: move.nextPoolId,
            account_id: move.accountId,
          });
          const records = Array.isArray(addedMappings)
            ? addedMappings
            : [addedMappings];

          records.filter(Boolean).forEach((mapping) => {
            onSaveRecord("poolAccountMappings", mapping);
          });
        }
      }

      setDraftMoves(new Map());
      showAdminAlert(`Đã lưu ${movesToSave.length} thay đổi account vào CSDL.`);
    } catch (error) {
      showAdminAlert(error.message || "Không thể lưu thay đổi account vào bể quà.");
    } finally {
      setIsSaving(false);
      setDraggingAccountId("");
      setDragOverPoolId("");
    }
  };

  const discardDraftMoves = () => {
    if (isSaving || !pendingMoves.length) {
      return;
    }

    setDraftMoves(new Map());
  };

  const handleDragStart = (event, accountId) => {
    setDraggingAccountId(accountId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ accountId })
    );
    event.dataTransfer.setData("text/plain", accountId);
  };

  const handleDragOver = (event, poolId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverPoolId(poolId);
  };

  const handleDrop = (event, poolId) => {
    event.preventDefault();
    const accountId = parseDragAccountId(event);

    stageAccountMove(accountId, poolId);
    setDraggingAccountId("");
    setDragOverPoolId("");
  };

  const handleDragEnd = () => {
    setDraggingAccountId("");
    setDragOverPoolId("");
  };

  return (
    <section className="admin-panel admin-pool-dnd-panel">
      <div className="admin-panel__head">
        <div>
          <h2>{panelTitle}</h2>
          <span>{panelDescription}</span>
        </div>
        <button type="button" className="admin-light-button" onClick={onResetTables}>
          <FaRotateLeft aria-hidden="true" />
          Khôi phục dữ liệu
        </button>
      </div>

      <div className="admin-pool-toolbar">
        <label>
          Tìm kiếm
          <input
            type="search"
            placeholder="Tìm bể, username, tier, trạng thái..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <div className="admin-pool-toolbar__actions">
          <button type="button" onClick={startCreatePool}>
            Thêm bể
          </button>
          <button
            type="button"
            className="admin-pool-save-draft-button"
            disabled={!pendingMoves.length || isSaving}
            onClick={saveDraftMoves}
          >
            <FaFloppyDisk aria-hidden="true" />
            {pendingMoves.length
              ? `Lưu ${pendingMoves.length} thay đổi`
              : "Đã lưu account"}
          </button>
          {pendingMoves.length ? (
            <button
              type="button"
              className="admin-light-button"
              disabled={isSaving}
              onClick={discardDraftMoves}
            >
              Hoàn tác
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-pool-summary" aria-label="Tổng quan bể quà">
        <article>
          <span>Bể quà</span>
          <strong>{pools.length}</strong>
        </article>
        <article>
          <span>Đã gán</span>
          <strong>{assignedAccountCount}</strong>
        </article>
        <article>
          <span>Chưa gán</span>
          <strong>{accounts.length - assignedAccountCount}</strong>
        </article>
        <article>
          <span>Available</span>
          <strong>{availableAccountCount}</strong>
        </article>
        <article className={pendingMoves.length ? "is-pending" : ""}>
          <span>Chưa lưu</span>
          <strong>{pendingMoves.length}</strong>
        </article>
      </div>

      <div className="admin-pool-layout admin-pool-layout--table">
        <section
          className={`admin-pool-source-table${
            dragOverPoolId === UNASSIGNED_POOL_ID ? " is-drag-over" : ""
          }`}
          onDragLeave={() => setDragOverPoolId("")}
          onDragOver={(event) => handleDragOver(event, UNASSIGNED_POOL_ID)}
          onDrop={(event) => handleDrop(event, UNASSIGNED_POOL_ID)}
        >
          <div className="admin-pool-column__head">
            <div>
              <span>Nguồn account</span>
              <strong>Chưa gán</strong>
            </div>
            <em>{unassignedAccounts.length}</em>
          </div>
          <PoolAccountTable
            accounts={unassignedAccounts}
            draggingAccountId={draggingAccountId}
            emptyMessage="Trống"
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            pendingAccountIds={pendingAccountIds}
          />
        </section>

        <section className="admin-pool-table-panel" aria-label="Danh sách bể quà">
          <div className="admin-table-wrap admin-pool-table-wrap">
            <table className="admin-table admin-pool-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Bể quà</th>
                  <th>Account kéo thả</th>
                  <th>Chưa lưu</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPools.length ? (
                  filteredPools.map((pool) => {
                    const poolId = getPoolId(pool);
                    const poolAccounts = (
                      accountsByPoolId.get(poolId) || []
                    ).filter(
                      (account) =>
                        poolMatchesKeyword(pool, normalizedKeyword) ||
                        accountMatchesKeyword(account, normalizedKeyword)
                    );
                    const pendingInPool = pendingMoves.filter(
                      (move) =>
                        move.currentPoolId === poolId ||
                        move.nextPoolId === poolId
                    ).length;
                    const isDragOver = dragOverPoolId === poolId;
                    const isSelected = selectedPoolId === poolId;
                    const isPending = pendingPoolIds.has(poolId);

                    return (
                      <tr
                        className={`admin-pool-table__row${
                          isDragOver ? " is-drag-over" : ""
                        }${isSelected ? " is-selected" : ""}${
                          isPending ? " is-pending" : ""
                        }`}
                        key={poolId}
                        onDragLeave={() => setDragOverPoolId("")}
                        onDragOver={(event) => handleDragOver(event, poolId)}
                        onDrop={(event) => handleDrop(event, poolId)}
                      >
                        <td>
                          <span className="admin-pool-tier-pill">
                            Tier {normalizeText(pool.tier || "-")}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-pool-table__title"
                            onClick={() => startEditPool(pool)}
                          >
                            <FaLayerGroup aria-hidden="true" />
                            <span>{getPoolName(pool) || "Bể chưa đặt tên"}</span>
                          </button>
                          <small className="admin-pool-table__id">
                            {poolId || "no-id"}
                          </small>
                        </td>
                        <td>
                          <PoolAccountTable
                            compact
                            accounts={poolAccounts}
                            draggingAccountId={draggingAccountId}
                            emptyMessage="Thả account vào hàng này"
                            onDragEnd={handleDragEnd}
                            onDragStart={handleDragStart}
                            pendingAccountIds={pendingAccountIds}
                          />
                        </td>
                        <td>
                          {pendingInPool ? (
                            <span className="admin-pool-draft-badge">
                              {pendingInPool} chưa lưu
                            </span>
                          ) : (
                            <span className="admin-pool-saved-badge">Đã lưu</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-pool-table__actions">
                            <button
                              type="button"
                              className="admin-mini-button"
                              onClick={() => startEditPool(pool)}
                            >
                              <FaPen aria-hidden="true" />
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-mini-button admin-danger-button"
                              disabled={isSaving}
                              onClick={() => deletePool(poolId)}
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
                    <td colSpan={5}>
                      <div className="admin-pool-empty-board">
                        <FaBoxOpen aria-hidden="true" />
                        <strong>Chưa có bể phù hợp</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isPoolModalOpen ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-pool-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-pool-editor-title"
          >
            <div className="admin-pool-editor admin-pool-editor--modal">
              <div className="admin-pool-editor__head">
                <div>
                  <strong id="admin-pool-editor-title">
                    {selectedPoolId ? "Sửa bể quà" : "Tạo bể quà"}
                  </strong>
                  <span>{selectedPoolId || "Bể mới"}</span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  aria-label="Đóng modal bể quà"
                  onClick={closePoolModal}
                >
                  <FaXmark aria-hidden="true" />
                  Đóng
                </button>
              </div>

              <form onSubmit={savePoolForm}>
                <label>
                  Tên bể
                  <input
                    type="text"
                    value={poolForm.pool_name}
                    onChange={(event) =>
                      updatePoolField("pool_name", event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Tier
                  <select
                    value={poolForm.tier}
                    onChange={(event) => updatePoolField("tier", event.target.value)}
                  >
                    {POOL_TIER_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-pool-editor__actions">
                  <button type="submit" disabled={isSaving}>
                    <FaFloppyDisk aria-hidden="true" />
                    {isSaving ? "Đang lưu..." : "Lưu bể"}
                  </button>
                  <button
                    type="button"
                    className="admin-danger-button"
                    disabled={!selectedPoolId || isSaving}
                    onClick={() => deletePool(selectedPoolId)}
                  >
                    <FaTrashCan aria-hidden="true" />
                    Xóa bể
                  </button>
                </div>
              </form>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}
    </section>
  );
}
