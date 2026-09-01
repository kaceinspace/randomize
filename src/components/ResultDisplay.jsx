import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { playTick, playSpinStart, playWin } from '../utils/sounds'
import { fireConfetti } from '../utils/confetti'

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function ResultCard({ name, index, delay = 0 }) {
  return (
    <motion.div
      key={`${name}-${index}`}
      initial={{ rotateX: 90, opacity: 0, y: 20 }}
      animate={{ rotateX: 0, opacity: 1, y: 0 }}
      transition={{
        delay: delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 18
      }}
      className="glass-blue border-2 border-blue-500/40 p-4 flex items-center gap-3 group"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: 'spring', stiffness: 300 }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 border-2 border-blue-400 font-mono font-bold text-sm text-white flex-shrink-0"
      >
        {index + 1}
      </motion.span>
      <span className="font-display font-bold text-lg text-white flex-1">{name}</span>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.3 }}
        className="text-yellow-400 text-xl"
      >
        ✦
      </motion.div>
    </motion.div>
  )
}

function SlotMachine({ isSpinning, value }) {
  return (
    <div className="overflow-hidden h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div
            key="spinning"
            className="font-display font-black text-4xl text-blue-400"
            animate={{ y: [0, -60, 60, 0], opacity: [1, 0, 0, 1] }}
            transition={{ duration: 0.15, repeat: Infinity }}
          >
            ???
          </motion.div>
        ) : value ? (
          <motion.div
            key={value}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="font-display font-black text-4xl text-yellow-400 text-center"
          >
            {value}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="font-mono text-white/25 text-sm"
          >
            — tekan RANDOMIZE —
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SpinnerWheel({ names, rotationDeg }) {
  const colors = ['#1B4FFF', '#0A2ED6', '#00C2FF', '#FFE600', '#D4BF00'];
  const sliceAngle = 360 / (names.length || 1);
  const gradientStops = names.map((_, i) => {
    const c = colors[i % colors.length];
    return `${c} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`;
  }).join(', ');

  return (
    <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-red-500 z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

      {/* Wheel */}
      <motion.div
        animate={{ rotate: rotationDeg }}
        transition={{ duration: 3, ease: [0.15, 0.9, 0.2, 1] }}
        className="w-full h-full rounded-full border-4 border-white/20 shadow-[0_0_15px_rgba(27,79,255,0.4)] overflow-hidden relative"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        {names.map((name, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[50%] h-0 origin-left flex items-center justify-end pr-6"
            style={{
              transform: `translate(0, -50%) rotate(${i * sliceAngle + sliceAngle / 2 - 90}deg)`,
            }}
          >
            <span className="text-white text-[11px] font-bold font-mono uppercase truncate drop-shadow-md max-w-[80%] text-right">
              {name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default function ResultDisplay({ mode, names, manyCount, pairs, teamCount }) {
  const setNames = useStore(s => s.setNames)
  const [result, setResult] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const [rotationDeg, setRotationDeg] = useState(0)
  const [isMaximized, setIsMaximized] = useState(false)
  const spinRef = useRef(null)

  // Reset result when mode or names change (only if not spinning)
  useEffect(() => {
    if (!isSpinning) setResult(null)
  }, [mode, names.length])

  const deleteResult = () => {
    if (!result) return
    let toRemove = []
    if (result.type === 'single') toRemove = [result.value]
    else if (result.type === 'list') toRemove = result.values

    if (toRemove.length > 0) {
      setNames(names.filter(n => !toRemove.includes(n)))
      setResult(null)
    }
  }

  const doRandom = async () => {
    if (names.length === 0) return
    setIsSpinning(true)
    setResult(null)
    playSpinStart()

    const SPIN_DURATION = mode === 'spinner' ? 3000 : (mode === 'single' ? 1200 : 900)

    let winningName = null
    if (mode === 'spinner') {
      const winningIndex = Math.floor(Math.random() * names.length);
      winningName = names[winningIndex];
      const sliceAngle = 360 / names.length;
      const targetAngle = 360 - (winningIndex * sliceAngle + sliceAngle / 2);
      const currentFullRotations = Math.floor(rotationDeg / 360);
      const newRotation = (currentFullRotations + 5) * 360 + targetAngle;
      setRotationDeg(newRotation);
    }

    // Wait for spinning effect
    await new Promise(r => setTimeout(r, SPIN_DURATION))
    setIsSpinning(false)

    if (mode === 'spinner') {
      setResult({ type: 'single', value: winningName })
      playWin()
      fireConfetti()
      setSpinCount(c => c + 1)
      return
    }

    const shuffled = shuffle(names)

    if (mode === 'single') {
      setResult({ type: 'single', value: shuffled[0] })
      playWin()
      fireConfetti()
    } else if (mode === 'double') {
      setResult({ type: 'list', values: shuffled.slice(0, Math.min(2, shuffled.length)) })
      playWin()
      fireConfetti()
    } else if (mode === 'many') {
      const count = Math.min(manyCount, shuffled.length)
      setResult({ type: 'list', values: shuffled.slice(0, count) })
      playWin()
      fireConfetti()
    } else if (mode === 'pair') {
      // pairs is { groupA: [...], groupB: [...] }
      if (!pairs || !pairs.groupA?.length || !pairs.groupB?.length) return
      const sA = shuffle(pairs.groupA)
      const sB = shuffle(pairs.groupB)
      const pairList = sA.map((a, i) => [a, sB[i] ?? '—'])
      setResult({ type: 'pairs', values: pairList })
      playWin()
      fireConfetti()
    } else if (mode === 'team') {
      const count = Math.min(teamCount, shuffled.length)
      const teams = Array.from({ length: count }, () => [])
      shuffled.forEach((name, i) => teams[i % count].push(name))
      setResult({ type: 'teams', values: teams })
      playWin()
      fireConfetti()
    }

    setSpinCount(c => c + 1)
  }

  const canRandom = () => {
    if (names.length === 0) return false
    if (mode === 'pair') return pairs?.groupA?.length > 0 && pairs?.groupB?.length > 0
    return true
  }

  const copyResult = () => {
    if (!result) return
    let text = ''
    if (result.type === 'single') text = result.value
    else if (result.type === 'list') text = result.values.join('\n')
    else if (result.type === 'pairs') text = result.values.map(([a, b]) => `${a} ↔ ${b}`).join('\n')
    else if (result.type === 'teams') text = result.values.map((t, i) => `Tim ${i + 1}: ${t.join(', ')}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modeLabels = {
    single: { title: 'Single Random', emoji: '🎯' },
    spinner: { title: 'Spinner Wheel', emoji: '🎡' },
    double: { title: 'Double Random', emoji: '🎲' },
    many: { title: `Many Random (${Math.min(manyCount, names.length)})`, emoji: '🌀' },
    pair: { title: 'Pair Mode', emoji: '🔗' },
    team: { title: `Team Builder (${teamCount} Tim)`, emoji: '👥' },
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-base uppercase tracking-widest text-white flex items-center gap-2">
            <span>{modeLabels[mode]?.emoji}</span>
            <span>{modeLabels[mode]?.title}</span>
          </h2>
          <p className="text-white/40 text-xs font-mono">Hasil randomisasi</p>
        </div>
        <div className="flex gap-2 items-center">
          {mode === 'spinner' && (
            <motion.button
              onClick={() => setIsMaximized(true)}
              whileTap={{ scale: 0.9 }}
              className="text-xs font-mono border border-blue-400/50 text-blue-400 hover:bg-blue-500/10 px-3 py-1 transition-all"
            >
              ⤢ MAXIMIZE
            </motion.button>
          )}
          {result && (result.type === 'single' || result.type === 'list') && (
            <motion.button
              onClick={deleteResult}
              whileTap={{ scale: 0.9 }}
              className="text-xs font-mono border border-red-500/50 text-red-400 hover:bg-red-500/10 px-3 py-1 transition-all"
            >
              🗑️ HAPUS
            </motion.button>
          )}
          {result && (
            <motion.button
              id="copy-result-btn"
              onClick={copyResult}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              className="text-xs font-mono border border-white/20 hover:border-yellow-400 text-white/60 hover:text-yellow-400 px-3 py-1 transition-all"
            >
              {copied ? '✓ COPIED!' : '⎘ COPY'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Result Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">

        {/* Single mode — big slot machine */}
        {mode === 'single' && (
          <div className="glass border-2 border-white/10 p-6 flex flex-col items-center gap-3">
            <div className="w-full border-2 border-blue-500/30 bg-blue-900/20 p-4 text-center" style={{ minHeight: 80 }}>
              <SlotMachine isSpinning={isSpinning} value={result?.value} />
            </div>
            {result && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-white/30"
              >
                🎉 Selamat! Nama terpilih secara acak.
              </motion.p>
            )}
          </div>
        )}

        {/* Spinner mode */}
        {mode === 'spinner' && (
          <div className="glass border-2 border-white/10 p-6 flex flex-col items-center gap-3 overflow-hidden">
            <SpinnerWheel names={names} rotationDeg={rotationDeg} />
            {result && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="font-display font-black text-2xl text-yellow-400 text-center mt-2"
              >
                🎉 {result.value} 🎉
              </motion.div>
            )}
          </div>
        )}

        {/* Double / Many mode — list cards */}
        {(mode === 'double' || mode === 'many') && (
          <div className="flex flex-col gap-2">
            {isSpinning ? (
              <div className="glass border-2 border-white/10 p-8 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl"
                >
                  🌀
                </motion.div>
              </div>
            ) : result?.values ? (
              result.values.map((name, i) => (
                <ResultCard key={`${name}-${spinCount}`} name={name} index={i} delay={i * 0.1} />
              ))
            ) : (
              <div className="glass border-2 border-white/10 p-8 flex items-center justify-center">
                <p className="font-mono text-white/25 text-sm">— tekan RANDOMIZE —</p>
              </div>
            )}
          </div>
        )}

        {/* Pair mode */}
        {mode === 'pair' && (
          <div className="flex flex-col gap-2">
            {isSpinning ? (
              <div className="glass border-2 border-white/10 p-8 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="text-4xl">🔗</motion.div>
              </div>
            ) : result?.values ? (
              result.values.map(([a, b], i) => (
                <motion.div
                  key={`${a}-${b}-${spinCount}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                  className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center"
                >
                  <div className="glass-blue border border-blue-400/40 p-3 text-center">
                    <p className="text-xs text-blue-300/60 font-mono mb-1">A</p>
                    <p className="font-bold text-white text-sm">{a}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08 + 0.2, type: 'spring', stiffness: 300 }}
                    className="font-mono text-yellow-400 font-black text-xl text-center"
                  >
                    ↔
                  </motion.div>
                  <div className="glass-yellow border border-yellow-400/40 p-3 text-center">
                    <p className="text-xs text-yellow-300/60 font-mono mb-1">B</p>
                    <p className="font-bold text-white text-sm">{b}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass border-2 border-white/10 p-8 flex items-center justify-center">
                <p className="font-mono text-white/25 text-sm text-center">Isi kelompok A & B dulu,<br />lalu tekan RANDOMIZE</p>
              </div>
            )}
          </div>
        )}

        {/* Team mode */}
        {mode === 'team' && (
          <div className="grid grid-cols-2 gap-2">
            {isSpinning ? (
              <div className="col-span-2 glass border-2 border-white/10 p-8 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="text-4xl">👥</motion.div>
              </div>
            ) : result?.values ? (
              result.values.map((team, i) => (
                <motion.div
                  key={`team-${i}-${spinCount}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                  className={`glass border-2 p-3 ${i % 2 === 0 ? 'border-blue-400/30' : 'border-yellow-400/30'}`}
                >
                  <div className={`font-display font-bold text-sm uppercase mb-2 ${i % 2 === 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    Tim {i + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    {team.map((name, j) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 + j * 0.05 }}
                        className="text-sm text-white font-medium flex items-center gap-2"
                      >
                        <span className="w-4 h-4 flex items-center justify-center bg-white/10 text-xs font-mono">{j + 1}</span>
                        {name}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 glass border-2 border-white/10 p-8 flex items-center justify-center">
                <p className="font-mono text-white/25 text-sm">— tekan RANDOMIZE —</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Randomize Button */}
      <motion.button
        id="randomize-btn"
        onClick={doRandom}
        disabled={!canRandom() || isSpinning}
        whileHover={canRandom() && !isSpinning ? { scale: 1.02, y: -2 } : {}}
        whileTap={canRandom() && !isSpinning ? { scale: 0.98, y: 2 } : {}}
        className={`
          relative w-full py-4 font-display font-black text-lg uppercase tracking-widest
          border-3 transition-all overflow-hidden
          ${canRandom() && !isSpinning
            ? 'bg-brute-blue border-white text-white shadow-[5px_5px_0px_#FFE600] hover:shadow-[7px_7px_0px_#FFE600] cursor-pointer'
            : 'bg-white/5 border-white/20 text-white/30 cursor-not-allowed shadow-none'
          }
        `}
      >
        {/* Shimmer */}
        {canRandom() && !isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isSpinning ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>🎲</motion.span>
              Randomizing...
            </>
          ) : (
            <>🎲 RANDOMIZE!</>
          )}
        </span>
      </motion.button>

      {!canRandom() && !isSpinning && names.length === 0 && (
        <p className="text-center text-xs font-mono text-white/30">
          Tambah nama dulu di panel kiri!
        </p>
      )}

      {/* Maximize Overlay for Spinner */}
      <AnimatePresence>
        {mode === 'spinner' && isMaximized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
            <button
              onClick={() => setIsMaximized(false)}
              className="absolute top-8 right-8 text-white/50 hover:text-white text-4xl hover:scale-110 transition-transform"
            >
              ×
            </button>

            <div className="flex-1 w-full flex flex-col items-center justify-center max-w-3xl">
              {/* Giant Spinner */}
              <div className="transform scale-[1.3] md:scale-[1.8] mb-16 md:mb-24">
                <SpinnerWheel names={names} rotationDeg={rotationDeg} />
              </div>

              <div className="h-32 flex items-center justify-center w-full mb-4">
                {result && !isSpinning ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="font-display font-black text-5xl md:text-7xl text-yellow-400 text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                  >
                    🎉 {result.value} 🎉
                  </motion.div>
                ) : null}
              </div>

              <div className="w-full max-w-md flex flex-col gap-4 relative z-20">
                {/* Re-use randomize button */}
                <motion.button
                  onClick={doRandom}
                  disabled={!canRandom() || isSpinning}
                  whileHover={canRandom() && !isSpinning ? { scale: 1.05 } : {}}
                  whileTap={canRandom() && !isSpinning ? { scale: 0.95 } : {}}
                  className={`
                      w-full py-5 font-display font-black text-2xl uppercase tracking-widest
                      border-4 transition-all
                      ${canRandom() && !isSpinning
                      ? 'bg-brute-blue border-white text-white shadow-[8px_8px_0px_#FFE600]'
                      : 'bg-white/5 border-white/20 text-white/30 cursor-not-allowed'
                    }
                    `}
                >
                  {isSpinning ? 'SPINNING...' : '🎲 RANDOMIZE!'}
                </motion.button>

                {result && !isSpinning && (
                  <button
                    onClick={deleteResult}
                    className="w-full py-4 font-mono font-bold text-red-400 border-2 border-red-500/50 hover:bg-red-500/20 hover:border-red-400 transition-all uppercase"
                  >
                    🗑️ Hapus "{result.value}" dari daftar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
