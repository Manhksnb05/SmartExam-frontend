import { useState, useEffect } from "react";
import { examApi, customExamApi, aiApi, userApi, mappers, auth } from "./api.js";

// ─── DATA ────────────────────────────────────────────────────────────────────
const MOCK_EXAMS = [
  { id: 1, title: "Toán Đại Số 12", subject: "Toán học", questions: 40, time: 90, attempts: 1250, rating: 4.8 },
  { id: 2, title: "Vật Lý Điện Từ", subject: "Vật lý", questions: 30, time: 60, attempts: 890, rating: 4.6 },
  { id: 3, title: "Hóa Học Hữu Cơ", subject: "Hóa học", questions: 35, time: 75, attempts: 730, rating: 4.7 },
  { id: 4, title: "Tiếng Anh THPT QG", subject: "Tiếng Anh", questions: 50, time: 60, attempts: 2100, rating: 4.9 },
  { id: 5, title: "Ngữ Văn Nghị Luận", subject: "Ngữ văn", questions: 20, time: 120, attempts: 560, rating: 4.5 },
  { id: 6, title: "Sinh Học Tế Bào", subject: "Sinh học", questions: 40, time: 50, attempts: 445, rating: 4.4 },
  { id: 7, title: "Lịch Sử Việt Nam", subject: "Lịch sử", questions: 40, time: 50, attempts: 380, rating: 4.3 },
  { id: 8, title: "Địa Lý Tự Nhiên", subject: "Địa lý", questions: 40, time: 50, attempts: 290, rating: 4.2 },
  { id: 9, title: "GDCD & Pháp Luật", subject: "GDCD", questions: 40, time: 50, attempts: 210, rating: 4.1 },
  { id: 10, title: "Toán Giải Tích 12", subject: "Toán học", questions: 50, time: 90, attempts: 1800, rating: 4.9 },
  { id: 11, title: "Vật Lý Cơ Học", subject: "Vật lý", questions: 30, time: 45, attempts: 670, rating: 4.5 },
  { id: 12, title: "Hóa Vô Cơ", subject: "Hóa học", questions: 40, time: 60, attempts: 540, rating: 4.6 },
];

const MY_EXAMS = MOCK_EXAMS.slice(0, 8);
const BANK_EXAMS = MOCK_EXAMS;

// Đề thi đã tạo bằng AI (từ flow upload file)
const CREATED_EXAMS = [
  { id: 101, title: "Ôn tập Giải tích - Chương 1", subject: "Toán học", questions: 15, time: 20, attempts: 0, rating: 0, createdAt: "08/03/2026", source: "Giải_tích_C1.pdf", status: "private" },
  { id: 102, title: "Vật lý Điện từ học", subject: "Vật lý", questions: 20, time: 25, attempts: 3, rating: 4.5, createdAt: "07/03/2026", source: "DienTuHoc.docx", status: "public" },
  { id: 103, title: "Hóa hữu cơ - Este và Lipit", subject: "Hóa học", questions: 12, time: 15, attempts: 1, rating: 4.0, createdAt: "06/03/2026", source: "HuuCo_Ch3.pdf", status: "private" },
  { id: 104, title: "Tiếng Anh Grammar Review", subject: "Tiếng Anh", questions: 25, time: 30, attempts: 7, rating: 4.8, createdAt: "05/03/2026", source: "Grammar_B2.docx", status: "public" },
  { id: 105, title: "Toán xác suất thống kê", subject: "Toán học", questions: 18, time: 22, attempts: 0, rating: 0, createdAt: "04/03/2026", source: "XacSuat.pdf", status: "private" },
  { id: 106, title: "Sinh học tế bào", subject: "Sinh học", questions: 10, time: 15, attempts: 2, rating: 3.9, createdAt: "03/03/2026", source: "SinhHoc_TeBao.txt", status: "public" },
];


const SUBJECT_COLORS = {
  "Toán học": "#1a56db",
  "Vật lý": "#0891b2",
  "Hóa học": "#059669",
  "Tiếng Anh": "#7c3aed",
  "Ngữ văn": "#d97706",
  "Sinh học": "#10b981",
  "Lịch sử": "#dc2626",
  "Địa lý": "#0284c7",
  "GDCD": "#9333ea",
};

