import React, { useState } from 'react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../data/quizData';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  FileCheck,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakIndonesian, stopSpeaking, playHospitalSound, triggerHaptic } from '../utils/speechUtils';

export const QuizExamView: React.FC = () => {
  const [studentName, setStudentName] = useState('Mahasiswa Keperawatan');
  const [studentNim, setStudentNim] = useState('NIM-2026.001');
  const [studentClass, setStudentClass] = useState('Tingkat III / Semester 6');
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'teori' | 'kasus'>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list');
  const [speakingQuestionId, setSpeakingQuestionId] = useState<number | null>(null);

  const filteredQuestions = QUIZ_QUESTIONS.filter((q) => {
    if (filterType === 'teori') return q.type === 'teori';
    if (filterType === 'kasus') return q.type === 'kasus';
    return true;
  });

  const handleSelectOption = (questionId: number, optionKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (isSubmitted) return;
    triggerHaptic('light');
    playHospitalSound('click');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    return { correctCount, finalScore };
  };

  const handleSubmitExam = () => {
    triggerHaptic('heavy');
    setIsSubmitted(true);
    setShowExplanations(true);

    const { finalScore } = calculateScore();
    if (finalScore >= 70) {
      playHospitalSound('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      playHospitalSound('warning');
    }
  };

  const handleResetExam = () => {
    triggerHaptic('medium');
    setUserAnswers({});
    setIsSubmitted(false);
    setShowExplanations(false);
    setActiveQuestionIndex(0);
  };

  const handleSpeakQuestion = (q: QuizQuestion) => {
    if (speakingQuestionId === q.id) {
      stopSpeaking();
      setSpeakingQuestionId(null);
      return;
    }

    triggerHaptic('light');
    stopSpeaking();
    setSpeakingQuestionId(q.id);

    const fullSpeech = `Soal nomor ${q.id}. ${q.question}. Pilihan A: ${q.options[0].text}. Pilihan B: ${q.options[1].text}. Pilihan C: ${q.options[2].text}. Pilihan D: ${q.options[3].text}. Pilihan E: ${q.options[4].text}.`;

    speakIndonesian(fullSpeech, {
      pitch: 1.0,
      rate: 1.0,
      onStart: () => setSpeakingQuestionId(q.id),
      onEnd: () => setSpeakingQuestionId(null),
      onError: () => setSpeakingQuestionId(null),
    });
  };

  const { correctCount, finalScore } = calculateScore();
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Institut Kesehatan Rajawali
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500">Program Studi Keperawatan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              Evaluasi Pembelajaran: 30 Soal HIPERKES & Keselamatan Pasien
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Penyusun: dr. Juwita Ninda Suherman, M.Kes · 30 Soal Pilihan Berganda (Pilihan A–E)
            </p>
          </div>

          {/* Score card when submitted */}
          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                {finalScore}
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Nilai Ujian Anda:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {correctCount} dari 30 Soal Benar ({finalScore}/100)
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                  {finalScore >= 75 ? '★ LULUS KOMPETENSI K3RS' : 'Perlu Pengulangan Materi'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Student metadata form inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div>
            <label className="text-slate-500 block mb-1 font-medium">Nama Mahasiswa:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1 font-medium">NIM Mahasiswa:</label>
            <input
              type="text"
              value={studentNim}
              onChange={(e) => setStudentNim(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1 font-medium">Kelas / Tingkat:</label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>
        </div>

        {/* Action Controls & Navigation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua Soal (30)
            </button>
            <button
              onClick={() => setFilterType('teori')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'teori'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Teori (1–15)
            </button>
            <button
              onClick={() => setFilterType('kasus')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'kasus'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kasus Klinis (16–30)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">
              Terjawab: <strong>{answeredCount}</strong> / 30
            </span>

            {isSubmitted ? (
              <button
                onClick={handleResetExam}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Ulangi Ujian
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={answeredCount === 0}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-colors"
              >
                <FileCheck className="w-4 h-4" /> Selesai & Periksa Nilai
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Answer Sheet Quick Bubble Navigator (Lembar Jawaban Cepat) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Lembar Jawaban Mahasiswa (Nomor 1–30):</span>
          <span className="text-slate-400 font-normal">Klik nomor untuk melompat</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
          {QUIZ_QUESTIONS.map((q) => {
            const hasAnswered = !!userAnswers[q.id];
            const isCorrect = isSubmitted && userAnswers[q.id] === q.correctAnswer;
            const isWrong = isSubmitted && userAnswers[q.id] && userAnswers[q.id] !== q.correctAnswer;

            let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
            if (isSubmitted) {
              if (isCorrect) badgeClass = 'bg-emerald-500 text-white font-bold';
              else if (isWrong) badgeClass = 'bg-rose-500 text-white font-bold';
              else badgeClass = 'bg-slate-200 dark:bg-slate-800 text-slate-400 line-through';
            } else if (hasAnswered) {
              badgeClass = 'bg-sky-600 text-white font-semibold';
            }

            return (
              <a
                key={q.id}
                href={`#soal-${q.id}`}
                className={`h-8 rounded-lg flex items-center justify-center text-xs font-mono transition-transform hover:scale-105 ${badgeClass}`}
                title={`Soal ${q.id}: ${userAnswers[q.id] || 'Belum dijawab'}`}
              >
                {q.id}
              </a>
            );
          })}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const selectedOption = userAnswers[q.id];
          const isCorrect = isSubmitted && selectedOption === q.correctAnswer;
          const isWrong = isSubmitted && selectedOption && selectedOption !== q.correctAnswer;
          const isSpeakingThis = speakingQuestionId === q.id;

          return (
            <div
              key={q.id}
              id={`soal-${q.id}`}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20'
                    : 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                    No. {q.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {q.type === 'teori' ? 'Teori HIPERKES' : 'Studi Kasus Klinis'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSpeakQuestion(q)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      isSpeakingThis
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Bacakan Soal"
                  >
                    {isSpeakingThis ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {isSubmitted && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isCorrect ? '✓ Jawaban Benar (+1)' : '✗ Belum Tepat (0)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Stem */}
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-4">
                {q.question}
              </p>

              {/* Options A to E */}
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isOptSelected = selectedOption === opt.key;
                  const isThisCorrect = isSubmitted && opt.key === q.correctAnswer;
                  const isThisWrongSelected = isSubmitted && isOptSelected && !isThisCorrect;

                  let optClass =
                    'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';

                  if (isSubmitted) {
                    if (isThisCorrect) {
                      optClass =
                        'border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                    } else if (isThisWrongSelected) {
                      optClass =
                        'border-rose-400 bg-rose-100/70 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 font-semibold';
                    } else {
                      optClass = 'border-slate-200 dark:border-slate-800 opacity-60';
                    }
                  } else if (isOptSelected) {
                    optClass =
                      'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-950 dark:text-sky-200 ring-1 ring-sky-500 font-medium';
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(q.id, opt.key)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm transition-all flex items-start gap-3 ${optClass}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isThisCorrect
                            ? 'bg-emerald-600 text-white'
                            : isThisWrongSelected
                            ? 'bg-rose-600 text-white'
                            : isOptSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Rationale / Explanation Box */}
              {showExplanations && (
                <div className="mt-4 p-4 rounded-2xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-900 text-xs">
                  <div className="flex items-center gap-1.5 text-sky-900 dark:text-sky-300 font-bold mb-1">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    <span>Kunci Jawaban Resmi: {q.correctAnswer}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {q.explanation}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Referensi: {q.sourceModuleTopic}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
