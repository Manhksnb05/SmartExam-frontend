import { useState, useEffect } from "react";
import { Icons, Icon } from "../constants.jsx";
import { examApi, mappers } from "../api.js";
import { ExamCard, ExamGrid } from "../components/ExamCard.jsx";

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
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>{exams.length} bộ đề • Từ cộng đồng giáo viên</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm..." style={{ padding: "10px 18px", borderRadius: 11, border: "1.5px solid #e2e8f0", fontSize: 13.5, outline: "none", width: 240, background: "#f8fafc" }} />
      </div>
      <ExamGrid exams={filtered} onCreateExam={onCreateExam} onPractice={onPractice} />
    </main>
  );
}


export default BankPage;