// ─── MOCK QUESTIONS ──────────────────────────────────────────────────────────
function generateQuestions(exam) {
  const pools = {
    "Toán học": [
      { q: "Giá trị của biểu thức log₂(8) bằng:", opts: ["2", "3", "4", "6"], ans: 1, explanation: "log₂(8) = log₂(2³) = 3. Logarithm cơ số 2 của 8 bằng số mũ cần thiết để 2 mũ đó bằng 8, tức là 2³ = 8 nên kết quả là 3." },
      { q: "Đạo hàm của hàm số f(x) = x³ - 3x² + 2 tại x = 1 là:", opts: ["-3", "0", "3", "-1"], ans: 0, explanation: "f'(x) = 3x² - 6x. Tại x = 1: f'(1) = 3(1)² - 6(1) = 3 - 6 = -3." },
      { q: "Giới hạn lim(x→0) (sin x)/x bằng:", opts: ["0", "∞", "1", "−1"], ans: 2, explanation: "Đây là giới hạn cơ bản nổi tiếng trong giải tích: lim(x→0) (sin x)/x = 1. Có thể chứng minh bằng định lý kẹp hoặc L'Hôpital." },
      { q: "Tích phân ∫₀¹ x² dx bằng:", opts: ["1/2", "1/3", "1/4", "2/3"], ans: 1, explanation: "∫x² dx = x³/3 + C. Tính từ 0 đến 1: [x³/3]₀¹ = 1/3 - 0 = 1/3." },
      { q: "Phương trình x² - 5x + 6 = 0 có nghiệm là:", opts: ["x=1; x=6", "x=2; x=3", "x=-2; x=-3", "x=1; x=5"], ans: 1, explanation: "Phân tích: x² - 5x + 6 = (x-2)(x-3) = 0. Do đó x = 2 hoặc x = 3. Kiểm tra: 2+3=5 và 2×3=6 đúng với hệ số." },
      { q: "Số phức z = 3 + 4i có môđun bằng:", opts: ["5", "7", "√7", "√5"], ans: 0, explanation: "|z| = √(3² + 4²) = √(9 + 16) = √25 = 5. Đây là bộ số Pythagorean cổ điển (3-4-5)." },
      { q: "Tổng của cấp số nhân lùi vô hạn có u₁=1, q=1/2 là:", opts: ["1", "2", "3", "4"], ans: 1, explanation: "S = u₁/(1-q) = 1/(1-½) = 1/(½) = 2. Công thức tổng cấp số nhân lùi vô hạn áp dụng khi |q| < 1." },
      { q: "Số cách chọn 3 người từ nhóm 7 người là:", opts: ["21", "35", "42", "70"], ans: 1, explanation: "C(7,3) = 7!/(3!×4!) = (7×6×5)/(3×2×1) = 210/6 = 35. Đây là tổ hợp chập 3 của 7." },
      { q: "Đồ thị hàm số y = x² - 4x + 3 cắt trục Ox tại:", opts: ["x=1 và x=3", "x=-1 và x=-3", "x=2 và x=4", "x=0 và x=4"], ans: 0, explanation: "Giải x² - 4x + 3 = 0 → (x-1)(x-3) = 0 → x = 1 hoặc x = 3. Đồ thị cắt trục Ox tại (1;0) và (3;0)." },
      { q: "Vectơ pháp tuyến của đường thẳng 2x - 3y + 5 = 0 là:", opts: ["(3;2)", "(2;-3)", "(-2;3)", "(2;3)"], ans: 1, explanation: "Đường thẳng ax + by + c = 0 có vectơ pháp tuyến n = (a;b). Với 2x - 3y + 5 = 0, ta có a=2, b=-3 nên n = (2;-3)." },
    ],
    "Vật lý": [
      { q: "Công thức tính động năng của vật là:", opts: ["Eđ = mv", "Eđ = ½mv²", "Eđ = mgh", "Eđ = mv²"], ans: 1, explanation: "Động năng Eđ = ½mv², trong đó m là khối lượng (kg) và v là vận tốc (m/s). Đây là năng lượng do chuyển động của vật." },
      { q: "Đơn vị của cường độ điện trường là:", opts: ["V", "C", "V/m", "N"], ans: 2, explanation: "Cường độ điện trường E = F/q = U/d, đơn vị là V/m (Volt trên mét) hoặc tương đương N/C (Newton trên Coulomb)." },
      { q: "Tốc độ ánh sáng trong chân không xấp xỉ:", opts: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], ans: 1, explanation: "Tốc độ ánh sáng c ≈ 3×10⁸ m/s (299,792,458 m/s chính xác). Đây là hằng số vật lý cơ bản, ký hiệu là c." },
      { q: "Định luật Ohm: U = ?", opts: ["U = R/I", "U = I/R", "U = IR", "U = I+R"], ans: 2, explanation: "Định luật Ohm: U = I×R, trong đó U là hiệu điện thế (V), I là cường độ dòng điện (A), R là điện trở (Ω)." },
      { q: "Gia tốc trọng trường tại mặt đất xấp xỉ:", opts: ["9,8 m/s", "9,8 m/s²", "10 m/s", "9,8 N/kg²"], ans: 1, explanation: "g ≈ 9,8 m/s² là gia tốc trọng trường tại bề mặt Trái Đất. Đơn vị đúng là m/s² (gia tốc), thường làm tròn thành 10 m/s² cho tính toán." },
      { q: "Hiện tượng tán sắc ánh sáng chứng tỏ:", opts: ["Ánh sáng trắng là ánh sáng đơn sắc", "Ánh sáng trắng gồm nhiều ánh sáng đơn sắc", "Lăng kính có thể phát ra ánh sáng màu", "Vận tốc ánh sáng không đổi"], ans: 1, explanation: "Tán sắc là hiện tượng lăng kính tách ánh sáng trắng thành dải màu cầu vồng, chứng tỏ ánh sáng trắng là tổng hợp của nhiều ánh sáng đơn sắc có bước sóng khác nhau." },
      { q: "Điện dung của tụ điện có đơn vị là:", opts: ["Henry (H)", "Ohm (Ω)", "Farad (F)", "Tesla (T)"], ans: 2, explanation: "Điện dung C có đơn vị là Farad (F). 1F = 1C/V. Henry là đơn vị của độ tự cảm, Ohm của điện trở, Tesla của từ cảm." },
      { q: "Công thức tính chu kỳ dao động của con lắc đơn:", opts: ["T = 2π√(l/g)", "T = 2π√(g/l)", "T = π√(l/g)", "T = √(l/g)"], ans: 0, explanation: "T = 2π√(l/g), trong đó l là chiều dài dây treo (m) và g là gia tốc trọng trường (m/s²). Chu kỳ không phụ thuộc vào khối lượng vật." },
    ],
    "Hóa học": [
      { q: "Cấu hình electron của nguyên tử Na (Z=11) là:", opts: ["1s²2s²2p⁶3s¹", "1s²2s²2p⁵3s²", "1s²2s²2p⁶3p¹", "1s²2s²2p⁴3s²"], ans: 0, explanation: "Na có Z=11 electron. Phân bố lần lượt: 1s²(2e) 2s²(2e) 2p⁶(6e) 3s¹(1e) = 11e. Electron cuối cùng ở phân lớp 3s¹ nên Na thuộc nhóm IA." },
      { q: "Phản ứng trùng hợp tạo ra:", opts: ["Polime", "Monome", "Đime", "Oligome"], ans: 0, explanation: "Phản ứng trùng hợp (polymerization) là quá trình nhiều phân tử monome nhỏ liên kết với nhau tạo thành đại phân tử polime có khối lượng phân tử lớn." },
      { q: "Axit axetic có công thức phân tử là:", opts: ["CH₃OH", "CH₃COOH", "C₂H₅OH", "HCOOH"], ans: 1, explanation: "Axit axetic (dấm ăn) có công thức CH₃COOH. CH₃OH là methanol, C₂H₅OH là ethanol (cồn), HCOOH là axit formic." },
      { q: "Số oxi hóa của S trong H₂SO₄ là:", opts: ["+4", "+6", "-2", "+2"], ans: 1, explanation: "Trong H₂SO₄: H có SOH +1 (×2=+2), O có SOH -2 (×4=-8). Gọi SOH của S là x: +2 + x + (-8) = 0 → x = +6." },
      { q: "Kim loại nào sau đây có thể tác dụng với nước ở điều kiện thường?", opts: ["Fe", "Al", "Na", "Cu"], ans: 2, explanation: "Na tác dụng mạnh với nước ở nhiệt độ thường: 2Na + 2H₂O → 2NaOH + H₂↑. Fe và Al chỉ phản ứng ở nhiệt độ cao, Cu không phản ứng với nước." },
      { q: "Glucozơ có công thức phân tử là:", opts: ["C₁₂H₂₂O₁₁", "C₆H₁₂O₆", "C₆H₁₀O₅", "C₂H₅OH"], ans: 1, explanation: "Glucozơ (đường nho) có công thức C₆H₁₂O₆. C₁₂H₂₂O₁₁ là saccarozơ, C₆H₁₀O₅ là tinh bột/xenlulozơ, C₂H₅OH là ethanol." },
      { q: "Phản ứng este hóa là phản ứng giữa:", opts: ["Axit và bazơ", "Axit và ancol", "Ancol và ancol", "Axit và muối"], ans: 1, explanation: "Este hóa: Axit + Ancol ⇌ Este + Nước (xúc tác H₂SO₄ đặc, đun nóng). Ví dụ: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O." },
    ],
    "Tiếng Anh": [
      { q: "Choose the correct form: She ___ to school every day.", opts: ["go", "goes", "going", "went"], ans: 1, explanation: "'She' is third person singular, so we add -s to the verb in Simple Present tense: 'goes'. This describes a habitual action." },
      { q: "The synonym of 'beautiful' is:", opts: ["ugly", "pretty", "boring", "angry"], ans: 1, explanation: "'Pretty' means attractive or pleasing, making it a synonym of 'beautiful'. 'Ugly' is the antonym, 'boring' means uninteresting, 'angry' means feeling anger." },
      { q: "Which sentence is in Past Perfect tense?", opts: ["She has eaten.", "She ate.", "She had eaten.", "She was eating."], ans: 2, explanation: "Past Perfect is formed with 'had + past participle'. 'She had eaten' is Past Perfect. 'Has eaten' is Present Perfect, 'ate' is Simple Past, 'was eating' is Past Continuous." },
      { q: "Choose the correct word: He is ___ honest man.", opts: ["a", "an", "the", "no article"], ans: 1, explanation: "We use 'an' before words that start with a vowel sound. 'Honest' starts with a silent 'h', so the first sound is the vowel /ɒ/. Therefore 'an honest man' is correct." },
      { q: "The antonym of 'ancient' is:", opts: ["old", "modern", "historical", "traditional"], ans: 1, explanation: "'Ancient' means very old. Its antonym is 'modern', which means relating to the present or recent times. 'Old', 'historical', and 'traditional' are all associated with the past." },
      { q: "Choose the correct preposition: She arrived ___ time.", opts: ["in", "at", "on", "by"], ans: 3, explanation: "'Arrive by time' means before a deadline. 'On time' also works but means exactly at the scheduled time. 'By' here means no later than the given time." },
      { q: "Which is a conditional sentence type 2?", opts: ["If it rains, I stay home.", "If I were rich, I would travel.", "If she studies, she passes.", "If he called, I answered."], ans: 1, explanation: "Type 2 conditional uses 'If + Simple Past, would + infinitive' to describe unreal/hypothetical situations. 'If I were rich, I would travel' is hypothetical (I'm not rich)." },
      { q: "The passive voice of 'They built this house' is:", opts: ["This house is built.", "This house was built.", "This house has been built.", "This house will be built."], ans: 1, explanation: "'They built' is Simple Past active. Passive form: 'This house was built (by them)'. The tense stays Simple Past, converted to 'was/were + past participle'." },
    ],
    "default": [
      { q: "Câu hỏi số 1 của bộ đề " + exam.title, opts: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"], ans: 0, explanation: "Đáp án A là chính xác. Khi kết nối với backend thật, giải thích chi tiết sẽ được AI cung cấp dựa trên nội dung tài liệu của bạn." },
      { q: "Câu hỏi số 2 của bộ đề " + exam.title, opts: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"], ans: 2, explanation: "Đáp án C là chính xác. Giải thích chi tiết sẽ được AI tạo ra tự động từ nội dung tài liệu." },
      { q: "Câu hỏi số 3 của bộ đề " + exam.title, opts: ["Phương án A", "Phương án B", "Phương án C", "Phương án D"], ans: 1, explanation: "Đáp án B là chính xác. AI sẽ phân tích và giải thích từng câu hỏi chi tiết khi tích hợp backend." },
      { q: "Câu hỏi số 4 của bộ đề " + exam.title, opts: ["Kết quả A", "Kết quả B", "Kết quả C", "Kết quả D"], ans: 3, explanation: "Đáp án D là chính xác. Mỗi câu hỏi sẽ có giải thích riêng được tạo bởi Gemini AI." },
      { q: "Câu hỏi số 5 của bộ đề " + exam.title, opts: ["Chọn A", "Chọn B", "Chọn C", "Chọn D"], ans: 0, explanation: "Đáp án A là chính xác. Phần giải thích này sẽ giúp học sinh hiểu sâu hơn về nội dung bài học." },
    ],
  };
  const base = pools[exam.subject] || pools["default"];
  const result = [];
  for (let i = 0; i < Math.min(10, exam.questions); i++) {
    result.push({ id: i + 1, ...base[i % base.length] });
  }
  return result;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const Icons = {
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-10V7m0 5l3 3",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7-5-5-5 5m5-5v12",
  plus: "M12 5v14M5 12h14",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9",
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M18 6 6 18M6 6l12 12",
  history: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v6m0-18v1.5M4.22 4.22l1.06 1.06m13.44 13.44 1.06 1.06M2 12H4m16 0h2M4.22 19.78l1.06-1.06m13.44-13.44 1.06-1.06",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.586-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3",
  play: "M5 3l14 9-14 9V3z",
  check: "M20 6 9 17l-5-5",
  xmark: "M18 6 6 18M6 6l12 12",
  google: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 0h1.5a2.5 2.5 0 0 1 0 5H18M8 4h8v11a4 4 0 0 1-8 0V4zm-1 0h10m-5 15v2m-3 0h6",
  arrowLeft: "M19 12H5m0 0 7 7m-7-7 7-7",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 0v9",
  alertCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-1m0-4h.01",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm7 11V12h4v8",
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SettingModal({ exam, onClose, onConfirm }) {
  const [time, setTime] = useState(exam.time);
  const [questions, setQuestions] = useState(exam.questions);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 420, boxShadow: "0 25px 60px rgba(29,78,216,0.2)", position: "relative", border: "1.5px solid rgba(59,130,246,0.15)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 8 }}>
          <Icon path={Icons.close} size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={Icons.settings} size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Cài đặt đề thi</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{exam.title}</div>
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>⏱ Thời gian làm bài (phút)</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[30, 45, 60, 90, 120].map(t => (
              <button key={t} onClick={() => setTime(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: time === t ? "2px solid #1d4ed8" : "1.5px solid #e2e8f0", background: time === t ? "#eff6ff" : "#f8fafc", color: time === t ? "#1d4ed8" : "#64748b", fontWeight: time === t ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                {t}
              </button>
            ))}
          </div>
          <input type="range" min={10} max={180} value={time} onChange={e => setTime(+e.target.value)} style={{ width: "100%", marginTop: 10, accentColor: "#1d4ed8" }} />
          <div style={{ textAlign: "center", fontSize: 24, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>{time} phút</div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>📋 Số lượng câu hỏi</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[10, 20, 30, 40, 50].map(q => (
              <button key={q} onClick={() => setQuestions(q)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: questions === q ? "2px solid #1d4ed8" : "1.5px solid #e2e8f0", background: questions === q ? "#eff6ff" : "#f8fafc", color: questions === q ? "#1d4ed8" : "#64748b", fontWeight: questions === q ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                {q}
              </button>
            ))}
          </div>
          <input type="range" min={5} max={100} value={questions} onChange={e => setQuestions(+e.target.value)} style={{ width: "100%", marginTop: 10, accentColor: "#1d4ed8" }} />
          <div style={{ textAlign: "center", fontSize: 24, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>{questions} câu</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Hủy</button>
          <button onClick={() => onConfirm({ time, questions })} style={{ padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.35)" }}>
            Tạo đề thi ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamCard({ exam, isHistory = false, onCreateExam, onPractice }) {
  const [hovered, setHovered] = useState(false);
  const subjectColor = SUBJECT_COLORS[exam.subject] || "#1d4ed8";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: hovered ? "0 20px 48px rgba(29,78,216,0.15)" : "0 4px 16px rgba(29,78,216,0.07)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        border: "1.5px solid rgba(59,130,246,0.1)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card Header */}
      <div style={{ background: `linear-gradient(135deg,${subjectColor}ee,${subjectColor}88)`, padding: "20px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "rgba(255,255,255,0.12)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, background: "rgba(255,255,255,0.07)", borderRadius: "50%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backdropFilter: "blur(8px)", letterSpacing: 0.5 }}>{exam.subject}</span>
          {isHistory && (
            <span style={{ background: exam.status === "Đạt" ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
              {(exam.score / 10).toFixed(1)}/10 · {exam.status}
            </span>
          )}
          {!isHistory && (
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Icon path={Icons.star} size={13} color="#fbbf24" />
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{exam.rating}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 14, color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{exam.title}</div>
        {isHistory && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>📅 {exam.date}</div>}
      </div>

      {/* Card Body */}
      <div style={{ padding: "14px 20px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 12 }}>
            <Icon path={Icons.book} size={14} color="#94a3b8" />
            <span>{exam.questions} câu</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 12 }}>
            <Icon path={Icons.clock} size={14} color="#94a3b8" />
            <span>{exam.time} phút</span>
          </div>
          {!isHistory && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 12 }}>
              <Icon path={Icons.users} size={14} color="#94a3b8" />
              <span>{exam.attempts.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {isHistory ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPractice(exam, "exam"); }} style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon path={Icons.history} size={13} color="#fff" /> Làm lại
              </button>
              <button onClick={(e) => { e.stopPropagation(); examApi.exportDocx(exam.id, exam.title + ".docx"); }} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon path={Icons.download} size={13} color="#64748b" /> Xuất đề
              </button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPractice(exam, "practice"); }} style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon path={Icons.play} size={12} color="#fff" /> Luyện đề
              </button>
              <button onClick={(e) => { e.stopPropagation(); onCreateExam(exam); }} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon path={Icons.edit} size={12} color="#1d4ed8" /> Tạo đề
              </button>
              <button onClick={(e) => { e.stopPropagation(); examApi.exportDocx(exam.id, exam.title + ".docx"); }} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={Icons.download} size={13} color="#64748b" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamGrid({ exams, isHistory = false, onCreateExam, onPractice }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
      {exams.map(exam => (
        <ExamCard key={exam.id} exam={exam} isHistory={isHistory} onCreateExam={onCreateExam} onPractice={onPractice} />
      ))}
    </div>
  );
}

function Header({ activePage, setPage, isLoggedIn, setIsLoggedIn, currentUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { id: "home", label: "Trang chủ", icon: Icons.home },
    { id: "my-exams", label: "Bộ đề của bạn", icon: Icons.book },
    { id: "created", label: "Đề thi đã tạo", icon: Icons.edit },
    { id: "history", label: "Lịch sử bài thi", icon: Icons.history },
    { id: "bank", label: "Ngân hàng đề thi", icon: Icons.shield },
  ];
  return (
    <header style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid rgba(59,130,246,0.12)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(29,78,216,0.06)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(29,78,216,0.35)" }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
          </div>
          <div>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5, fontFamily: "'Segoe UI', sans-serif" }}>Smart<span style={{ color: "#1d4ed8" }}>Exam</span></span>
          </div>
        </button>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: activePage === n.id ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "transparent", color: activePage === n.id ? "#fff" : "#475569", fontWeight: activePage === n.id ? 700 : 500, fontSize: 13.5, cursor: "pointer", transition: "all 0.2s", boxShadow: activePage === n.id ? "0 4px 12px rgba(29,78,216,0.25)" : "none" }}>
              <Icon path={n.icon} size={15} color={activePage === n.id ? "#fff" : "#94a3b8"} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>N</div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{currentUser?.name || "Người dùng"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Người dùng</div>
              </div>
              <button onClick={async () => { try { await auth.logout(); } catch(e) {} localStorage.removeItem("smartexam_userId"); setIsLoggedIn(false); setCurrentUser(null); }} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon path={Icons.logout} size={13} color="#dc2626" /> Đăng xuất
              </button>
            </div>
          ) : (
            <button onClick={() => setPage("login")} style={{ padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const [openPage, setOpenPage] = useState(null);

  const CONTENT = {
    // Sản phẩm
    "Ngân hàng đề thi": {
      icon: "🏦", title: "Ngân hàng đề thi",
      body: `SmartExam sở hữu kho đề thi phong phú với hàng nghìn câu hỏi được biên soạn và kiểm duyệt kỹ lưỡng bởi đội ngũ giáo viên có kinh nghiệm trên toàn quốc.

**Đặc điểm nổi bật:**
• Hơn 10.000+ câu hỏi trải dài các môn: Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa
• Phân loại theo cấp độ: Nhận biết · Thông hiểu · Vận dụng · Vận dụng cao
• Cập nhật liên tục theo chương trình GDPT 2018
• Đề thi thử THPT Quốc gia từ các trường chuyên trên toàn quốc
• Người dùng có thể đóng góp đề và chia sẻ cộng đồng

**Môn học có sẵn:** Toán học · Vật lý · Hóa học · Sinh học · Tiếng Anh · Ngữ văn · Lịch sử · Địa lý · Tin học · GDCD`
    },
    "Tạo đề AI": {
      icon: "✨", title: "Tạo đề thi bằng AI",
      body: `Tính năng tạo đề bằng trí tuệ nhân tạo của SmartExam giúp bạn biến bất kỳ tài liệu nào thành bộ đề trắc nghiệm chỉ trong vài giây.

**Cách thức hoạt động:**
1. Tải lên tài liệu (PDF, DOCX, TXT) tối đa 20MB
2. AI phân tích nội dung và trích xuất kiến thức trọng tâm
3. Tự động sinh câu hỏi trắc nghiệm 4 đáp án kèm giải thích chi tiết
4. Bạn xem lại, chỉnh sửa và lưu vào thư viện cá nhân

**Công nghệ:** Sử dụng Gemini 2.5 Flash — mô hình AI tiên tiến của Google, được tinh chỉnh riêng cho giáo dục Việt Nam.

**Giới hạn:** Miễn phí 5 đề/tháng · Gói Pro không giới hạn`
    },
    "Luyện thi THPT": {
      icon: "🎯", title: "Luyện thi THPT Quốc gia",
      body: `Chương trình luyện thi THPT Quốc gia toàn diện được thiết kế bám sát cấu trúc đề thi chính thức của Bộ GD&ĐT.

**Các môn luyện thi:**
• Toán học (50 câu · 90 phút)
• Ngữ văn (tự luận + trắc nghiệm)
• Tiếng Anh (50 câu · 60 phút)
• Tổ hợp Khoa học Tự nhiên: Lý · Hóa · Sinh (mỗi môn 40 câu · 50 phút)
• Tổ hợp Khoa học Xã hội: Sử · Địa · GDCD

**Lộ trình học:**
📅 Ôn lý thuyết theo chương → Làm đề theo từng chủ đề → Thi thử toàn bộ → Phân tích điểm yếu → Luyện tập có mục tiêu`
    },
    "Thi thử online": {
      icon: "🖥️", title: "Thi thử online",
      body: `Hệ thống thi thử online mô phỏng chính xác không khí phòng thi thật, giúp bạn làm quen và tự tin trước kỳ thi.

**Tính năng:**
• Đồng hồ đếm ngược theo thời gian thật của từng môn
• Giao diện giống phần mềm thi chính thức
• Tự động chấm điểm và xếp hạng ngay sau khi nộp bài
• Xem lại đáp án và giải thích chi tiết từng câu
• Thống kê điểm theo từng chủ đề để biết điểm mạnh/yếu

**Lịch thi thử cộng đồng:** Mỗi tuần SmartExam tổ chức các buổi thi thử đồng thời để học sinh cả nước cùng tham gia và so sánh kết quả.`
    },

    // Hỗ trợ
    "Hướng dẫn sử dụng": {
      icon: "📖", title: "Hướng dẫn sử dụng",
      body: `Chào mừng bạn đến với SmartExam! Dưới đây là hướng dẫn nhanh để bắt đầu:

**Bước 1 — Đăng ký tài khoản**
Nhấn "Đăng nhập" và chọn "Tiếp tục với Google". Tài khoản được tạo tự động, hoàn toàn miễn phí.

**Bước 2 — Tải tài liệu lên**
Vào "Bộ đề của bạn" → Nhấn "Thêm bộ đề" → Chọn file PDF hoặc DOCX → AI sẽ tự động tạo câu hỏi trong vòng 30 giây.

**Bước 3 — Luyện đề**
Vào "Đề thi đã tạo" hoặc "Ngân hàng đề thi" → Chọn đề → Nhấn "Luyện đề" (không giới hạn thời gian) hoặc "Làm bài ngay" (có đồng hồ đếm ngược).

**Bước 4 — Xem kết quả**
Sau khi nộp bài, hệ thống hiển thị ngay điểm số, đáp án đúng/sai và giải thích chi tiết từng câu. Kết quả được lưu tự động vào "Lịch sử bài thi".

**Mẹo:** Dùng chức năng đánh dấu 🚩 để ghi chú các câu cần xem lại sau.`
    },
    "Câu hỏi thường gặp": {
      icon: "❓", title: "Câu hỏi thường gặp (FAQ)",
      body: `**SmartExam có miễn phí không?**
Có! Tính năng cơ bản hoàn toàn miễn phí: luyện đề từ ngân hàng, xem lịch sử, tạo tối đa 5 đề AI/tháng.

**Tôi có thể tải file loại gì?**
Hỗ trợ PDF, DOCX, DOC và TXT. Dung lượng tối đa 20MB mỗi file.

**Dữ liệu của tôi có được bảo mật không?**
Có. Chúng tôi không chia sẻ tài liệu cá nhân của bạn với bất kỳ bên thứ ba nào. Đề thi riêng tư chỉ bạn mới thấy.

**AI tạo đề có chính xác không?**
AI đạt độ chính xác trên 90% với tài liệu chuẩn. Bạn luôn có thể xem lại và chỉnh sửa trước khi lưu.

**Lịch sử bài thi được lưu bao lâu?**
Hiện tại lưu không giới hạn trong tài khoản của bạn.

**Tôi quên mật khẩu thì làm sao?**
SmartExam dùng đăng nhập Google, nên bạn không cần mật khẩu riêng. Chỉ cần đăng nhập bằng tài khoản Google là xong.`
    },
    "Liên hệ hỗ trợ": {
      icon: "💬", title: "Liên hệ hỗ trợ",
      body: `Đội ngũ hỗ trợ SmartExam luôn sẵn sàng giúp bạn!

**Kênh liên hệ:**

📧 **Email:** support@smartexam.vn
Thời gian phản hồi: trong vòng 24 giờ làm việc

💬 **Chat trực tiếp:** Nhấn biểu tượng chat ở góc dưới phải màn hình
Giờ hỗ trợ: 8:00 – 22:00 hàng ngày (kể cả cuối tuần)

📱 **Zalo OA:** SmartExam Official
Hỗ trợ nhanh các vấn đề kỹ thuật và tài khoản

🐛 **Báo lỗi & góp ý tính năng:** Dùng form "Báo lỗi" trong menu Hỗ trợ

**Trụ sở:**
Tòa nhà Innovation Hub, 99 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh`
    },
    "Báo lỗi": {
      icon: "🐛", title: "Báo lỗi",
      body: `Cảm ơn bạn đã giúp chúng tôi cải thiện SmartExam! Mỗi báo cáo lỗi đều giúp ích rất nhiều.

**Cách báo lỗi hiệu quả:**

1. **Mô tả lỗi** — Chuyện gì đang xảy ra? Bạn mong đợi điều gì?
2. **Bước tái hiện** — Bạn đã làm gì trước khi lỗi xuất hiện?
3. **Ảnh chụp màn hình** — Nếu có thể, đính kèm ảnh màn hình

**Gửi báo cáo qua:**
📧 bug@smartexam.vn
💬 Chat hỗ trợ (ưu tiên xử lý nhanh hơn)

**Thời gian xử lý:**
🟢 Lỗi nghiêm trọng (không vào được): trong 4 giờ
🟡 Lỗi tính năng: trong 1–3 ngày làm việc
🔵 Góp ý cải tiến: tổng hợp trong sprint tiếp theo

Mọi đóng góp đều được ghi nhận. Cảm ơn bạn! 🙏`
    },

    // Về chúng tôi
    "Giới thiệu": {
      icon: "🏢", title: "Giới thiệu về SmartExam",
      body: `**SmartExam** là nền tảng ôn thi trực tuyến thông minh được xây dựng với sứ mệnh giúp mọi học sinh Việt Nam tiếp cận nền giáo dục chất lượng cao, bình đẳng và hiệu quả.

**Câu chuyện của chúng tôi**
Ra đời năm 2024, SmartExam được sáng lập bởi nhóm kỹ sư và nhà giáo dục trẻ tại TP.HCM — những người từng trải qua áp lực thi cử và muốn tạo ra công cụ mà họ ước mình có hồi đó.

**Sứ mệnh**
Ứng dụng AI vào giáo dục để việc ôn thi trở nên cá nhân hóa, hiệu quả và không còn nhàm chán.

**Con số ấn tượng**
• 50,000+ học sinh đang sử dụng
• 200,000+ câu hỏi trong hệ thống
• 98% người dùng hài lòng
• Đối tác với 150+ trường THPT toàn quốc

**Đội ngũ**
25 thành viên tâm huyết gồm kỹ sư AI, chuyên gia giáo dục và thiết kế UX.`
    },
    "Điều khoản dịch vụ": {
      icon: "📋", title: "Điều khoản dịch vụ",
      body: `**Cập nhật lần cuối:** 01/03/2026

**1. Chấp nhận điều khoản**
Bằng cách sử dụng SmartExam, bạn đồng ý tuân thủ các điều khoản này.

**2. Tài khoản người dùng**
Bạn chịu trách nhiệm bảo mật tài khoản và mọi hoạt động dưới tài khoản của mình. Không được chia sẻ tài khoản cho người khác.

**3. Nội dung người dùng**
Tài liệu bạn tải lên thuộc sở hữu của bạn. Bạn cấp phép SmartExam quyền xử lý tài liệu để tạo đề thi phục vụ bạn.

**4. Sử dụng hợp lệ**
Không sử dụng SmartExam để: spam, phát tán nội dung vi phạm bản quyền, tấn công hệ thống, hoặc gian lận thi cử.

**5. Miễn trừ trách nhiệm**
SmartExam cung cấp dịch vụ "như hiện có". Chúng tôi không đảm bảo điểm số thực tế của bạn sẽ cải thiện.

**6. Thay đổi điều khoản**
Chúng tôi có thể cập nhật điều khoản bất kỳ lúc nào. Tiếp tục sử dụng nghĩa là bạn chấp nhận điều khoản mới.

Mọi thắc mắc: legal@smartexam.vn`
    },
    "Chính sách bảo mật": {
      icon: "🔒", title: "Chính sách bảo mật",
      body: `**Cập nhật lần cuối:** 01/03/2026

**Dữ liệu chúng tôi thu thập:**
• Thông tin Google (tên, email, ảnh đại diện) khi bạn đăng nhập
• Tài liệu bạn tải lên để tạo đề thi
• Kết quả bài thi và lịch sử hoạt động
• Dữ liệu thiết bị và trình duyệt (ẩn danh)

**Cách chúng tôi sử dụng dữ liệu:**
• Cung cấp và cải thiện dịch vụ
• Cá nhân hóa trải nghiệm học tập
• Gửi thông báo quan trọng về tài khoản

**Chúng tôi KHÔNG:**
❌ Bán dữ liệu cá nhân của bạn
❌ Chia sẻ tài liệu riêng tư với bên thứ ba
❌ Dùng dữ liệu cho mục đích quảng cáo ngoài nền tảng

**Bảo mật dữ liệu:**
Mọi dữ liệu được mã hóa AES-256. Máy chủ đặt tại Việt Nam, tuân thủ Nghị định 13/2023/NĐ-CP.

**Quyền của bạn:** Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu bất kỳ lúc nào qua privacy@smartexam.vn`
    },
    "Tuyển dụng": {
      icon: "💼", title: "Tuyển dụng",
      body: `Cảm ơn bạn đã quan tâm đến SmartExam!

**Hiện tại chúng tôi chưa có đợt tuyển dụng nào đang mở.**

Chúng tôi sẽ thông báo khi có vị trí phù hợp. Trong thời gian chờ, bạn có thể gửi CV ứng tuyển tự nguyện để chúng tôi lưu hồ sơ và liên hệ khi có nhu cầu.

📩 Gửi CV về: careers@smartexam.vn
Tiêu đề email: [Ứng tuyển tự nguyện] — Họ tên — Vị trí mong muốn`
    },
  };

  const openedContent = openPage ? CONTENT[openPage] : null;

  return (
    <>
      <footer style={{ background: "#0f172a", color: "#94a3b8", marginTop: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 17, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>Smart<span style={{ color: "#38bdf8" }}>Exam</span></span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "#64748b", maxWidth: 300 }}>Nền tảng ôn thi thông minh, giúp học sinh ôn luyện hiệu quả với ngân hàng đề thi phong phú và AI hỗ trợ.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                {["fb", "yt", "tw", "ig"].map(s => (
                  <div key={s} style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#94a3b8", fontWeight: 700, border: "1px solid rgba(255,255,255,0.08)" }}>{s.toUpperCase()}</div>
                ))}
              </div>
            </div>
            {[
              { title: "Sản phẩm", links: ["Ngân hàng đề thi", "Tạo đề AI", "Luyện thi THPT", "Thi thử online"] },
              { title: "Hỗ trợ", links: ["Hướng dẫn sử dụng", "Câu hỏi thường gặp", "Liên hệ hỗ trợ", "Báo lỗi"] },
              { title: "Về chúng tôi", links: ["Giới thiệu", "Điều khoản dịch vụ", "Chính sách bảo mật", "Tuyển dụng"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} onClick={() => setOpenPage(l)}
                    style={{ fontSize: 13, color: "#64748b", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = "#38bdf8"}
                    onMouseLeave={e => e.target.style.color = "#64748b"}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#475569" }}>© 2026 SmartExam. Bảo lưu mọi quyền.</span>
            <span style={{ fontSize: 12, color: "#475569" }}>🇻🇳 Được tạo bởi đội ngũ Việt Nam</span>
          </div>
        </div>
      </footer>

      {/* Content modal */}
      {openedContent && (
        <div onClick={() => setOpenPage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)", padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 620, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "24px 28px 20px", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {openedContent.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{openedContent.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>SmartExam · smartexam.vn</div>
              </div>
              <button onClick={() => setOpenPage(null)}
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer", padding: 8, borderRadius: 10, display: "flex", flexShrink: 0 }}>
                <Icon path={Icons.close} size={16} color="#64748b" />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              {openedContent.body.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 10 }} />;
                const isBold = line.startsWith("**") && line.includes("**");
                const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<b style="color:#0f172a">${t}</b>`);
                return (
                  <div key={i} dangerouslySetInnerHTML={{ __html: formatted }}
                    style={{ fontSize: isBold && line.startsWith("**") && line.endsWith("**") ? 14.5 : 13.5, color: "#475569", lineHeight: 1.75, marginBottom: 4, fontWeight: isBold && line.startsWith("**") && line.endsWith("**") ? 700 : 400 }} />
                );
              })}
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1.5px solid #f1f5f9", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={() => setOpenPage(null)}
                style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

// ─── PRACTICE PAGE ───────────────────────────────────────────────────────────
function PracticePage({ exam, onBack, mode = "exam", onSaveResult, currentUser }) {
  const isPractice = mode === "practice";

  // Câu hỏi thật từ backend — nếu exam.realQuestions có sẵn (custom exam) thì dùng luôn
  const [questions, setQuestions] = useState(exam.realQuestions || generateQuestions(exam));
  const [loadingQ, setLoadingQ] = useState(!exam.realQuestions);

  // TẤT CẢ hooks phải khai báo trước bất kỳ return nào
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [activeQ, setActiveQ] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.time * 60);
  const [showConfirm, setShowConfirm] = useState(false);
  const subjectColor = SUBJECT_COLORS[exam.subject] || "#1d4ed8";
  const optLabels = ["A", "B", "C", "D"];

  useEffect(() => {
    if (exam.realQuestions) return;

    const loadQuestions = async () => {
      try {
        // Thử API /detail trước (lấy được cả Private lẫn Public)
        let detail = null;
        try {
          detail = await examApi.getDetail(exam.id);
        } catch (_) {
          // Fallback sang getPublicDetail nếu chưa có API mới
          detail = await examApi.getPublicDetail(exam.id);
        }

        if (detail?.questions?.length) {
          setQuestions(detail.questions.map((q) => {
            // Đảm bảo opts luôn là mảng 4 phần tử, không bao giờ null/undefined
            const rawOpts = Array.isArray(q.options) ? q.options : [];
            const opts = rawOpts.length > 0
              ? rawOpts.map((o, i) => {
                  if (!o) return ["A","B","C","D"][i] + ". (Trống)";
                  // Nếu option chưa có prefix "A. " thì tự thêm vào
                  return /^[A-D]\.\s/.test(String(o)) ? String(o) : `${["A","B","C","D"][i]}. ${o}`;
                })
              : ["A. (Chưa có đáp án)", "B. (Chưa có đáp án)", "C. (Chưa có đáp án)", "D. (Chưa có đáp án)"];

            return {
              id: q.id,
              q: q.questionContent || "(Câu hỏi trống)",
              opts,
              ans: q.answer ? ["A","B","C","D"].indexOf(q.answer.trim().toUpperCase()) : 0,
              explanation: "",
            };
          }));
        }
      } catch (err) {
        console.error("Không tải được câu hỏi:", err);
        // Giữ mock questions làm fallback, không crash
      } finally {
        setLoadingQ(false);
      }
    };

    loadQuestions();
  }, [exam.id]);

  // Timer — đếm xuống khi thi, đếm lên khi luyện
  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      if (isPractice) {
        setTimeElapsed(p => p + 1);
      } else {
        setTimeLeft(p => {
          if (p <= 1) {
            clearInterval(t);
            setSubmitted(true);
            // Tự động lưu lịch sử khi hết giờ
            if (onSaveResult) {
              setAnswers(prev => {
                const finalScore = Math.round((questions.filter(q => prev[q.id] === q.ans).length / questions.length) * 100);
                const now = new Date();
                const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
                onSaveResult({ ...exam, score: finalScore, date: dateStr, status: finalScore >= 50 ? "Đạt" : "Không đạt", resultId: Date.now() });
                return prev;
              });
            }
            return 0;
          }
          return p - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, isPractice]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const answered = Object.keys(answers).length;
  const score = submitted ? questions.filter(q => answers[q.id] === q.ans).length : 0;
  const pct = submitted ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= 50;
  const timerWarning = !isPractice && timeLeft < 120 && !submitted;

  const [expandedExp, setExpandedExp] = useState({});
  const toggleExp = (qId) => setExpandedExp(p => ({ ...p, [qId]: !p[qId] }));

  const handleSelect = (qId, idx) => { if (!submitted) setAnswers(p => ({ ...p, [qId]: idx })); };
  const toggleFlag = (qId) => setFlagged(p => ({ ...p, [qId]: !p[qId] }));

  if (loadingQ) return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 52, height: 52, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>Đang tải câu hỏi...</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>{exam.title}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid rgba(59,130,246,0.12)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Icon path={Icons.arrowLeft} size={15} color="#64748b" /> Thoát
          </button>
          <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{exam.title}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: isPractice ? "#f0fdf4" : "#eff6ff", color: isPractice ? "#059669" : "#1d4ed8", border: `1px solid ${isPractice ? "#86efac" : "#bfdbfe"}` }}>
                {isPractice ? "🟢 Luyện tập" : "🔵 Thi"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{exam.subject} · {questions.length} câu hỏi{isPractice ? " · Không giới hạn thời gian" : ` · ${exam.time} phút`}</div>
          </div>
        </div>
        {submitted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ label: "Đúng", val: score, color: "#059669", bg: "#f0fdf4", border: "#86efac" },
                { label: "Sai", val: questions.length - score, color: "#dc2626", bg: "#fff5f5", border: "#fca5a5" },
                { label: "Điểm", val: `${(pct/10).toFixed(1)}/10`, color: passed ? "#059669" : "#dc2626", bg: passed ? "#f0fdf4" : "#fff5f5", border: passed ? "#86efac" : "#fca5a5" }
              ].map(s => (
                <div key={s.label} style={{ padding: "6px 14px", borderRadius: 10, background: s.bg, border: `1.5px solid ${s.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { setAnswers({}); setFlagged({}); setSubmitted(false); setActiveQ(0); setTimeLeft(exam.time * 60); setTimeElapsed(0); setExpandedExp({}); }}
              style={{ padding: "9px 18px", borderRadius: 11, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              🔄 Làm lại
            </button>
            <button onClick={onBack}
              style={{ padding: "9px 18px", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              ← Về trang chủ
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Timer: đếm xuống khi thi, đếm lên khi luyện */}
            {isPractice ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "8px 16px" }}>
                <Icon path={Icons.clock} size={16} color="#059669" />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums" }}>{formatTime(timeElapsed)}</span>
                <span style={{ fontSize: 11, color: "#86efac", fontWeight: 600 }}>Không giới hạn</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: timerWarning ? "#fff5f5" : "#eff6ff", border: `1.5px solid ${timerWarning ? "#fca5a5" : "#bfdbfe"}`, borderRadius: 12, padding: "8px 16px" }}>
                <Icon path={Icons.clock} size={16} color={timerWarning ? "#dc2626" : "#1d4ed8"} />
                <span style={{ fontSize: 18, fontWeight: 900, color: timerWarning ? "#dc2626" : "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{formatTime(timeLeft)}</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: "#64748b" }}>
              <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{answered}</span>/{questions.length} đã trả lời
            </div>
            <button onClick={() => setShowConfirm(true)} style={{ padding: "9px 22px", borderRadius: 11, background: isPractice ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: isPractice ? "0 4px 14px rgba(5,150,105,0.3)" : "0 4px 14px rgba(29,78,216,0.3)" }}>
              {isPractice ? "Nộp bài luyện tập" : "Nộp bài"}
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", maxWidth: 1280, margin: "0 auto", width: "100%", padding: "28px 32px", gap: 28 }}>
        {/* Question panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {questions.map((q, qi) => {
            const userAns = answers[q.id];
            const isFlagged = flagged[q.id];
            const isCorrect = submitted && userAns === q.ans;
            const isWrong = submitted && userAns !== undefined && userAns !== q.ans;
            const unanswered = submitted && userAns === undefined;

            // Card border color after submit
            const cardBorder = submitted
              ? isCorrect ? "2px solid #86efac"
              : isWrong   ? "2px solid #fca5a5"
              : "2px solid #fed7aa"  // unanswered
              : `2px solid ${activeQ === qi ? subjectColor + "55" : "rgba(59,130,246,0.1)"}`;

            return (
              <div key={q.id} id={`q-${qi}`}
                style={{ background: "#fff", borderRadius: 18, border: cardBorder, boxShadow: activeQ === qi && !submitted ? `0 8px 32px ${subjectColor}22` : "0 4px 16px rgba(29,78,216,0.06)", overflow: "hidden", transition: "all 0.2s" }}
                onClick={() => setActiveQ(qi)}>

                {/* Question header */}
                <div style={{ padding: "18px 22px 14px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 32, height: 32, borderRadius: 10,
                      background: submitted
                        ? isCorrect ? "linear-gradient(135deg,#059669,#10b981)"
                        : isWrong   ? "linear-gradient(135deg,#dc2626,#f87171)"
                        : unanswered ? "#f59e0b" : "#f1f5f9"
                        : userAns !== undefined ? `linear-gradient(135deg,${subjectColor},${subjectColor}aa)` : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 13,
                      color: submitted || userAns !== undefined ? "#fff" : "#94a3b8",
                      flexShrink: 0 }}>
                      {submitted ? (isCorrect ? "✓" : isWrong ? "✗" : "!") : qi + 1}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.6 }}>{q.q}</p>
                  </div>
                  {!submitted && (
                    <button onClick={(e) => { e.stopPropagation(); toggleFlag(q.id); }}
                      style={{ background: isFlagged ? "#fff7ed" : "none", border: isFlagged ? "1.5px solid #fed7aa" : "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 8px", cursor: "pointer", flexShrink: 0, marginLeft: 12 }} title="Đánh dấu">
                      <Icon path={Icons.flag} size={14} color={isFlagged ? "#f97316" : "#cbd5e1"} />
                    </button>
                  )}
                </div>

                {/* Options */}
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.opts.map((opt, idx) => {
                    const selected = userAns === idx;
                    const isCorrectOpt = idx === q.ans;

                    // After submit: color logic
                    let border, bg, labelBg, labelColor, textColor, icon = null;
                    if (submitted) {
                      if (isCorrectOpt) {
                        border = "2px solid #059669";
                        bg = "#f0fdf4";
                        labelBg = "linear-gradient(135deg,#059669,#10b981)";
                        labelColor = "#fff";
                        textColor = "#15803d";
                        icon = <Icon path={Icons.check} size={15} color="#059669" />;
                      } else if (selected && !isCorrectOpt) {
                        border = "2px solid #dc2626";
                        bg = "#fff5f5";
                        labelBg = "linear-gradient(135deg,#dc2626,#f87171)";
                        labelColor = "#fff";
                        textColor = "#dc2626";
                        icon = <Icon path={Icons.xmark} size={15} color="#dc2626" />;
                      } else {
                        border = "1.5px solid #e2e8f0";
                        bg = "#fafbfc";
                        labelBg = "#f1f5f9";
                        labelColor = "#94a3b8";
                        textColor = "#94a3b8";
                      }
                    } else {
                      border = selected ? `2px solid ${subjectColor}` : "1.5px solid #e2e8f0";
                      bg = selected ? `${subjectColor}0d` : "#fafbfc";
                      labelBg = selected ? `linear-gradient(135deg,${subjectColor},${subjectColor}cc)` : "#f1f5f9";
                      labelColor = selected ? "#fff" : "#94a3b8";
                      textColor = selected ? "#0f172a" : "#475569";
                      icon = selected ? <Icon path={Icons.check} size={16} color={subjectColor} /> : null;
                    }

                    return (
                      <button key={idx} onClick={(e) => { e.stopPropagation(); handleSelect(q.id, idx); }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderRadius: 12, border, background: bg, cursor: submitted ? "default" : "pointer", transition: "all 0.18s", textAlign: "left", boxShadow: selected && !submitted ? `0 4px 16px ${subjectColor}22` : "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: labelBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: labelColor, flexShrink: 0, transition: "all 0.18s" }}>
                          {optLabels[idx]}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: selected || (submitted && isCorrectOpt) ? 600 : 400, color: textColor, transition: "all 0.18s", flex: 1 }}>{opt}</span>
                        {icon && <div style={{ marginLeft: "auto", flexShrink: 0 }}>{icon}</div>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation accordion (shown after submit) */}
                {submitted && (() => {
                  const isOpen = !!expandedExp[q.id];
                  const accentColor = isCorrect ? "#059669" : isWrong ? "#dc2626" : "#92400e";
                  const accentBg = isCorrect ? "#f0fdf4" : isWrong ? "#fff5f5" : "#fffbeb";
                  const accentBorder = isCorrect ? "#86efac" : isWrong ? "#fca5a5" : "#fde68a";
                  const statusText = isCorrect ? "✅ Chính xác!" : isWrong ? "❌ Chưa đúng" : "⚠ Chưa trả lời";
                  return (
                    <div style={{ margin: "0 22px 20px", borderRadius: 12, border: `1.5px solid ${accentBorder}`, overflow: "hidden" }}>
                      {/* Header — always visible, click to toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExp(q.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: accentBg, border: "none", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: accentColor }}>{statusText}</span>
                          {isWrong && (
                            <span style={{ fontSize: 12, color: "#475569" }}>
                              · Đáp án đúng: <b style={{ color: "#059669" }}>{optLabels[q.ans]}</b>
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>💡 Giải thích</span>
                          {/* Chevron icon */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </button>

                      {/* Body — slides open/closed */}
                      <div style={{ maxHeight: isOpen ? "400px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                        <div style={{ padding: "14px 16px", background: "#fff", borderTop: `1px solid ${accentBorder}` }}>
                          {isWrong && (
                            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
                              <span style={{ fontSize: 12.5, color: "#475569" }}>
                                Đáp án đúng: <b style={{ color: "#059669" }}>{optLabels[q.ans]}. {q.opts[q.ans]}</b>
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.75 }}>
                            {q.explanation || `Đáp án ${optLabels[q.ans]} là chính xác. ${q.opts[q.ans]} là câu trả lời phù hợp nhất với nội dung câu hỏi.`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 92, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Progress / Result panel */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid rgba(59,130,246,0.1)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
              {submitted ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Kết quả bài thi</div>
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: passed ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#dc2626,#f87171)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", boxShadow: passed ? "0 8px 20px rgba(5,150,105,0.3)" : "0 8px 20px rgba(220,38,38,0.3)" }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{(pct/10).toFixed(1)}<span style={{fontSize:13,fontWeight:600}}>/10</span></span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: passed ? "#059669" : "#dc2626" }}>{passed ? "🎉 Đạt!" : "📖 Chưa đạt"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Câu đúng", val: score, color: "#059669", bg: "#f0fdf4" },
                      { label: "Câu sai", val: questions.length - score, color: "#dc2626", bg: "#fff5f5" },
                      { label: "Bỏ trống", val: questions.length - Object.keys(answers).length, color: "#f59e0b", bg: "#fffbeb" },
                      { label: "Tổng câu", val: questions.length, color: "#1d4ed8", bg: "#eff6ff" },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Tiến độ làm bài</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Đã làm</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{answered}/{questions.length}</span>
                  </div>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(answered / questions.length) * 100}%`, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: 999, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: subjectColor }} />
                      <span style={{ fontSize: 11, color: "#64748b" }}>Đã trả lời</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: "#f97316" }} />
                      <span style={{ fontSize: 11, color: "#64748b" }}>Đánh dấu</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Question map */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid rgba(59,130,246,0.1)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Bảng câu hỏi</div>
              {submitted && (
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {[{ color: "#059669", bg: "#dcfce7", label: "Đúng" }, { color: "#dc2626", bg: "#fee2e2", label: "Sai" }, { color: "#f59e0b", bg: "#fef3c7", label: "Trống" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}` }} />
                      <span style={{ fontSize: 10.5, color: "#64748b" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }}>
                {questions.map((q, qi) => {
                  const answered_ = answers[q.id] !== undefined;
                  const isFlagged_ = flagged[q.id];
                  const isActive = activeQ === qi;
                  const isCorrectQ = submitted && answers[q.id] === q.ans;
                  const isWrongQ = submitted && answers[q.id] !== undefined && answers[q.id] !== q.ans;

                  const btnBg = submitted
                    ? isCorrectQ ? "#dcfce7" : isWrongQ ? "#fee2e2" : "#fef3c7"
                    : isFlagged_ ? "#fff7ed" : answered_ ? `${subjectColor}18` : "#f8fafc";
                  const btnColor = submitted
                    ? isCorrectQ ? "#059669" : isWrongQ ? "#dc2626" : "#f59e0b"
                    : isFlagged_ ? "#f97316" : answered_ ? subjectColor : "#94a3b8";
                  const btnBorder = isActive
                    ? `2px solid ${submitted ? (isCorrectQ ? "#059669" : isWrongQ ? "#dc2626" : "#f59e0b") : subjectColor}`
                    : submitted ? `1.5px solid ${isCorrectQ ? "#86efac" : isWrongQ ? "#fca5a5" : "#fde68a"}` : "1.5px solid #e2e8f0";

                  return (
                    <button key={q.id} onClick={() => { setActiveQ(qi); document.getElementById(`q-${qi}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                      style={{ aspectRatio: "1", borderRadius: 9, border: btnBorder, background: btnBg, color: btnColor, fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {submitted ? (isCorrectQ ? "✓" : isWrongQ ? "✗" : "–") : qi + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nộp bài — chỉ hiện khi chưa nộp */}
            {!submitted && (
              <button onClick={() => setShowConfirm(true)} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 6px 20px rgba(29,78,216,0.35)" }}>
                Nộp bài ({answered}/{questions.length})
              </button>
            )}

            {/* Sau khi nộp: nút Làm lại và Về trang chủ */}
            {submitted && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setAnswers({}); setFlagged({}); setSubmitted(false); setActiveQ(0); setTimeLeft(exam.time * 60); setTimeElapsed(0); setExpandedExp({}); }}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 13, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 20px rgba(29,78,216,0.3)" }}>
                  🔄 Làm lại
                </button>
                <button onClick={onBack}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 13, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  ← Về trang chủ
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 400, boxShadow: "0 24px 60px rgba(29,78,216,0.2)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: answered < questions.length ? "#fff7ed" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: `2px solid ${answered < questions.length ? "#fed7aa" : "#bfdbfe"}` }}>
              <Icon path={answered < questions.length ? Icons.alertCircle : Icons.check} size={26} color={answered < questions.length ? "#f97316" : "#1d4ed8"} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Xác nhận nộp bài?</h3>
            {answered < questions.length && (
              <p style={{ fontSize: 13.5, color: "#f97316", margin: "0 0 6px", fontWeight: 600 }}>⚠ Còn {questions.length - answered} câu chưa trả lời</p>
            )}
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px" }}>Đã hoàn thành <b style={{ color: "#1d4ed8" }}>{answered}/{questions.length}</b> câu hỏi</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Làm tiếp</button>
              <button onClick={async () => {
              setShowConfirm(false);
              setSubmitted(true);
              if (isPractice) {
                // Chế độ luyện tập: gọi practice-submit
                try {
                  await examApi.practiceSubmit({
                    userId: currentUser?.id,
                    examId: exam.id,
                    answers: mappers.answersToDTO(answers, questions),
                  });
                } catch(e) { console.error("Lỗi nộp luyện tập:", e); }
              } else {
                // Chế độ thi thật: gọi custom-exams/submit
                try {
                  const result = await customExamApi.submit({
                    userId: currentUser?.id,
                    customExamId: exam.customExamId,
                    answers: mappers.answersToDTO(answers, questions),
                  });
                  if (onSaveResult) {
                    const now = new Date();
                    const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
                    onSaveResult({ ...exam, score: Math.round(result.score ?? 0), date: dateStr, status: (result.score ?? 0) >= 50 ? "Đạt" : "Không đạt", resultId: result.resultId ?? Date.now() });
                  }
                } catch(e) {
                  // Fallback: tính điểm local nếu API lỗi
                  const finalScore = Math.round((questions.filter(q => answers[q.id] === q.ans).length / questions.length) * 100);
                  const now = new Date();
                  const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
                  if (onSaveResult) onSaveResult({ ...exam, score: finalScore, date: dateStr, status: finalScore >= 50 ? "Đạt" : "Không đạt", resultId: Date.now() });
                }
              }
            }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LoginPage({ setPage, setIsLoggedIn }) {
  const [loading, setLoading] = useState(false);
  const handleLogin = () => {
    setLoading(true);
    // Redirect sang Google OAuth — backend sẽ redirect về localhost:5173 sau khi login
    window.location.href = auth.loginUrl;
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#eff6ff 0%,#f0f9ff 50%,#dbeafe 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Decorations */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: [200,120,80,300,150,100][i], height: [200,120,80,300,150,100][i], borderRadius: "50%", background: `rgba(29,78,216,${[0.04,0.06,0.03,0.03,0.05,0.04][i]})`, top: ["10%","70%","40%","-10%","80%","20%"][i], left: ["5%","10%","80%","60%","75%","45%"][i], animation: `float ${[8,12,10,15,9,11][i]}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }} />
      ))}
      <div style={{ background: "#fff", borderRadius: 24, padding: "52px 48px", width: 440, boxShadow: "0 32px 80px rgba(29,78,216,0.18)", position: "relative", border: "1.5px solid rgba(59,130,246,0.12)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8,#1d4ed8)", borderRadius: "24px 24px 0 0", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 68, height: 68, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(29,78,216,0.4)" }}>
            <span style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: -0.5 }}>Smart<span style={{ color: "#1d4ed8" }}>Exam</span></h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Nền tảng ôn thi thông minh hàng đầu</p>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, marginBottom: 28, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>Truy cập 50,000+ đề thi miễn phí</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>AI tự động tạo đề theo yêu cầu</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569" }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>Theo dõi tiến độ học tập chi tiết</span>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "1.5px solid #e2e8f0", background: loading ? "#f1f5f9" : "#fff", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 700, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "all 0.2s" }}>
          {loading ? (
            <><div style={{ width: 20, height: 20, border: "2.5px solid #e2e8f0", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span>Đang đăng nhập...</span></>
          ) : (
            <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Đăng nhập bằng Google</>
          )}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>Bằng cách đăng nhập, bạn đồng ý với <span style={{ color: "#1d4ed8", cursor: "pointer" }}>điều khoản</span> của chúng tôi</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

function UploadModal({ onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | shared
  const [progress, setProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(null); // null | true | false

  const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
  const MAX_MB = 20;

  const validate = (f) => {
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Chỉ chấp nhận: ${ACCEPTED.join(", ")}`;
    if (f.size > MAX_MB * 1024 * 1024) return `File tối đa ${MAX_MB}MB`;
    return null;
  };

  const handleFile = (f) => {
    const err = validate(f);
    if (err) { alert(err); return; }
    setFile(f);
    setStatus("idle");
    setProgress(0);
    setIsPublic(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setStatus("done"); return 100; }
        return p + Math.random() * 18;
      });
    }, 200);
  };

  const handleConfirmShare = () => {
    setStatus("shared");
  };

  const getFileIcon = (name) => {
    const ext = name?.split(".").pop().toLowerCase();
    if (ext === "pdf") return { icon: "📄", color: "#dc2626", bg: "#fff5f5" };
    if (ext === "docx" || ext === "doc") return { icon: "📝", color: "#1d4ed8", bg: "#eff6ff" };
    return { icon: "📃", color: "#64748b", bg: "#f8fafc" };
  };

  const fmt = (bytes) => bytes > 1024*1024 ? (bytes/1024/1024).toFixed(1)+" MB" : (bytes/1024).toFixed(0)+" KB";
  const fi = file ? getFileIcon(file.name) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: 480, boxShadow: "0 28px 70px rgba(29,78,216,0.2)", position: "relative", border: "1.5px solid rgba(59,130,246,0.15)", transition: "all 0.3s" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: status === "shared" && isPublic ? "linear-gradient(90deg,#059669,#10b981)" : "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "22px 22px 0 0", transition: "background 0.4s" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display:"flex" }}>
          <Icon path={Icons.close} size={16} color="#64748b" />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, background: status === "shared" && isPublic ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.4s" }}>
            <Icon path={status === "done" || status === "shared" ? Icons.check : Icons.upload} size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {status === "done" ? "Tải lên thành công!" : status === "shared" ? "Hoàn tất!" : "Tải tài liệu lên"}
            </div>
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>
              {status === "done" ? "Chọn chế độ chia sẻ cho bộ đề" : status === "shared" ? (isPublic ? "Bộ đề đã được chia sẻ công khai" : "Bộ đề đã được lưu riêng tư") : "AI sẽ tự động tạo đề thi từ nội dung"}
            </div>
          </div>
        </div>

        {/* Drop zone */}
        {status !== "done" && status !== "shared" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("se-file-input").click()}
            style={{ border: `2px dashed ${dragOver ? "#1d4ed8" : file ? "#86efac" : "#cbd5e1"}`, borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#eff6ff" : file ? "#f0fdf4" : "#fafbfc", transition: "all 0.2s", marginBottom: 18 }}
          >
            <input id="se-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {!file ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Kéo thả file vào đây</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 14 }}>hoặc click để chọn file từ máy</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {ACCEPTED.map(ext => (
                    <span key={ext} style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>{ext.toUpperCase()}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 10 }}>Tối đa {MAX_MB}MB</div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: fi.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{fi.icon}</div>
                <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{fmt(file.size)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", flexShrink: 0 }}>
                  <Icon path={Icons.close} size={13} color="#dc2626" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload progress */}
        {status === "uploading" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Đang tải lên...</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Share choice — shown after upload done */}
        {status === "done" && (
          <div style={{ marginBottom: 20 }}>
            {/* File info row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 12, padding: "12px 16px", marginBottom: 20, border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: fi.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{fi.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{fmt(file.size)} · Đã tải lên ✅</div>
              </div>
            </div>

            {/* Hướng dẫn đạt 100% chính xác */}
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 11, padding: "11px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#15803d", marginBottom: 6 }}>✅ Để AI tạo đề chính xác 100%</div>
              <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.7 }}>
                Đánh dấu đáp án đúng trong file theo 1 trong các cách:<br/>
                <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 4 }}>*A. Nội dung</code> &nbsp;
                <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 4 }}>A. Nội dung [Đ]</code> &nbsp;
                <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 4 }}>A. Nội dung ✓</code><br/>
                Hoặc thêm bảng đáp án cuối file: <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 4 }}>Câu 1: B</code>
              </div>
              <button onClick={downloadSampleFile}
                style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, background: "#15803d", border: "none", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                📄 Tải file mẫu
              </button>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>Bạn có muốn chia sẻ bộ đề công khai không?</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 16 }}>Bộ đề công khai sẽ hiển thị trong <b style={{ color: "#1d4ed8" }}>Ngân hàng đề thi</b> để mọi người cùng luyện tập.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Public option */}
              <button onClick={() => setIsPublic(true)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, border: `2px solid ${isPublic === true ? "#1d4ed8" : "#e2e8f0"}`, background: isPublic === true ? "#eff6ff" : "#fafbfc", cursor: "pointer", textAlign: "left", transition: "all 0.2s", boxShadow: isPublic === true ? "0 4px 16px rgba(29,78,216,0.12)" : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isPublic === true ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isPublic === true ? "#1d4ed8" : "#0f172a" }}>Chia sẻ công khai</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Hiển thị trong Ngân hàng đề thi, mọi người có thể luyện tập</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isPublic === true ? "#1d4ed8" : "#cbd5e1"}`, background: isPublic === true ? "#1d4ed8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {isPublic === true && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>

              {/* Private option */}
              <button onClick={() => setIsPublic(false)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, border: `2px solid ${isPublic === false ? "#7c3aed" : "#e2e8f0"}`, background: isPublic === false ? "#faf5ff" : "#fafbfc", cursor: "pointer", textAlign: "left", transition: "all 0.2s", boxShadow: isPublic === false ? "0 4px 16px rgba(124,58,237,0.12)" : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isPublic === false ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  <span style={{ fontSize: 20 }}>🔒</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isPublic === false ? "#7c3aed" : "#0f172a" }}>Chỉ mình tôi</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Lưu riêng tư trong Bộ đề của bạn, không ai khác thấy</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isPublic === false ? "#7c3aed" : "#cbd5e1"}`, background: isPublic === false ? "#7c3aed" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {isPublic === false && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Final shared state */}
        {status === "shared" && (
          <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>{isPublic ? "🌐" : "🔒"}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              {isPublic ? "Bộ đề đã được chia sẻ!" : "Bộ đề đã được lưu!"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              {isPublic
                ? <>Bộ đề của bạn sẽ xuất hiện trong <b style={{ color: "#1d4ed8" }}>Ngân hàng đề thi</b> sau khi được AI xử lý xong.</>
                : <>Bộ đề đã được lưu vào <b style={{ color: "#7c3aed" }}>Bộ đề của bạn</b>. Chỉ mình bạn có thể xem.</>
              }
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          {status === "shared" ? (
            <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}>
              Hoàn tất
            </button>
          ) : status === "done" ? (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Để sau
              </button>
              <button onClick={handleConfirmShare} disabled={isPublic === null}
                style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: isPublic === null ? "#e2e8f0" : isPublic ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: isPublic === null ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: isPublic === null ? "not-allowed" : "pointer", boxShadow: isPublic !== null ? "0 4px 14px rgba(29,78,216,0.3)" : "none", transition: "all 0.2s" }}>
                {isPublic === null ? "Chọn một tùy chọn" : isPublic ? "✅ Xác nhận chia sẻ" : "🔒 Lưu riêng tư"}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleUpload} disabled={!file || status === "uploading"}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: !file || status === "uploading" ? "#e2e8f0" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: !file || status === "uploading" ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: !file || status === "uploading" ? "not-allowed" : "pointer", boxShadow: file && status !== "uploading" ? "0 4px 14px rgba(29,78,216,0.35)" : "none", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {status === "uploading" ? (
                  <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang tải...</>
                ) : (
                  <><Icon path={Icons.upload} size={16} color={file ? "#fff" : "#94a3b8"} /> Tải lên</>
                )}
              </button>
            </>
          )}
        </div>

        {status === "idle" && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
            💡 Khi kết nối backend, file sẽ được AI phân tích và tự động tạo đề thi.
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function HomePage({ onCreateExam, onPractice, onGoBank, onRequireLogin, currentUser, onExamCreated, refreshKey = 0 }) {
  const guard = onRequireLogin || null;

  const [uploadedFile, setUploadedFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(null);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [savedExam, setSavedExam] = useState(null);

  // Load đề công khai từ Ngân hàng đề thi
  const [exploreExams, setExploreExams] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  useEffect(() => {
    setLoadingExplore(true);
    examApi.getPublic()
      .then(data => setExploreExams(data.map(mappers.examPublic).slice(0, 8)))
      .catch(() => setExploreExams([]))
      .finally(() => setLoadingExplore(false));
  }, [refreshKey]); // đề vừa được AI tạo

  const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
  const MAX_MB = 20;

  const handleFileChange = (e) => {
    if (guard) { e.target.value = ""; guard(); return; }
    const f = e.target.files[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) { alert(`Chỉ chấp nhận: ${ACCEPTED.join(", ")}`); return; }
    if (f.size > MAX_MB * 1024 * 1024) { alert(`File tối đa ${MAX_MB}MB`); return; }
    setUploadedFile(f);
    setDone(false); setIsPublic(null); setAiProgress(0);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setDone(false); setIsPublic(null); setAiProgress(0);
    document.getElementById("hero-file-input").value = "";
  };

  const handleClickCreate = () => {
    if (guard) { guard(); return; }
    if (!uploadedFile) { alert("Vui lòng tải file lên trước!"); return; }
    setIsPublic(null);
    setShowShareModal(true);
  };

  const handleConfirmCreate = async () => {
    if (isPublic === null) return;
    setShowShareModal(false);
    setCreating(true);
    setAiProgress(10);
    try {
      // Bước 1: Upload file → AI trích xuất câu hỏi
      const aiRawJson = await aiApi.upload(uploadedFile);
      setAiProgress(55);
      // Bước 2: Parse JSON từ AI (backend có thể trả string hoặc object)
      let questions;
      try {
        if (typeof aiRawJson === "string") {
          const cleaned = aiRawJson.replace(/```json|```/g, "").trim();
          questions = JSON.parse(cleaned);
        } else if (Array.isArray(aiRawJson)) {
          questions = aiRawJson;
        } else {
          questions = [];
        }
      } catch { questions = []; }
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Không thể đọc câu hỏi từ AI. Vui lòng thử lại.");
      }
      // Bước 3: Lưu đề vào DB
      const saved = await examApi.saveFull({
        title: uploadedFile.name.replace(/\.[^/.]+$/, ""),
        questions: Array.isArray(questions) ? questions : [],
        userId: currentUser?.id,
      });
      setAiProgress(80);
      // Bước 4: Cập nhật trạng thái Public/Private
      await examApi.updateStatus(saved.id, isPublic ? "Public" : "Private");
      setAiProgress(100);
      setTimeout(() => {
        setCreating(false);
        setDone(true);
        setSavedExam({
          ...saved,
          title: saved.title || uploadedFile.name.replace(/\.[^/.]+$/, ""),
          subject: saved.subject || "Chung",
          questions: saved.totalQuestions || 10,
          time: 30,
          attempts: 0,
          rating: 0,
        });
        if (onExamCreated) onExamCreated(); // trigger reload BankPage + MyExamsPage
      }, 300);
    } catch (err) {
      console.error("Lỗi tạo đề:", err);
      setCreating(false);
      alert("Lỗi tạo đề: " + err.message);
    }
  };

  const fmt = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(1)+" MB" : (b/1024).toFixed(0)+" KB";
  const getExt = (name) => name?.split(".").pop().toLowerCase();

  // Tạo và tải file mẫu .txt chuẩn SmartExam
  const downloadSampleFile = () => {
    const sample = `BÀI TRẮC NGHIỆM MẪU - SMARTEXAM

Câu 1: Đây là nội dung câu hỏi số 1?
A. Đáp án A (sai)
*B. Đáp án B (đúng) ← dấu * trước chữ cái
C. Đáp án C (sai)
D. Đáp án D (sai)

Câu 2: Đây là nội dung câu hỏi số 2?
A. Đáp án A (sai)
B. Đáp án B (sai)
C. Đáp án C (đúng) [Đ] ← ký hiệu [Đ] sau nội dung
D. Đáp án D (sai)

Câu 3: Đây là nội dung câu hỏi số 3?
A. Đáp án A (sai)
B. Đáp án B (sai)
C. Đáp án C (sai)
D. Đáp án D (đúng) *  ← dấu * cuối dòng

===== BẢNG ĐÁP ÁN (cách khác) =====
Câu 1: B
Câu 2: C
Câu 3: D`;
    const blob = new Blob([sample], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "smartexam-file-mau.txt";
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 60px" }}>
      {/* Hero */}
      <section style={{ padding: "60px 0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, background: "#1d4ed8", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>Nền tảng ôn thi thông minh #1 Việt Nam</span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: "#0f172a", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: -1 }}>Ôn thi hiệu quả với <span style={{ background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trí tuệ AI</span></h1>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>Tải lên tài liệu của bạn, AI sẽ tự động tạo đề thi phù hợp. Khám phá kho đề thi phong phú với hơn 50,000 câu hỏi.</p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <input id="hero-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={handleFileChange} />
            {!uploadedFile ? (
              <button onClick={() => document.getElementById("hero-file-input").click()}
                style={{ padding: "14px 28px", borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(29,78,216,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon path={Icons.upload} size={17} color="#fff" /> Tải file lên
              </button>
            ) : (
              <div style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #bfdbfe", background: "#eff6ff", display: "flex", alignItems: "center", gap: 10, maxWidth: 230 }}>
                <span style={{ fontSize: 20 }}>{getExt(uploadedFile.name) === "pdf" ? "📄" : getExt(uploadedFile.name) === "docx" || getExt(uploadedFile.name) === "doc" ? "📝" : "📃"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(uploadedFile.size)}</div>
                </div>
                <button onClick={removeFile} style={{ background: "#dbeafe", border: "none", borderRadius: 6, padding: "4px 5px", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                  <Icon path={Icons.close} size={12} color="#1d4ed8" />
                </button>
              </div>
            )}

            <button onClick={handleClickCreate} disabled={creating}
              style={{ padding: "14px 28px", borderRadius: 12, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 15, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: creating ? 0.7 : 1, transition: "all 0.2s" }}>
              {creating
                ? <><div style={{ width: 16, height: 16, border: "2.5px solid #bfdbfe", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang tạo...</>
                : <><Icon path={Icons.plus} size={17} color="#1d4ed8" /> Tạo đề thi</>
              }
            </button>
          </div>

          {/* Cảnh báo chất lượng file */}
          {uploadedFile && uploadedFile.size < 200 * 1024 && !creating && !done && (
            <div style={{ marginTop: 12, maxWidth: 420, padding: "11px 15px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <div style={{ fontSize: 12.5, color: "#92400e", lineHeight: 1.6 }}>
                <strong>File ngắn — AI có thể tạo đáp án không chính xác.</strong><br />
                Để đạt độ chính xác cao nhất, nên dùng:<br />
                ✅ Giáo trình, bài giảng có nội dung đầy đủ<br />
                ✅ Đề thi có kèm bảng đáp án<br />
                ⚠️ Slide, brochure, thông báo ngắn sẽ cho kết quả hạn chế
              </div>
            </div>
          )}

          {/* AI progress */}
          {creating && (
            <div style={{ marginTop: 18, maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>🤖 AI đang phân tích tài liệu...</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>{Math.min(Math.round(aiProgress), 100)}%</span>
              </div>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(aiProgress, 100)}%`, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: 999, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}

          {/* Done */}
          {done && (
            <div style={{ marginTop: 18, maxWidth: 460 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: isPublic ? "#f0fdf4" : "#faf5ff", border: `1.5px solid ${isPublic ? "#86efac" : "#e9d5ff"}`, borderRadius: 14, padding: "14px 18px" }}>
                <span style={{ fontSize: 28 }}>{isPublic ? "🌐" : "🔒"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: isPublic ? "#15803d" : "#7c3aed" }}>
                    {isPublic ? "Bộ đề đã chia sẻ lên Ngân hàng đề thi!" : "Bộ đề đã lưu vào Bộ đề của bạn!"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{uploadedFile?.name}</div>
                  <button onClick={() => { setDone(false); setUploadedFile(null); setIsPublic(null); setAiProgress(0); setSavedExam(null); document.getElementById("hero-file-input").value = ""; }}
                    style={{ fontSize: 12, color: "#1d4ed8", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4, fontWeight: 600, textDecoration: "underline" }}>
                    ＋ Tải file mới
                  </button>
                </div>
              </div>
              {savedExam && (
                <button onClick={() => onPractice(savedExam, "practice")}
                  style={{ marginTop: 12, width: "100%", padding: "14px 0", borderRadius: 13, background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 6px 20px rgba(5,150,105,0.35)", animation: "fadeInUp 0.4s ease" }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  Luyện đề ngay — {savedExam.title}
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { icon: Icons.book, value: "50K+", label: "Câu hỏi", color: "#1d4ed8" },
            { icon: Icons.users, value: "12K+", label: "Người dùng", color: "#0891b2" },
            { icon: Icons.trophy, value: "98%", label: "Đậu kỳ thi", color: "#059669" },
            { icon: Icons.star, value: "4.9★", label: "Đánh giá", color: "#d97706" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", textAlign: "center", boxShadow: "0 4px 16px rgba(29,78,216,0.08)", border: "1.5px solid rgba(59,130,246,0.1)" }}>
              <div style={{ width: 46, height: 46, background: `${s.color}15`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Icon path={s.icon} size={22} color={s.color} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Share modal — appears when user clicks Tạo đề thi */}
      {showShareModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: 440, boxShadow: "0 28px 70px rgba(29,78,216,0.2)", position: "relative", border: "1.5px solid rgba(59,130,246,0.15)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "22px 22px 0 0" }} />
            <button onClick={() => setShowShareModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
              <Icon path={Icons.close} size={16} color="#64748b" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={Icons.plus} size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Tạo đề thi</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8" }}>Chọn chế độ chia sẻ trước khi AI xử lý</div>
              </div>
            </div>

            {/* File info */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 11, padding: "10px 14px", marginBottom: 20, border: "1.5px solid #e2e8f0" }}>
              <span style={{ fontSize: 20 }}>{getExt(uploadedFile?.name) === "pdf" ? "📄" : "📝"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{uploadedFile && fmt(uploadedFile.size)}</div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>Bạn có muốn chia sẻ bộ đề công khai không?</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 16 }}>Bộ đề công khai sẽ hiển thị trong <b style={{ color: "#1d4ed8" }}>Ngân hàng đề thi</b> để mọi người cùng luyện tập.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {[
                { val: true,  icon: "🌐", label: "Chia sẻ công khai", desc: "Hiển thị trong Ngân hàng đề thi, mọi người có thể luyện tập", accent: "#1d4ed8", bg: "#eff6ff" },
                { val: false, icon: "🔒", label: "Chỉ mình tôi",      desc: "Lưu riêng tư trong Bộ đề của bạn, không ai khác thấy",   accent: "#7c3aed", bg: "#faf5ff" },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setIsPublic(opt.val)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 13, border: `2px solid ${isPublic === opt.val ? opt.accent : "#e2e8f0"}`, background: isPublic === opt.val ? opt.bg : "#fafbfc", cursor: "pointer", textAlign: "left", transition: "all 0.18s", boxShadow: isPublic === opt.val ? `0 4px 14px ${opt.accent}22` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: isPublic === opt.val ? opt.accent : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, transition: "all 0.18s" }}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isPublic === opt.val ? opt.accent : "#0f172a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isPublic === opt.val ? opt.accent : "#cbd5e1"}`, background: isPublic === opt.val ? opt.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
                    {isPublic === opt.val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowShareModal(false)} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleConfirmCreate} disabled={isPublic === null}
                style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: isPublic === null ? "#e2e8f0" : isPublic ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: isPublic === null ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: isPublic === null ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: isPublic !== null ? "0 4px 14px rgba(29,78,216,0.3)" : "none" }}>
                {isPublic === null ? "Chọn một tùy chọn" : "✨ Bắt đầu tạo đề thi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explore */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: -0.3 }}>🔍 Khám phá đề thi</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{exploreExams.length} bộ đề thi từ cộng đồng • Cập nhật theo thời gian thực</p>
          </div>
        </div>
        {loadingExplore ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            Đang tải đề thi...
          </div>
        ) : exploreExams.length > 0 ? (
          <ExamGrid exams={exploreExams} onCreateExam={onCreateExam} onPractice={onPractice} />
        ) : (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>Chưa có đề thi công khai nào</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Hãy tạo đề thi đầu tiên và chia sẻ công khai!</div>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button onClick={() => onGoBank()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 999, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 10px rgba(29,78,216,0.08)" }}
            onMouseEnter={e => { e.currentTarget.style.background="#1d4ed8"; e.currentTarget.style.color="#fff"; e.currentTarget.style.boxShadow="0 6px 20px rgba(29,78,216,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.color="#1d4ed8"; e.currentTarget.style.boxShadow="0 2px 10px rgba(29,78,216,0.08)"; }}>
            Xem nhiều hơn
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>
      </section>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}

function MyExamsPage({ onCreateExam, onPractice, currentUser, onExamCreated }) {
  const [search, setSearch] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(null);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [savedExam, setSavedExam] = useState(null); // đề vừa được AI tạo

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    examApi.getByUser(currentUser.id)
      .then(data => setExams(data.map(mappers.examSummary)))
      .catch(console.error)
      .finally(() => setLoadingExams(false));
  }, [currentUser]);

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
  const MAX_MB = 20;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) { alert(`Chỉ chấp nhận: ${ACCEPTED.join(", ")}`); return; }
    if (f.size > MAX_MB * 1024 * 1024) { alert(`File tối đa ${MAX_MB}MB`); return; }
    setUploadedFile(f);
    setDone(false); setIsPublic(null); setAiProgress(0);
    setShowShareModal(true);
  };

  const handleConfirmCreate = async () => {
    if (isPublic === null) return;
    setShowShareModal(false);
    setCreating(true);
    setAiProgress(10);
    try {
      const aiRawJson = await aiApi.upload(uploadedFile);
      setAiProgress(55);
      let questions;
      try { questions = JSON.parse(aiRawJson); } catch { questions = aiRawJson; }
      const saved = await examApi.saveFull({
        title: uploadedFile.name.replace(/\.[^/.]+$/, ""),
        questions: Array.isArray(questions) ? questions : [],
        userId: currentUser?.id,
      });
      setAiProgress(80);
      await examApi.updateStatus(saved.id, isPublic ? "Public" : "Private");
      setAiProgress(100);
      // Reload danh sách đề
      if (currentUser?.id) examApi.getByUser(currentUser.id).then(data => setExams(data.map(mappers.examSummary))).catch(console.error);
      setTimeout(() => {
        setCreating(false);
        setDone(true);
        setSavedExam({
          ...saved,
          title: saved.title || uploadedFile.name.replace(/\.[^/.]+$/, ""),
          subject: saved.subject || "Chung",
          questions: saved.totalQuestions || 10,
          time: 30,
          attempts: 0,
          rating: 0,
        });
        if (onExamCreated) onExamCreated(); // trigger reload BankPage
      }, 300);
    } catch (err) {
      console.error("Lỗi tạo đề:", err);
      setCreating(false);
      alert("Lỗi tạo đề: " + err.message);
    }
  };

  const fmt = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(1)+" MB" : (b/1024).toFixed(0)+" KB";
  const getExt = (name) => name?.split(".").pop().toLowerCase();

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: -0.5 }}>📚 Bộ đề của bạn</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>{filtered.length} bộ đề • Cập nhật gần nhất: hôm nay</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon path={Icons.search} size={15} color="#94a3b8" />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bộ đề..." style={{ padding: "10px 16px 10px 38px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13.5, color: "#0f172a", outline: "none", width: 240, transition: "border 0.2s", boxShadow: "0 2px 6px rgba(29,78,216,0.04)" }}
              onFocus={e => e.target.style.border = "1.5px solid #3b82f6"}
              onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
                <Icon path={Icons.close} size={13} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Thêm bộ đề button / processing states */}
          <input id="myexams-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={handleFileChange} />
          {done ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: isPublic ? "#f0fdf4" : "#faf5ff", border: `1.5px solid ${isPublic ? "#86efac" : "#e9d5ff"}`, borderRadius: 11, padding: "8px 14px" }}>
                <span style={{ fontSize: 16 }}>{isPublic ? "🌐" : "🔒"}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: isPublic ? "#15803d" : "#7c3aed" }}>Đã thêm!</span>
                <button onClick={() => { setDone(false); setUploadedFile(null); setIsPublic(null); setSavedExam(null); document.getElementById("myexams-file-input").value = ""; }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#94a3b8", textDecoration: "underline", padding: 0, marginLeft: 4 }}>Thêm nữa</button>
              </div>
              {savedExam && (
                <button onClick={() => onPractice(savedExam, "practice")}
                  style={{ padding: "9px 18px", borderRadius: 11, background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 14px rgba(5,150,105,0.3)", whiteSpace: "nowrap", animation: "fadeInUp 0.3s ease" }}>
                  📝 Luyện đề ngay →
                </button>
              )}
            </div>
          ) : creating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 11, padding: "8px 16px", minWidth: 180 }}>
              <div style={{ width: 14, height: 14, border: "2.5px solid #bfdbfe", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 3 }}>AI đang xử lý... {Math.min(Math.round(aiProgress), 100)}%</div>
                <div style={{ height: 4, background: "#dbeafe", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(aiProgress, 100)}%`, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: 999, transition: "width 0.3s ease" }} />
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => document.getElementById("myexams-file-input").click()}
              style={{ padding: "11px 22px", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.3)", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
              <Icon path={Icons.plus} size={15} color="#fff" /> Thêm bộ đề
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Không tìm thấy kết quả</div>
          <div style={{ fontSize: 13 }}>Thử tìm với từ khoá khác</div>
        </div>
      ) : (
        <ExamGrid exams={filtered} onCreateExam={onCreateExam} onPractice={onPractice} />
      )}

      {/* Share modal */}
      {showShareModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: 440, boxShadow: "0 28px 70px rgba(29,78,216,0.2)", position: "relative", border: "1.5px solid rgba(59,130,246,0.15)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "22px 22px 0 0" }} />
            <button onClick={() => { setShowShareModal(false); setUploadedFile(null); document.getElementById("myexams-file-input").value = ""; }}
              style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
              <Icon path={Icons.close} size={16} color="#64748b" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={Icons.upload} size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Thêm bộ đề</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8" }}>Chọn chế độ chia sẻ trước khi AI xử lý</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 11, padding: "10px 14px", marginBottom: 20, border: "1.5px solid #e2e8f0" }}>
              <span style={{ fontSize: 20 }}>{getExt(uploadedFile?.name) === "pdf" ? "📄" : "📝"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile?.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{uploadedFile && fmt(uploadedFile.size)}</div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>Bạn có muốn chia sẻ bộ đề công khai không?</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 16 }}>Bộ đề công khai sẽ hiển thị trong <b style={{ color: "#1d4ed8" }}>Ngân hàng đề thi</b> để mọi người cùng luyện tập.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {[
                { val: true,  icon: "🌐", label: "Chia sẻ công khai", desc: "Hiển thị trong Ngân hàng đề thi, mọi người có thể luyện tập", accent: "#1d4ed8", bg: "#eff6ff" },
                { val: false, icon: "🔒", label: "Chỉ mình tôi",      desc: "Lưu riêng tư trong Bộ đề của bạn, không ai khác thấy",   accent: "#7c3aed", bg: "#faf5ff" },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setIsPublic(opt.val)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 13, border: `2px solid ${isPublic === opt.val ? opt.accent : "#e2e8f0"}`, background: isPublic === opt.val ? opt.bg : "#fafbfc", cursor: "pointer", textAlign: "left", transition: "all 0.18s", boxShadow: isPublic === opt.val ? `0 4px 14px ${opt.accent}22` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: isPublic === opt.val ? opt.accent : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, transition: "all 0.18s" }}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isPublic === opt.val ? opt.accent : "#0f172a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isPublic === opt.val ? opt.accent : "#cbd5e1"}`, background: isPublic === opt.val ? opt.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
                    {isPublic === opt.val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowShareModal(false); setUploadedFile(null); document.getElementById("myexams-file-input").value = ""; }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Hủy</button>
              <button onClick={handleConfirmCreate} disabled={isPublic === null}
                style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: isPublic === null ? "#e2e8f0" : isPublic ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: isPublic === null ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: isPublic === null ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: isPublic !== null ? "0 4px 14px rgba(29,78,216,0.3)" : "none" }}>
                {isPublic === null ? "Chọn một tùy chọn" : "✨ Bắt đầu tạo đề thi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CreatedExamsPage({ onCreateExam, onPractice, onGoMyExams, currentUser }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [exams, setExams] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    examApi.getByUser(currentUser.id)
      .then(data => setExams(data.map(mappers.examSummary)))
      .catch(console.error);
  }, [currentUser]);

  const handleToggleStatus = async (exam) => {
    const newStatus = exam.status === "public" ? "Private" : "Public";
    try {
      await examApi.updateStatus(exam.id, newStatus);
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus.toLowerCase() } : e));
    } catch(err) { alert("Lỗi đổi trạng thái: " + err.message); }
  };

  const filtered = exams.filter(e => {
    const matchText = e.title.toLowerCase().includes(search.toLowerCase()) || (e.subject || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchText && matchStatus;
  });

  const sourceIcon = (src) => {
    const ext = src?.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📄";
    if (ext === "docx" || ext === "doc") return "📝";
    return "📃";
  };

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: -0.5 }}>✨ Đề thi đã tạo</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
            {filtered.length} đề thi · Được tạo tự động bởi AI từ tài liệu của bạn
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon path={Icons.search} size={15} color="#94a3b8" />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm đề thi..." style={{ padding: "10px 16px 10px 38px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13.5, color: "#0f172a", outline: "none", width: 220 }}
              onFocus={e => e.target.style.border = "1.5px solid #3b82f6"}
              onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                <Icon path={Icons.close} size={13} color="#94a3b8" />
              </button>
            )}
          </div>
          {/* Status filter */}
          <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 11, padding: 4 }}>
            {[{ id: "all", label: "Tất cả" }, { id: "public", label: "🌐 Công khai" }, { id: "private", label: "🔒 Riêng tư" }].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: statusFilter === f.id ? "#fff" : "transparent", color: statusFilter === f.id ? "#1d4ed8" : "#64748b", fontWeight: statusFilter === f.id ? 700 : 500, fontSize: 12.5, cursor: "pointer", boxShadow: statusFilter === f.id ? "0 2px 8px rgba(29,78,216,0.12)" : "none", transition: "all 0.18s" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon path={Icons.upload} size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1d4ed8", marginBottom: 2 }}>Đề thi được tạo từ tài liệu của bạn</div>
          <div style={{ fontSize: 12.5, color: "#64748b" }}>
            Tất cả đề thi ở đây được AI tự động trích xuất từ file bạn tải lên tại <b>Bộ đề của bạn</b>.
            Bạn có thể thay đổi trạng thái công khai/riêng tư bất kỳ lúc nào.
          </div>
        </div>
        <button onClick={onGoMyExams}
          style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(29,78,216,0.3)" }}>
          + Tạo thêm
        </button>
      </div>

      {/* Exam list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{CREATED_EXAMS.length === 0 ? "✨" : "🔍"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
            {CREATED_EXAMS.length === 0 ? "Chưa có đề thi nào được tạo" : "Không tìm thấy kết quả"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
            {CREATED_EXAMS.length === 0
              ? "Tải file lên tại Bộ đề của bạn để AI tự động tạo đề thi cho bạn"
              : "Thử tìm với từ khoá khác hoặc bỏ bộ lọc"}
          </div>
          {CREATED_EXAMS.length === 0 && (
            <button onClick={onGoMyExams} style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 18px rgba(29,78,216,0.3)" }}>
              📤 Tải file lên ngay
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(exam => {
            const color = SUBJECT_COLORS[exam.subject] || "#1d4ed8";
            const isPublicExam = exam.status === "public";
            return (
              <div key={exam.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid rgba(59,130,246,0.1)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)", overflow: "hidden", display: "flex", alignItems: "stretch", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(29,78,216,0.13)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(29,78,216,0.06)"}>

                {/* Color bar */}
                <div style={{ width: 5, background: `linear-gradient(180deg,${color},${color}88)`, flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, padding: "18px 22px", display: "flex", alignItems: "center", gap: 20 }}>
                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
                    {sourceIcon(exam.source)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exam.title}</div>
                      {/* Status badge */}
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: isPublicExam ? "#eff6ff" : "#faf5ff", color: isPublicExam ? "#1d4ed8" : "#7c3aed", border: `1px solid ${isPublicExam ? "#bfdbfe" : "#e9d5ff"}` }}>
                        {isPublicExam ? "🌐 Công khai" : "🔒 Riêng tư"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", background: color, padding: "2px 10px", borderRadius: 6 }}>{exam.subject}</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>📋 {exam.questions} câu</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>⏱ {exam.time} phút</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {exam.source}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>🗓 {exam.createdAt}</span>
                      {exam.attempts > 0 && <span style={{ fontSize: 12, color: "#64748b" }}>👥 {exam.attempts} lượt thi</span>}
                      {exam.rating > 0 && <span style={{ fontSize: 12, color: "#f59e0b" }}>⭐ {exam.rating}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => onPractice(exam, "exam")}
                      style={{ padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg,${color},${color}cc)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", boxShadow: `0 4px 12px ${color}44`, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon path={Icons.play} size={13} color="#fff" /> Làm bài ngay
                    </button>
                    <button onClick={() => onCreateExam(exam)}
                      style={{ padding: "9px 18px", borderRadius: 10, background: "#f1f5f9", border: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon path={Icons.settings} size={13} color="#64748b" /> Tùy chỉnh
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function BankPage({ onCreateExam, onPractice, refreshKey = 0 }) {
  const [search, setSearch] = useState("");
  const [exams, setExams] = useState([]);

  useEffect(() => {
    examApi.getPublic()
      .then(data => setExams(data.map(mappers.examPublic)))
      .catch(console.error);
  }, [refreshKey]); // reload mỗi khi có đề mới được tạo

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.subject || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: -0.5 }}>🏦 Ngân hàng đề thi</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>{BANK_EXAMS.length} bộ đề • Từ cộng đồng giáo viên</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm..." style={{ padding: "10px 18px", borderRadius: 11, border: "1.5px solid #e2e8f0", fontSize: 13.5, outline: "none", width: 240, background: "#f8fafc" }} />
      </div>
      <ExamGrid exams={filtered} onCreateExam={onCreateExam} onPractice={onPractice} />
    </main>
  );
}

function HistoryPage({ onPractice, historyList = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const filtered = historyList.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Tất cả" || e.status === filter;
    return matchSearch && matchFilter;
  });
  const avgScore = historyList.length > 0
    ? Math.round(historyList.reduce((s, e) => s + e.score, 0) / historyList.length)
    : 0;
  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: -0.5 }}>📋 Lịch sử bài thi</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>{filtered.length} lần thi • Điểm trung bình: {(avgScore / 10).toFixed(1)}/10</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon path={Icons.search} size={15} color="#94a3b8" />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm lịch sử..." style={{ padding: "10px 16px 10px 38px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13.5, color: "#0f172a", outline: "none", width: 230, transition: "border 0.2s" }}
              onFocus={e => e.target.style.border = "1.5px solid #3b82f6"}
              onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Icon path={Icons.close} size={13} color="#94a3b8" />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 11, padding: 4 }}>
            {["Tất cả", "Đạt", "Không đạt"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: filter === f ? "#fff" : "transparent", color: filter === f ? "#1d4ed8" : "#64748b", fontWeight: filter === f ? 700 : 500, fontSize: 12.5, cursor: "pointer", boxShadow: filter === f ? "0 2px 8px rgba(29,78,216,0.12)" : "none", transition: "all 0.2s", whiteSpace: "nowrap" }}>{f}</button>
            ))}
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{historyList.length === 0 ? "📋" : "🔍"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
            {historyList.length === 0 ? "Chưa có lịch sử bài thi" : "Không tìm thấy kết quả"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            {historyList.length === 0
              ? "Hãy vào trang Đề thi đã tạo và nhấn Làm bài ngay để bắt đầu thi!"
              : "Thử tìm với từ khoá khác hoặc thay đổi bộ lọc"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {filtered.map(exam => (
            <ExamCard key={exam.id + "-h"} exam={exam} isHistory={true} onCreateExam={() => {}} onPractice={onPractice} />
          ))}
        </div>
      )}
    </main>
  );
}


// ─── LOGIN PROMPT MODAL ───────────────────────────────────────────────────────
function LoginPromptModal({ onClose, onLogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 24, padding: "44px 40px 36px", width: 420, boxShadow: "0 32px 80px rgba(29,78,216,0.22)", position: "relative", border: "1.5px solid rgba(59,130,246,0.15)", textAlign: "center" }}>
        {/* Top gradient bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "24px 24px 0 0" }} />
        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
          <Icon path={Icons.close} size={16} color="#64748b" />
        </button>

        {/* Icon */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "2px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Đăng nhập để tiếp tục</div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
          Bạn cần đăng nhập để sử dụng tính năng này.<br />
          Đăng nhập nhanh chóng với tài khoản Google.
        </div>

        {/* Benefits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
          {[
            { icon: "✨", text: "Tạo đề thi bằng AI từ tài liệu của bạn" },
            { icon: "📊", text: "Lưu lịch sử bài thi và theo dõi tiến độ" },
            { icon: "🎯", text: "Luyện đề không giới hạn" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 18 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{b.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onLogin}
          style={{ width: "100%", padding: "14px 0", borderRadius: 13, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 700, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "all 0.2s", marginBottom: 12 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(29,78,216,0.15)"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
          <Icon path={Icons.google} size={20} />
          Đăng nhập với Google
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "11px 0", borderRadius: 13, border: "none", background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Để sau
        </button>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }
  const [settingExam, setSettingExam] = useState(null);
  const [practiceExam, setPracticeExam] = useState(null);
  const [toast, setToast] = useState(null);
  const [practiceMode, setPracticeMode] = useState("exam");
  const [practiceFromCreated, setPracticeFromCreated] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [examRefreshKey, setExamRefreshKey] = useState(0); // tăng lên để trigger reload

  const [checkingAuth, setCheckingAuth] = useState(true); // đang kiểm tra session

  // Kiểm tra session khi load trang (F5, mở tab mới)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Bước 1: Lấy userId từ URL ?userId=xxx (sau khi Google OAuth redirect về)
        const params = new URLSearchParams(window.location.search);
        const urlUserId = params.get("userId");
        if (urlUserId) {
          window.history.replaceState({}, "", window.location.pathname);
          localStorage.setItem("smartexam_userId", urlUserId); // Lưu lại để dùng khi F5
          const user = await userApi.getById(Number(urlUserId));
          if (user) { setCurrentUser(user); setIsLoggedIn(true); }
          return;
        }

        // Bước 2: Đọc userId đã lưu trong localStorage (khi F5)
        const savedUserId = localStorage.getItem("smartexam_userId");
        if (savedUserId) {
          const user = await userApi.getById(Number(savedUserId));
          if (user) { setCurrentUser(user); setIsLoggedIn(true); return; }
          // Nếu không lấy được user → xóa localStorage cũ
          localStorage.removeItem("smartexam_userId");
        }
      } catch (e) {
        localStorage.removeItem("smartexam_userId");
      } finally {
        setCheckingAuth(false); // Dù thành công hay thất bại đều tắt loading
      }
    };
    restoreSession();
  }, []);

  // Load lịch sử khi đã đăng nhập
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;
    userApi.getResults(currentUser.id)
      .then(data => setHistoryList(data.map(mappers.resultHistory)))
      .catch(console.error);
  }, [isLoggedIn, currentUser]);

  // Đang kiểm tra session (F5) → hiện loading để tránh flash trang đăng nhập
  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ width: 48, height: 48, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1d4ed8" }}>SmartExam</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Đang khôi phục phiên đăng nhập...</div>
    </div>
  );

  // Chưa đăng nhập → hiện trang chủ, mọi tương tác đẩy sang LoginPage
  if (!isLoggedIn) {
    if (page === "login") return <LoginPage setPage={setPage} setIsLoggedIn={setIsLoggedIn} />;
    const goLogin = () => setPage("login");
    return (
      <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
        <Header activePage="home" setPage={goLogin} isLoggedIn={false} setIsLoggedIn={setIsLoggedIn} />
        <HomePage onCreateExam={goLogin} onPractice={goLogin} onGoBank={goLogin} onRequireLogin={goLogin} />
        <Footer />
      </div>
    );
  }

  const handleSaveResult = (result) => setHistoryList(prev => [result, ...prev]);
  const handleCreateExam = (exam) => setSettingExam(exam);
  const handlePracticeCreated = (exam, mode = "exam") => { setPracticeExam(exam); setPracticeMode(mode); setPracticeFromCreated(true); };
  const handlePracticeOther = (exam, mode = "practice") => { setPracticeExam(exam); setPracticeMode(mode); setPracticeFromCreated(false); };

  const handleConfirm = async (settings) => {
    try {
      // Tạo custom exam trên backend
      const customExam = await customExamApi.create({
        originExamId: settingExam.id,
        timeLimit: settings.time,
        questionCount: settings.questions,
        userId: currentUser?.id,
        title: settingExam.title,
      });
      setSettingExam(null);
      // Lấy câu hỏi và vào thi ngay
      const examData = await customExamApi.take(customExam.customExamId);
      setPracticeExam({
        ...settingExam,
        customExamId: examData.customExamId,
        time: examData.timeLimit,
        realQuestions: examData.questions.map(mappers.question),
      });
      setPracticeMode("exam");
      setPracticeFromCreated(true);
    } catch (err) {
      setSettingExam(null);
      setToast(`❌ Lỗi tạo đề: ${err.message}`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  if (practiceExam) return <PracticePage exam={practiceExam} onBack={() => setPracticeExam(null)} mode={practiceMode} onSaveResult={practiceFromCreated ? handleSaveResult : undefined} currentUser={currentUser} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <Header activePage={page} setPage={setPage} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} />
      {page === "home" && <HomePage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} onGoBank={() => setPage("bank")} currentUser={currentUser} onExamCreated={() => setExamRefreshKey(k => k + 1)} refreshKey={examRefreshKey} />}
      {page === "my-exams" && <MyExamsPage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} currentUser={currentUser} onExamCreated={() => setExamRefreshKey(k => k + 1)} />}
      {page === "created" && <CreatedExamsPage onCreateExam={handleCreateExam} onPractice={handlePracticeCreated} onGoMyExams={() => setPage("my-exams")} currentUser={currentUser} />}
      {page === "bank" && <BankPage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} refreshKey={examRefreshKey} />}
      {page === "history" && <HistoryPage onPractice={handlePracticeOther} historyList={historyList} />}
      <Footer />
      {settingExam && <SettingModal exam={settingExam} onClose={() => setSettingExam(null)} onConfirm={handleConfirm} />}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "14px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 9999, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.1)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
