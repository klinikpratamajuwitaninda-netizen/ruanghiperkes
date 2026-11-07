import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { playHospitalSound, triggerHaptic } from '../utils/speechUtils';

interface SafetyChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHECKLIST_ITEMS = [
  {
    id: 'c1',
    step: '1. Verifikasi Identitas Pasien (SKP 1)',
    question: 'Apakah identitas pasien dan tujuan tindakan telah dipastikan sesuai prosedur (minimal 2 identifier: nama lengkap & tanggal lahir pada gelang)?',
    detail: 'Dilarang menggunakan nomor kamar atau tempat tidur sebagai pengenal pasien.',
  },
  {
    id: 'c2',
    step: '2. Asesmen Kondisi & Bantuan (Ergonomi & SKP 6)',
    question: 'Apakah kondisi fisik, risiko jatuh, dan kebutuhan bantuan alat/tim telah dinilai?',
    detail: 'Jika pasien berat > 35 kg atau tidak kooperatif, wajib gunakan slide sheet dan bantuan tim perawat.',
  },
  {
    id: 'c3',
    step: '3. Kelaikan Alat Medis (Keselamatan Kerja Fisik)',
    question: 'Apakah alat medis yang digunakan laik pakai, terkalibrasi, dan kabel listrik tidak terkelupas?',
    detail: 'Hentikan penggunaan alat dengan kabel serabut terbuka dan laporkan segera ke IPSRS.',
  },
  {
    id: 'c4',
    step: '4. Pelabelan Bahan Kimia & Obat (K3 Kimia & SKP 3)',
    question: 'Apakah bahan kimia disinfektan atau obat memiliki label identitas, tanggal kedaluwarsa, dan piktogram jelas?',
    detail: 'Dilarang keras menyimpan bahan pembersih atau antiseptik dalam botol air mineral tanpa label.',
  },
  {
    id: 'c5',
    step: '5. Kesiapan APD & Benda Tajam (K3 Biologis & PPI)',
    question: 'Apakah APD sesuai pajanan dan safety box benda tajam tersedia langsung di dekat titik tindakan?',
    detail: 'Dilarang menutup kembali jarum suntik (no recapping) dan ganti wadah jika sudah 3/4 penuh.',
  },
  {
    id: 'c6',
    step: '6. Keamanan Lingkungan Kerja (Higiene Perusahaan)',
    question: 'Apakah area kerja aman, penerangan cukup, jalur evakuasi bebas rintangan, dan lantai kering?',
    detail: 'Jika ada ceceran cairan infus atau air kamar mandi, amankan dan pasang rambu peringatan seketika.',
  },
  {
    id: 'c7',
    step: '7. Batas Kewenangan Klinis (Etika & Regulasi)',
    question: 'Apakah mahasiswa memahami instruksi tindakan dan berada dalam batas kewenangan yang disupervisi pembimbing klinik?',
    detail: 'Konfirmasi kepada pembimbing klinik bila ragu atau belum kompeten melakukan tindakan mandiri.',
  },
];

export const SafetyChecklistModal: React.FC<SafetyChecklistModalProps> = ({ isOpen, onClose }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    triggerHaptic('light');
    playHospitalSound('click');
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allChecked = CHECKLIST_ITEMS.every((item) => next[item.id]);
      if (allChecked) {
        playHospitalSound('success');
      }
      return next;
    });
  };

  const handleReset = () => {
    triggerHaptic('medium');
    setCheckedItems({});
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const isAllComplete = checkedCount === CHECKLIST_ITEMS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Checklist 7 Langkah Keselamatan Sebelum Tindakan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standar Praktik Aman Keperawatan · Bab VII Modul HIPERKES
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

        {/* Progress Strip */}
        <div className="bg-sky-50 dark:bg-sky-950/30 px-5 py-2.5 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs">
          <span className="font-medium text-sky-900 dark:text-sky-200">
            Kesiapan Keselamatan: <strong>{checkedCount}</strong> dari {CHECKLIST_ITEMS.length} Langkah
          </span>
          <div className="w-28 h-2 bg-sky-200 dark:bg-sky-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                  isChecked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.step}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                    {item.question}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Catatan Klinis: {item.detail}
                  </p>
                </div>
              </div>
            );
          })}

          {isAllComplete && (
            <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold">Semua Protokol Keselamatan Terpenuhi!</strong>
                <span>Anda siap memulai tindakan keperawatan dengan aman dan terlindungi.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Checklist
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
          >
            Tutup & Lanjutkan Praktik
          </button>
        </div>
      </div>
    </div>
  );
};
