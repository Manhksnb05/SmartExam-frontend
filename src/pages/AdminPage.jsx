import { useState, useEffect } from "react";
import { Icons, Icon } from "../constants.jsx";
import { examApi } from "../api.js";

async function request(url, opts = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const adminApi = {
  getStats: () => request(`/api/admin/stats`),
  getAllUsers: () => request(`/api/admin/users`),
};

export default function AdminPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("adminTab") || "stats");

  const handleSetTab = (tab) => {
    sessionStorage.setItem("adminTab", tab);
    setActiveTab(tab);
  };
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsData, statsData] = await Promise.allSettled([
        examApi.getPublic(),
        adminApi.getStats(),
      ]);
      if (examsData.status === "fulfilled") setExams(examsData.value || []);
      if (statsData.status === "fulfilled") setStats(statsData.value);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    try {
      await examApi.deleteMany([exam.id]);
      setExams(prev => prev.filter(e => e.id !== exam.id));
      setDeleteConfirm(null);
      showToast("✅ Đã xóa đề thi: " + exam.title);
    } catch (err) {
      showToast("❌ Lỗi xóa: " + err.message);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const { aiApi, mappers } = await import("../api.js");
      const aiRawJson = await aiApi.upload(uploadFile);
      setUploadProgress(55);
      let questions;
      try {
        if (typeof aiRawJson === "string") {
          questions = JSON.parse(aiRawJson.replace(/```json|```/g, "").trim());
        } else if (Array.isArray(aiRawJson)) {
          questions = aiRawJson;
        } else { questions = []; }
      } catch { questions = []; }
      if (!Array.isArray(questions) || questions.length === 0)
        throw new Error("AI không trích xuất được câu hỏi.");
      const saved = await examApi.saveFull({
        title: uploadFile.name.replace(/\.[^/.]+$/, ""),
        questions,
        userId: null,
      });
      setUploadProgress(80);
      await examApi.updateStatus(saved.id, "Public");
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setShowUploadModal(false);
        setUploadFile(null);
        showToast("✅ Đã thêm đề thi: " + saved.title);
        loadData();
      }, 400);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      showToast("❌ Lỗi: " + err.message);
    }
  };

  const filteredExams = exams.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Tổng đề thi", value: stats?.totalExams ?? exams.length, icon: Icons.book, color: "#1d4ed8", bg: "#eff6ff" },
    { label: "Tổng người dùng", value: stats?.totalUsers ?? "—", icon: Icons.users, color: "#059669", bg: "#f0fdf4" },
    { label: "Lượt tải file", value: stats?.totalUploads ?? "—", icon: Icons.upload, color: "#7c3aed", bg: "#faf5ff" },
    { label: "Lượt thi", value: stats?.totalResults ?? "—", icon: Icons.history, color: "#d97706", bg: "#fffbeb" },
  ];

  const tabs = [
    { id: "stats", label: "📊 Thống kê" },
    { id: "exams", label: "📚 Quản lý đề thi" },
  ];

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 60px", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon path={Icons.shield} size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: 0 }}>Trang Quản trị</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Xin chào, {currentUser?.name} · ADMIN</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleSetTab(t.id)}
            style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: activeTab === t.id ? "#fff" : "transparent", color: activeTab === t.id ? "#1d4ed8" : "#64748b", fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13.5, cursor: "pointer", boxShadow: activeTab === t.id ? "0 2px 8px rgba(29,78,216,0.12)" : "none", transition: "all 0.18s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ width: 40, height: 40, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <>
          {/* STATS TAB */}
          {activeTab === "stats" && (() => {
            const totalExams   = stats?.totalExams   ?? exams.length ?? 0;
            const totalUsers   = stats?.totalUsers   ?? 0;
            const totalUploads = stats?.totalUploads ?? 0;
            const totalResults = stats?.totalResults ?? 0;
            const maxVal = Math.max(totalExams, totalUsers, totalUploads, totalResults, 1);

            const bars = [
              { label: "Tổng đề thi",    value: totalExams,   color: "#1d4ed8", light: "#dbeafe", icon: "📚" },
              { label: "Người dùng",     value: totalUsers,   color: "#059669", light: "#d1fae5", icon: "👥" },
              { label: "Lượt tải file",  value: totalUploads, color: "#7c3aed", light: "#ede9fe", icon: "📤" },
              { label: "Lượt thi",       value: totalResults, color: "#d97706", light: "#fef3c7", icon: "📝" },
            ];

            const BAR_H = 220;
            const BAR_W = 64;
            const GAP   = 48;
            const SVG_W = bars.length * (BAR_W + GAP) + GAP;
            const SVG_H = BAR_H + 60;

            return (
              <div>
                {/* Summary cards nhỏ ở trên */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
                  {bars.map((b, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid rgba(59,130,246,0.08)", boxShadow: "0 4px 14px rgba(29,78,216,0.05)", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: b.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{b.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{b.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div style={{ background: "#fff", borderRadius: 18, padding: "28px 32px", border: "1.5px solid rgba(59,130,246,0.08)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)", marginBottom: 24 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>📊 Biểu đồ tổng quan</div>
                  <div style={{ overflowX: "auto" }}>
                    <svg width={SVG_W} height={SVG_H} style={{ display: "block", margin: "0 auto" }}>
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = 10 + (1 - ratio) * BAR_H;
                        const gridVal = Math.round(ratio * maxVal);
                        return (
                          <g key={i}>
                            <line x1={GAP / 2} y1={y} x2={SVG_W - GAP / 2} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                            <text x={GAP / 2 - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{gridVal}</text>
                          </g>
                        );
                      })}

                      {/* Bars */}
                      {bars.map((b, i) => {
                        const x = GAP + i * (BAR_W + GAP);
                        const barH = maxVal > 0 ? (b.value / maxVal) * BAR_H : 4;
                        const y = 10 + BAR_H - barH;
                        return (
                          <g key={i}>
                            {/* Background bar */}
                            <rect x={x} y={10} width={BAR_W} height={BAR_H} rx={10} fill={b.light} />
                            {/* Value bar */}
                            <rect x={x} y={y} width={BAR_W} height={barH} rx={10} fill={b.color} opacity="0.9" />
                            {/* Value label on top */}
                            <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill={b.color}>{b.value}</text>
                            {/* Icon */}
                            <text x={x + BAR_W / 2} y={10 + BAR_H + 20} textAnchor="middle" fontSize="18">{b.icon}</text>
                            {/* Label */}
                            <text x={x + BAR_W / 2} y={10 + BAR_H + 40} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">{b.label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Donut chart — tỉ lệ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Tỉ lệ đề thi vs lượt thi */}
                  <div style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1.5px solid rgba(59,130,246,0.08)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🥧 Phân bổ dữ liệu</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                      <svg width={120} height={120} viewBox="0 0 120 120">
                        {(() => {
                          const total = totalExams + totalUsers + totalUploads + totalResults || 1;
                          const slices = [
                            { val: totalExams,   color: "#1d4ed8" },
                            { val: totalUsers,   color: "#059669" },
                            { val: totalUploads, color: "#7c3aed" },
                            { val: totalResults, color: "#d97706" },
                          ];
                          let startAngle = -Math.PI / 2;
                          const cx = 60, cy = 60, r = 44, innerR = 28;
                          return slices.map((s, i) => {
                            const angle = (s.val / total) * 2 * Math.PI;
                            const endAngle = startAngle + angle;
                            const x1 = cx + r * Math.cos(startAngle);
                            const y1 = cy + r * Math.sin(startAngle);
                            const x2 = cx + r * Math.cos(endAngle);
                            const y2 = cy + r * Math.sin(endAngle);
                            const xi1 = cx + innerR * Math.cos(startAngle);
                            const yi1 = cy + innerR * Math.sin(startAngle);
                            const xi2 = cx + innerR * Math.cos(endAngle);
                            const yi2 = cy + innerR * Math.sin(endAngle);
                            const large = angle > Math.PI ? 1 : 0;
                            const d = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`;
                            startAngle = endAngle;
                            return <path key={i} d={d} fill={s.color} opacity="0.85" />;
                          });
                        })()}
                        <text x="60" y="56" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">{totalExams + totalUsers + totalUploads + totalResults}</text>
                        <text x="60" y="68" textAnchor="middle" fontSize="9" fill="#94a3b8">tổng</text>
                      </svg>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        {bars.map((b, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#64748b", flex: 1 }}>{b.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{b.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tỉ lệ trung bình lượt thi/đề */}
                  <div style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1.5px solid rgba(59,130,246,0.08)", boxShadow: "0 4px 16px rgba(29,78,216,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>📈 Chỉ số trung bình</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {[
                        { label: "Lượt thi / đề thi", value: totalExams > 0 ? (totalResults / totalExams).toFixed(1) : "0", unit: "lượt/đề", color: "#1d4ed8", pct: Math.min((totalResults / Math.max(totalExams * 5, 1)) * 100, 100) },
                        { label: "Đề thi / người dùng", value: totalUsers > 0 ? (totalExams / totalUsers).toFixed(1) : "0", unit: "đề/người", color: "#059669", pct: Math.min((totalExams / Math.max(totalUsers * 5, 1)) * 100, 100) },
                        { label: "Lượt thi / người dùng", value: totalUsers > 0 ? (totalResults / totalUsers).toFixed(1) : "0", unit: "lượt/người", color: "#7c3aed", pct: Math.min((totalResults / Math.max(totalUsers * 10, 1)) * 100, 100) },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12.5, color: "#64748b" }}>{m.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>{m.unit}</span></span>
                          </div>
                          <div style={{ height: 7, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${m.pct}%`, background: m.color, borderRadius: 999, transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* EXAMS TAB */}
          {activeTab === "exams" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{filteredExams.length} đề thi trong ngân hàng</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => setShowUploadModal(true)}
                  style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 12px rgba(29,78,216,0.3)" }}>
                  <Icon path={Icons.plus} size={15} color="#fff" /> Thêm đề thi
                </button>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon path={Icons.search} size={14} color="#94a3b8" />
                  </div>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm đề thi..."
                    style={{ padding: "9px 16px 9px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "#f8fafc", outline: "none", width: 240 }} />
                </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredExams.map(exam => (
                  <div key={exam.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon path={Icons.book} size={20} color="#1d4ed8" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exam.title}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        ID: {exam.id} · {exam.totalQuestions || exam.questions || "?"} câu · {exam.status || "public"}
                      </div>
                    </div>
                    <button onClick={() => setDeleteConfirm(exam)}
                      style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      🗑 Xóa
                    </button>
                  </div>
                ))}
                {filteredExams.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>Không tìm thấy đề thi nào</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: 460, boxShadow: "0 28px 70px rgba(29,78,216,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: "22px 22px 0 0" }} />
            <button onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadProgress(0); }}
              style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
              <Icon path={Icons.close} size={16} color="#64748b" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={Icons.upload} size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Thêm đề thi mới</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8" }}>AI sẽ tự động tạo đề và lưu Public</div>
              </div>
            </div>

            {/* Drop zone */}
            <div onClick={() => document.getElementById("admin-file-input").click()}
              style={{ border: `2px dashed ${uploadFile ? "#86efac" : "#cbd5e1"}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: uploadFile ? "#f0fdf4" : "#fafbfc", marginBottom: 20, transition: "all 0.2s" }}>
              <input id="admin-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]); }} />
              {!uploadFile ? (
                <>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Click để chọn file</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>PDF, DOCX, DOC, TXT · Tối đa 20MB</div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>📄</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{(uploadFile.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setUploadFile(null); }}
                    style={{ background: "#fee2e2", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer" }}>
                    <Icon path={Icons.close} size={13} color="#dc2626" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress */}
            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>🤖 AI đang xử lý...</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>{uploadProgress}%</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${uploadProgress}%`, background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", borderRadius: 999, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleUpload} disabled={!uploadFile || uploading}
                style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: !uploadFile || uploading ? "#e2e8f0" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: !uploadFile || uploading ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, cursor: !uploadFile || uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {uploading ? <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang tạo...</> : <><Icon path={Icons.plus} size={16} color={uploadFile ? "#fff" : "#94a3b8"} /> Tạo đề thi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 40px", width: 400, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Xóa đề thi?</div>
            <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 24 }}>
              Bạn chắc chắn muốn xóa <b style={{ color: "#dc2626" }}>{deleteConfirm.title}</b>? Hành động này không thể hoàn tác.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={() => handleDeleteExam(deleteConfirm)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#dc2626,#f87171)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "14px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
