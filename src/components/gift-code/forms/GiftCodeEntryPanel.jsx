import { GIFT_CODE_STATUS } from "../../../constants/giftCodeStatus";

export function GiftCodeEntryPanel({
  inputValue,
  status,
  errorMsg,
  isLoading = false,
  onInputChange,
  onSubmit,
}) {
  return (
    <section className="gift-panel gift-panel--code-entry">
      <div className="code-entry-header">
        <div>
          <span>Mã đơn hàng</span>
          <strong>Nhập mã đơn để mở lượt chọn trứng</strong>
        </div>
        <div className="code-entry-status" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <form className="code-form" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Ví dụ: DHSPE_260622PSYR4BHX"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          aria-label="Nhập mã đơn hàng"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Đang kiểm tra..." : "Kiểm tra mã đơn"}
        </button>
      </form>

      {status === GIFT_CODE_STATUS.invalid && (
        <p className="message message--error">{errorMsg}</p>
      )}
    </section>
  );
}
