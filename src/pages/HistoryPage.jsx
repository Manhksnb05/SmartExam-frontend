import { useState } from "react";
import { Icons, Icon } from "../constants.jsx";
import { ExamCard } from "../components/ExamCard.jsx";

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



export default HistoryPage;
