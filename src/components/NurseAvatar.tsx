import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';

interface NurseAvatarProps {
  isSpeaking?: boolean;
  statusText?: string;
  onSpeakSample?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showPpeControls?: boolean;
  onTogglePpe?: (item: string) => void;
  equippedPpe?: {
    mask: boolean;
    gloves: boolean;
    goggles: boolean;
    apron: boolean;
  };
  walking?: boolean;
}

export const NurseAvatar: React.FC<NurseAvatarProps> = ({
  isSpeaking = false,
  statusText = 'Siap Membimbing di Bangsal',
  onSpeakSample,
  size = 'md',
  showPpeControls = false,
  onTogglePpe,
  equippedPpe = { mask: false, gloves: false, goggles: false, apron: false },
  walking = false,
}) => {
  const [blink, setBlink] = useState(false);

  // Periodic blinking effect for realistic human animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  const dimensions = {
    sm: { w: 120, h: 140, scale: 0.75 },
    md: { w: 180, h: 220, scale: 1 },
    lg: { w: 240, h: 300, scale: 1.3 },
  }[size];

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className={`relative flex items-center justify-center transition-transform duration-300 ${
          walking ? 'animate-walker' : 'animate-breathe'
        }`}
        style={{ width: dimensions.w, height: dimensions.h }}
      >
        {/* Glow halo behind head */}
        <div className="absolute inset-0 bg-sky-400/15 rounded-full blur-2xl -z-10" />

        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-md overflow-visible"
        >
          <defs>
            {/* Skin tone gradients */}
            <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd8b8" />
              <stop offset="100%" stopColor="#f5c299" />
            </linearGradient>

            {/* Nurse Uniform Gradient */}
            <linearGradient id="uniformGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Hijab / Hair Gradient */}
            <linearGradient id="hijabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Apron Gradient */}
            <linearGradient id="apronGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Body / Shoulders & Torso */}
          <path
            d="M 45 160 Q 100 145 155 160 L 170 240 L 30 240 Z"
            fill="url(#uniformGrad)"
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* Stethoscope */}
          <path
            d="M 68 155 Q 60 190 85 210 Q 100 220 115 210 Q 140 190 132 155"
            fill="none"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="216" r="8" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <circle cx="100" cy="216" r="4" fill="#cbd5e1" />

          {/* Nurse Identity Badge on Chest */}
          <g transform="translate(130, 175)">
            <rect x="0" y="0" width="22" height="30" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="3" y="3" width="16" height="12" rx="2" fill="#0284c7" />
            <line x1="3" y1="18" x2="19" y2="18" stroke="#64748b" strokeWidth="2" />
            <line x1="3" y1="23" x2="14" y2="23" stroke="#94a3b8" strokeWidth="1.5" />
          </g>

          {/* Equipped Apron (Protective Gown) */}
          {equippedPpe.apron && (
            <path
              d="M 60 160 L 140 160 L 155 240 L 45 240 Z"
              fill="url(#apronGrad)"
              stroke="#cbd5e1"
              strokeWidth="2"
              opacity="0.9"
            />
          )}

          {/* Neck */}
          <rect x="88" y="125" width="24" height="24" rx="4" fill="url(#skinTone)" />

          {/* Head & Hijab / Hair */}
          <path
            d="M 52 95 C 48 30 152 30 148 95 C 148 135 130 148 100 148 C 70 148 52 135 52 95 Z"
            fill="url(#hijabGrad)"
          />

          {/* Face Area */}
          <ellipse cx="100" cy="92" rx="34" ry="40" fill="url(#skinTone)" />

          {/* Cheeks blush */}
          <ellipse cx="78" cy="100" rx="6" ry="3.5" fill="#fca5a5" opacity="0.5" />
          <ellipse cx="122" cy="100" rx="6" ry="3.5" fill="#fca5a5" opacity="0.5" />

          {/* Eyebrows */}
          <path
            d="M 72 74 Q 82 70 90 75"
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 128 74 Q 118 70 110 75"
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Eyes with Blinking Animation */}
          {blink ? (
            <>
              <line x1="72" y1="84" x2="88" y2="84" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
              <line x1="112" y1="84" x2="128" y2="84" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="80" cy="83" rx="7" ry="6" fill="#ffffff" />
              <circle cx="80" cy="83" r="4.5" fill="#0f172a" />
              <circle cx="82" cy="81" r="1.5" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="120" cy="83" rx="7" ry="6" fill="#ffffff" />
              <circle cx="120" cy="83" r="4.5" fill="#0f172a" />
              <circle cx="122" cy="81" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Nose */}
          <path
            d="M 98 90 Q 100 96 103 96"
            fill="none"
            stroke="#e0a97c"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Mouth: Speaking animation vs Gentle Smile */}
          {equippedPpe.mask ? (
            /* Surgical / N95 Mask */
            <path
              d="M 68 96 C 66 122 134 122 132 96 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2"
            />
          ) : isSpeaking ? (
            <g className="animate-mouth origin-[100px_110px]">
              <ellipse cx="100" cy="112" rx="7" ry="5" fill="#881337" />
              <path d="M 95 109 Q 100 111 105 109" stroke="#ffffff" strokeWidth="2" fill="none" />
            </g>
          ) : (
            <path
              d="M 92 110 Q 100 118 108 110"
              fill="none"
              stroke="#991b1b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Goggles / Eye Protection */}
          {equippedPpe.goggles && (
            <g opacity="0.95">
              <path
                d="M 64 74 Q 100 70 136 74 L 138 94 Q 100 102 62 94 Z"
                fill="#38bdf8"
                fillOpacity="0.35"
                stroke="#0284c7"
                strokeWidth="3"
                rx="6"
              />
              <line x1="58" y1="80" x2="65" y2="80" stroke="#0284c7" strokeWidth="3" />
              <line x1="135" y1="80" x2="142" y2="80" stroke="#0284c7" strokeWidth="3" />
            </g>
          )}

          {/* Nurse Cap with Red Cross */}
          <g transform="translate(68, 22)">
            <path
              d="M 0 25 Q 32 0 64 25 L 56 38 Q 32 30 8 38 Z"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            {/* Small red cross */}
            <path d="M 32 16 L 32 28 M 26 22 L 38 22" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Arms & Hands (With optional gloves) */}
          <g>
            {/* Left Hand */}
            <circle
              cx="40"
              cy="210"
              r="12"
              fill={equippedPpe.gloves ? '#38bdf8' : 'url(#skinTone)'}
              stroke={equippedPpe.gloves ? '#0284c7' : '#e0a97c'}
              strokeWidth="1.5"
            />
            {/* Right Hand Holding Clipboard */}
            <circle
              cx="160"
              cy="210"
              r="12"
              fill={equippedPpe.gloves ? '#38bdf8' : 'url(#skinTone)'}
              stroke={equippedPpe.gloves ? '#0284c7' : '#e0a97c'}
              strokeWidth="1.5"
            />
            {/* Medical Clipboard in Hand */}
            <rect x="148" y="195" width="24" height="32" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            <rect x="154" y="191" width="12" height="5" rx="1.5" fill="#334155" />
            <line x1="152" y1="205" x2="168" y2="205" stroke="#0284c7" strokeWidth="1.5" />
            <line x1="152" y1="211" x2="166" y2="211" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="152" y1="217" x2="163" y2="217" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Floating Voice Soundwaves when speaking */}
        {isSpeaking && (
          <div className="absolute -top-3 right-0 bg-white/95 dark:bg-slate-900/95 border border-sky-300 dark:border-sky-700 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-1" />
            <span className="w-1 bg-sky-600 rounded-full animate-voice-bar-2" />
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-3" />
            <span className="w-1 bg-sky-600 rounded-full animate-voice-bar-4" />
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-5" />
            <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 ml-1">Bicara...</span>
          </div>
        )}
      </div>

      {/* Character Identity & Status Badge */}
      <div className="text-center mt-2">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Ns. Juwita, Sp.K3RS
          </h3>
          <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">AI Mentor</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[210px] truncate mt-0.5">
          {statusText}
        </p>
      </div>

      {/* Interactive PPE Controls (Hierarki APD Demonstration) */}
      {showPpeControls && onTogglePpe && (
        <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 w-full max-w-[260px]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              Kelengkapan APD Perawat:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => onTogglePpe('mask')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                equippedPpe.mask
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.mask ? '✓ Masker N95' : '+ Masker N95'}
            </button>
            <button
              onClick={() => onTogglePpe('gloves')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                equippedPpe.gloves
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.gloves ? '✓ Handscoon' : '+ Handscoon'}
            </button>
            <button
              onClick={() => onTogglePpe('goggles')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                equippedPpe.goggles
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.goggles ? '✓ Goggle / Shield' : '+ Goggle / Shield'}
            </button>
            <button
              onClick={() => onTogglePpe('apron')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                equippedPpe.apron
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.apron ? '✓ Gaun Apron' : '+ Gaun Apron'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
