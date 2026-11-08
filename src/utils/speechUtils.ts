/**
 * Natural Speech Synthesis and Audio System for Indonesian Virtual Hospital
 * Supports Android autoplay unlocking, multi-speaker sequential queues, and voice recognition
 */

// Web Audio Context for medical sounds and tones
let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Explicit user-gesture audio unlocker for Android Chrome and mobile browsers
 * Satisfies strict mobile autoplay policies
 */
export async function unlockAudioSystem(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Play ultra-short silent buffer to unlock Web Audio pipeline
    if (ctx) {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    // Warm up speech synthesis if available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const warmUtterance = new SpeechSynthesisUtterance('');
      warmUtterance.volume = 0;
      window.speechSynthesis.speak(warmUtterance);
    }

    isAudioUnlocked = true;
    return true;
  } catch (err) {
    console.warn('Audio unlock warning:', err);
    return false;
  }
}

export function isAudioSystemUnlocked(): boolean {
  return isAudioUnlocked;
}

/**
 * Play authentic medical chimes and hospital acoustic indicators using Web Audio API
 */
export function playHospitalSound(type: 'beep' | 'alarm' | 'success' | 'warning' | 'click' | 'oxygen') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'beep') {
      // Vital sign monitor periodic blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'alarm') {
      // Emergency hazard double beep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === 'success') {
      // Pleasant two-tone confirmation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'warning') {
      // Warning buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Trigger Android haptic vibration feedback if supported
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'error') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(15);
      } else if (type === 'medium') {
        navigator.vibrate(35);
      } else if (type === 'heavy') {
        navigator.vibrate([40, 30, 40]);
      } else if (type === 'error') {
        navigator.vibrate([60, 40, 80]);
      }
    } catch {
      // Vibration not permitted or supported
    }
  }
}

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface QueuedSpeechItem {
  id: string;
  speakerName?: string;
  text: string;
  options?: SpeakOptions;
}

let speechQueue: QueuedSpeechItem[] = [];
let isQueuePlaying = false;
let activeUtterance: SpeechSynthesisUtterance | null = null;

function findIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.toLowerCase().includes('id-id') ||
        v.lang.toLowerCase().includes('id_id') ||
        v.lang.toLowerCase() === 'id' ||
        v.name.toLowerCase().includes('indonesia')
    ) || null
  );
}

/**
 * Speaks text using the best matching Indonesian voice from the browser's speech synthesis engine
 */
export function speakIndonesian(text: string, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onEnd?.();
    return;
  }

  // Cancel existing single utterance
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.pitch = options.pitch ?? 1.0;
  utterance.rate = options.rate ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  const indonesianVoice = findIndonesianVoice();
  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    activeUtterance = null;
    options.onError?.(e);
    options.onEnd?.();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Queue multiple speeches sequentially (e.g. for multi-character interactions)
 * Tn. Hartono speaks first -> Ibu Hartono speaks second -> dr. Juwita speaks third
 */
export function queueMultiSpeakerSpeech(
  items: QueuedSpeechItem[],
  onQueueComplete?: () => void
) {
  stopSpeaking();
  speechQueue = [...items];
  playNextInQueue(onQueueComplete);
}

function playNextInQueue(onQueueComplete?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onQueueComplete?.();
    return;
  }

  if (speechQueue.length === 0) {
    isQueuePlaying = false;
    onQueueComplete?.();
    return;
  }

  isQueuePlaying = true;
  const item = speechQueue.shift();
  if (!item) {
    isQueuePlaying = false;
    onQueueComplete?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.lang = 'id-ID';
  utterance.pitch = item.options?.pitch ?? 1.0;
  utterance.rate = item.options?.rate ?? 1.0;
  utterance.volume = item.options?.volume ?? 1.0;

  const indonesianVoice = findIndonesianVoice();
  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }

  utterance.onstart = () => {
    item.options?.onStart?.();
  };

  utterance.onend = () => {
    item.options?.onEnd?.();
    playNextInQueue(onQueueComplete);
  };

  utterance.onerror = (e) => {
    console.warn('Queue item speech error:', e);
    item.options?.onError?.(e);
    item.options?.onEnd?.();
    playNextInQueue(onQueueComplete);
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  speechQueue = [];
  isQueuePlaying = false;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking || isQueuePlaying;
}

/**
 * Speech Recognition (STT) for Indonesian voice input
 */
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError?.(event);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (err) {
    console.warn('Failed to initialize SpeechRecognition:', err);
    return null;
  }
}

