import React, { useState } from 'react';
import { HANDBOOK_CHAPTERS, HandbookChapter } from '../data/moduleSlideData';
import {
  X,
  BookOpen,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  Search,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { playHospitalSound, triggerHaptic } from '../utils/speechUtils';

interface HandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandbookModal: React.FC<HandbookModalProps> = ({ isOpen, onClose }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('bab-1');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentChapter =
    HANDBOOK_CHAPTERS.find((c) => c.id === selectedChapterId) || HANDBOOK_CHAPTERS[0];

  const filteredChapters = HANDBOOK_CHAPTERS.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.sections.some(
        (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] max-h-[780px] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-2xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Buku Modul HIPERKES untuk Meningkatkan Keselamatan Pasien
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyusun: dr. Juwita Ninda Suherman, M.Kes · Institut Kesehatan Rajawali
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Chapters Navigation */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 flex flex-col gap-3 overflow-y-auto max-h-[35vh] md:max-h-full shrink-0">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari materi modul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              {filteredChapters.map((ch) => {
                const isActive = ch.id === selectedChapterId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      triggerHaptic('light');
                      playHospitalSound('click');
                      setSelectedChapterId(ch.id);
                    }}
                    className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        isActive
                          ? 'bg-sky-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ch.number}
                    </span>
                    <span className="flex-1 leading-snug">{ch.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Checklist Shortcut */}
            <div className="p-3 rounded-2xl bg-sky-100/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-sky-900 dark:text-sky-300 mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Checklist Bab VII:</span>
              </div>
              <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                7 poin verifikasi wajib dilakukan sebelum perawat menyentuh pasien di lahan praktik.
              </p>
            </div>
          </div>

          {/* Right Column: Selected Chapter Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 bg-white dark:bg-slate-900">
            <div>
              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest block">
                {currentChapter.number}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {currentChapter.title}
              </h1>
            </div>

            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              {currentChapter.sections.map((sec, idx) => (
                <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {sec.title}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {sec.content}
                  </p>

                  {sec.highlights && sec.highlights.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {sec.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Academic Notes */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <p>
                <strong>Catatan Akademik:</strong> Pelaksanaan tindakan klinis tetap harus mengacu pada SOP K3RS, Kebijakan Pencegahan & Pengendalian Infeksi (PPI), dan arahan pembimbing klinik di masing-masing fasilitas rumah sakit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
