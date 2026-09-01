import confetti from 'canvas-confetti'

const BRAND_COLORS = ['#1B4FFF', '#FFE600', '#ffffff', '#00C2FF', '#FFAA00']

/** Standard result confetti */
export function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: 0.5, y: 0.55 },
    colors: BRAND_COLORS,
    gravity: 1.1,
    scalar: 1.1,
  })
}

/** Champion mega confetti - two cannons from sides */
export function fireChampionConfetti() {
  // Left cannon
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.65 },
    colors: BRAND_COLORS,
    gravity: 0.9,
  })
  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: BRAND_COLORS,
      gravity: 0.9,
    })
  }, 200)
  // Top burst
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { x: 0.5, y: 0.3 },
      colors: BRAND_COLORS,
      startVelocity: 45,
    })
  }, 400)
}
