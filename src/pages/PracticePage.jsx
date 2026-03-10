import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function PracticePage() {
  const { id } = useParams(); // Lấy ID bộ đề từ URL
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); 
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API lấy danh sách câu hỏi của bộ đề này
    axios.get(`http://localhost:8080/api/questions/exam/${id}`)
      .then(res => setQuestions(res.data))
      .catch(err => console.error("Lỗi tải câu hỏi:", err));
  }, [id]);

  const handleSelect = (qId, selectedOpt, correctOpt) => {
    if (userAnswers[qId]) return; // Đã làm rồi thì không cho chọn lại

    const isRight = selectedOpt === correctOpt;
    setUserAnswers({ ...userAnswers, [qId]: { selectedOpt, isRight } });

    if (isRight) setScore(s => ({ ...s, correct: s.correct + 1 }));
    else setScore(s => ({ ...s, wrong: s.wrong + 1 }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Thanh trạng thái nổi (Sticky Header) */}
      <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border-b-4 border-blue-600 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-blue-900 uppercase">Chế độ: Luyện tập tự do</h2>
          <p className="text-slate-500 text-sm">Hệ thống không tính giờ - Học từ lỗi sai</p>
        </div>
        <div className="flex gap-6 font-bold text-lg">
          <div className="bg-green-100 px-4 py-2 rounded-xl text-green-700">✅ Đúng: {score.correct}</div>
          <div className="bg-red-100 px-4 py-2 rounded-xl text-red-700">❌ Sai: {score.wrong}</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">
              Câu {index + 1}: {q.question}
            </h3>
            
            <div className="grid gap-3">
              {q.options.map((opt) => {
                const isSelected = userAnswers[q.id]?.selectedOpt === opt;
                const isCorrect = opt === q.answer;
                const showResult = userAnswers[q.id];

                // Logic đổi màu chuẩn LMS
                let btnStyle = "border-slate-200 hover:border-blue-400 bg-white";
                if (showResult) {
                  if (isCorrect) btnStyle = "border-green-500 bg-green-50 text-green-700 font-bold";
                  else if (isSelected) btnStyle = "border-red-500 bg-red-50 text-red-700";
                }

                return (
                  <button
                    key={opt}
                    disabled={!!showResult}
                    onClick={() => handleSelect(q.id, opt, q.answer)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${btnStyle}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => navigate('/dashboard')}
        className="fixed bottom-8 right-8 bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-2xl hover:bg-black"
      >
        VỀ TRANG CHỦ
      </button>
    </div>
  );
}

export default PracticePage;