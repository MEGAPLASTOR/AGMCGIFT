export function AccountRewardCard({ reward, account }) {
  const accountInfo = account || reward;

  return (
    <div className="account-reward">
      <div className="account-reward__head">
        <span className="account-reward__icon" aria-hidden="true">
          OK
        </span>
        <div>
          <span>Acc nhận được</span>
          <strong>
            {accountInfo.tenAcc ||
              accountInfo.tenPhanThuong ||
              "Acc Blox Fruit"}
          </strong>
        </div>
      </div>

      <dl className="account-reward__grid">
        <div>
          <dt>Tài khoản</dt>
          <dd>{accountInfo.taiKhoan}</dd>
        </div>
        <div>
          <dt>Mật khẩu</dt>
          <dd>{accountInfo.matKhau}</dd>
        </div>
        {accountInfo.ghiChu ? (
          <div className="account-reward__note">
            <dt>Ghi chú</dt>
            <dd>{accountInfo.ghiChu}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
