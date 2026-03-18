import { useState, useEffect, useRef } from "react";
import { Icons, Icon } from "../constants.jsx";
import { examApi } from "../api.js";

const optLabels = ["A", "B", "C", "D"];

export default function EditExamPage({ exam, onBack, onSaved }) {
  const [title, setTitle] = useState(exam.title || "");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyQuestions, setDirtyQuestions] = useState(new Set());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeQ, setActiveQ] = useState(0);
  const [toast, setToast] = useState(null);
  const questionRefs = useRef([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const load = async () => {
      try {
        let detail = null;
        try { detail = await examApi.getDetail(exam.id); }
        catch { detail = await examApi.getPublicDetail(exam.id); }
        if (detail?.questions?.length) {
          setQuestions(detail.questions.map((q) => ({
            id: q.id,
            question: q.questionContent || "",
            options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
            answer: q.answer?.trim().toUpperCase() || "A",
          })));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [exam.id]);

  const markDirty = (qi) => {
    setIsDirty(true);
    setDirtyQuestions(prev => new Set([...prev, qi]));
  };

  const handleTitleChange = (val) => { setTitle(val); setIsDirty(true); };
  const handleAnswerChange = (qi, ans) => { setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, answer: ans } : q)); markDirty(qi); };
  const handleQuestionChange = (qi, val) => { setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, question: val } : q)); markDirty(qi); };
  const handleOptionChange = (qi, oi, val) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options]; opts[oi] = val; return { ...q, options: opts };
    }));
    markDirty(qi);
  };

  const scrollToQuestion = (qi) => {
    setActiveQ(qi);
    questionRefs.current[qi]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (title !== exam.title) await examApi.updateTitle(exam.id, title);
      await Promise.all(questions.map(q =>
        examApi.updateQuestion(q.id, { questionContent: q.question, options: q.options, answer: q.answer })
      ));
      setIsDirty(false);
      setDirtyQuestions(new Set());
      showToast("✅ Đã lưu bộ đề thành công!");
      if (onSaved) onSaved({ ...exam, title });
    } catch (err) { showToast("❌ Lỗi lưu: " + err.message); }
    finally { setSaving(false); }
  };

  const handleBack = () => { if (isDirty) setShowExitConfirm(true); else onBack(); };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #e2e8f0", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Icon path={Icons.arrowLeft} size={15} color="#64748b" /> Thoát
          </button>
          <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Kiểm tra & Sửa bộ đề</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{questions.length} câu hỏi {dirtyQuestions.size > 0 && `· ${dirtyQuestions.size} câu đã sửa`}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isDirty && <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>● Có thay đổi chưa lưu</span>}
          <button onClick={handleSave} disabled={saving || !isDirty}
            style={{ padding: "9px 22px", borderRadius: 11, border: "none", background: isDirty ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#e2e8f0", color: isDirty ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13.5, cursor: isDirty ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, boxShadow: isDirty ? "0 4px 14px rgba(29,78,216,0.3)" : "none" }}>
            {saving ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang lưu...</> : "💾 Lưu bộ đề"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "28px 24px 60px", gap: 24 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Tên bộ đề */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1.5px solid #e2e8f0", marginBottom: 20, boxShadow: "0 4px 16px rgba(29,78,216,0.05)" }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 8 }}>📌 Tên bộ đề</label>
            <input value={title} onChange={e => handleTitleChange(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 11, border: "1.5px solid #e2e8f0", fontSize: 15, fontWeight: 700, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.border = "1.5px solid #3b82f6"}
              onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
          </div>

          {/* Questions */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 40, height: 40, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ color: "#94a3b8" }}>Đang tải câu hỏi...</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {questions.map((q, qi) => {
                const isDirtyQ = dirtyQuestions.has(qi);
                return (
                  <div key={q.id} ref={el => questionRefs.current[qi] = el}
                    style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${activeQ === qi ? "#3b82f6" : isDirtyQ ? "#fde68a" : "#e2e8f0"}`, overflow: "hidden", boxShadow: activeQ === qi ? "0 8px 28px rgba(29,78,216,0.12)" : "0 4px 16px rgba(29,78,216,0.05)", transition: "all 0.2s" }}
                    onClick={() => setActiveQ(qi)}>
                    {/* Dirty indicator */}
                    {isDirtyQ && <div style={{ height: 3, background: "linear-gradient(90deg,#fbbf24,#f59e0b)" }} />}
                    {/* Question header */}
                    <div style={{ padding: "16px 20px 14px", borderBottom: "1.5px solid #f1f5f9", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: isDirtyQ ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {qi + 1}
                      </div>
                      <textarea value={q.question} onChange={e => handleQuestionChange(qi, e.target.value)}
                        rows={2}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#0f172a", resize: "vertical", outline: "none", fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.6 }}
                        onFocus={e => e.target.style.border = "1.5px solid #3b82f6"}
                        onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
                    </div>
                    {/* Options */}
                    <div style={{ padding: "14px 20px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
                      {q.options.map((opt, oi) => {
                        const isCorrect = q.answer === optLabels[oi];
                        return (
                          <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleAnswerChange(qi, optLabels[oi]); }}
                              style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${isCorrect ? "#059669" : "#e2e8f0"}`, background: isCorrect ? "#f0fdf4" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: isCorrect ? "#059669" : "#94a3b8" }}>{optLabels[oi]}</span>
                            </button>
                            <input value={opt} onChange={e => handleOptionChange(qi, oi, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{ flex: 1, padding: "9px 13px", borderRadius: 9, border: `1.5px solid ${isCorrect ? "#86efac" : "#e2e8f0"}`, background: isCorrect ? "#f0fdf4" : "#fafbfc", fontSize: 13.5, color: isCorrect ? "#15803d" : "#475569", fontWeight: isCorrect ? 600 : 400, outline: "none" }}
                              onFocus={e => e.target.style.border = `1.5px solid ${isCorrect ? "#059669" : "#3b82f6"}`}
                              onBlur={e => e.target.style.border = `1.5px solid ${isCorrect ? "#86efac" : "#e2e8f0"}`} />
                            {isCorrect && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓ Đúng</span>}
                          </div>
                        );
                      })}
                      <div style={{ marginTop: 4, fontSize: 11.5, color: "#94a3b8" }}>Click vào ô chữ cái để chọn đáp án đúng</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar — Question map */}
        {!loading && questions.length > 0 && (
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ position: "sticky", top: 80, background: "#fff", borderRadius: 16, padding: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Danh sách câu hỏi</div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#3b82f6" }} />
                  <span style={{ fontSize: 10.5, color: "#64748b" }}>Đang xem</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#fbbf24" }} />
                  <span style={{ fontSize: 10.5, color: "#64748b" }}>Đã sửa</span>
                </div>
              </div>

              {/* Question grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {questions.map((q, qi) => {
                  const isDirtyQ = dirtyQuestions.has(qi);
                  const isActive = activeQ === qi;
                  return (
                    <button key={qi} onClick={() => scrollToQuestion(qi)}
                      style={{
                        aspectRatio: "1", borderRadius: 8,
                        border: isActive ? "2px solid #3b82f6" : isDirtyQ ? "2px solid #fbbf24" : "1.5px solid #e2e8f0",
                        background: isActive ? "#eff6ff" : isDirtyQ ? "#fffbeb" : "#f8fafc",
                        color: isActive ? "#1d4ed8" : isDirtyQ ? "#d97706" : "#64748b",
                        fontWeight: 700, fontSize: 11, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s"
                      }}>
                      {qi + 1}
                    </button>
                  );
                })}
              </div>

              {/* Stats */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1.5px solid #f1f5f9" }}>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>Tổng: <b style={{ color: "#0f172a" }}>{questions.length}</b> câu</div>
                {dirtyQuestions.size > 0 && (
                  <div style={{ fontSize: 11.5, color: "#d97706", fontWeight: 600 }}>✏️ Đã sửa: {dirtyQuestions.size} câu</div>
                )}
              </div>

              {/* Quick save */}
              {isDirty && (
                <button onClick={handleSave} disabled={saving}
                  style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}>
                  💾 Lưu ngay
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 400, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Bạn có thay đổi chưa lưu</div>
            <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>Bạn có muốn lưu lại các thay đổi trong bộ đề trước khi thoát không?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => onBack()}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Thoát không lưu
              </button>
              <button onClick={async () => { await handleSave(); onBack(); }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Lưu & Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "14px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 9999 }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
