import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { examApi, customExamApi, userApi, mappers, auth } from "./api.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SettingModal from "./components/SettingModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyExamsPage from "./pages/MyExamsPage.jsx";
import CreatedExamsPage from "./pages/CreatedExamsPage.jsx";
import BankPage from "./pages/BankPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import EditExamPage from "./pages/EditExamPage.jsx";
import PracticePage from "./pages/PracticePage.jsx";

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [settingExam, setSettingExam] = useState(null);
  const [editExam, setEditExam] = useState(null);

  // Lưu practiceExam vào sessionStorage để F5 không thoát khỏi chế độ thi/luyện
  const [practiceExam, setPracticeExamState] = useState(() => {
    try { const s = sessionStorage.getItem("practiceExam"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [practiceMode, setPracticeModeState] = useState(() => {
    return sessionStorage.getItem("practiceMode") || "exam";
  });
  const [practiceFromCreated, setPracticeFromCreatedState] = useState(() => {
    return sessionStorage.getItem("practiceFromCreated") === "true";
  });

  const setPracticeExam = (exam) => {
    setPracticeExamState(exam);
    if (exam) sessionStorage.setItem("practiceExam", JSON.stringify(exam));
    else sessionStorage.removeItem("practiceExam");
  };
  const setPracticeMode = (mode) => {
    setPracticeModeState(mode);
    sessionStorage.setItem("practiceMode", mode);
  };
  const setPracticeFromCreated = (val) => {
    setPracticeFromCreatedState(val);
    sessionStorage.setItem("practiceFromCreated", String(val));
  };
  const [historyList, setHistoryList] = useState([]);
  const [examRefreshKey, setExamRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const setPage = (p) => navigate("/" + (p === "home" ? "" : p));

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlUserId = params.get("userId");
        if (urlUserId) {
          window.history.replaceState({}, "", window.location.pathname);
          localStorage.setItem("smartexam_userId", urlUserId);
          const user = await userApi.getById(Number(urlUserId));
          if (user) { setCurrentUser(user); setIsLoggedIn(true); }
          return;
        }
        const savedUserId = localStorage.getItem("smartexam_userId");
        if (savedUserId) {
          const user = await userApi.getById(Number(savedUserId));
          if (user) { setCurrentUser(user); setIsLoggedIn(true); return; }
          localStorage.removeItem("smartexam_userId");
        }
      } catch (e) {
        localStorage.removeItem("smartexam_userId");
      } finally {
        setCheckingAuth(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;
    userApi.getResults(currentUser.id)
      .then(data => setHistoryList(data.map(mappers.resultHistory)))
      .catch(console.error);
  }, [isLoggedIn, currentUser]);

  const activePage = location.pathname === "/" ? "home" : location.pathname.replace("/", "");

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ width: 48, height: 48, border: "4px solid #dbeafe", borderTop: "4px solid #1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1d4ed8" }}>SmartExam</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Đang khôi phục phiên đăng nhập...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (editExam) return (
    <EditExamPage
      exam={editExam}
      onBack={() => setEditExam(null)}
      onSaved={(updated) => { setEditExam(null); }}
    />
  );

  if (practiceExam) return (
    <PracticePage
      exam={practiceExam}
      onBack={() => { setPracticeExam(null); sessionStorage.removeItem("practiceExam"); sessionStorage.removeItem("practiceMode"); sessionStorage.removeItem("practiceFromCreated"); }}
      mode={practiceMode}
      onSaveResult={practiceFromCreated ? (result) => setHistoryList(prev => [result, ...prev]) : undefined}
      currentUser={currentUser}
    />
  );

  const handleCreateExam = (exam) => setSettingExam(exam);
  const handlePracticeCreated = (exam, mode = "exam") => { setPracticeExam(exam); setPracticeMode(mode); setPracticeFromCreated(true); };
  const handlePracticeOther = (exam, mode = "practice") => { setPracticeExam(exam); setPracticeMode(mode); setPracticeFromCreated(false); };

  const handleConfirm = async (settings) => {
    try {
      const customExam = await customExamApi.create({
        originExamId: settingExam.id,
        timeLimit: settings.time,
        questionCount: settings.questions,
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        title: settingExam.title,
      });
      setSettingExam(null);
      const examData = await customExamApi.take(customExam.customExamId);
      setPracticeExam({
        ...settingExam,
        customExamId: examData.customExamId,
        time: examData.timeLimit,
        realQuestions: examData.questions.map(mappers.question),
      });
      setPracticeMode("exam");
      setPracticeFromCreated(true);
    } catch (err) {
      setSettingExam(null);
      setToast(`❌ Lỗi tạo đề: ${err.message}`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  if (!isLoggedIn) {
    const goLogin = () => navigate("/login");
    return (
      <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI', sans-serif" }}>
        <Header activePage={activePage} setPage={setPage} isLoggedIn={false} setIsLoggedIn={setIsLoggedIn} />
        <Routes>
          <Route path="/login" element={<LoginPage setPage={setPage} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="*" element={
            <>
              <HomePage onCreateExam={goLogin} onPractice={goLogin} onGoBank={goLogin} onRequireLogin={goLogin} />
              <Footer />
            </>
          } />
        </Routes>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Segoe UI', sans-serif" }}>
      <Header activePage={activePage} setPage={setPage} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} />
      <Routes>
        <Route path="/" element={<><HomePage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} onEditExam={(exam) => setEditExam(exam)} onGoBank={() => navigate("/bank")} currentUser={currentUser} onExamCreated={() => setExamRefreshKey(k => k + 1)} refreshKey={examRefreshKey} /><Footer /></>} />
        <Route path="/my-exams" element={<><MyExamsPage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} onEditExam={(exam) => setEditExam(exam)} currentUser={currentUser} onExamCreated={() => setExamRefreshKey(k => k + 1)} /><Footer /></>} />
        <Route path="/created" element={<><CreatedExamsPage onCreateExam={handleCreateExam} onPractice={handlePracticeCreated} onGoMyExams={() => navigate("/my-exams")} currentUser={currentUser} /><Footer /></>} />
        <Route path="/bank" element={<><BankPage onCreateExam={handleCreateExam} onPractice={handlePracticeOther} refreshKey={examRefreshKey} /><Footer /></>} />
        <Route path="/history" element={<><HistoryPage onPractice={handlePracticeOther} historyList={historyList} /><Footer /></>} />
        <Route path="/admin" element={currentUser?.role === "ADMIN" ? <AdminPage currentUser={currentUser} /> : <Navigate to="/" replace />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {settingExam && <SettingModal exam={settingExam} onClose={() => setSettingExam(null)} onConfirm={handleConfirm} />}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "14px 24px", borderRadius: 14, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
