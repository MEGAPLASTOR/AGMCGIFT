const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function AdminClientPagination({
  itemLabel = "bản ghi",
  pagination,
}) {
  const {
    endIndex,
    page,
    pageSize,
    setPage,
    setPageSize,
    startIndex,
    totalItems,
    totalPages,
  } = pagination;

  return (
    <div className="admin-pagination">
      <span className="admin-pagination__summary">
        {totalItems
          ? `${startIndex}-${endIndex} / ${totalItems} ${itemLabel}`
          : `0 ${itemLabel}`}
      </span>
      <label className="admin-pagination__size">
        <span>Mỗi trang</span>
        <select
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="admin-pagination__actions">
        <button
          type="button"
          className="admin-light-button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Trước
        </button>
        <strong>
          {page}/{totalPages}
        </strong>
        <button
          type="button"
          className="admin-light-button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
