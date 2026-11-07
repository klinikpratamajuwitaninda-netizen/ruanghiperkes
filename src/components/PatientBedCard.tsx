import React, { useState } from 'react';
import {
  Patient,
  PatientAction,
} from '../data/patientsData';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Activity,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  speakIndonesian,
  stopSpeaking,
  playHospitalSound,
  triggerHaptic,
} from '../utils/speechUtils';

interface PatientBedCardProps {
  patient: Patient;
  onOpenConsultation: (patient: Patient) => void;
  onScoreEarned?: (points: number) => void;
  isActiveBed?: boolean;
}

export const PatientBedCard: React.FC<PatientBedCardProps> = ({
  patient,
  onOpenConsultation,
  onScoreEarned,
  isActiveBed = false,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<PatientAction | null>(null);
  const [isResolved, setIsResolved] = useState(patient.status === 'Aman Terkendali');

  const handleSpeakPatientVoice = () => {
    triggerHaptic('light');
    if (isPlayingVoice) {
      stopSpeaking();
      setIsPlayingVoice(false);
      return;
    }

    playHospitalSound('beep');
    setIsPlayingVoice(true);
    speakIndonesian(patient.patientVoicePrompt, {
      pitch: patient.patientVoicePitch,
      rate: patient.patientVoiceRate,
      onStart: () => setIsPlayingVoice(true),
      onEnd: () => setIsPlayingVoice(false),
      onError: () => setIsPlayingVoice(false),
    });
  };

  const handleSelectAction = (action: PatientAction) => {
    setSelectedActionId(action.id);
    setActionFeedback(action);

    if (action.isCorrect) {
      playHospitalSound('success');
      triggerHaptic('medium');
      setIsResolved(true);
      onScoreEarned?.(action.points);
    } else {
      playHospitalSound('warning');
      triggerHaptic('error');
    }
  };

  const getHazardBadgeClass = (hazard: string) => {
    switch (hazard) {
      case 'Biologis':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
      case 'Kimia':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
      case 'Fisik':
        return 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
      case 'Ergonomi':
        return 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900';
      case 'Psikososial':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between ${
        isActiveBed
          ? 'ring-2 ring-sky-500 bg-white dark:bg-slate-900 shadow-md border-sky-300 dark:border-sky-700'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        {/* Top Header: Bed & Room, Hazard Category */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {patient.bedNumber}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {patient.room} · {patient.unit}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {patient.name} <span className="text-sm font-normal text-slate-500">({patient.age} th / {patient.gender === 'L' ? 'Pria' : 'Wanita'})</span>
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${getHazardBadgeClass(
                patient.hazardType
              )}`}
            >
              Bahaya {patient.hazardType}
            </span>
            <span
              className={`text-[11px] font-medium ${
                isResolved
                  ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1'
                  : 'text-amber-600 dark:text-amber-400 flex items-center gap-1'
              }`}
            >
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Aman Terkendali
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  Perlu Intervensi K3
                </>
              )}
            </span>
          </div>
        </div>

        {/* Diagnosis & SKP Target */}
        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p>
            <strong className="text-slate-900 dark:text-slate-200">Diagnosis:</strong> {patient.diagnosis}
          </p>
          <p className="text-sky-700 dark:text-sky-400 font-medium">
            🎯 {patient.skpCategory}
          </p>
        </div>

        {/* Bedside Vitals Strip */}
        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 my-3 text-[11px] font-mono border border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-sans">TD (mmHg)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{patient.vitalSigns.bp}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Nadi (x/m)</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-0.5">
              <Heart className="w-2.5 h-2.5 fill-rose-500 animate-pulse" />
              {patient.vitalSigns.hr}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-sans">RR (x/m)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{patient.vitalSigns.rr}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-sans">SpO2 (%)</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{patient.vitalSigns.spo2}%</span>
          </div>
        </div>

        {/* Dilemma / Environmental Hazard Description */}
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Kondisi Bahaya K3 & Keselamatan Pasien:</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {patient.nurseSafetyDilemma}
          </p>
        </div>

        {/* Spoken Voice Section */}
        <div className="mt-3 p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 min-w-0">
            <button
              onClick={handleSpeakPatientVoice}
              className={`p-2 rounded-lg transition-transform active:scale-95 flex items-center justify-center ${
                isPlayingVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
              }`}
              title={isPlayingVoice ? 'Hentikan Suara' : 'Dengarkan Suara Pasien'}
            >
              {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="truncate">
              <span className="text-[11px] font-semibold text-sky-900 dark:text-sky-300 block">
                {isPlayingVoice ? 'Pasien Sedang Berbicara...' : 'Suara Keluhan Pasien:'}
              </span>
              <p className="italic text-slate-600 dark:text-slate-400 truncate text-[11px]">
                "{patient.patientVoicePrompt}"
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Nursing Interventions */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Pilih Tindakan Keperawatan K3RS & SKP:
          </p>
          <div className="space-y-1.5">
            {patient.actions.map((act) => {
              const isSelected = selectedActionId === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => handleSelectAction(act)}
                  className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all flex items-start gap-2 ${
                    isSelected
                      ? act.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`shrink-0 w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? act.isCorrect
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-rose-500 bg-rose-500 text-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {isSelected ? (act.isCorrect ? '✓' : '✗') : ''}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium block leading-tight">{act.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Hierarki: {act.hierarchy}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback display */}
        {actionFeedback && (
          <div
            className={`mt-2.5 p-2.5 rounded-xl text-xs border ${
              actionFeedback.isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1 font-semibold mb-0.5">
              {actionFeedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tindakan Tepat (+{actionFeedback.points} Poin)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tindakan Berisiko / Tidak Aman</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed">{actionFeedback.feedback}</p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenConsultation(patient)}
          className="text-xs font-medium text-sky-700 dark:text-sky-300 hover:text-sky-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Interaksi Pasien & AI</span>
        </button>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Ref Soal #{patient.linkedQuestionId}
        </span>
      </div>
    </div>
  );
};
