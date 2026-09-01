import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import NameInput from './components/NameInput'
import ModeSelector from './components/ModeSelector'
import ResultDisplay from './components/ResultDisplay'
import PairMode from './components/PairMode'
import ManyRandomConfig from './components/ManyRandomConfig'
import TeamBuilderConfig from './components/TeamBuilderConfig'
import TournamentMode from './components/TournamentMode'

const FLOATING_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 6 + 4,
  delay: Math.random() * 4,
  shape: i % 3 === 0 ? '◆' : i % 3 === 1 ? '●' : '▲',
}))

export default function App() {
  const {
    names, setNames,
    activeMode, setActiveMode,
    manyCount, setManyCount,
    teamCount, setTeamCount,
    pairs, setPairs
  } = useStore()

  const modeName = {
    single: 'Single Random', spinner: 'Spinner Wheel', double: 'Double Random',
    many: 'Many Random', pair: 'Pair Mode', team: 'Team Builder', tournament: 'Turnamen',
  }

  return (
    <div className="min-h-screen grid-bg noise-overlay relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-yellow-500/5 blur-[100px]" />
      </div>

      {/* Floating particles */}
      {FLOATING_PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="fixed pointer-events-none select-none font-mono text-white/[0.06]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size * 3 }}
          animate={{ y: [0, -20, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {p.shape}
        </motion.div>
      ))}

      {/* Main Container */}
      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-6 min-h-screen flex flex-col">

        {/* ===== HEADER ===== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-6"
        >
          <div className="glass border-2 border-white/10 px-6 py-4 flex items-center justify-between shadow-[6px_6px_0px_#1B4FFF]">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl"
              >
                🎲
              </motion.div>
              <div>
                <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight">
                  <span className="text-white">Rando</span>
                  <span className="text-yellow-400">Mizen</span>
                </h1>
                <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Name Generator</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 glass border border-white/10 px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-mono text-xs text-white/50">
                  {names.length} nama
                </span>
              </div>
              <div className="glass border border-white/10 px-3 py-1.5">
                <span className="font-mono text-xs text-blue-400 font-bold uppercase">
                  {modeName[activeMode]}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ===== BENTO GRID MAIN LAYOUT ===== */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 min-h-0">

          {/* ===== LEFT PANEL — Name Input ===== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
            className="glass border-2 border-white/10 p-4 flex flex-col shadow-[5px_5px_0px_#1B4FFF] min-h-[400px] lg:min-h-0"
          >
            {/* Panel label */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
              <div className="w-3 h-3 bg-blue-500 border border-blue-400" />
              <span className="font-mono text-xs text-blue-400 uppercase tracking-widest font-bold">Panel Nama</span>
            </div>
            <div className="flex-1 min-h-0">
              <NameInput names={names} onNamesChange={setNames} />
            </div>
          </motion.div>

          {/* ===== CENTER PANEL — Result + Config ===== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="flex flex-col gap-4"
          >
            {/* Config panel - appears for certain modes */}
            <AnimatePresence>
              {(activeMode === 'many' || activeMode === 'team' || activeMode === 'pair' || activeMode === 'tournament') && (
                <motion.div
                  key="config-panel"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  className="glass border-2 border-yellow-400/25 p-4 shadow-[4px_4px_0px_#FFE600] overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <div className="w-3 h-3 bg-yellow-400 border border-yellow-300" />
                    <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest font-bold">
                      {activeMode === 'many' ? 'Konfigurasi Many' :
                        activeMode === 'team' ? 'Konfigurasi Tim' :
                          activeMode === 'pair' ? 'Setup Pasangan' :
                            'Bracket Turnamen'}
                    </span>
                  </div>
                  {activeMode === 'many' && (
                    <ManyRandomConfig count={manyCount} max={names.length} onChange={setManyCount} />
                  )}
                  {activeMode === 'team' && (
                    <TeamBuilderConfig teamCount={teamCount} max={names.length} onChange={setTeamCount} />
                  )}
                  {activeMode === 'pair' && (
                    <PairMode names={names} pairs={pairs} onPairsChange={setPairs} />
                  )}
                  {activeMode === 'tournament' && (
                    <TournamentMode names={names} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Display — grows to fill */}
            <motion.div
              layout
              className="flex-1 glass border-2 border-white/10 p-4 shadow-[5px_5px_0px_rgba(27,79,255,0.5)] flex flex-col min-h-[350px]"
            >
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-3 h-3 bg-green-400 border border-green-300 animate-pulse" />
                <span className="font-mono text-xs text-green-400 uppercase tracking-widest font-bold">Hasil Random</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResultDisplay
                  mode={activeMode}
                  names={names}
                  manyCount={manyCount}
                  pairs={pairs}
                  teamCount={teamCount}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* ===== RIGHT PANEL — Mode Selector + Stats ===== */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
            className="flex flex-col gap-4"
          >
            {/* Mode Selector */}
            <div className="glass border-2 border-white/10 p-4 shadow-[5px_5px_0px_#FFE600]">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-3 h-3 bg-yellow-400 border border-yellow-300" />
                <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest font-bold">Mode</span>
              </div>
              <ModeSelector activeMode={activeMode} onSelect={setActiveMode} />
            </div>

            {/* Stats Bento */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ y: -3, boxShadow: '5px 5px 0px #1B4FFF' }}
                className="glass border-2 border-blue-400/25 p-3 transition-all"
              >
                <p className="font-mono text-xs text-white/30 uppercase mb-1">Nama</p>
                <motion.p
                  key={names.length}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="font-display font-black text-3xl text-blue-400"
                >
                  {names.length}
                </motion.p>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, boxShadow: '5px 5px 0px #FFE600' }}
                className="glass border-2 border-yellow-400/25 p-3 transition-all"
              >
                <p className="font-mono text-xs text-white/30 uppercase mb-1">Mode</p>
                <p className="font-display font-black text-xl text-yellow-400 leading-tight">
                  {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
                </p>
              </motion.div>
            </div>

            {/* How-to tips card */}
            <div className="glass border-2 border-white/[0.07] p-4 flex-1">
              <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-3">💡 Tips</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: '📋', text: 'Paste banyak nama sekaligus — pisahkan dengan enter atau koma' },
                  { icon: '🎯', text: 'Single: pilih 1 nama dengan animasi slot machine' },
                  { icon: '🎡', text: 'Spinner: putar roda keberuntungan buat milih 1 nama' },
                  { icon: '🎲', text: 'Double: pilih 2 nama sekaligus secara acak' },
                  { icon: '🌀', text: 'Many: atur sendiri berapa nama yang dipilih' },
                  { icon: '🔗', text: 'Pair: pasangkan kelompok A & B satu-per-satu' },
                  { icon: '👥', text: 'Team: bagi semua nama ke N tim secara acak' },
                ].map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    className="flex gap-2 text-xs text-white/40 font-mono leading-relaxed"
                  >
                    <span className="flex-shrink-0">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer branding */}
            <div className="text-center">
              <p className="font-mono text-xs text-white/15">
                Built with ❤️ — RandoMizen v1.0
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
