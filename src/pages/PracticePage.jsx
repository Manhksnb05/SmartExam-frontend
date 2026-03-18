import { useState, useEffect, useCallback, useRef } from "react";
import { Icons, Icon, SUBJECT_COLORS } from "../constants.jsx";
import { examApi, customExamApi, mappers, aiApi } from "../api.js";
import VoicePanel, { useVoiceControl } from "../components/VoiceControl.jsx";

const OPT_LABELS = ["A", "B", "C", "D"];

function PracticePage({ exam, onBack, mode = "exam", onSaveResult, currentUser }) {
  const isPractice = mode === "practice";

  // ─── localStorage save/restore ────────────────────────────────
  const storageKey = `smartExam_${mode}_${exam.customExamId || exam.id}_${currentUser?.id || 'guest'}`;
  const [savedData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [questions, setQuestions] = useState(exam.realQuestions || []);
  const [loadingQ, setLoadingQ] = useState(!exam.realQuestions);
  const [answers, setAnswers] = useState(savedData?.answers || {});
  const [flagged, setFlagged] = useState(savedData?.flagged || {});
  const [submitted, setSubmitted] = useState(false);
  const [activeQ, setActiveQ] = useState(savedData?.activeQ || 0);
  const [timeElapsed, setTimeElapsed] = useState(savedData?.timeElapsed || 0);
  const [timeLeft, setTimeLeft] = useState(savedData?.timeLeft ?? ((exam.time || 0) * 60));
  const [showConfirm, setShowConfirm] = useState(false);
  const [aiExplanations, setAiExplanations] = useState({});
  const subjectColor = SUBJECT_COLORS[exam.subject] || "#1d4ed8";

  // Lưu tiến độ vào localStorage mỗi khi state thay đổi
  useEffect(() => {
    if (submitted) { localStorage.removeItem(storageKey); return; }
    localStorage.setItem(storageKey, JSON.stringify({ answers, flagged, activeQ, timeElapsed, timeLeft }));
  }, [answers, flagged, activeQ, timeElapsed, timeLeft, submitted, storageKey]);

  useEffect(() => {
    if (exam.realQuestions) return;
    const loadQuestions = async () => {
      try {
        let detail = null;
        try { detail = await examApi.getDetail(exam.id); }
        catch (_) { detail = await examApi.getPublicDetail(exam.id); }
        if (detail?.questions?.length) {
          setQuestions(detail.questions.map((q) => {
            const rawOpts = Array.isArray(q.options) ? q.options : [];
            const opts = rawOpts.length > 0
              ? rawOpts.map((o, i) => {
                  if (!o) return OPT_LABELS[i] + ". (Trống)";
                  return /^[A-D]\.\s/.test(String(o)) ? String(o) : `${OPT_LABELS[i]}. ${o}`;
                })
              : ["A. (Chưa có đáp án)", "B. (Chưa có đáp án)", "C. (Chưa có đáp án)", "D. (Chưa có đáp án)"];
            return {
              id: q.id,
              q: q.questionContent || "(Câu hỏi trống)",
              opts,
              ans: q.answer ? OPT_LABELS.indexOf(q.answer.trim().toUpperCase()) : 0,
              explanation: "",
            };
          }));
        }
      } catch (err) {
        console.error("Không tải được câu hỏi:", err);
      } finally {
        setLoadingQ(false);
      }
    };
    loadQuestions();
  }, [exam.id, exam.realQuestions]);

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

  // ─── AI Tutor ──────────────────────────────────────────────────
  const handleAskAI = async (qId, userAnsIdx) => {
    if (aiExplanations[qId]?.loading) return;
    setAiExplanations(p => ({ ...p, [qId]: { loading: true } }));
    try {
      const selectedOpt = userAnsIdx !== undefined ? OPT_LABELS[userAnsIdx] : "Không chọn";
      const res = await aiApi.explain(qId, selectedOpt);
      setAiExplanations(p => ({ ...p, [qId]: { loading: false, data: res } }));
    } catch (err) {
      console.error("Lỗi AI:", err);
      setAiExplanations(p => ({ ...p, [qId]: { loading: false, error: "Hệ thống AI đang quá tải, vui lòng thử lại sau!" } }));
    }
  };

  // ─── Voice toast ───────────────────────────────────────────────
  const [voiceToast, setVoiceToast] = useState(null);
  const voiceToastRef = useRef(null);
  const showVoiceToast = useCallback((msg, type = "info") => {
    clearTimeout(voiceToastRef.current);
    setVoiceToast({ msg, type });
    voiceToastRef.current = setTimeout(() => setVoiceToast(null), 2500);
  }, []);

  // ─── Hàm nộp bài — dùng chung cho nút bấm & giọng nói ─────────
  const handleSubmit = useCallback(async () => {
    setShowConfirm(false);
    setSubmitted(true);
    if (isPractice) {
      try {
        await examApi.practiceSubmit({
          userId: currentUser?.id,
          examId: exam.id,
          answers: mappers.answersToDTO(answers, questions),
        });
      } catch (e) { console.error("Lỗi nộp luyện tập:", e); }
    } else {
      try {
        const totalSeconds = (exam.time || 0) * 60;
        const timeTaken = totalSeconds - timeLeft;
        const result = await customExamApi.submit({
          userId: currentUser?.id,
          customExamId: exam.customExamId,
          answers: mappers.answersToDTO(answers, questions),
          timeTakenSeconds: timeTaken,
        });
        if (onSaveResult) {
          const now = new Date();
          const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
          onSaveResult({ ...exam, score: Math.round(result.score ?? 0), date: dateStr, status: (result.score ?? 0) >= 50 ? "Đạt" : "Không đạt", resultId: result.resultId ?? Date.now() });
        }
      } catch (e) {
        const finalScore = Math.round((questions.filter(q => answers[q.id] === q.ans).length / questions.length) * 100);
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
        if (onSaveResult) onSaveResult({ ...exam, score: finalScore, date: dateStr, status: finalScore >= 50 ? "Đạt" : "Không đạt", resultId: Date.now() });
      }
    }
  }, [isPractice, currentUser, exam, answers, questions, onSaveResult, timeLeft]);

  // ─── Voice control hook ────────────────────────────────────────
  const { listening, toggle: toggleVoice, transcript } = useVoiceControl({
    questions, activeQ, setActiveQ,
    answers, setAnswers,
    flagged, setFlagged,
    submitted, setShowConfirm,
    showConfirm,
    onConfirm: handleSubmit,
    onToast: showVoiceToast,
  });

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
            <button onClick={() => { setAnswers({}); setFlagged({}); setSubmitted(false); setActiveQ(0); setTimeLeft((exam.time || 0) * 60); setTimeElapsed(0); setExpandedExp({}); setAiExplanations({}); localStorage.removeItem(storageKey); }}
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
            const cardBorder = submitted
              ? isCorrect ? "2px solid #86efac"
              : isWrong   ? "2px solid #fca5a5"
              : "2px solid #fed7aa"
              : `2px solid ${activeQ === qi ? subjectColor + "55" : "rgba(59,130,246,0.1)"}`;

            return (
              <div key={q.id} id={`q-${qi}`}
                style={{ background: "#fff", borderRadius: 18, border: cardBorder, boxShadow: activeQ === qi && !submitted ? `0 8px 32px ${subjectColor}22` : "0 4px 16px rgba(29,78,216,0.06)", overflow: "hidden", transition: "all 0.2s" }}
                onClick={() => setActiveQ(qi)}>

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

                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.opts.map((opt, idx) => {
                    const selected = userAns === idx;
                    const isCorrectOpt = idx === q.ans;
                    let border, bg, labelBg, labelColor, textColor, icon = null;
                    if (submitted) {
                      if (isCorrectOpt) {
                        border = "2px solid #059669"; bg = "#f0fdf4";
                        labelBg = "linear-gradient(135deg,#059669,#10b981)"; labelColor = "#fff"; textColor = "#15803d";
                        icon = <Icon path={Icons.check} size={15} color="#059669" />;
                      } else if (selected && !isCorrectOpt) {
                        border = "2px solid #dc2626"; bg = "#fff5f5";
                        labelBg = "linear-gradient(135deg,#dc2626,#f87171)"; labelColor = "#fff"; textColor = "#dc2626";
                        icon = <Icon path={Icons.xmark} size={15} color="#dc2626" />;
                      } else {
                        border = "1.5px solid #e2e8f0"; bg = "#fafbfc";
                        labelBg = "#f1f5f9"; labelColor = "#94a3b8"; textColor = "#94a3b8";
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
                          {OPT_LABELS[idx]}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: selected || (submitted && isCorrectOpt) ? 600 : 400, color: textColor, transition: "all 0.18s", flex: 1 }}>{opt}</span>
                        {icon && <div style={{ marginLeft: "auto", flexShrink: 0 }}>{icon}</div>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation + AI Tutor */}
                {submitted && (() => {
                  const isOpen = !!expandedExp[q.id];
                  const accentColor = isCorrect ? "#059669" : isWrong ? "#dc2626" : "#92400e";
                  const accentBg = isCorrect ? "#f0fdf4" : isWrong ? "#fff5f5" : "#fffbeb";
                  const accentBorder = isCorrect ? "#86efac" : isWrong ? "#fca5a5" : "#fde68a";
                  const statusText = isCorrect ? "✅ Chính xác!" : isWrong ? "❌ Chưa đúng" : "⚠ Chưa trả lời";
                  return (
                    <div style={{ margin: "0 22px 20px", borderRadius: 12, border: `1.5px solid ${accentBorder}`, overflow: "hidden" }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleExp(q.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: accentBg, border: "none", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: accentColor }}>{statusText}</span>
                          {isWrong && <span style={{ fontSize: 12, color: "#475569" }}>· Đáp án đúng: <b style={{ color: "#059669" }}>{OPT_LABELS[q.ans]}</b></span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>💡 Giải thích</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </button>
                      <div style={{ maxHeight: isOpen ? "2000px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                        <div style={{ padding: "14px 16px", background: "#fff", borderTop: `1px solid ${accentBorder}` }}>
                          {isWrong && (
                            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
                              <span style={{ fontSize: 12.5, color: "#475569" }}>Đáp án đúng: <b style={{ color: "#059669" }}>{OPT_LABELS[q.ans]}. {q.opts[q.ans]}</b></span>
                            </div>
                          )}
                          {/* AI Tutor response */}
                          {aiExplanations[q.id]?.data ? (
                            <div style={{ marginTop: 12, padding: "16px", background: "linear-gradient(to right,#faf5ff,#f3e8ff)", borderRadius: 12, border: "1px solid #e9d5ff" }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                                <span style={{ fontSize: 18 }}>✨</span>
                                <span style={{ fontWeight: 800, color: "#7e22ce" }}>Gia sư AI phân tích</span>
                              </div>
                              <p style={{ fontStyle: "italic", color: "#6b7280", fontSize: 13, marginBottom: 12 }}>{aiExplanations[q.id].data.greeting}</p>
                              <div style={{ padding: "10px 14px", background: "#fff", borderRadius: 8, borderLeft: "4px solid #a855f7", marginBottom: 12, fontSize: 13.5, color: "#1f2937", lineHeight: 1.6, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <b style={{ color: "#7e22ce" }}>Cốt lõi: </b>{aiExplanations[q.id].data.coreExplanation}
                              </div>
                              <ul style={{ paddingLeft: 20, marginBottom: 14, color: "#374151", fontSize: 13, lineHeight: 1.6 }}>
                                {aiExplanations[q.id].data.details.map((dt, i) => (
                                  <li key={i} style={{ marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: dt.replace(/\*\*(.*?)\*\*/g, '<b style="color:#4c1d95">$1</b>') }} />
                                ))}
                              </ul>
                              <p style={{ fontWeight: 600, color: "#059669", fontSize: 13 }}>💡 Lời khuyên: <span style={{ fontWeight: 400, color: "#10b981" }}>{aiExplanations[q.id].data.advice}</span></p>
                            </div>
                          ) : aiExplanations[q.id]?.loading ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#8b5cf6", fontSize: 13, fontWeight: 600, padding: 10 }}>
                              <div style={{ width: 16, height: 16, border: "2px solid #ddd6fe", borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                              Gia sư AI đang suy nghĩ...
                            </div>
                          ) : aiExplanations[q.id]?.error ? (
                            <div style={{ color: "#dc2626", fontSize: 13 }}>{aiExplanations[q.id].error}</div>
                          ) : (
                            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.75 }}>
                              {q.explanation || `Đáp án ${OPT_LABELS[q.ans]} là chính xác. ${q.opts[q.ans]} là câu trả lời phù hợp nhất với nội dung câu hỏi.`}
                              <div style={{ marginTop: 16 }}>
                                <button onClick={(e) => { e.stopPropagation(); handleAskAI(q.id, userAns); }}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg,#8b5cf6,#c084fc)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(139,92,246,0.25)" }}>
                                  ✨ Hỏi Gia sư AI
                                </button>
                              </div>
                            </div>
                          )}
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

            {!submitted && (
              <button onClick={() => setShowConfirm(true)} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 6px 20px rgba(29,78,216,0.35)" }}>
                Nộp bài ({answered}/{questions.length})
              </button>
            )}

            {submitted && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setAnswers({}); setFlagged({}); setSubmitted(false); setActiveQ(0); setTimeLeft((exam.time || 0) * 60); setTimeElapsed(0); setExpandedExp({}); setAiExplanations({}); localStorage.removeItem(storageKey); }}
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
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 6px" }}>Đã hoàn thành <b style={{ color: "#1d4ed8" }}>{answered}/{questions.length}</b> câu hỏi</p>
            <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "0 0 24px" }}>🎤 Nói <b>"Xác nhận"</b> để nộp · <b>"Quay lại"</b> để hủy</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Làm tiếp</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Control */}
      <VoicePanel
        listening={listening}
        toggle={toggleVoice}
        transcript={transcript}
        supported={!!(window.SpeechRecognition || window.webkitSpeechRecognition)}
      />

      {/* Voice Toast */}
      {voiceToast && (
        <div style={{
          position: "fixed", bottom: 96, right: 24, zIndex: 300,
          background: voiceToast.type === "ok" ? "#f0fdf4" : voiceToast.type === "error" ? "#fff5f5" : voiceToast.type === "warn" ? "#fffbeb" : "#eff6ff",
          border: `1.5px solid ${voiceToast.type === "ok" ? "#86efac" : voiceToast.type === "error" ? "#fca5a5" : voiceToast.type === "warn" ? "#fde68a" : "#bfdbfe"}`,
          color: voiceToast.type === "ok" ? "#15803d" : voiceToast.type === "error" ? "#dc2626" : voiceToast.type === "warn" ? "#92400e" : "#1d4ed8",
          padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", animation: "fadeIn 0.2s ease", maxWidth: 280,
        }}>
          {voiceToast.msg}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export default PracticePage;
