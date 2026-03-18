import { useState, useEffect } from "react";
import { Icons, Icon, SUBJECT_COLORS } from "../constants.jsx";
import { examApi } from "../api.js";

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
function PreviewModal({ exam, onClose, onPractice, onCreateExam }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const subjectColor = SUBJECT_COLORS[exam.subject] || "#1d4ed8";

  useEffect(() => {
    const load = async () => {
      try {
        let detail = null;
        try { detail = await examApi.getDetail(exam.id); }
        catch { detail = await examApi.getPublicDetail(exam.id); }
        if (detail?.questions?.length) {
          setQuestions(detail.questions.map((q, i) => ({
            id: q.id || i,
            q: q.questionContent || "(Câu hỏi trống)",
            opts: Array.isArray(q.options) ? q.options : [],
            answer: q.answer || "",
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exam.id]);

  const optLabels = ["A", "B", "C", "D"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 680, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${subjectColor}ee,${subjectColor}88)`, padding: "20px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{exam.title}</div>
              <div style={{ display: "flex", gap: 14 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>📋 {exam.questions} câu</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>⏱ {exam.time} phút</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>👥 {exam.attempts?.toLocaleString()} lượt thi</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 8, borderRadius: 10, display: "flex" }}>
              <Icon path={Icons.close} size={18} color="#fff" />
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 36, height: 36, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Đang tải câu hỏi...</div>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div>Không có câu hỏi để xem trước</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {questions.slice(0, 5).map((q, qi) => (
                <div key={q.id} style={{ background: "#f8fafc", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${subjectColor},${subjectColor}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {qi + 1}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.6 }}>{q.q}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingLeft: 38 }}>
                    {q.opts.map((opt, idx) => {
                      const isCorrect = q.answer && opt?.replace(/^[A-D]\.\s*/,"").trim() !== "" && optLabels[idx] === q.answer.trim().toUpperCase();
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 9, background: isCorrect ? "#f0fdf4" : "#fff", border: `1.5px solid ${isCorrect ? "#86efac" : "#e2e8f0"}` }}>
                          <span style={{ width: 24, height: 24, borderRadius: 7, background: isCorrect ? "linear-gradient(135deg,#059669,#10b981)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: isCorrect ? "#fff" : "#94a3b8", flexShrink: 0 }}>
                            {optLabels[idx]}
                          </span>
                          <span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#475569", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                          {isCorrect && <span style={{ marginLeft: "auto", fontSize: 12, color: "#059669", fontWeight: 700 }}>✓ Đúng</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {questions.length > 5 && (
                <div style={{ textAlign: "center", padding: "12px 0", color: "#94a3b8", fontSize: 13 }}>
                  ... và <b style={{ color: "#1d4ed8" }}>{questions.length - 5}</b> câu hỏi khác
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "16px 24px", borderTop: "1.5px solid #f1f5f9", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Đóng
          </button>
          <button onClick={() => { onClose(); onPractice(exam, "practice"); }} style={{ flex: 2, padding: "12px 0", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon path={Icons.play} size={15} color="#fff" /> Luyện đề ngay
          </button>
          <button onClick={() => { onClose(); onCreateExam(exam); }} style={{ flex: 2, padding: "12px 0", borderRadius: 11, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon path={Icons.edit} size={15} color="#1d4ed8" /> Tạo đề thi
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── STATUS MODAL ─────────────────────────────────────────────────────────────
function StatusModal({ exam, onClose, onSave }) {
  const [selected, setSelected] = useState(exam.status === "public" ? true : false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(exam, selected ? "public" : "private");
    setSaving(false);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: 420, boxShadow: "0 28px 70px rgba(29,78,216,0.2)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "22px 22px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
          <Icon path={Icons.close} size={16} color="#64748b" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={Icons.shield} size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Trạng thái đề thi</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>{exam.title}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {[
            { val: true,  icon: "🌐", label: "Công khai (Public)",  desc: "Hiển thị trong Ngân hàng đề thi, mọi người có thể luyện tập", accent: "#1d4ed8", bg: "#eff6ff" },
            { val: false, icon: "🔒", label: "Riêng tư (Private)",  desc: "Chỉ mình bạn có thể xem và luyện tập", accent: "#7c3aed", bg: "#faf5ff" },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => setSelected(opt.val)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 13, border: `2px solid ${selected === opt.val ? opt.accent : "#e2e8f0"}`, background: selected === opt.val ? opt.bg : "#fafbfc", cursor: "pointer", textAlign: "left", transition: "all 0.18s", boxShadow: selected === opt.val ? `0 4px 14px ${opt.accent}22` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: selected === opt.val ? opt.accent : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, transition: "all 0.18s" }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected === opt.val ? opt.accent : "#0f172a" }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected === opt.val ? opt.accent : "#cbd5e1"}`, background: selected === opt.val ? opt.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
                {selected === opt.val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Thoát
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: saving ? "#e2e8f0" : selected ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: saving ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
            {saving ? <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang lưu...</> : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── EXAM CARD ────────────────────────────────────────────────────────────────
function ExamCard({ exam, isHistory = false, onCreateExam, onPractice, onToggleStatus, onEditExam, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const subjectColor = SUBJECT_COLORS[exam.subject] || "#1d4ed8";
  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !isHistory && setShowPreview(true)}
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
            <span
              onClick={onToggleStatus ? (e) => { e.stopPropagation(); setShowStatusModal(true); } : undefined}
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backdropFilter: "blur(8px)", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 5, cursor: onToggleStatus ? "pointer" : "default", transition: "all 0.2s" }}
              title={onToggleStatus ? "Click để đổi trạng thái" : ""}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: exam.status === "public" ? "#4ade80" : "#fbbf24", display: "inline-block", flexShrink: 0 }} />
              {exam.status === "public" ? "Public" : exam.status === "private" ? "Private" : exam.subject}
              {onToggleStatus && <span style={{ fontSize: 10, opacity: 0.8 }}>✏️</span>}
            </span>
            {isHistory && (
              <span style={{ background: exam.status === "Đạt" ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                {(exam.score / 10).toFixed(1)}/10 · {exam.status}
              </span>
            )}
            {!isHistory && (
              onEditExam ? (
                <button onClick={(e) => { e.stopPropagation(); onEditExam(exam); }}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: 9, display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(8px)", transition: "all 0.2s" }}
                  title="Sửa bộ đề"
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}>
                  <Icon path={Icons.edit} size={13} color="#fff" />
                </button>
              ) : (
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <Icon path={Icons.star} size={13} color="#fbbf24" />
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{exam.rating}</span>
                </div>
              )
            )}
          </div>
          <div style={{ marginTop: 14, color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{exam.title}</div>
          {isHistory && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>📅 {exam.date}</div>}
          {/* Preview hint */}
          {!isHistory && hovered && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon path={Icons.search} size={11} color="rgba(255,255,255,0.8)" /> Click để xem trước
            </div>
          )}
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
                <span>{exam.attempts?.toLocaleString()}</span>
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
                {onDelete && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(exam); }} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={Icons.trash} size={13} color="#dc2626" />
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          exam={exam}
          onClose={() => setShowPreview(false)}
          onPractice={onPractice}
          onCreateExam={onCreateExam}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && onToggleStatus && (
        <StatusModal
          exam={exam}
          onClose={() => setShowStatusModal(false)}
          onSave={async (exam, newStatus) => {
            await onToggleStatus({ ...exam, targetStatus: newStatus });
          }}
        />
      )}
    </>
  );
}

function ExamGrid({ exams, isHistory = false, onCreateExam, onPractice, onToggleStatus, onEditExam, onDelete }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {exams.map(exam => (
        <ExamCard key={exam.id} exam={exam} isHistory={isHistory} onCreateExam={onCreateExam} onPractice={onPractice} onToggleStatus={onToggleStatus} onEditExam={onEditExam} onDelete={onDelete} />
      ))}
    </div>
  );
}

export { ExamCard, ExamGrid };
