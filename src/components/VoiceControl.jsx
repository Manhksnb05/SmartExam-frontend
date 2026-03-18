import { useState, useEffect, useRef, useCallback } from "react";
import { aiApi } from "../api.js";

const optMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };

const viNum = (s) => {
  const map = {
    "một": 1, "hai": 2, "ba": 3, "bốn": 4, "năm": 5,
    "sáu": 6, "bảy": 7, "tám": 8, "chín": 9, "mười": 10,
    "mười một": 11, "mười hai": 12, "mười ba": 13, "mười bốn": 14,
    "mười lăm": 15, "mười sáu": 16, "mười bảy": 17, "mười tám": 18,
    "mười chín": 19, "hai mươi": 20, "hai mốt": 21, "hai hai": 22,
    "hai ba": 23, "hai bốn": 24, "hai lăm": 25, "hai sáu": 26,
    "hai bảy": 27, "hai tám": 28, "hai chín": 29, "ba mươi": 30,
  };
  const n = parseInt(s);
  if (!isNaN(n)) return n;
  return map[s.toLowerCase().trim()] ?? null;
};

function parseCommandRegex(text) {
  const t = text.toLowerCase().trim()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ");

  let m = t.match(/câu\s+(\S+(?:\s+\S+)?)\s+ch[oọ]n\s+([abcdABCD1-4])/);
  if (m) {
    const qNum = viNum(m[1]);
    const opt = optMap[m[2].toLowerCase()];
    if (qNum !== null && opt !== undefined)
      return { type: "SELECT", qIndex: qNum - 1, optIndex: opt };
  }

  m = t.match(/^ch[oọ]n\s+([abcdABCD1-4])$/);
  if (m) {
    const opt = optMap[m[1].toLowerCase()];
    if (opt !== undefined) return { type: "SELECT_CURRENT", optIndex: opt };
  }

  m = t.match(/đ[oọ]c\s+câu\s+(\S+(?:\s+\S+)?)/);
  if (m) {
    if (m[1] === "này" || m[1] === "nay") return { type: "READ_CURRENT" };
    const qNum = viNum(m[1]);
    if (qNum !== null) return { type: "READ", qIndex: qNum - 1 };
  }

  if (/^đ[oọ]c\s+câu$/.test(t) || /đ[oọ]c\s+câu\s+n[aà]y/.test(t)) return { type: "READ_CURRENT" };
  if (/câu ti[eế]p|ti[eế]p theo|câu sau/.test(t)) return { type: "NEXT" };
  if (/câu tr[uướ][oó]c/.test(t)) return { type: "PREV" };
  if (/đánh dấu/.test(t) && !/b[oỏ]/.test(t)) return { type: "FLAG" };
  if (/b[oỏ]\s+đánh dấu/.test(t)) return { type: "UNFLAG" };
  if (/n[oộ]p\s+b[aà]i/.test(t)) return { type: "SUBMIT" };

  // ✅ Xác nhận nộp bài
  if (/xác nhận|đồng ý|nộp luôn|\bok\b/.test(t)) return { type: "CONFIRM" };

  // ✅ Hủy / quay lại
  if (/quay lại|h[uủ]y|kh[oô]ng n[oộ]p|làm ti[eế]p/.test(t)) return { type: "CANCEL" };

  m = t.match(/^câu\s+(\S+(?:\s+\S+)?)$/);
  if (m) {
    const qNum = viNum(m[1]);
    if (qNum !== null) return { type: "GOTO", qIndex: qNum - 1 };
  }

  return null;
}

async function parseCommandAI(text, totalQuestions) {
  try {
    const result = await aiApi.parseVoice(text, totalQuestions);
    if (!result || result.type === "UNKNOWN") return null;
    return result;
  } catch (e) {
    return null;
  }
}

async function parseCommand(text, totalQuestions, onThinking) {
  const quick = parseCommandRegex(text);
  if (quick) return quick;
  onThinking?.();
  return await parseCommandAI(text, totalQuestions);
}

export function speak(text, recRef) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  if (recRef?.current?._shouldRun) {
    try { recRef.current.abort(); } catch (_) {}
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "vi-VN";
  utter.rate = 1.0;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang.startsWith("vi"));
  if (viVoice) utter.voice = viVoice;

  utter.onend = () => {
    if (recRef?.current?._shouldRun) {
      setTimeout(() => {
        try { recRef.current.start(); } catch (_) {}
      }, 300);
    }
  };

  window.speechSynthesis.speak(utter);
}

