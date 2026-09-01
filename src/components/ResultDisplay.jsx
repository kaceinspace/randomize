import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

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

export default function ResultDisplay({ mode, names, manyCount, pairs, teamCount }) {
  const [result, setResult] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const spinRef = useRef(null)

  // Reset result when mode or names change
  useEffect(() => { setResult(null) }, [mode, names.length])

  const doRandom = async () => {
    if (names.length === 0) return
    setIsSpinning(true)
    setResult(null)

    const SPIN_DURATION = mode === 'single' ? 1200 : 900

    // Slot machine spinning effect
    await new Promise(r => setTimeout(r, SPIN_DURATION))
    setIsSpinning(false)

    const shuffled = shuffle(names)

    if (mode === 'single') {
      setResult({ type: 'single', value: shuffled[0] })
    } else if (mode === 'double') {
      setResult({ type: 'list', values: shuffled.slice(0, Math.min(2, shuffled.length)) })
    } else if (mode === 'many') {
      const count = Math.min(manyCount, shuffled.length)
      setResult({ type: 'list', values: shuffled.slice(0, count) })
    } else if (mode === 'pair') {
      // pairs is { groupA: [...], groupB: [...] }
      if (!pairs || !pairs.groupA?.length || !pairs.groupB?.length) return
      const sA = shuffle(pairs.groupA)
      const sB = shuffle(pairs.groupB)
      const pairList = sA.map((a, i) => [a, sB[i] ?? '—'])
      setResult({ type: 'pairs', values: pairList })
    } else if (mode === 'team') {
      const count = Math.min(teamCount, shuffled.length)
      const teams = Array.from({ length: count }, () => [])
      shuffled.forEach((name, i) => teams[i % count].push(name))
      setResult({ type: 'teams', values: teams })
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
    else if (result.type === 'teams') text = result.values.map((t, i) => `Tim ${i+1}: ${t.join(', ')}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modeLabels = {
    single: { title: 'Single Random', emoji: '🎯' },
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
    </div>
  )
}
