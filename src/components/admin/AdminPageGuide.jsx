import { FaCircleInfo } from "react-icons/fa6";

function GuideSection({ title, items }) {
  return (
    <article className="admin-page-guide__section">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

const GUIDE_CONTENT = {
  overview: {
    title: "Hướng dẫn nhanh",
    intro:
      "Đây là màn tổng quan để xem nhanh tình hình đơn hàng, khách hàng, trứng và kho quà.",
    sections: [
      {
        title: "Bạn nên dùng màn này khi nào",
        items: [
          "Muốn xem nhanh hôm nay hệ thống đang có bao nhiêu đơn, bao nhiêu trứng, còn bao nhiêu account trong kho.",
          "Muốn phát hiện sớm khu vực nào đang cần xử lý, ví dụ khách bị cảnh báo nhiều, trứng chờ lâu hoặc kho account sắp hết.",
        ],
      },
      {
        title: "Cách hiểu các số liệu",
        items: [
          <>
            <code>Paid</code> là đơn đã đủ điều kiện đi tiếp, <code>Pending</code> là đơn còn chờ,
            <code>Cancel</code> là đơn không dùng để phát quà.
          </>,
          <>
            <code>Sẵn sàng</code> là trứng có thể mở, <code>Đang ấp</code> là trứng vẫn còn thời gian chờ.
          </>,
          <>
            <code>Acc còn kho</code> là số tài khoản còn có thể dùng để cấp quà.
          </>,
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Sau khi bạn vừa sửa dữ liệu ở màn khác, số liệu tổng quan có thể cập nhật chậm một chút. Nếu cần, hãy bấm làm mới.",
          "Nếu một thẻ số liệu trống bất thường, nên kiểm tra lại quyền đăng nhập hoặc thử tải lại dữ liệu.",
        ],
      },
    ],
  },
  accounts: {
    title: "Hướng dẫn kho account",
    intro:
      "Màn này dùng để nhập tài khoản quà, theo dõi tồn kho và cập nhật trạng thái từng account.",
    sections: [
      {
        title: "Bạn có thể làm gì ở đây",
        items: [
          "Thêm từng account thủ công hoặc tải nhiều account lên bằng file Excel.",
          "Kiểm tra account nào còn trong kho, account nào đã được giữ chỗ hoặc đã dùng.",
        ],
      },
      {
        title: "Cách hiểu trạng thái",
        items: [
          <>
            <code>AVAILABLE</code> là còn trong kho và có thể dùng.
          </>,
          <>
            <code>ASSIGNED</code> hoặc <code>RESERVED</code> là đã được giữ lại cho một luồng xử lý nào đó.
          </>,
          <>
            <code>USED</code> là đã cấp xong, không dùng lại.
          </>,
        ],
      },
      {
        title: "Lưu ý khi nhập Excel",
        items: [
          "File cần đúng mẫu để hệ thống đọc được đầy đủ tài khoản.",
          "Nên tách đúng hạng quà theo từng dòng để tránh cấp sai loại account.",
          "Sau khi tải file lên, kiểm tra lại số lượng và trạng thái để chắc dữ liệu đã vào đúng.",
        ],
      },
    ],
  },
  pools: {
    title: "Hướng dẫn bể quà",
    intro:
      "Màn này dùng để gom account thành từng bể quà theo hạng, giúp phát quà đúng nhóm.",
    sections: [
      {
        title: "Bạn có thể làm gì ở đây",
        items: [
          "Tạo bể quà mới, đổi tên bể quà hoặc xóa bể quà không còn dùng.",
          "Thêm account vào bể hoặc gỡ account ra khỏi bể khi cần cân lại kho.",
        ],
      },
      {
        title: "Cách sắp đúng",
        items: [
          "Mỗi bể nên chứa account cùng hạng để tránh phát nhầm phần thưởng.",
          "Chỉ nên đưa account còn dùng được vào bể quà đang hoạt động.",
          "Nếu số lượng trong bể chưa đúng sau khi thao tác, hãy làm mới để xem lại dữ liệu mới nhất.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Không nên xóa bể đang còn account quan trọng nếu chưa chuyển chúng sang bể khác.",
          "Khi thiếu account đúng hạng, nên bổ sung kho trước rồi mới ghép vào bể.",
        ],
      },
    ],
  },
  customers: {
    title: "Hướng dẫn khách hàng",
    intro:
      "Màn này giúp bạn theo dõi mức độ rủi ro của khách hàng và xử lý cảnh báo hoặc khóa tài khoản khi cần.",
    sections: [
      {
        title: "Cách hiểu trạng thái",
        items: [
          <>
            <code>NORMAL</code> là khách đang hoạt động bình thường.
          </>,
          <>
            <code>WARNING</code> là khách cần theo dõi thêm.
          </>,
          <>
            <code>TEMP_BANNED</code> là tạm khóa đến một thời điểm cụ thể.
          </>,
          <>
            <code>BANNED</code> là khóa hẳn.
          </>,
        ],
      },
      {
        title: "Các số liệu nên nhìn",
        items: [
          "Tổng hoàn/hủy cho biết khách đã có bao nhiêu lần phát sinh vấn đề trước đó.",
          "Tổng cảnh báo cho biết khách đã từng bị nhắc bao nhiêu lần.",
          "Mở lại lúc chỉ có ý nghĩa khi khách đang ở trạng thái tạm khóa.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Hai ô tổng hoàn/hủy và tổng cảnh báo là dữ liệu để tham khảo, không sửa trực tiếp tại đây.",
          "Khi đổi trạng thái khách, nên xem cả lịch sử mua và tình trạng hiện tại trước khi lưu.",
        ],
      },
    ],
  },
  "system-configs": {
    title: "Hướng dẫn cấu hình",
    intro:
      "Màn này dùng để chỉnh quy tắc xử lý khách vi phạm, áp dụng cho toàn bộ hệ thống admin.",
    sections: [
      {
        title: "Ý nghĩa các mục",
        items: [
          <>
            <code>BAN_DAY</code> là số ngày tạm khóa khi khách vi phạm.
          </>,
          <>
            <code>PERMANENT_BAN</code> quyết định có nâng lên khóa hẳn hay không khi tái phạm đủ điều kiện.
          </>,
        ],
      },
      {
        title: "Khi nào nên chỉnh",
        items: [
          "Khi bạn muốn siết chặt hoặc nới lỏng thời gian xử lý khách có dấu hiệu lạm dụng.",
          "Khi có thay đổi về chính sách vận hành và cần áp dụng thống nhất cho admin.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Sau khi lưu, nên kiểm tra lại màn khách hàng để chắc cách hiển thị đang đúng như mong muốn.",
          "Chỉ nên chỉnh khi bạn hiểu rõ tác động của quy tắc mới lên các lần xử lý sau đó.",
        ],
      },
    ],
  },
  eggs: {
    title: "Hướng dẫn trứng",
    intro:
      "Màn này giúp bạn theo dõi từng trứng đang ở giai đoạn nào và chỉnh lại thời gian mở khi cần.",
    sections: [
      {
        title: "Cách hiểu loại trứng",
        items: [
          "Trứng mở ngay là loại có thể nhận thưởng sớm hơn.",
          "Trứng ấp là loại cần chờ đến đúng thời gian mới mở được.",
        ],
      },
      {
        title: "Cách hiểu trạng thái",
        items: [
          <>
            <code>ready</code> là đã có thể mở.
          </>,
          <>
            <code>incubating</code> là vẫn còn đang chờ mở.
          </>,
          <>
            <code>claimed</code> là đã nhận thưởng.
          </>,
          <>
            <code>cancelled</code> là không còn hiệu lực.
          </>,
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Khi đổi thời gian mở, bạn đang thay đổi lúc trứng được phép nhận thưởng.",
          "Nếu chọn thời gian bằng hoặc sớm hơn hiện tại, trứng có thể chuyển sang trạng thái sẵn sàng rất nhanh.",
        ],
      },
    ],
  },
  "early-hatch": {
    title: "Hướng dẫn duyệt sớm",
    intro:
      "Màn này dùng để rút ngắn thời gian chờ cho những trứng đã đủ điều kiện duyệt sớm.",
    sections: [
      {
        title: "Màn này hoạt động thế nào",
        items: [
          "Chỉ những trứng đủ điều kiện mới xuất hiện trong danh sách này.",
          "Mỗi lần duyệt sẽ giảm thời gian chờ của một trứng đi 3 ngày.",
          "Mỗi lần duyệt cũng sẽ trừ 1 lượt duyệt sớm của khách.",
        ],
      },
      {
        title: "Khi nào nên duyệt",
        items: [
          "Khi khách còn lượt duyệt sớm và trứng đó thực sự cần được ưu tiên xử lý.",
          "Khi bạn đã kiểm tra đúng khách, đúng đơn và đúng quả trứng cần duyệt.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Nếu sau khi duyệt mà thời gian mở đã tới, trứng có thể chuyển sang trạng thái sẵn sàng.",
          "Nếu danh sách đang trống, thường là hiện tại chưa có trứng nào đủ điều kiện.",
        ],
      },
    ],
  },
  products: {
    title: "Hướng dẫn sản phẩm",
    intro:
      "Màn này dùng để quản lý danh sách sản phẩm và nối từng sản phẩm với loại quà tương ứng.",
    sections: [
      {
        title: "Bạn có thể làm gì ở đây",
        items: [
          "Làm mới danh sách sản phẩm khi cần cập nhật hàng mới.",
          "Gắn sản phẩm với đúng loại trứng hoặc đúng bể quà để hệ thống phát đúng thưởng.",
        ],
      },
      {
        title: "Cách hiểu mapping",
        items: [
          "Mapping là quy tắc nối sản phẩm với phần quà sẽ được phát.",
          "Nếu sản phẩm chưa có mapping phù hợp, sản phẩm đó có thể không phát được quà đúng như mong muốn.",
          "Tỉ lệ phát dùng để điều chỉnh mức ưu tiên giữa các lựa chọn quà cùng một sản phẩm.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Sau khi đổi mapping hoặc tỉ lệ, nên kiểm tra lại để chắc sản phẩm đang trỏ đúng quà.",
          "Nếu sản phẩm đã có trong danh sách nhưng phát quà sai, hãy kiểm tra lại mapping trước tiên.",
        ],
      },
    ],
  },
  orders: {
    title: "Hướng dẫn đơn hàng",
    intro:
      "Màn này chủ yếu để kiểm tra tình trạng đơn hàng và đối chiếu xem đơn có đủ điều kiện nhận quà hay chưa.",
    sections: [
      {
        title: "Cách hiểu trạng thái",
        items: [
          <>
            <code>Paid</code> là đơn đã đủ điều kiện đi tiếp.
          </>,
          <>
            <code>Pending</code> là đơn còn đang chờ xử lý hoặc chưa đủ điều kiện.
          </>,
          <>
            <code>Cancel</code> là đơn không dùng để phát quà.
          </>,
        ],
      },
      {
        title: "Bạn nên kiểm tra gì",
        items: [
          "Đối chiếu mã đơn, khách hàng, sản phẩm và trạng thái hiện tại trước khi xử lý các bước liên quan đến quà.",
          "Ưu tiên xem các đơn đang chờ lâu hoặc các đơn bị chặn để xử lý kịp thời.",
        ],
      },
      {
        title: "Lưu ý",
        items: [
          "Màn này thiên về theo dõi, không phải nơi để sửa trực tiếp thông tin gốc của đơn hàng.",
          "Nếu trạng thái đơn chưa đúng như mong đợi, hãy bấm làm mới rồi kiểm tra lại sau.",
        ],
      },
    ],
  },
};

export function AdminPageGuide({ action = null, pageKey }) {
  const guide = GUIDE_CONTENT[pageKey];

  if (!guide) {
    return null;
  }

  return (
    <section className="admin-page-guide">
      <strong>
        <FaCircleInfo aria-hidden="true" />
        {guide.title}
      </strong>
      <p className="admin-page-guide__intro">{guide.intro}</p>
      <div className="admin-page-guide__grid">
        {guide.sections.map((section) => (
          <GuideSection items={section.items} key={section.title} title={section.title} />
        ))}
      </div>
      {action ? <div className="admin-page-guide__action">{action}</div> : null}
    </section>
  );
}
