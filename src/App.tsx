import React, { useState, useEffect } from 'react';
import { PATIENTS_DATA, Patient } from './data/patientsData';
import { VirtualHospital3DGame } from './components/VirtualHospital3DGame';
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
  Box,
  Gamepad2,
} from 'lucide-react';
import { playHospitalSound, stopSpeaking, triggerHaptic } from './utils/speechUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'ward' | 'quiz'>('game');
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedPatientForAi, setSelectedPatientForAi] = useState<Patient | null>(null);
  const [darkMode, setDarkMode] = useState(false);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand title & Official Rajawali Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white p-1 border-2 border-sky-500 shadow-md flex items-center justify-center overflow-hidden">
              <img
                src="/rajawali_logo.png"
                alt="Logo Institut Kesehatan Rajawali"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('game');
                }}
                className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap block"
              >
                HIPERKES 3D
              </a>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block -mt-0.5">
                dr Juwita Ninda Suherman, M.Kes · Rajawali
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('game');
              }}
              className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'game' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-sky-500" />
              <span>Simulasi 3D Game</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('ward');
              }}
              className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ward' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
              }`}
            >
              <Box className="w-4 h-4 text-sky-500" />
              <span>Bangsal 30 Pasien</span>
            </button>

            <button
              onClick={handleOpenHandbook}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Modul dr. Juwita</span>
            </button>

            <button
              onClick={handleOpenSlides}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap"
            >
              30 Slide Kuliah
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
              className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Checklist K3RS</span>
              <span className="sm:hidden">Checklist</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'game' ? (
          <div className="space-y-4">
            <VirtualHospital3DGame
              onOpenHandbook={handleOpenHandbook}
              onOpenSlides={handleOpenSlides}
              onOpenQuiz={() => setActiveTab('quiz')}
              onOpenChecklist={handleOpenChecklist}
            />
          </div>
        ) : activeTab === 'ward' ? (
          <WardSimulationView
            onOpenConsultation={(patient) => handleOpenAiConsultation(patient)}
            onOpenChecklist={handleOpenChecklist}
          />
        ) : (
          <QuizExamView />
        )}
      </main>

      {/* Footer with Mandatory Copyright Notice */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-slate-300 shadow-sm shrink-0 hidden sm:flex items-center justify-center">
              <img src="/rajawali_logo.png" alt="Logo Rajawali" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                HIPERKES 3D – VIRTUAL HOSPITAL
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Created by: <strong>dr Juwita Ninda Suherman, M.Kes</strong> · Institut Kesehatan Rajawali
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                © 2026 dr Juwita Ninda Suherman, M.Kes. All Rights Reserved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs text-slate-500 font-medium">
            <button onClick={() => setActiveTab('game')} className="hover:text-sky-600 font-semibold text-sky-600">
              🎮 Game 3D
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('ward')} className="hover:text-sky-600">
              🏥 Bangsal 30 Pasien
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={handleOpenHandbook} className="hover:text-sky-600">
              📖 Modul 7 Bab
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={handleOpenSlides} className="hover:text-sky-600">
              📊 30 Slide
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('quiz')} className="hover:text-sky-600">
              📝 30 Soal CBT
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
              setActiveTab('game');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] ${
              activeTab === 'game' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Simulasi 3D</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ward');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] ${
              activeTab === 'ward' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Box className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">30 Pasien</span>
          </button>

          <button
            onClick={handleOpenHandbook}
            className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] text-slate-500 hover:text-sky-600"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Modul</span>
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
            <span className="text-[10px] mt-1 tracking-tight font-medium">30 Soal CBT</span>
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
