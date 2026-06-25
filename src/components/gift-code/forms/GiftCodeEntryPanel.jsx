import { GIFT_CODE_STATUS } from "../../../constants/giftCodeStatus";

export function GiftCodeEntryPanel({
  inputValue,
  status,
  errorMsg,
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
          placeholder="Ví dụ: SAPO-TOY-1001"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          aria-label="Nhập mã đơn hàng"
        />
        <button type="submit">Kiểm tra mã đơn</button>
      </form>

      {status === GIFT_CODE_STATUS.invalid && (
        <p className="message message--error">{errorMsg}</p>
      )}
    </section>
  );
}
