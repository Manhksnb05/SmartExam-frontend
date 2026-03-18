import { useState } from "react";
import { Icons, Icon } from "../constants.jsx";
import { useMobile } from "../hooks/useMobile.js";

function Footer() {
  const [openPage, setOpenPage] = useState(null);
  const isMobile = useMobile(640);

  const CONTENT = {
    "Ngân hàng đề thi": { icon: "🏦", title: "Ngân hàng đề thi", body: `SmartExam sở hữu kho đề thi phong phú với hàng nghìn câu hỏi được biên soạn và kiểm duyệt kỹ lưỡng bởi đội ngũ giáo viên có kinh nghiệm trên toàn quốc.\n\n**Đặc điểm nổi bật:**\n• Hơn 10.000+ câu hỏi trải dài các môn: Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa\n• Phân loại theo cấp độ: Nhận biết · Thông hiểu · Vận dụng · Vận dụng cao\n• Cập nhật liên tục theo chương trình GDPT 2018\n• Đề thi thử THPT Quốc gia từ các trường chuyên trên toàn quốc` },
    "Tạo đề AI": { icon: "✨", title: "Tạo đề thi bằng AI", body: `Tính năng tạo đề bằng trí tuệ nhân tạo của SmartExam giúp bạn biến bất kỳ tài liệu nào thành bộ đề trắc nghiệm chỉ trong vài giây.\n\n**Cách thức hoạt động:**\n1. Tải lên tài liệu (PDF, DOCX, TXT) tối đa 20MB\n2. AI phân tích nội dung và trích xuất kiến thức trọng tâm\n3. Tự động sinh câu hỏi trắc nghiệm 4 đáp án kèm giải thích chi tiết\n4. Bạn xem lại, chỉnh sửa và lưu vào thư viện cá nhân\n\n**Công nghệ:** Sử dụng Gemini 2.5 Flash — mô hình AI tiên tiến của Google.` },
    "Luyện thi THPT": { icon: "🎯", title: "Luyện thi THPT Quốc gia", body: `Chương trình luyện thi THPT Quốc gia toàn diện được thiết kế bám sát cấu trúc đề thi chính thức của Bộ GD&ĐT.\n\n**Các môn luyện thi:**\n• Toán học (50 câu · 90 phút)\n• Tiếng Anh (50 câu · 60 phút)\n• Tổ hợp KHTN: Lý · Hóa · Sinh\n• Tổ hợp KHXH: Sử · Địa · GDCD` },
    "Thi thử online": { icon: "🖥️", title: "Thi thử online", body: `Hệ thống thi thử online mô phỏng chính xác không khí phòng thi thật.\n\n**Tính năng:**\n• Đồng hồ đếm ngược theo thời gian thật\n• Tự động chấm điểm và xếp hạng ngay sau khi nộp bài\n• Xem lại đáp án và giải thích chi tiết từng câu\n• Thống kê điểm theo từng chủ đề` },
    "Hướng dẫn sử dụng": { icon: "📖", title: "Hướng dẫn sử dụng", body: `**Bước 1:** Đăng ký bằng Google — miễn phí hoàn toàn.\n\n**Bước 2:** Tải tài liệu lên → AI tạo đề trong 30 giây.\n\n**Bước 3:** Chọn "Luyện đề" hoặc "Làm bài ngay" có đồng hồ.\n\n**Bước 4:** Xem điểm, đáp án, giải thích chi tiết. Kết quả lưu tự động vào Lịch sử.` },
    "Câu hỏi thường gặp": { icon: "❓", title: "Câu hỏi thường gặp", body: `**SmartExam có miễn phí không?**\nCó! Tính năng cơ bản hoàn toàn miễn phí.\n\n**Tôi có thể tải file loại gì?**\nHỗ trợ PDF, DOCX, DOC và TXT. Tối đa 20MB.\n\n**AI tạo đề có chính xác không?**\nAI đạt độ chính xác trên 90% với tài liệu chuẩn. Bạn luôn có thể chỉnh sửa trước khi lưu.` },
    "Liên hệ hỗ trợ": { icon: "💬", title: "Liên hệ hỗ trợ", body: `📧 **Email:** support@smartexam.vn\nThời gian phản hồi: trong vòng 24 giờ\n\n💬 **Chat trực tiếp:** 8:00 – 22:00 hàng ngày\n\n📱 **Zalo OA:** SmartExam Official\n\n🏢 **Trụ sở:** 99 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh` },
    "Báo lỗi": { icon: "🐛", title: "Báo lỗi", body: `📧 bug@smartexam.vn\n\n**Thời gian xử lý:**\n🟢 Lỗi nghiêm trọng: trong 4 giờ\n🟡 Lỗi tính năng: 1–3 ngày làm việc\n🔵 Góp ý cải tiến: sprint tiếp theo` },
    "Giới thiệu": { icon: "🏢", title: "Giới thiệu về SmartExam", body: `**SmartExam** là nền tảng ôn thi trực tuyến thông minh với sứ mệnh giúp mọi học sinh Việt Nam tiếp cận nền giáo dục chất lượng cao.\n\n**Con số ấn tượng:**\n• 50,000+ học sinh đang sử dụng\n• 200,000+ câu hỏi trong hệ thống\n• 98% người dùng hài lòng\n• Đối tác với 150+ trường THPT` },
    "Điều khoản dịch vụ": { icon: "📋", title: "Điều khoản dịch vụ", body: `**Cập nhật:** 01/03/2026\n\nBằng cách sử dụng SmartExam, bạn đồng ý tuân thủ các điều khoản này. Tài liệu bạn tải lên thuộc sở hữu của bạn. Không được sử dụng SmartExam để spam hoặc gian lận thi cử.\n\nMọi thắc mắc: legal@smartexam.vn` },
    "Chính sách bảo mật": { icon: "🔒", title: "Chính sách bảo mật", body: `**Chúng tôi KHÔNG:**\n❌ Bán dữ liệu cá nhân của bạn\n❌ Chia sẻ tài liệu riêng tư với bên thứ ba\n\n**Bảo mật:** Mọi dữ liệu được mã hóa AES-256. Máy chủ đặt tại Việt Nam.\n\nYêu cầu xóa dữ liệu: privacy@smartexam.vn` },
    "Tuyển dụng": { icon: "💼", title: "Tuyển dụng", body: `Hiện tại chưa có đợt tuyển dụng nào đang mở.\n\nGửi CV ứng tuyển tự nguyện:\n📩 careers@smartexam.vn` },
  };

  const columns = [
    { title: "Sản phẩm",    links: ["Ngân hàng đề thi", "Tạo đề AI", "Luyện thi THPT", "Thi thử online"] },
    { title: "Hỗ trợ",      links: ["Hướng dẫn sử dụng", "Câu hỏi thường gặp", "Liên hệ hỗ trợ", "Báo lỗi"] },
    { title: "Về chúng tôi",links: ["Giới thiệu", "Điều khoản dịch vụ", "Chính sách bảo mật", "Tuyển dụng"] },
  ];

  const openedContent = openPage ? CONTENT[openPage] : null;

  return (
    <>
      <footer style={{ background: "#0f172a", color: "#94a3b8", marginTop: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "40px 20px 24px" : "56px 32px 32px" }}>

          {/* Grid layout — responsive */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
            gap: isMobile ? 28 : 48,
            marginBottom: 40,
          }}>

            {/* Brand — full width trên mobile */}
            <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>Smart<span style={{ color: "#38bdf8" }}>Exam</span></span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#64748b", maxWidth: isMobile ? "100%" : 280, marginBottom: 16 }}>
                Nền tảng ôn thi thông minh, giúp học sinh ôn luyện hiệu quả với ngân hàng đề thi phong phú và AI hỗ trợ.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {["FB", "YT", "TW", "IG"].map(s => (
                  <div key={s} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#94a3b8", fontWeight: 700, border: "1px solid rgba(255,255,255,0.08)" }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {columns.map(col => (
              <div key={col.title}>
                <div style={{ color: "#e2e8f0", fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} onClick={() => setOpenPage(l)}
                    style={{ fontSize: 13, color: "#64748b", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = "#38bdf8"}
                    onMouseLeave={e => e.target.style.color = "#64748b"}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "center" : "center", gap: isMobile ? 8 : 0, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "#475569" }}>© 2026 SmartExam. Bảo lưu mọi quyền.</span>
            <span style={{ fontSize: 12, color: "#475569" }}>🇻🇳 Được tạo bởi đội ngũ Việt Nam</span>
          </div>
        </div>
      </footer>

      {/* Content modal */}
      {openedContent && (
        <div onClick={() => setOpenPage(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)", padding: isMobile ? 12 : 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: isMobile ? 18 : 22, width: "100%", maxWidth: 620, maxHeight: isMobile ? "90vh" : "80vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ padding: isMobile ? "18px 20px 14px" : "24px 28px 20px", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {openedContent.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a" }}>{openedContent.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>SmartExam · smartexam.vn</div>
              </div>
              <button onClick={() => setOpenPage(null)} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", padding: 8, borderRadius: 10, display: "flex", flexShrink: 0 }}>
                <Icon path={Icons.close} size={16} color="#64748b" />
              </button>
            </div>
            <div style={{ padding: isMobile ? "16px 20px" : "24px 28px", overflowY: "auto", flex: 1 }}>
              {openedContent.body.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
                const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<b style="color:#0f172a">${t}</b>`);
                return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.75, marginBottom: 4 }} />;
              })}
            </div>
            <div style={{ padding: isMobile ? "12px 20px" : "16px 28px", borderTop: "1.5px solid #f1f5f9", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={() => setOpenPage(null)} style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
