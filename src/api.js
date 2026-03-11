// ============================================================
//  SmartExam — API Service
//  Tất cả gọi backend tập trung tại đây
//  Base URL tự động qua Vite proxy: /api → http://localhost:8080
// ============================================================

const BASE = "";        // Vite proxy xử lý, không cần localhost:8080
const JSON_HEADERS = { "Content-Type": "application/json" };

// Helper: fetch + trả về JSON, ném lỗi nếu không ok
async function request(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  // Một số API trả về text (export, status update)
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  if (contentType.includes("octet-stream")) return res.blob();
  return res.text();
}

// ─── AUTH ─────────────────────────────────────────────────────
export const auth = {
  // Redirect sang Google OAuth — gọi bằng window.location.href
  loginUrl: `https://smartexam.id.vn/login/oauth2/code/google`,

  // POST /api/auth/logout — Đăng xuất, xóa session phía backend
  logout: () =>
    request(`${BASE}/api/auth/logout`, { method: "POST" }),
};

// ─── EXAMS ────────────────────────────────────────────────────
export const examApi = {

  // GET /api/exams — Lấy tất cả đề (MyExamsPage + CreatedExamsPage)
  getAll: () =>
    request(`${BASE}/api/exams`),

  // GET /api/exams/public — Ngân hàng đề thi
  getPublic: () =>
    request(`${BASE}/api/exams/public`),

  // GET /api/exams/public/{id} — Chi tiết 1 đề công khai (có câu hỏi)
  getPublicDetail: (id) =>
    request(`${BASE}/api/exams/public/${id}`),

  // GET /api/exams/{id}/detail — Chi tiết đề bất kể Public/Private (dùng cho luyện đề cá nhân)
  getDetail: (id) =>
    request(`${BASE}/api/exams/${id}/detail`),

  // POST /api/exams/save-full — Lưu đề sau khi AI xử lý
  // body: { title, questions: [{ content, optionA, optionB, optionC, optionD, correctAnswer }] }
  saveFull: (data) =>
    request(`${BASE}/api/exams/save-full`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),

  // PATCH /api/exams/{id}/status — Đổi Public ↔ Private
  // status: "Public" | "Private"
  updateStatus: (id, status) =>
    request(`${BASE}/api/exams/${id}/status`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status }),
    }),

  // POST /api/exams/practice-submit — Nộp bài luyện tập
  // body: { userId, examId, answers: [{ questionId, selectedOption }] }
  practiceSubmit: (data) =>
    request(`${BASE}/api/exams/practice-submit`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),

  // GET /api/exams/user/{userId} — Lấy đề theo userId (MyExams + CreatedExams)
  getByUser: (userId) =>
    request(`${BASE}/api/exams/user/${userId}`),

  // GET /api/exams/user/{userId} — Lấy đề theo userId (MyExams + CreatedExams)
  getByUser: (userId) =>
    request(`${BASE}/api/exams/user/${userId}`),

  // DELETE /api/exams — Xóa nhiều đề
  // body: [id1, id2, ...]
  deleteMany: (ids) =>
    request(`${BASE}/api/exams`, {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify(ids),
    }),

  // GET /api/exams/{id}/export — Xuất đề gốc ra file .docx
  exportDocx: async (id, filename = `DeThi_${id}.docx`) => {
    const blob = await request(`${BASE}/api/exams/${id}/export`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

// ─── CUSTOM EXAMS (SettingModal — Tạo đề tùy chỉnh) ──────────
export const customExamApi = {

  // POST /api/exams/custom-exams — Tạo đề tùy chỉnh từ SettingModal
  // body: { originExamId, timeLimit, questionCount, userId, title }
  create: (data) =>
    request(`${BASE}/api/exams/custom-exams`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),

  // GET /api/exams/custom-exams/{id}/take — Lấy câu hỏi khi bắt đầu thi
  take: (id) =>
    request(`${BASE}/api/exams/custom-exams/${id}/take`),

  // POST /api/exams/custom-exams/submit — Nộp bài thi thật (mode=exam)
  // body: { userId, customExamId, answers: [{ questionId, selectedOption }] }
  submit: (data) =>
    request(`${BASE}/api/exams/custom-exams/submit`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),

  // DELETE /api/exams/custom-exams — Xóa nhiều đề tùy chỉnh
  deleteMany: (ids) =>
    request(`${BASE}/api/exams/custom-exams`, {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify(ids),
    }),

  // GET /api/exams/custom-exams/{id}/export — Xuất đề tùy chỉnh .docx
  exportDocx: async (id, filename = `DeThi_Custom_${id}.docx`) => {
    const blob = await request(`${BASE}/api/exams/custom-exams/${id}/export`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

// ─── AI ───────────────────────────────────────────────────────
export const aiApi = {

  // POST /api/ai/upload — Upload file → AI trích xuất câu hỏi
  // file: File object từ input
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`${BASE}/api/ai/upload`, {
      method: "POST",
      body: formData,
      // KHÔNG set Content-Type, browser tự set multipart/form-data
    });
  },

  // POST /api/ai/explain — AI giải thích 1 câu hỏi
  // body: { questionId, userSelectedOption }
  explain: (questionId, userSelectedOption) =>
    request(`${BASE}/api/ai/explain`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ questionId, userSelectedOption }),
    }),
};

