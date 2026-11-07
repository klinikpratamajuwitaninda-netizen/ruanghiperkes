import React, { useState } from 'react';
import { SLIDES_DATA, SlideItem } from '../data/moduleSlideData';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  BookOpen,
  LayoutGrid,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { speakIndonesian, stopSpeaking, playHospitalSound, triggerHaptic } from '../utils/speechUtils';

interface SlideViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlideViewerModal: React.FC<SlideViewerModalProps> = ({ isOpen, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  if (!isOpen) return null;

  const currentSlide: SlideItem = SLIDES_DATA[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < SLIDES_DATA.length - 1) {
      triggerHaptic('light');
      playHospitalSound('click');
      stopSpeaking();
      setIsSpeaking(false);
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      triggerHaptic('light');
      playHospitalSound('click');
      stopSpeaking();
      setIsSpeaking(false);
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleSpeakSlide = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    triggerHaptic('medium');
    playHospitalSound('beep');
    const speechText = `Slide ${currentSlide.slideNumber}. ${currentSlide.title}. ${currentSlide.bullets.join('. ')}. ${currentSlide.callout || ''}`;

    setIsSpeaking(true);
    speakIndonesian(speechText, {
      pitch: 1.05,
      rate: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] max-h-[760px] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Materi 30 Slide HIPERKES & Keselamatan Pasien
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                dr. Juwita Ninda Suherman, M.Kes · Institut Kesehatan Rajawali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGridView(!isGridView)}
              className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isGridView
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              title="Tampilan Grid Semua Slide"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Semua Slide (30)</span>
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Content Area */}
        {isGridView ? (
          /* 30 Slides Grid Overview */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950">
            {SLIDES_DATA.map((slide, idx) => (
              <button
                key={slide.slideNumber}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setIsGridView(false);
                }}
                className={`p-3 rounded-2xl text-left border flex flex-col justify-between transition-all hover:scale-[1.02] aspect-[16/10] ${
                  idx === currentSlideIndex
                    ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 block">
                    SLIDE {slide.slideNumber} / 30
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5">
                    {slide.title}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  {slide.category}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Single Slide Presentation Canvas */
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col justify-between bg-slate-900 text-white relative">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Category tag & Slide indicator */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <span className="text-xs tracking-wider uppercase font-semibold text-sky-400">
                  {currentSlide.category}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Slide {currentSlide.slideNumber} / 30
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {currentSlide.title}
              </h1>
              {currentSlide.subtitle && (
                <p className="text-sm sm:text-base text-sky-300 mt-1 font-medium">
                  {currentSlide.subtitle}
                </p>
              )}

              {/* Bullets List */}
              <div className="mt-6 space-y-3">
                {currentSlide.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {/* Callout Box */}
              {currentSlide.callout && (
                <div className="mt-6 p-4 rounded-2xl bg-sky-950/60 border border-sky-800/80 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-sky-200 font-medium leading-relaxed">
                    {currentSlide.callout}
                  </p>
                </div>
              )}
            </div>

            {/* Slide Footer Notes */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="italic truncate max-w-[70%]">
                Relevansi Klinis: {currentSlide.clinicalRelevance}
              </span>

              <button
                onClick={handleSpeakSlide}
                className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors ${
                  isSpeaking
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-300'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Hentikan' : 'Bacakan Slide'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Slide Bottom Navigation Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-700 dark:text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {/* Progress dots on larger viewports or slider */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              {currentSlideIndex + 1} / {SLIDES_DATA.length}
            </span>
            <div className="w-24 sm:w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{ width: `${((currentSlideIndex + 1) / SLIDES_DATA.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlideIndex === SLIDES_DATA.length - 1}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
