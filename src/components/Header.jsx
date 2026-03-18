import { useState } from "react";
import { Icons, Icon } from "../constants.jsx";
import { auth } from "../api.js";
import { useMobile } from "../hooks/useMobile.js";

function Header({ activePage, setPage, isLoggedIn, setIsLoggedIn, currentUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMobile(900);

  const nav = [
    { id: "home",     label: "Trang chủ",     icon: Icons.home    },
    { id: "my-exams", label: "Bộ đề của bạn", icon: Icons.book    },
    { id: "created",  label: "Đề đã tạo",     icon: Icons.edit    },
    { id: "history",  label: "Lịch sử",       icon: Icons.history },
    { id: "bank",     label: "Ngân hàng đề",  icon: Icons.shield  },
  ];

  const handleLogout = async () => {
    try { await auth.logout(); } catch(e) {}
    localStorage.removeItem("smartexam_userId");
    setIsLoggedIn(false);
    setMenuOpen(false);
  };

  return (
    <header style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid rgba(59,130,246,0.12)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(29,78,216,0.06)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px" : "0 24px", height: isMobile ? 56 : 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <button onClick={() => { setPage("home"); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(29,78,216,0.35)" }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 900, fontFamily: "Georgia, serif" }}>S</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>Smart<span style={{ color: "#1d4ed8" }}>Exam</span></span>
        </button>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 9, border: "none", background: activePage === n.id ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "transparent", color: activePage === n.id ? "#fff" : "#475569", fontWeight: activePage === n.id ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap" }}>
                <Icon path={n.icon} size={14} color={activePage === n.id ? "#fff" : "#94a3b8"} />
                {n.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && isLoggedIn && (
            <>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>
                {(currentUser?.name || "N")[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.name || "Người dùng"}</span>
              {currentUser?.role === "ADMIN" && (
                <button onClick={() => setPage("admin")} style={{ padding: "6px 11px", borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⚙️ Admin</button>
              )}
              <button onClick={handleLogout} style={{ padding: "6px 11px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Đăng xuất</button>
            </>
          )}
          {!isMobile && !isLoggedIn && (
            <button onClick={() => setPage("login")} style={{ padding: "8px 18px", borderRadius: 9, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Đăng nhập</button>
          )}

          {/* Hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(p => !p)} style={{ background: menuOpen ? "#eff6ff" : "none", border: menuOpen ? "1.5px solid #bfdbfe" : "1.5px solid transparent", cursor: "pointer", padding: "7px 9px", borderRadius: 10, display: "flex", flexDirection: "column", gap: 5, transition: "all 0.2s" }}>
              <div style={{ width: 20, height: 2, background: "#1d4ed8", borderRadius: 2, transition: "all 0.25s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
              <div style={{ width: 20, height: 2, background: "#1d4ed8", borderRadius: 2, transition: "all 0.25s", opacity: menuOpen ? 0 : 1 }} />
              <div style={{ width: 20, height: 2, background: "#1d4ed8", borderRadius: 2, transition: "all 0.25s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobile && menuOpen && (
        <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "10px 14px 18px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", animation: "slideDown 0.2s ease" }}>
          {/* Nav grid 2 cột */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderRadius: 11, border: activePage === n.id ? "none" : "1.5px solid #e2e8f0", background: activePage === n.id ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#f8fafc", color: activePage === n.id ? "#fff" : "#0f172a", fontWeight: activePage === n.id ? 700 : 500, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
                <Icon path={n.icon} size={15} color={activePage === n.id ? "#fff" : "#94a3b8"} />
                {n.label}
              </button>
            ))}
          </div>

          {/* User */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            {isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {(currentUser?.name || "N")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{currentUser?.name || "Người dùng"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{currentUser?.email || ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {currentUser?.role === "ADMIN" && (
                    <button onClick={() => { setPage("admin"); setMenuOpen(false); }} style={{ padding: "8px 11px", borderRadius: 9, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⚙️</button>
                  )}
                  <button onClick={handleLogout} style={{ padding: "8px 14px", borderRadius: 9, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Đăng xuất</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setPage("login"); setMenuOpen(false); }} style={{ width: "100%", padding: "13px", borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}>
                🔑 Đăng nhập với Google
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </header>
  );
}

export default Header;