// ─── USERS ────────────────────────────────────────────────────
export const userApi = {

  // GET /api/users/{userId} — Lấy thông tin user theo ID
  getById: (userId) =>
    request(`${BASE}/api/users/${userId}`),

  // GET /api/users/{userId} — Lấy thông tin user theo ID
  getById: (userId) =>
    request(`${BASE}/api/users/${userId}`),

  // GET /api/users/{userId}/results — Lịch sử bài thi
  getResults: (userId) =>
    request(`${BASE}/api/users/${userId}/results`),

  // DELETE /api/users/results — Xóa nhiều lịch sử
  // body: [resultId1, resultId2, ...]
  deleteResults: (resultIds) =>
    request(`${BASE}/api/users/results`, {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify(resultIds),
    }),
};

// ─── HELPERS ──────────────────────────────────────────────────

// Chuyển đổi dữ liệu từ backend → format frontend đang dùng
export const mappers = {

  // ExamSummaryDTO → format ExamCard
  examSummary: (dto) => ({
    id: dto.id,
    title: dto.title,
    questions: dto.totalQuestions,
    status: dto.status?.toLowerCase(), // "Public" → "public"
    createdAt: dto.createdAt,
    // Các field chưa có từ backend (dùng giá trị mặc định)
    subject: dto.subject || "Chung",
    time: dto.timeLimit || 30,
    attempts: dto.attempts || 0,
    rating: dto.rating || 0,
  }),

  // ExamPublicDTO → format ExamCard (BankPage)
  examPublic: (dto) => ({
    id: dto.id,
    title: dto.title,
    questions: dto.totalQuestions,
    subject: dto.subject || "Chung",
    time: dto.timeLimit || 30,
    attempts: dto.attempts || 0,
    rating: dto.rating || 0,
    creatorName: dto.creatorName,
    createdAt: dto.createdAt,
  }),

  // ResultHistoryDTO → format HistoryPage
  resultHistory: (dto) => ({
    id: dto.examId,
    resultId: dto.resultId,
    title: dto.examTitle,
    score: Math.round(dto.score),         // backend trả % (0-100)
    date: dto.completedAt,
    status: dto.score >= 50 ? "Đạt" : "Không đạt",
    questions: dto.totalQuestions,
    subject: dto.subject || "Chung",
    time: 30,
    attempts: 0,
    rating: 0,
  }),

  // QuestionClientDTO → format PracticePage
  question: (dto, index) => ({
    id: dto.id,
    q: dto.questionContent,
    opts: dto.options,   // ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"]
    ans: dto.answer ? ["A","B","C","D"].indexOf(dto.answer.trim().toUpperCase()) : 0,
    explanation: "",
  }),

  // answers state { questionId: optionIndex } → PracticeAnswerDTO[]
  answersToDTO: (answers, questions) =>
    Object.entries(answers).map(([qId, idx]) => ({
      questionId: parseInt(qId),
      selectedOption: ["A", "B", "C", "D"][idx] ?? "",
    })),
};