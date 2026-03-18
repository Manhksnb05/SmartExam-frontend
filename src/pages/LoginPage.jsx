import { useState } from "react";
import { Icons, Icon } from "../constants.jsx";
import { auth } from "../api.js";

function LoginPage({ setPage, setIsLoggedIn }) {
  const [loading, setLoading] = useState(false);
  const handleLogin = () => {
    setLoading(true);
    // Redirect sang Google OAuth — backend sẽ redirect về localhost:5173 sau khi login
    window.location.href = auth.loginUrl;
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#eff6ff 0%,#f0f9ff 50%,#dbeafe 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Decorations */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: [200,120,80,300,150,100][i], height: [200,120,80,300,150,100][i], borderRadius: "50%", background: `rgba(29,78,216,${[0.04,0.06,0.03,0.03,0.05,0.04][i]})`, top: ["10%","70%","40%","-10%","80%","20%"][i], left: ["5%","10%","80%","60%","75%","45%"][i], animation: `float ${[8,12,10,15,9,11][i]}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }} />
      ))}
      <div style={{ background: "#fff", borderRadius: 24, padding: "52px 48px", width: 440, boxShadow: "0 32px 80px rgba(29,78,216,0.18)", position: "relative", border: "1.5px solid rgba(59,130,246,0.12)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#1d4ed8,#38bdf8,#1d4ed8)", borderRadius: "24px 24px 0 0", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 68, height: 68, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(29,78,216,0.4)" }}>
            <span style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: -0.5 }}>Smart<span style={{ color: "#1d4ed8" }}>Exam</span></h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Nền tảng ôn thi thông minh hàng đầu</p>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, marginBottom: 28, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>Truy cập 50,000+ đề thi miễn phí</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>AI tự động tạo đề theo yêu cầu</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569" }}>
            <Icon path={Icons.check} size={16} color="#10b981" /> <span>Theo dõi tiến độ học tập chi tiết</span>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "1.5px solid #e2e8f0", background: loading ? "#f1f5f9" : "#fff", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 700, color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "all 0.2s" }}>
          {loading ? (
            <><div style={{ width: 20, height: 20, border: "2.5px solid #e2e8f0", borderTop: "2.5px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span>Đang đăng nhập...</span></>
          ) : (
            <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Đăng nhập bằng Google</>
          )}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>Bằng cách đăng nhập, bạn đồng ý với <span style={{ color: "#1d4ed8", cursor: "pointer" }}>điều khoản</span> của chúng tôi</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}


export default LoginPage;
