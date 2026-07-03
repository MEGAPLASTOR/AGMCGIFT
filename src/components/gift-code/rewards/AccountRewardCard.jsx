export function AccountRewardCard({ reward, account, title = "Acc nhận được" }) {
  const accountInfo = account || reward || {};
  const accountName =
    accountInfo.tenAcc || accountInfo.tenPhanThuong || accountInfo.platform;
  const username = accountInfo.taiKhoan || accountInfo.username;
  const password = accountInfo.matKhau || accountInfo.password;
  const tier = accountInfo.tier;
  const note = accountInfo.ghiChu || accountInfo.message;

  return (
    <div className="account-reward">
      <div className="account-reward__head">
        <span className="account-reward__icon" aria-hidden="true">
          OK
        </span>
        <div>
          <span>{title}</span>
          <strong>{accountName || "Acc Blox Fruit"}</strong>
        </div>
      </div>

      <dl className="account-reward__grid">
        <div>
          <dt>Tài khoản</dt>
          <dd>{username}</dd>
        </div>
        <div>
          <dt>Mật khẩu</dt>
          <dd>{password}</dd>
        </div>
        {accountInfo.platform ? (
          <div>
            <dt>Nền tảng</dt>
            <dd>{accountInfo.platform}</dd>
          </div>
        ) : null}
        {tier ? (
          <div>
            <dt>Tier</dt>
            <dd>{tier}</dd>
          </div>
        ) : null}
        {note ? (
          <div className="account-reward__note">
            <dt>Ghi chú</dt>
            <dd>{note}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
