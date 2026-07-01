import { useMemo, useState } from "react";
import {
  FaCloudArrowDown,
  FaLink,
  FaMagnifyingGlass,
  FaPercent,
  FaRotateRight,
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

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function getProductId(product) {
  return normalizeText(
    product?.kvProductId ||
      product?.kv_product_id ||
      product?.productId ||
      product?.id
  );
}

function getProductName(product) {
  return normalizeText(product?.name || product?.fullName || product?.id);
}

function getProductSku(product) {
  return normalizeText(product?.sku || product?.code || product?.maSanPham);
}

function getProductImage(product) {
  return normalizeText(product?.imageUrl || product?.image_url || product?.image);
}

function getMappingProductId(mapping) {
  return normalizeText(
    mapping?.kv_product_id || mapping?.kvProductId || mapping?.productId
  );
}

function getMappingId(mapping) {
  return (
    normalizeText(mapping?.id) ||
    `${getMappingProductId(mapping)}:${normalizeText(
      mapping?.gift_pool_id || mapping?.poolId
    )}`
  );
}

function getPoolId(pool) {
  return normalizeText(pool?.id || pool?.gift_pool_id || pool?.poolId);
}

function getPoolName(pool) {
  return normalizeText(pool?.pool_name || pool?.poolName || pool?.name);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function getMappingRate(mapping) {
  return Number(mapping?.rate ?? mapping?.ratePercent ?? mapping?.rate_percent ?? 0);
}

function formatRate(value) {
  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "0%";
  }

  return `${rate.toFixed(1)}%`;
}

function getPoolLabel(pool) {
  const poolName = getPoolName(pool) || getPoolId(pool);
  const tier = normalizeText(pool?.tier);

  return tier ? `${poolName} (Tier ${tier})` : poolName;
}

function getMappingPoolLabel(mapping, poolById) {
  const poolId = normalizeText(mapping?.gift_pool_id || mapping?.poolId);
  const pool = poolById.get(poolId);
  const fallbackName = poolId || "Chưa chọn bể";
  const tier = normalizeText(mapping?.egg_tier || pool?.tier);

  return tier ? `${getPoolName(pool) || fallbackName} (Tier ${tier})` : fallbackName;
}

function buildMappingRecord(product, poolId) {
  const productId = getProductId(product);

  return {
    productId,
    kvProductId: productId,
    kv_product_id: productId,
    poolId,
    pool_id: poolId,
    gift_pool_id: poolId,
  };
}

function sortMappingsByPool(mappings) {
  return [...mappings].sort((left, right) => {
    const leftTier = normalizeText(left.egg_tier || left.eggTier);
    const rightTier = normalizeText(right.egg_tier || right.eggTier);
    const tierDiff = leftTier.localeCompare(rightTier, "vi");

    return tierDiff || getMappingId(left).localeCompare(getMappingId(right), "vi");
  });
}

export function AdminProductTablePanel({
  isRefreshing = false,
  isSyncingProducts = false,
  onDeleteProductEggMapping,
  onRefresh,
  onSaveProductEggMapping,
  onSaveRecord,
  onDeleteRecord,
  onSyncProducts,
  onUpdateProductEggMappingRates,
  tables,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [rateProductId, setRateProductId] = useState("");
  const [draftRates, setDraftRates] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const products = tables.products || EMPTY_ROWS;
  const mappings = tables.productEggMappings || EMPTY_ROWS;
  const pools = tables.giftPools || EMPTY_ROWS;
  const normalizedKeyword = normalizeKey(keyword);

  const productById = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const productId = getProductId(product);

      if (productId) {
        map.set(productId, product);
      }
    });

    return map;
  }, [products]);

  const poolById = useMemo(() => {
    const map = new Map();

    pools.forEach((pool) => {
      const poolId = getPoolId(pool);

      if (poolId) {
        map.set(poolId, pool);
      }
    });

    return map;
  }, [pools]);

  const mappingsByProductId = useMemo(() => {
    const map = new Map();

    mappings.forEach((mapping) => {
      const productId = getMappingProductId(mapping);

      if (!productId) {
        return;
      }

      if (!map.has(productId)) {
        map.set(productId, []);
      }

      map.get(productId).push(mapping);
    });

    map.forEach((productMappings, productId) => {
      map.set(productId, sortMappingsByPool(productMappings));
    });

    return map;
  }, [mappings]);

  const selectedProduct = selectedProductId
    ? productById.get(selectedProductId) || null
    : null;
  const selectedProductMappings = selectedProductId
    ? mappingsByProductId.get(selectedProductId) || EMPTY_ROWS
    : EMPTY_ROWS;
  const rateProduct = rateProductId ? productById.get(rateProductId) || null : null;
  const rateProductMappings = rateProductId
    ? mappingsByProductId.get(rateProductId) || EMPTY_ROWS
    : EMPTY_ROWS;

  const filteredProducts = useMemo(
    () =>
      [...products].filter((product) => {
        if (!normalizedKeyword) {
          return true;
        }

        const productId = getProductId(product);
        const productMappings = mappingsByProductId.get(productId) || EMPTY_ROWS;
        const searchText = [
          productId,
          getProductSku(product),
          getProductName(product),
          product.fullName,
          product.basePrice,
          productMappings
            .map(
              (mapping) =>
                `${getMappingPoolLabel(
                  mapping,
                  poolById
                )} ${formatRate(getMappingRate(mapping))}`
            )
            .join(" "),
        ]
          .map(normalizeKey)
          .join(" ");

        return searchText.includes(normalizedKeyword);
      }),
    [mappingsByProductId, normalizedKeyword, poolById, products]
  );
  const pagination = useAdminClientPagination(
    filteredProducts,
    `${keyword}|${products.length}|${mappings.length}`
  );
  const paginatedProducts = pagination.pageRows;

  const openMappingModal = (product, mapping) => {
    const productId = getProductId(product);

    setSelectedProductId(productId);
    setSelectedPoolId(mapping?.gift_pool_id || "");
  };

  const closeMappingModal = () => {
    setSelectedProductId("");
    setSelectedPoolId("");
  };

  const saveMapping = async () => {
    if (!selectedProduct || !selectedPoolId || isSaving) {
      showAdminAlert("Vui lòng chọn đủ sản phẩm và bể quà.");
      return;
    }

    setIsSaving(true);

    try {
      const hasSamePool = selectedProductMappings.some(
        (mapping) =>
          normalizeKey(mapping.gift_pool_id || mapping.poolId) ===
          normalizeKey(selectedPoolId)
      );

      if (hasSamePool) {
        showAdminAlert("Ánh xạ này đã tồn tại.");
        return;
      }

      const savedMapping = await onSaveProductEggMapping?.(
        buildMappingRecord(selectedProduct, selectedPoolId)
      );

      if (savedMapping) {
        onSaveRecord?.("productEggMappings", savedMapping);
      }

      showAdminAlert("Đã lưu ánh xạ sản phẩm - trứng.");
      closeMappingModal();
    } catch (error) {
      showAdminAlert(error.message || "Không thể lưu ánh xạ sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMapping = async (mapping) => {
    const mappingId = getMappingId(mapping);

    if (!mappingId || isSaving) {
      return;
    }

    if (!confirmAdminAction("Xác nhận xóa ánh xạ sản phẩm này?")) {
      return;
    }

    setIsSaving(true);

    try {
      await onDeleteProductEggMapping?.(mappingId);
      onDeleteRecord?.("productEggMappings", mappingId);
      showAdminAlert("Đã xóa ánh xạ sản phẩm.");
    } catch (error) {
      showAdminAlert(error.message || "Không thể xóa ánh xạ sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  };

  const openRateModal = (product, productMappings) => {
    const productId = getProductId(product);

    setRateProductId(productId);
    setDraftRates(
      Object.fromEntries(
        productMappings.map((mapping) => [
          getMappingId(mapping),
          String(getMappingRate(mapping)),
        ])
      )
    );
  };

  const closeRateModal = () => {
    setRateProductId("");
    setDraftRates({});
  };

  const saveRates = async () => {
    if (!rateProduct || !rateProductMappings.length || isSaving) {
      return;
    }

    const fallbackMappings = rateProductMappings.map((mapping) => ({
      ...mapping,
      rate: Number(draftRates[getMappingId(mapping)] ?? 0),
    }));
    const totalRate = fallbackMappings.reduce(
      (total, mapping) => total + getMappingRate(mapping),
      0
    );

    if (fallbackMappings.some((mapping) => !Number.isFinite(getMappingRate(mapping)))) {
      showAdminAlert("Tỉ lệ phải là số.");
      return;
    }

    if (Math.abs(totalRate - 100) > 0.01) {
      showAdminAlert("Tổng tỉ lệ phải bằng 100%.");
      return;
    }

    if (!confirmAdminAction("Xác nhận cập nhật tỉ lệ ánh xạ?")) {
      return;
    }

    setIsSaving(true);

    try {
      const savedMappings = await onUpdateProductEggMappingRates?.(
        getProductId(rateProduct),
        fallbackMappings
      );
      const rowsToSave = Array.isArray(savedMappings) && savedMappings.length
        ? savedMappings
        : fallbackMappings;

      rowsToSave.forEach((mapping) => {
        onSaveRecord?.("productEggMappings", mapping);
      });

      showAdminAlert("Đã cập nhật tỉ lệ ánh xạ.");
      closeRateModal();
    } catch (error) {
      showAdminAlert(error.message || "Không thể cập nhật tỉ lệ ánh xạ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-panel admin-product-manager-panel">
      <div className="admin-product-toolbar">
        <label className="admin-product-search">
          <FaMagnifyingGlass aria-hidden="true" />
          <span>Tìm kiếm</span>
          <input
            type="search"
            placeholder="Tìm theo tên SP, ID KiotViet..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <div className="admin-product-toolbar__actions">
          <button
            type="button"
            disabled={isSyncingProducts || isRefreshing}
            onClick={onSyncProducts}
          >
            <FaCloudArrowDown aria-hidden="true" />
            {isSyncingProducts ? "Đang đồng bộ" : "Đồng bộ từ KiotViet"}
          </button>
          <button
            type="button"
            className="admin-product-refresh-button"
            aria-label="Làm mới"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <FaRotateRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="admin-table-wrap admin-product-table-wrap">
        <table className="admin-table admin-product-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>ID KiotViet</th>
              <th>SKU</th>
              <th>Tên Sản Phẩm</th>
              <th>Giá Gốc (VND)</th>
              <th>Cấu Hình Ánh Xạ Trứng (Game Rules)</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length ? (
              paginatedProducts.map((product) => {
                const productId = getProductId(product);
                const imageUrl = getProductImage(product);
                const productMappings = mappingsByProductId.get(productId) || EMPTY_ROWS;

                return (
                  <tr key={productId || getProductName(product)}>
                    <td>
                      <div className="admin-product-image">
                        {imageUrl ? (
                          <img alt={getProductName(product)} src={imageUrl} />
                        ) : (
                          <span>SP</span>
                        )}
                      </div>
                    </td>
                    <td>{productId || "-"}</td>
                    <td>
                      <code className="admin-product-sku">
                        {getProductSku(product) || "-"}
                      </code>
                    </td>
                    <td>
                      <strong>{getProductName(product) || "-"}</strong>
                    </td>
                    <td>{formatCurrency(product.basePrice)}</td>
                    <td>
                      {productMappings.length ? (
                        <div className="admin-product-mapping-list">
                          {productMappings.map((mapping) => (
                            <span
                              className="admin-product-mapping-pill"
                              key={getMappingId(mapping)}
                            >
                              <strong>{getMappingPoolLabel(mapping, poolById)}</strong>
                              <small>{formatRate(getMappingRate(mapping))}</small>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => deleteMapping(mapping)}
                              >
                                <FaXmark aria-hidden="true" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-product-no-mapping">
                          Chưa thiết lập (Không phát sinh trứng khi mua SP này)
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-product-row-actions">
                        <button
                          type="button"
                          className="admin-mini-button admin-product-link-button"
                          onClick={() => openMappingModal(product)}
                        >
                          <FaLink aria-hidden="true" />
                          Thêm Ánh Xạ
                        </button>
                        <button
                          type="button"
                          className="admin-mini-button admin-product-link-button"
                          disabled={!productMappings.length}
                          onClick={() => openRateModal(product, productMappings)}
                        >
                          <FaPercent aria-hidden="true" />
                          Tỉ lệ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>Không tìm thấy sản phẩm phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminClientPagination itemLabel="sản phẩm" pagination={pagination} />

      {selectedProduct ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-product-mapping-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-mapping-title"
          >
            <div className="admin-product-mapping-editor">
              <div className="admin-record-editor__head">
                <div>
                  <strong id="admin-product-mapping-title">
                    Tạo Ánh Xạ Sản Phẩm - Bể Quà
                  </strong>
                  <span>{getProductId(selectedProduct)}</span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  aria-label="Đóng modal ánh xạ sản phẩm"
                  onClick={closeMappingModal}
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>

              <div className="admin-product-mapping-form">
                <label>
                  Sản phẩm chọn
                  <input type="text" readOnly value={getProductName(selectedProduct)} />
                </label>
                <label>
                  Bể quà tặng liên kết
                  <select
                    value={selectedPoolId}
                    onChange={(event) => setSelectedPoolId(event.target.value)}
                  >
                    <option value="">Chọn bể quà tương ứng...</option>
                    {pools.map((pool) => {
                      const poolId = getPoolId(pool);

                      return (
                        <option key={poolId} value={poolId}>
                          {getPoolLabel(pool)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div className="admin-crud-actions admin-product-mapping-actions">
                <button
                  type="button"
                  className="admin-light-button"
                  disabled={isSaving}
                  onClick={closeMappingModal}
                >
                  Hủy
                </button>
                <button type="button" disabled={isSaving} onClick={saveMapping}>
                  {isSaving ? "Đang lưu..." : "Tạo liên kết"}
                </button>
              </div>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}

      {rateProduct ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-product-mapping-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-rate-title"
          >
            <div className="admin-product-mapping-editor">
              <div className="admin-record-editor__head">
                <div>
                  <strong id="admin-product-rate-title">
                    Chỉnh Tỉ Lệ Ánh Xạ
                  </strong>
                  <span>{getProductId(rateProduct)}</span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  aria-label="Đóng modal tỉ lệ ánh xạ"
                  onClick={closeRateModal}
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>

              <div className="admin-product-mapping-form">
                {rateProductMappings.map((mapping) => {
                  const mappingId = getMappingId(mapping);

                  return (
                    <label key={mappingId}>
                      {getMappingPoolLabel(mapping, poolById)}
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={draftRates[mappingId] ?? ""}
                        onChange={(event) =>
                          setDraftRates((currentRates) => ({
                            ...currentRates,
                            [mappingId]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>

              <p className="admin-product-rate-total">
                Tổng:{" "}
                {formatRate(
                  rateProductMappings.reduce(
                    (total, mapping) =>
                      total + Number(draftRates[getMappingId(mapping)] || 0),
                    0
                  )
                )}
              </p>

              <div className="admin-crud-actions admin-product-mapping-actions">
                <button
                  type="button"
                  className="admin-light-button"
                  disabled={isSaving}
                  onClick={closeRateModal}
                >
                  Hủy
                </button>
                <button type="button" disabled={isSaving} onClick={saveRates}>
                  {isSaving ? "Đang lưu..." : "Lưu tỉ lệ"}
                </button>
              </div>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}
    </section>
  );
}
