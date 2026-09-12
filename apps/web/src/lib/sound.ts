/**
 * Segnale acustico di fine recupero, generato con Web Audio.
 * Niente file audio: parte immediatamente, pesa zero e non ha problemi di cache.
 * Il suono non e' mai l'unico canale: si accompagna sempre a testo e vibrazione.
 */

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/**
 * iOS consente l'audio solo dopo un gesto dell'utente: si sblocca il contesto
 * al primo tocco, altrimenti il beep di fine recupero resterebbe muto.
 */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(frequency: number, startAt: number, duration: number, gain = 0.18): void {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(0, startAt);
  amp.gain.linearRampToValueAtTime(gain, startAt + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Tre note ascendenti: recupero finito, si torna a lavorare. */
export function playRestFinished(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  tone(660, now, 0.14);
  tone(880, now + 0.16, 0.14);
  tone(1180, now + 0.32, 0.26, 0.22);
}

/** Tic discreto negli ultimi secondi. */
export function playCountdownTick(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(520, ctx.currentTime, 0.06, 0.1);
}

/** Conferma di serie completata. */
export function playSetCompleted(): void {
  const ctx = getContext();
  if (!ctx) return;
  tone(740, ctx.currentTime, 0.09, 0.12);
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Alcuni browser espongono l'API ma la bloccano: non e' un errore.
    }
  }
}
