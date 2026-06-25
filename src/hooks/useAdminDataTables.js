import { useMemo, useState } from "react";
import {
  createAdminTableState,
  getRecordId,
} from "../services/adminCrudService";

// BACKEND_ADMIN_CRUD_DU_LIEU:
// Module CRUD hiện chỉ thao tác trên state trong trình duyệt, dữ liệu ban đầu lấy từ JSON.
// Backend cần thay các action này bằng API thật:
// GET danh sách, POST thêm, PUT/PATCH sửa, DELETE xóa theo từng bảng.
export function useAdminDataTables(sourceTables) {
  const [tables, setTables] = useState(() => createAdminTableState(sourceTables));

  const tableCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(tables)
          .filter(([, value]) => Array.isArray(value))
          .map(([key, value]) => [key, value.length])
      ),
    [tables]
  );

  const upsertRecord = (tableKey, record) => {
    setTables((currentTables) => {
      const rows = currentTables[tableKey] || [];
      const recordId = getRecordId(record, tableKey);
      const existingIndex = rows.findIndex(
        (row) => getRecordId(row, tableKey) === recordId
      );

      if (existingIndex === -1) {
        return {
          ...currentTables,
          [tableKey]: [record, ...rows],
        };
      }

      return {
        ...currentTables,
        [tableKey]: rows.map((row, index) =>
          index === existingIndex ? record : row
        ),
      };
    });
  };

  const deleteRecord = (tableKey, recordId) => {
    setTables((currentTables) => ({
      ...currentTables,
      [tableKey]: (currentTables[tableKey] || []).filter(
        (row) => getRecordId(row, tableKey) !== recordId
      ),
    }));
  };

  // BACKEND_ADMIN_IMPORT_ACCOUNT_EXCEL:
  // Frontend đang import gift_accounts và pool_account_mappings vào state tạm.
  // Backend cần thay bằng transaction: upload file -> validate -> insert accounts -> insert mappings.
  const importGiftAccounts = ({ accounts, mappings }) => {
    const existingAccountIds = new Set(
      (tables.giftAccounts || []).map((account) => account.id)
    );
    const existingMappingKeys = new Set(
      (tables.poolAccountMappings || []).map(
        (item) => `${item.pool_id}:${item.account_id}`
      )
    );
    const accountIdsForCount = new Set(existingAccountIds);
    const mappingKeysForCount = new Set(existingMappingKeys);
    const accountsImported = accounts.filter((account) => {
      if (accountIdsForCount.has(account.id)) {
        return false;
      }

      accountIdsForCount.add(account.id);
      return true;
    }).length;
    const mappingsImported = mappings.filter((mapping) => {
      const mappingKey = `${mapping.pool_id}:${mapping.account_id}`;

      if (mappingKeysForCount.has(mappingKey)) {
        return false;
      }

      mappingKeysForCount.add(mappingKey);
      return true;
    }).length;

    setTables((currentTables) => {
      const currentAccounts = currentTables.giftAccounts || [];
      const currentMappings = currentTables.poolAccountMappings || [];
      const accountIds = new Set(currentAccounts.map((account) => account.id));
      const accountUpdates = new Map();
      const nextAccounts = [...currentAccounts];
      const nextMappings = [...currentMappings];
      const mappingKeys = new Set(
        currentMappings.map((item) => `${item.pool_id}:${item.account_id}`)
      );

      accounts.forEach((account) => {
        if (accountIds.has(account.id)) {
          accountUpdates.set(account.id, account);
          return;
        }

        nextAccounts.unshift(account);
        accountIds.add(account.id);
      });

      mappings.forEach((mapping) => {
        const mappingKey = `${mapping.pool_id}:${mapping.account_id}`;

        if (mappingKeys.has(mappingKey)) {
          return;
        }

        nextMappings.unshift(mapping);
        mappingKeys.add(mappingKey);
      });

      return {
        ...currentTables,
        giftAccounts: nextAccounts.map((account) =>
          accountUpdates.has(account.id)
            ? { ...account, ...accountUpdates.get(account.id) }
            : account
        ),
        poolAccountMappings: nextMappings,
      };
    });

    return {
      accountsImported,
      mappingsImported,
    };
  };

  const resetTables = () => {
    setTables(createAdminTableState(sourceTables));
  };

  return {
    tables,
    tableCounts,
    upsertRecord,
    deleteRecord,
    importGiftAccounts,
    resetTables,
  };
}
