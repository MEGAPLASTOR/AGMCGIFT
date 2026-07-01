import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

export function useAdminClientPagination(rows, resetKey = "") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems ? (page - 1) * pageSize + 1 : 0;
  const endIndex = totalItems ? Math.min(totalItems, page * pageSize) : 0;

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;

    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  return {
    endIndex,
    page,
    pageRows,
    pageSize,
    setPage,
    setPageSize,
    startIndex,
    totalItems,
    totalPages,
  };
}
