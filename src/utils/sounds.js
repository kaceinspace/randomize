/**
 * Synth sound effects using Web Audio API
 * No external library needed!
 */

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playOscillator({ freq = 440, type = 'sine', duration = 0.1, gain = 0.3, startFreq, endFreq, delay = 0 }) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.type = type
    const startTime = ctx.currentTime + delay

    if (startFreq && endFreq) {
      osc.frequency.setValueAtTime(startFreq, startTime)
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration)
    } else {
      osc.frequency.setValueAtTime(freq, startTime)
    }

    gainNode.gain.setValueAtTime(gain, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration)
  } catch (e) {
    // Silently fail if audio not supported
  }
}

/** Short click/tick sound during spinning */
export function playTick() {
  playOscillator({ freq: 800, type: 'square', duration: 0.04, gain: 0.15 })
}

/** Smooth spin-up sound */
export function playSpinStart() {
  playOscillator({ startFreq: 200, endFreq: 600, type: 'sawtooth', duration: 0.4, gain: 0.2 })
}

/** Win fanfare — ascending chord */
export function playWin() {
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    playOscillator({ freq, type: 'sine', duration: 0.5, gain: 0.25, delay: i * 0.1 })
  })
}

/** Bracket match pop sound */
export function playPop() {
  playOscillator({ freq: 1200, type: 'sine', duration: 0.12, gain: 0.2 })
  playOscillator({ freq: 900, type: 'sine', duration: 0.08, gain: 0.1, delay: 0.08 })
}

/** Champion fanfare — big dramatic */
export function playChampion() {
  const melody = [
    { freq: 523, delay: 0 },
    { freq: 659, delay: 0.12 },
    { freq: 784, delay: 0.24 },
    { freq: 1047, delay: 0.36 },
    { freq: 1047, delay: 0.54 },
    { freq: 784, delay: 0.66 },
    { freq: 1047, delay: 0.78 },
  ]
  melody.forEach(({ freq, delay }) => {
    playOscillator({ freq, type: 'sine', duration: 0.35, gain: 0.3, delay })
  })
}
