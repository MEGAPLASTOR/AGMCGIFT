import { useEffect, useMemo, useState } from "react";
import {
  FaCloudArrowDown,
  FaLink,
  FaMagnifyingGlass,
  FaRotateRight,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";

const EMPTY_ROWS = [];
const EGG_TYPES = [
  {
    value: 1,
    label: "Trứng Loại 1 (Nhận ngay tài khoản cấp 1)",
  },
  {
    value: 2,
    label: "Trứng Loại 2 (Cần ấp đếm ngược nhận tài khoản cấp cao)",
  },
];

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

function getProductImage(product) {
  return normalizeText(product?.imageUrl || product?.image_url || product?.image);
}

function getMappingProductId(mapping) {
  return normalizeText(
    mapping?.kv_product_id || mapping?.kvProductId || mapping?.productId
  );
}

function getMappingId(mapping) {
  return normalizeText(mapping?.id) || `${getMappingProductId(mapping)}:${mapping?.egg_type}`;
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

function getEggTypeLabel(value) {
  const matchedType = EGG_TYPES.find((type) => Number(type.value) === Number(value));

  return matchedType?.label || `Trứng Loại ${value}`;
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

function buildMappingRecord(product, eggType, poolId) {
  const productId = getProductId(product);

  return {
    productId,
    kvProductId: productId,
    kv_product_id: productId,
    eggType: Number(eggType),
    egg_type: Number(eggType),
    poolId,
    pool_id: poolId,
    gift_pool_id: poolId,
  };
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
  tables,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedEggType, setSelectedEggType] = useState(1);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [message, setMessage] = useState("");
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
      map.set(
        productId,
        [...productMappings].sort(
          (left, right) => Number(left.egg_type || 0) - Number(right.egg_type || 0)
        )
      );
    });

    return map;
  }, [mappings]);

  const selectedProduct = selectedProductId
    ? productById.get(selectedProductId) || null
    : null;
  const selectedProductMappings = selectedProductId
    ? mappingsByProductId.get(selectedProductId) || EMPTY_ROWS
    : EMPTY_ROWS;
  const selectedExistingMapping = selectedProductMappings.find(
    (mapping) => Number(mapping.egg_type || 0) === Number(selectedEggType)
  );

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
          getProductName(product),
          product.fullName,
          product.basePrice,
          productMappings
            .map(
              (mapping) =>
                `${getEggTypeLabel(mapping.egg_type)} ${getMappingPoolLabel(
                  mapping,
                  poolById
                )}`
            )
            .join(" "),
        ]
          .map(normalizeKey)
          .join(" ");

        return searchText.includes(normalizedKeyword);
      }),
    [mappingsByProductId, normalizedKeyword, poolById, products]
  );

  useEffect(() => {
    if (!selectedPoolId && pools.length) {
      setSelectedPoolId(getPoolId(pools[0]));
    }
  }, [pools, selectedPoolId]);

  useEffect(() => {
    if (selectedExistingMapping?.gift_pool_id) {
      setSelectedPoolId(selectedExistingMapping.gift_pool_id);
    }
  }, [selectedExistingMapping]);

  const openMappingModal = (product, mapping) => {
    const productId = getProductId(product);
    const eggType = Number(mapping?.egg_type || 1);

    setSelectedProductId(productId);
    setSelectedEggType(eggType);
    setSelectedPoolId(mapping?.gift_pool_id || getPoolId(pools[0]) || "");
    setMessage("");
  };

  const closeMappingModal = () => {
    setSelectedProductId("");
    setSelectedEggType(1);
    setMessage("");
  };

  const saveMapping = async () => {
    if (!selectedProduct || !selectedPoolId || isSaving) {
      setMessage("Vui lòng chọn đủ sản phẩm, loại trứng và bể quà.");
      return;
    }

    setIsSaving(true);

    try {
      if (
        selectedExistingMapping &&
        selectedExistingMapping.gift_pool_id &&
        selectedExistingMapping.gift_pool_id === selectedPoolId
      ) {
        setMessage("Ánh xạ này đã tồn tại.");
        return;
      }

      if (
        selectedExistingMapping &&
        selectedExistingMapping.gift_pool_id &&
        selectedExistingMapping.gift_pool_id !== selectedPoolId
      ) {
        const mappingId = getMappingId(selectedExistingMapping);

        await onDeleteProductEggMapping?.(mappingId);
        onDeleteRecord?.("productEggMappings", mappingId);
      }

      const savedMapping = await onSaveProductEggMapping?.(
        buildMappingRecord(selectedProduct, selectedEggType, selectedPoolId)
      );

      if (savedMapping) {
        onSaveRecord?.("productEggMappings", savedMapping);
      }

      setMessage("Đã lưu ánh xạ sản phẩm - trứng.");
      closeMappingModal();
    } catch (error) {
      setMessage(error.message || "Không thể lưu ánh xạ sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMapping = async (mapping) => {
    const mappingId = getMappingId(mapping);

    if (!mappingId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onDeleteProductEggMapping?.(mappingId);
      onDeleteRecord?.("productEggMappings", mappingId);
      setMessage("Đã xóa ánh xạ sản phẩm.");
    } catch (error) {
      setMessage(error.message || "Không thể xóa ánh xạ sản phẩm.");
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
              <th>Tên Sản Phẩm</th>
              <th>Giá Gốc (VND)</th>
              <th>Cấu Hình Ánh Xạ Trứng (Game Rules)</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length ? (
              filteredProducts.map((product) => {
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
                      <strong>{getProductName(product) || "-"}</strong>
                    </td>
                    <td>{formatCurrency(product.basePrice)}</td>
                    <td>
                      {productMappings.length ? (
                        <div className="admin-product-mapping-list">
                          {productMappings.map((mapping) => (
                            <span key={getMappingId(mapping)}>
                              {getEggTypeLabel(mapping.egg_type)}
                              {" -> "}
                              {getMappingPoolLabel(mapping, poolById)}
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => deleteMapping(mapping)}
                              >
                                <FaTrashCan aria-hidden="true" />
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
                      <button
                        type="button"
                        className="admin-mini-button admin-product-link-button"
                        onClick={() => openMappingModal(product, productMappings[0])}
                      >
                        <FaLink aria-hidden="true" />
                        {productMappings.length ? "Sửa Ánh Xạ" : "Thêm Ánh Xạ"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>Không tìm thấy sản phẩm phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {message && !selectedProduct ? (
        <p className="admin-crud-message">{message}</p>
      ) : null}

      {selectedProduct ? (
        <div className="admin-modal-backdrop">
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
                    Tạo Ánh Xạ Sản Phẩm - Trứng
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
                  Loại trứng đẻ ra
                  <select
                    value={selectedEggType}
                    onChange={(event) => setSelectedEggType(Number(event.target.value))}
                  >
                    {EGG_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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

              {message ? <p className="admin-crud-message">{message}</p> : null}

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
        </div>
      ) : null}
    </section>
  );
}
