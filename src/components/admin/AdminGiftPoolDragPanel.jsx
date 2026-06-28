import { useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCirclePlus,
  FaFloppyDisk,
  FaGripVertical,
  FaLayerGroup,
  FaPen,
  FaRotateLeft,
  FaTrashCan,
} from "react-icons/fa6";

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

function PoolAccountCard({ account, isDragging, onDragEnd, onDragStart }) {
  const accountId = getAccountId(account);
  const tier = normalizeText(account.tier || "-");
  const status = normalizeText(account.status || "-");

  return (
    <article
      className={`admin-pool-account-card${isDragging ? " is-dragging" : ""}`}
      draggable
      role="listitem"
      tabIndex={0}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, accountId)}
    >
      <FaGripVertical aria-hidden="true" />
      <div>
        <strong>{getAccountName(account)}</strong>
        <span>{accountId || "no-id"}</span>
      </div>
      <em>{tier}</em>
      <small>{status}</small>
    </article>
  );
}

export function AdminGiftPoolDragPanel({
  activeTableKey,
  panelTitle = "Quản lý bể quà",
  panelDescription = "Tạo bể quà và kéo account vào từng bể để đồng bộ nguồn phát thưởng.",
  visibleTables,
  tableCounts,
  tables,
  onTableChange,
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
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggingAccountId, setDraggingAccountId] = useState("");
  const [dragOverPoolId, setDragOverPoolId] = useState("");

  const pools = tables.giftPools || EMPTY_ROWS;
  const accounts = tables.giftAccounts || EMPTY_ROWS;
  const mappings = tables.poolAccountMappings || EMPTY_ROWS;
  const normalizedKeyword = normalizeSearch(keyword);
  const poolIdSet = useMemo(
    () => new Set(pools.map(getPoolId).filter(Boolean)),
    [pools]
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
  const accountsByPoolId = useMemo(() => {
    const map = new Map([[UNASSIGNED_POOL_ID, []]]);

    pools.forEach((pool) => {
      map.set(getPoolId(pool), []);
    });

    accounts.forEach((account) => {
      const accountId = getAccountId(account);
      const mapping = mappingByAccountId.get(accountId);
      const poolId = getMappingPoolId(mapping);
      const targetPoolId =
        poolId && poolIdSet.has(poolId) ? poolId : UNASSIGNED_POOL_ID;

      if (!map.has(targetPoolId)) {
        map.set(targetPoolId, []);
      }

      map.get(targetPoolId).push(account);
    });

    map.forEach((poolAccounts, poolId) => {
      map.set(poolId, sortAccounts(poolAccounts));
    });

    return map;
  }, [accounts, mappingByAccountId, poolIdSet, pools]);
  const filteredPools = useMemo(
    () =>
      [...pools]
        .sort((first, second) => {
          const tierCompare = normalizeText(first.tier).localeCompare(
            normalizeText(second.tier)
          );

          return tierCompare || getPoolName(first).localeCompare(getPoolName(second));
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
  const assignedAccountCount = accounts.length - (accountsByPoolId.get(UNASSIGNED_POOL_ID) || []).length;
  const availableAccountCount = accounts.filter(
    (account) => normalizeSearch(account.status) === "available"
  ).length;

  const startCreatePool = () => {
    setSelectedPoolId("");
    setPoolForm(createEmptyPoolForm());
    setMessage("Đang tạo bể quà mới.");
  };

  const startEditPool = (pool) => {
    setSelectedPoolId(getPoolId(pool));
    setPoolForm(createPoolForm(pool));
    setMessage("Đang chỉnh sửa bể quà đã chọn.");
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
      setMessage("Vui lòng nhập tên bể quà.");
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
      setMessage(
        selectedPoolId ? "Đã cập nhật bể quà." : "Đã tạo bể quà mới."
      );
    } catch (error) {
      setMessage(error.message || "Không thể lưu bể quà.");
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
      }

      setMessage("Đã xóa bể quà.");
    } catch (error) {
      setMessage(error.message || "Không thể xóa bể quà.");
    } finally {
      setIsSaving(false);
    }
  };

  const moveAccountToPool = async (accountId, targetPoolId) => {
    const currentMapping = mappingByAccountId.get(accountId);
    const currentPoolId = getMappingPoolId(currentMapping);
    const nextPoolId = targetPoolId === UNASSIGNED_POOL_ID ? "" : targetPoolId;

    if (!accountId || currentPoolId === nextPoolId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (currentPoolId) {
        const removedMappings = await onRemovePoolAccount({
          pool_id: currentPoolId,
          account_id: accountId,
        });
        const records = Array.isArray(removedMappings)
          ? removedMappings
          : [currentMapping || removedMappings];

        records.filter(Boolean).forEach((mapping) => {
          onDeleteRecord("poolAccountMappings", getMappingId(mapping));
        });
      }

      if (nextPoolId) {
        const addedMappings = await onAddPoolAccount({
          pool_id: nextPoolId,
          account_id: accountId,
        });
        const records = Array.isArray(addedMappings)
          ? addedMappings
          : [addedMappings];

        records.filter(Boolean).forEach((mapping) => {
          onSaveRecord("poolAccountMappings", mapping);
        });
      }

      setMessage(
        nextPoolId
          ? "Đã gán account vào bể quà."
          : "Đã gỡ account khỏi bể quà."
      );
    } catch (error) {
      setMessage(error.message || "Không thể cập nhật account trong bể quà.");
    } finally {
      setIsSaving(false);
      setDraggingAccountId("");
      setDragOverPoolId("");
    }
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

    moveAccountToPool(accountId, poolId);
  };

  const renderAccountList = (poolAccounts) => {
    if (!poolAccounts.length) {
      return (
        <div className="admin-pool-empty-drop">
          <FaBoxOpen aria-hidden="true" />
          <span>Trống</span>
        </div>
      );
    }

    return poolAccounts.map((account) => {
      const accountId = getAccountId(account);

      return (
        <PoolAccountCard
          account={account}
          isDragging={draggingAccountId === accountId}
          key={accountId}
          onDragEnd={() => {
            setDraggingAccountId("");
            setDragOverPoolId("");
          }}
          onDragStart={handleDragStart}
        />
      );
    });
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
          Chuyển trang quản lý
          <select
            value={activeTableKey}
            onChange={(event) => onTableChange(event.target.value)}
          >
            {visibleTables.map((table) => (
              <option key={table.key} value={table.key}>
                {table.label} ({tableCounts[table.key] || 0})
              </option>
            ))}
          </select>
        </label>
        <label>
          Tìm kiếm
          <input
            type="search"
            placeholder="Tìm bể, username, tier, trạng thái..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <button type="button" onClick={startCreatePool}>
          <FaCirclePlus aria-hidden="true" />
          Thêm bể
        </button>
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
      </div>

      {message ? <p className="admin-pool-message">{message}</p> : null}

      <div className="admin-pool-layout">
        <section
          className={`admin-pool-column admin-pool-column--source${
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
          <div className="admin-pool-card-list" role="list">
            {renderAccountList(unassignedAccounts)}
          </div>
        </section>

        <div className="admin-pool-board" aria-label="Danh sách bể quà">
          {filteredPools.length ? (
            filteredPools.map((pool) => {
              const poolId = getPoolId(pool);
              const poolAccounts = (accountsByPoolId.get(poolId) || []).filter(
                (account) =>
                  poolMatchesKeyword(pool, normalizedKeyword) ||
                  accountMatchesKeyword(account, normalizedKeyword)
              );

              return (
                <section
                  className={`admin-pool-column${
                    selectedPoolId === poolId ? " is-selected" : ""
                  }${dragOverPoolId === poolId ? " is-drag-over" : ""}`}
                  key={poolId}
                  onDragLeave={() => setDragOverPoolId("")}
                  onDragOver={(event) => handleDragOver(event, poolId)}
                  onDrop={(event) => handleDrop(event, poolId)}
                >
                  <div className="admin-pool-column__head">
                    <button type="button" onClick={() => startEditPool(pool)}>
                      <FaLayerGroup aria-hidden="true" />
                      <div>
                        <span>Tier {normalizeText(pool.tier || "-")}</span>
                        <strong>{getPoolName(pool) || "Bể chưa đặt tên"}</strong>
                      </div>
                    </button>
                    <em>{poolAccounts.length}</em>
                  </div>
                  <div className="admin-pool-column__actions">
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
                  <div className="admin-pool-card-list" role="list">
                    {renderAccountList(poolAccounts)}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="admin-pool-empty-board">
              <FaBoxOpen aria-hidden="true" />
              <strong>Chưa có bể phù hợp</strong>
            </div>
          )}
        </div>

        <aside className="admin-pool-editor">
          <div className="admin-pool-editor__head">
            <div>
              <strong>{selectedPoolId ? "Sửa bể quà" : "Tạo bể quà"}</strong>
              <span>{selectedPoolId || "Bể mới"}</span>
            </div>
            <button type="button" className="admin-light-button" onClick={startCreatePool}>
              <FaCirclePlus aria-hidden="true" />
              Mới
            </button>
          </div>

          <form onSubmit={savePoolForm}>
            <label>
              Tên bể
              <input
                type="text"
                value={poolForm.pool_name}
                onChange={(event) => updatePoolField("pool_name", event.target.value)}
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
        </aside>
      </div>
    </section>
  );
}
