# Changelog (Lịch sử cập nhật)

Tất cả các thay đổi nổi bật của dự án [Smart Exams] sẽ được ghi chép trong file này.

Định dạng của file này dựa trên tiêu chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và dự án tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] (Các tính năng đang phát triển)
### Dự kiến thêm (Planned)
- Quản lý phân quyền Role: Admin và User.
- Thống kê Dashboard dạng biểu đồ trực quan cho Admin.

## [1.0.0] - 2026-03-09
Phiên bản phát hành đầu tiên (Bản Release nộp thi "Website & AI Innovation Contest 2026").

### Thêm mới (Added)
- **Core AI:** Tích hợp API Google Gemini 2.5 Flash để tự động trích xuất file lý thuyết/đề cương (.txt, .pdf, .docx) thành bộ câu hỏi trắc nghiệm chuẩn JSON.
- **Adaptive Learning (Học tập thích ứng):** Theo dõi lịch sử làm bài của User (Bảng `user_question_stats`).
- **Smart Shuffle:** Thuật toán trộn đề thi tự động ưu tiên bốc các câu hỏi người dùng thường làm sai để tạo `CustomExam`.
- **AI Question Generation:** Tự động gọi AI sinh thêm câu hỏi bù đắp lỗ hổng kiến thức trực tiếp vào quá trình tạo đề thi tùy chỉnh.
- **AI Explainer (Gia sư AI):** Chức năng phân tích câu trả lời đúng/sai của học sinh và đưa ra lời giải thích, động viên tức thì.
- **Ngân hàng đề thi:** Chức năng chia sẻ đề thi cộng đồng (Cập nhật trạng thái Public/Private).
- **Export to Word:** Hỗ trợ xuất đề thi gốc (`Exam`) và đề thi tùy chỉnh (`CustomExam`) ra định dạng file Word (`.docx`) bằng thư viện Apache POI.
- **Bulk Delete:** Hỗ trợ tính năng Xóa mềm (Soft Delete) hàng loạt cho Exams, CustomExams và Results.
- Cấu hình kiến trúc 3-Layer MVC (Controller - Service - Repository) tích hợp các DTO bảo mật dữ liệu.

### Thay đổi (Changed)
- Chuyển đổi toàn bộ cấu trúc CSDL để tách biệt giữa "Luyện đề" (Practice - không lưu kết quả) và "Thi thật" (Exam - lưu kết quả) để tăng trải nghiệm người dùng (UX).
- Refactor (Tái cấu trúc) `ExamController` để đưa logic nghiệp vụ xuống `ExamService`, đảm bảo tuân thủ nguyên tắc Clean Code.