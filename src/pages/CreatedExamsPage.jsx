import { useState, useEffect } from "react";
import { Icons, Icon, SUBJECT_COLORS } from "../constants.jsx";
import { examApi, customExamApi, mappers } from "../api.js";

function CreatedExamsPage({ onCreateExam, onPractice, onGoMyExams, currentUser }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exams, setExams] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
if (!currentUser?.id) return;
customExamApi.getByUser(currentUser.id)
      .then(data => {
setExams((data || []).map(dto => ({
          id: dto.id,
          title: dto.title,
          questions: dto.questionCount,
          time: dto.timeLimit || 30,
          subject: "Chung",
          status: "private",
          attempts: 0,
          rating: 0,
          createdAt: dto.createdAt,
          source: "Tạo đề thi",
          isCustom: true,
        })));
      })
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
          <div style={{ fontSize: 52, marginBottom: 16 }}>{exams.length === 0 ? "✨" : "🔍"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
            {exams.length === 0 ? "Chưa có đề thi nào được tạo" : "Không tìm thấy kết quả"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
            {exams.length === 0
              ? "Tải file lên tại Bộ đề của bạn để AI tự động tạo đề thi cho bạn"
              : "Thử tìm với từ khoá khác hoặc bỏ bộ lọc"}
          </div>
          {exams.length === 0 && (
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
                    <button onClick={() => setDeleteConfirm(exam)}
                      style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon path={Icons.trash} size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 400, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Xóa đề thi?</div>
            <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>
              Bạn có chắc muốn xóa <b style={{ color: "#dc2626" }}>{deleteConfirm.title}</b>? Hành động này không thể hoàn tác.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={async () => {
                try {
                  await customExamApi.deleteMany([deleteConfirm.id]);
                  setExams(prev => prev.filter(e => e.id !== deleteConfirm.id));
                  setDeleteConfirm(null);
                } catch (err) { alert("Lỗi xóa: " + err.message); }
              }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#dc2626,#f87171)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CreatedExamsPage;
