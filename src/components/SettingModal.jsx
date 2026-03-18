import { useState } from "react";
import { Icons, Icon } from "../constants.jsx";

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


export default SettingModal;
