import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Sparkles, Stethoscope, UserCheck } from 'lucide-react';

interface DoctorAvatarProps {
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

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  isSpeaking = false,
  statusText = 'Dosen & Dokter Spesialis HIPERKES',
  onSpeakSample,
  size = 'md',
  showPpeControls = false,
  onTogglePpe,
  equippedPpe = { mask: false, gloves: false, goggles: false, apron: false },
  walking = false,
}) => {
  const [blink, setBlink] = useState(false);

  // Periodic blinking effect for realistic animation
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
        <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-2xl -z-10" />

        {/* 3D Roblox Blocky Style Vector Avatar */}
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-md overflow-visible"
        >
          <defs>
            {/* Skin tone gradients */}
            <linearGradient id="docSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd8b8" />
              <stop offset="100%" stopColor="#f5c299" />
            </linearGradient>

            {/* Doctor White Coat (Sneli Dokter) */}
            <linearGradient id="sneliGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Hijab / Inner Hair Gradient */}
            <linearGradient id="docHijab" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Inner scrubs shirt */}
            <linearGradient id="scrubsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Roblox Blocky Torso: White Doctor Coat (Jas Sneli) with Inner Scrubs */}
          {/* Inner blue scrubs shirt */}
          <rect x="75" y="145" width="50" height="95" fill="url(#scrubsGrad)" rx="2" />

          {/* Doctor Coat Left Flap */}
          <path
            d="M 45 150 L 80 150 L 78 240 L 40 240 Z"
            fill="url(#sneliGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Doctor Coat Right Flap */}
          <path
            d="M 120 150 L 155 150 L 160 240 L 122 240 Z"
            fill="url(#sneliGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Sneli Lapel / Kerah Jas Dokter */}
          <polygon points="75,145 92,175 72,175" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <polygon points="125,145 108,175 128,175" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

          {/* Stethoscope around neck */}
          <path
            d="M 68 152 Q 62 188 88 208 Q 100 216 112 208 Q 138 188 132 152"
            fill="none"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Stethoscope Chest Piece / Diafragma */}
          <circle cx="100" cy="214" r="8" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <circle cx="100" cy="214" r="4" fill="#f1f5f9" />

          {/* Doctor Name Tag Badge "dr. Juwita Ninda" */}
          <g transform="translate(125, 175)">
            <rect x="0" y="0" width="30" height="18" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
            <rect x="2" y="2" width="26" height="5" rx="1" fill="#0284c7" />
            <line x1="3" y1="10" x2="27" y2="10" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="3" y1="14" x2="20" y2="14" stroke="#64748b" strokeWidth="1.2" />
          </g>

          {/* Equipped Apron (Protective Gown if enabled) */}
          {equippedPpe.apron && (
            <path
              d="M 55 150 L 145 150 L 155 240 L 45 240 Z"
              fill="#f8fafc"
              stroke="#0284c7"
              strokeWidth="2"
              opacity="0.88"
            />
          )}

          {/* Neck */}
          <rect x="88" y="125" width="24" height="25" rx="2" fill="url(#docSkin)" />

          {/* Roblox Blocky Head with Hijab / Hair */}
          <rect
            x="54"
            y="45"
            width="92"
            height="90"
            rx="12"
            fill="url(#docHijab)"
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* Face Area (Roblox blocky face) */}
          <rect
            x="64"
            y="60"
            width="72"
            height="65"
            rx="8"
            fill="url(#docSkin)"
          />

          {/* Friendly Rosy Cheeks */}
          <ellipse cx="76" cy="100" rx="6" ry="4" fill="#fca5a5" opacity="0.6" />
          <ellipse cx="124" cy="100" rx="6" ry="4" fill="#fca5a5" opacity="0.6" />

          {/* Eyebrows */}
          <path
            d="M 72 74 Q 82 70 90 74"
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 128 74 Q 118 70 110 74"
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Eyes (Roblox blocky friendly eye expression) */}
          {blink ? (
            <>
              <line x1="72" y1="84" x2="88" y2="84" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <line x1="112" y1="84" x2="128" y2="84" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <rect x="73" y="78" width="14" height="13" rx="3" fill="#ffffff" />
              <rect x="76" y="80" width="8" height="9" rx="2" fill="#0f172a" />
              <circle cx="78" cy="82" r="1.5" fill="#ffffff" />

              {/* Right Eye */}
              <rect x="113" y="78" width="14" height="13" rx="3" fill="#ffffff" />
              <rect x="116" y="80" width="8" height="9" rx="2" fill="#0f172a" />
              <circle cx="118" cy="82" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Nose */}
          <path
            d="M 98 90 Q 100 95 103 95"
            fill="none"
            stroke="#e0a97c"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Mouth: Speaking animation vs Warm Smile */}
          {equippedPpe.mask ? (
            /* Surgical / N95 Mask */
            <rect
              x="68"
              y="94"
              width="64"
              height="30"
              rx="6"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2"
            />
          ) : isSpeaking ? (
            <g className="animate-mouth origin-[100px_108px]">
              <ellipse cx="100" cy="110" rx="8" ry="6" fill="#881337" />
              <path d="M 94 107 Q 100 109 106 107" stroke="#ffffff" strokeWidth="2" fill="none" />
            </g>
          ) : (
            <path
              d="M 92 108 Q 100 116 108 108"
              fill="none"
              stroke="#991b1b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Goggles / Eye Protection if equipped */}
          {equippedPpe.goggles && (
            <g opacity="0.95">
              <rect
                x="62"
                y="72"
                width="76"
                height="24"
                rx="5"
                fill="#38bdf8"
                fillOpacity="0.4"
                stroke="#0284c7"
                strokeWidth="2.5"
              />
              <line x1="56" y1="80" x2="62" y2="80" stroke="#0284c7" strokeWidth="2.5" />
              <line x1="138" y1="80" x2="144" y2="80" stroke="#0284c7" strokeWidth="2.5" />
            </g>
          )}

          {/* Doctor Visor / Headgear with Medical Emblem */}
          <g transform="translate(62, 36)">
            <rect x="0" y="0" width="76" height="16" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="38" cy="8" r="6" fill="#0284c7" />
            <path d="M 38 4 L 38 12 M 34 8 L 42 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Roblox Arms: Blocky Arms */}
          <g>
            {/* Left Arm (holding medical clipboard) */}
            <rect
              x="22"
              y="152"
              width="24"
              height="60"
              rx="4"
              fill="url(#sneliGrad)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <rect
              x="24"
              y="204"
              width="20"
              height="16"
              rx="3"
              fill={equippedPpe.gloves ? '#38bdf8' : 'url(#docSkin)'}
            />

            {/* Right Arm */}
            <rect
              x="154"
              y="152"
              width="24"
              height="60"
              rx="4"
              fill="url(#sneliGrad)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <rect
              x="156"
              y="204"
              width="20"
              height="16"
              rx="3"
              fill={equippedPpe.gloves ? '#38bdf8' : 'url(#docSkin)'}
            />

            {/* Medical Assessment Tablet in Hand */}
            <rect x="18" y="196" width="28" height="36" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="22" y="200" width="20" height="28" rx="1.5" fill="#f8fafc" />
            <line x1="24" y1="206" x2="38" y2="206" stroke="#0284c7" strokeWidth="1.5" />
            <line x1="24" y1="211" x2="36" y2="211" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="24" y1="216" x2="34" y2="216" stroke="#94a3b8" strokeWidth="1.2" />
          </g>
        </svg>

        {/* Floating Voice Soundwaves when speaking */}
        {isSpeaking && (
          <div className="absolute -top-3 right-0 bg-white/95 dark:bg-slate-900/95 border border-sky-400 dark:border-sky-600 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-1" />
            <span className="w-1 bg-sky-600 rounded-full animate-voice-bar-2" />
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-3" />
            <span className="w-1 bg-sky-600 rounded-full animate-voice-bar-4" />
            <span className="w-1 bg-sky-500 rounded-full animate-voice-bar-5" />
            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 ml-1">Dokter Bicara...</span>
          </div>
        )}
      </div>

      {/* Character Identity & Status Badge */}
      <div className="text-center mt-2">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            dr. Juwita Ninda, M.Kes
          </h3>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
            Dosen Pembimbing
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] truncate mt-0.5 font-medium">
          {statusText}
        </p>
      </div>

      {/* Interactive PPE Controls (Simulasi APD K3) */}
      {showPpeControls && onTogglePpe && (
        <div className="mt-3 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-full max-w-[270px]">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              Kelengkapan APD Dokter:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => onTogglePpe('mask')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                equippedPpe.mask
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.mask ? '✓ Masker N95' : '+ Masker N95'}
            </button>
            <button
              onClick={() => onTogglePpe('gloves')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                equippedPpe.gloves
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.gloves ? '✓ Handscoon' : '+ Handscoon'}
            </button>
            <button
              onClick={() => onTogglePpe('goggles')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                equippedPpe.goggles
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {equippedPpe.goggles ? '✓ Kacamata Pelindung' : '+ Kacamata'}
            </button>
            <button
              onClick={() => onTogglePpe('apron')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
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
