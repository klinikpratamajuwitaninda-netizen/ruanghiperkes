import React, { useState, useEffect } from 'react';
import { PATIENTS_DATA, Patient } from './data/patientsData';
import { WardSimulationView } from './components/WardSimulationView';
import { QuizExamView } from './components/QuizExamView';
import { SlideViewerModal } from './components/SlideViewerModal';
import { HandbookModal } from './components/HandbookModal';
import { SafetyChecklistModal } from './components/SafetyChecklistModal';
import { AiConsultationModal } from './components/AiConsultationModal';
import {
  Activity,
  BookOpen,
  MessageSquare,
  FileCheck,
  ShieldCheck,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneCall,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { playHospitalSound, stopSpeaking, triggerHaptic } from './utils/speechUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ward' | 'quiz'>('ward');
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedPatientForAi, setSelectedPatientForAi] = useState<Patient | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleOpenAiConsultation = (patient?: Patient) => {
    triggerHaptic('medium');
    playHospitalSound('click');
    setSelectedPatientForAi(patient || null);
    setIsAiModalOpen(true);
  };

  const handleOpenSlides = () => {
    triggerHaptic('medium');
    playHospitalSound('click');
    setIsSlideOpen(true);
  };

  const handleOpenHandbook = () => {
    triggerHaptic('medium');
    playHospitalSound('click');
    setIsHandbookOpen(true);
  };

  const handleOpenChecklist = () => {
    triggerHaptic('medium');
    playHospitalSound('click');
    setIsChecklistOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-20 md:pb-6">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand title wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('ward');
              }}
              className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap"
            >
              HIPERKES Rajawali Hospital
            </a>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean unboxed typography) */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('ward');
              }}
              className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap ${
                activeTab === 'ward' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
              }`}
            >
              30 Pasien Bangsal
            </button>

            <button
              onClick={() => handleOpenAiConsultation()}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>AI Nurse Voice</span>
            </button>

            <button
              onClick={handleOpenSlides}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap"
            >
              30 Slide Kuliah
            </button>

            <button
              onClick={handleOpenHandbook}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap"
            >
              Buku Modul dr. Juwita
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('quiz');
              }}
              className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap ${
                activeTab === 'quiz' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
              }`}
            >
              Ujian 30 Soal CBT
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Utility Toggles */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Ganti Tema Gelap / Terang"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={handleOpenChecklist}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Checklist Keselamatan</span>
              <span className="sm:hidden">Checklist</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {activeTab === 'ward' ? (
          <WardSimulationView
            onOpenConsultation={(patient) => handleOpenAiConsultation(patient)}
            onOpenChecklist={handleOpenChecklist}
          />
        ) : (
          <QuizExamView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Institut Kesehatan Rajawali · Modul HIPERKES & Keselamatan Pasien Keperawatan
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Penyusun: dr. Juwita Ninda Suherman, M.Kes · Safe Care Starts With Safe Work
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <button onClick={handleOpenSlides} className="hover:text-sky-600">
              30 Slide
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={handleOpenHandbook} className="hover:text-sky-600">
              7 Bab Modul
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('quiz')} className="hover:text-sky-600">
              30 Soal Evaluasi
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Android Thumb-Zone Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg">
        <div className="grid grid-cols-4 items-center h-16 px-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ward');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] ${
              activeTab === 'ward' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">30 Pasien</span>
          </button>

          <button
            onClick={() => handleOpenAiConsultation()}
            className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] text-slate-500 hover:text-sky-600"
          >
            <Sparkles className="w-5 h-5 text-sky-500" />
            <span className="text-[10px] mt-1 tracking-tight">AI Nurse</span>
          </button>

          <button
            onClick={handleOpenSlides}
            className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] text-slate-500 hover:text-sky-600"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">30 Slide</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('quiz');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] ${
              activeTab === 'quiz' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">30 Soal</span>
          </button>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <SlideViewerModal isOpen={isSlideOpen} onClose={() => setIsSlideOpen(false)} />
      <HandbookModal isOpen={isHandbookOpen} onClose={() => setIsHandbookOpen(false)} />
      <SafetyChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
      <AiConsultationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        selectedPatient={selectedPatientForAi}
      />
    </div>
  );
}
