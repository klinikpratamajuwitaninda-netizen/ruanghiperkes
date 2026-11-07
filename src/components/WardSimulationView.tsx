import React, { useState } from 'react';
import { Patient, PATIENTS_DATA } from '../data/patientsData';
import { PatientBedCard } from './PatientBedCard';
import { DoctorAvatar } from './DoctorAvatar';
import { RobloxWorld3D } from './RobloxWorld3D';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Users,
  Activity,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Box,
  LayoutGrid,
  Stethoscope,
} from 'lucide-react';
import { triggerHaptic, playHospitalSound } from '../utils/speechUtils';

interface WardSimulationViewProps {
  onOpenConsultation: (patient?: Patient) => void;
  onOpenChecklist: () => void;
}

export const WardSimulationView: React.FC<WardSimulationViewProps> = ({
  onOpenConsultation,
  onOpenChecklist,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [resolvedPatients, setResolvedPatients] = useState<number[]>([]);
  const [activeBedId, setActiveBedId] = useState<number>(1);
  const [equippedPpe, setEquippedPpe] = useState({
    mask: false,
    gloves: false,
    goggles: false,
    apron: false,
  });

  const handleTogglePpe = (item: string) => {
    triggerHaptic('light');
    playHospitalSound('click');
    setEquippedPpe((prev: any) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleScoreEarned = (points: number, patientId: number) => {
    setTotalScore((prev) => prev + points);
    if (!resolvedPatients.includes(patientId)) {
      setResolvedPatients((prev) => [...prev, patientId]);
    }
  };

  // Units list for tabs
  const units = [
    { id: 'all', label: 'Semua 30 Pasien' },
    { id: 'Rawat Inap Bedah', label: 'Bangsal Dahlia' },
    { id: 'Instalasi Gawat Darurat', label: 'IGD & Triase' },
    { id: 'Ruang Isolasi Infeksius', label: 'Ruang Isolasi Airborne' },
    { id: 'Intensive Care Unit (ICU)', label: 'ICU & Kritis' },
    { id: 'Unit Hemodialisa', label: 'Hemodialisa' },
    { id: 'Penunjang', label: 'Unit Penunjang K3RS' },
  ];

  const hazards = ['all', 'Biologis', 'Kimia', 'Fisik', 'Ergonomi', 'Psikososial'];

  const filteredPatients = PATIENTS_DATA.filter((p) => {
    if (selectedUnit !== 'all') {
      if (selectedUnit === 'Penunjang') {
        if (
          ![
            'Unit Hemodialisa',
            'Instalasi Bedah Sentral',
            'Central Sterile Supply Department (CSSD)',
            'Instalasi Anestesi & Terapi Intensif',
            'Unit Rawat Jalan Onkologi',
            'Poliklinik Kesehatan Kerja & Vaksinasi',
          ].includes(p.unit)
        ) {
          return false;
        }
      } else if (!p.unit.includes(selectedUnit)) {
        return false;
      }
    }

    if (selectedHazard !== 'all' && p.hazardType !== selectedHazard) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.bedNumber.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q) ||
        p.hazardType.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher Bar (3D Roblox Mode vs 30 Kartu Pasien Grid) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              Ruang Belajar HIPERKES 3D Roblox
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bimbingan Klinis bersama dr. Juwita Ninda, M.Kes · Mahasiswa Keperawatan
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs w-full sm:w-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('3d');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === '3d'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Eksplorasi 3D Roblox</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('grid');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Daftar 30 Pasien</span>
          </button>
        </div>
      </div>

      {/* Conditionally Render 3D Roblox World or Patient Grid */}
      {viewMode === '3d' ? (
        <RobloxWorld3D
          onSelectPatient={(p) => setActiveBedId(p.id)}
          onOpenConsultation={onOpenConsultation}
          onOpenChecklist={onOpenChecklist}
        />
      ) : (
        /* Top Hero Strip with Doctor Avatar */
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left Info: Ward summary & metrics */}
            <div className="space-y-3 text-center lg:text-left max-w-xl">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold tracking-wider uppercase text-sky-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Materi Mahasiswa Keperawatan · Institut Kesehatan Rajawali</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Ruang Belajar HIPERKES & 30 Pasien Rumah Sakit
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Pelajari 30 skenario kasus pasien bersama <strong>dr. Juwita Ninda, M.Kes</strong>. Identifikasi 5 bahaya kerja di rumah sakit, lakukan praktik pencegahan, dan raih poin kompetensi K3RS!
              </p>

              {/* Score & Progress Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 text-xs">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Poin K3 Anda: <strong className="font-mono text-sm text-amber-300">{totalScore}</strong></span>
                </div>

                <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Pasien Aman: <strong className="font-mono text-sm text-emerald-300">{resolvedPatients.length}</strong> / 30</span>
                </div>

                <button
                  onClick={onOpenChecklist}
                  className="px-3.5 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Checklist 7 Langkah</span>
                </button>
              </div>
            </div>

            {/* Right: Doctor Avatar of dr. Juwita Ninda, M.Kes */}
            <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center">
              <DoctorAvatar
                size="md"
                isSpeaking={false}
                statusText="Dosen Pengampu HIPERKES & K3RS"
                showPpeControls={true}
                onTogglePpe={handleTogglePpe}
                equippedPpe={equippedPpe}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Patients List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Unit Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {units.map((u) => {
            const isActive = selectedUnit === u.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedUnit(u.id);
                }}
                className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {u.label}
              </button>
            );
          })}
        </div>

        {/* Hazard Category Filters & Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <span className="text-slate-400 font-medium shrink-0">Bahaya:</span>
            {hazards.map((h) => {
              const isActive = selectedHazard === h;
              return (
                <button
                  key={h}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedHazard(h);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {h === 'all' ? 'Semua Bahaya' : h}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari pasien / bed / diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Patients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => setActiveBedId(patient.id)}
            className="cursor-pointer"
          >
            <PatientBedCard
              patient={patient}
              onOpenConsultation={onOpenConsultation}
              onScoreEarned={(pts) => handleScoreEarned(pts, patient.id)}
              isActiveBed={activeBedId === patient.id}
            />
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <p className="text-sm font-medium">Tidak ada pasien yang sesuai dengan filter pencarian.</p>
          <button
            onClick={() => {
              setSelectedUnit('all');
              setSelectedHazard('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
};
