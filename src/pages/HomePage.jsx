import { useState, useEffect } from "react";
import { Icons, Icon, SUBJECT_COLORS } from "../constants.jsx";
import { examApi, aiApi, mappers } from "../api.js";
import { ExamCard, ExamGrid } from "../components/ExamCard.jsx";
import { useMobile } from "../hooks/useMobile.js";

function downloadSampleFile() {
  const sample = `BÀI TRẮC NGHIỆM MẪU - SMARTEXAM\n\nCâu 1: Câu hỏi mẫu?\n*A. Đáp án đúng\nB. Đáp án sai\nC. Đáp án sai\nD. Đáp án sai`;
  const blob = new Blob([sample], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "smartexam-file-mau.txt";
  a.click(); URL.revokeObjectURL(url);
}

function HomePage({ onCreateExam, onPractice, onGoBank, onRequireLogin, onEditExam, currentUser, onExamCreated, refreshKey = 0 }) {
  const guard = onRequireLogin || null;
  const isMobile = useMobile();

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
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 32px 60px" }}>
      {/* Hero */}
      <section style={{ padding: isMobile ? "28px 0 36px" : "60px 0 48px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 28 : 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, background: "#1d4ed8", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>Nền tảng ôn thi thông minh #1 Việt Nam</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#0f172a", lineHeight: 1.2, margin: "0 0 20px", letterSpacing: -1 }}>Ôn thi hiệu quả với <span style={{ background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trí tuệ AI</span></h1>
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

          {/* Thông báo hướng dẫn đáp án */}
          {uploadedFile && !creating && !done && (
            <div style={{ marginTop: 12, maxWidth: 420, padding: "11px 15px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>💡</span>
              <div style={{ fontSize: 12.5, color: "#1e40af", lineHeight: 1.7 }}>
                Để đáp án chính xác 100%, hãy thêm dấu <strong>*</strong> vào cuối đáp án đúng.<br />
                Ví dụ: <code style={{ background: "#dbeafe", padding: "1px 5px", borderRadius: 4 }}>A. Đáp án đúng *</code> hoặc <code style={{ background: "#dbeafe", padding: "1px 5px", borderRadius: 4 }}>*A. Đáp án đúng</code><br />
                Nếu không có định dạng, AI sẽ tự suy luận và đưa ra đáp án cho bạn.
              </div>
            </div>
          )}

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
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button onClick={() => onEditExam(savedExam)}
                    style={{ flex: 2, padding: "14px 0", borderRadius: 13, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 6px 20px rgba(29,78,216,0.35)", animation: "fadeInUp 0.4s ease" }}>
                    <span style={{ fontSize: 18 }}>🔍</span>
                    Kiểm tra lại bộ đề
                  </button>
                  <button onClick={() => onPractice(savedExam, "practice")}
                    style={{ flex: 1, padding: "14px 0", borderRadius: 13, background: "#f0fdf4", border: "1.5px solid #86efac", color: "#059669", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>▶</span> Luyện ngay
                  </button>
                </div>
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


export default HomePage;