// ─── Main Hook ────────────────────────────────────────────────────
export function useVoiceControl({
  questions, activeQ, setActiveQ,
  answers, setAnswers,
  flagged, setFlagged,
  submitted, setShowConfirm,
  showConfirm, onConfirm,   // ✅ thêm 2 prop mới
  onToast,
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const stateRef = useRef({});
  stateRef.current = {
    questions, activeQ, setActiveQ,
    answers, setAnswers,
    flagged, setFlagged,
    submitted, setShowConfirm,
    showConfirm, onConfirm,  // ✅ luôn mới nhất
    onToast,
  };

  const lastCmdRef = useRef({ text: "", time: 0 });
  const COOLDOWN_MS = 800;

  const executeCommand = useCallback((cmd, rawText) => {
    const now = Date.now();
    if (lastCmdRef.current.text === rawText && now - lastCmdRef.current.time < COOLDOWN_MS) return;
    lastCmdRef.current = { text: rawText, time: now };

    const {
      questions, activeQ, setActiveQ, setAnswers, setFlagged,
      submitted, setShowConfirm, showConfirm, onConfirm, onToast,
    } = stateRef.current;
    const recRef = recognitionRef;

    if (submitted && !["READ", "READ_CURRENT", "GOTO", "NEXT", "PREV"].includes(cmd.type)) {
      onToast?.("⚠ Bài đã nộp rồi!", "warn");
      return;
    }

    switch (cmd.type) {
      case "SELECT": {
        const q = questions[cmd.qIndex];
        if (!q) { onToast?.(`⚠ Không có câu ${cmd.qIndex + 1}`, "warn"); return; }
        setAnswers(p => ({ ...p, [q.id]: cmd.optIndex }));
        setActiveQ(cmd.qIndex);
        document.getElementById(`q-${cmd.qIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        const label = ["A", "B", "C", "D"][cmd.optIndex];
        onToast?.(`✅ Câu ${cmd.qIndex + 1}: chọn ${label}`, "ok");
        speak(`Câu ${cmd.qIndex + 1} chọn ${label}`, recRef);
        break;
      }
      case "SELECT_CURRENT": {
        const q = questions[activeQ];
        if (!q) return;
        setAnswers(p => ({ ...p, [q.id]: cmd.optIndex }));
        const label = ["A", "B", "C", "D"][cmd.optIndex];
        onToast?.(`✅ Câu ${activeQ + 1}: chọn ${label}`, "ok");
        speak(`Chọn ${label}`, recRef);
        break;
      }
      case "READ": {
        const q = questions[cmd.qIndex];
        if (!q) { onToast?.(`⚠ Không có câu ${cmd.qIndex + 1}`, "warn"); return; }
        setActiveQ(cmd.qIndex);
        document.getElementById(`q-${cmd.qIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        const opts = q.opts.map((o, i) => `${["A","B","C","D"][i]}. ${o.replace(/^[A-D]\.\s*/, "")}`).join(". ");
        speak(`Câu ${cmd.qIndex + 1}. ${q.q}. Các đáp án: ${opts}`, recRef);
        onToast?.(`🔊 Đọc câu ${cmd.qIndex + 1}`, "info");
        break;
      }
      case "READ_CURRENT": {
        const q = questions[activeQ];
        if (!q) return;
        const opts = q.opts.map((o, i) => `${["A","B","C","D"][i]}. ${o.replace(/^[A-D]\.\s*/, "")}`).join(". ");
        speak(`Câu ${activeQ + 1}. ${q.q}. Các đáp án: ${opts}`, recRef);
        onToast?.(`🔊 Đọc câu ${activeQ + 1}`, "info");
        break;
      }
      case "NEXT": {
        const next = Math.min(activeQ + 1, questions.length - 1);
        setActiveQ(next);
        document.getElementById(`q-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        onToast?.(`➡ Câu ${next + 1}`, "info");
        break;
      }
      case "PREV": {
        const prev = Math.max(activeQ - 1, 0);
        setActiveQ(prev);
        document.getElementById(`q-${prev}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        onToast?.(`⬅ Câu ${prev + 1}`, "info");
        break;
      }
      case "FLAG": {
        const q = questions[activeQ];
        if (!q) return;
        setFlagged(p => ({ ...p, [q.id]: true }));
        onToast?.(`🚩 Đánh dấu câu ${activeQ + 1}`, "info");
        speak(`Đã đánh dấu câu ${activeQ + 1}`, recRef);
        break;
      }
      case "UNFLAG": {
        const q = questions[activeQ];
        if (!q) return;
        setFlagged(p => ({ ...p, [q.id]: false }));
        onToast?.(`✔ Bỏ đánh dấu câu ${activeQ + 1}`, "info");
        break;
      }
      case "GOTO": {
        const idx = Math.max(0, Math.min(cmd.qIndex, questions.length - 1));
        setActiveQ(idx);
        document.getElementById(`q-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        onToast?.(`📍 Câu ${idx + 1}`, "info");
        break;
      }
      case "SUBMIT": {
        setShowConfirm(true);
        speak("Xác nhận nộp bài không?", recRef);
        break;
      }
      // ✅ Xác nhận nộp bài bằng giọng nói
      case "CONFIRM": {
        if (!showConfirm) {
          onToast?.("⚠ Chưa mở hộp thoại nộp bài", "warn");
          return;
        }
        onToast?.("📝 Đang nộp bài...", "info");
        speak("Đang nộp bài", recRef);
        onConfirm?.();
        break;
      }
      // ✅ Hủy nộp bài bằng giọng nói
      case "CANCEL": {
        if (!showConfirm) return;
        setShowConfirm(false);
        onToast?.("↩ Đã hủy nộp bài", "info");
        speak("Đã hủy", recRef);
        break;
      }
    }
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "vi-VN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = async (e) => {
      const lastResult = e.results[e.results.length - 1];
      if (!lastResult.isFinal) return;
      const finalText = lastResult[0].transcript.trim();
      if (!finalText) return;

      setTranscript(finalText);

      const { questions, onToast } = stateRef.current;
      const cmd = await parseCommand(
        finalText,
        questions.length,
        () => onToast?.("⏳ Đang phân tích...", "info")
      );

      if (cmd) executeCommand(cmd, finalText);
      else onToast?.(`🎤 Không hiểu: "${finalText}"`, "warn");

      setTimeout(() => setTranscript(""), 1500);
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      setListening(false);
      stateRef.current.onToast?.("🎤 Lỗi micro. Thử lại!", "error");
    };

    rec.onend = () => {
      if (recognitionRef.current?._shouldRun) {
        setTimeout(() => {
          if (recognitionRef.current?._shouldRun) {
            try { rec.start(); } catch (_) {}
          }
        }, 200);
      } else {
        setListening(false);
      }
    };

    return () => {
      rec._shouldRun = false;
      rec.abort();
    };
  }, [executeCommand]);

  const toggle = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec._shouldRun = false;
      rec.abort();
      setListening(false);
      setTranscript("");
      window.speechSynthesis?.cancel();
    } else {
      rec._shouldRun = true;
      try { rec.start(); setListening(true); } catch (_) {}
    }
  }, [listening]);

  return {
    listening,
    toggle,
    transcript,
    supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

const COMMANDS_HELP = [
  { cmd: '"Câu 3 chọn B"', desc: "Chọn đáp án B câu 3" },
  { cmd: '"Chọn A"', desc: "Chọn A câu hiện tại" },
  { cmd: '"Đọc câu này"', desc: "Đọc câu hiện tại" },
  { cmd: '"Đọc câu 5"', desc: "Đọc câu 5" },
  { cmd: '"Câu tiếp theo"', desc: "Sang câu sau" },
  { cmd: '"Câu trước"', desc: "Quay lại câu trước" },
  { cmd: '"Đánh dấu"', desc: "Flag câu hiện tại" },
  { cmd: '"Nộp bài"', desc: "Mở hộp thoại nộp bài" },
  { cmd: '"Xác nhận"', desc: "Xác nhận nộp bài" },
  { cmd: '"Quay lại"', desc: "Hủy nộp bài" },
];

export default function VoicePanel({ listening, toggle, transcript, supported }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!supported) return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#fff", borderRadius: 14, padding: "10px 16px", fontSize: 12, color: "#94a3b8", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 200 }}>
      ⚠ Trình duyệt không hỗ trợ nhận giọng nói
    </div>
  );

  return (
    <>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {listening && transcript && (
          <div style={{ background: "#0f172a", color: "#fff", borderRadius: 12, padding: "8px 14px", fontSize: 12.5, maxWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }}>
            🎤 <em>{transcript}</em>
          </div>
        )}
        {showHelp && (
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 18px", width: 285, boxShadow: "0 16px 48px rgba(29,78,216,0.15)", animation: "slideUp 0.2s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>🎤 Lệnh giọng nói</div>
            {COMMANDS_HELP.map(({ cmd, desc }) => (
              <div key={cmd} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid #f1f5f9", gap: 10 }}>
                <code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 5, color: "#1d4ed8", fontWeight: 700, flexShrink: 0 }}>{cmd}</code>
                <span style={{ fontSize: 11.5, color: "#64748b", textAlign: "right" }}>{desc}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
              💡 Nói rõ ràng, ngắn gọn. Hoạt động tốt nhất trên Chrome/Edge.
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowHelp(p => !p)}
            title="Xem hướng dẫn lệnh"
            style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px solid #e2e8f0", background: showHelp ? "#eff6ff" : "#fff", color: showHelp ? "#1d4ed8" : "#94a3b8", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "all 0.18s" }}>
            ?
          </button>
          <button onClick={toggle}
            title={listening ? "Tắt giọng nói" : "Bật giọng nói"}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: listening ? "linear-gradient(135deg,#dc2626,#f87171)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              border: "none", color: "#fff", fontSize: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: listening ? "0 0 0 6px rgba(220,38,38,0.2),0 8px 24px rgba(220,38,38,0.4)" : "0 8px 24px rgba(29,78,216,0.35)",
              animation: listening ? "pulse 1.5s infinite" : "none",
              transition: "all 0.2s",
            }}>
            {listening ? "⏹" : "🎤"}
          </button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: listening ? "#dc2626" : "#94a3b8", textAlign: "center", letterSpacing: 0.3 }}>
          {listening ? "● ĐANG NGHE" : "Giọng nói"}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 6px rgba(220,38,38,0.2),0 8px 24px rgba(220,38,38,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(220,38,38,0.08),0 8px 32px rgba(220,38,38,0.5); }
        }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  );
}