import { useState, useEffect } from "react";
import { Icons, Icon, SUBJECT_COLORS } from "../constants.jsx";
import { examApi, aiApi, mappers } from "../api.js";
import { ExamCard, ExamGrid } from "../components/ExamCard.jsx";

function MyExamsPage({ onCreateExam, onPractice, onEditExam, currentUser, onExamCreated }) {
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    examApi.getByUser(currentUser.id)
      .then(data => setExams(data.map(mappers.examSummary)))
      .catch(console.error)
      .finally(() => setLoadingExams(false));
  }, [currentUser]);

  const handleToggleStatus = async (exam) => {
    const newStatus = exam.targetStatus
      ? (exam.targetStatus === "public" ? "Public" : "Private")
      : (exam.status === "public" ? "Private" : "Public");
    try {
      await examApi.updateStatus(exam.id, newStatus);
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus.toLowerCase() } : e));
    } catch (err) {
      alert("Lỗi đổi trạng thái: " + err.message);
    }
  };

  const handleDelete = async (exam) => {
    try {
      await examApi.deleteMany([exam.id]);
      setExams(prev => prev.filter(e => e.id !== exam.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Lỗi xóa: " + err.message);
    }
  };

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
        <ExamGrid exams={filtered} onCreateExam={onCreateExam} onPractice={onPractice} onToggleStatus={handleToggleStatus} onEditExam={onEditExam} onDelete={(exam) => setDeleteConfirm(exam)} />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 400, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Xóa bộ đề?</div>
            <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>
              Bạn có chắc muốn xóa <b style={{ color: "#dc2626" }}>{deleteConfirm.title}</b>? Hành động này không thể hoàn tác.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#dc2626,#f87171)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
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


export default MyExamsPage;
